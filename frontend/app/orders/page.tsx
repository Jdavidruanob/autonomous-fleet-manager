"use client";

import { useEffect, useState } from "react";
import { Order, OrderStatus } from "@/types/device";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch(`${API_BASE}/api/orders`);
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, []);

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return { label: "Pendiente", icon: Clock, variant: "secondary" as const };
      case "in_progress":
        return { label: "En progreso", icon: Loader2, variant: "default" as const };
      case "completed":
        return { label: "Completado", icon: CheckCircle2, variant: "outline" as const };
      case "cancelled":
        return { label: "Cancelado", icon: XCircle, variant: "destructive" as const };
      default:
        return { label: "Desconocido", icon: Clock, variant: "outline" as const };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-CO", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Bitácora de Órdenes</h2>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <div className="relative w-full overflow-auto min-h-[400px]">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b bg-muted/30">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ID Orden</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fecha</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Ruta</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Dispositivo</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Solicitante</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="h-48 text-center align-middle">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mb-4" />
                      <p>Cargando bitácora...</p>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-48 text-center align-middle text-muted-foreground">
                    No hay órdenes registradas.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const statusConfig = getStatusConfig(order.status);
                  const StatusIcon = statusConfig.icon;
                  // Handle potential UUID display
                  const displayId = order.id.split("-")[0].toUpperCase();

                  return (
                    <tr key={order.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle font-medium">{displayId}...</td>
                      <td className="p-4 align-middle text-muted-foreground whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[150px] font-medium" title={order.origin}>{order.origin}</span>
                          {order.destination && (
                            <>
                              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate max-w-[150px] font-medium" title={order.destination}>{order.destination}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">
                        {order.deviceName} <span className="text-xs opacity-70">({order.deviceId})</span>
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">
                        {order.requesterName}
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant={statusConfig.variant} className="flex w-fit items-center gap-1.5 px-2.5 py-1">
                          <StatusIcon className={`h-3.5 w-3.5 ${order.status === 'in_progress' ? 'animate-spin' : ''}`} />
                          {statusConfig.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
