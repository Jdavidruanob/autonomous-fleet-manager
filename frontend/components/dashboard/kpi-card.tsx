import type { ReactNode } from "react";

interface Props {
  label: string;
  value: string | number;
  icon: ReactNode;
  tint: string;
  loading?: boolean;
}

export function KpiCard({ label, value, icon, tint, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-card rounded-lg border p-4 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-8 w-16 bg-muted rounded" />
          </div>
          <div className="h-9 w-9 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
          <div className="text-3xl font-semibold mt-2 tabular-nums">{value}</div>
        </div>
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${tint}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}