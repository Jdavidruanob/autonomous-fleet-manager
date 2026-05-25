import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import devicesRouter from "./routes/devices";
import dashboardRouter from "./routes/dashboard";
import telemetryRouter from "./routes/telemetry";
import campusPointsRouter from "./routes/campus-points";

const app = express();
const port = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

app.use("/api/devices", devicesRouter);
app.use("/api/dashboard/kpis", dashboardRouter);
app.use("/api/telemetry", telemetryRouter);
app.use("/api/campus-points", campusPointsRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Fleet Control PUJ backend listening on port ${port}`);
});