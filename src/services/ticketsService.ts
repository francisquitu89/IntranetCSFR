import { supabase } from "../lib/supabase";
import type { Ticket, TicketCategoryType, TicketPriorityType, TicketStatusType, SalaType } from "../types";
import { notificarTicket } from "./emailService";

export const ticketsService = {
  // Obtener todos los tickets del usuario
  async obtenerTicketsUsuario(usuarioId: string): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from("tickets")
      .select(`
        *,
        usuarios!usuario_id(nombre, email, rol)
      `)
      .eq("usuario_id", usuarioId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    // Obtener información del responsable
    const tickets = (data || []).map((ticket: any) => ({
      ...ticket,
      usuario_nombre: ticket.usuarios?.nombre,
      usuario_email: ticket.usuarios?.email,
      usuario_rol: ticket.usuarios?.rol,
    }));

    // Cargar información del responsable si existe
    for (const ticket of tickets) {
      if (ticket.respondido_por) {
        const { data: responsable } = await supabase
          .from("usuarios")
          .select("nombre, email")
          .eq("id", ticket.respondido_por)
          .single();
        if (responsable) {
          ticket.respondido_por_nombre = responsable.nombre;
          ticket.respondido_por_email = responsable.email;
        }
      }
    }

    return tickets;
  },

  // Obtener todos los tickets (para funcionarios/admins)
  async obtenerTodosTickets(): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from("tickets")
      .select(`
        *,
        usuarios!usuario_id(nombre, email, rol)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    const tickets = (data || []).map((ticket: any) => ({
      ...ticket,
      usuario_nombre: ticket.usuarios?.nombre,
      usuario_email: ticket.usuarios?.email,
      usuario_rol: ticket.usuarios?.rol,
    }));

    // Cargar información del responsable si existe
    for (const ticket of tickets) {
      if (ticket.respondido_por) {
        const { data: responsable } = await supabase
          .from("usuarios")
          .select("nombre, email")
          .eq("id", ticket.respondido_por)
          .single();
        if (responsable) {
          ticket.respondido_por_nombre = responsable.nombre;
          ticket.respondido_por_email = responsable.email;
        }
      }
    }

    return tickets;
  },

  // Obtener tickets según el rol del usuario
  async obtenerTicketsSegunRol(usuarioId: string, rol: string): Promise<Ticket[]> {
    if (rol === "funcionario" || rol === "admin" || rol === "director") {
      // Funcionarios, admins y directores ven todos los tickets
      return this.obtenerTodosTickets();
    } else {
      // Profesores solo ven sus propios tickets
      return this.obtenerTicketsUsuario(usuarioId);
    }
  },

  // Crear nuevo ticket
  async crearTicket(
    usuarioId: string,
    categoria: TicketCategoryType,
    asunto: string,
    descripcion: string,
    prioridad: TicketPriorityType,
    sala?: SalaType,
    equipo?: string
  ): Promise<Ticket> {
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("email, nombre")
      .eq("id", usuarioId)
      .single();

    const { data, error } = await supabase
      .from("tickets")
      .insert({
        usuario_id: usuarioId,
        categoria,
        asunto,
        descripcion,
        prioridad,
        sala,
        equipo,
        estado: "Abierto",
      })
      .select()
      .single();

    if (error) throw error;

    // Enviar notificación
    if (usuario) {
      await notificarTicket(data, usuario, "creado");
    }

    return data;
  },

  // Actualizar estado del ticket
  async actualizarTicket(
    ticketId: string,
    updates: Partial<Ticket>
  ): Promise<Ticket> {
    const { data, error } = await supabase
      .from("tickets")
      .update(updates)
      .eq("id", ticketId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Obtener tickets por categoría
  async obtenerTicketsPorCategoria(categoria: TicketCategoryType): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("categoria", categoria)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Obtener tickets por sala
  async obtenerTicketsPorSala(sala: SalaType): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("sala", sala)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Obtener tickets por estado
  async obtenerTicketsPorEstado(estado: TicketStatusType): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("estado", estado)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Responder un ticket (solo admin/funcionario)
  async responderTicket(
    ticketId: string,
    respuesta: string,
    respondidoPorId: string
  ): Promise<Ticket> {
    const { data, error } = await supabase
      .from("tickets")
      .update({
        respuesta,
        respondido_por: respondidoPorId,
        respondido_en: new Date().toISOString(),
      })
      .eq("id", ticketId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Eliminar un ticket (solo admin)
  async eliminarTicket(ticketId: string): Promise<void> {
    const { error } = await supabase
      .from("tickets")
      .delete()
      .eq("id", ticketId);

    if (error) throw error;
  },

  // Aprobar un ticket y asignar responsable
  async aprobarTicket(
    ticketId: string,
    aprobadoPorId: string,
    responsableId: string
  ): Promise<Ticket> {
    // Obtener información del responsable
    const { data: responsable } = await supabase
      .from("usuarios")
      .select("nombre, email")
      .eq("id", responsableId)
      .single();

    const { data, error } = await supabase
      .from("tickets")
      .update({
        estado: "En Progreso",
        aprobado_por: aprobadoPorId,
        aprobado_en: new Date().toISOString(),
        respondido_por: responsableId,
        respondido_por_nombre: responsable?.nombre,
        respondido_por_email: responsable?.email,
      })
      .eq("id", ticketId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Rechazar un ticket
  async rechazarTicket(
    ticketId: string,
    rechazadoPorId: string,
    razonRechazo: string
  ): Promise<Ticket> {
    const { data, error } = await supabase
      .from("tickets")
      .update({
        estado: "Rechazado",
        rechazado_por: rechazadoPorId,
        rechazado_en: new Date().toISOString(),
        razon_rechazo: razonRechazo,
      })
      .eq("id", ticketId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Obtener tickets pendientes de aprobación
  async obtenerTicketsPendientesAprobacion(): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from("tickets")
      .select(`
        *,
        usuarios!usuario_id(nombre, email, rol)
      `)
      .eq("estado", "Abierto")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((ticket: any) => ({
      ...ticket,
      usuario_nombre: ticket.usuarios?.nombre,
      usuario_email: ticket.usuarios?.email,
      usuario_rol: ticket.usuarios?.rol,
    }));
  },
};
