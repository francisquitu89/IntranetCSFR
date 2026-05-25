-- Script para corregir el enum sala_type
-- Cambia 'Biblioteca (mesas trabajo)' a 'Biblioteca (mesas de trabajo)'

ALTER TYPE public.sala_type RENAME TO sala_type_old;

CREATE TYPE public.sala_type AS ENUM (
  'Auditorio Grande',
  'Auditorio Chico',
  'Biblioteca (Cuenta Cuentos)',
  'Biblioteca (mesas de trabajo)',
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

ALTER TABLE reservas ALTER COLUMN sala TYPE public.sala_type USING (sala::text::public.sala_type);
ALTER TABLE tickets ALTER COLUMN sala TYPE public.sala_type USING (sala::text::public.sala_type);
