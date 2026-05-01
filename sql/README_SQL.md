# SQL Scripts de Actualización - Intranet CSFR

Este directorio contiene los scripts SQL necesarios para configurar y actualizar la base de datos en Supabase.

## Archivos

### 1. `001_create_inventario.sql` ⭐ OBLIGATORIO
Crea la tabla `inventario` para gestionar las cantidades disponibles de Notebooks y Tablets.

**Contiene:**
- Tabla `inventario` con columnas: `sala` (text, primary key), `cantidad` (integer)
- Policies de Row Level Security (RLS)
- Trigger para actualizar `updated_at`
- Datos iniciales: 30 Notebooks, 59 Tablets

**Este script DEBE ejecutarse primero.** Resuelve el error:
- `Could not find the table 'public.inventario' in the schema cache`

---

### 2. `002_update_salas_enum.sql` (Opción preferida si eres owner)
Actualiza el enum `sala_type` para incluir TODAS las salas.

**Requisitos:** Necesitas permisos de superuser en Supabase

**Contiene:**
- Recreación del enum `sala_type` con todos los valores
- Migración de datos existentes en reservas y tickets
- Tabla `salas_catalogo` para referencia de metadatos
- Datos iniciales con las 15 salas completas

---

### 3. `002_update_salas_enum_ALTERNATIVE.sql` (Si NO tienes permisos de superuser)
Versión alternativa que NO modifica el enum.

**Requisitos:** Solo necesitas permisos normales de usuario

**Nota:** Los datos de salas ya se cargan desde el frontend (SALAS_CATALOGO), así que esta tabla es complementaria.

---

## Instrucciones Rápidas

### ✅ Paso 1: PRIMERO ejecuta `001_create_inventario.sql`

1. Ve a https://supabase.com/dashboard
2. Abre tu proyecto → **SQL Editor**
3. Haz clic en **+ New Query**
4. Copia TODO el contenido de `001_create_inventario.sql`
5. Pega en el editor
6. Haz clic en **Run** (esquina superior derecha)
7. Espera a ver **Success** ✓

**Resultado esperado:**
- Tabla `inventario` con 2 filas (Notebooks: 30, Tablets: 59)

---

### ✅ Paso 2: Elige UNA de las opciones de salas

#### OPCIÓN A: Si eres owner del proyecto (recomendado)
1. Copia TODO `002_update_salas_enum.sql`
2. Pega en un **+ New Query**
3. Haz clic en **Run**
4. Espera a ver **Success** ✓

**Beneficio:** El enum estará sincronizado y validado en BD

---

#### OPCIÓN B: Si NO eres owner
1. Copia TODO `002_update_salas_enum_ALTERNATIVE.sql`
2. Pega en un **+ New Query**
3. Haz clic en **Run**
4. Espera a ver **Success** ✓

**Nota:** Los datos de salas siguen cargándose desde el frontend, esto solo agrega tabla de referencia.

---

### ✅ Paso 3: Verifica en la aplicación

- Recarga la web (Ctrl+F5 o Cmd+Shift+R)
- Intenta crear una reserva de **Préstamo (Tablet/Notebook)**
- ❌ NO debería decir "Debes completar el horario de inicio y fin"
- ✓ Deberías ver campos para cantidad si eres funcionario/admin
- ✓ Los botones +/- en Préstamo deberían funcionar

---

## Cambios en el Código (Frontend)

Se realizaron cambios en `src/pages/ReservasPage.tsx`:

| Cambio | Antes | Después |
|--------|-------|---------|
| Validación horarios | Siempre requerido | Solo para Espacios |
| Typo en llamada API | `criarReserva()` | `crearReserva()` ✓ |
| Edición de reservas | No había | Botón "Editar" ✓ |
| Control de inventario | No había | Botones +/- para funcionarios ✓ |

---

## Tabla de Salas Incluidas

