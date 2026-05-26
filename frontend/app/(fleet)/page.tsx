"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Activity, Bot, PackageCheck, XCircle, MapPin } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DeviceCard } from "@/components/device/device-card";
import { Card } from "@/components/ui/card";
import type { Device, DashboardKpis } from "@/types/device";
import { getSocket } from "@/lib/socket";

const CampusMap = dynamic(
  () => import("@/components/dashboard/campus-map"),
  { ssr: false, loading: () => <div className="h-full w-full rounded-lg bg-muted animate-pulse" /> }
);

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface CampusPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [campusPoints, setCampusPoints] = useState<CampusPoint[]>([]);
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const secondsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchInitialData = useCallback(async () => {
    try {
      const [devicesRes, kpisRes, pointsRes] = await Promise.all([
        fetch(`${API_BASE}/api/devices`),
        fetch(`${API_BASE}/api/dashboard/kpis`),
        fetch(`${API_BASE}/api/campus-points`),
      ]);
      if (devicesRes.ok) setDevices(await devicesRes.json());
      if (kpisRes.ok) setKpis(await kpisRes.json());
      if (pointsRes.ok) setCampusPoints(await pointsRes.json());
      setLastUpdated(new Date());
    } catch { /* ignore */ }
    finally { setInitialLoading(false); }
  }, []);

  const refreshKpis = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/kpis`);
      if (res.ok) setKpis(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchInitialData();
    const socket = getSocket();

    socket.on("telemetry:update", (data: {
      deviceId: string; latitude: number; longitude: number;
      batteryLevel: number; speed: number; missionStatus: string; signalLost: boolean;
    }) => {
      setDevices((prev) =>
        prev.map((d) =>
          d.id === data.deviceId
            ? { ...d, batteryLevel: data.batteryLevel, latitude: data.latitude, longitude: data.longitude, speed: data.speed }
            : d
        )
      );
      setLastUpdated(new Date());
    });

    socket.on("device:status", () => {
      fetch(`${API_BASE}/api/devices`).then((r) => r.json()).then(setDevices).catch(() => {});
      refreshKpis();
      setLastUpdated(new Date());
    });

    socket.on("alert:new", () => { refreshKpis(); });

    secondsIntervalRef.current = setInterval(() => setSecondsAgo((s) => s + 1), 1000);

    return () => {
      socket.off("telemetry:update");
      socket.off("device:status");
      socket.off("alert:new");
      if (secondsIntervalRef.current) clearInterval(secondsIntervalRef.current);
    };
  }, [fetchInitialData, refreshKpis]);

  useEffect(() => {
    if (lastUpdated) setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
  }, [lastUpdated]);

  const kpiCards = [
    { label: "Órdenes en curso", value: kpis?.ordersInProgress ?? 0, Icon: <Activity className="h-4 w-4 text-info" />, tint: "bg-info/10" },
    { label: "Dispositivos disponibles", value: kpis?.devicesAvailable ?? 0, Icon: <Bot className="h-4 w-4 text-success" />, tint: "bg-success/10" },
    { label: "Órdenes completadas hoy", value: kpis?.ordersCompletedToday ?? 0, Icon: <PackageCheck className="h-4 w-4 text-primary" />, tint: "bg-primary/10" },
    { label: "Órdenes canceladas hoy", value: kpis?.ordersCancelledToday ?? 0, Icon: <XCircle className="h-4 w-4 text-destructive" />, tint: "bg-destructive/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Panel principal</h1>
        <p className="text-muted-foreground text-sm mt-1">Estado actual de la flota y operaciones en curso.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map(({ label, value, Icon, tint }) => (
          <KpiCard key={label} label={label} value={value} icon={Icon} tint={tint} loading={initialLoading} />
        ))}
      </div>

      {/* Campus map (RF-19) */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Mapa del campus en tiempo real</span>
          </div>
          {lastUpdated && !initialLoading && (
            <span className="text-xs text-muted-foreground">
              Actualizado hace {secondsAgo} {secondsAgo === 1 ? "segundo" : "segundos"} · Socket.io
            </span>
          )}
        </div>
        <div className="h-[420px] w-full">
          {!initialLoading && (
            <CampusMap devices={devices} campusPoints={campusPoints} />
          )}
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">Dispositivos</h2>
        {initialLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border p-4 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 bg-muted rounded-md" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-16 bg-muted rounded" />
                      <div className="h-3 w-20 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="h-5 w-20 bg-muted rounded" />
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-2 w-full bg-muted rounded-full" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
                <div className="h-8 w-full bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
