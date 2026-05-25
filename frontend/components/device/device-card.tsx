"use client";

import { useRouter } from "next/navigation";
import { Bot, Plane, ArrowRight, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BatteryIndicator } from "./battery-indicator";
import { DeviceStatusBadge, DeviceSubStatusLabel } from "./device-status-badge";
import type { Device } from "@/types/device";

interface Props {
  device: Device;
}

const typeLabels = { robot: "Robot terrestre", drone: "Dron" };

export function DeviceCard({ device }: Props) {
  const router = useRouter();

  const currentRoute = device.status === "in_mission" ? device.currentRoute : null;

  return (
    <div className="bg-card rounded-lg border overflow-hidden flex flex-col">
      <div className={`p-3 flex items-center gap-3 ${device.type === "drone" ? "bg-info/10" : "bg-primary/10"}`}>
        <div className={`grid h-10 w-10 place-items-center rounded-lg text-xs font-bold ${
          device.type === "robot" ? "bg-primary/20 text-primary" : "bg-info/20 text-info"
        }`}>
          {device.type === "robot" ? <Bot className="h-5 w-5" /> : <Plane className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{device.code}</div>
          <div className="text-xs text-muted-foreground">{typeLabels[device.type]}</div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <DeviceStatusBadge status={device.status} />
          <DeviceSubStatusLabel subStatus={device.subStatus} />
        </div>
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        {currentRoute && (
          <div className="flex items-center gap-1.5 text-sm bg-secondary/50 rounded-md px-3 py-2">
            {device.type === "drone" ? (
              <Video className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span className="font-medium text-foreground">{currentRoute.origin}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="font-medium text-foreground">{currentRoute.destination}</span>
          </div>
        )}

        <div className="space-y-1">
          <BatteryIndicator level={device.batteryLevel} />
          <div className="text-xs text-muted-foreground">
            {device.type === "robot"
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
          onClick={() => router.push(`/devices/${device.id}`)}
        >
          Monitorear
        </Button>
      </div>
    </div>
  );
}
