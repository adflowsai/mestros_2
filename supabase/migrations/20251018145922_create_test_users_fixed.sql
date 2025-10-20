/*
  # Crear Usuarios de Prueba (Corregido)

  ## Descripción
  Crea usuarios de prueba para cada tipo de rol en el sistema:
  - admin@test.com - Administrador
  - asesor@test.com - Asesor
  - plantilla@test.com - Plantilla
  - contador@test.com - Contador

  ## Seguridad
  Estos usuarios solo deben usarse en entornos de desarrollo/prueba.
  Las contraseñas son: admin123, asesor123, plantilla123, contador123
*/

-- Función para crear usuario de prueba si no existe
CREATE OR REPLACE FUNCTION create_test_user_with_role(
  user_email TEXT,
  user_password TEXT,
  user_role user_role
) RETURNS void AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insertar usuario en auth.users si no existe
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    recovery_token
  )
  SELECT
    '00000000-0000-0000-0000-000000000000'::uuid,
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    '',
    ''
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = user_email
  )
  RETURNING id INTO new_user_id;

  -- Si se creó un nuevo usuario, obtener su ID
  IF new_user_id IS NULL THEN
    SELECT id INTO new_user_id FROM auth.users WHERE email = user_email;
  END IF;

  -- Crear identidad en auth.identities si no existe
  INSERT INTO auth.identities (
    provider_id,
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  SELECT
    new_user_id::text,
    gen_random_uuid(),
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', user_email),
    'email',
    now(),
    now(),
    now()
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = new_user_id AND provider = 'email'
  );

  -- Asignar rol al usuario si no existe
  INSERT INTO user_roles (user_id, role)
  VALUES (new_user_id, user_role)
  ON CONFLICT (user_id) DO UPDATE SET role = user_role;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear los usuarios de prueba
SELECT create_test_user_with_role('admin@test.com', 'admin123', 'admin');
SELECT create_test_user_with_role('asesor@test.com', 'asesor123', 'asesor');
SELECT create_test_user_with_role('plantilla@test.com', 'plantilla123', 'plantilla');
SELECT create_test_user_with_role('contador@test.com', 'contador123', 'contador');

-- Eliminar la función temporal
DROP FUNCTION IF EXISTS create_test_user_with_role(TEXT, TEXT, user_role);
