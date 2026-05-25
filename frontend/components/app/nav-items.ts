import {
  BarChart3,
  ClipboardList,
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
  { href: "/orders/new", label: "Crear", Icon: PlusCircle, emphasize: true },
  { href: "/orders", label: "Bitácora", Icon: ClipboardList },
  { href: "/reports", label: "Reportes", Icon: BarChart3, adminOnly: true },
  { href: "/users", label: "Usuarios", Icon: Users, adminOnly: true },
  { href: "/settings", label: "Config", Icon: Settings },
];
