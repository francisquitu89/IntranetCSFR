// Script de prueba para enviar correo via Supabase Edge Function
// Ejecuta con: node test-email.js

const SUPABASE_URL = "https://sasjgvxejhyvjvllwxbg.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhc2pndnhlamh5dmp2bGx3eGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzM5MTI4NSwiZXhwIjoyMDkyOTY3Mjg1fQ.M7ptmr3YxjFQkXn481sFPpPdBOAzrk7bTqeqNElDTgI";
const SUPABASE_ANON_KEY = "sb_publishable_MrPjM0RwlsJ3vXAKHNFQBQ_u977MsJf";

async function testEmail() {
  const functionUrl = `${SUPABASE_URL}/functions/v1/send-notification`;

  const payload = {
    destinatario: "riddimrootsAI@gmail.com", // Cambia a tu email
    cc: "reservas@csfr.cl",
    asunto: "🧪 Prueba de Correo - Intranet CSFR",
    cuerpo_html: `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h2>✅ Prueba de Envío de Correo</h2>
          <p>Este es un correo de prueba para verificar que el sistema de notificaciones está funcionando correctamente.</p>
          <p><strong>Fecha/Hora:</strong> ${new Date().toLocaleString("es-CL")}</p>
          <p>Si recibiste este correo, la configuración es correcta ✅</p>
        </body>
      </html>
    `,
    cuerpo_texto: "Prueba de envío de correo - Si lo recibiste, todo está funcionando",
  };

  console.log("🔄 Enviando correo de prueba...");
  console.log(`📧 Destinatario: ${payload.destinatario}`);
  console.log(`📨 Desde: reservas@csfr.cl`);

  try {
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        destinatario: payload.destinatario,
        cc: payload.cc ?? DEFAULT_CC_EMAIL,
        asunto: payload.asunto,
        cuerpo_html: payload.cuerpo_html,
        cuerpo_texto: payload.cuerpo_texto,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Error al enviar correo:");
      console.error(`Status: ${response.status}`);
      console.error(`Response:`, JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log("✅ Correo enviado exitosamente!");
    console.log(`Método usado: ${data.method}`);
    console.log("\n📋 Próximos pasos:");
    console.log("1. Verifica tu bandeja de entrada");
    console.log("2. Si no llega en 2 minutos, revisa la carpeta de SPAM");
    console.log("3. Revisa los logs en Supabase: Edge Functions → send-notification → Logs");
  } catch (error) {
    console.error("❌ Error de conexión:");
    console.error(error.message);
    process.exit(1);
  }
}

testEmail();
