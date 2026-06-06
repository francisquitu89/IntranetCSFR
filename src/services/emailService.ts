import type { Reserva, Ticket, Usuario } from "../types";

const DEFAULT_CC_RESERVAS = "dperez@csfr.cl, soporte@csfr.cl";
const DEFAULT_CC_TICKETS = "dperez@csfr.cl, servicios@csfr.cl, soporte@csfr.cl";

interface EmailPayload {
  destinatario: string;
  cc?: string;
  asunto: string;
  cuerpo_html: string;
  cuerpo_texto: string;
  responsable_nombre?: string;
  responsable_email?: string;
}

// Función para enviar emails via API (necesita backend)
// Por ahora usaremos Supabase Realtime para notificaciones internas
export const notificarReserva = async (
  reserva: Reserva,
  usuario: Partial<Usuario>
) => {
  // Función auxiliar para traducir tipo de recurrencia
  const traducirRecurrencia = (tipo?: string) => {
    const map: Record<string, string> = {
      weekly: "Cada semana",
      monthly: "Cada mes",
      yearly: "Cada año",
    };
    return map[tipo || ""] || "No";
  };

  const tieneRecurrencia = reserva.recurrence_type && reserva.recurrence_type !== "none";
  
  const cuerpoHtml = `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Reserva Confirmada - SSFF Intranet</h2>
        <p>Estimado/a ${usuario.nombre},</p>
        <p>Su reserva ha sido confirmada exitosamente.</p>
        <hr>
        <p><strong>Detalles de la Reserva:</strong></p>
        <ul>
          <li><strong>Sala:</strong> ${reserva.sala}</li>
          <li><strong>Fecha de Inicio:</strong> ${new Date(reserva.fecha_inicio).toLocaleString("es-CL")}</li>
          <li><strong>Fecha de Fin:</strong> ${new Date(reserva.fecha_fin).toLocaleString("es-CL")}</li>
          ${reserva.descripcion ? `<li><strong>Descripción:</strong> ${reserva.descripcion}</li>` : ""}
          ${reserva.responsable_nombre ? `<li><strong>Responsable:</strong> ${reserva.responsable_nombre}</li>` : ""}
          ${tieneRecurrencia ? `
            <li><strong>Repetir Reserva:</strong> ${traducirRecurrencia(reserva.recurrence_type)}</li>
            ${reserva.recurrence_end_date ? `<li><strong>Hasta:</strong> ${new Date(reserva.recurrence_end_date).toLocaleString("es-CL")}</li>` : ""}
            ${reserva.recurrence_count ? `<li><strong>Cantidad de Repeticiones:</strong> ${reserva.recurrence_count}</li>` : ""}
          ` : ""}
        </ul>
        <hr>
        <p>Si desea cancelar o modificar esta reserva, ingrese a su cuenta en la Intranet.</p>
        <p>Cordialmente,<br>Sistema SSFF</p>
      </body>
    </html>
  `;

  try {
    await registrarNotificacion({
      destinatario: usuario.email || "",
      cc: DEFAULT_CC_RESERVAS,
      asunto: `Reserva Confirmada - ${reserva.sala}`,
      cuerpo_html: cuerpoHtml,
      cuerpo_texto: `Reserva confirmada para ${reserva.sala}`,
      responsable_nombre: reserva.responsable_nombre,
      responsable_email: reserva.responsable_email,
    });
  } catch (error) {
    console.error("Error al enviar notificación de reserva:", error);
  }
};

export const notificarTicket = async (
  ticket: Ticket,
  usuario: Partial<Usuario>,
  accion: "creado" | "actualizado"
) => {
  // No enviar email si el ticket está rechazado
  if (ticket.estado === "Rechazado") {
    return;
  }

  // Función para obtener tiempo de respuesta según categoría
  const obtenerTiempoRespuesta = (categoria: string): string => {
    const tiemposRespuesta: Record<string, string> = {
      "Requerimientos Audiovisuales": "1 a 3 días hábiles",
      "Requerimientos Mantención": "1 a 3 días hábiles",
      "Requerimientos SSGG": "1 día hábil",
      "Requerimientos TI": "1 a 3 días hábiles",
      "Requerimientos Administración y finanzas": "1 a 2 días hábiles",
      "Eventos especiales": "1 a 3 días hábiles",
      "Otros": "2 a 3 días hábiles",
    };
    return tiemposRespuesta[categoria] || "2 a 3 días hábiles";
  };

  // Determinar si enviar email basado en el estado
  const debeEnviarEmail = (estado: string, accion: string) => {
    if (estado === "Abierto" && accion === "creado") return true; // Enviar cuando se crea
    if (estado === "Resuelto" && accion === "actualizado") return true; // Enviar cuando se resuelve
    if (estado === "En Progreso" && accion === "actualizado") return false; // No enviar en progreso
    return false;
  };

  if (!debeEnviarEmail(ticket.estado, accion)) {
    return;
  }

  let cuerpoHtml = "";
  let asunto = "";

  if (accion === "creado") {
    const tiempoRespuesta = obtenerTiempoRespuesta(ticket.categoria);
    asunto = `Ticket Creado - ${ticket.asunto}`;
    cuerpoHtml = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h2>Ticket Creado</h2>
          <p>Estimado/a ${usuario.nombre},</p>
          <p>Tu ticket ha sido creado exitosamente y está en proceso de aprobación.</p>
          <hr>
          <p><strong>Detalles del Ticket:</strong></p>
          <ul>
            <li><strong>Ticket ID:</strong> ${ticket.id}</li>
            <li><strong>Categoría:</strong> ${ticket.categoria}</li>
            <li><strong>Asunto:</strong> ${ticket.asunto}</li>
            <li><strong>Prioridad:</strong> ${ticket.prioridad}</li>
            <li><strong>Tiempo de Respuesta Estimado:</strong> ${tiempoRespuesta}</li>
          </ul>
          <hr>
          <p>Puedes revisar el estado de tu ticket en la Intranet.</p>
          <p>Cordialmente,<br>Sistema SSFF</p>
        </body>
      </html>
    `;
  } else if (ticket.estado === "Resuelto") {
    asunto = `¡Tu ticket ha sido resuelto! - ${ticket.asunto}`;
    cuerpoHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #22c55e; margin: 0;">✓ ¡Tu ticket ha sido resuelto!</h2>
            </div>
            
            <p style="color: #333; font-size: 16px;">Hola ${usuario.nombre},</p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Nos complace informarte que tu solicitud ha sido resuelta.
            </p>

            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #1e7e34; font-weight: bold; font-size: 14px;">Ticket: ${ticket.asunto}</p>
              <p style="margin: 5px 0 0 0; color: #666; font-size: 13px;">ID: ${ticket.id}</p>
            </div>

            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Puedes revisar los detalles completos de tu ticket en la Intranet.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Sistema SSFF<br>
              <a href="#" style="color: #0ea5e9; text-decoration: none;">Acceder a la Intranet</a>
            </p>
          </div>
        </body>
      </html>
    `;
  }

  try {
    await registrarNotificacion({
      destinatario: usuario.email || "",
      cc: DEFAULT_CC_TICKETS,
      asunto: asunto,
      cuerpo_html: cuerpoHtml,
      cuerpo_texto: asunto,
    });
  } catch (error) {
    console.error("Error al enviar notificación de ticket:", error);
  }
};

