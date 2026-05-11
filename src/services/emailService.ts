import type { Reserva, Ticket, Usuario } from "../types";

const DEFAULT_CC_EMAIL = "reservas@csfr.cl";

interface EmailPayload {
  destinatario: string;
  cc?: string;
  asunto: string;
  cuerpo_html: string;
  cuerpo_texto: string;
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
      cc: DEFAULT_CC_EMAIL,
      asunto: `Reserva Confirmada - ${reserva.sala}`,
      cuerpo_html: cuerpoHtml,
      cuerpo_texto: `Reserva confirmada para ${reserva.sala}`,
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
  const accionTexto =
    accion === "creado" ? "creado" : "actualizado";
  const titulo =
    accion === "creado"
      ? "Ticket Creado - SSFF Intranet"
      : "Ticket Actualizado - SSFF Intranet";

  const cuerpoHtml = `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>${titulo}</h2>
        <p>Estimado/a ${usuario.nombre},</p>
        <p>Tu ticket ha sido ${accionTexto} exitosamente.</p>
        <hr>
        <p><strong>Detalles del Ticket:</strong></p>
        <ul>
          <li><strong>Ticket ID:</strong> ${ticket.id}</li>
          <li><strong>Categoría:</strong> ${ticket.categoria}</li>
          <li><strong>Asunto:</strong> ${ticket.asunto}</li>
          <li><strong>Prioridad:</strong> ${ticket.prioridad}</li>
          <li><strong>Estado:</strong> ${ticket.estado}</li>
          ${ticket.sala ? `<li><strong>Sala:</strong> ${ticket.sala}</li>` : ""}
          ${ticket.equipo ? `<li><strong>Equipo:</strong> ${ticket.equipo}</li>` : ""}
        </ul>
        <hr>
        <p>Puedes revisar el estado de tu ticket en la Intranet.</p>
        <p>Cordialmente,<br>Sistema SSFF</p>
      </body>
    </html>
  `;

  try {
    await registrarNotificacion({
      destinatario: usuario.email || "",
      cc: DEFAULT_CC_EMAIL,
      asunto: `Ticket ${accionTexto} - ${ticket.asunto}`,
      cuerpo_html: cuerpoHtml,
      cuerpo_texto: `Ticket ${accionTexto}: ${ticket.asunto}`,
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
      cc: DEFAULT_CC_EMAIL,
      asunto: `Reserva Cancelada - ${reserva.sala}`,
      cuerpo_html: cuerpoHtml,
      cuerpo_texto: `Reserva cancelada para ${reserva.sala}`,
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

  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({
      destinatario: email.destinatario,
      cc: email.cc ?? DEFAULT_CC_EMAIL,
      asunto: email.asunto,
      cuerpo_html: email.cuerpo_html,
      cuerpo_texto: email.cuerpo_texto,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error HTTP ${response.status} al enviar notificación`);
  }
}

export const emailService = {
  notificarReserva,
  notificarTicket,
  notificarCancelacionReserva,
};
