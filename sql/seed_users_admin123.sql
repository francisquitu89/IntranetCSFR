-- Seed users with temporary plain-text password admin123
-- Run in Supabase SQL editor after public.usuarios exists

INSERT INTO public.usuarios (email, nombre, password, rol, created_at, updated_at)
VALUES
  ('ploosli@csfr.cl', 'ploosli', 'admin123', 'funcionario', now(), now()),
  ('soporte@csfr.cl', 'soporte', 'admin123', 'funcionario', now(), now()),
  ('biblioteca@csfr.cl', 'biblioteca', 'admin123', 'funcionario', now(), now()),
  ('servicios@csfr.cl', 'servicios', 'admin123', 'funcionario', now(), now()),
  ('pkrippel@csfr.cl', 'pkrippel', 'admin123', 'funcionario', now(), now()),
  ('dperez@csfr.cl', 'dperez', 'admin123', 'funcionario', now(), now()),
  ('emartinez@csfr.cl', 'emartinez', 'admin123', 'funcionario', now(), now()),
  ('franciscosotomayor2002@gmail.com', 'franciscosotomayor2002', 'admin123', 'profesor', now(), now())
ON CONFLICT (email) DO UPDATE
SET nombre = EXCLUDED.nombre,
    password = EXCLUDED.password,
    rol = EXCLUDED.rol,
    updated_at = now();
