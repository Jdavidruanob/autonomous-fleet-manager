"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart3, Package, Video, Clock, CheckCircle2, XCircle, Loader2, Filter, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type OrderStatus = "pending" | "in_progress" | "completed" | "cancelled";
type OrderType = "delivery" | "recording";

interface Order {
  id: string;
  type: OrderType;
  status: OrderStatus;
  deviceCode: string;
  operatorName: string;
  originPointName: string;
  destinationPointName: string;
  senderEmail: string;
  recipientEmail: string;
  createdAt: string;
  updatedAt: string;
}

function statusConfig(status: OrderStatus) {
  switch (status) {
    case "pending":      return { label: "Pendiente",  icon: Clock,         variant: "secondary" as const };
    case "in_progress":  return { label: "En curso",    icon: Loader2,       variant: "default" as const };
    case "completed":    return { label: "Completada",  icon: CheckCircle2,  variant: "outline" as const };
    case "cancelled":    return { label: "Cancelada",   icon: XCircle,       variant: "destructive" as const };
    default:             return { label: "Desconocido", icon: Clock,         variant: "outline" as const };
  }
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString("es-CO", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function todayISO() { return new Date().toISOString().slice(0, 10); }
function thirtyDaysAgoISO() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(thirtyDaysAgoISO());
  const [to, setTo] = useState(todayISO());
  const [typeFilter, setTypeFilter] = useState<"all" | OrderType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`${API_BASE}/api/orders?${params}`);
      if (res.ok) setOrders(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [typeFilter, statusFilter, from, to]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const total = orders.length;
  const completed = orders.filter((o) => o.status === "completed").length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;
  const inProgress = orders.filter((o) => o.status === "in_progress").length;
  const deliveries = orders.filter((o) => o.type === "delivery").length;
  const recordings = orders.filter((o) => o.type === "recording").length;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reportes y bitácora</h1>
          <p className="text-muted-foreground text-sm mt-1">Historial completo de órdenes de servicio con filtros combinados.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={fetchOrders}>
          <Download className="h-4 w-4" /> Actualizar
        </Button>
      </div>

      {/* KPI summary */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {[
          { label: "Total", value: total, color: "text-foreground" },
          { label: "Completadas", value: completed, color: "text-success" },
          { label: "Canceladas", value: cancelled, color: "text-destructive" },
          { label: "En curso", value: inProgress, color: "text-info" },
          { label: "Entregas", value: deliveries, color: "text-primary" },
          { label: "Grabaciones", value: recordings, color: "text-warning" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-4 text-center">
            <div className={cn("text-2xl font-bold tabular-nums", color)}>{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Desde</span>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Hasta</span>
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">Todos los tipos</option>
            <option value="delivery">Entrega</option>
            <option value="recording">Grabación</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="in_progress">En curso</option>
            <option value="completed">Completada</option>
            <option value="cancelled">Cancelada</option>
          </select>
          {(typeFilter !== "all" || statusFilter !== "all" || from !== thirtyDaysAgoISO() || to !== todayISO()) && (
            <button
              onClick={() => { setTypeFilter("all"); setStatusFilter("all"); setFrom(thirtyDaysAgoISO()); setTo(todayISO()); }}
              className="h-9 px-3 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary border border-dashed transition-colors"
            >
              Limpiar filtros
            </button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">{total} resultado{total !== 1 ? "s" : ""}</span>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Creada</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Dispositivo</TableHead>
              <TableHead>Remitente</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Cargando registros...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No se encontraron registros en el rango seleccionado.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => {
                const cfg = statusConfig(o.status);
                const StatusIcon = cfg.icon;
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {o.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        {o.type === "recording"
                          ? <Video className="h-3.5 w-3.5 text-info" />
                          : <Package className="h-3.5 w-3.5 text-primary" />}
                        {o.type === "recording" ? "Grabación" : "Entrega"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {fmt(o.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm">{o.originPointName || "—"}</TableCell>
                    <TableCell className="text-sm">{o.destinationPointName || "—"}</TableCell>
                    <TableCell className="text-sm font-mono">{o.deviceCode || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                      {o.senderEmail || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant} className="gap-1.5 whitespace-nowrap">
                        <StatusIcon className={cn("h-3.5 w-3.5", o.status === "in_progress" && "animate-spin")} />
                        {cfg.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
