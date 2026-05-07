// Salas disponibles
export type SalaType = 
  | "Auditorio Grande"
  | "Auditorio Chico"
  | "Biblioteca (Cuenta Cuentos)"
  | "Biblioteca (mesas trabajo)"
  | "Biblioteca"
  | "Biblioteca2"
  | "Capilla"
  | "Sala VIP"
  | "Laboratorio Ciencias"
  | "Sala 33"
  | "Sala Computación"
  | "Sala Gimnasio"
  | "Sala Pastoral Juvenil"
  | "Préstamo Notebooks"
  | "Préstamo Tablets";

export interface SalaCatalogItem {
  value: SalaType;
  label: string;
  capacidad: number;
  tipo: "Espacio" | "Objeto";
  habilitada: boolean;
}

// Tipos de tickets
export type TicketCategoryType =
  | "Requerimientos Audiovisuales"
  | "Requerimientos Mantención"
  | "Requerimientos SSGG"
  | "Requerimientos TI"
  | "Requerimientos Administración y finanzas"
  | "Eventos especiales"
  | "Otros";

export type TicketPriorityType = "Baja" | "Media" | "Alta" | "Urgente";
export type TicketStatusType = "Abierto" | "En Progreso" | "Resuelto" | "Cerrado";

// Interfaces
export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: "admin" | "profesor" | "funcionario" | "director";
  departamento?: string;
  telefono?: string;
  created_at: string;
}

export interface Reserva {
  id: string;
  usuario_id: string;
  usuario_email?: string;
  usuario_nombre?: string;
  usuario_rol?: "admin" | "profesor" | "funcionario" | "director";
  sala: SalaType;
  fecha_inicio: string;
  fecha_fin: string;
  descripcion?: string;
  estado: "confirmada" | "cancelada" | "pendiente";
  recurrence_type?: "none" | "weekly" | "monthly" | "yearly";
  recurrence_end_date?: string;
  recurrence_count?: number;
  original_reserva_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  usuario_id: string;
  usuario_nombre?: string;
  usuario_email?: string;
  usuario_rol?: "admin" | "profesor" | "funcionario" | "director";
  sala?: SalaType;
  equipo?: string;
  categoria: TicketCategoryType;
  asunto: string;
  descripcion: string;
  prioridad: TicketPriorityType;
  estado: TicketStatusType;
  respuesta?: string;
  respondido_por?: string;
  respondido_en?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificacionEmail {
  destinatario: string;
  asunto: string;
  cuerpo: string;
  tipo: "reserva_confirmada" | "reserva_cancelada" | "ticket_creado" | "ticket_actualizado";
  referencia_id: string;
}
