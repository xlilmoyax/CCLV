import { Incident, PreventiveTask, Activity } from './types';

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-2001',
    title: 'Cerámicos rotos',
    description: 'Cerámicos rotos en el primer piso, sector Salón Grande.',
    category: 'Infraestructura',
    floor: 'Primero',
    sector: 'Salón Grande',
    priority: 'Baja',
    status: 'Completada',
    timestamp: 'Hace 2 meses',
    createdAt: '2026-05-06 09:00',
    completedAt: '2026-05-14 18:00',
    actionsTaken: 'Cambiar cerámico'
  },
  {
    id: 'INC-2002',
    title: 'Cambiar cerradura de puerta 2',
    description: 'Cambiar cerradura de la puerta 2 en el primer piso, sector Salón Grande.',
    category: 'Cerrajería',
    floor: 'Primero',
    sector: 'Salón Grande',
    priority: 'Media',
    status: 'Completada',
    timestamp: 'Hace 1 mes',
    createdAt: '2026-05-14 10:00',
    completedAt: '2026-06-03 16:30',
    actionsTaken: 'Compra de cerradura en ferretería'
  },
  {
    id: 'INC-2003',
    title: 'Cerámicos levantados (Of. Pr. Sergio)',
    description: 'Cerámicos levantados en el cuarto piso, sector Oficina Pr. Sergio.',
    category: 'Infraestructura',
    floor: 'Cuarto',
    sector: 'Oficina Pr. Sergio',
    priority: 'Media',
    status: 'En Proceso',
    timestamp: 'Hace 1 mes',
    createdAt: '2026-05-20 11:15',
    actionsTaken: 'Reemplazo del piso y cerámica (completo)'
  },
  {
    id: 'INC-2004',
    title: 'Rotura de dispensador de toallas',
    description: 'Rotura del dispensador de toallas en el primer piso, sector Baño Hombres.',
    category: 'Mobiliario',
    floor: 'Primero',
    sector: 'Baño Hombres',
    priority: 'Baja',
    status: 'Completada',
    timestamp: 'Hace 1 mes',
    createdAt: '2026-05-20 14:00',
    completedAt: '2026-05-23 17:00',
    actionsTaken: 'Recolocación correcto de soporte'
  },
  {
    id: 'INC-2005',
    title: 'Cerámicos levantados (Of. Misiones)',
    description: 'Cerámicos levantados en el sexto piso, sector Oficina Misiones.',
    category: 'Infraestructura',
    floor: 'Sexto',
    sector: 'Oficina Misiones',
    priority: 'Baja',
    status: 'Completada',
    timestamp: 'Hace 3 semanas',
    createdAt: '2026-05-20 09:30',
    completedAt: '2026-06-15 15:00',
    actionsTaken: 'Recolocación de cerámicos'
  },
  {
    id: 'INC-2006',
    title: 'Mantenimiento de pintura',
    description: 'Mantenimiento de pintura de techo y paredes en el cuarto piso, sector Oficina Pr. Sergio.',
    category: 'Pintura',
    floor: 'Cuarto',
    sector: 'Oficina Pr. Sergio',
    priority: 'Media',
    status: 'Completada',
    timestamp: 'Hace 3 semanas',
    createdAt: '2026-06-01 08:00',
    completedAt: '2026-06-17 18:00',
    actionsTaken: 'Pintura de techo y paredes (Claudio)'
  },
  {
    id: 'INC-2007',
    title: 'Reemplazo de portatubos',
    description: 'Portatubos común a reemplazar en el segundo piso, sector Oficina Misiones (Box Pr. Joni).',
    category: 'Electricidad',
    floor: 'Segundo',
    sector: 'Oficina Misiones',
    priority: 'Media',
    status: 'Completada',
    timestamp: 'Hace 4 semanas',
    createdAt: '2026-06-01 10:30',
    completedAt: '2026-06-04 14:00',
    actionsTaken: 'Pasaje de común a led (Mati)'
  },
  {
    id: 'INC-2008',
    title: 'Cerradura desgastada (Of. Jóvenes)',
    description: 'Cerradura desgastada en el cuarto piso, sector Oficina Jóvenes.',
    category: 'Cerrajería',
    floor: 'Cuarto',
    sector: 'Oficina Jóvenes',
    priority: 'Media',
    status: 'Completada',
    timestamp: 'Hace 3 semanas',
    createdAt: '2026-06-17 09:00',
    completedAt: '2026-06-17 12:30',
    cost: 19000,
    actionsTaken: 'Compra de cerradura nueva y colocación'
  },
  {
    id: 'INC-2009',
    title: 'Cerradura desgastada (Salón Grande)',
    description: 'Cerradura desgastada en el primer piso, sector Salón Grande.',
    category: 'Cerrajería',
    floor: 'Primero',
    sector: 'Salón Grande',
    priority: 'Media',
    status: 'Completada',
    timestamp: 'Hace 3 semanas',
    createdAt: '2026-06-17 14:00',
    completedAt: '2026-06-17 17:45',
    cost: 36000,
    actionsTaken: 'Compra de cerradura nueva y colocación'
  },
  {
    id: 'INC-2010',
    title: 'Tubos quemados 12',
    description: 'Tubos quemados 12 en el segundo piso, sector Salón Grande.',
    category: 'Electricidad',
    floor: 'Segundo',
    sector: 'Salón Grande',
    priority: 'Media',
    status: 'Pendiente',
    timestamp: 'Hace 3 semanas',
    createdAt: '2026-06-16 11:00',
    actionsTaken: 'Compra y reemplazo de tubos'
  },
  {
    id: 'INC-2011',
    title: 'Cortinas en mal estado',
    description: 'Cortinas en mal estado.',
    category: 'Mobiliario',
    floor: 'Planta Baja',
    sector: 'Salón Chico',
    priority: 'Baja',
    status: 'Pendiente',
    timestamp: 'Hace 2 semanas',
    createdAt: '2026-06-19 15:30',
    actionsTaken: 'Reemplazar cortinas'
  },
  {
    id: 'INC-2012',
    title: 'Malas condiciones de pintura',
    description: 'Salones en malas condiciones de pintura. Requiere pintura en todos los salones 1, 2 y 3.',
    category: 'Pintura',
    floor: 'Primero',
    sector: 'Aulas Escuela de Música',
    priority: 'Media',
    status: 'Completada',
    timestamp: 'Hace 1 semana',
    createdAt: '2026-06-19 08:30',
    completedAt: '2026-07-01 18:00',
    actionsTaken: 'Pintura en todos los salones 1, 2 y 3'
  },
  {
    id: 'INC-2013',
    title: 'Cerradura rota puerta bar PB',
    description: 'Cerradura rota de la puerta del bar en Planta Baja.',
    category: 'Cerrajería',
    floor: 'Planta Baja',
    sector: 'Salón Grande',
    priority: 'Media',
    status: 'Completada',
    timestamp: 'Hace 2 semanas',
    createdAt: '2026-06-22 10:00',
    completedAt: '2026-06-22 13:00',
    cost: 70000,
    actionsTaken: 'Cambio a cerradura nueva'
  },
  {
    id: 'INC-2014',
    title: 'Tablero WARNING descompuesto PB',
    description: 'Tablero de warning descompuesto en Planta Baja.',
    category: 'Electricidad',
    floor: 'Planta Baja',
    sector: 'Sala de tableros',
    priority: 'Alta',
    status: 'Completada',
    timestamp: 'Hace 2 semanas',
    createdAt: '2026-06-20 16:00',
    completedAt: '2026-06-26 18:00',
    actionsTaken: 'Llamada al Servicio técnico'
  },
  {
    id: 'INC-2015',
    title: 'Canilla de agua caliente rota',
    description: 'Canilla de agua caliente del dispenser rota en el segundo piso, Oficina Misiones.',
    category: 'Plomería',
    floor: 'Segundo',
    sector: 'Oficina Misiones',
    priority: 'Baja',
    status: 'Pendiente',
    timestamp: 'Hace 4 días',
    createdAt: '2026-07-04 09:30',
    actionsTaken: 'Llamar a regondi'
  },
  {
    id: 'INC-2016',
    title: 'Telefonía fuera de servicio',
    description: 'Telefonía fuera de servicio.',
    category: 'Electricidad',
    floor: 'Planta Baja',
    sector: 'ADMINISTRACIÓN',
    priority: 'Media',
    status: 'Pendiente',
    timestamp: 'Hace 7 días',
    createdAt: '2026-07-01 14:00',
    actionsTaken: 'Llamar a telecom'
  }
];

