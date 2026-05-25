"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bot, Plane, ArrowRight, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BatteryIndicator } from "@/components/device/battery-indicator";
import { DeviceStatusBadge, DeviceSubStatusLabel } from "@/components/device/device-status-badge";
import type { Device } from "@/types/device";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const POLL_INTERVAL = 3000;

export default function DevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDevices = useCallback(async (initial = false) => {
    try {
      const res = await fetch(`${API_BASE}/api/devices`);
      if (res.ok) {
        setDevices(await res.json());
        setLastUpdated(new Date());
      }
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices(true);
    intervalRef.current = setInterval(() => fetchDevices(false), POLL_INTERVAL);
    const secInterval = setInterval(
      () => setSecondsAgo((s) => s + 1),
      1000
    );
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(secInterval);
    };
  }, [fetchDevices]);

  useEffect(() => {
    if (lastUpdated)
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
  }, [lastUpdated]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dispositivos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Listado completo de robots y drones de la flota.
          </p>
        </div>
        {lastUpdated && !loading && (
          <span className="text-xs text-muted-foreground">
            Actualizado hace {secondsAgo}{" "}
            {secondsAgo === 1 ? "segundo" : "segundos"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg border p-4 h-40" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => {
            const isRobot = device.type === "robot";
            const showRoute =
              device.status === "in_mission" && device.currentRoute;
            return (
              <div
                key={device.id}
                className="bg-card rounded-lg border overflow-hidden flex flex-col"
              >
                <div
                  className={`p-3 flex items-center gap-3 ${
                    isRobot ? "bg-primary/10" : "bg-info/10"
                  }`}
                >
                  <div
                    className={`grid h-10 w-10 place-items-center rounded-lg text-xs font-bold ${
                      isRobot
                        ? "bg-primary/20 text-primary"
                        : "bg-info/20 text-info"
                    }`}
                  >
                    {isRobot ? (
                      <Bot className="h-5 w-5" />
                    ) : (
                      <Plane className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{device.code}</div>
                    <div className="text-xs text-muted-foreground">
                      {isRobot ? "Robot terrestre" : "Dron"}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <DeviceStatusBadge
                      status={device.status}
                      subStatus={device.subStatus}
                    />
                    <DeviceSubStatusLabel subStatus={device.subStatus} />
                  </div>
                </div>

                <div className="p-3 flex flex-col gap-2 flex-1">
                  {showRoute && (
                    <div className="flex items-center gap-1.5 text-sm bg-secondary/50 rounded-md px-3 py-2">
                      {!isRobot ? (
                        <Video className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className="font-medium text-foreground">
                        {device.currentRoute!.origin}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground">
                        {device.currentRoute!.destination}
                      </span>
                    </div>
                  )}
                  <div className="space-y-1">
                    <BatteryIndicator level={device.batteryLevel} />
                    <div className="text-xs text-muted-foreground">
                      {isRobot
                        ? `${device.accumulatedKm} km recorridos`
                        : `${device.flightHours} h de vuelo`}
                    </div>
                  </div>
                </div>

                <div className="p-3 pt-0 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    id={`btn-monitor-${device.id}`}
                    onClick={() => router.push(`/devices/${device.id}`)}
                  >
                    Monitorear
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
