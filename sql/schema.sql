-- Supabase SQL schema for SSFF Intranet
-- Run this in Supabase SQL editor (or psql) as a privileged user

-- Enable uuid generation (if not already)
create extension if not exists "pgcrypto";

-- Sala enum
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'sala_type'
      and n.nspname = 'public'
  ) then
    create type public.sala_type as enum (
      'Auditorio Grande', 'Auditorio Chico', 'Biblioteca (Cuenta Cuentos)', 'Biblioteca (mesas trabajo)',
      'Sala VIP', 'Sala 33', 'Sala Computación', 'Préstamo Notebooks', 'Préstamo Tablets'
    );
  end if;
end
$$;

-- Basic users table (application metadata). In Supabase you can map this to auth.users.id
create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nombre text,
  password text,
  rol text default 'profesor', -- admin|profesor|funcionario|director|servicios_generales
  departamento text,
  telefono text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Reservas
create table if not exists reservas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios(id) on delete set null,
  sala sala_type not null,
  fecha_inicio timestamptz not null,
  fecha_fin timestamptz not null,
  descripcion text,
  cantidad int default 1,
  responsable_id uuid references usuarios(id) on delete set null,
  responsable_nombre text,
  responsable_email text,
  estado text not null default 'pendiente', -- pendiente|confirmada|cancelada
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Comentarios para especificar relaciones explícitamente (evita ambigüedad en PostgREST)
comment on column reservas.usuario_id is 'Relación a tabla usuarios - usuario que realiza la reserva';
comment on column reservas.responsable_id is 'Relación a tabla usuarios - persona responsable de la reserva';

-- Tickets
create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios(id) on delete set null,
  sala sala_type,
  equipo text,
  categoria text,
  asunto text,
  descripcion text,
  prioridad text default 'Media',
  estado text default 'Abierto',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notificaciones: se registran eventos que deben enviarse por email
create table if not exists notificaciones (
  id uuid primary key default gen_random_uuid(),
  destinatario text not null,
  cc text,
  asunto text not null,
  cuerpo_html text,
  cuerpo_text text,
  tipo text, -- reserva_confirmada|reserva_cancelada|ticket_creado|ticket_actualizado
  referencia_id uuid,
  estado text default 'pendiente', -- pendiente|enviado|error
  intentos int default 0,
  error_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes to speed queries
create index if not exists idx_reservas_sala_fecha on reservas (sala, fecha_inicio, fecha_fin);
create index if not exists idx_notificaciones_estado on notificaciones (estado);

-- Function: actualizar updated_at on update
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_reservas_touch on reservas;
create trigger trg_reservas_touch before update on reservas for each row execute function touch_updated_at();
drop trigger if exists trg_tickets_touch on tickets;
create trigger trg_tickets_touch before update on tickets for each row execute function touch_updated_at();
drop trigger if exists trg_notificaciones_touch on notificaciones;
create trigger trg_notificaciones_touch before update on notificaciones for each row execute function touch_updated_at();

-- Trigger: cuando se inserta una reserva confirmada, añadir fila en notificaciones
create or replace function fn_notificar_reserva() returns trigger language plpgsql as $$
declare
  u record;
  asunto text;
  cuerpo_html text;
  cuerpo_text text;
begin
  -- fetch user info
  select email, nombre into u from usuarios where id = new.usuario_id;

  asunto := format('Reserva %s - %s', new.estado, new.sala);
  cuerpo_html := format('<p>Estimado/a %s,</p><p>Su reserva para <strong>%s</strong> ha sido %s.</p><p>Inicio: %s<br/>Fin: %s</p>',
    coalesce(u.nombre, 'usuario'), new.sala, new.estado, new.fecha_inicio, new.fecha_fin);
  cuerpo_text := format('Su reserva para %s ha sido %s. Inicio: %s - Fin: %s', new.sala, new.estado, new.fecha_inicio, new.fecha_fin);

  -- Insertar notificación para procesamiento por backend / envío automático
  insert into notificaciones(destinatario, cc, asunto, cuerpo_html, cuerpo_text, tipo, referencia_id)
  values (coalesce(u.email, ''), 'dperez@csfr.cl', asunto, cuerpo_html, cuerpo_text, 'reserva_'||new.estado, new.id);

  return new;
end;
$$;

drop trigger if exists trg_after_insert_reserva on reservas;
create trigger trg_after_insert_reserva after insert on reservas
for each row execute function fn_notificar_reserva();

-- RLS policies temporales para el flujo actual con login local
-- Este esquema usa un login temporal fuera de Supabase Auth, por eso la policy debe permitir el acceso directo.
alter table reservas enable row level security;
alter table notificaciones enable row level security;

drop policy if exists "reservas_select_todas" on reservas;
create policy "reservas_select_todas"
  on reservas
  for select
  using (true);

drop policy if exists "reservas_insert_todas" on reservas;
create policy "reservas_insert_todas"
  on reservas
  for insert
  with check (true);

drop policy if exists "reservas_update_todas" on reservas;
create policy "reservas_update_todas"
  on reservas
  for update
  using (true)
  with check (true);

drop policy if exists "reservas_delete_todas" on reservas;
create policy "reservas_delete_todas"
  on reservas
  for delete
  using (true);

drop policy if exists "notificaciones_select_todas" on notificaciones;
create policy "notificaciones_select_todas"
  on notificaciones
  for select
  using (true);

drop policy if exists "notificaciones_insert_todas" on notificaciones;
create policy "notificaciones_insert_todas"
  on notificaciones
  for insert
  with check (true);

drop policy if exists "notificaciones_update_todas" on notificaciones;
create policy "notificaciones_update_todas"
  on notificaciones
  for update
  using (true)
  with check (true);

drop policy if exists "notificaciones_delete_todas" on notificaciones;
create policy "notificaciones_delete_todas"
  on notificaciones
  for delete
  using (true);

-- Nota: Ajusta políticas RLS según integración con Supabase Auth

-- END schema
