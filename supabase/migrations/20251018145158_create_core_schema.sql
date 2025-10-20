/*
  # Sistema de Gestión Operativa - Schema Inicial

  ## Nuevas Tablas
  
  ### 1. `user_roles` - Roles de usuario
    - `id` (uuid, primary key)
    - `user_id` (uuid, referencia a auth.users)
    - `role` (enum: admin, asesor, plantilla, contador)
    - `created_at` (timestamp)
  
  ### 2. `teams` - Plantillas/Equipos
    - `id` (uuid, primary key)
    - `name` (text) - Nombre del equipo
    - `user_id` (uuid) - Usuario asociado
    - `active` (boolean) - Estado activo/inactivo
    - `created_at` (timestamp)
  
  ### 3. `service_types` - Tipos de servicio
    - `id` (uuid, primary key)
    - `name` (text) - Nombre del servicio
    - `category` (text) - Categoría (recolección/domicilio)
    - `base_price` (numeric) - Precio base
    - `description` (text)
    - `created_at` (timestamp)
  
  ### 4. `services` - Servicios programados
    - `id` (uuid, primary key)
    - `service_type_id` (uuid) - Tipo de servicio
    - `team_id` (uuid) - Equipo asignado
    - `address` (text) - Dirección
    - `latitude` (numeric) - Coordenada latitud
    - `longitude` (numeric) - Coordenada longitud
    - `scheduled_date` (date) - Fecha programada
    - `scheduled_time` (time) - Hora programada
    - `status` (enum) - Estado del servicio
    - `created_by` (uuid) - Asesor que creó el servicio
    - `created_at` (timestamp)
    - `updated_at` (timestamp)
  
  ### 5. `payments` - Pagos
    - `id` (uuid, primary key)
    - `service_id` (uuid) - Servicio relacionado
    - `amount` (numeric) - Monto pagado
    - `payment_method` (enum) - Método de pago
    - `status` (enum) - Estado del pago
    - `receipt_url` (text) - URL del comprobante
    - `verified_at` (timestamp) - Fecha de verificación
    - `verified_by` (uuid) - Usuario que verificó
    - `notes` (text) - Notas o alertas
    - `created_at` (timestamp)
  
  ### 6. `service_history` - Historial de estados
    - `id` (uuid, primary key)
    - `service_id` (uuid) - Servicio
    - `status` (text) - Estado
    - `notes` (text) - Notas opcionales
    - `created_by` (uuid) - Usuario que actualizó
    - `created_at` (timestamp)

  ## Seguridad
    - RLS habilitado en todas las tablas
    - Políticas restrictivas basadas en roles
    - Validación de permisos por rol de usuario
*/

-- Crear tipo enum para roles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'asesor', 'plantilla', 'contador');
  END IF;
END $$;

-- Crear tipo enum para estado de servicio
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_status') THEN
    CREATE TYPE service_status AS ENUM ('asignado', 'en_camino', 'realizando', 'finalizado', 'cancelado', 'reprogramado');
  END IF;
END $$;

-- Crear tipo enum para método de pago
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('efectivo', 'transferencia', 'tarjeta');
  END IF;
END $$;

-- Crear tipo enum para estado de pago
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pendiente', 'pagado', 'parcial', 'verificado');
  END IF;
END $$;

-- Tabla de roles de usuario
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'asesor',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Tabla de equipos/plantillas
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Tabla de tipos de servicio
CREATE TABLE IF NOT EXISTS service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;

-- Tabla de servicios
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type_id uuid REFERENCES service_types(id) ON DELETE RESTRICT NOT NULL,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  address text NOT NULL,
  latitude numeric(10,7),
  longitude numeric(10,7),
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  status service_status DEFAULT 'asignado',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL,
  status payment_status DEFAULT 'pendiente',
  receipt_url text,
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Tabla de historial de servicios
CREATE TABLE IF NOT EXISTS service_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE service_history ENABLE ROW LEVEL SECURITY;

-- Función helper para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Políticas RLS para user_roles
CREATE POLICY "Usuarios pueden ver su propio rol"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins pueden ver todos los roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins pueden insertar roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins pueden actualizar roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Políticas RLS para teams
CREATE POLICY "Usuarios autenticados pueden ver equipos"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Plantillas pueden ver su propio equipo"
  ON teams FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins y asesores pueden insertar equipos"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'asesor'));

CREATE POLICY "Admins pueden actualizar equipos"
  ON teams FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Políticas RLS para service_types
CREATE POLICY "Usuarios autenticados pueden ver tipos de servicio"
  ON service_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins pueden gestionar tipos de servicio"
  ON service_types FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Políticas RLS para services
CREATE POLICY "Usuarios autenticados pueden ver servicios"
  ON services FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Plantillas pueden ver sus servicios asignados"
  ON services FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = services.team_id
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Asesores y admins pueden crear servicios"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'asesor'));

CREATE POLICY "Usuarios autorizados pueden actualizar servicios"
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

-- Políticas RLS para payments
CREATE POLICY "Usuarios autorizados pueden ver pagos"
  ON payments FOR SELECT
  TO authenticated
  USING (get_user_role() IN ('admin', 'contador', 'asesor'));

CREATE POLICY "Asesores y admins pueden crear pagos"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'asesor'));

CREATE POLICY "Contadores y admins pueden actualizar pagos"
  ON payments FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('admin', 'contador'))
  WITH CHECK (get_user_role() IN ('admin', 'contador'));

-- Políticas RLS para service_history
CREATE POLICY "Usuarios autenticados pueden ver historial"
  ON service_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden crear historial"
  ON service_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insertar tipos de servicio predeterminados
INSERT INTO service_types (name, category, base_price, description)
VALUES 
  ('Limpieza de Colchones', 'Limpieza a Domicilio', 500.00, 'Limpieza profunda de colchones'),
  ('Limpieza de Salas', 'Limpieza a Domicilio', 800.00, 'Limpieza de salas y sillones'),
  ('Limpieza de Sillas', 'Limpieza a Domicilio', 300.00, 'Limpieza de sillas tapizadas'),
  ('Limpieza de Alfombras', 'Limpieza a Domicilio', 600.00, 'Limpieza de alfombras y tapetes grandes'),
  ('Recolección de Tapetes', 'Recolección de Tapetes', 250.00, 'Recolección y entrega de tapetes'),
  ('Tapicería General', 'Limpieza a Domicilio', 700.00, 'Limpieza de tapicería en general')
ON CONFLICT DO NOTHING;

-- Trigger para actualizar updated_at en services
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_services_updated_at'
  ) THEN
    CREATE TRIGGER update_services_updated_at
      BEFORE UPDATE ON services
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Trigger para crear entrada en historial cuando cambia el estado
CREATE OR REPLACE FUNCTION track_service_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO service_history (service_id, status, created_by)
    VALUES (NEW.id, NEW.status::text, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'track_service_status'
  ) THEN
    CREATE TRIGGER track_service_status
      AFTER INSERT OR UPDATE ON services
      FOR EACH ROW
      EXECUTE FUNCTION track_service_status_change();
  END IF;
END $$;