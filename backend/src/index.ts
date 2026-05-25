import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import devicesRouter from "./routes/devices";
import dashboardRouter from "./routes/dashboard";
import telemetryRouter from "./routes/telemetry";
import campusPointsRouter from "./routes/campus-points";
import ordersRouter from "./routes/orders";
import alertsRouter from "./routes/alerts";
import { query } from "./db";

const app = express();
const port = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

app.use("/api/devices", devicesRouter);
app.use("/api/dashboard/kpis", dashboardRouter);
app.use("/api/telemetry", telemetryRouter);
app.use("/api/campus-points", campusPointsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/alerts", alertsRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

async function ensureDemoUser() {
  try {
    await query(`
      INSERT INTO users (id, email, password_hash, full_name, role)
      VALUES (
        '00000000-0000-0000-0000-000000000000',
        'm.ramirez@javerianacali.edu.co',
        'demo_hash_not_for_auth',
        'Maria Ramirez',
        'administrator'
      )
      ON CONFLICT (id) DO NOTHING
    `);
  } catch (err) {
    console.error("ensureDemoUser error:", err);
  }
}

// Periodic signal loss check (RF-21)
setInterval(async () => {
  try {
    await query(`
      UPDATE devices
      SET sub_status = 'sin_senal', status = 'blocked'
      WHERE status != 'blocked'
        AND sub_status IS DISTINCT FROM 'mantenimiento'
        AND sub_status IS DISTINCT FROM 'bateria_baja'
        AND sub_status IS DISTINCT FROM 'cargando'
        AND (
          SELECT COALESCE(MAX(recorded_at), '1970-01-01'::timestamptz)
          FROM telemetry
          WHERE telemetry.device_id = devices.id
        ) < NOW() - INTERVAL '30 seconds'
    `);

    await query(`
      INSERT INTO alerts (device_id, type, message)
      SELECT d.id, 'signal_loss',
             'Pérdida de señal: el dispositivo ' || d.code || ' no responde'
      FROM devices d
      WHERE d.sub_status = 'sin_senal'
        AND NOT EXISTS (
          SELECT 1 FROM alerts a
          WHERE a.device_id = d.id
            AND a.type = 'signal_loss'
            AND a.created_at > NOW() - INTERVAL '5 minutes'
        )
    `);
  } catch (err) {
    console.error("Signal loss check error:", err);
  }
}, 5000);

app.listen(port, async () => {
  console.log(`Fleet Control PUJ backend listening on port ${port}`);
  await ensureDemoUser();
});