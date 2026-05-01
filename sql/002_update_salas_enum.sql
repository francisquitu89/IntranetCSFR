-- Script para actualizar el enum sala_type con TODAS las salas
-- IMPORTANTE: En Supabase, los enums no pueden modificarse directamente
-- Por eso, crearemos un nuevo enum y migraremos

-- Opción 1: Si puedes ejecutar como superuser (recomendado):
-- Eliminar y recrear el tipo enum con todos los valores

alter type public.sala_type rename to sala_type_old;

create type public.sala_type as enum (
  'Auditorio Grande',
  'Auditorio Chico',
  'Biblioteca (Cuenta Cuentos)',
  'Biblioteca (mesas trabajo)',
  'Biblioteca',
  'Biblioteca2',
  'Capilla',
  'Sala VIP',
  'Laboratorio Ciencias',
  'Sala 33',
  'Sala Computación',
  'Sala Gimnasio',
  'Sala Pastoral Juvenil',
  'Préstamo Notebooks',
  'Préstamo Tablets'
);

-- Convertir la columna sala de las tablas existentes al nuevo tipo
alter table reservas alter column sala type public.sala_type using (sala::text::public.sala_type);
alter table tickets alter column sala type public.sala_type using (sala::text::public.sala_type);

-- Eliminar el tipo viejo
drop type public.sala_type_old;

-- ============================================================================
-- Tabla de referencia: salas_catalogo (opcional, para metadata de salas)
-- ============================================================================
create table if not exists salas_catalogo (
  sala public.sala_type primary key,
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

-- Trigger para actualizar updated_at
drop trigger if exists trg_salas_catalogo_touch on salas_catalogo;
create trigger trg_salas_catalogo_touch before update on salas_catalogo for each row execute function touch_updated_at();

-- Insertar catálogo completo de salas
insert into salas_catalogo (sala, label, capacidad, tipo, habilitada) values
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
on conflict (sala) do update set 
  label = excluded.label,
  capacidad = excluded.capacidad,
  tipo = excluded.tipo,
  habilitada = excluded.habilitada;
