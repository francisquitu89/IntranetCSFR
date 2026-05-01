# 🚀 Guía de Deploymente - Intranet CSFR

## ✅ Cambios Realizados

### Frontend (TypeScript/React)
- ✅ `src/pages/ReservasPage.tsx` - Validación condicional de horarios + edición de reservas + control de inventario
- ✅ `src/services/inventarioService.ts` - Nuevo servicio para consultar/actualizar cantidades
- ✅ `src/components/BackButton.tsx` - Botón de retroceso en todas las páginas
- ✅ `src/App.tsx` - Integración de BackButton

### Backend/SQL
- ✅ `sql/001_create_inventario.sql` - Tabla de inventario
- ✅ `sql/002_update_salas_enum.sql` - Enum completo + tabla salas_catalogo
- ✅ `sql/002_update_salas_enum_ALTERNATIVE.sql` - Versión sin permisos superuser
- ✅ `render.yaml` - Configuración para deploy en Render

### Documentación
- ✅ `sql/README_SQL.md` - Instrucciones detalladas SQL

---

## 📋 Errores Corregidos

| Error | Causa | Solución |
|-------|-------|----------|
| `Could not find the table 'public.inventario'` | Tabla no existía | Ejecutar `001_create_inventario.sql` |
| "Debes completar horario..." en préstamo | Validación siempre requerida | Solo valida para Espacios ahora |
| `reservasService.criarReserva is not a function` | Typo: `criarReserva` | Cambió a `crearReserva` |
| Salas incompletas en BD | Enum desactualizado | Script SQL actualiza enum |

---

## 🛠️ Pasos para Deployar

### Paso 1: Actualizar la Base de Datos (Supabase)

1. Abre https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** → **+ New Query**

**Ejecuta primero (OBLIGATORIO):**
```
[Copiar contenido completo de: sql/001_create_inventario.sql]
```

**Luego ejecuta UNO de estos:**

**OPCIÓN A (si eres owner):**
```
[Copiar contenido completo de: sql/002_update_salas_enum.sql]
```

**OPCIÓN B (si no eres owner):**
```
[Copiar contenido completo de: sql/002_update_salas_enum_ALTERNATIVE.sql]
```

✅ Espera a ver "Success" en cada query.

---

### Paso 2: Hacer Commit en Git

```bash
# En la terminal, en c:\Users\DELL\intranetCSFR
cd c:\Users\DELL\intranetCSFR\IntranetCSFR

# Ver cambios
git status

# Agregar todos los cambios
git add .

# Hacer commit
git commit -m "feat: permitir editar reservas, control inventario, botón retroceso, config Render"

# Ver el log
git log --oneline -5
```

---

### Paso 3: Push a GitHub

```bash
# Ver ramas remotas
git branch -a

# Push a la rama principal
git push origin main
```

O si tu rama se llama diferente:
```bash
git push origin tu-rama-nombre
```

---

### Paso 4: Deploy en Render

1. Ve a https://render.com/dashboard
2. Haz clic en **New +** → **Static Site**
3. **Conectar repositorio:**
   - Haz clic en **Connect account** (si es primera vez)
   - Selecciona `intranetCSFR` (o el nombre de tu repo)
   - Haz clic en **Connect**

4. **Configurar:**
   - **Name:** `intranet-ssff` (o tu nombre preferido)
   - **Branch:** `main`
   - **Build Command:** déjalo vacío (Render usa `render.yaml`)
   - **Publish directory:** déjalo vacío (Render usa `render.yaml`)

5. Haz clic en **Create Static Site**
6. Espera 2-3 minutos
7. Tu app estará en vivo en la URL que te muestre

---

## 🧪 Verificación Local (Opcional)

Antes de hacer push, puedes probar localmente:

```bash
# En c:\Users\DELL\intranetCSFR\IntranetCSFR
npm run build

# Verificar que build pasó sin errores
# Debería crear carpeta 'dist' con archivos estáticos
```

---

## ✔️ Checklist Pre-Deploy

- [ ] Ejecutaste `001_create_inventario.sql` en Supabase
- [ ] Ejecutaste `002_update_salas_enum.sql` O `ALTERNATIVE.sql`
- [ ] Recargaste la app local (Ctrl+F5)
- [ ] Probaste crear un Préstamo (sin error de horarios)
- [ ] Probaste +/- en inventario (como funcionario)
- [ ] Viste botón "Volver" (flecha) en las páginas
- [ ] Hiciste `git commit`
- [ ] Hiciste `git push`
- [ ] Creaste Static Site en Render

---

## 🆘 Troubleshooting

### Si Render dice "build error"
1. Abre el log de build (clic en "Logs")
2. Busca el error (generalmente último "error" o "failed")
3. Versiones comunes:
   - `Node not found`: Render usa Node 18+, está bien
   - `npm not found`: Espera, a veces tarda

### Si la app carga pero dice "error inventario"
1. Recarga con Ctrl+F5 (hard refresh)
2. Espera 30 segundos, recarga de nuevo
3. Abre DevTools (F12) → Console → busca el error exacto
4. Vuelve a ejecutar `001_create_inventario.sql`

### Si no ves los cambios en Render
1. Verifica que hiciste push (git log debe mostrar tu commit)
2. En Render, haz clic en **Deployments** → veras lista
3. Si no aparece tu commit, haz clic en **Manual Deploy**
4. Espera a que termine

### Permisos de Git
Si tienes error de permisos:
```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
git add .
git commit -m "..."
git push
```

---

## 📱 URL Final de la App

Una vez deployada en Render, verás algo como:
```
https://intranet-ssff.onrender.com
```

O en el dashboard de Render, en la tarjeta del proyecto.

---

## 🔄 Actualizar en el Futuro

Cada vez que hagas cambios:

```bash
git add .
git commit -m "descripción del cambio"
git push origin main
```

Render detectará automáticamente el push y redesplegará.

---

## 📞 Soporte

Si algo no funciona:
1. Revisa los **Logs** en Render (Deployments → clic en despliegue)
2. Revisa **DevTools** en el navegador (F12)
3. Verifica que ejecutaste **todos** los scripts SQL en orden
4. Intenta hard refresh: Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)

---

**¡Éxito con el despliegue! 🚀**