export const INITIAL_PREVENTIVE_TASKS: PreventiveTask[] = [
  {
    id: 'PM-101',
    title: 'Revisión Ascensores',
    date: '2026-10-15',
    category: 'Ascensores',
    floor: 'Primero',
    frequency: 'Mensual',
    assigneeName: 'M. Rodríguez',
    assigneeAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA728MD6rZDv4BH2SQrEjEPhoOMSNNza3I-2HcLA8Ap9LdrPeJmablghS5kXzJO8gLMU8aml0r-WQJWWL_EC_i2cvE6nqivHdkHS6SfAkQiyjXyv3hAK-EThgE3saTgaZ9bIGvvTY-SgjrQ74U85kas6DzltWMpEhUntXiZC_BsCyeDWfSbXoJCGcl11PYNETTmTgqNFMhQqkHdckc1aU8iIi4uWDzz0h15ZCx7jQN8hZZFPqv1Cf-RwMtxL092Y9z4GRdfQLklVnA',
    status: 'Programada'
  },
  {
    id: 'PM-102',
    title: 'Mantenimiento Calderas',
    date: '2026-10-05',
    category: 'Infraestructura',
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
    category: 'Infraestructura',
    floor: 'Cuarto',
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
    title: 'Nueva incidencia: Canilla rota',
    description: 'Segundo Piso - Oficina Misiones. Canilla de agua caliente del dispenser rota.',
    timestamp: 'Hace 5 min',
    statusText: 'Pendiente',
    category: 'Plomería'
  },
  {
    id: 'ACT-002',
    type: 'task_completed',
    title: 'Tarea Finalizada: Tablero WARNING',
    description: 'Planta Baja - Sala de tableros. Se llamó al Servicio técnico y se solucionó.',
    timestamp: 'Hace 2 horas',
    statusText: 'Completado',
    category: 'Electricidad'
  },
  {
    id: 'ACT-003',
    type: 'status_update',
    title: 'Actualización de Estado: Cerámicos levantados',
    description: 'Cuarto Piso - Oficina Pr. Sergio pasó a \'En Proceso\'.',
    timestamp: 'Hace 4 horas',
    statusText: 'En Proceso',
    category: 'Infraestructura'
  }
];

