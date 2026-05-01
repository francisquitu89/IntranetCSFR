-- Agregar soporte para recurrencias en reservas
-- Ejecutar en Supabase SQL editor DESPUÉS de 003_fix_tickets_rls.sql

-- Agregar columnas para recurrencia a la tabla reservas (si no existen)
ALTER TABLE reservas
ADD COLUMN IF NOT EXISTS recurrence_type TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
ADD COLUMN IF NOT EXISTS recurrence_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS original_reserva_id UUID REFERENCES reservas(id) ON DELETE CASCADE;

-- Crear índice para búsquedas de recurrencias
CREATE INDEX IF NOT EXISTS idx_reservas_recurrence_type ON reservas(recurrence_type);
CREATE INDEX IF NOT EXISTS idx_reservas_original_id ON reservas(original_reserva_id);

-- Crear tabla para rastrear instancias de recurrencias
CREATE TABLE IF NOT EXISTS recurrence_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_reserva_id UUID NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  instance_date DATE NOT NULL,
  reserva_id UUID REFERENCES reservas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(original_reserva_id, instance_date)
);

-- Índice para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_recurrence_original ON recurrence_instances(original_reserva_id);
CREATE INDEX IF NOT EXISTS idx_recurrence_date ON recurrence_instances(instance_date);

-- Comentarios explicativos
COMMENT ON COLUMN reservas.recurrence_type IS 'Tipo de recurrencia: none, weekly, monthly, yearly';
COMMENT ON COLUMN reservas.recurrence_end_date IS 'Fecha en la que termina la recurrencia';
COMMENT ON COLUMN reservas.recurrence_count IS 'Número de veces que se repite (si 0, es infinito)';
COMMENT ON COLUMN reservas.original_reserva_id IS 'Si es una instancia de recurrencia, apunta a la reserva original';
COMMENT ON TABLE recurrence_instances IS 'Rastrea todas las instancias generadas de reservas recurrentes';
