import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');

console.log(`📁 Sirviendo desde: ${distPath}`);
console.log(`🚀 Iniciando servidor en puerto ${PORT}...`);

// Middleware para loggear requests
app.use((req, res, next) => {
  console.log(`📍 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Servir archivos estáticos desde la carpeta dist
// fallthrough: true es CRÍTICO - permite que pase al siguiente middleware si no encuentra el archivo
app.use(express.static(distPath, {
  maxAge: '1h',
  etag: false,
  fallthrough: true
}));

// Manejo de rutas: redirige dinámicas a /, sirve index.html para /
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.error(`❌ index.html NO encontrado en: ${indexPath}`);
    return res.status(404).send('index.html no encontrado en dist/');
  }
  
  if (req.path === '/') {
    // Ruta raíz: servir index.html
    console.log(`✅ Sirviendo index.html para /`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.sendFile(indexPath);
  }
  
  // Cualquier otra ruta: redirigir a / con código 301
  console.log(`🔄 Redirección 301: ${req.path} → /`);
  res.status(301).redirect('/');
});

app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en puerto ${PORT}`);
  console.log(`✅ Rutas dinámicas redirigen a / (código 301)`);
  console.log(`✅ Archivos estáticos servidos desde dist/`);
});
