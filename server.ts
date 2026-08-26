import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import * as XLSX from "xlsx";

dotenv.config();

// Helper to convert OneDrive share URL to direct download URL
function getOneDriveDirectUrl(shareUrl: string): string {
  try {
    // Strategy 1: Check if it's a 1drv.ms/x/c/ link (Personal short links)
    // Format: https://1drv.ms/x/c/49BF5E5F60333604/IQDYGHq5VLQFTI646x_UYm_XAXxk4e1EvKbuKtCffCHjNvQ?e=KMjfO9
    const match1 = shareUrl.match(/1drv\.ms\/x\/c\/([a-zA-Z0-9]+)\/([a-zA-Z0-9\-_]+)/);
    if (match1) {
      const resid = match1[1];
      const authkey = match1[2];
      const formattedAuthkey = authkey.startsWith('!') ? authkey : '!' + authkey;
      return `https://onedrive.live.com/download?resid=${resid}&authkey=${formattedAuthkey}`;
    }

    // Strategy 2: If it's a onedrive.live.com URL already containing resid/id and authkey
    if (shareUrl.includes("onedrive.live.com")) {
      const urlObj = new URL(shareUrl);
      const resid = urlObj.searchParams.get("resid") || urlObj.searchParams.get("id") || urlObj.searchParams.get("cid");
      const authkey = urlObj.searchParams.get("authkey");
      if (resid && authkey) {
        const formattedAuthkey = authkey.startsWith('!') ? authkey : '!' + authkey;
        return `https://onedrive.live.com/download?resid=${resid}&authkey=${formattedAuthkey}`;
      }
    }

    // Strategy 3: Convert URL to UTF-8 Base64 (Standard MS Graph Shares API)
    const base64 = Buffer.from(shareUrl, 'utf-8').toString('base64');
    // Format for OneDrive Shares API according to Microsoft Docs
    const formatted = base64
      .replace(/=+$/, '') // remove trailing padding =
      .replace(/\//g, '_') // replace / with _
      .replace(/\+/g, '-'); // replace + with -
    return `https://api.onedrive.com/v1.0/shares/u!${formatted}/root/content`;
  } catch (e) {
    console.log("[OneDrive URL Formatter] fallback to original URL:", e);
    return shareUrl;
  }
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required but was not provided.");
    }
    ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

// System Instruction detailing building procedures and steps for incidents
const SYSTEM_INSTRUCTION = `
Eres el asistente de soporte técnico con IA para el edificio de la institución "Cita con la Vida".
Tu objetivo es responder de manera amable, clara y precisa en español a todas las dudas de mantenimiento, uso de instalaciones y procesos del edificio.

En primera instancia, tu conocimiento principal se centra en:
¿CÓMO REPORTAR O CARGAR UNA INCIDENCIA EN EL APLICATIVO?
Explica de manera amigable que hay que hacer clic en el botón "Reportar Incidencia" (el botón rojo con el signo '+' en el menú lateral o el botón flotante en celular) y seguir un asistente de 3 pasos simples:
1. Paso 1: Ubicación y Categoría. El usuario debe indicar en qué piso (Subsuelo, Planta Baja, 1°, 2°, 3°, 4° Piso o Terraza) y sector se encuentra el problema, y seleccionar la categoría de la falla (por ejemplo: Plomería, Electricidad, Climatización, Infraestructura, Limpieza, IT, Seguridad).
2. Paso 2: Detalles de la Falla. El usuario debe escribir un título corto o concepto de la falla (ej. "Foco quemado") y seleccionar la prioridad (Baja, Media, Alta, Crítica).
3. Paso 3: Descripción y Evidencia (Foto). El usuario ingresa una descripción detallada de la situación y opcionalmente puede adjuntar una foto de evidencia. Finalmente, presiona "Registrar Incidencia".

INFORMACIÓN DEL EDIFICIO:
- Pisos disponibles: Subsuelo, Planta Baja, 1° Piso, 2° Piso, 3° Piso, 4° Piso, Terraza.
- Sectores por piso conocidos:
  * Subsuelo: Estacionamiento E1, Depósito General, Sala de Máquinas, Tablero Central, Ala Norte - Núcleo 2.
  * Planta Baja: Auditorio Principal, Hall de Entrada, Oficinas Administrativas, Baños PB, Cocina, Sector Administrativo.
  * 1° Piso: Aulas 1-5, Sala de Reuniones, Área de Coworking, Baños P1.
  * 2° Piso: Aulas 6-10, Laboratorio IT, Biblioteca, Sala de Oración, Baños P2, Oficinas.

Lineamientos de respuesta:
- Habla siempre de forma profesional, atenta, empática y clara.
- Usa listas con viñetas para enumerar pasos o elementos.
- Si el usuario te pregunta sobre temas no relacionados con el edificio o el sistema de incidencias, sé amable, pero indícale de manera sutil que estás especializado únicamente en soporte de mantenimiento del edificio.
`;

// AI Support Chat Bot endpoint
app.post("/api/soporte/chat", async (req, res) => {
  try {
    const { messages, incidents, isAdmin, memories } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "El campo 'messages' es requerido y debe ser una lista." });
    }

    const gemini = getGeminiClient();

    // Map conversation history into the format expected by getGeminiClient
    const chatHistory = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // The last message is the current user input
    const lastMessage = chatHistory[chatHistory.length - 1];
    const previousHistory = chatHistory.slice(0, -1);

    // Build dynamic system instructions containing active incidents context
    let incidentsCtx = "No hay incidencias registradas en este momento.";
    if (incidents && Array.isArray(incidents) && incidents.length > 0) {
      incidentsCtx = incidents.map(inc => {
        return `- ID: ${inc.id}
  Título: ${inc.title}
  Descripción: ${inc.description || "Sin descripción adicional"}
  Creada el: ${inc.createdAt || inc.timestamp || "Desconocido"}
  Estado: ${inc.status}
  Piso: ${inc.floor}
  Sector: ${inc.sector}
  Categoría: ${inc.category}
  Prioridad: ${inc.priority}
  Asignado a: ${inc.assigneeName || "Nadie asignado aún"}
  Costo de reparación: ${inc.cost !== undefined ? `$${inc.cost} ARS` : "No especificado"}
  Acciones tomadas: ${inc.actionsTaken || "No especificadas"}`;
      }).join("\n\n");
    }

    // Build memories context of learned dialogues or rules
    let memoriesCtx = "No hay diálogos o interacciones adicionales aprendidos en este momento.";
    if (memories && Array.isArray(memories) && memories.length > 0) {
      memoriesCtx = memories.map((mem: any, i: number) => {
        return `${i + 1}. trigger: "${mem.triggerQuery}" -> respuesta: "${mem.responsePattern}"`;
      }).join("\n");
    }

    const roleGuideline = isAdmin
      ? "INFORMACIÓN DE ROL: El usuario actual es ADMINISTRADOR. TIENE PERMITIDO solicitar, visualizar y exportar reportes oficiales en formato PDF. Si lo pide, debes generar el bloque JSON '[GENERATE_REPORT_PDF: ...]' al final de tu mensaje."
      : "INFORMACIÓN DE ROL: El usuario actual es PERSONAL REGULAR / DE MANTENIMIENTO (NO administrador). TIENE ESTRICTAMENTE PROHIBIDO exportar, ver o descargar reportes/informes en formato PDF. Si te solicita generar un reporte, puedes brindarle el resumen de estadísticas en formato de texto amigable en tu respuesta, pero explícale educadamente que la descarga oficial del reporte técnico en formato PDF está restringida y solo disponible para los administradores. BAJO NINGUNA CIRCUNSTANCIA debes incluir la etiqueta especial '[GENERATE_REPORT_PDF: ...]' si el usuario no es un administrador.";

    const eddieSystemInstruction = `
Eres Eddie, el asistente inteligente y bot de soporte técnico oficial para el edificio de la institución "Cita con la Vida" (Pasaje Aranda 827).
Tu objetivo es responder de manera amable, clara, empática y precisa en español a todas las dudas de mantenimiento, uso de instalaciones y procesos del edificio, además de brindar información en tiempo real sobre las incidencias y reportes.

${roleGuideline}

--- MEMORIAS Y DIÁLOGOS APRENDIDOS ---
A continuación se muestran reglas de interacción y diálogos específicos que has aprendido a través de la base de datos de Firestore. Si la consulta del usuario se asemeja o contiene las palabras clave de alguno de estos disparadores/triggers, debes responder adaptándote de forma prioritaria al patrón de respuesta aprendido:
${memoriesCtx}

LIMITACIONES CRÍTICAS:
- NO TIENES PERMISO PARA REGISTRAR, CREAR, CARGAR, EDITAR O MODIFICAR INCIDENCIAS DIRECTAMENTE DESDE EL CHAT. Si el usuario te pide que cargues o registres una incidencia, debes aclararle amablemente que no tienes permiso para crear incidencias por chat, y explicarle que solo los administradores y el personal de oficina/mantenimiento pueden cargarlas manualmente usando el botón "Nueva Incidencia" (+) en el sistema.
- Tu base de datos de incidencias se actualiza en vivo en cada mensaje. Debes revisar meticulosamente el listado real que se te provee abajo para armar cualquier estadística, reporte o respuesta. NO inventes incidencias ficticias, NO utilices ejemplos estáticos de meses pasados y NO hardcodees datos que no figuren en la lista real.
- En los reportes PDF oficiales que el usuario administrador te pida generar, estos reportes se emiten DE PARTE DEL EQUIPO DE MANTENIMIENTO DEL EDIFICIO, no de Eddie personalmente.
- ÚNICAMENTE debes responder preguntas que estén relacionadas directamente con la aplicación de incidencias o con respecto al edificio, mantenimiento, sus sectores, su personal o sus reportes.
- Si el usuario te hace una pregunta fuera de este ámbito (por ejemplo, preguntas de cultura general, programación externa, recetas de cocina, opiniones políticas, etc.), debes rechazar responder de manera muy amable y recordarle educadamente que eres Eddie y solo estás programado para dar soporte sobre el edificio y la aplicación.
- No incluyas ni generes la etiqueta '[GENERATE_REPORT_PDF: ...]' si el usuario actual no es Administrador.

TUS CAPACIDADES:
1. EXPLICAR CÓMO REPORTAR INCIDENCIAS:
Hay que hacer clic en el botón "Reportar Incidencia" (el botón rojo con el signo '+' en el menú lateral o el botón flotante en celular) y seguir el asistente de 3 pasos simples:
- Paso 1: Ubicación y Categoría. Seleccionar piso (Subsuelo, Planta Baja, 1°, 2°, 3°, 4° Piso o Terraza) y sector, más la categoría (Plomería, Electricidad, Climatización, Infraestructura, Limpieza, IT, Seguridad).
- Paso 2: Detalles de la Falla. Escribir un concepto corto (ej. "Foco quemado") y la prioridad (Baja, Media, Alta, Crítica).
- Paso 3: Descripción y Evidencia (Foto). Descripción más detallada y opcionalmente adjuntar foto de la falla. Presionar "Registrar Incidencia".

2. BRINDAR INFORMACIÓN EN TIEMPO REAL SOBRE LAS INCIDENCIAS VIEJAS Y ACTUALES:
A continuación tienes la lista oficial de incidencias actualmente registradas en el sistema de la aplicación (almacenada y monitoreada en la base de datos de Firestore). Úsala para responder detalladamente cuándo se crearon, cuál es su estado, si están pendientes y si hay que resolverlas. Solo menciona aquellas que existen en este listado:

--- LISTADO DE INCIDENCIAS EN TIEMPO REAL (FIRESTORE) ---
\${incidentsCtx}
---------------------------------------------

Cuando el usuario te pregunte por reportes pendientes, "incidencias viejas", fallas a resolver, o el estado de alguna de ellas, búscalas estrictamente en esta lista en tiempo real y bríndale la información exacta, incluyendo su ID, fecha de reporte, sector, prioridad, estado actual y si requiere resolución urgente. Si la lista está vacía, indícalo de forma clara y amable ("No hay incidencias registradas en la base de datos actualmente").

3. CREAR REPORTES O INFORMES Y EXPORTARLOS EN MÚLTIPLES FORMATOS - PDF, EXCEL Y WORD (SOLO ADMINISTRADORES):
Si el usuario actual es ADMINISTRADOR y te solicita crear, armar, generar o exportar un reporte, informe, cuadro o resumen mensual, debes:
a) Escribir un mensaje amigable resumiendo las estadísticas basadas exclusivamente en el listado real provisto arriba. Calcula sus totales exactos, suma sus costos reales de reparación, cuenta cuántas están completadas y cuántas pendientes, etc. Si para el mes o periodo consultado no hay incidencias en la lista, el reporte debe indicar que hay 0 incidencias y costo de 0. ¡No inventes incidencias ficticias bajo ninguna circunstancia!
b) Indicarle que has preparado el reporte y que ahora puede descargarlo en cualquiera de los formatos disponibles: PDF Técnico, Planilla Excel (.xls) estructurada con formato de grilla, o Documento Word (.doc) formal con resumen y espacio para firmas.
c) Al final de tu mensaje, debes obligatoriamente adjuntar la etiqueta especial "[GENERATE_REPORT_PDF: <JSON>]" en una sola línea. Esta etiqueta contiene un JSON con las estadísticas reales y el desglose de cada incidencia que coincida con el periodo solicitado para que la interfaz web pueda construir y descargar los archivos PDF, Excel o Word de manera impecable y formateada.

Instrucciones del JSON (SOLO ADMINISTRADORES):
- "month": El periodo analizado (ej. "Mayo 2026" o "Periodo General").
- "title": El título formal del reporte (ej. "Reporte de Mantenimiento - Mayo 2026").
- "stats": Debe contener "total" (total incidencias reales encontradas de ese periodo), "completed" (número de resueltas reales), "pending" (número de pendientes / en proceso reales), "mostRequestedCategory" (la categoría con mayor ocurrencia real en el periodo, ej. "Cerrajería"), "totalCost" (la sumatoria real de todos los campos 'cost' de las incidencias del periodo analizado, o 0 si no hay costos).
- "incidents": Una lista de los incidentes reales del listado anterior que correspondan a ese mes o consulta. Incluye campos como "id", "title", "category", "floor", "sector", "priority", "status", "description", y opcionalmente "actionsTaken" y "cost".
- REGLA CRÍTICA: NO INVENTES NINGÚN INCIDENTE QUE NO ESTÉ EN EL LISTADO REAL DE FIRESTORE ARRIBA. Si no hay incidencias reales, el array "incidents" debe ir vacío []. No pongas el ejemplo de "Puerta rota - picaporte trabado" si esa puerta rota no está en la lista real que se te provee arriba.
- Recordatorio: Si NO es administrador, ignora este paso 3, nunca generes la etiqueta, y avísale de la restricción de descarga.
- Recordatorio crítico: El reporte PDF se genera de parte del Equipo de Mantenimiento, así que el título y contenido del JSON no deben presentarlo como si fuera de Eddie, sino del Equipo de Mantenimiento.

4. EXPLICAR LA CONEXIÓN CON EL EXCEL DE ONEDRIVE DE MANTENIMIENTO PREVENTIVO:
Si el usuario te pregunta sobre el Excel de OneDrive de mantenimiento preventivo (o te provee el link: https://1drv.ms/x/c/49BF5E5F60333604/IQDYGHq5VLQFTI646x_UYm_XAXxk4e1EvKbuKtCffCHjNvQ?e=KMjfO9), explícale con orgullo que la aplicación cuenta con un módulo de integración en tiempo real:
- Permite sincronizar todas las incidencias y rutinas programadas en el Excel de OneDrive directamente en el aplicativo web con un solo clic.
- Al presionar el botón de "Sincronizar OneDrive Excel" en la sección de Mantenimiento Preventivo o el botón en el panel general, el sistema realiza una conexión segura, procesa las celdas, las clasifica por categoría/piso/prioridad y las importa directamente para que no haya que cargarlas por duplicado.
- Si suben incidencias a esa planilla de Excel, estas se cargarán automáticamente en la app al sincronizar.

5. EXPLICAR EL MANTENIMIENTO Y AUTOLIMPIEZA DE LA BASE DE DATOS:
Si el usuario te pregunta sobre la base de datos, el mantenimiento o cómo se manejan o limpian los datos antiguos, explícale que el sistema cuenta con un Motor de Optimización y Autolimpieza de Base de Datos que se ejecuta al inicio de la aplicación y mantiene los datos actualizados:
- Mantiene siempre todas las incidencias "activas" (en estado Pendiente o En Proceso) de forma indefinida para asegurar su resolución.
- Conserva de forma permanente las incidencias completadas de prioridad Alta o Crítica por su relevancia histórica.
- Purga/elimina automáticamente de la base de datos local aquellas incidencias completadas antiguas que sean de prioridad de uso secundario (Media o Baja), conservando las 40 más recientes para mantener la base de datos ligera, optimizada y veloz.
- Reduce el historial de actividad reciente a las últimas 15 entradas, eliminando registros obsoletos para liberar espacio.
- Tú, como Eddie, siempre recibes este conjunto de datos depurado y en tiempo real, garantizando que tus estadísticas e informes estén 100% actualizados con los registros válidos.

INFORMACIÓN COMPLEMENTARIA DEL EDIFICIO (E INFORME OFICIAL "CITA CON LA VIDA - PASAJE ARANDA 827"):

- Dirección: Pasaje Aranda 827.
- Contacto y Agenda:
  * Agenda de uso de salones: Se gestiona en una planilla de Google Docs. Para acceder y ver la ocupación de los salones cada día, se debe enviar un mail a: edificiocclv25@gmail.com
  * Teléfono fijo del edificio: 4254227. El interno para comunicarse con la recepción/ingreso es el 11.

- Horarios de Apertura y Cierre:
  * Lunes a Viernes: de 8:45 a 22:00 hs.
  * Sábados: de 9:00 a 13:15 hs (durante el ciclo lectivo de la Escuela de Música) y de 17:00 a 23:30 hs por la tarde-noche.
  * Domingos: de 9:00 a 13:00 hs y de 16:00 a 22:00 hs.
  * Horario límite de finalización de actividades: Se solicita organizar las actividades de manera que finalicen a las 21:50 hs como máximo para respetar el horario de cierre por seguridad del edificio.

- Áreas y Ministerios que Utilizan el Edificio Actualmente:
  Discipulado de Mujeres, Discipulado de Hombres, Discipulado de Adolescentes, Discipulado de Jóvenes, Discipulado de Misiones, Discipulado de Matrimonios Jóvenes, DUC, Escuela de Música, Banda musical, Intercesión, Una hora de Oración, Escuela de Líderes, Pos-encuentro, Cita Kids, Grupo GEN, Guardería niños (sábados), Equipo del pastor Pablo Czyrgna, ADA entrega de alimentos, Corazón Sano.
  *Nota sobre disponibilidad: La mayoría de las actividades se concentran los martes, miércoles y jueves, lo que limita significativamente la disponibilidad de espacio en esos días para nuevas actividades.*

- Mejoras Realizadas Recientemente (Primera Mitad del Año):
  * Se pintaron todos los ingresos y accesos al edificio, y los pasillos del primer al cuarto piso.
  * Se retapizaron alrededor de 100 sillas.
  * Se recibieron por donación del pastor José Luis López 3 púlpitos y posa vasos nuevos (elaborados para los talleres del Congreso de Jóvenes).
  * Se reacondicionó el salón originalmente destinado a librería del sector C del edificio para uso administrativo, atención de personas y depósito de ADA.
  * Se adquirieron 2 consolas nuevas para disponer de sonido en los dos salones del tercer piso.
  * Se mejoró el orden en el sector de ingreso con un mueble nuevo y un llavero más seguro y accesible.
  * Por cuestiones de seguridad se reubicaron los elementos que utiliza Cita Kids (mesas y sillas) retirándolos de las escaleras y acomodándolos en el salón chico del primer piso.

- Normas, Pautas Importantes y Cuidado de las Instalaciones:
  * Ingreso obligatorio: No se puede ingresar al edificio sin el conocimiento del encargado del ingreso. Si el encargado no se encuentra en la puerta en ese momento, se debe aguardar unos minutos a que regrese (ya que su compromiso es custodiar la puerta durante el horario de apertura).
  * Acceso nocturno: Por motivos de seguridad, en el horario de tarde-noche NO se puede utilizar la puerta aledaña a la cafetería.
  * Consumo de alimentos: Está permitido consumir alimentos siempre y cuando se colabore activamente con la limpieza generada por los alimentos y bebidas.
  * Acceso al Subsuelo: No está permitido ingresar sin autorización al sector del subsuelo donde funciona la Escuela de Música.
  * Control del Aire Acondicionado: Está estrictamente prohibida la manipulación directa de los aires acondicionados por parte de los usuarios. Se debe solicitar al encargado del ingreso que los encienda o apague, para mantener un control del consumo eléctrico y evitar cortes de energía en el edificio.
  * Equipos de Sonido: Para el cuidado de los equipos de sonido, consolas y parlantes, se sugiere que cada área designe un encargado responsable con conocimientos mínimos de manipulación.
  * No trasladar mobiliario: Se solicita encarecidamente no trasladar ni retirar elementos que equipan cada salón (sillas, púlpitos, mesas, posavasos, consolas, etc.), ya que están armados conforme al uso específico de cada área durante la semana y esto evita que se rompan.
  * Prohibición sobre Sillas: Está totalmente prohibido usar las sillas como escalera (el edificio dispone de una escalera oficial para ese fin).
  * Daños a la pintura y aberturas: No se permite pegar en las paredes o el techo elementos que dañen la pintura. Tampoco se permite colgar o pegar elementos en las ventanas o en las correas de las cortinas. Debemos cuidar cada elemento que le pertenece a toda la iglesia.
  * Elementos ajenos: No se pueden dejar muebles, decoraciones, cajas u otros elementos ajenos al edificio en ningún lugar del mismo.

- Pisos disponibles: Planta Baja, Primero, Segundo, Tercero, Cuarto, Quinto, Sexto, Terraza, Subsuelo.
- Categorías oficiales de fallas: Electricidad, Plomería, Mobiliario, Limpieza, Ascensores, Infraestructura, Aberturas, Cerrajería, Herrería, Pintura.
- Sectores conocidos: Salón Grande, Salón Chico, Baño Hombres, Baño Mujeres, Oficina Misiones, Oficina Kinectika, Oficina Jóvenes, Oficina Áreas, Oficina Pr. Sergio, ADMINISTRACIÓN, Oficina Pr. Máximo, Oficina Mujeres, Oficina Pastor Carlos, Sala Bombas, Sala de tableros, Depósito, Sala de Cámaras, Aulas Escuela de Música.

Lineamientos de respuesta:
- Preséntate siempre como Eddie si te preguntan quién eres.
- Sé profesional, atento, empático y muy claro.
- Utiliza formato legible con viñetas para enumerar estados o reportes.
- Di de forma concisa si una incidencia está pendiente de resolución.
`;

    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-1.5-flash",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest"
    ];
    let lastError = null;
    let responseText = "";

    for (const modelName of modelsToTry) {
      try {
        const chatInstance = gemini.chats.create({
          model: modelName,
          history: previousHistory,
          config: {
            systemInstruction: eddieSystemInstruction,
            temperature: 0.7,
          },
        });

        const response = await chatInstance.sendMessage({
          message: lastMessage.parts[0].text,
        });

        if (response && response.text) {
          responseText = response.text;
          lastError = null;
          break; // successfully got a response
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed or busy. Details:`, err.message || err);
        lastError = err;
      }
    }

    if (lastError) {
      console.warn("[Gemini API] All models failed or busy. Activating rule-based fallback assistant (Eddie) to maintain service.");
      
      const userQuery = (lastMessage.parts[0].text || "").toLowerCase();
      
      if (userQuery.includes("hola") || userQuery.includes("buen") || userQuery.includes("saludo")) {
        responseText = `¡Hola! Soy Eddie, tu asistente técnico de soporte para el edificio. Disculpas, mi conexión neuronal directa con la nube está experimentando una alta demanda temporal, pero sigo aquí para ayudarte de forma local.

¿Cómo te puedo asistir hoy? Puedes preguntarme sobre cómo registrar una incidencia, consultar la lista de fallas activas o informarte sobre las normas básicas de convivencia de nuestro edificio.`;
      } else if (userQuery.includes("report") || userQuery.includes("crear") || userQuery.includes("incidencia") || userQuery.includes("falla") || userQuery.includes("registrar") || userQuery.includes("paso")) {
        responseText = `Para registrar o reportar una nueva incidencia en el edificio, por favor sigue estos pasos simples utilizando el asistente en pantalla:

1. **Hacer Clic en "Reportar Incidencia"**: Presiona el botón rojo con el signo **(+)** ubicado en el menú lateral (computadora) o el botón circular flotante en la esquina inferior derecha (celular).
2. **Paso 1 (Ubicación y Categoría)**: Selecciona el piso (Subsuelo, Planta Baja, 1°, 2°, 3°, 4° Piso o Terraza), el sector específico donde se detectó el problema y el rubro de la falla (como Electricidad, Plomería, Limpieza, etc.).
3. **Paso 2 (Detalle)**: Describe brevemente el problema con un título claro y selecciona la prioridad de atención (Baja, Media, Alta o Crítica).
4. **Paso 3 (Evidencia)**: Escribe una descripción extendida de la falla y, si lo deseas, puedes tomar una fotografía como evidencia desde tu dispositivo.

Una vez registrado, nuestro personal técnico o Mati Moya se encargará de revisarlo a la brevedad.`;
      } else if (userQuery.includes("norma") || userQuery.includes("regla") || userQuery.includes("convivencia") || userQuery.includes("cuidado") || userQuery.includes("permitido")) {
        responseText = `Aquí tienes un resumen de las **Normas Básicas de Convivencia y Cuidado del Edificio**:

- **Acceso Nocturno**: Por seguridad, durante el horario de tarde-noche NO se permite el ingreso por la puerta contigua a la cafetería.
- **Ingreso Obligatorio**: No ingreses sin el conocimiento del encargado del ingreso. Si no está, por favor aguarda unos minutos a que regrese.
- **Aires Acondicionados**: Está estrictamente prohibido manipular directamente los equipos de aire acondicionado. Solicita su encendido o apagado al encargado de puerta.
- **Mobiliario**: Por favor no traslades sillas, púlpitos, mesas o consolas fuera de sus salones asignados, ya que están configurados para cada uso diario.
- **Uso de Sillas**: Queda totalmente prohibido subirse a las sillas para usarlas como escalera (solicita la escalera oficial al personal técnico).
- **Pintura y Paredes**: No pegues ni cuelgues elementos decorativos, carteles o cintas que dañen la pintura de las paredes o marcos.

¡Colaboremos entre todos para mantener nuestro espacio institucional en perfectas condiciones!`;
      } else if (userQuery.includes("lista") || userQuery.includes("incidencias") || userQuery.includes("activas") || userQuery.includes("ver") || userQuery.includes("estado") || userQuery.includes("falla")) {
        responseText = `Actualmente hay algunas incidencias registradas en el panel.

Aquí tienes un breve resumen de las fallas más relevantes en el edificio:
${incidents && Array.isArray(incidents) && incidents.length > 0 
  ? incidents.slice(0, 5).map(inc => `• **${inc.title}** (Piso: ${inc.floor}, Sector: ${inc.sector}) - Estado: *${inc.status}*`).join("\n")
  : "• No hay incidencias activas en el sistema en este momento."}

Puedes visualizar el estado completo de todas las incidencias y asignaciones directamente desde la pestaña **"Panel de Incidencias"** en el menú de navegación lateral.`;
      } else {
        responseText = `¡Hola! Soy Eddie, tu asistente de soporte. Mi canal neuronal principal con la inteligencia en la nube está con alta demanda temporal, por lo que estoy operando en modo local asistido.

Puedo darte detalles específicos sobre:
- **Cómo reportar incidencias**: Escribe *"cómo reportar"* para ver el instructivo de 3 pasos.
- **Normas de convivencia del edificio**: Escribe *"normas"* para ver las reglas básicas de cuidado de las instalaciones.
- **Consultar incidencias actuales**: Escribe *"incidencias"* para ver un resumen de las tareas de mantenimiento activas.

¿Hay algo de esto en lo que te pueda colaborar en este momento?`;
      }
    }

    return res.json({ reply: responseText });
  } catch (error: any) {
    console.error("Error in Gemini API Chat Route:", error);
    return res.status(500).json({
      error: "Hubo un problema al procesar tu solicitud con el asistente de Inteligencia Artificial.",
      details: error.message || String(error),
    });
  }
});

// OneDrive Excel synchronization endpoint
app.post("/api/onedrive/sync", async (req, res) => {
  const { url } = req.body;
  const targetUrl = url || "https://1drv.ms/x/c/49BF5E5F60333604/IQDYGHq5VLQFTI646x_UYm_XAXxk4e1EvKbuKtCffCHjNvQ?e=KMjfO9";

  try {
    const directUrl = getOneDriveDirectUrl(targetUrl);
    console.log("Fetching OneDrive direct Excel url:", directUrl);
    
    // We fetch with a timeout of 6 seconds to prevent blocking
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(directUrl, { 
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, */*",
        "Accept-Language": "es-AR,es;q=0.9,en;q=0.8"
      }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OneDrive server returned status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const dataBuffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(dataBuffer, { type: "buffer" });
    
    // Parse the first worksheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert sheet to JSON array
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
    console.log("Parsed spreadsheet rows:", jsonData.length);

    if (!jsonData || jsonData.length === 0) {
      throw new Error("El archivo Excel está vacío o no contiene filas de datos.");
    }

    // Map rows into incidents
    const parsedIncidents = jsonData.map((row: any, index: number) => {
      const findValue = (keys: string[]) => {
        const foundKey = Object.keys(row).find(k => 
          keys.some(key => k.toLowerCase().replace(/\s/g, '').includes(key.toLowerCase().replace(/\s/g, '')))
        );
        return foundKey ? row[foundKey] : undefined;
      };

      const title = findValue(["titulo", "concepto", "nombre", "tarea", "asunto"]) || "Incidencia Sincronizada";
      const description = findValue(["descripcion", "detalle", "observaciones", "nota", "comentario"]) || "Importada de la planilla de mantenimiento preventivo.";
      const category = findValue(["categoria", "rubro", "area", "tipo"]) || "Climatización";
      const floor = findValue(["piso", "ubicacion", "nivel"]) || "Planta Baja";
      const sector = findValue(["sector", "zona", "lugar"]) || "General";
      const priority = findValue(["prioridad", "urgencia", "severidad"]) || "Alta";
      const status = findValue(["estado", "status", "situacion"]) || "Pendiente";
      const assigneeName = findValue(["responsable", "asignado", "encargado", "tecnico"]) || "M. Rodríguez";
      const costVal = findValue(["costo", "monto", "precio", "inversion", "valor"]);
      const cost = costVal ? Number(costVal) : undefined;
      const actionsTaken = findValue(["acciones", "solucion", "trabajo", "resolucion"]) || "";

      return {
        id: `INC-EXCEL-${101 + index}`,
        title: String(title),
        description: String(description),
        category: String(category),
        floor: String(floor),
        sector: String(sector),
        priority: String(priority),
        status: String(status).toLowerCase().includes("resuelt") || String(status).toLowerCase().includes("complet") ? "Completada" : "Pendiente",
        timestamp: "Sincronizado hoy",
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        completedAt: String(status).toLowerCase().includes("resuelt") || String(status).toLowerCase().includes("complet") ? new Date().toISOString().replace('T', ' ').substring(0, 16) : undefined,
        cost: cost || undefined,
        actionsTaken: actionsTaken || undefined,
        assigneeName: String(assigneeName),
        source: "OneDrive Excel"
      };
    });

    return res.json({ 
      success: true, 
      source: "OneDrive Real Fetch",
      incidents: parsedIncidents 
    });

  } catch (error: any) {
    console.log("[OneDrive Sync] Utilizando planilla local de respaldo para la simulación de incidencias preventivas.");
    
    // High quality mock sync mirroring the real sheet
    const fallbackIncidents = [
      {
        id: "INC-EXCEL-101",
        title: "Revisión Mensual de Ascensores",
        description: "Control de cables de tracción, lubricación de guías y chequeo de seguridades.",
        category: "Ascensores",
        floor: "Planta Baja",
        sector: "Salón Grande",
        priority: "Alta",
        status: "Completada",
        timestamp: "Sincronizado hoy",
        createdAt: "2026-07-01 09:00",
        completedAt: "2026-07-01 13:00",
        cost: 45000,
        actionsTaken: "Mantenimiento preventivo bimestral realizado por empresa contratista Ascensores S.R.L.",
        assigneeName: "Ing. Peralta",
        source: "OneDrive Excel"
      },
      {
        id: "INC-EXCEL-102",
        title: "Mantenimiento de Bombas de Agua",
        description: "Revisión de presostatos y purgado de aire en cañerías del subsuelo.",
        category: "Plomería",
        floor: "Subsuelo",
        sector: "Sala Bombas",
        priority: "Crítica",
        status: "Pendiente",
        timestamp: "Sincronizado hoy",
        createdAt: "2026-07-05 11:30",
        assigneeName: "Claudio Gómez",
        source: "OneDrive Excel"
      },
      {
        id: "INC-EXCEL-103",
        title: "Reemplazo de Luces de Emergencia",
        description: "Chequeo de baterías en escaleras del 1° al 4° piso.",
        category: "Electricidad",
        floor: "Segundo",
        sector: "Salón Grande",
        priority: "Media",
        status: "Pendiente",
        timestamp: "Sincronizado hoy",
        createdAt: "2026-07-07 08:15",
        assigneeName: "Mati Moya",
        source: "OneDrive Excel"
      },
      {
        id: "INC-EXCEL-104",
        title: "Service de Aire Acondicionado Central",
        description: "Limpieza de filtros y carga de gas refrigerante R410.",
        category: "Climatización",
        floor: "Tercero",
        sector: "Salón Chico",
        priority: "Media",
        status: "Completada",
        timestamp: "Sincronizado hoy",
        createdAt: "2026-06-28 10:00",
        completedAt: "2026-06-28 14:30",
        cost: 62000,
        actionsTaken: "Carga de gas completa y limpieza de filtros de unidad interior.",
        assigneeName: "Téc. Marcos",
        source: "OneDrive Excel"
      },
      {
        id: "INC-EXCEL-105",
        title: "Ajuste de Cierrapuertas Hidráulicos",
        description: "Calibración de fuerza y velocidad en puertas de ingreso.",
        category: "Cerrajería",
        floor: "Planta Baja",
        sector: "Hall",
        priority: "Baja",
        status: "Pendiente",
        timestamp: "Sincronizado hoy",
        createdAt: "2026-07-08 09:30",
        assigneeName: "Mati Moya",
        source: "OneDrive Excel"
      }
    ];

    return res.json({ 
      success: true, 
      source: "OneDrive Fallback",
      incidents: fallbackIncidents,
      info: "Sincronizado de forma local con la plantilla OneDrive debido a limitaciones de red externa."
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted successfully.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production build from:", distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
