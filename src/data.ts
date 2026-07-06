import { Incident, PreventiveTask, Activity } from './types';

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-1024',
    title: 'Fuga de agua baño',
    description: 'Fuerte goteo constante debajo del lavabo del baño de hombres, generando encharcamiento en el piso.',
    category: 'Plomería',
    floor: '3° Piso',
    sector: 'Baño Hombres',
    priority: 'Alta',
    status: 'Pendiente',
    timestamp: 'Hace 15 min',
    createdAt: '2026-07-06 10:23',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAp7fTxs43yx3hxP2Zi-PKlAbzfR98n5MmCXxDa8ZPgbLyI15FgRClAyy_VkPEoQgUtU36fTeVwbj4NaE69HWnIBCQpD-tpNFLCvViz5jwLO33ZC1F2zqphXV0XrxQ9iUvyeRljFfhG_oIVU8ofnxuhcDcO8nCSwixFJtPpbo7NFZdzakw8AasdIQWDr8IpVRh3rh0X_J_1DuX7UFurxydM_GiVU1GvnOWBAg1AwZDp8C54NxhdDQJ8IkDBjFc18PRCtfnWsqrSJpQ'
  },
  {
    id: 'INC-1023',
    title: 'Falla iluminación pasillo A',
    description: 'Tubos LED parpadeando de manera molesta e intermitente en el pasillo principal del sector administrativo.',
    category: 'Electricidad',
    floor: 'Planta Baja',
    sector: 'Sector Administrativo',
    priority: 'Media',
    status: 'En Proceso',
    timestamp: 'Hace 2 horas',
    createdAt: '2026-07-06 08:38'
  },
  {
    id: 'INC-1022',
    title: 'Revisión aire acondicionado',
    description: 'El equipo del auditorio principal no enfría adecuadamente y emite un soplido constante con vibración excesiva.',
    category: 'Climatización',
    floor: '4° Piso',
    sector: 'Auditorio',
    priority: 'Baja',
    status: 'Pendiente',
    timestamp: 'Hace 5 horas',
    createdAt: '2026-07-06 05:38'
  },
  {
    id: 'INC-1021',
    title: 'Ascensor Principal Bloqueado',
    description: 'El ascensor principal del núcleo norte se bloqueó mecánicamente debido a una activación del sistema de frenado.',
    category: 'Infraestructura',
    floor: 'Subsuelo',
    sector: 'Ala Norte - Núcleo 2',
    priority: 'Crítica',
    status: 'En Proceso',
    timestamp: 'Hace 1 día',
    createdAt: '2026-07-05 10:38',
    assigneeName: 'Ing. Ruiz',
    assigneeAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALTD5bpIoJ6b2hk9t9PjQ8NReezTTfWpI-GXLQR1Olz2UD4SdIIrSt_DYW4MG23gnAgYLD-Xd7cahKYJTV6jyYAX6mH_M19F7FXrVPVkQ2Y5NoxlYLF3ee3oNL3oBMFunWlz-IIsNRk9oZLdoVN2XdjTPiucvA6B-lSl-ew8Z1XI9S26nbI4rUZevOPXuvqNpAk7agK5tEN-y1Ujvvlhrm_LSBlGMBUgq_8Vb4rwH01JOmckEX3ajPaalRqmQAxOB5gRWufnt39dE'
  },
  {
    id: 'INC-1020',
    title: 'Filtración de agua techo oficina',
    description: 'El techo de la oficina del ala norte presenta goteo constante cerca de los equipos de computación.',
    category: 'Plomería',
    floor: '4° Piso',
    sector: 'Oficina Jóvenes',
    priority: 'Alta',
    status: 'Pendiente',
    timestamp: 'Hace 2 días',
    createdAt: '2026-07-04 10:38'
  }
];

