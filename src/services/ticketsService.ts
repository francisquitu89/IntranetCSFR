import { supabase } from "../lib/supabase";
import type { Ticket, TicketCategoryType, TicketPriorityType, TicketStatusType, SalaType } from "../types";
import { notificarTicket } from "./emailService";

export const ticketsService = {
  // Obtener todos los tickets del usuario
  async obtenerTicketsUsuario(usuarioId: string): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("usuario_id", usuarioId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Obtener todos los tickets (para funcionarios/admins)
  async obtenerTodosTickets(): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
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
};
