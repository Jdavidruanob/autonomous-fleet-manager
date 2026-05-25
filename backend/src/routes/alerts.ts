import { Router } from "express";
import { query, queryOne } from "../db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { deviceId, isRead, limit = 50 } = req.query;

    let sql = `
      SELECT a.*,
             d.code as device_code, d.name as device_name,
             o.id as order_id
      FROM alerts a
      LEFT JOIN devices d ON a.device_id = d.id
      LEFT JOIN orders o ON a.order_id = o.id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let p = 1;

    if (deviceId) {
      sql += ` AND a.device_id = $${p++}`;
      params.push(deviceId);
    }
    if (isRead !== undefined) {
      sql += ` AND a.is_read = $${p++}`;
      params.push(isRead === "true");
    }

    sql += ` ORDER BY a.created_at DESC LIMIT $${p++}`;
    params.push(Number(limit));

    const rows = await query(sql, params);

    const alerts = rows.map((row: any) => ({
      id: row.id,
      deviceId: row.device_id,
      deviceCode: row.device_code,
      deviceName: row.device_name,
      orderId: row.order_id,
      type: row.type,
      message: row.message,
      isRead: row.is_read,
      createdAt: row.created_at,
    }));

    res.json(alerts);
  } catch (err) {
    console.error("GET /api/alerts error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    await query("UPDATE alerts SET is_read = TRUE WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/alerts/:id/read error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/read-all", async (_req, res) => {
  try {
    await query("UPDATE alerts SET is_read = TRUE WHERE is_read = FALSE");
    res.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/alerts/read-all error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;