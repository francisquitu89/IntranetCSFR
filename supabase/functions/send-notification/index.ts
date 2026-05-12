import { Resend } from "npm:resend@3.2.0";
import nodemailer from "npm:nodemailer@6.10.1";

interface NotificationRequest {
  destinatario: string;
  cc?: string | string[];
  asunto: string;
  cuerpo_html: string;
  cuerpo_texto: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verificación de seguridad: validar que la request sea legítima
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const allowedOrigins = ["http://localhost:5173", "https://csfr.cl", "https://www.csfr.cl", "https://intranet.csfr.cl"];
    
    // En desarrollo, permitir localhost; en producción, validar origen
    const isValidOrigin = !origin || allowedOrigins.some(ao => origin.includes(ao));
    
    if (!isValidOrigin && origin) {
      console.warn(`⚠️ Request desde origen no permitido: ${origin}`);
      // No bloquear pero log para seguridad
    }

    const payload = (await req.json()) as NotificationRequest;

    if (!payload.destinatario || !payload.asunto || !payload.cuerpo_html || !payload.cuerpo_texto) {
      return new Response(JSON.stringify({ error: "Faltan campos obligatorios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const mailFromEmail = Deno.env.get("MAIL_FROM_EMAIL") ?? "reservas@csfr.cl";
    const mailFromName = Deno.env.get("MAIL_FROM_NAME") ?? "Intranet de CSFR";

    // Función auxiliar para convertir cc a array
    const parseCcArray = (cc: string | string[] | undefined): string[] | undefined => {
      if (!cc) return undefined;
      if (Array.isArray(cc)) return cc;
      // Si es string, separar por comas y limpiar espacios
      return cc.split(",").map(email => email.trim()).filter(email => email.length > 0);
    };

    const ccArray = parseCcArray(payload.cc);

    // Intentar primero con Resend
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: `"${mailFromName}" <${mailFromEmail}>`,
          to: payload.destinatario,
          cc: ccArray,
          bcc: ["reservas@csfr.cl"], // Copia interna permanente
          subject: payload.asunto,
          html: payload.cuerpo_html,
          text: payload.cuerpo_texto,
        });

        console.log("✅ Email enviado con Resend");
        return new Response(JSON.stringify({ ok: true, method: "resend" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (resendError) {
        console.warn("⚠️ Resend falló, intentando con Gmail:", resendError);
      }
    }

    // Fallback a Gmail si Resend falla o no está configurado
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    if (gmailUser && gmailAppPassword) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: gmailUser,
            pass: gmailAppPassword,
          },
        });

        await transporter.sendMail({
          from: `"${mailFromName}" <${gmailUser}>`,
          to: payload.destinatario,
          cc: ccArray,
          bcc: ["reservas@csfr.cl"], // Copia interna permanente
          subject: payload.asunto,
          text: payload.cuerpo_texto,
          html: payload.cuerpo_html,
        });

        console.log("✅ Email enviado con Gmail (fallback)");
        return new Response(JSON.stringify({ ok: true, method: "gmail" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (gmailError) {
        console.error("❌ Gmail también falló:", gmailError);
        throw new Error(`Resend y Gmail fallaron. Resend: ${resendApiKey ? "intentado" : "no configurado"}`);
      }
    }

    throw new Error("Ni Resend ni Gmail están configurados");
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

