-- Agregar columna cantidad a la tabla reservas
-- Ejecutar en Supabase SQL editor DESPUÉS de 006_add_ticket_responses.sql

ALTER TABLE reservas
ADD COLUMN IF NOT EXISTS cantidad INTEGER DEFAULT 1;

-- Crear índice para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_reservas_cantidad ON reservas(cantidad);

-- Comentario explicativo
COMMENT ON COLUMN reservas.cantidad IS 'Cantidad de equipos o espacios reservados';
