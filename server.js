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

// Redirigir CUALQUIER otra ruta a home (/)
// Esto incluye rutas dinámicas, subrutas inexistentes, etc.
app.get('*', (req, res) => {
  if (req.path === '/') {
    // Si es la ruta raíz, servir index.html
    const indexPath = path.join(distPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send('index.html no encontrado en dist/');
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.sendFile(indexPath);
  }
  
  // Todas las demás rutas: redirect 301 a /
  console.log(`🔄 Redirección: ${req.path} → /`);
  res.redirect(301, '/');
});

app.listen(PORT, () => {
  console.log(`✅ Servidor ejecutando en puerto ${PORT}`);
  console.log(`✅ Rutas dinámicas redirigen a / (código 301)`);
  console.log(`📁 Sirviendo desde: ${distPath}`);
});
