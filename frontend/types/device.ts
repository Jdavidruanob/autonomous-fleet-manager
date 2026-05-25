export type DeviceType = "robot" | "drone";
export type DeviceStatus = "available" | "in_mission" | "blocked";
export type SubStatus = "en_base" | "cargando" | "bateria_baja" | "sin_senal" | "mantenimiento";

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

export type OrderStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface Order {
  id: string;
  createdAt: string;
  origin: string;
  destination: string | null;
  status: OrderStatus;
  deviceId: string;
  deviceName: string;
  requesterName: string;
}