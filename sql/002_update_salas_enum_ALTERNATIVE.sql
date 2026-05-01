-- Script ALTERNATIVO para actualizar salas (si no tienes permisos de superuser)
-- OPCIÓN 2: Sin modificar el enum (requiere menos permisos)

-- Si recibes error: "must be owner of type sala_type"
-- Usa este script ALTERN ATIVO que mantiene el enum viejo y crea una tabla de mapeo

-- Opción 2A: Usar tabla de salas como fuente de verdad (recomendado para dev)
create table if not exists salas_catalogo (
  id serial primary key,
  sala_nombre text not null unique,
  label text not null,
  capacidad integer not null,
  tipo text not null check (tipo in ('Espacio', 'Objeto')),
  habilitada boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Agregar RLS
alter table salas_catalogo enable row level security;

drop policy if exists "salas_select_all" on salas_catalogo;
create policy "salas_select_all"
  on salas_catalogo
  for select
  using (true);

-- Trigger
drop trigger if exists trg_salas_catalogo_touch on salas_catalogo;
create trigger trg_salas_catalogo_touch before update on salas_catalogo for each row execute function touch_updated_at();

-- Insertar catálogo completo
insert into salas_catalogo (sala_nombre, label, capacidad, tipo, habilitada) values
  ('Auditorio Chico', 'Auditorio Chico', 40, 'Espacio', true),
  ('Auditorio Grande', 'Auditorio Grande', 52, 'Espacio', true),
  ('Biblioteca (Cuenta Cuentos)', 'Biblioteca (Cuenta Cuento)', 40, 'Espacio', true),
  ('Biblioteca2', 'Biblioteca2', 40, 'Espacio', true),
  ('Biblioteca', 'Biblioteca', 50, 'Espacio', true),
  ('Biblioteca (mesas trabajo)', 'Biblioteca (mesas trabajo)', 50, 'Espacio', true),
  ('Capilla', 'Capilla', 34, 'Espacio', true),
  ('Sala VIP', 'Sala VIP', 12, 'Espacio', true),
  ('Laboratorio Ciencias', 'Laboratorio Ciencias', 50, 'Espacio', true),
  ('Sala 33', 'Sala 33 (Llave P Loosli)', 10, 'Espacio', true),
  ('Sala Computación', 'Sala Computación', 27, 'Espacio', true),
  ('Sala Gimnasio', 'Sala Gimnasio', 20, 'Espacio', true),
  ('Sala Pastoral Juvenil', 'Sala Pastoral Juvenil', 3, 'Espacio', true),
  ('Préstamo Notebooks', 'Préstamo de Notebooks', 30, 'Objeto', true),
  ('Préstamo Tablets', 'Préstamo de Tablets', 59, 'Objeto', true)
on conflict (sala_nombre) do update set 
  label = excluded.label,
  capacidad = excluded.capacidad,
  tipo = excluded.tipo,
  habilitada = excluded.habilitada;

-- Nota: Esta opción mantiene compatible con el código actual 
-- ya que la data de salas se cargan desde el frontend en SALAS_CATALOGO
