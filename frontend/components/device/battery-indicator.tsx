interface Props {
  level: number;
}

export function BatteryIndicator({ level }: Props) {
  const color = level < 20 ? "bg-destructive" : level < 40 ? "bg-warning" : "bg-success";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full ${color}`} style={{ width: `${level}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">{level}%</span>
    </div>
  );
}