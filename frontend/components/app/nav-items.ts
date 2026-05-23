import {
  BarChart3,
  ClipboardList,
  Cpu,
  LayoutDashboard,
  PlusCircle,
  Settings,
  Users
} from "lucide-react";
import type { ComponentType } from "react";

export interface NavItem {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  emphasize?: boolean;
}

export const navItems: NavItem[] = [
  { href: "/", label: "Panel", Icon: LayoutDashboard },
  { href: "/orders/new", label: "Crear orden", Icon: PlusCircle, emphasize: true },
  { href: "/orders", label: "Bitacora", Icon: ClipboardList },
  { href: "/devices", label: "Dispositivos", Icon: Cpu },
  { href: "/reports", label: "Reportes", Icon: BarChart3 },
  { href: "/users", label: "Usuarios", Icon: Users, adminOnly: true },
  { href: "/settings", label: "Configuracion", Icon: Settings }
];
