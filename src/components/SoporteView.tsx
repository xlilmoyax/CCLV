import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { 
  Send, 
  Sparkles, 
  User, 
  Trash2, 
  HelpCircle, 
  AlertCircle,
  ArrowRight,
  MessageSquare,
  Wrench,
  Download,
  FileText,
  Compass
} from 'lucide-react';
import { Incident, UserProfile } from '../types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "¿Qué incidencias pendientes o viejas hay para resolver?",
  "¿Cuáles son los pasos para cargar incidencias?",
  "¿Cómo reporto una falla en el edificio?",
  "¿Qué sectores hay en el Subsuelo?",
];

interface SoporteViewProps {
  incidents: Incident[];
  userProfile?: UserProfile | null;
}

export default function SoporteView({ incidents, userProfile }: SoporteViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy **Eddie**, tu asistente inteligente de soporte técnico para el edificio de **Cita con la Vida**.\n\nTe puedo guiar sobre **cómo reportar incidencias**, qué sectores existen por cada piso o consultar el **estado de incidencias viejas o actuales** (cuándo se registraron, su estado y si es necesario resolverlas).\n\n¿En qué te puedo colaborar hoy? Puedes escribir tu consulta o usar alguna de las sugerencias rápidas abajo.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Build simple message history to send to the server API
      const historyPayload = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/soporte/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          messages: historyPayload,
          incidents: incidents,
          isAdmin: !!userProfile?.isAdmin
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al comunicarse con el servidor de IA.');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || 'No obtuve respuesta del asistente.',
        timestamp: new Date()
      }]);
    } catch (err: any) {
      console.error("Chat Bot Error:", err);
      setError(err.message || 'Ocurrió un error inesperado al conectar con la Inteligencia Artificial.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm('¿Desea limpiar el historial de chat con Eddie?')) {
      setMessages([
        {
          role: 'assistant',
          content: '¡Hola de nuevo! He reiniciado nuestra conversación. ¿Tienes alguna pregunta sobre el edificio, incidencias anteriores o cómo reportar una falla?',
          timestamp: new Date()
        }
      ]);
      setError(null);
    }
  };

  // Extract JSON payload from system tag [GENERATE_REPORT_PDF: { ... }]
  const parseReportMessage = (content: string) => {
    const markerStart = '[GENERATE_REPORT_PDF:';
    const markerEnd = ']';
    const startIndex = content.indexOf(markerStart);
    
    if (startIndex === -1) {
      return { cleanContent: content, reportData: null };
    }
    
    const endIndex = content.lastIndexOf(markerEnd);
    if (endIndex === -1 || endIndex < startIndex) {
      return { cleanContent: content, reportData: null };
    }
    
    const cleanContent = (content.substring(0, startIndex) + '\n' + content.substring(endIndex + 1)).trim();
    const jsonStr = content.substring(startIndex + markerStart.length, endIndex).trim();
    
    try {
      const reportData = JSON.parse(jsonStr);
      return { cleanContent, reportData };
    } catch (e) {
      console.error("Failed to parse report JSON:", e);
      return { cleanContent: content, reportData: null };
    }
  };

  // Generate a beautiful, professional, high-fidelity PDF using jsPDF
  const handleDownloadPDF = (reportData: any) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Top header banner in brand primary #7a172c (deep red)
      doc.setFillColor(122, 23, 44);
      doc.rect(0, 0, 210, 38, 'F');
      
      // Header Titles
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("CITA CON LA VIDA", 15, 18);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text("Sistema Inteligente de Gestión de Mantenimiento", 15, 26);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Eddie AI - Reporte Oficial", 145, 26);
      
      // Title of the report
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(reportData.title || `Reporte de Incidencias - ${reportData.month || 'General'}`, 15, 48);
      
      // Metadata line
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(110, 110, 110);
      const currentDate = new Date().toLocaleString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Fecha de Emisión: ${currentDate} | Generado por: Eddie Asistente de IA`, 15, 54);
      
      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.line(15, 58, 195, 58);
      
      // Summary section
      doc.setTextColor(122, 23, 44);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Resumen Estadístico del Periodo", 15, 66);
      
      // Three stylized summary cards (width: 54, 54, 62 mm)
      doc.setFillColor(248, 249, 250);
      doc.setDrawColor(225, 225, 230);
      doc.roundedRect(15, 71, 54, 22, 2, 2, 'FD');
      doc.roundedRect(74, 71, 54, 22, 2, 2, 'FD');
      doc.roundedRect(133, 71, 62, 22, 2, 2, 'FD');
      
      // Column 1
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("TOTAL REPORTADO", 18, 76);
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${reportData.stats.total} incidencias`, 18, 85);
      
      // Column 2
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("RESOLUCIÓN Y ACTIVIDAD", 77, 76);
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`${reportData.stats.completed} Resueltas | ${reportData.stats.pending} Activas`, 77, 85);
      
      // Column 3
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("INVERSIÓN / COSTO TOTAL", 136, 76);
      const totalCostStr = reportData.stats.totalCost > 0
        ? `$${reportData.stats.totalCost.toLocaleString('es-AR')} ARS`
        : "$0 ARS (Sin montos)";
      doc.setTextColor(122, 23, 44);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(totalCostStr, 136, 85);
      
      // Main demand
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(80, 80, 80);
      doc.text("Categoría con mayor demanda en el periodo:", 15, 100);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(122, 23, 44);
      doc.text(` ${reportData.stats.mostRequestedCategory || "Sin Categoría"}`, 85, 100);
      
      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.line(15, 104, 195, 104);
      
      // Incidents Header
      doc.setTextColor(122, 23, 44);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Detalle Analítico de las Incidencias", 15, 112);
      
      let y = 118;
      const incidents = reportData.incidents || [];
      
      incidents.forEach((inc: any) => {
        // Safe room check before starting new box
        if (y > 245) {
          doc.addPage();
          // Put clean mini header on next page
          doc.setFillColor(122, 23, 44);
          doc.rect(0, 0, 210, 15, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(`Anexo - Detalle de Incidencias (${reportData.month || 'Mantenimiento'})`, 15, 10);
          y = 25;
        }
        
        // Incident Box
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(225, 225, 230);
        doc.roundedRect(15, y, 180, 26, 1.5, 1.5, 'FD');
        
        // ID & Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(40, 40, 40);
        doc.text(`${inc.id} - ${inc.title || 'Reporte de Falla'}`, 18, y + 5.5);
        
        // Meta details
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(110, 110, 110);
        doc.text(`Categoría: ${inc.category || 'Varios'} | Ubicación: ${inc.floor || 'N/A'}, ${inc.sector || 'N/A'} | Prioridad: ${inc.priority || 'Media'}`, 18, y + 10.5);
        
        // Status Badge positioning
        const isComp = inc.status === 'Completada' || inc.status === 'Resuelto' || inc.status === 'Resuelta';
        doc.setFillColor(isComp ? 230 : 254, isComp ? 245 : 242, isComp ? 233 : 242);
        doc.roundedRect(148, y + 2, 43, 5, 1, 1, 'F');
        doc.setTextColor(isComp ? 30 : 180, isComp ? 110 : 40, isComp ? 45 : 40);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text(inc.status.toUpperCase(), 153, y + 5.5);
        
        // Description text formatting with safety bounds
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(80, 80, 80);
        const desc = inc.description || "Sin descripción adicional.";
        const descLines = doc.splitTextToSize(desc, 172);
        doc.text(descLines, 18, y + 15.5);
        
        // Actions and Cost subline
        if (inc.actionsTaken || inc.cost) {
          doc.setFont("helvetica", "oblique");
          doc.setFontSize(7.5);
          doc.setTextColor(122, 23, 44);
          let actionText = "";
          if (inc.actionsTaken) actionText += `Acción: ${inc.actionsTaken}. `;
          if (inc.cost) actionText += `[Monto Invertido: $${inc.cost.toLocaleString('es-AR')}]`;
          const actionLines = doc.splitTextToSize(actionText, 172);
          doc.text(actionLines, 18, y + 22);
        }
        
        y += 29;
      });
      
      // Page frame or bottom bar
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setDrawColor(122, 23, 44);
      doc.setLineWidth(0.5);
      doc.line(15, 276, 195, 276);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(140, 140, 140);
      doc.text("Este reporte fue compilado digitalmente por Eddie AI, asistente oficial de Cita con la Vida.", 15, 282);
      doc.text("Página 1 de 1", 185, 282);
      
      const filename = `Reporte_${reportData.month.replace(/\s+/g, '_')}_Mantenimiento_2026.pdf`;
      doc.save(filename);
    } catch (e) {
      console.error("Error generating PDF:", e);
      alert("Hubo un error al generar tu archivo PDF. Por favor reintenta.");
    }
  };

  // Basic Markdown-like formatter for bold text and list bullets
  const formatMessageContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Bold formatter **text** -> <strong>text</strong>
      let formattedLine = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-bold text-primary">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      const hasParts = parts.length > 0;
      const content = hasParts ? parts : line;

      // Unordered lists - list item (bullet)
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const listText = line.trim().substring(2);
        return (
          <li key={index} className="ml-4 list-disc pl-1 my-1 text-xs md:text-sm">
            {hasParts ? parts : listText}
          </li>
        );
      }

      // Ordered lists 1. 2. 3.
      const orderedMatch = line.trim().match(/^(\d+)\.\s(.*)/);
      if (orderedMatch) {
        return (
          <li key={index} className="ml-4 list-decimal pl-1 my-1 text-xs md:text-sm">
            {hasParts ? parts : orderedMatch[2]}
          </li>
        );
      }

      return (
        <p key={index} className="min-h-[1.25rem] text-xs md:text-sm leading-relaxed">
          {content}
        </p>
      );
    });
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-9.5rem)] md:h-[calc(100vh-10.5rem)] bg-slate-50/30 border border-slate-200/80 rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.06)] overflow-hidden backdrop-blur-xs" id="ai-support-container">
      
      {/* Bot Chat Header */}
      <div className="p-4 md:p-5 bg-white border-b border-slate-100 flex justify-between items-center relative z-10 shadow-xs">
        <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7a172c] to-[#9c1f3a] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(122,23,44,0.25)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Sparkles size={19} className="animate-pulse text-rose-100" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center shadow-xs">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-75" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs md:text-sm font-black text-slate-800 tracking-tight">Eddie Assistant</h3>
              <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[9px] font-extrabold rounded-md border border-green-100 uppercase tracking-wider scale-95 origin-left">
                Online
              </span>
              {userProfile?.isAdmin ? (
                <span className="px-2 py-0.5 bg-[#7a172c]/5 text-[#7a172c] text-[9px] font-bold rounded-md border border-[#7a172c]/10 flex items-center gap-1 scale-95 origin-left">
                  <span>🛡️</span> Admin
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-md border border-slate-200/60 flex items-center gap-1 scale-95 origin-left">
                  <span>🏢</span> Personal
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
              <Wrench size={10} className="text-primary/70" />
              Soporte de Mantenimiento &bull; Edificio Central
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleClearChat}
            title="Reiniciar chat con Eddie"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 cursor-pointer active:scale-95"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Main chat messages screen */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-gradient-to-b from-slate-50/50 via-white/20 to-slate-50/30 scroll-smooth">
        
        {/* If there is only the welcome message, show a gorgeous onboarding portal */}
        {messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-6 p-5 md:p-6 bg-white border border-slate-100 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-4 text-center max-w-2xl mx-auto"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#7a172c]/10 text-[#7a172c] flex items-center justify-center mx-auto mb-1">
              <Compass size={24} className="text-[#7a172c] animate-spin" style={{ animationDuration: '20s' }} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-800">¿En qué puedo ayudarte hoy?</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Tengo acceso en tiempo real a todas las incidencias registradas, costos y sectores del edificio central de la institución.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
              <div className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl transition-colors">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="text-base">📋</span> Consultar Incidencias
                </span>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  Revisá qué fallas siguen abiertas, costos reales de reparación y fechas de reporte.
                </p>
              </div>

              <div className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl transition-colors">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="text-base">🏢</span> Sectores del Edificio
                </span>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  Preguntame qué oficinas y áreas se encuentran en cada piso o subsuelo de la institución.
                </p>
              </div>

              <div className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl transition-colors">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="text-base">⚡</span> Procesos de Carga
                </span>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  Consultame cómo crear o modificar un ticket, prioridades y flujos de trabajo recomendados.
                </p>
              </div>

              <div className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl transition-colors">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  {userProfile?.isAdmin ? (
                    <span className="text-green-700 flex items-center gap-1.5">
                      <span className="text-base">📊</span> Exportar PDF <span className="text-[8px] bg-green-100 text-green-800 px-1 rounded-sm uppercase">Habilitado</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="text-base">🔒</span> Exportar PDF <span className="text-[8px] bg-slate-200 text-slate-600 px-1 rounded-sm uppercase">Restringido</span>
                    </span>
                  )}
                </span>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  {userProfile?.isAdmin 
                    ? "Generá resúmenes analíticos del mes y descargalos instantáneamente en formato PDF oficial."
                    : "La exportación técnica formal en PDF está restringida únicamente a personal administrador."}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs select-none transition-transform duration-200 ${
                msg.role === 'user' 
                  ? 'bg-[#7a172c] text-white' 
                  : 'bg-white border border-slate-100 text-[#7a172c]'
              }`}>
                {msg.role === 'user' ? <User size={15} /> : <Sparkles size={15} className="text-primary" />}
              </div>

              {/* Text Bubble */}
              <div className={`p-4 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-1.5 max-w-full transition-all duration-200 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-[#7a172c] to-[#9c1f3a] text-white rounded-tr-none'
                  : 'bg-white border border-slate-100/90 text-slate-800 rounded-tl-none'
              }`}>
                <div className="space-y-1 text-left">
                  {msg.role === 'user' ? (
                    <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed font-medium">{msg.content}</p>
                  ) : (() => {
                    const { cleanContent, reportData } = parseReportMessage(msg.content);
                    return (
                      <div className="space-y-3">
                        <div className="space-y-1.5 text-slate-700 text-xs md:text-sm leading-relaxed">
                          {formatMessageContent(cleanContent)}
                        </div>
                        
                        {reportData && (
                          userProfile?.isAdmin ? (
                            <motion.div 
                              initial={{ scale: 0.97, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="mt-4 overflow-hidden border border-slate-200/90 rounded-2xl flex flex-col gap-0 shadow-sm text-left bg-white"
                            >
                              {/* Report Header */}
                              <div className="p-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-white/10 rounded-lg">
                                    <FileText size={14} className="text-rose-300" />
                                  </div>
                                  <div>
                                    <h4 className="text-[11px] font-black tracking-wide uppercase text-slate-100">Reporte Analítico</h4>
                                    <span className="text-[9px] text-slate-300 font-mono font-medium">{reportData.month || "Mantenimiento"}</span>
                                  </div>
                                </div>
                                <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                  Listo para PDF
                                </span>
                              </div>

                              {/* Report Statistics */}
                              <div className="p-3.5 space-y-3 bg-slate-50/50">
                                <h5 className="text-xs font-bold text-slate-800 truncate">{reportData.title || "Reporte de Mantenimiento"}</h5>
                                
                                <div className="grid grid-cols-3 gap-2 text-center">
                                  <div className="bg-white border border-slate-100 p-2 rounded-xl shadow-3xs">
                                    <span className="text-slate-400 block uppercase text-[7px] font-bold tracking-wider">Resueltas</span>
                                    <span className="font-extrabold text-xs text-emerald-600 block mt-0.5">{reportData.stats.completed}</span>
                                  </div>
                                  <div className="bg-white border border-slate-100 p-2 rounded-xl shadow-3xs">
                                    <span className="text-slate-400 block uppercase text-[7px] font-bold tracking-wider">Activas</span>
                                    <span className="font-extrabold text-xs text-amber-600 block mt-0.5">{reportData.stats.pending}</span>
                                  </div>
                                  <div className="bg-white border border-slate-100 p-2 rounded-xl shadow-3xs">
                                    <span className="text-slate-400 block uppercase text-[7px] font-bold tracking-wider">Inversión</span>
                                    <span className="font-extrabold text-xs text-primary block mt-0.5">${reportData.stats.totalCost.toLocaleString('es-AR')}</span>
                                  </div>
                                </div>

                                <div className="p-2.5 bg-slate-100/50 border border-slate-200/30 rounded-xl flex justify-between items-center text-[10px]">
                                  <span className="text-slate-500 font-medium">Categoría más crítica:</span>
                                  <span className="font-bold text-slate-800 bg-white border border-slate-150 px-2 py-0.5 rounded-md shadow-3xs">
                                    {reportData.stats.mostRequestedCategory || "No Registra"}
                                  </span>
                                </div>

                                <button
                                  onClick={() => handleDownloadPDF(reportData)}
                                  className="w-full py-2 bg-[#7a172c] hover:bg-[#8e1d35] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md cursor-pointer active:scale-[0.99] mt-1"
                                >
                                  <Download size={13} />
                                  <span>Descargar Informe Técnico PDF</span>
                                </button>
                              </div>
                            </motion.div>
                          ) : (
                            <div className="mt-3 p-3.5 bg-red-50/50 border border-red-100 rounded-2xl flex items-start gap-2.5 text-left shadow-3xs">
                              <span className="text-sm select-none shrink-0 p-1.5 bg-red-100/60 text-red-700 rounded-xl">🔒</span>
                              <div className="space-y-1">
                                <h4 className="text-xs font-bold text-red-900">Acceso Técnico Restringido</h4>
                                <p className="text-[10px] text-red-700/90 leading-relaxed font-medium">
                                  La generación y descarga del reporte analítico oficial en PDF requiere permisos de **Administrador**. El bot puede facilitarte las estadísticas resumidas por texto en este chat, pero el archivo firmado formal está bloqueado.
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div className={`text-[8px] font-medium text-right mt-1.5 ${msg.role === 'user' ? 'text-white/70' : 'text-slate-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Thinking/loading state indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 max-w-[80%] mr-auto"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-slate-150 text-[#7a172c] shrink-0 shadow-2xs">
              <Sparkles size={15} className="animate-spin text-primary" />
            </div>
            <div className="p-4 bg-white border border-slate-100 rounded-3xl rounded-tl-none shadow-2xs flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[10px] font-extrabold text-slate-500 ml-1">Eddie está procesando...</span>
            </div>
          </motion.div>
        )}

        {/* Error Notification Bubble */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl flex items-start gap-3 text-xs md:text-sm shadow-3xs"
          >
            <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={17} />
            <div className="space-y-1">
              <p className="font-bold text-rose-900">Error de conexión</p>
              <p className="text-rose-700/95 leading-relaxed text-xs">{error}</p>
              <p className="text-[10px] text-rose-600 mt-2 font-medium">
                Tip: Asegúrate de tener la variable de entorno <strong>GEMINI_API_KEY</strong> cargada en el panel de Ajustes.
              </p>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Section */}
      {messages.length === 1 && !isLoading && (
        <div className="px-4 py-3 bg-white border-t border-slate-100 relative z-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5 pl-1">
            <HelpCircle size={11} className="text-primary/70" /> Sugerencias Rápidas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(sug)}
                className="text-left bg-slate-50 hover:bg-primary/5 text-slate-600 hover:text-primary border border-slate-200/50 hover:border-primary/20 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-3xs active:scale-98 cursor-pointer group"
              >
                <span>{sug}</span>
                <ArrowRight size={11} className="text-slate-400 group-hover:text-primary shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message input panel */}
      <div className="p-4 bg-white border-t border-slate-100 relative z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.01)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex gap-2"
        >
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="Escribe tu consulta para Eddie (ej. ¿cuánto costó la plomería?)..."
              className="w-full bg-slate-50/80 border border-slate-200/80 rounded-2xl pl-4 pr-11 py-3 text-xs md:text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all disabled:opacity-60 placeholder-slate-400 text-slate-700"
            />
            <div className="absolute right-3.5 text-slate-300">
              <MessageSquare size={16} />
            </div>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-11 px-5 rounded-2xl bg-[#7a172c] hover:bg-[#8e1d35] text-white flex items-center justify-center gap-2 font-extrabold text-xs md:text-sm transition-all duration-250 shadow-sm hover:shadow-[0_4px_12px_rgba(122,23,44,0.25)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none cursor-pointer active:scale-95 shrink-0"
          >
            <Send size={14} className="text-rose-100" />
            <span className="hidden sm:inline">Preguntar</span>
          </button>
        </form>
      </div>

    </div>
  );
}
