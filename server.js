import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');

console.log(`\n========== INTRANET SSFF SERVER STARTUP ==========`);
console.log(`📁 Dist path: ${distPath}`);
console.log(`🔌 Port: ${PORT}`);
console.log(`🌍 Node ENV: ${process.env.NODE_ENV}`);
console.log(`📅 Start time: ${new Date().toISOString()}`);
console.log(`⚠️  THIS MESSAGE PROVES EXPRESS SERVER IS RUNNING ⚠️`);

// Verificar que dist/ existe
if (!fs.existsSync(distPath)) {
  console.error(`❌ ERROR: dist folder not found at ${distPath}`);
  process.exit(1);
}

// Verificar que index.html existe
const indexPath = path.join(distPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error(`❌ ERROR: index.html not found at ${indexPath}`);
  process.exit(1);
}

console.log(`✅ dist/ folder found`);
console.log(`✅ index.html found`);
console.log(`================================================\n`);

// Middleware para loggear TODAS las requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - Agent: ${req.get('user-agent')?.substring(0, 50)}`);
  next();
});

// SERVIR ARCHIVOS ESTÁTICOS
// CRÍTICO: Servir archivos con cache headers apropiados
console.log(`📦 Mounting express.static for ${distPath}`);
app.use(express.static(distPath, {
  maxAge: '1d',
  immutable: true,
  fallthrough: true  // CRÍTICO - permite que siga al catchall
}));

// CATCHALL PARA TODAS LAS RUTAS - SPA ROUTING
// Este middleware DEBE ejecutarse SIEMPRE para SPA routing
app.use((req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ⭐ Serving index.html for: ${req.method} ${req.path}`);
  
  res.type('text/html; charset=utf-8');
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`[${timestamp}] ❌ Error serving index.html:`, err);
      res.status(500).send('Error');
    }
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ SERVER IS NOW ACTIVE`);
  console.log(`✅ Listening on 0.0.0.0:${PORT}`);
  console.log(`✅ Ready to handle requests`);
  console.log(`\n🔗 Test: https://intranetcsfr.onrender.com/`);
  console.log(`🔗 Test: https://intranetcsfr.onrender.com/reservas (should redirect to /)`);
  console.log(`\n`);
});

// Manejar shutdown gracefully
process.on('SIGTERM', () => {
  console.log('\n📴 SIGTERM signal received');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