| Nombre | Tipo | Capacidad |
|--------|------|-----------|
| Auditorio Chico | Espacio | 40 pers. |
| Auditorio Grande | Espacio | 52 pers. |
| Biblioteca (Cuenta Cuentos) | Espacio | 40 pers. |
| Biblioteca2 | Espacio | 40 pers. |
| Biblioteca | Espacio | 50 pers. |
| Biblioteca (mesas trabajo) | Espacio | 50 pers. |
| Capilla | Espacio | 34 pers. |
| Sala VIP | Espacio | 12 pers. |
| Laboratorio Ciencias | Espacio | 50 pers. |
| Sala 33 | Espacio | 10 pers. |
| Sala Computación | Espacio | 27 pers. |
| Sala Gimnasio | Espacio | 20 pers. |
| Sala Pastoral Juvenil | Espacio | 3 pers. |
| **Préstamo Notebooks** | **Objeto** | **30 unidades** |
| **Préstamo Tablets** | **Objeto** | **59 unidades** |

---

## Preguntas Frecuentes

**P: ¿Cuál script debo ejecutar primero?**
R: SIEMPRE `001_create_inventario.sql`. Luego elige A o B.

**P: ¿Qué pasa si ejecuto ambos (A y B)?**
R: No hay problema, B sobrescribirá A de forma segura.

**P: ¿Por qué sigo viendo el error de inventario?**
R: 
1. Verifica que ejecutaste `001_create_inventario.sql`
2. Espera 30 segundos y recarga la web (Ctrl+F5)
3. Abre DevTools (F12) → Console y busca el error exacto

**P: ¿Puedo cambiar las cantidades después?**
R: Sí, de 3 formas:
- UI: Buttons +/- en la app (solo funcionarios/admin)
- SQL directo: `update inventario set cantidad = 25 where sala = 'Préstamo Notebooks';`
- API: El backend hace upsert automático

**P: ¿Qué pasa si tengo datos antigüos en reservas?**
R: No se pierden. El script de enum migra automáticamente los datos existentes.

**P: ¿Necesito hacer algo en Render?**
R: No. Solo haz commit y push a GitHub. Render redesplegará automáticamente.

---

## Troubleshooting

### Error: "must be owner of type sala_type"
- **Solución:** Usa `002_update_salas_enum_ALTERNATIVE.sql` en lugar de la versión normal

### Error: "Could not find the table 'public.inventario'"
- **Solución:** Ejecuta `001_create_inventario.sql`
- **Síntoma:** Aparece cuando intento crear préstamo
- **Causa:** Falta la tabla en BD

### Error: "function touch_updated_at() does not exist"
- **Solución:** Ejecuta primero `schema.sql` o crea la función:
  ```sql
  create or replace function touch_updated_at() returns trigger language plpgsql as $$
  begin
    new.updated_at = now();
    return new;
  end;
  $$;
  ```

### La app muestra error pero Supabase no
- **Solución:** Espera 30 segundos y recarga con Ctrl+F5 (hard refresh)
- **Razón:** Supabase cachea el schema

### ¿Cómo verificar que está bien?
```sql
-- Ver si existe la tabla
select * from inventario;

-- Ver si el enum tiene todas las salas
select enum_range(NULL::sala_type);

-- Ver datos actuales
select * from inventario;
select * from salas_catalogo;
```

---

## Próximos Pasos

1. ✅ Ejecuta los scripts SQL (1, luego A o B)
2. ✅ Recarga la app (Ctrl+F5)
3. ✅ Prueba crear un Préstamo
4. ✅ Haz commit y push a GitHub
5. ✅ Render redesplegará automáticamente

---

## Deploy en Render

Ya está configurado en `render.yaml`:
```yaml
services:
  - type: web
    name: intranet-ssff
    env: static
    branch: main
    buildCommand: "npm install && npm run build"
    publishPath: dist
```

**Instrucciones:**
1. Ve a https://render.com/dashboard
2. Haz clic en **New +** → **Static Site**
3. Conecta tu repositorio GitHub
4. Selecciona branch `main`
5. Render detectará `render.yaml` automáticamente
6. Espera a que compile (2-3 minutos)
7. Tu app estará en vivo en: `https://intranet-ssff.onrender.com` (o similar)
