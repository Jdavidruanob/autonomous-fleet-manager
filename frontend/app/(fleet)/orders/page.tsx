"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Package, Video, Plus, Search, ArrowRight, Clock, CheckCircle2, XCircle, Loader2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type OrderStatus = "pending" | "in_progress" | "completed" | "cancelled";
type OrderType = "delivery" | "recording";
type FilterType = "all" | OrderType;
type FilterStatus = "all" | OrderStatus;

interface Order {
  id: string;
  type: OrderType;
  status: OrderStatus;
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  operatorName: string;
  originPointId: string;
  originPointName: string;
  destinationPointId: string;
  destinationPointName: string;
  senderEmail: string;
  recipientEmail: string;
  qrHash: string;
  qrScannedAt: string;
  cancellationReason: string;
  cancelledAt: string;
  createdAt: string;
  updatedAt: string;
  timeline?: Array<{ label: string; ts: string; description: string }>;
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("es-CO", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function getStatusConfig(status: OrderStatus) {
  switch (status) {
    case "pending":
      return { label: "Pendiente", icon: Clock, variant: "secondary" as const };
    case "in_progress":
      return { label: "En curso", icon: Loader2, variant: "default" as const };
    case "completed":
      return { label: "Completada", icon: CheckCircle2, variant: "outline" as const };
    case "cancelled":
      return { label: "Cancelada", icon: XCircle, variant: "destructive" as const };
    default:
      return { label: "Desconocido", icon: Clock, variant: "outline" as const };
  }
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      params.set("limit", "100");
      const url = `${API_BASE}/api/orders${params.size ? "?" + params.toString() : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = orders.filter((o) => {
    if (typeFilter !== "all" && o.type !== typeFilter) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (q) {
      const s = q.toLowerCase();
      return (
        o.id.toLowerCase().includes(s) ||
        o.senderEmail.toLowerCase().includes(s) ||
        o.recipientEmail.toLowerCase().includes(s) ||
        (o.deviceCode || "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bitácora de órdenes</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} resultados</p>
        </div>
        <Button onClick={() => router.push("/orders/new")}>
          <Plus className="h-4 w-4" /> Nueva orden
        </Button>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por ID, dispositivo o correo..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as FilterType)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">Todos los tipos</option>
              <option value="delivery">Entrega</option>
              <option value="recording">Grabación</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="in_progress">En curso</option>
            <option value="completed">Completada</option>
            <option value="cancelled">Cancelada</option>
          </select>

          {(typeFilter !== "all" || statusFilter !== "all" || q) && (
            <button
              onClick={() => { setQ(""); setTypeFilter("all"); setStatusFilter("all"); }}
              className="h-9 px-3 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border border-dashed"
            >
              Limpiar
            </button>
          )}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">ID</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Creada</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Dispositivo</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Cargando órdenes...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No se encontraron órdenes.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((o) => {
                const statusCfg = getStatusConfig(o.status);
                return (
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => setSelected(o)}>
                    <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        {o.type === "recording" ? (
                          <Video className="h-3.5 w-3.5 text-info" />
                        ) : (
                          <Package className="h-3.5 w-3.5 text-primary" />
                        )}
                        {o.type === "recording" ? "Grabación" : "Entrega"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(o.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm">{o.originPointName || "—"}</TableCell>
                    <TableCell className="text-sm">{o.destinationPointName || "—"}</TableCell>
                    <TableCell className="text-sm font-mono">
                      {o.deviceCode || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusCfg.variant} className="gap-1.5">
                        {(() => {
                          const Icon = statusCfg.icon;
                          return <Icon className={`h-3.5 w-3.5 ${o.status === "in_progress" ? "animate-spin" : ""}`} />;
                        })()}
                        {statusCfg.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono">{selected.id.slice(0, 8)}...</SheetTitle>
                <SheetDescription>
                  {selected.type === "recording" ? "Grabación" : "Entrega"} · {selected.status}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      selected.status === "completed"
                        ? "outline"
                        : selected.status === "cancelled"
                        ? "destructive"
                        : selected.status === "in_progress"
                        ? "default"
                        : "secondary"
                    }
                    className="gap-1.5"
                  >
                    {(() => {
                      const cfg = getStatusConfig(selected.status);
                      if (cfg.icon) {
                        const Icon = cfg.icon;
                        return <Icon className={`h-3.5 w-3.5 ${selected.status === "in_progress" ? "animate-spin" : ""}`} />;
                      }
                      return null;
                    })()}
                    {getStatusConfig(selected.status).label}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    creada {formatDateTime(selected.createdAt)}
                  </span>
                </div>

                <dl className="grid grid-cols-3 gap-y-2 gap-x-3">
                  <dt className="col-span-1 text-muted-foreground">Tipo</dt>
                  <dd className="col-span-2 font-medium">
                    {selected.type === "recording" ? "Grabación" : "Entrega"}
                  </dd>
                  <dt className="col-span-1 text-muted-foreground">Remitente</dt>
                  <dd className="col-span-2 font-medium break-all">{selected.senderEmail}</dd>
                  {selected.recipientEmail && (
                    <>
                      <dt className="col-span-1 text-muted-foreground">Destinatario</dt>
                      <dd className="col-span-2 font-medium break-all">{selected.recipientEmail}</dd>
                    </>
                  )}
                  {selected.originPointName && (
                    <>
                      <dt className="col-span-1 text-muted-foreground">Origen</dt>
                      <dd className="col-span-2 font-medium">{selected.originPointName}</dd>
                    </>
                  )}
                  {selected.destinationPointName && (
                    <>
                      <dt className="col-span-1 text-muted-foreground">Destino</dt>
                      <dd className="col-span-2 font-medium">{selected.destinationPointName}</dd>
                    </>
                  )}
                  <dt className="col-span-1 text-muted-foreground">Dispositivo</dt>
                  <dd className="col-span-2 font-medium font-mono">
                    {selected.deviceCode || "—"}
                  </dd>
                </dl>

                {selected.timeline && selected.timeline.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Línea de tiempo
                    </div>
                    <ol className="relative border-l ml-2 space-y-3 pl-4">
                      {selected.timeline.map((t, i) => (
                        <li key={i} className="relative">
                          <span className="absolute -left-[21px] top-1 grid h-3 w-3 place-items-center rounded-full bg-primary ring-4 ring-background" />
                          <div className="text-sm">{t.description || t.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDateTime(t.ts)}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {selected.deviceId && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/devices/${selected.deviceId}`)}
                  >
                    Ver dispositivo asignado
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}