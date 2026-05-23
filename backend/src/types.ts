export type DeviceType = "robot" | "drone";
export type DeviceStatus = "available" | "in_mission" | "blocked";
export type SubStatus = "en_base" | "cargando" | "bateria_baja" | "sin_senal" | "mantenimiento";

export interface DeviceRow {
  id: string;
  name: string;
  code: string;
  type: DeviceType;
  status: DeviceStatus;
  battery_level: number;
  accumulated_km: number;
  flight_hours: number;
  base_latitude: number | null;
  base_longitude: number | null;
  signal_lost: boolean | null;
  sub_status: string | null;
  current_route_origin: string | null;
  current_route_destination: string | null;
  updated_at: string;
}

export interface Device {
  id: string;
  name: string;
  code: string;
  type: DeviceType;
  status: DeviceStatus;
  subStatus: SubStatus | null;
  batteryLevel: number;
  accumulatedKm: number;
  flightHours: number;
  currentRoute: { origin: string; destination: string } | null;
}

export interface DashboardKpis {
  ordersInProgress: number;
  devicesAvailable: number;
  ordersCompletedToday: number;
  ordersCancelledToday: number;
}