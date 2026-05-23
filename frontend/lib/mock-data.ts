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
