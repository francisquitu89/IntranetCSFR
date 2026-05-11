# Instrucciones de Deploy a Render

## ✅ Lo que ya está configurado:

1. **Server Express (server.js)** - Sirve la SPA sin rutas
2. **Build configurado** - `npm run build` genera `/dist`
3. **SPA sin react-router-dom** - Todo funciona con estado local
4. **Supabase integrado** - Autenticación y base de datos funcional
5. **render.yaml** - Configuración de deploy automático

## 🚀 Pasos para Render:

### 1. Push a GitHub
```bash
git add .
git commit -m "SPA sin rutas - listo para producción"
git push origin main
```

### 2. En render.com:
- Crear nuevo **Web Service**
- Conectar el repositorio de GitHub
- Usar `main` como rama

### 3. Agregar Variables de Entorno en Render Dashboard:
```
VITE_SUPABASE_URL=https://sasjgvxejhyvjvllwxbg.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_MrPjM0RwlsJ3vXAKHNFQBQ_u977MsJf
NODE_ENV=production
```

### 4. Configuración automática:
- Build Command: `npm install && npm run build`
- Start Command: `node server.js`

## ✨ Features de esta SPA:

✅ Sin rutas tradicionales (/login, /reservas, etc.)
✅ Todo funciona con navegación por estado
✅ Supabase para auth y datos
✅ Compatible con Render
✅ Servidor Express maneja todas las rutas hacia index.html

## 📋 Verificación Final:

- ✅ server.js corregido
- ✅ render.yaml configurado
- ✅ Build funciona (`npm run build`)
- ✅ .env con Supabase
- ✅ SPA sin rutas tradicionales

**Listo para deployar. Solo push a GitHub y Render hará el deploy automático.**
