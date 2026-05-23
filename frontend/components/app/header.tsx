"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Search, Settings, User } from "lucide-react";
import { useAppState } from "@/components/app/app-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { alertPreviews } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const { role, setRole, userName, userEmail } = useAppState();
  const unread = alertPreviews.filter((alert) => alert.level !== "info").length;
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            FC
          </div>
          <span className="font-semibold tracking-tight">
            Fleet Control <span className="font-normal text-muted-foreground">PUJ</span>
          </span>
        </Link>

        <div className="relative ml-4 hidden max-w-md flex-1 md:block">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input placeholder="Buscar ordenes, dispositivos..." className="h-9 border-transparent bg-secondary pl-8 focus-visible:bg-background" />
          <kbd className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground md:inline-block">
            Ctrl K
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="group relative">
            <Button variant="outline" size="sm" className="h-9 gap-1.5 border-dashed">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Modo demo</span>
              <span className="font-medium capitalize">{role === "administrator" ? "admin" : "operador"}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <div className="invisible absolute right-0 top-10 z-50 w-56 rounded-md border bg-popover p-1 text-popover-foreground opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <div className="px-2 py-1.5 text-sm font-semibold">Cambiar rol</div>
              <button
                className={cn("w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent", role === "operator" && "bg-secondary")}
                onClick={() => setRole("operator")}
              >
                Operador
              </button>
              <button
                className={cn("w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent", role === "administrator" && "bg-secondary")}
                onClick={() => setRole("administrator")}
              >
                Administrador
              </button>
            </div>
          </div>

          <div className="group relative">
            <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Alertas">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <Badge className="absolute -right-1 -top-1 h-4 min-w-4 border-0 bg-destructive px-1 text-[10px] text-destructive-foreground">
                  {unread}
                </Badge>
              )}
            </Button>
            <div className="invisible absolute right-0 top-10 z-50 w-96 rounded-md border bg-popover text-popover-foreground opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <div className="flex items-center justify-between border-b p-3">
                <div className="text-sm font-semibold">Alertas y notificaciones</div>
                <Badge variant="secondary" className="text-xs">
                  {alertPreviews.length}
                </Badge>
              </div>
              <div className="max-h-96 overflow-auto divide-y">
                {alertPreviews.map((alert) => {
                  const dot =
                    alert.level === "critical" ? "bg-destructive" : alert.level === "warning" ? "bg-warning" : "bg-info";

                  return (
                    <button key={alert.id} className="flex w-full gap-3 p-3 text-left transition-colors hover:bg-muted/60">
                      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dot)} />
                      <span className="min-w-0">
                        <span className="block text-sm leading-snug">{alert.message}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{alert.timeLabel}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="group relative">
            <Button variant="ghost" size="sm" className="h-9 gap-2 pl-1 pr-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                {initials}
              </span>
              <span className="hidden text-sm sm:inline">{userName.split(" ")[0]}</span>
            </Button>
            <div className="invisible absolute right-0 top-10 z-50 w-60 rounded-md border bg-popover p-1 text-popover-foreground opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <div className="px-2 py-1.5">
                <div className="text-sm font-medium">{userName}</div>
                <div className="truncate text-xs text-muted-foreground">{userEmail}</div>
              </div>
              <div className="-mx-1 my-1 h-px bg-border" />
              <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent" onClick={() => router.push("/profile")}>
                <User className="h-4 w-4" /> Perfil
              </button>
              <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent" onClick={() => router.push("/settings")}>
                <Settings className="h-4 w-4" /> Configuracion
              </button>
              <div className="-mx-1 my-1 h-px bg-border" />
              <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
                <LogOut className="h-4 w-4" /> Cerrar sesion
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
