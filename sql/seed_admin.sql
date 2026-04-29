-- Seed admin user for the temporary plain-text login flow
-- Run in Supabase SQL editor after the usuarios table exists

INSERT INTO public.usuarios (email, nombre, password, rol, departamento, telefono, created_at, updated_at)
VALUES (
  'admin@csfr.cl',
  'Admin',
  'Admin123',
  'admin',
  NULL,
  NULL,
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE
SET nombre = EXCLUDED.nombre,
    password = EXCLUDED.password,
    rol = EXCLUDED.rol,
    updated_at = now();
