import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

import { initSocket } from "./socket";
import devicesRouter from "./routes/devices";
import dashboardRouter from "./routes/dashboard";
import telemetryRouter from "./routes/telemetry";
import campusPointsRouter from "./routes/campus-points";
import ordersRouter from "./routes/orders";
import alertsRouter from "./routes/alerts";
import authRouter from "./routes/auth";
import { query, queryOne } from "./db";

const app = express();
const port = process.env.PORT ?? 4000;

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/devices", devicesRouter);
app.use("/api/dashboard/kpis", dashboardRouter);
app.use("/api/telemetry", telemetryRouter);
app.use("/api/campus-points", campusPointsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/alerts", alertsRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const httpServer = http.createServer(app);
const io = initSocket(httpServer);

async function ensureDemoUsers() {
  const demoUsers = [
    {
      email: "admin@javerianacali.edu.co",
      fullName: "Admin Fleet Control",
      role: "administrator",
      password: "Admin1234",
    },
    {
      email: "operador@javerianacali.edu.co",
      fullName: "Operador Fleet Control",
      role: "operator",
      password: "Operador1234",
    },
  ];

  for (const u of demoUsers) {
    try {
      const existing = await queryOne<any>(
        "SELECT id FROM users WHERE email = $1",
        [u.email]
      );
      if (!existing) {
        const hash = await bcrypt.hash(u.password, 10);
        await query(
          `INSERT INTO users (email, password_hash, full_name, role)
           VALUES ($1, $2, $3, $4)`,
          [u.email, hash, u.fullName, u.role]
        );
        console.log(`Demo user created: ${u.email}`);
      }
    } catch (err) {
      console.error(`ensureDemoUsers error for ${u.email}:`, err);
    }
  }
}

// Periodic signal loss check (RF-21) — emits alert:new via Socket.io
setInterval(async () => {
  try {
    const updated = await query(`
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
      RETURNING id, code
    `);

    if (updated.length > 0) {
      io.emit("device:status", { updated });
    }

    const alertRows = await query(`
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
      RETURNING *
    `);

    for (const alert of alertRows) {
      io.emit("alert:new", {
        id: alert.id,
        deviceId: alert.device_id,
        type: alert.type,
        message: alert.message,
        createdAt: alert.created_at,
      });
    }
  } catch (err) {
    console.error("Signal loss check error:", err);
  }
}, 5000);

httpServer.listen(port, async () => {
  console.log(`Fleet Control PUJ backend listening on port ${port}`);
  await ensureDemoUsers();
});
