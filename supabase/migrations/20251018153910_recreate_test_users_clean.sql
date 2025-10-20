/*
  # Recrear Usuarios de Prueba (Limpio)

  ## Cambios
  Crea nuevamente los usuarios de prueba con sus roles:
  - admin@test.com (Administrador)
  - asesor@test.com (Asesor)
  - plantilla@test.com (Plantilla)
  - contador@test.com (Contador)

  ## Seguridad
  - Contraseñas hasheadas con bcrypt
  - Emails confirmados automáticamente
  - Roles asignados correctamente
*/

-- Crear usuarios de prueba
DO $$
DECLARE
  admin_user_id uuid;
  asesor_user_id uuid;
  plantilla_user_id uuid;
  contador_user_id uuid;
BEGIN
  -- Eliminar usuarios existentes si existen
  DELETE FROM auth.users WHERE email IN (
    'admin@test.com',
    'asesor@test.com', 
    'plantilla@test.com',
    'contador@test.com'
  );

  -- Crear usuario Administrador
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@test.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO admin_user_id;

  -- Crear usuario Asesor
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'asesor@test.com',
    crypt('asesor123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO asesor_user_id;

  -- Crear usuario Plantilla
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'plantilla@test.com',
    crypt('plantilla123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO plantilla_user_id;

  -- Crear usuario Contador
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'contador@test.com',
    crypt('contador123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO contador_user_id;

  -- Insertar roles correspondientes
  INSERT INTO user_roles (user_id, role) VALUES
    (admin_user_id, 'admin'),
    (asesor_user_id, 'asesor'),
    (plantilla_user_id, 'plantilla'),
    (contador_user_id, 'contador');

END $$;
