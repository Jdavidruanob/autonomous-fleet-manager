const express = require("express");

const app = express();
const PORT = 8000;
const BACKEND_URL = process.env.BACKEND_URL || "http://backend:4000";

app.use(express.json());

app.get("/api/devices", async (_req, res) => {
  try {
    const devices = await fetch(`${BACKEND_URL}/api/devices`).then(r => r.json());
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/campus-points", async (_req, res) => {
  try {
    const result = await fetch(`${BACKEND_URL}/api/campus-points`).then(r => r.json());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/devices/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await fetch(`${BACKEND_URL}/api/devices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    }).then(r => r.json());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/telemetry", async (req, res) => {
  try {
    const result = await fetch(`${BACKEND_URL}/api/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    }).then(r => r.json());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/reset-simulation", async (_req, res) => {
  try {
    const devices = await fetch(`${BACKEND_URL}/api/devices`).then(r => r.json());
    const todayStr = new Date().toISOString().split("T")[0];

    const promises = devices.map((d) =>
      fetch(`${BACKEND_URL}/api/devices/${d.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "available",
          subStatus: "en_base",
          batteryLevel: 100.00,
          accumulatedKm: 0,
          flightHours: 0,
          currentRoute: null,
          lastMaintenanceDate: todayStr,
        }),
      })
    );

    await Promise.all(promises);

    const orders = await fetch(`${BACKEND_URL}/api/orders?status=in_progress`).then(r => r.json());
    for (const order of orders) {
      await fetch(`${BACKEND_URL}/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", cancellationReason: "Simulacion reiniciada" }),
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Reset simulation error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const params = new URLSearchParams();
    if (req.query.status) params.set("status", req.query.status);
    const url = `${BACKEND_URL}/api/orders${params.size ? "?" + params.toString() : ""}`;
    const result = await fetch(url).then(r => r.json());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await fetch(`${BACKEND_URL}/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    }).then(r => r.json());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const result = await fetch(`${BACKEND_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    }).then(r => r.json());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/alerts", async (req, res) => {
  try {
    const params = new URLSearchParams();
    if (req.query.deviceId) params.set("deviceId", req.query.deviceId);
    const url = `${BACKEND_URL}/api/alerts${params.size ? "?" + params.toString() : ""}`;
    const result = await fetch(url).then(r => r.json());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(express.static(__dirname));

app.get("/", (_req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Simulator UI running on http://localhost:${PORT}`);
});