export const notificarCancelacionReserva = async (
  reserva: Reserva,
  usuario: Partial<Usuario>
) => {
  // Función auxiliar para traducir tipo de recurrencia
  const traducirRecurrencia = (tipo?: string) => {
    const map: Record<string, string> = {
      weekly: "Cada semana",
      monthly: "Cada mes",
      yearly: "Cada año",
    };
    return map[tipo || ""] || "No";
  };

  const tieneRecurrencia = reserva.recurrence_type && reserva.recurrence_type !== "none";

  const cuerpoHtml = `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Reserva Cancelada - SSFF Intranet</h2>
        <p>Estimado/a ${usuario.nombre},</p>
        <p>Su reserva ha sido cancelada.</p>
        <hr>
        <p><strong>Detalles de la Reserva Cancelada:</strong></p>
        <ul>
          <li><strong>Sala:</strong> ${reserva.sala}</li>
          <li><strong>Fecha de Inicio:</strong> ${new Date(reserva.fecha_inicio).toLocaleString("es-CL")}</li>
          <li><strong>Fecha de Fin:</strong> ${new Date(reserva.fecha_fin).toLocaleString("es-CL")}</li>
          ${reserva.descripcion ? `<li><strong>Descripción:</strong> ${reserva.descripcion}</li>` : ""}
          ${reserva.responsable_nombre ? `<li><strong>Responsable:</strong> ${reserva.responsable_nombre}</li>` : ""}
          ${tieneRecurrencia ? `
            <li><strong>Repetir Reserva:</strong> ${traducirRecurrencia(reserva.recurrence_type)}</li>
            ${reserva.recurrence_end_date ? `<li><strong>Hasta:</strong> ${new Date(reserva.recurrence_end_date).toLocaleString("es-CL")}</li>` : ""}
            ${reserva.recurrence_count ? `<li><strong>Cantidad de Repeticiones:</strong> ${reserva.recurrence_count}</li>` : ""}
          ` : ""}
        </ul>
        <hr>
        <p>Si considera que esto es un error, contacte a la administración.</p>
        <p>Cordialmente,<br>Sistema SSFF</p>
      </body>
    </html>
  `;

  try {
    await registrarNotificacion({
      destinatario: usuario.email || "",
      cc: DEFAULT_CC_RESERVAS,
      asunto: `Reserva Cancelada - ${reserva.sala}`,
      cuerpo_html: cuerpoHtml,
      cuerpo_texto: `Reserva cancelada para ${reserva.sala}`,
      responsable_nombre: reserva.responsable_nombre,
      responsable_email: reserva.responsable_email,
    });
  } catch (error) {
    console.error("Error al enviar notificación de cancelación:", error);
  }
};

// Registrar en tabla de notificaciones
async function registrarNotificacion(email: EmailPayload) {
  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseAnonKey) {
    throw new Error("Falta VITE_SUPABASE_ANON_KEY para enviar notificaciones");
  }

  try {
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        destinatario: email.destinatario,
        cc: email.cc,
        asunto: email.asunto,
        cuerpo_html: email.cuerpo_html,
        cuerpo_texto: email.cuerpo_texto,
        responsable_nombre: email.responsable_nombre,
        responsable_email: email.responsable_email,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error HTTP ${response.status}:`, errorText);
      throw new Error(errorText || `Error HTTP ${response.status} al enviar notificación`);
    }

    const result = await response.json();
    console.log("✅ Notificación enviada:", result);
    return result;
  } catch (error) {
    console.error("❌ Error al registrar notificación:", error);
    throw error;
  }
}

export const emailService = {
  notificarReserva,
  notificarTicket,
  notificarCancelacionReserva,
};
