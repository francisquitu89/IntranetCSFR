import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');

// Servir archivos estáticos desde la carpeta dist con caché
app.use(express.static(distPath, {
  maxAge: '1h',
  etag: false
}));

// Rutas antiguas conocidas: redirigir explícitamente a home
// Esto proporciona un mejor SEO y es más claro
const rutasAntiguas = ['/reservas', '/tickets', '/admin'];
app.get(rutasAntiguas, (req, res) => {
  console.log(`🔄 Redirección de ruta antigua: ${req.path} → /`);
  res.redirect(301, '/');
});

// Manejar todas las demás rutas SPA: servir index.html
// Esto permite que React Router maneje la navegación interna
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  
  // Verificar que index.html existe
  if (!fs.existsSync(indexPath)) {
    return res.status(404).send('index.html no encontrado en dist/');
  }
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(indexPath);
});

app.listen(PORT, () => {
  console.log(`✅ Servidor ejecutando en puerto ${PORT}`);
  console.log(`✅ SPA routing configurado`);
  console.log(`📁 Sirviendo desde: ${distPath}`);
  console.log(`🔄 Redirecciones de rutas antiguas habilitadas: ${rutasAntiguas.join(', ')}`);
});
