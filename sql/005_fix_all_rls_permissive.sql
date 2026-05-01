-- Configurar RLS PERMISIVO en TODAS las tablas
-- Ya que la app usa autenticación LOCAL (localStorage), no Supabase Auth
-- Todas las políticas deben ser USING (true) para permitir acceso

-- ============ TABLA: reservas ============
DROP POLICY IF EXISTS "reservas_select_all" ON reservas;
DROP POLICY IF EXISTS "reservas_insert_all" ON reservas;
DROP POLICY IF EXISTS "reservas_update_all" ON reservas;
DROP POLICY IF EXISTS "reservas_delete_all" ON reservas;

ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reservas_select_all" ON reservas FOR SELECT USING (true);
CREATE POLICY "reservas_insert_all" ON reservas FOR INSERT WITH CHECK (true);
CREATE POLICY "reservas_update_all" ON reservas FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "reservas_delete_all" ON reservas FOR DELETE USING (true);

-- ============ TABLA: tickets ============
DROP POLICY IF EXISTS "tickets_select_all" ON tickets;
DROP POLICY IF EXISTS "tickets_insert_all" ON tickets;
DROP POLICY IF EXISTS "tickets_update_all" ON tickets;
DROP POLICY IF EXISTS "tickets_delete_all" ON tickets;

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver todos los tickets (funcionarios/admins verán el dashboard completo)
CREATE POLICY "tickets_select_all" ON tickets FOR SELECT USING (true);
CREATE POLICY "tickets_insert_all" ON tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "tickets_update_all" ON tickets FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "tickets_delete_all" ON tickets FOR DELETE USING (true);

-- ============ TABLA: usuarios ============
DROP POLICY IF EXISTS "usuarios_select_all" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_all" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_all" ON usuarios;

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_select_all" ON usuarios FOR SELECT USING (true);
CREATE POLICY "usuarios_insert_all" ON usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY "usuarios_update_all" ON usuarios FOR UPDATE USING (true) WITH CHECK (true);

-- ============ TABLA: inventario ============
DROP POLICY IF EXISTS "inventario_select_all" ON inventario;
DROP POLICY IF EXISTS "inventario_insert_all" ON inventario;
DROP POLICY IF EXISTS "inventario_update_all" ON inventario;

ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventario_select_all" ON inventario FOR SELECT USING (true);
CREATE POLICY "inventario_insert_all" ON inventario FOR INSERT WITH CHECK (true);
CREATE POLICY "inventario_update_all" ON inventario FOR UPDATE USING (true) WITH CHECK (true);

-- Nota: Si hay más tablas, aplica el mismo patrón aquí
-- CREATE POLICY "table_select_all" ON table_name FOR SELECT USING (true);
-- etc.
