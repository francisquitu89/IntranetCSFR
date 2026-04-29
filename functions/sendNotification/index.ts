import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// This is an example Edge Function / server script that processes pending notifications
// Use a secure environment with your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || SMTP_PORT === 465;
const SMTP_USER = process.env.SMTP_USER!; // confirmacionreservascsfr@gmail.com
const SMTP_PASS = process.env.SMTP_PASS!; // app password or oauth token

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

async function processNotifications() {
  // Get pending notifications
  const { data: notifs, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: true })
    .limit(20);

  if (error) {
    console.error('Error fetching notifications', error);
    return;
  }

  for (const n of notifs || []) {
    try {
      await transporter.sendMail({
        from: `SSFF Intranet <${SMTP_USER}>`,
        to: n.destinatario,
        cc: n.cc || undefined,
        subject: n.asunto,
        html: n.cuerpo_html || undefined,
        text: n.cuerpo_text || undefined,
      });

      // mark as sent
      await supabase
        .from('notificaciones')
        .update({ estado: 'enviado', intentos: (n.intentos || 0) + 1, error_text: null })
        .eq('id', n.id);

      console.log('Sent notification', n.id, 'to', n.destinatario);
    } catch (err: any) {
      console.error('Error sending notification', n.id, err?.message || err);
      await supabase
        .from('notificaciones')
        .update({ estado: 'error', intentos: (n.intentos || 0) + 1, error_text: err?.message || 'unknown error' })
        .eq('id', n.id);
    }
  }
}

// If you want to run as a standalone Node script
if (require.main === module) {
  processNotifications().then(() => process.exit()).catch(() => process.exit(1));
}

export default async function handler(req: any, res: any) {
  try {
    await processNotifications();
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err) });
  }
}
