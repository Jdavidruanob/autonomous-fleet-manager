"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Bot, Plane, ArrowRight, Video, WifiOff, RotateCcw, Ban, Battery, Gauge, MapPin, Clock, Route as RouteIcon, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Device } from "@/types/device";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevice = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/devices/${params.id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Dispositivo no encontrado");
        } else {
          setError("Error al cargar el dispositivo");
        }
        setLoading(false);
        return;
      }
      const data = await res.json();
      setDevice(data);
      setLoading(false);
    } catch {
      setError("Error de conexión");
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchDevice();
  }, [fetchDevice]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-destructive">{error || "Dispositivo no encontrado"}</div>
        <Button variant="outline" onClick={() => router.push("/")}>
          Volver al panel
        </Button>
      </div>
    );
  }

  const isSignalLost = device.subStatus === "sin_senal";
  const typeLabels = { robot: "Robot terrestre", drone: "Dron" };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
          <ArrowRight className="h-4 w-4 rotate-180" />
          Panel
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
            {device.code}
            <span className="text-sm text-muted-foreground font-mono font-normal">{device.id}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {typeLabels[device.type]} · {device.currentRoute ? `Ruta: ${device.currentRoute.origin} → ${device.currentRoute.destination}` : "Sin ruta activa"}
          </p>
        </div>
      </div>

      {isSignalLost && (
        <div className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-destructive/15 text-destructive shrink-0">
            <WifiOff className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-destructive">Pérdida de señal</div>
            <div className="text-sm text-muted-foreground mt-0.5">
              Último estado conocido: batería {device.batteryLevel}%
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDevice}>
            Reintentar
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Video className="h-4 w-4" />
              Cámara en vivo
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                En vivo
              </span>
            </div>
          </div>
          <div className="relative h-[420px] bg-sidebar text-sidebar-foreground/60 grid place-items-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(29,78,216,0.15),transparent_50%)]" />
            <div className="relative text-center text-sm">
              <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <div className="font-medium">Stream {device.code}</div>
              <div className="text-[11px] opacity-60 mt-1 font-mono">rtsp://fleet.puj/{device.id.toLowerCase()}</div>
            </div>
            <div className="absolute top-2 left-2 text-[10px] font-mono text-sidebar-foreground/70 bg-sidebar/70 px-1.5 py-0.5 rounded">
              720p · 30 fps
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Estado del dispositivo
            </div>
            <div className="space-y-2">
              {device.status === "available" && (
                <span className="inline-flex items-center gap-2 rounded-full bg-success/15 text-success px-3 py-1 text-xs font-semibold">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Disponible
                </span>
              )}
              {device.status === "in_mission" && (
                <span className="inline-flex items-center gap-2 rounded-full bg-info/15 text-info px-3 py-1 text-xs font-semibold">
                  <span className="h-2 w-2 rounded-full bg-info" />
                  En servicio
                </span>
              )}
              {device.status === "blocked" && (
                <span className="inline-flex items-center gap-2 rounded-full bg-destructive/15 text-destructive px-3 py-1 text-xs font-semibold">
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  Bloqueado
                </span>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {device.status === "available" ? "Dispositivo listo para asignación." : "Dispositivo en operación."}
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="text-sm font-semibold mb-3">Telemetría</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <TelemetryItem Icon={Battery} label="Batería" value={`${device.batteryLevel}%`} bar={device.batteryLevel} />
              <TelemetryItem Icon={Gauge} label="Estado" value={device.status === "in_mission" ? "En tránsito" : "Inactivo"} />
              <TelemetryItem Icon={RouteIcon} label="Km acumulados" value={`${device.accumulatedKm} km`} />
              {device.type === "drone" && (
                <TelemetryItem Icon={Clock} label="Horas de vuelo" value={`${device.flightHours} h`} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="gap-2" onClick={() => router.push("/")}>
          <RotateCcw className="h-4 w-4" />
          Volver al panel
        </Button>
      </div>
    </div>
  );
}

function TelemetryItem({ Icon, label, value, bar }: { Icon: any; label: string; value: string; bar?: number }) {
  return (
    <div className="space-y-1 rounded-md border bg-secondary/30 p-2.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
      {bar !== undefined && (
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full ${bar < 20 ? "bg-destructive" : bar < 40 ? "bg-warning" : "bg-success"}`}
            style={{ width: `${bar}%` }}
          />
        </div>
      )}
    </div>
  );
}