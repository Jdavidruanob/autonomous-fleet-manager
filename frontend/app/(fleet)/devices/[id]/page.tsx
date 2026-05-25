"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Bot, Plane, ArrowRight, Video, WifiOff, RotateCcw, Ban,
  Battery, Gauge, MapPin, Clock, Route as RouteIcon, Activity,
  Cpu, VideoOff, Thermometer, Radio, CheckCircle2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const POLL_INTERVAL = 3000;

interface TelemetryData {
  latitude: string;
  longitude: string;
  speed: string | null;
  temperature: string | null;
  sensors_status: string;
  camera_status: string;
  current_order_id: string | null;
  signal_lost: boolean;
}

interface DeviceDetail extends Device {
  subStatus: string | null;
}

interface Device {
  id: string;
  name: string;
  code: string;
  type: "robot" | "drone";
  status: "available" | "in_mission" | "blocked";
  subStatus: string | null;
  batteryLevel: number;
  accumulatedKm: number;
  flightHours: number;
  currentRoute: { origin: string; destination: string } | null;
}

export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [opResult, setOpResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchDeviceData = useCallback(async (isInitial = false) => {
    try {
      const [deviceRes, telemetryRes] = await Promise.all([
        fetch(`${API_BASE}/api/devices/${params.id}`),
        fetch(`${API_BASE}/api/devices/${params.id}/telemetry`)
      ]);

      if (!deviceRes.ok) {
        if (deviceRes.status === 404) {
          setError("Dispositivo no encontrado");
        } else {
          setError("Error al cargar el dispositivo");
        }
        if (isInitial) setLoading(false);
        return;
      }

      const deviceData = await deviceRes.json();
      setDevice(deviceData);

      if (telemetryRes.ok) {
        const telemetryData = await telemetryRes.json();
        setTelemetry(telemetryData);
      }

      if (isInitial) setLoading(false);
    } catch (err) {
      if (isInitial) {
        setError("Error de conexión");
        setLoading(false);
      }
    }
  }, [params.id]);

  useEffect(() => {
    fetchDeviceData(true);
    const interval = setInterval(() => fetchDeviceData(false), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchDeviceData]);

  // Operations
  const handleForceReturn = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/devices/${params.id}/force-return`, {
        method: "POST"
      });
      if (res.ok) {
        setOpResult({ type: "success", message: `Retorno forzado ordenado. ${device?.code} regresará al punto de origen.` });
        setShowReturnModal(false);
        fetchDeviceData();
      } else {
        setOpResult({ type: "error", message: "Error al ordenar retorno forzado." });
      }
    } catch {
      setOpResult({ type: "error", message: "Error de conexión con el backend." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/devices/${params.id}/cancel-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason || "Cancelado desde el panel de control" })
      });
      if (res.ok) {
        setOpResult({ type: "success", message: "Misión cancelada con éxito. La orden activa ha sido cancelada." });
        setShowCancelModal(false);
        setCancelReason("");
        fetchDeviceData();
      } else {
        setOpResult({ type: "error", message: "Error al cancelar la misión." });
      }
    } catch {
      setOpResult({ type: "error", message: "Error de conexión con el backend." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <div className="text-muted-foreground text-sm">Cargando monitoreo en vivo...</div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-destructive font-medium">{error || "Dispositivo no encontrado"}</div>
        <Button variant="outline" onClick={() => router.push("/")}>
          Volver al panel principal
        </Button>
      </div>
    );
  }

  const isSignalLost = device.subStatus === "sin_senal";
  const typeLabels = { robot: "Robot terrestre", drone: "Dron Autónomo" };
  const sensorsStatus = telemetry?.sensors_status || "normal";
  const cameraStatus = telemetry?.camera_status || "off";
  const isCameraActive = cameraStatus === "streaming" || cameraStatus === "recording";

  return (
    <div className="space-y-6">
      {opResult && (
        <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${opResult.type === "success" ? "border-success/30 bg-success/10 text-success" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>
          {opResult.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {opResult.message}
          <button className="ml-auto text-xs opacity-60 hover:opacity-100" onClick={() => setOpResult(null)}>✕</button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/")} className="h-8">
            <ArrowRight className="h-4 w-4 rotate-180 mr-1.5" />
            Panel principal
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{device.code}</h1>
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border">{device.id}</span>
            </div>
            <p className="text-muted-foreground text-xs mt-1">
              {typeLabels[device.type]} · {device.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSignalLost ? (
            <Badge variant="destructive" className="gap-1.5 px-3 py-1 font-semibold text-xs rounded-full">
              <WifiOff className="h-3 w-3" /> Sin señal
            </Badge>
          ) : device.status === "available" ? (
            <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1.5 px-3 py-1 font-semibold text-xs rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Disponible
            </Badge>
          ) : device.status === "in_mission" ? (
            <Badge variant="outline" className="bg-info/10 text-info border-info/30 gap-1.5 px-3 py-1 font-semibold text-xs rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-info animate-pulse" /> En Misión
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1.5 px-3 py-1 font-semibold text-xs rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" /> Bloqueado
            </Badge>
          )}
          
          {device.subStatus && device.subStatus !== "sin_senal" && (
            <Badge variant="secondary" className="px-3 py-1 text-xs rounded-full uppercase font-bold tracking-wider">
              {device.subStatus === "mantenimiento" ? "Mantenimiento" : device.subStatus === "bateria_baja" ? "Batería Crítica" : device.subStatus === "cargando" ? "Cargando" : device.subStatus}
            </Badge>
          )}
        </div>
      </div>

      {/* Signal Loss Banner */}
      {isSignalLost && (
        <div className="flex items-start gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 shadow-sm">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-destructive/15 text-destructive shrink-0">
            <WifiOff className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="font-semibold text-destructive text-sm">Pérdida de señal de telemetría</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No se han recibido pings del dispositivo en los últimos 30 segundos. El dispositivo ha sido bloqueado preventivamente por pérdida de conectividad.
            </p>
            <div className="text-[11px] font-mono text-slate-500 mt-1">
              Último estado reportado: batería {device.batteryLevel}% · ubicación: {telemetry?.latitude || "—"}, {telemetry?.longitude || "—"}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchDeviceData(true)} className="shrink-0 h-8 text-xs">
            Forzar Reconexión
          </Button>
        </div>
      )}

      {/* Grid Layout: Streaming and status metrics */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        
        {/* Livestream Area */}
        <div className="rounded-xl border bg-card shadow overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between p-4 border-b bg-slate-50/50">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Video className="h-4 w-4 text-slate-700" />
              <span>Transmisión de Cámara</span>
            </div>
            
            <div className="flex items-center gap-2">
              {isCameraActive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive-foreground animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  {cameraStatus === "recording" ? "Grabando" : "En vivo"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Cámara Apagada
                </span>
              )}
            </div>
          </div>

          <div className="relative h-[440px] bg-slate-950 text-slate-400 grid place-items-center overflow-hidden">
            {isCameraActive && !isSignalLost ? (
              <>
                {/* Dynamic Camera Hud Graphic Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(38,189,248,0.05),transparent_70%)]" />
                <div className="absolute inset-x-8 top-8 flex justify-between font-mono text-[10px] text-sky-400/80 pointer-events-none select-none z-10">
                  <div className="space-y-1">
                    <div>RTSP STREAM ACTIVE</div>
                    <div>FPS: 30 / BITRATE: 2.4 MBPS</div>
                    <div>CAM STATUS: {cameraStatus.toUpperCase()}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <div>ALT: {device.type === "drone" ? "12.4m" : "0.0m"}</div>
                    <div>TEMP: {telemetry?.temperature ? `${telemetry.temperature}°C` : "24°C"}</div>
                    <div>SENSORS: {sensorsStatus.toUpperCase()}</div>
                  </div>
                </div>

                <div className="absolute inset-y-8 inset-x-12 border border-sky-500/10 flex items-center justify-center pointer-events-none select-none">
                  {/* Scope markings */}
                  <div className="w-16 h-16 border-t-2 border-l-2 border-sky-400/40 absolute top-0 left-0" />
                  <div className="w-16 h-16 border-t-2 border-r-2 border-sky-400/40 absolute top-0 right-0" />
                  <div className="w-16 h-16 border-b-2 border-l-2 border-sky-400/40 absolute bottom-0 left-0" />
                  <div className="w-16 h-16 border-b-2 border-r-2 border-sky-400/40 absolute bottom-0 right-0" />
                  
                  {/* Central Reticle */}
                  <div className="w-6 h-6 border border-dashed border-sky-400/50 rounded-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-sky-400 rounded-full" />
                  </div>
                </div>

                {/* Animated Mock Stream */}
                <div className="relative text-center text-sky-400 space-y-2 select-none">
                  <Radio className="h-14 w-14 mx-auto animate-pulse opacity-80" />
                  <div className="font-bold tracking-wider uppercase text-xs">Video Feed Estabilizado</div>
                  <div className="text-[10px] text-sky-400/60 font-mono mt-1 select-all">
                    rtsp://fleet.javerianacali.edu.co/{device.id.slice(0,8)}
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 text-[10px] font-mono text-sky-400/70 bg-slate-900/80 px-2 py-1 rounded border border-sky-500/20">
                  GPS: {telemetry?.latitude ? Number(telemetry.latitude).toFixed(5) : "3.345"}, {telemetry?.longitude ? Number(telemetry.longitude).toFixed(5) : "-76.53"}
                </div>
              </>
            ) : (
              <div className="relative text-center text-slate-500 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto shadow-inner">
                  <VideoOff className="h-8 w-8 opacity-40" />
                </div>
                <div className="font-semibold text-sm">Cámara Apagada</div>
                <p className="text-xs text-slate-600 max-w-[280px] mx-auto leading-relaxed">
                  {isSignalLost 
                    ? "Conexión perdida con el dispositivo. Restablezca la telemetría para recuperar el stream."
                    : "El stream de video no está activo actualmente. Puede encender la cámara desde el Panel del Simulador."
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Diagnostic and Telemetry metrics */}
        <div className="space-y-4">
          {/* Mission status info */}
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-slate-600" />
              <span>Estado de la Misión</span>
            </div>
            
            {device.status === "in_mission" && device.currentRoute ? (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-info-text bg-info/10 border border-info/20 px-2.5 py-1.5 rounded-lg flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 animate-pulse" />
                  <span>En Servicio Activo</span>
                </div>
                
                <div className="rounded-lg border bg-slate-50/50 p-3 space-y-2">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Trayecto en Curso</div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <span className="truncate max-w-[120px]">{device.currentRoute.origin}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate max-w-[120px]">{device.currentRoute.destination}</span>
                  </div>
                </div>
                
                {telemetry?.current_order_id && (
                  <div className="text-[11px] font-mono text-muted-foreground flex items-center justify-between bg-slate-50 p-2 rounded border">
                    <span>Orden Asignada:</span>
                    <span className="font-bold text-slate-700">{telemetry.current_order_id.slice(0, 8)}...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-medium text-slate-600 bg-slate-100 border px-2.5 py-1.5 rounded-lg">
                  Inactivo / En Base de Operaciones
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Este dispositivo no tiene órdenes programadas en este momento. Está descansando y listo para su siguiente asignación.
                </p>
              </div>
            )}
          </div>

          {/* Telemetry panel */}
          <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">
              Lecturas de Telemetría
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <TelemetryGridItem 
                Icon={Battery} 
                label="Batería" 
                value={`${device.batteryLevel}%`} 
                bar={device.batteryLevel} 
              />
              
              <TelemetryGridItem 
                Icon={Gauge} 
                label="Velocidad" 
                value={telemetry?.speed ? `${Number(telemetry.speed).toFixed(1)} m/s` : "0.0 m/s"} 
              />

              <TelemetryGridItem 
                Icon={Thermometer} 
                label="Temperatura" 
                value={telemetry?.temperature ? `${Number(telemetry.temperature).toFixed(1)} °C` : "24.0 °C"} 
              />

              <TelemetryGridItem
                Icon={device.type === "robot" ? RouteIcon : Plane}
                label={device.type === "robot" ? "Uso Total (Km)" : "Horas de vuelo"}
                value={device.type === "robot" ? `${device.accumulatedKm} km` : `${device.flightHours} hrs`}
              />
            </div>

            {/* GPS coordinates widget */}
            <div className="rounded-lg border bg-secondary/20 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                <span>Ubicación GPS Exacta</span>
              </div>
              <div className="text-xs font-mono text-slate-700">
                Lat: {telemetry?.latitude ? Number(telemetry.latitude).toFixed(7) : (device.type === "robot" ? "3.3455000" : "3.3460000")}<br/>
                Lon: {telemetry?.longitude ? Number(telemetry.longitude).toFixed(7) : (device.type === "robot" ? "-76.5305000" : "-76.5295000")}
              </div>
            </div>

            {/* Sensors Status Widget */}
            <div className="rounded-lg border p-3 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Sensores Internos</span>
              </div>
              <div>
                {sensorsStatus === "normal" ? (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    Normal
                  </Badge>
                ) : sensorsStatus === "warning" ? (
                  <Badge variant="outline" className="bg-warning/10 text-warning-foreground border-warning/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    Warning
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    Error
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operator Control Actions Section */}
      <div className="flex flex-wrap gap-3 border-t pt-5">
        <Button 
          variant="outline" 
          onClick={() => setShowReturnModal(true)}
          className="gap-2 h-9 text-xs font-semibold"
          disabled={device.status !== "in_mission"}
        >
          <RotateCcw className="h-4 w-4 text-slate-700" />
          Forzar retorno a base
        </Button>
        
        <Button 
          variant="destructive" 
          onClick={() => setShowCancelModal(true)}
          className="gap-2 h-9 text-xs font-semibold"
          disabled={device.status !== "in_mission"}
        >
          <Ban className="h-4 w-4" />
          Cancelar orden actual
        </Button>
      </div>

      {/* Force Return Confirmation Overlay */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in-0 duration-200">
          <div className="bg-white rounded-xl border max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">¿Forzar retorno a base?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              El dispositivo <strong>{device.code}</strong> abortará inmediatamente su misión actual y regresará de forma directa al punto de partida. La orden activa quedará anulada.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowReturnModal(false)} disabled={isSubmitting}>
                Cerrar
              </Button>
              <Button variant="default" size="sm" onClick={handleForceReturn} disabled={isSubmitting}>
                {isSubmitting ? "Enviando comando..." : "Confirmar Retorno"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Overlay */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in-0 duration-200">
          <div className="bg-white rounded-xl border max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-destructive">¿Cancelar orden activa?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Esta acción detendrá de forma definitiva el servicio del dispositivo {device.code}. Se notificará la cancelación y se liberará la flota.
            </p>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">Razón de Cancelación</label>
              <input 
                type="text" 
                placeholder="Ej. Paquete dañado, condiciones climáticas..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs p-2 border rounded-md outline-none focus:border-primary"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowCancelModal(false)} disabled={isSubmitting}>
                Volver
              </Button>
              <Button variant="destructive" size="sm" onClick={handleCancelOrder} disabled={isSubmitting}>
                {isSubmitting ? "Procesando..." : "Sí, Cancelar Orden"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TelemetryGridItem({ Icon, label, value, bar }: { Icon: any; label: string; value: string; bar?: number }) {
  return (
    <div className="space-y-1.5 rounded-xl border bg-slate-50/50 p-3 flex flex-col justify-between">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        <span>{label}</span>
      </div>
      
      <div className="text-sm font-bold text-slate-800">{value}</div>
      
      {bar !== undefined && (
        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden w-full mt-1">
          <div
            className={`h-full ${bar < 20 ? "bg-destructive" : bar < 40 ? "bg-warning" : "bg-success"}`}
            style={{ width: `${bar}%` }}
          />
        </div>
      )}
    </div>
  );
}