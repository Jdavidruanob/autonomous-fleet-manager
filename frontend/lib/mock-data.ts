export type Role = "operator" | "administrator";

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

import { Order } from "../types/device";

export const mockOrders: Order[] = [
  {
    id: "ORD-001",
    createdAt: "2026-05-24T08:30:00Z",
    origin: "Edificio de Ingeniería",
    destination: "Cafetería Central",
    status: "completed",
    deviceId: "D-01",
    deviceName: "Dron Halcón",
    requesterName: "Dr. Alberto Gómez"
  },
  {
    id: "ORD-002",
    createdAt: "2026-05-24T09:15:00Z",
    origin: "Biblioteca",
    destination: "Laboratorio 3",
    status: "in_progress",
    deviceId: "R-02",
    deviceName: "Robot Cargo",
    requesterName: "María Rodríguez"
  },
  {
    id: "ORD-003",
    createdAt: "2026-05-24T10:05:00Z",
    origin: "Rectoría",
    destination: "Sala de Juntas",
    status: "cancelled",
    deviceId: "D-02",
    deviceName: "Dron Águila",
    requesterName: "Secretaría General"
  },
  {
    id: "ORD-004",
    createdAt: "2026-05-24T11:20:00Z",
    origin: "Edificio de Artes",
    destination: "Edificio de Ciencias",
    status: "pending",
    deviceId: "UNASSIGNED",
    deviceName: "Sin asignar",
    requesterName: "Prof. Luis Fernández"
  },
  {
    id: "ORD-005",
    createdAt: "2026-05-24T11:45:00Z",
    origin: "Centro de Estudiantes",
    destination: "Edificio de Ingeniería",
    status: "in_progress",
    deviceId: "R-01",
    deviceName: "Robot Express",
    requesterName: "Juan Pérez"
  },
  {
    id: "ORD-006",
    createdAt: "2026-05-24T12:10:00Z",
    origin: "Parqueadero Norte",
    destination: "Edificio Administrativo",
    status: "completed",
    deviceId: "D-03",
    deviceName: "Dron Vigía",
    requesterName: "Seguridad Campus"
  }
];
