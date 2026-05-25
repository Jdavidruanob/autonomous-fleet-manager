"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Activity, Bot, PackageCheck, XCircle } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DeviceCard } from "@/components/device/device-card";
import type { Device, DashboardKpis } from "@/types/device";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const POLL_INTERVAL = 3000;

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (isInitial: boolean) => {
    try {
      const [devicesRes, kpisRes] = await Promise.all([
        fetch(`${API_BASE}/api/devices`),
        fetch(`${API_BASE}/api/dashboard/kpis`),
      ]);

      if (devicesRes.ok) {
        const data = await devicesRes.json();
        setDevices(data);
      }
      if (kpisRes.ok) {
        const data = await kpisRes.json();
        setKpis(data);
      }

      setLastUpdated(new Date());
      if (isInitial) setInitialLoading(false);
    } catch {
      if (isInitial) setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    intervalRef.current = setInterval(() => fetchData(false), POLL_INTERVAL);
    secondsIntervalRef.current = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (secondsIntervalRef.current) clearInterval(secondsIntervalRef.current);
    };
  }, [fetchData]);

  useEffect(() => {
    if (lastUpdated) {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }
  }, [lastUpdated]);

  const kpiCards = [
    {
      label: "Órdenes en curso",
      value: kpis?.ordersInProgress ?? 0,
      Icon: <Activity className="h-4 w-4 text-info" />,
      tint: "bg-info/10",
    },
    {
      label: "Dispositivos disponibles",
      value: kpis?.devicesAvailable ?? 0,
      Icon: <Bot className="h-4 w-4 text-success" />,
      tint: "bg-success/10",
    },
    {
      label: "Órdenes completadas hoy",
      value: kpis?.ordersCompletedToday ?? 0,
      Icon: <PackageCheck className="h-4 w-4 text-primary" />,
      tint: "bg-primary/10",
    },
    {
      label: "Órdenes canceladas hoy",
      value: kpis?.ordersCancelledToday ?? 0,
      Icon: <XCircle className="h-4 w-4 text-destructive" />,
      tint: "bg-destructive/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Panel principal</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Estado actual de la flota y operaciones en curso.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map(({ label, value, Icon, tint }) => (
          <KpiCard
            key={label}
            label={label}
            value={value}
            icon={Icon}
            tint={tint}
            loading={initialLoading}
          />
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Dispositivos</h2>
          {lastUpdated && !initialLoading && (
            <span className="text-xs text-muted-foreground">
              Actualizado hace {secondsAgo} {secondsAgo === 1 ? "segundo" : "segundos"}
            </span>
          )}
        </div>

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