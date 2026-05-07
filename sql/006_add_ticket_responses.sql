-- Agregar campos de respuesta a la tabla tickets para permitir que admins respondan directamente

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS respuesta text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS respondido_por uuid references usuarios(id) on delete set null;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS respondido_en timestamptz;

-- Crear índice para búsquedas más rápidas
CREATE INDEX IF NOT EXISTS idx_tickets_estado_respondido ON tickets (estado, respondido_en DESC);
