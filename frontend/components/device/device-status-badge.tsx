import type { DeviceStatus, SubStatus } from "@/types/device";

interface Props {
  status: DeviceStatus;
  subStatus: SubStatus | null;
}

const config: Record<DeviceStatus, { label: string; variant: "default" | "secondary" | "destructive"; dot: string }> = {
  available: { label: "Disponible", variant: "default", dot: "bg-success" },
  in_mission: { label: "En servicio", variant: "secondary", dot: "bg-info" },
  blocked: { label: "Bloqueado", variant: "destructive", dot: "bg-destructive" },
};

export function DeviceStatusBadge({ status, subStatus }: Props) {
  const { label, variant, dot } = config[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span className="text-xs font-medium text-foreground">{label}</span>
    </span>
  );
}

export function DeviceSubStatusLabel({ subStatus }: { subStatus: SubStatus | null }) {
  if (!subStatus) return null;
  const labels: Record<SubStatus, string> = {
    en_base: "En base",
    cargando: "En base · Cargando",
    bateria_baja: "Batería baja",
    sin_senal: "Sin señal",
    mantenimiento: "Mantenimiento",
  };
  return (
    <span className="text-xs text-muted-foreground">{labels[subStatus]}</span>
  );
}