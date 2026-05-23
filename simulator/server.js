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

app.post("/api/simulate-route/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const devices = await fetch(`${BACKEND_URL}/api/devices`).then(r => r.json());
    const device = devices.find((d) => d.id === id);
    if (!device) return res.status(404).json({ error: "Device not found" });

    const campusPoints = [
      "Edificio Almendros", "Biblioteca General", "Cafeteria Central",
      "Edificio Cedros", "Auditorio Mayor", "Edificio El Saman",
      "Cancha Multiple", "Porteria Principal"
    ];
    const shuffled = campusPoints.sort(() => Math.random() - 0.5);
    const origin = shuffled[0];
    const destination = shuffled[1];

    await fetch(`${BACKEND_URL}/api/devices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "in_mission",
        subStatus: null,
        currentRoute: { origin, destination },
      }),
    });

    await fetch(`${BACKEND_URL}/api/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: id,
        latitude: device.base_latitude || 3.345,
        longitude: device.base_longitude || -76.53,
        batteryLevel: device.batteryLevel,
        speed: 5,
        missionStatus: `${origin} → ${destination}`,
        signalLost: false,
      }),
    });

    res.json({ success: true, route: { origin, destination } });
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