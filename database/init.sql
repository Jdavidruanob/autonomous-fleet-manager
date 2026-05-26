CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE user_role AS ENUM ('operator', 'administrator');
CREATE TYPE device_type AS ENUM ('robot', 'drone');
CREATE TYPE device_status AS ENUM ('available', 'in_mission', 'blocked', 'maintenance');
CREATE TYPE order_type AS ENUM ('delivery', 'recording');
CREATE TYPE order_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE alert_type AS ENUM (
  'signal_loss',
  'low_battery',
  'maintenance_required',
  'weather_blocked',
  'delivery_timeout',
  'package_undelivered'
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL UNIQUE CHECK (email ~* '^[A-Z0-9._%+-]+@javerianacali\.edu\.co$'),
  password_hash VARCHAR NOT NULL,
  full_name VARCHAR NOT NULL,
  role user_role NOT NULL DEFAULT 'operator',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  session_timeout_minutes INTEGER NOT NULL DEFAULT 30 CHECK (session_timeout_minutes > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campus_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  description TEXT,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  code VARCHAR NOT NULL UNIQUE,
  type device_type NOT NULL,
  status device_status NOT NULL DEFAULT 'available',
  battery_level DECIMAL(5,2) NOT NULL CHECK (battery_level >= 0 AND battery_level <= 100),
  accumulated_km DECIMAL(8,2) NOT NULL DEFAULT 0 CHECK (accumulated_km >= 0),
  flight_hours DECIMAL(8,2) NOT NULL DEFAULT 0 CHECK (flight_hours >= 0),
  last_maintenance_date DATE DEFAULT CURRENT_DATE,
  base_latitude DECIMAL(10,7),
  base_longitude DECIMAL(10,7),
  sub_status VARCHAR(32),
  current_route_origin VARCHAR(128),
  current_route_destination VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL CHECK (end_time > start_time),
  order_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (device_id, start_time),
  EXCLUDE USING gist (
    device_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  )
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type order_type NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  device_id UUID NOT NULL REFERENCES devices(id),
  operator_id UUID NOT NULL REFERENCES users(id),
  time_slot_id UUID NOT NULL REFERENCES time_slots(id),
  origin_point_id UUID NOT NULL REFERENCES campus_points(id),
  destination_point_id UUID REFERENCES campus_points(id),
  sender_email VARCHAR NOT NULL CHECK (sender_email ~* '^[A-Z0-9._%+-]+@javerianacali\.edu\.co$'),
  recipient_email VARCHAR NOT NULL CHECK (recipient_email ~* '^[A-Z0-9._%+-]+@javerianacali\.edu\.co$'),
  qr_hash VARCHAR(512),
  qr_scanned_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE time_slots
  ADD CONSTRAINT time_slots_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES orders(id);

CREATE TABLE telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  battery_level DECIMAL(5,2) NOT NULL CHECK (battery_level >= 0 AND battery_level <= 100),
  speed DECIMAL(6,2),
  mission_status VARCHAR,
  signal_lost BOOLEAN NOT NULL DEFAULT FALSE,
  sensors_status VARCHAR(32) DEFAULT 'normal',
  temperature DECIMAL(5,2),
  camera_status VARCHAR(32) DEFAULT 'off',
  current_order_id UUID,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type alert_type NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type VARCHAR NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER campus_points_set_updated_at
  BEFORE UPDATE ON campus_points
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER devices_set_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER time_slots_set_updated_at
  BEFORE UPDATE ON time_slots
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER telemetry_set_updated_at
  BEFORE UPDATE ON telemetry
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER alerts_set_updated_at
  BEFORE UPDATE ON alerts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER event_logs_set_updated_at
  BEFORE UPDATE ON event_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at_desc ON orders(created_at DESC);
CREATE INDEX idx_telemetry_device_recorded_at_desc ON telemetry(device_id, recorded_at DESC);
CREATE INDEX idx_unread_alerts ON alerts(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_time_slots_device_id ON time_slots(device_id);
CREATE INDEX idx_time_slots_start_time ON time_slots(start_time);
CREATE INDEX idx_orders_device_id ON orders(device_id);
CREATE INDEX idx_orders_operator_id ON orders(operator_id);
CREATE INDEX idx_alerts_device_id ON alerts(device_id);
CREATE INDEX idx_alerts_created_at_desc ON alerts(created_at DESC);
CREATE INDEX idx_event_logs_order_id ON event_logs(order_id);
CREATE INDEX idx_event_logs_created_at_desc ON event_logs(created_at DESC);

-- Demo users: admin@javerianacali.edu.co / Admin1234 | operador@javerianacali.edu.co / Operador1234
-- Hashes are generated by the backend on first startup via ensureDemoUsers()
-- (these placeholders are overwritten by ON CONFLICT DO NOTHING)

INSERT INTO campus_points (name, description, latitude, longitude)
VALUES
  ('Edificio Almendros', 'Punto de encuentro principal para entregas internas.', 3.3455000, -76.5305000),
  ('Biblioteca General', 'Punto de recogida y entrega junto a biblioteca.', 3.3448000, -76.5298000),
  ('Cafeteria Central', 'Zona de alto trafico para entregas livianas.', 3.3452000, -76.5292000),
  ('Edificio Cedros', 'Punto academico para entregas y grabaciones.', 3.3446000, -76.5310000),
  ('Auditorio Mayor', 'Ubicacion principal para servicios de grabacion.', 3.3460000, -76.5295000),
  ('Edificio El Saman', 'Punto de encuentro para facultades.', 3.3442000, -76.5302000),
  ('Cancha Multiple', 'Zona abierta para grabaciones y monitoreo.', 3.3438000, -76.5288000),
  ('Porteria Principal', 'Base operativa de referencia.', 3.3465000, -76.5310000);

INSERT INTO devices (name, code, type, status, battery_level, accumulated_km, flight_hours, sub_status, last_maintenance_date, base_latitude, base_longitude)
VALUES
  ('Robot Cargo RBT-01', 'RBT-01', 'robot', 'available', 100.00, 0, 0, 'en_base', CURRENT_DATE, 3.3455000, -76.5305000),
  ('Robot Mensajero RBT-02', 'RBT-02', 'robot', 'available', 100.00, 0, 0, 'en_base', CURRENT_DATE, 3.3448000, -76.5298000),
  ('Robot Repartidor RBT-03', 'RBT-03', 'robot', 'available', 100.00, 0, 0, 'en_base', CURRENT_DATE, 3.3452000, -76.5292000),
  ('Dron Aguila DRN-01', 'DRN-01', 'drone', 'available', 100.00, 0, 0, 'en_base', CURRENT_DATE, 3.3460000, -76.5295000),
  ('Dron Halcon DRN-02', 'DRN-02', 'drone', 'available', 100.00, 0, 0, 'en_base', CURRENT_DATE, 3.3442000, -76.5302000),
  ('Dron Vigilante DRN-03', 'DRN-03', 'drone', 'available', 100.00, 0, 0, 'en_base', CURRENT_DATE, 3.3438000, -76.5288000);
