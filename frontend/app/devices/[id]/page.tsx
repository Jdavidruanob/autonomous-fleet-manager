"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Plane,
  ArrowRight,
  Battery,
  Gauge,
  MapPin,
  Clock,
  Camera,
  CameraOff,
  RefreshCw,
  ChevronDown,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BatteryIndicator } from "@/components/device/battery-indicator";
import { DeviceStatusBadge, DeviceSubStatusLabel } from "@/components/device/device-status-badge";
import type { Device } from "@/types/device";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const POLL_INTERVAL = 3000;

/* ─── Cámara en vivo ───────────────────────────────────────────────── */
function LiveCameraPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [active, setActive] = useState(false);
  const [permission, setPermission] = useState<"idle" | "granted" | "denied">("idle");
  const [missionSeconds, setMissionSeconds] = useState(0);

  // contador de tiempo de misión (empieza al activar cámara)
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setMissionSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [active]);

  // enumerar cámaras disponibles
  const loadCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      setCameras(videoDevices);
      if (videoDevices.length > 0 && !selectedId) {
        setSelectedId(videoDevices[0].deviceId);
      }
    } catch {
      // sin permisos todavía – se relanza al activar
    }
  }, [selectedId]);

  // iniciar stream
  const startCamera = useCallback(async (deviceId?: string) => {
    // detener stream anterior
    streamRef.current?.getTracks().forEach((t) => t.stop());

    const constraints: MediaStreamConstraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: false,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPermission("granted");
      setActive(true);
      // refrescar lista con labels reales (sólo disponibles después de getUserMedia)
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      setCameras(videoDevices);
      if (!deviceId && videoDevices.length > 0) {
        setSelectedId(videoDevices[0].deviceId);
      }
    } catch {
      setPermission("denied");
      setActive(false);
    }
  }, []);

  // detener stream
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
    setMissionSeconds(0);
  }, []);

  // cambio de cámara en caliente
  const handleCameraChange = async (id: string) => {
    setSelectedId(id);
    if (active) await startCamera(id);
  };

  // cleanup al desmontar
  useEffect(() => {
    loadCameras();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [loadCameras]);

  const fmt = (s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      {/* Cabecera */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Cámara en vivo</span>
          {active && (
            <span className="flex items-center gap-1 text-xs text-destructive font-medium">
              <span className="live-pulse inline-block h-2 w-2 rounded-full bg-destructive" />
              EN VIVO
            </span>
          )}
        </div>

        {active && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
            <Clock className="h-3 w-3" />
            {fmt(missionSeconds)}
          </span>
        )}
      </div>

      {/* Visor de video */}
      <div className="relative bg-black aspect-video w-full overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0"}`}
        />

        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            {permission === "denied" ? (
              <>
                <CameraOff className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center px-6">
                  Permiso de cámara denegado. Verifica la configuración del navegador.
                </p>
              </>
            ) : (
              <>
                <Camera className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Cámara inactiva</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="p-3 flex items-center gap-2 flex-wrap">
        {/* Selector de cámara */}
        {cameras.length > 1 && (
          <div className="relative flex-1 min-w-0">
            <select
              value={selectedId}
              onChange={(e) => handleCameraChange(e.target.value)}
              className="w-full appearance-none rounded-md border bg-background px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Seleccionar cámara"
            >
              {cameras.map((c, i) => (
                <option key={c.deviceId} value={c.deviceId}>
                  {c.label || `Cámara ${i + 1}`}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        )}

        {cameras.length === 0 && !active && (
          <p className="text-xs text-muted-foreground flex-1">No se detectaron cámaras</p>
        )}

        {active ? (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={stopCamera}
            id="btn-stop-camera"
          >
            <CameraOff className="h-4 w-4 mr-1.5" />
            Desactivar
          </Button>
        ) : (
          <Button
            size="sm"
            className="shrink-0"
            onClick={() => startCamera(selectedId || undefined)}
            id="btn-start-camera"
          >
            <Camera className="h-4 w-4 mr-1.5" />
            Activar cámara
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─── Fila de telemetría ───────────────────────────────────────────── */
function TelemetryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-secondary text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm text-muted-foreground flex-1">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

/* ─── Página principal ─────────────────────────────────────────────── */
export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [missionStart] = useState(Date.now());

  const fetchDevice = useCallback(
    async (initial = false) => {
      try {
        const res = await fetch(`${API_BASE}/api/devices`);
        if (!res.ok) return;
        const data: Device[] = await res.json();
        const found = data.find((d) => d.id === id) ?? null;
        setDevice(found);
      } finally {
        if (initial) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchDevice(true);
    const t = setInterval(() => fetchDevice(false), POLL_INTERVAL);
    return () => clearInterval(t);
  }, [fetchDevice]);

  /* ── coordenadas GPS simuladas (se actualizan cada poll) ── */
  const gps = device
    ? {
        lat: (3.8801 + (device.batteryLevel % 10) * 0.001).toFixed(5),
        lng: (-76.025 - (device.batteryLevel % 7) * 0.001).toFixed(5),
      }
    : null;

  const speed = device?.status === "in_mission" ? `${((device.batteryLevel % 15) + 5).toFixed(1)} km/h` : "0.0 km/h";

  /* ── skeleton de carga ── */
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <div className="aspect-video w-full bg-muted rounded-lg" />
            <div className="bg-muted rounded-lg h-40" />
          </div>
          <div className="bg-muted rounded-lg h-64" />
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted-foreground">Dispositivo no encontrado.</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Volver al panel
        </Button>
      </div>
    );
  }

  const isRobot = device.type === "robot";
  const typeLabel = isRobot ? "Robot terrestre" : "Dron";
  const iconColor = isRobot ? "text-primary" : "text-info";
  const iconBg = isRobot ? "bg-primary/10" : "bg-info/10";

  return (
    <div className="space-y-6">
      {/* Cabecera de página */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          id="btn-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${iconBg} ${iconColor}`}>
            {isRobot ? <Bot className="h-5 w-5" /> : <Plane className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight leading-none">
              {device.code} · {device.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{typeLabel}</p>
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-end gap-0.5">
          <DeviceStatusBadge status={device.status} subStatus={device.subStatus} />
          <DeviceSubStatusLabel subStatus={device.subStatus} />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchDevice(false)}
          className="shrink-0"
          id="btn-refresh"
          title="Actualizar datos"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Layout principal */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Columna izquierda: cámara + telemetría */}
        <div className="space-y-4">
          <LiveCameraPanel />

          {/* Telemetría en tiempo real */}
          <div className="bg-card rounded-lg border">
            <div className="px-4 py-3 border-b">
              <span className="text-sm font-semibold">Telemetría</span>
            </div>
            <div className="px-4">
              <TelemetryRow
                icon={Battery}
                label="Batería"
                value={`${device.batteryLevel}%`}
              />
              <TelemetryRow
                icon={Gauge}
                label="Velocidad"
                value={speed}
              />
              <TelemetryRow
                icon={MapPin}
                label="GPS"
                value={gps ? `${gps.lat}, ${gps.lng}` : "—"}
              />
              <TelemetryRow
                icon={Clock}
                label="Tiempo de misión"
                value={
                  device.status === "in_mission"
                    ? `${Math.floor((Date.now() - missionStart) / 60000)}m ${Math.floor(((Date.now() - missionStart) % 60000) / 1000)}s`
                    : "—"
                }
              />
              {isRobot ? (
                <TelemetryRow icon={ArrowRight} label="Km acumulados" value={`${device.accumulatedKm} km`} />
              ) : (
                <TelemetryRow icon={ArrowRight} label="Horas de vuelo" value={`${device.flightHours} h`} />
              )}
            </div>
          </div>
        </div>

        {/* Columna derecha: estado + ruta + batería */}
        <div className="space-y-4">
          {/* Estado */}
          <div className="bg-card rounded-lg border">
            <div className="px-4 py-3 border-b">
              <span className="text-sm font-semibold">Estado del dispositivo</span>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <DeviceStatusBadge status={device.status} subStatus={device.subStatus} />
              </div>
              {device.subStatus && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sub-estado</span>
                  <DeviceSubStatusLabel subStatus={device.subStatus} />
                </div>
              )}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-muted-foreground">Batería</span>
                  <span className="text-sm font-medium tabular-nums">{device.batteryLevel}%</span>
                </div>
                <BatteryIndicator level={device.batteryLevel} />
              </div>
            </div>
          </div>

          {/* Ruta actual */}
          <div className="bg-card rounded-lg border">
            <div className="px-4 py-3 border-b">
              <span className="text-sm font-semibold">Ruta actual</span>
            </div>
            <div className="p-4">
              {device.currentRoute ? (
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">Origen</div>
                    <div className="font-medium truncate">{device.currentRoute.origin}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0 text-right">
                    <div className="text-xs text-muted-foreground mb-1">Destino</div>
                    <div className="font-medium truncate">{device.currentRoute.destination}</div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin ruta asignada</p>
              )}
            </div>
          </div>

          {/* Estadísticas */}
          <div className="bg-card rounded-lg border">
            <div className="px-4 py-3 border-b">
              <span className="text-sm font-semibold">Estadísticas</span>
            </div>
            <div className="p-4 space-y-3">
              {isRobot ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Km acumulados</span>
                    <span className="text-sm font-medium tabular-nums">{device.accumulatedKm} km</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Horas de vuelo</span>
                    <span className="text-sm font-medium tabular-nums">{device.flightHours} h</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ID</span>
                <span className="text-xs font-mono text-muted-foreground truncate max-w-[140px]">{device.id}</span>
              </div>
            </div>
          </div>

          {/* Nota de actualización */}
          <p className="text-xs text-muted-foreground text-center">
            Datos en tiempo real · Actualización cada {POLL_INTERVAL / 1000}s
          </p>
        </div>
      </div>
    </div>
  );
}