export const INITIAL_PREVENTIVE_TASKS: PreventiveTask[] = [
  {
    id: 'PM-101',
    title: 'Revisión Ascensores',
    date: '2026-10-15',
    category: 'Infraestructura',
    floor: 'Todos',
    frequency: 'Mensual',
    assigneeName: 'M. Rodríguez',
    assigneeAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA728MD6rZDv4BH2SQrEjEPhoOMSNNza3I-2HcLA8Ap9LdrPeJmablghS5kXzJO8gLMU8aml0r-WQJWWL_EC_i2cvE6nqivHdkHS6SfAkQiyjXyv3hAK-EThgE3saTgaZ9bIGvvTY-SgjrQ74U85kas6DzltWMpEhUntXiZC_BsCyeDWfSbXoJCGcl11PYNETTmTgqNFMhQqkHdckc1aU8iIi4uWDzz0h15ZCx7jQN8hZZFPqv1Cf-RwMtxL092Y9z4GRdfQLklVnA',
    status: 'Programada'
  },
  {
    id: 'PM-102',
    title: 'Mantenimiento Calderas',
    date: '2026-10-05',
    category: 'Climatización', // HVAC
    floor: 'Subsuelo',
    frequency: 'Trimestral',
    assigneeName: 'J. Pérez',
    assigneeAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALTD5bpIoJ6b2hk9t9PjQ8NReezTTfWpI-GXLQR1Olz2UD4SdIIrSt_DYW4MG23gnAgYLD-Xd7cahKYJTV6jyYAX6mH_M19F7FXrVPVkQ2Y5NoxlYLF3ee3oNL3oBMFunWlz-IIsNRk9oZLdoVN2XdjTPiucvA6B-lSl-ew8Z1XI9S26nbI4rUZevOPXuvqNpAk7agK5tEN-y1Ujvvlhrm_LSBlGMBUgq_8Vb4rwH01JOmckEX3ajPaalRqmQAxOB5gRWufnt39dE',
    status: 'Vencida'
  },
  {
    id: 'PM-103',
    title: 'Sistemas de Red',
    date: '2026-10-20',
    category: 'IT',
    floor: '4° Piso',
    frequency: 'Semanal',
    assigneeName: 'L. Gómez',
    assigneeAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4DBRZ0A_QNrDliXWywRAGgg5E0Rpd9KROOew8MOGhkj2C74DrULj_qbzHsyb8s4gJtqUeEujS9Q6Yk8EZ0VJyCq6HEpHaNRbqho12IYNethb7l84-mPDVG8LKZdGjWThGr84FVxMzngbUQijakLrlJ9y1abBm9fcq77o6VvxnUhqUDdjXghjM7DusLYOqAxjuz_6YzGFERMkBVFYHpdPW7gvU6nKDjfVvQR_JSNjP_mEdYrEI0I5XRo_VmPyo91FHGdm0_IJ11_Y',
    status: 'Programada'
  },
  {
    id: 'PM-104',
    title: 'Limpieza Cisternas',
    date: '2026-10-12',
    category: 'Limpieza',
    floor: 'Terraza',
    frequency: 'Semestral',
    assigneeName: 'M. Rodríguez',
    assigneeAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA728MD6rZDv4BH2SQrEjEPhoOMSNNza3I-2HcLA8Ap9LdrPeJmablghS5kXzJO8gLMU8aml0r-WQJWWL_EC_i2cvE6nqivHdkHS6SfAkQiyjXyv3hAK-EThgE3saTgaZ9bIGvvTY-SgjrQ74U85kas6DzltWMpEhUntXiZC_BsCyeDWfSbXoJCGcl11PYNETTmTgqNFMhQqkHdckc1aU8iIi4uWDzz0h15ZCx7jQN8hZZFPqv1Cf-RwMtxL092Y9z4GRdfQLklVnA',
    status: 'Completada'
  }
];

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'ACT-001',
    type: 'new_incident',
    title: 'Nueva incidencia: Filtración de agua',
    description: '4to Piso - Oficina Jóvenes. El techo presenta goteo constante cerca de los equipos de computación.',
    timestamp: 'Hace 5 min',
    statusText: 'Urgente',
    category: 'Plomería'
  },
  {
    id: 'ACT-002',
    type: 'task_completed',
    title: 'Tarea Finalizada: Cambio luminaria',
    description: 'Subsuelo - Área de Depósito. Se reemplazaron 4 tubos LED por un técnico externo.',
    timestamp: 'Hace 2 horas',
    statusText: 'Completado',
    category: 'Electricidad'
  },
  {
    id: 'ACT-003',
    type: 'status_update',
    title: 'Actualización de Estado',
    description: 'Mantenimiento de Aire Acondicionado en Auditorio Principal pasó a \'En Proceso\'.',
    timestamp: 'Hace 4 horas',
    statusText: 'En Proceso',
    category: 'Climatización'
  }
];

export const FLOORS = [
  'Subsuelo',
  'Planta Baja',
  '1° Piso',
  '2° Piso',
  '3° Piso',
  '4° Piso',
  'Terraza'
];

export const SECTOR_MAP: Record<string, string[]> = {
  'Subsuelo': ['Estacionamiento E1', 'Depósito General', 'Sala de Máquinas', 'Tablero Central', 'Ala Norte - Núcleo 2'],
  'Planta Baja': ['Auditorio Principal', 'Hall de Entrada', 'Oficinas Administrativas', 'Baños PB', 'Cocina', 'Sector Administrativo'],
  '1° Piso': ['Aulas 1-5', 'Sala de Reuniones', 'Área de Coworking', 'Baños P1'],
  '2° Piso': ['Aulas 6-10', 'Laboratorio IT', 'Biblioteca', 'Sala de Oración', 'Baños P2', 'Oficinas'],
  '3° Piso': ['Aulas 11-15', 'Laboratorio Químico', 'Sala de Profesores', 'Baño Hombres', 'Baño Mujeres'],
  '4° Piso': ['Auditorio', 'Oficina Jóvenes', 'Sala de Directivos', 'Baños P4'],
  'Terraza': ['Mantenimiento Tanques', 'Unidades Condensadoras AC', 'Zona Lounge', 'Depósito Limpieza']
};

export const CATEGORIES = [
  'Electricidad',
  'Plomería',
  'Climatización',
  'Limpieza',
  'Seguridad',
  'Infraestructura',
  'IT'
];
