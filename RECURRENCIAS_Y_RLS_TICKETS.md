# Solución: RLS en Tickets + Recurrencias en Reservas

## Problema 1: Error RLS en Tickets
**Error:** "new row violates row-level security policy for table tickets"

**Causa:** La tabla `tickets` tiene RLS habilitado pero no tenía políticas INSERT correctas.

**Solución:** Ejecutar `sql/003_fix_tickets_rls.sql` que:
- Crea política SELECT: usuarios ven sus propios tickets + admins ven todos
- Crea política INSERT: usuarios pueden crear tickets para ellos mismos
- Crea política UPDATE: usuarios actualizan sus propios tickets + admins

## Problema 2: Recurrencias en Reservas
**Requerimiento:** Poder reservar una misma fecha/horario semanalmente, mensualmente o anualmente.

**Solución Implementada:**

### 1. Base de Datos (archivo: `sql/004_add_recurrence_support.sql`)
Se agregan 3 nuevas columnas a la tabla `reservas`:
- `recurrence_type`: 'none', 'weekly', 'monthly', 'yearly'
- `recurrence_end_date`: fecha hasta la que se repite
- `recurrence_count`: cuántas veces se repite
- `original_reserva_id`: para vincular instancias recurrentes

Se crea tabla `recurrence_instances` para rastrear todas las instancias generadas.

### 2. Backend (archivo: `src/services/reservasService.ts`)
- Nueva función `generarFechasRecurrentes()` que calcula todas las fechas basadas en el tipo de recurrencia
- Método `crearReserva()` ahora acepta parámetros de recurrencia
- Si hay recurrencia, crea múltiples reservas automáticamente

### 3. Frontend (archivo: `src/pages/ReservasPage.tsx`)
Se agregaron campos al formulario de reservas:
- Selector "Repetir reserva": No repetir / Cada semana / Cada mes / Cada año
- Campo "Hasta (fecha final)": especifica hasta cuándo se repite
- Campo "O repetir (cantidad)": especifica cuántas veces se repite (máximo 52)

Estos campos solo aparecen para reservas de espacios, no para préstamo de objetos.

### 4. TypeScript Types (archivo: `src/types/index.ts`)
Se actualizó interfaz `Reserva` con los nuevos campos:
```typescript
recurrence_type?: "none" | "weekly" | "monthly" | "yearly";
recurrence_end_date?: string;
recurrence_count?: number;
original_reserva_id?: string;
```

## Pasos para Ejecutar

### Paso 1: Ejecutar SQL en Supabase

1. Abre tu proyecto en Supabase Dashboard
2. Ve a SQL Editor
3. Ejecuta primero: `sql/003_fix_tickets_rls.sql`
   - Esto soluciona el problema de crear tickets
4. Luego ejecuta: `sql/004_add_recurrence_support.sql`
   - Esto agrega soporte para recurrencias

**Importante:** Ejecuta en orden, uno por uno.

### Paso 2: Probar Localmente

```bash
cd c:\Users\DELL\intranetCSFR\IntranetCSFR
npm run dev
```

**Test 1: Crear Ticket**
1. Inicia sesión como cualquier usuario
2. Ve a "Mis tickets"
3. Haz clic en "Nuevo ticket"
4. Completa el formulario y guarda
5. Debe crearse sin error RLS

**Test 2: Crear Reserva Recurrente**
1. Ve a "Mis reservas"
2. Haz clic en "Nueva reserva"
3. Selecciona "Reservar Espacio"
4. Selecciona sala, fecha y horarios
5. En el selector "Repetir reserva", elige "Cada semana"
6. Ingresa una fecha final (ej: 3 meses adelante)
7. Haz clic en "Guardar reserva"
8. Debe crear múltiples instancias automáticamente

**Test 3: Verificar Múltiples Instancias**
1. Después de crear reserva recurrente
2. Cambia la fecha en el calendario
3. Navega a próximas semanas
4. Verás múltiples reservas en los mismos horarios

## Ejemplos de Uso

**Scenario 1: Reunión semanal**
- Sala: Sala VIP
- Fecha: 2026-05-01 (jueves)
- Horario: 10:00-11:00
- Repetir: Cada semana
- Hasta: 2026-08-31
- Resultado: Se crea reserva para cada jueves de mayo a agosto en Sala VIP

**Scenario 2: Clase mensual**
- Sala: Sala Computación
- Fecha: 2026-05-01 (primer día del mes)
- Horario: 14:00-16:00
- Repetir: Cada mes
- Cantidad: 6 veces
- Resultado: Se crea reserva para el 1 de cada mes, 6 veces

**Scenario 3: Evento anual**
- Sala: Auditorio Grande
- Fecha: 2026-05-01
- Horario: 09:00-12:00
- Repetir: Cada año
- Hasta: 2030-05-01
- Resultado: Se crea reserva para 2026, 2027, 2028, 2029, 2030

## Limitaciones y Notas

1. **Máximo 52 repeticiones:** El campo de cantidad acepta máximo 52 para evitar crear demasiadas reservas
2. **Solo espacios:** Las recurrencias solo funcionan para reservas de espacios, no para préstamo de objetos
3. **Inventario:** No afecta el inventario de tablets/notebooks
4. **Edición:** Si editas la reserva original, solo modifica esa instancia, no todas
5. **Eliminación:** Si eliminas la reserva original, todas las instancias también se eliminarán (por cascade)

## Validaciones Aplicadas

- No puede crear recurrencia sin especificar límite (fecha o cantidad)
- La fecha final debe ser posterior a la fecha inicial
- La cantidad debe ser al menos 1
- Máximo 52 repeticiones

## Archivos Modificados

- ✅ `src/types/index.ts` - Agregó campos de recurrencia a interfaz Reserva
- ✅ `src/services/reservasService.ts` - Agregó lógica de recurrencias
- ✅ `src/pages/ReservasPage.tsx` - Agregó UI para recurrencias
- ✅ `sql/003_fix_tickets_rls.sql` - NUEVO - Soluciona RLS en tickets
- ✅ `sql/004_add_recurrence_support.sql` - NUEVO - Agrega soporte para recurrencias

## Troubleshooting

**P: Aún me da error RLS al crear tickets**
R: Asegúrate de haber ejecutado `003_fix_tickets_rls.sql` y que el usuario esté autenticado (auth.uid() debe tener valor)

**P: Las recurrencias no aparecen en próximas fechas**
R: Verifica que se ejecutó `004_add_recurrence_support.sql` sin errores. Recarga la página (F5) para ver los cambios.

**P: Quiero eliminar solo una instancia de la recurrencia**
R: Aún no es posible. Edita la instancia para cambiar su contenido, o elimínala directamente (pero esto solo elimina esa instancia).

**P: ¿Puedo cambiar el tipo de recurrencia después de crear?**
R: Aún no. Debes eliminar y crear una nueva reserva.
