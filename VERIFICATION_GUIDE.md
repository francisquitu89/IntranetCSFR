# 🧪 Guía Rápida de Verificación

## ✅ Pre-Launch Checklist

Antes de hacer commit y push, verifica estos puntos en tu máquina:

### 1. Corre la app en modo desarrollo

```bash
cd c:\Users\DELL\intranetCSFR\IntranetCSFR
npm run dev
```

✅ Debería compilar sin errores
- Si ves errores de TypeScript, solucionarlos primero
- Abre en navegador: http://localhost:5173

### 2. Test: Crear reserva de espacio

1. Inicia sesión como **profesor** o **estudiante**
2. Ve a **"Mis reservas"**
3. Haz clic en **"Nueva reserva"**
4. Selecciona:
   - Botón: **"Reservar Espacio"**
   - Sala: **"Auditorio Chico"**
   - Fecha: **mañana** (o cualquier día)
   - Horario inicio: **08:15 - 09:00**
   - Horario fin: **09:00 - 09:45**
5. Haz clic **"Guardar reserva"**

**Resultado esperado:**
- ✅ Se guarda sin error
- ✅ La tarjeta aparece **inmediatamente** en "Mis reservas"
- ✅ Muestra:
  - Sala: "Auditorio Chico"
  - Estado: "confirmada"
  - **Correo:** (tu email)
  - **Usuario:** (tu nombre)
  - **Rol:** profesor
  - Fecha y hora

---

### 3. Test: Crear préstamo de equipo

1. Ve a **"Mis reservas"**
2. Haz clic en **"Nueva reserva"**
3. Selecciona:
   - Botón: **"Préstamo (Tablet/Notebook)"** ← ⚠️ Importante
   - Equipo: **"Préstamo de Tablets"**
4. Haz clic **"Guardar reserva"**

**Resultado esperado:**
- ✅ Se guarda sin error
- ❌ NO debe decir: "Debes completar el horario de inicio y fin."
- ✅ Aparece en "Mis reservas" inmediatamente

---

### 4. Test: Ver correo + rol en tablero

1. Desplázate en "Mis reservas" → sección **"Disponibilidad de espacios"**
2. Busca una celda roja (ocupada)
3. Pasa el mouse sobre ella → tooltip

**Resultado esperado:**
- ✅ Tooltip muestra:
  ```
  Auditorio Chico ocupado
  08:15 - 09:00
  Reservado por: Juan Pérez (profesor)
  Correo: juan@mail.com
  ```

---

### 5. Test: Funcionario ve todas las reservas

1. Abre sesión de **funcionario** (o crea usuario con rol funcionario)
2. Ve a **"Mis reservas"**
3. Baja al final

**Resultado esperado:**
- ✅ Aparece sección: **"Todas las reservas del día (fecha)"**
- ✅ Muestra todas las reservas de todos los usuarios
- ✅ Cada una incluye correo y rol del reservante

---

### 6. Test: Editar reserva

1. En "Mis reservas", busca una tarjeta de reserva
2. Haz clic en botón **"Editar"**
3. Cambia la descripción
4. Haz clic **"Guardar"**

**Resultado esperado:**
- ✅ Se actualiza inmediatamente
- ✅ No requiere refresh

---

### 7. Test: Control de inventario (Funcionario)

1. Inicia como **funcionario**
2. Ve a **"Mis reservas"** → sección **"Equipos disponibles para préstamo"**
3. Busca tarjeta "Préstamo de Notebooks"
4. Haz clic en botón **"+"** varias veces

**Resultado esperado:**
- ✅ El número de "Capacidad" aumenta
- ✅ Se actualiza inmediatamente
- ✅ No requiere refresh

---

### 8. Test: Botón de retroceso

1. Navega a cualquier página (Reservas, Tickets, etc.)
2. Arriba a la izquierda verás botón con **flecha ← Volver**

**Resultado esperado:**
- ✅ Botón existe en todas las páginas
- ✅ Al clickear, regresa a página anterior

---

### 9. Test: Live update en tiempo real

**Opción A: Dos navegadores**

Terminal 1:
```bash
npm run dev
```

1. Abre browser1: http://localhost:5173
2. Abre browser2: http://localhost:5173
3. Login en browser1 como usuario A
4. Login en browser2 como usuario B (diferente)
5. En browser1: crea una reserva
6. Mira browser2 **sin hacer refresh**

**Resultado esperado:**
- ✅ La reserva nueva aparece en browser2 inmediatamente (sin refresh)
- ✅ En console (F12) verás: `Nueva reserva insertada: ...`

**Opción B: Una sesión, abrir en incógnito**
1. Abre Firefox + Chrome
2. En ambos abre la app
3. Mismo usuario en ambos
4. En Firefox: crea reserva
5. Mira Chrome sin refresh

---

### 10. Test: Compilar para producción

```bash
npm run build
```

**Resultado esperado:**
- ✅ Sin errores
- ✅ Crea carpeta `dist/` con archivos estáticos
- ✅ Muestra: `✓ built in XXXms`

---

## ❌ Errores Comunes y Soluciones

### Error: "TypeScript errors found"
```
❌ npm run dev falla con errores TS
```

**Solución:**
- Abre cada archivo en VSCode
- Haz hover sobre el error rojo
- Arregla manualmente o ejecuta:
  ```bash
  npm run lint -- --fix
  ```

---

### Error: "Usuario_email es undefined"
```
❌ En la reserva no muestra el correo
```

**Solución:**
- Verifica que el usuario tiene email en la BD
- En Supabase:
  ```sql
  SELECT id, email, nombre FROM usuarios WHERE email IS NULL;
  ```
- Actualiza usuarios sin email

---

### Error: "Reserva aparece lenta (5-10 segundos después)"
```
❌ La live update tarda mucho
```

**Solución:**
- Normal si tu BD está lejos geográficamente
- Si tarda >10s, verificar RLS:
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'reservas';
  ```

---

### Error: "Funcionario no ve la sección global"
```
❌ El rol no es "funcionario"
```

**Solución:**
- Verificar en BD:
  ```sql
  SELECT id, nombre, rol FROM usuarios WHERE nombre LIKE '%test%';
  ```
- Actualizar: `UPDATE usuarios SET rol = 'funcionario' WHERE id = '...'`

---

## 📊 Checklist Final Antes de Commit

```bash
✅ npm run dev compila sin errores
✅ Puedo crear reserva de espacio
✅ Puedo crear préstamo sin error de horarios
✅ Veo correo + rol en reserva
✅ Veo correo + rol en tooltip de tablero
✅ Funcionario ve "Todas las reservas del día"
✅ Live update funciona (cambios aparecen sin refresh)
✅ Botón Editar funciona
✅ Botones +/- de inventario funcionan
✅ Botón "Volver" existe en todas las páginas
✅ npm run build crea dist/ sin errores
```

Si TODOS ✅, procede a:

```bash
git add .
git commit -m "feat: mostrar correo y rol en reservas, live updates mejorado, vista global para funcionarios"
git push origin main
```

---

## 🚀 Post-Deploy en Render

Después de que Render compile:

1. Ve a tu URL en Render
2. Inicia sesión
3. Repite tests 1-10 en producción
4. ✅ Todo debe funcionar igual que en desarrollo

**Si algo no funciona:**
- Abre DevTools (F12) → Console
- Busca errores en rojo
- Reporta el error exacto

---

**¡Listo para validar todo! 🎉**
