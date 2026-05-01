-- Tabla para gestionar inventario de equipos (tablets/notebooks)
-- Ejecutar en Supabase SQL editor

create table if not exists inventario (
  sala text primary key,
  cantidad integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Agregar RLS si es necesario
alter table inventario enable row level security;

drop policy if exists "inventario_select_all" on inventario;
create policy "inventario_select_all"
  on inventario
  for select
  using (true);

drop policy if exists "inventario_insert_all" on inventario;
create policy "inventario_insert_all"
  on inventario
  for insert
  with check (true);

drop policy if exists "inventario_update_all" on inventario;
create policy "inventario_update_all"
  on inventario
  for update
  using (true)
  with check (true);

-- Trigger para actualizar updated_at
drop trigger if exists trg_inventario_touch on inventario;
create trigger trg_inventario_touch before update on inventario for each row execute function touch_updated_at();

-- Insertar datos iniciales
insert into inventario(sala, cantidad) values 
  ('Préstamo Notebooks', 30),
  ('Préstamo Tablets', 59)
on conflict (sala) do update set cantidad = excluded.cantidad;
