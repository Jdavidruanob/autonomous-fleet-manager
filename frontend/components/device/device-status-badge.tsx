import type { DeviceStatus, SubStatus } from "@/types/device";

interface Props {
  status: DeviceStatus;
}

const config: Record<DeviceStatus, { label: string; dot: string }> = {
  available: { label: "Disponible", dot: "bg-success" },
  in_mission: { label: "En servicio", dot: "bg-info" },
  blocked: { label: "Bloqueado", dot: "bg-destructive" },
};

export function DeviceStatusBadge({ status }: Props) {
  const { label, dot } = config[status];
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
