export type Role = "operator" | "administrator";

import type { Device } from "@/types/device";

export const mockDevices: Device[] = [
  {
    id: "mock-rbt-01",
    name: "Robot Cargo",
    code: "RBT-01",
    type: "robot",
    status: "in_mission",
    subStatus: null,
    batteryLevel: 72,
    accumulatedKm: 312,
    flightHours: 0,
    currentRoute: { origin: "Edificio A", destination: "Cafetería Central" },
  },
  {
    id: "mock-rbt-02",
    name: "Robot Expreso",
    code: "RBT-02",
    type: "robot",
    status: "available",
    subStatus: "en_base",
    batteryLevel: 95,
    accumulatedKm: 88,
    flightHours: 0,
    currentRoute: null,
  },
  {
    id: "mock-rbt-03",
    name: "Robot Atlas",
    code: "RBT-03",
    type: "robot",
    status: "blocked",
    subStatus: "mantenimiento",
    batteryLevel: 40,
    accumulatedKm: 510,
    flightHours: 0,
    currentRoute: null,
  },
  {
    id: "mock-drn-01",
    name: "Dron Águila",
    code: "DRN-01",
    type: "drone",
    status: "in_mission",
    subStatus: null,
    batteryLevel: 55,
    accumulatedKm: 0,
    flightHours: 124,
    currentRoute: { origin: "Torre Norte", destination: "Laboratorios" },
  },
  {
    id: "mock-drn-02",
    name: "Dron Halcón",
    code: "DRN-02",
    type: "drone",
    status: "available",
    subStatus: "cargando",
    batteryLevel: 17,
    accumulatedKm: 0,
    flightHours: 98,
    currentRoute: null,
  },
  {
    id: "mock-drn-03",
    name: "Dron Cóndor",
    code: "DRN-03",
    type: "drone",
    status: "available",
    subStatus: null,
    batteryLevel: 88,
    accumulatedKm: 0,
    flightHours: 43,
    currentRoute: null,
  },
];

export interface AlertPreview {
  id: string;
  level: "info" | "warning" | "critical";
  message: string;
  timeLabel: string;
}

export const userSession = {
  role: "administrator" as Role,
  userName: "Maria Ramirez",
  userEmail: "m.ramirez@javerianacali.edu.co"
};

export const alertPreviews: AlertPreview[] = [
  {
    id: "A1",
    level: "critical",
    message: "Dron Aguila perdio senal hace 00:42",
    timeLabel: "hace 1 min"
  },
  {
    id: "A2",
    level: "warning",
    message: "Dron Halcon con bateria critica (17%)",
    timeLabel: "hace 8 min"
  },
  {
    id: "A3",
    level: "warning",
    message: "Robot Cargo bloqueado: requiere mantenimiento (312 km)",
    timeLabel: "hace 35 min"
  },
  {
    id: "A4",
    level: "info",
    message: "Pronostico: vientos > 35 km/h en proxima hora",
    timeLabel: "hace 1 h"
  }
];

export const pageTitles: Record<string, string> = {
  "/": "Panel",
  "/orders/new": "Crear orden",
  "/orders": "Bitacora de ordenes",
  "/devices": "Dispositivos",
  "/reports": "Reportes",
  "/users": "Usuarios",
  "/settings": "Configuracion",
  "/profile": "Perfil"
};
