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
    const { data, error } = await supabase
      .from("reservas")
      .select(`
        *,
        usuario_email:usuarios(email),
        usuario_nombre:usuarios(nombre),
        usuario_rol:usuarios(rol)
      `)
      .eq("usuario_id", usuarioId)
      .order("fecha_inicio", { ascending: true });

    if (error) throw error;
    return (data || []).map((r: any) => ({
      ...r,
      usuario_email: r.usuario_email?.email || undefined,
      usuario_nombre: r.usuario_nombre?.nombre || undefined,
      usuario_rol: r.usuario_rol?.rol || undefined,
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

    const { data, error } = await supabase
      .from("reservas")
      .select(`
        *,
        usuario_email:usuarios(email),
        usuario_nombre:usuarios(nombre),
        usuario_rol:usuarios(rol)
      `)
      .eq("estado", "confirmada")
      .lt("fecha_inicio", fin)
      .gt("fecha_fin", inicio)
      .order("fecha_inicio", { ascending: true });

    if (error) throw error;
    return (data || []).map((r: any) => ({
      ...r,
      usuario_email: r.usuario_email?.email || undefined,
      usuario_nombre: r.usuario_nombre?.nombre || undefined,
      usuario_rol: r.usuario_rol?.rol || undefined,
    }));
  },

  async obtenerReservasConfirmadas(): Promise<Reserva[]> {
    const { data, error } = await supabase
      .from("reservas")
      .select(`
        *,
        usuario_email:usuarios(email),
        usuario_nombre:usuarios(nombre),
        usuario_rol:usuarios(rol)
      `)
      .eq("estado", "confirmada")
      .order("fecha_inicio", { ascending: true });

    if (error) throw error;
    return (data || []).map((r: any) => ({
      ...r,
      usuario_email: r.usuario_email?.email || undefined,
      usuario_nombre: r.usuario_nombre?.nombre || undefined,
      usuario_rol: r.usuario_rol?.rol || undefined,
    }));
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
    cantidad?: number
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
    // Obtener datos de la reserva y usuario
    const { data: reserva, error: errorFetch } = await supabase
      .from("reservas")
      .select(`
        *,
        usuario_email:usuarios(email),
        usuario_nombre:usuarios(nombre)
      `)
      .eq("id", reservaId)
      .single();

    if (errorFetch) throw errorFetch;

    // Actualizar estado a cancelada
    const { error } = await supabase
      .from("reservas")
      .update({ estado: "cancelada" })
      .eq("id", reservaId);

    if (error) throw error;

    // Enviar notificación de cancelación
    if (reserva) {
      try {
        await notificarCancelacionReserva(reserva, {
          email: reserva.usuario_email?.email,
          nombre: reserva.usuario_nombre?.nombre,
        });
      } catch (emailError) {
        console.error("Error al enviar notificación de cancelación:", emailError);
        // No lanzar error, la reserva ya fue cancelada
      }
    }
  },

  // Eliminar reserva permanentemente
  async eliminarReserva(reservaId: string): Promise<void> {
    // Obtener datos de la reserva y usuario
    const { data: reserva, error: errorFetch } = await supabase
      .from("reservas")
      .select(`
        *,
        usuario_email:usuarios(email),
        usuario_nombre:usuarios(nombre)
      `)
      .eq("id", reservaId)
      .single();

    if (errorFetch) throw errorFetch;

    // Eliminar la reserva
    const { error } = await supabase
      .from("reservas")
      .delete()
      .eq("id", reservaId);

    if (error) throw error;

    // Enviar notificación de cancelación
    if (reserva) {
      try {
        await notificarCancelacionReserva(reserva, {
          email: reserva.usuario_email?.email,
          nombre: reserva.usuario_nombre?.nombre,
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
      .select(`
        *,
        usuario_email:usuarios(email),
        usuario_nombre:usuarios(nombre),
        usuario_rol:usuarios(rol)
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      usuario_email: data.usuario_email?.email || undefined,
      usuario_nombre: data.usuario_nombre?.nombre || undefined,
      usuario_rol: data.usuario_rol?.rol || undefined,
    };
  },

  // Obtener reservas por sala
  async obtenerReservasPorSala(sala: SalaType): Promise<Reserva[]> {
    const { data, error } = await supabase
      .from("reservas")
      .select(`
        *,
        usuario_email:usuarios(email),
        usuario_nombre:usuarios(nombre),
        usuario_rol:usuarios(rol)
      `)
      .eq("sala", sala)
      .eq("estado", "confirmada")
      .order("fecha_inicio", { ascending: true });

    if (error) throw error;
    return (data || []).map((r: any) => ({
      ...r,
      usuario_email: r.usuario_email?.email || undefined,
      usuario_nombre: r.usuario_nombre?.nombre || undefined,
      usuario_rol: r.usuario_rol?.rol || undefined,
    }));
  },
};
