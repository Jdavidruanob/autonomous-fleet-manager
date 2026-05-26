"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Bell, ChevronDown, LogOut, Search, Settings, User } from "lucide-react";
import { useAppState } from "@/components/app/app-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface Alert {
  id: string;
  deviceId: string;
  deviceCode: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

function formatAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

export function Header() {
  const router = useRouter();
  const { user, logout } = useAppState();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/alerts?limit=20`);
      if (res.ok) setAlerts(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const unread = alerts.filter((a) => !a.isRead).length;
  const fullName = user?.fullName ?? "";
  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  const roleLabel =
    user?.role === "administrator" ? "Administrador" : "Operador";

  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            FC
          </div>
          <span className="font-semibold tracking-tight">
            Fleet Control{" "}
            <span className="font-normal text-muted-foreground">PUJ</span>
          </span>
        </Link>

        <div className="relative ml-4 hidden max-w-md flex-1 md:block">
          <Search
            className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            placeholder="Buscar ordenes, dispositivos..."
            className="h-9 border-transparent bg-secondary pl-8 focus-visible:bg-background"
          />
          <kbd className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground md:inline-block">
            Ctrl K
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Role badge — informativo, no interactivo */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-dashed px-2.5 py-1.5 text-xs">
            <span className="text-muted-foreground">Rol:</span>
            <span className="font-medium">{roleLabel}</span>
          </div>

          {/* Alertas */}
          <div className="group relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              aria-label="Alertas"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <Badge className="absolute -right-1 -top-1 h-4 min-w-4 border-0 bg-destructive px-1 text-[10px] text-destructive-foreground">
                  {unread}
                </Badge>
              )}
            </Button>
            <div className="invisible absolute right-0 top-10 z-50 w-96 rounded-md border bg-popover text-popover-foreground opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <div className="flex items-center justify-between border-b p-3">
                <div className="text-sm font-semibold">
                  Alertas y notificaciones
                </div>
                <Badge variant="secondary" className="text-xs">
                  {alerts.length}
                </Badge>
              </div>
              <div className="max-h-96 overflow-auto divide-y">
                {alerts.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Sin alertas
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex w-full gap-3 p-3 text-left transition-colors hover:bg-muted/60"
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          alert.isRead ? "bg-muted" : "bg-destructive"
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm leading-snug">
                          {alert.message}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {alert.deviceCode ? `${alert.deviceCode} · ` : ""}
                          {formatAgo(alert.createdAt)}
                        </span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Menú usuario */}
          <div className="group relative">
            <Button variant="ghost" size="sm" className="h-9 gap-2 pl-1 pr-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                {initials || "?"}
              </span>
              <span className="hidden text-sm sm:inline">
                {fullName.split(" ")[0]}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <div className="invisible absolute right-0 top-10 z-50 w-60 rounded-md border bg-popover p-1 text-popover-foreground opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <div className="px-2 py-1.5">
                <div className="text-sm font-medium">{fullName}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </div>
              </div>
              <div className="-mx-1 my-1 h-px bg-border" />
              <button
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => router.push("/profile")}
              >
                <User className="h-4 w-4" /> Perfil
              </button>
              {user?.role === "administrator" && (
                <button
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => router.push("/settings")}
                >
                  <Settings className="h-4 w-4" /> Configuración
                </button>
              )}
              <div className="-mx-1 my-1 h-px bg-border" />
              <button
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
