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

// Manejar todas las rutas SPA: redirigir a index.html
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
});
});
