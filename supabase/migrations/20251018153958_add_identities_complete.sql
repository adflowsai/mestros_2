/*
  # Agregar Identities a Usuarios de Prueba (Completo)

  ## Problema
  Los usuarios de prueba no tienen entradas en auth.identities,
  lo que causa fallos de autenticación.

  ## Solución
  Crear las identities correspondientes para cada usuario de prueba
  con todos los campos requeridos.
*/

-- Insertar identities para los usuarios de prueba
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, email 
    FROM auth.users 
    WHERE email IN ('admin@test.com', 'asesor@test.com', 'plantilla@test.com', 'contador@test.com')
  LOOP
    -- Verificar si ya existe una identity para este usuario
    IF NOT EXISTS (
      SELECT 1 FROM auth.identities 
      WHERE user_id = user_record.id AND provider = 'email'
    ) THEN
      -- Insertar identity para cada usuario
      INSERT INTO auth.identities (
        provider_id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        user_record.id::text,
        user_record.id,
        jsonb_build_object(
          'sub', user_record.id::text,
          'email', user_record.email,
          'email_verified', true,
          'provider', 'email'
        ),
        'email',
        NOW(),
        NOW(),
        NOW()
      );
    END IF;
  END LOOP;
END $$;
