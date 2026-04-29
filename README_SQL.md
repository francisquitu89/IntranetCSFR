Resumen y pasos rápidos — SQL / Emails

1) Ejecutar SQL en Supabase
- Abre el SQL editor de Supabase
- Ejecuta el contenido de `sql/schema.sql` y luego `sql/triggers.sql`

2) Cómo funciona el envío de correo
- La trigger `trg_after_insert_reserva` inserta una fila en `notificaciones` cuando se crea una reserva.
- Un servicio backend (Edge Function o script) debe procesar `notificaciones` con estado 'pendiente' y enviar el correo.

3) Usar tu Gmail (confirmacionreservascsfr@gmail.com)
- Gmail no permite contraseñas normales para apps; necesitas:
  - Habilitar 2FA en la cuenta Gmail
  - Crear un "App Password" (desde Seguridad → Contraseñas de aplicaciones)
  - Usar ese app password como `SMTP_PASS` y `SMTP_USER` = tu email
- Alternativa (recomendada): usar un servicio transactional como SendGrid, Mailgun o Postmark (mejor escalabilidad y deliverability).

4) Edge Function / Script de ejemplo
- `functions/sendNotification/index.ts` contiene un ejemplo con `nodemailer` y supabase-js.
- Variables de entorno necesarias (en el entorno seguro del servidor):
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - `SMTP_HOST` (smtp.gmail.com), `SMTP_PORT` (465), `SMTP_USER` (tu Gmail), `SMTP_PASS` (app password)

5) Importar lista de usuarios
- Prepara un CSV con columnas: `email,nombre,rol,departamento,telefono,password` (password opcional)
- Usa `scripts/import_users.ts` con las variables de entorno `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
  Ejemplo:

```bash
# Usa Node + ts-node o compila antes
export SUPABASE_URL="https://..."
export SUPABASE_SERVICE_ROLE_KEY="<SERVICE_ROLE_KEY>"
node ./scripts/import_users.js users.csv
```

6) Notas de seguridad
- Mantén `SERVICE_ROLE_KEY` fuera del cliente (solo en servidor/edge functions).
- No uses la clave pública (anon) para crear usuarios o ejecutar acciones admin.

Si quieres, procedo a:
- (A) Generar y ejecutar el SQL en tu proyecto Supabase (necesito acceso/credenciales o te doy el script listo).
- (B) Preparar y desplegar la Edge Function en Supabase con el código de `functions/sendNotification` (necesitarás subir `SMTP_PASS` y `SERVICE_ROLE_KEY` como secretos).
- (C) Ejecutar el import de usuarios si subes el CSV aquí o me das la lista.

Qué prefieres que haga ahora?