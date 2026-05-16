import { supabase } from "../lib/supabase";
import type { Reserva, SalaType } from "../types";
import { notificarReserva, notificarCancelacionReserva } from "./emailService";

// Función auxiliar para generar fechas recurrentes
function generarFechasRecurrentes(
  fechaInicio: string,
  recurrenceType: "weekly" | "monthly" | "yearly",
  recurrenceEndDate: string | null,
  recurrenceCount: number | null
): string[] {
  const start = new Date(fechaInicio);
  const fechas: string[] = [fechaInicio];
  let current = new Date(start);
  let count = 1;
  
  const maxIteraciones = 200; // Seguridad contra bucles infinitos
  let iteraciones = 0;

  while (iteraciones < maxIteraciones) {
    iteraciones++;
    
    switch (recurrenceType) {
      case "weekly":
        current.setDate(current.getDate() + 7);
        break;
      case "monthly":
        current.setMonth(current.getMonth() + 1);
        break;
      case "yearly":
        current.setFullYear(current.getFullYear() + 1);
        break;
    }

    const fechaStr = current.toISOString().split("T")[0];
    
    // Verificar condiciones de término
    if (recurrenceEndDate && fechaStr > recurrenceEndDate) break;
    if (recurrenceCount && count >= recurrenceCount) break;
    
    fechas.push(fechaStr);
    count++;
  }

  return fechas;
}

