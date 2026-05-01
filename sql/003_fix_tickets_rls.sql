-- Solucionar política RLS en tabla tickets
-- NOTA: Esta app usa autenticación LOCAL (localStorage), no Supabase Auth
-- Por eso usamos políticas PERMISIVAS (USING (true))

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "usuarios pueden leer sus propios tickets" ON tickets;
DROP POLICY IF EXISTS "usuarios pueden crear tickets" ON tickets;
DROP POLICY IF EXISTS "usuarios pueden actualizar sus propios tickets" ON tickets;
DROP POLICY IF EXISTS "admins ven todos los tickets" ON tickets;
DROP POLICY IF EXISTS "usuarios_leen_tickets" ON tickets;
DROP POLICY IF EXISTS "usuarios_crean_tickets" ON tickets;
DROP POLICY IF EXISTS "usuarios_actualizan_tickets" ON tickets;

-- Habilitar RLS en la tabla
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Política PERMISIVA SELECT: Todos pueden leer todos los tickets
CREATE POLICY "tickets_select_all"
  ON tickets
  FOR SELECT
  USING (true);

-- Política PERMISIVA INSERT: Todos pueden crear tickets
CREATE POLICY "tickets_insert_all"
  ON tickets
  FOR INSERT
  WITH CHECK (true);

-- Política PERMISIVA UPDATE: Todos pueden actualizar tickets
CREATE POLICY "tickets_update_all"
  ON tickets
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política PERMISIVA DELETE: Todos pueden eliminar tickets
CREATE POLICY "tickets_delete_all"
  ON tickets
  FOR DELETE
  USING (true);