export const FLOORS = [
  'Planta Baja',
  'Primero',
  'Segundo',
  'Tercero',
  'Cuarto',
  'Quinto',
  'Sexto',
  'Terraza',
  'Subsuelo'
];

export const ALL_SECTORS = [
  'Salón Grande',
  'Salón Chico',
  'Baño Hombres',
  'Baño Mujeres',
  'Oficina Misiones',
  'Oficina Kinectika',
  'Oficina Jóvenes',
  'Oficina Áreas',
  'Oficina Pr. Sergio',
  'ADMINISTRACIÓN',
  'Oficina Pr. Máximo',
  'Oficina Mujeres',
  'Oficina Pastor Carlos',
  'Sala Bombas',
  'Sala de tableros',
  'Depósito',
  'Sala de Cámaras',
  'Aulas Escuela de Música'
];

export const SECTOR_MAP: Record<string, string[]> = {
  'Planta Baja': ALL_SECTORS,
  'Primero': ALL_SECTORS,
  'Segundo': ALL_SECTORS,
  'Tercero': ALL_SECTORS,
  'Cuarto': ALL_SECTORS,
  'Quinto': ALL_SECTORS,
  'Sexto': ALL_SECTORS,
  'Terraza': ALL_SECTORS,
  'Subsuelo': ALL_SECTORS
};

export const CATEGORIES = [
  'Electricidad',
  'Plomería',
  'Mobiliario',
  'Limpieza',
  'Ascensores',
  'Infraestructura',
  'Aberturas',
  'Cerrajería',
  'Herrería',
  'Pintura'
];

