import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Initial database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let useMock = false;

// Seed data for local in-memory fallback
const mockCampusPoints = [
  { id: "c1", name: "Edificio Almendros", description: "Punto de encuentro principal para entregas internas.", latitude: 3.3455000, longitude: -76.5305000, is_active: true },
  { id: "c2", name: "Biblioteca General", description: "Punto de recogida y entrega junto a biblioteca.", latitude: 3.3448000, longitude: -76.5298000, is_active: true },
  { id: "c3", name: "Cafeteria Central", description: "Zona de alto trafico para entregas livianas.", latitude: 3.3452000, longitude: -76.5292000, is_active: true },
  { id: "c4", name: "Edificio Cedros", description: "Punto academico para entregas y grabaciones.", latitude: 3.3446000, longitude: -76.5310000, is_active: true },
  { id: "c5", name: "Auditorio Mayor", description: "Ubicacion principal para servicios de grabacion.", latitude: 3.3460000, longitude: -76.5295000, is_active: true },
  { id: "c6", name: "Edificio El Saman", description: "Punto de encuentro para facultades.", latitude: 3.3442000, longitude: -76.5302000, is_active: true },
  { id: "c7", name: "Cancha Multiple", description: "Zona abierta para grabaciones y monitoreo.", latitude: 3.3438000, longitude: -76.5288000, is_active: true },
  { id: "c8", name: "Porteria Principal", description: "Base operativa de referencia.", latitude: 3.3465000, longitude: -76.5310000, is_active: true },
];

const mockDevices = [
  { id: "d1", name: "Robot Cargo RBT-01", code: "RBT-01", type: "robot", status: "available", battery_level: 85.00, accumulated_km: 42.5, flight_hours: 0, last_maintenance_date: null, base_latitude: 3.3455000, base_longitude: -76.5305000, sub_status: "en_base", current_route_origin: null, current_route_destination: null },
  { id: "d2", name: "Robot Mensajero RBT-02", code: "RBT-02", type: "robot", status: "in_mission", battery_level: 62.00, accumulated_km: 128.3, flight_hours: 0, last_maintenance_date: null, base_latitude: 3.3448000, base_longitude: -76.5298000, sub_status: null, current_route_origin: "Edificio Almendros", current_route_destination: "Biblioteca General" },
  { id: "d3", name: "Robot Repartidor RBT-03", code: "RBT-03", type: "robot", status: "blocked", battery_level: 15.00, accumulated_km: 312.0, flight_hours: 0, last_maintenance_date: null, base_latitude: 3.3452000, base_longitude: -76.5292000, sub_status: "bateria_baja", current_route_origin: null, current_route_destination: null },
  { id: "d4", name: "Dron Aguila DRN-01", code: "DRN-01", type: "drone", status: "available", battery_level: 91.00, accumulated_km: 0, flight_hours: 12.5, last_maintenance_date: null, base_latitude: 3.3460000, base_longitude: -76.5295000, sub_status: "en_base", current_route_origin: null, current_route_destination: null },
  { id: "d5", name: "Dron Halcon DRN-02", code: "DRN-02", type: "drone", status: "in_mission", battery_level: 38.00, accumulated_km: 0, flight_hours: 28.1, last_maintenance_date: null, base_latitude: 3.3442000, base_longitude: -76.5302000, sub_status: null, current_route_origin: "Cafeteria Central", current_route_destination: "Auditorio Mayor" },
  { id: "d6", name: "Dron Vigilante DRN-03", code: "DRN-03", type: "drone", status: "blocked", battery_level: 18.00, accumulated_km: 0, flight_hours: 45.2, last_maintenance_date: null, base_latitude: 3.3438000, base_longitude: -76.5288000, sub_status: "sin_senal", current_route_origin: null, current_route_destination: null },
];

const mockTelemetry: any[] = [];
const mockOrders: any[] = [];
const mockAlerts: any[] = [];

