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
// fallthrough: true es CRÍTICO - sin esto, express.static() devuelve 404 y NO pasa al siguiente middleware
console.log(`📦 Mounting express.static with fallthrough: true`);
app.use(express.static(distPath, {
  maxAge: '1h',
  etag: false,
  fallthrough: true  // CRÍTICO
}));

// CATCHALL PARA TODAS LAS RUTAS
// Este middleware DEBE ejecutarse SIEMPRE
app.get('*', (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ⭐ CATCHALL for: ${req.path}`);
  
  if (req.path === '/') {
    console.log(`[${timestamp}] 📄 Serving: index.html`);
    res.type('text/html; charset=utf-8');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(indexPath);
  }
  
  console.log(`[${timestamp}] 🔄 Redirecting: ${req.path} → /`);
  res.redirect(301, '/');
});

// POST y otros métodos también van a catchall
app.all('*', (req, res) => {
  console.log(`[${new Date().toISOString()}] 🔄 Catchall for ${req.method} ${req.path}`);
  if (req.path !== '/') {
    return res.redirect(301, '/');
  }
  res.type('text/html; charset=utf-8');
  return res.sendFile(indexPath);
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
