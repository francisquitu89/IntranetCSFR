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
  console.log(`[${timestamp}] ${req.method} ${req.path} - User-Agent: ${req.get('user-agent')?.substring(0, 50)}`);
  next();
});

// Middleware para detectar problemas
app.use((req, res, next) => {
  // Log para detectar si llegamos aquí
  if (req.path.startsWith('/reservas') || req.path.startsWith('/tickets') || req.path.startsWith('/admin')) {
    console.log(`🔍 SPECIAL ROUTE DETECTED: ${req.path}`);
  }
  next();
});

// SERVIR ARCHIVOS ESTÁTICOS
// fallthrough: true es CRÍTICO - sin esto, express.static() devuelve 404 y NO pasa al siguiente middleware
console.log(`📦 Mounting express.static(${distPath}) with fallthrough: true`);
app.use(express.static(distPath, {
  maxAge: '1h',
  etag: false,
  fallthrough: true  // ← CRÍTICO: permite que requests inexistentes pasen al app.get('*')
}));

// CATCHALL HANDLER PARA RUTAS DINÁMICAS
// Este middleware debe recibir TODAS las rutas que no sean archivos estáticos
app.get('*', (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🎯 CATCHALL HANDLER triggered for: ${req.path}`);
  
  if (req.path === '/') {
    // Ruta raíz: servir index.html
    console.log(`[${timestamp}] ✅ Serving index.html for /`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(indexPath);
  }
  
  // Cualquier otra ruta: redirigir a / con código 301
  console.log(`[${timestamp}] 🔄 REDIRECT 301: ${req.path} → /`);
  res.status(301).set('Location', '/').end();
});

// ERROR HANDLER
app.use((err, req, res, next) => {
  console.error(`❌ ERROR: ${err.message}`);
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

app.listen(PORT, () => {
  console.log(`\n✅ SERVER READY`);
  console.log(`✅ Listening on port ${PORT}`);
  console.log(`✅ Static files: ${distPath}`);
  console.log(`✅ SPA routing: enabled (all unknown routes → /)`);
  console.log(`✅ Fallthrough: enabled`);
  console.log(`\n`);
});
