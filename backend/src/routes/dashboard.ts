import { Router } from "express";
import { query } from "../db";
import type { DashboardKpis } from "../types";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const [ordersInProgress, devicesAvailable, ordersCompletedToday, ordersCancelledToday] =
      await Promise.all([
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM orders WHERE status = 'in_progress'`
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM devices WHERE status = 'available'`
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM orders WHERE status = 'completed' AND DATE(updated_at) = CURRENT_DATE`
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM orders WHERE status = 'cancelled' AND DATE(cancelled_at) = CURRENT_DATE`
        ),
      ]);

    const kpis: DashboardKpis = {
      ordersInProgress: parseInt(ordersInProgress[0]?.count ?? "0", 10),
      devicesAvailable: parseInt(devicesAvailable[0]?.count ?? "0", 10),
      ordersCompletedToday: parseInt(ordersCompletedToday[0]?.count ?? "0", 10),
      ordersCancelledToday: parseInt(ordersCancelledToday[0]?.count ?? "0", 10),
    };

    res.json(kpis);
  } catch (err) {
    console.error("GET /api/dashboard/kpis error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;