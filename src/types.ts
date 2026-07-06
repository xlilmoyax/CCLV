export type PriorityType = 'Baja' | 'Media' | 'Alta' | 'Crítica';
export type StatusType = 'Pendiente' | 'En Proceso' | 'Completada';

export interface PreventiveTask {
  id: string;
  title: string;
  date: string; // e.g. "2026-10-15"
  category: string;
  floor: string;
  frequency: string;
  assigneeName: string;
  assigneeAvatar: string;
  status: 'Programada' | 'Vencida' | 'Completada';
}

export interface Activity {
  id: string;
  type: 'new_incident' | 'task_completed' | 'status_update';
  title: string;
  description: string;
  timestamp: string;
  statusText: string;
  category: string;
}

export interface UserProfile {
  name: string;
  document: string;
  phone: string;
  email: string;
  office: 'Misiones' | 'Kinectika' | 'Jóvenes' | 'Administración' | 'Mantenimiento';
  isAdmin?: boolean;
  isApproved?: boolean;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: string;
  floor: string;
  sector: string;
  priority: PriorityType;
  status: StatusType;
  timestamp: string; // e.g. "Hace 15 min"
  assigneeName?: string;
  assigneeAvatar?: string;
  imageUrl?: string;
  createdAt: string; // Fecha de inicio
  completedAt?: string; // Fecha de finalización (cuando esté completada)
  reportedBy?: {
    name: string;
    email: string;
    phone: string;
    office: string;
  };
}

