import nodemailer from "npm:nodemailer@6.10.1";

interface NotificationRequest {
  destinatario: string;
  cc?: string;
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
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    const fromName = Deno.env.get("MAIL_FROM_NAME") ?? "Intranet de CSFR";

    if (!gmailUser || !gmailAppPassword) {
      throw new Error("Faltan secretos GMAIL_USER o GMAIL_APP_PASSWORD");
    }

    const payload = (await req.json()) as NotificationRequest;

    if (!payload.destinatario || !payload.asunto || !payload.cuerpo_html || !payload.cuerpo_texto) {
      return new Response(JSON.stringify({ error: "Faltan campos obligatorios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    await transporter.sendMail({
      from: `"${fromName}" <${gmailUser}>`,
      to: payload.destinatario,
      cc: payload.cc || undefined,
      subject: payload.asunto,
      text: payload.cuerpo_texto,
      html: payload.cuerpo_html,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