export const reservasService = {
  // Obtener todas las reservas del usuario
  async obtenerReservasUsuario(usuarioId: string): Promise<Reserva[]> {
    // Sin embeds automáticos para evitar ambigüedad con múltiples FK a usuarios
    const { data: reservas, error: reservasError } = await supabase
      .from("reservas")
      .select("*")
      .eq("usuario_id", usuarioId)
      .order("fecha_inicio", { ascending: true });

    if (reservasError) throw reservasError;

    // Obtener datos del usuario
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("email, nombre, rol")
      .eq("id", usuarioId)
      .single();

    return (reservas || []).map((r: any) => ({
      ...r,
      usuario_email: usuario?.email,
      usuario_nombre: usuario?.nombre,
      usuario_rol: usuario?.rol,
    }));
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

    // Sin embeds automáticos para evitar ambigüedad con múltiples FK a usuarios
    const { data: reservas, error: reservasError } = await supabase
      .from("reservas")
      .select("*")
      .eq("estado", "confirmada")
      .lt("fecha_inicio", fin)
      .gt("fecha_fin", inicio)
      .order("fecha_inicio", { ascending: true });

    if (reservasError) throw reservasError;

    // Obtener todos los usuarios para enriquecer datos
    const { data: usuarios } = await supabase
      .from("usuarios")
      .select("id, email, nombre, rol");

    return (reservas || []).map((r: any) => {
      const user = (usuarios || []).find((u: any) => u.id === r.usuario_id);
      return {
        ...r,
        usuario_email: user?.email,
        usuario_nombre: user?.nombre,
        usuario_rol: user?.rol,
      };
    });
  },

  async obtenerReservasConfirmadas(): Promise<Reserva[]> {
    // Sin embeds automáticos para evitar ambigüedad con múltiples FK a usuarios
    const { data: reservas, error: reservasError } = await supabase
      .from("reservas")
      .select("*")
      .eq("estado", "confirmada")
      .order("fecha_inicio", { ascending: true });

    if (reservasError) throw reservasError;

    // Obtener todos los usuarios para enriquecer datos
    const { data: usuarios } = await supabase
      .from("usuarios")
      .select("id, email, nombre, rol");

    return (reservas || []).map((r: any) => {
      const user = (usuarios || []).find((u: any) => u.id === r.usuario_id);
      return {
        ...r,
        usuario_email: user?.email,
        usuario_nombre: user?.nombre,
        usuario_rol: user?.rol,
      };
    });
  },

  // Crear nueva reserva (con soporte para recurrencias)
  async crearReserva(
    usuarioId: string,
    sala: SalaType,
    fechaInicio: string,
    fechaFin: string,
    descripcion?: string,
    recurrenceType?: "none" | "weekly" | "monthly" | "yearly",
    recurrenceEndDate?: string,
    recurrenceCount?: number,
    cantidad?: number,
    responsable_id?: string,
    responsable_nombre?: string,
    responsable_email?: string
  ): Promise<Reserva> {
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("email, nombre, rol")
      .eq("id", usuarioId)
      .single();

    // Si no hay recurrencia, crear una única reserva
    if (!recurrenceType || recurrenceType === "none") {
      const { data, error } = await supabase
        .from("reservas")
        .insert({
          usuario_id: usuarioId,
          sala,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          descripcion,
          cantidad: cantidad || 1,
          responsable_id,
          responsable_nombre,
          responsable_email,
          estado: "confirmada",
          recurrence_type: "none",
        })
        .select()
        .single();

      if (error) throw error;

      // Enviar notificación por correo
      if (usuario) {
        await notificarReserva(data, usuario);
      }

      return {
        ...data,
        usuario_email: usuario?.email,
        usuario_nombre: usuario?.nombre,
        usuario_rol: usuario?.rol,
      };
    }

    // Si hay recurrencia, crear múltiples instancias
    const fechasRecurrentes = generarFechasRecurrentes(
      fechaInicio,
      recurrenceType,
      recurrenceEndDate || null,
      recurrenceCount || null
    );

    // Crear la reserva original con datos de recurrencia
    const { data: reservaOriginal, error: errorOriginal } = await supabase
      .from("reservas")
      .insert({
        usuario_id: usuarioId,
        sala,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        descripcion,
        responsable_id,
        responsable_nombre,
        responsable_email,
        estado: "confirmada",
        recurrence_type: recurrenceType,
        recurrence_end_date: recurrenceEndDate || null,
        recurrence_count: fechasRecurrentes.length,
      })
      .select()
      .single();

    if (errorOriginal) throw errorOriginal;

    // Crear instancias recurrentes
    const instanciasParaCrear = fechasRecurrentes.slice(1).map((fecha) => {
      return {
        usuario_id: usuarioId,
        sala,
        fecha_inicio: fecha + "T" + fechaInicio.split("T")[1],
        fecha_fin: fecha + "T" + fechaFin.split("T")[1],
        descripcion,
        responsable_id,
        responsable_nombre,
        responsable_email,
        estado: "confirmada",
        recurrence_type: "none",
        original_reserva_id: reservaOriginal.id,
      };
    });

    if (instanciasParaCrear.length > 0) {
      const { error: errorInstancias } = await supabase
        .from("reservas")
        .insert(instanciasParaCrear);

      if (errorInstancias) {
        console.error("Error al crear instancias recurrentes:", errorInstancias);
        // No lanzar error, ya que la reserva original fue creada exitosamente
      }
    }

    // Enviar notificación por correo
    if (usuario) {
      await notificarReserva(reservaOriginal, usuario);
    }

    return {
      ...reservaOriginal,
      usuario_email: usuario?.email,
      usuario_nombre: usuario?.nombre,
      usuario_rol: usuario?.rol,
    };
  },

  // Cancelar reserva
  async cancelarReserva(reservaId: string): Promise<void> {
    // Obtener datos de la reserva
    const { data: reserva, error: errorFetch } = await supabase
      .from("reservas")
      .select("*")
      .eq("id", reservaId)
      .single();

    if (errorFetch) throw errorFetch;

    // Obtener datos del usuario
    let usuario = null;
    if (reserva.usuario_id) {
      const { data: usuarioData } = await supabase
        .from("usuarios")
        .select("email, nombre")
        .eq("id", reserva.usuario_id)
        .single();
      usuario = usuarioData;
    }

    // Actualizar estado a cancelada
    const { error } = await supabase
      .from("reservas")
      .update({ estado: "cancelada" })
      .eq("id", reservaId);

    if (error) throw error;

    // Enviar notificación de cancelación
    if (reserva && usuario) {
      try {
        await notificarCancelacionReserva(reserva, {
          email: usuario.email,
          nombre: usuario.nombre,
        });
      } catch (emailError) {
        console.error("Error al enviar notificación de cancelación:", emailError);
        // No lanzar error, la reserva ya fue cancelada
      }
    }
  },

  // Eliminar reserva permanentemente
  async eliminarReserva(reservaId: string): Promise<void> {
    // Obtener datos de la reserva
    const { data: reserva, error: errorFetch } = await supabase
      .from("reservas")
      .select("*")
      .eq("id", reservaId)
      .single();

    if (errorFetch) throw errorFetch;

    // Obtener datos del usuario
    let usuario = null;
    if (reserva.usuario_id) {
      const { data: usuarioData } = await supabase
        .from("usuarios")
        .select("email, nombre")
        .eq("id", reserva.usuario_id)
        .single();
      usuario = usuarioData;
    }

    // Eliminar la reserva
    const { error } = await supabase
      .from("reservas")
      .delete()
      .eq("id", reservaId);

    if (error) throw error;

    // Enviar notificación de cancelación
    if (reserva && usuario) {
      try {
        await notificarCancelacionReserva(reserva, {
          email: usuario.email,
          nombre: usuario.nombre,
        });
      } catch (emailError) {
        console.error("Error al enviar notificación de cancelación:", emailError);
        // No lanzar error, la reserva ya fue eliminada
      }
    }
  },

  // Actualizar una reserva (usado por admins)
  async actualizarReserva(reservaId: string, updates: Partial<Reserva>): Promise<Reserva> {
    const { data, error } = await supabase
      .from("reservas")
      .update(updates)
      .eq("id", reservaId)
      .select("*")
      .single();

    if (error) throw error;

    // Obtener datos del usuario
    let usuario = null;
    if (data.usuario_id) {
      const { data: usuarioData } = await supabase
        .from("usuarios")
        .select("email, nombre, rol")
        .eq("id", data.usuario_id)
        .single();
      usuario = usuarioData;
    }

    return {
      ...data,
      usuario_email: usuario?.email || undefined,
      usuario_nombre: usuario?.nombre || undefined,
      usuario_rol: usuario?.rol || undefined,
    };
  },

  // Actualizar reserva desde admin panel (alias)
  async actualizarReservaAdmin(reservaId: string, updates: Partial<Reserva>): Promise<Reserva> {
    return this.actualizarReserva(reservaId, updates);
  },

  // Obtener reservas por sala
  async obtenerReservasPorSala(sala: SalaType): Promise<Reserva[]> {
    // Sin embeds automáticos para evitar ambigüedad con múltiples FK a usuarios
    const { data, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("sala", sala)
      .eq("estado", "confirmada")
      .order("fecha_inicio", { ascending: true });

    if (error) throw error;

    // Obtener todos los usuarios para enriquecer datos
    const { data: usuarios } = await supabase
      .from("usuarios")
      .select("id, email, nombre, rol");

    return (data || []).map((r: any) => {
      const user = (usuarios || []).find((u: any) => u.id === r.usuario_id);
      return {
        ...r,
        usuario_email: user?.email || undefined,
        usuario_nombre: user?.nombre || undefined,
        usuario_rol: user?.rol || undefined,
      };
    });
  },
};
