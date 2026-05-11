// Prueba directa con Resend (sin Edge Function)
// Necesita: npm install resend

import("resend").then(async (module) => {
  const { Resend } = module;

  const RESEND_API_KEY = "re_xxxxxx"; // REEMPLAZA CON TU API KEY
  
  if (!RESEND_API_KEY || RESEND_API_KEY === "re_xxxxxx") {
    console.error("❌ ERROR: Debes reemplazar RESEND_API_KEY con tu clave real");
    console.log("\nPasos:");
    console.log("1. Ve a https://resend.com/api-keys");
    console.log("2. Copia tu API Key (comienza con 're_')");
    console.log("3. Reemplaza 're_xxxxxx' en este archivo");
    process.exit(1);
  }

  try {
    console.log("🔄 Conectando a Resend...");
    const resend = new Resend(RESEND_API_KEY);

    const result = await resend.emails.send({
      from: "Intranet CSFR <reservas@csfr.cl>",
      to: "riddimrootsAI@gmail.com",
      subject: "✅ Prueba Directa de Resend",
      html: `
        <html>
          <body style="font-family: Arial, sans-serif;">
            <h2>✅ Prueba Directa de Resend</h2>
            <p>Este correo fue enviado directamente desde Resend, sin Edge Function.</p>
            <p><strong>Si lo recibiste, Resend está funcionando correctamente ✅</strong></p>
            <p>Hora: ${new Date().toLocaleString("es-CL")}</p>
          </body>
        </html>
      `,
      text: "Prueba directa de Resend",
    });

    console.log("✅ Email enviado exitosamente!");
    console.log("Response ID:", result.id);
    console.log("\n📋 Ahora el problema está en:");
    console.log("❌ La Edge Function de Supabase");
    console.log("❌ O la configuración de secrets en Supabase");
  } catch (error) {
    console.error("❌ Error de Resend:");
    console.error(error.message);
    process.exit(1);
  }
}).catch(err => {
  console.error("❌ Error al importar Resend:", err.message);
  console.log("\nInstala Resend con: npm install resend");
  process.exit(1);
});
