-- Seed individual for franciscosotomayor2002@gmail.com
-- Temporary password: admin123

INSERT INTO public.usuarios (email, nombre, password, rol, created_at, updated_at)
VALUES (
  'franciscosotomayor2002@gmail.com',
  'franciscosotomayor2002',
  'admin123',
  'profesor',
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE
SET nombre = EXCLUDED.nombre,
    password = EXCLUDED.password,
    rol = EXCLUDED.rol,
    updated_at = now();
