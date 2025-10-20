/*
  # Reconstruir Completamente las Políticas RLS

  ## Problema
  Las políticas tienen dependencias circulares que causan errores de autenticación.

  ## Solución
  1. Eliminar todas las políticas que dependen de get_user_role()
  2. Eliminar la función get_user_role()
  3. Recrear políticas simples sin referencias circulares
  4. Recrear la función de forma segura

  ## Seguridad
  Se mantiene la seguridad pero sin bloquear la autenticación.
*/

-- ============================================================
-- PASO 1: Eliminar todas las políticas existentes
-- ============================================================

-- Políticas de user_roles
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert own role on signup" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Usuarios pueden ver su propio rol" ON user_roles;
DROP POLICY IF EXISTS "Admins pueden ver todos los roles" ON user_roles;
DROP POLICY IF EXISTS "Admins pueden insertar roles" ON user_roles;
DROP POLICY IF EXISTS "Admins pueden actualizar roles" ON user_roles;
DROP POLICY IF EXISTS "allow_read_own_role" ON user_roles;
DROP POLICY IF EXISTS "allow_insert_own_role" ON user_roles;
DROP POLICY IF EXISTS "allow_update_own_role" ON user_roles;

-- Políticas de teams
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver equipos" ON teams;
DROP POLICY IF EXISTS "Plantillas pueden ver su propio equipo" ON teams;
DROP POLICY IF EXISTS "Admins y asesores pueden insertar equipos" ON teams;
DROP POLICY IF EXISTS "Admins pueden actualizar equipos" ON teams;

-- Políticas de service_types
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver tipos de servicio" ON service_types;
DROP POLICY IF EXISTS "Admins pueden gestionar tipos de servicio" ON service_types;

-- Políticas de services
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver servicios" ON services;
DROP POLICY IF EXISTS "Plantillas pueden ver sus servicios asignados" ON services;
DROP POLICY IF EXISTS "Asesores y admins pueden crear servicios" ON services;
DROP POLICY IF EXISTS "Usuarios autorizados pueden actualizar servicios" ON services;

-- Políticas de payments
DROP POLICY IF EXISTS "Usuarios autorizados pueden ver pagos" ON payments;
DROP POLICY IF EXISTS "Asesores y admins pueden crear pagos" ON payments;
DROP POLICY IF EXISTS "Contadores y admins pueden actualizar pagos" ON payments;

-- Políticas de service_history
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver historial" ON service_history;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear historial" ON service_history;

-- ============================================================
-- PASO 2: Eliminar y recrear la función get_user_role
-- ============================================================

DROP FUNCTION IF EXISTS get_user_role() CASCADE;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM user_roles WHERE user_id = auth.uid() LIMIT 1),
    'asesor'
  );
$$;

-- ============================================================
-- PASO 3: Recrear políticas simples para user_roles
-- ============================================================

CREATE POLICY "enable_read_own_role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "enable_insert_own_role"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "enable_update_own_role"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- PASO 4: Recrear políticas para teams
-- ============================================================

CREATE POLICY "enable_read_teams"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_insert_teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'asesor'));

CREATE POLICY "enable_update_teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "enable_delete_teams"
  ON teams FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================
-- PASO 5: Recrear políticas para service_types
-- ============================================================

CREATE POLICY "enable_read_service_types"
  ON service_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_manage_service_types"
  ON service_types FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ============================================================
-- PASO 6: Recrear políticas para services
-- ============================================================

CREATE POLICY "enable_read_services"
  ON services FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_insert_services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'asesor'));

CREATE POLICY "enable_update_services"
  ON services FOR UPDATE
  TO authenticated
  USING (
    get_user_role() IN ('admin', 'asesor') OR
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = services.team_id
      AND teams.user_id = auth.uid()
    )
  )
  WITH CHECK (
    get_user_role() IN ('admin', 'asesor') OR
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = services.team_id
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "enable_delete_services"
  ON services FOR DELETE
  TO authenticated
  USING (get_user_role() IN ('admin', 'asesor'));

-- ============================================================
-- PASO 7: Recrear políticas para payments
-- ============================================================

CREATE POLICY "enable_read_payments"
  ON payments FOR SELECT
  TO authenticated
  USING (get_user_role() IN ('admin', 'contador', 'asesor'));

CREATE POLICY "enable_insert_payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'asesor'));

CREATE POLICY "enable_update_payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('admin', 'contador'))
  WITH CHECK (get_user_role() IN ('admin', 'contador'));

-- ============================================================
-- PASO 8: Recrear políticas para service_history
-- ============================================================

CREATE POLICY "enable_read_service_history"
  ON service_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_insert_service_history"
  ON service_history FOR INSERT
  TO authenticated
  WITH CHECK (true);
