import { Router } from "express";
import { query } from "../db";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const text = `
      SELECT
        o.id,
        o.created_at AS "createdAt",
        cp_orig.name AS origin,
        cp_dest.name AS destination,
        o.status,
        d.code AS "deviceId",
        d.name AS "deviceName",
        o.sender_email AS "requesterName"
      FROM orders o
      JOIN devices d ON o.device_id = d.id
      JOIN campus_points cp_orig ON o.origin_point_id = cp_orig.id
      LEFT JOIN campus_points cp_dest ON o.destination_point_id = cp_dest.id
      ORDER BY o.created_at DESC;
    `;
    const result = await query(text);
    res.json(result);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
