import { supabase } from "../lib/supabase";
import type { Reserva, SalaType } from "../types";
import { notificarReserva } from "./emailService";

export const reservasService = {
  // Obtener todas las reservas del usuario
  async obtenerReservasUsuario(usuarioId: string): Promise<Reserva[]> {
    const { data, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("usuario_id", usuarioId)
      .order("fecha_inicio", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Obtener disponibilidad de una sala
  async verificarDisponibilidad(
    sala: SalaType,
    fechaInicio: string,
    fechaFin: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from("reservas")
      .select("id")
      .eq("sala", sala)
      .eq("estado", "confirmada")
      .lt("fecha_inicio", fechaFin)
      .gt("fecha_fin", fechaInicio);

    if (error) throw error;
    return (data?.length || 0) === 0;
  },

  async obtenerReservasConfirmadasPorFecha(fecha: string): Promise<Reserva[]> {
    const inicio = `${fecha}T00:00:00`;
    const fin = `${fecha}T23:59:59`;

    const { data, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("estado", "confirmada")
      .lt("fecha_inicio", fin)
      .gt("fecha_fin", inicio)
      .order("fecha_inicio", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async obtenerReservasConfirmadas(): Promise<Reserva[]> {
    const { data, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("estado", "confirmada")
      .order("fecha_inicio", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Crear nueva reserva
  async crearReserva(
    usuarioId: string,
    sala: SalaType,
    fechaInicio: string,
    fechaFin: string,
    descripcion?: string
  ): Promise<Reserva> {
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("email, nombre")
      .eq("id", usuarioId)
      .single();

    const { data, error } = await supabase
      .from("reservas")
      .insert({
        usuario_id: usuarioId,
        sala,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        descripcion,
        estado: "confirmada",
      })
      .select()
      .single();

    if (error) throw error;

    // Enviar notificación por correo
    if (usuario) {
      await notificarReserva(data, usuario);
    }

    return data;
  },

  // Cancelar reserva
  async cancelarReserva(reservaId: string): Promise<void> {
    const { error } = await supabase
      .from("reservas")
      .update({ estado: "cancelada" })
      .eq("id", reservaId);

    if (error) throw error;
  },

  // Eliminar reserva permanentemente
  async eliminarReserva(reservaId: string): Promise<void> {
    const { error } = await supabase
      .from("reservas")
      .delete()
      .eq("id", reservaId);

    if (error) throw error;
  },

  // Obtener reservas por sala
  async obtenerReservasPorSala(sala: SalaType): Promise<Reserva[]> {
    const { data, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("sala", sala)
      .eq("estado", "confirmada")
      .order("fecha_inicio", { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