// Simple in-memory mock query executor
function executeMockQuery<T>(text: string, params?: unknown[]): T[] {
  const t = text.trim().replace(/\s+/g, " ");

  // 1. SELECT campus_points
  if (t.includes("FROM campus_points")) {
    return mockCampusPoints as unknown as T[];
  }

  // 2. SELECT devices list with telemetry join
  if (t.includes("FROM devices d")) {
    return mockDevices.map(d => {
      const latestTelemetry = mockTelemetry
        .filter(tel => tel.device_id === d.id)
        .sort((a, b) => b.recorded_at.getTime() - a.recorded_at.getTime())[0];
      return {
        ...d,
        signal_lost: latestTelemetry ? latestTelemetry.signal_lost : false
      };
    }) as unknown as T[];
  }

  // 3. SELECT single device
  if (t.includes("SELECT * FROM devices WHERE id = $1")) {
    const id = params?.[0];
    const device = mockDevices.find(d => d.id === id);
    return (device ? [device] : []) as unknown as T[];
  }

  // 4. UPDATE device status and stats
  if (t.includes("UPDATE devices SET")) {
    const id = params?.[params.length - 1] as string;
    const device = mockDevices.find(d => d.id === id);
    if (device) {
      // Very basic regex extractor for set parameters
      // e.g. status = $1, battery_level = $2
      const setPart = t.match(/UPDATE devices SET (.*) WHERE id/i)?.[1];
      if (setPart) {
        const assignments = setPart.split(",").map(s => s.trim());
        assignments.forEach((assignment, index) => {
          const field = assignment.split("=")[0].trim().toLowerCase();
          const val = params?.[index];
          if (field === "status") device.status = val as any;
          if (field === "battery_level") device.battery_level = Number(val);
          if (field === "accumulated_km") device.accumulated_km = Number(val);
          if (field === "flight_hours") device.flight_hours = Number(val);
          if (field === "sub_status") device.sub_status = val as any;
          if (field === "current_route_origin") device.current_route_origin = val as any;
          if (field === "current_route_destination") device.current_route_destination = val as any;
        });
      }
    }
    return [{ success: true }] as unknown as T[];
  }

  // 5. INSERT telemetry
  if (t.includes("INSERT INTO telemetry")) {
    const [device_id, latitude, longitude, battery_level, speed, mission_status, signal_lost] = params ?? [];
    const newTel = {
      id: "t" + Math.random(),
      device_id,
      latitude,
      longitude,
      battery_level,
      speed,
      mission_status,
      signal_lost: signal_lost ?? false,
      recorded_at: new Date()
    };
    mockTelemetry.push(newTel);

    // Update active telemetry fields on device
    const device = mockDevices.find(d => d.id === device_id);
    if (device) {
      device.battery_level = Number(battery_level);
      if (signal_lost) {
        device.sub_status = "sin_senal";
      } else if (device.sub_status === "sin_senal") {
        device.sub_status = null;
      }
    }
    return [{ success: true }] as unknown as T[];
  }

  // 6. SELECT COUNT(*) FROM orders
  if (t.includes("SELECT COUNT(*) as count FROM orders WHERE status = 'in_progress'")) {
    return [{ count: mockOrders.filter(o => o.status === "in_progress").length.toString() }] as unknown as T[];
  }
  if (t.includes("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'")) {
    return [{ count: mockOrders.filter(o => o.status === "completed").length.toString() }] as unknown as T[];
  }
  if (t.includes("SELECT COUNT(*) as count FROM orders WHERE status = 'cancelled'")) {
    return [{ count: mockOrders.filter(o => o.status === "cancelled").length.toString() }] as unknown as T[];
  }

  // 7. SELECT COUNT(*) FROM devices
  if (t.includes("SELECT COUNT(*) as count FROM devices WHERE status = 'available'")) {
    return [{ count: mockDevices.filter(d => d.status === "available").length.toString() }] as unknown as T[];
  }

  // 8. SELECT alerts
  if (t.includes("FROM alerts")) {
    const device_id = params?.[0];
    const alerts = mockAlerts.filter(a => a.device_id === device_id);
    return alerts as unknown as T[];
  }

  // 9. INSERT alerts
  if (t.includes("INSERT INTO alerts")) {
    const [device_id, type, message] = params ?? [];
    const newAlert = {
      id: "a" + Math.random(),
      device_id,
      type,
      message,
      is_read: false,
      created_at: new Date()
    };
    mockAlerts.push(newAlert);
    return [{ success: true }] as unknown as T[];
  }

  return [] as T[];
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  if (useMock) {
    return executeMockQuery<T>(text, params);
  }

  try {
    const result = await pool.query(text, params);
    return result.rows as T[];
  } catch (err: any) {
    // If connection fails, switch to mock mode automatically
    if (!useMock && (err.code === "ECONNREFUSED" || err.message.includes("connect") || err.message.includes("timeout"))) {
      console.warn("⚠️ Connection to PostgreSQL failed. Falling back to in-memory Mock Database! Local testing is active.");
      useMock = true;
      return executeMockQuery<T>(text, params);
    }
    throw err;
  }
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export default pool;