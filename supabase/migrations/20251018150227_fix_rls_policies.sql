/*
  # Corregir Políticas RLS

  ## Cambios
  - Simplificar políticas RLS para evitar errores durante el login
  - Eliminar dependencias circulares en políticas
  - Permitir lectura básica de user_roles durante autenticación

  ## Notas
  Las políticas ahora usan verificaciones más directas sin llamadas complejas
  durante el proceso de autenticación.
*/

-- Eliminar políticas existentes de user_roles
DROP POLICY IF EXISTS "Usuarios pueden ver su propio rol" ON user_roles;
DROP POLICY IF EXISTS "Admins pueden ver todos los roles" ON user_roles;
DROP POLICY IF EXISTS "Admins pueden insertar roles" ON user_roles;
DROP POLICY IF EXISTS "Admins pueden actualizar roles" ON user_roles;

-- Nuevas políticas más simples para user_roles
CREATE POLICY "Users can read own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own role on signup"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Recrear la función get_user_role de forma más segura
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
  user_role_result user_role;
BEGIN
  SELECT role INTO user_role_result
  FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN user_role_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Política adicional para que admins puedan gestionar roles
CREATE POLICY "Admins can manage all roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
