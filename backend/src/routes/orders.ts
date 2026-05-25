import { Router } from "express";
import crypto from "node:crypto";
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import pool from "../db";

const router = Router();

type OrderType = "delivery" | "recording";
type DeviceType = "robot" | "drone";

interface CreateOrderBody {
  type?: OrderType;
  deviceId?: string;
  startTime?: string;
  endTime?: string;
  originPointId?: string;
  destinationPointId?: string | null;
  senderEmail?: string;
  recipientEmail?: string;
  simulateWeatherBlocked?: boolean;
}

interface CreatedOrder {
  id: string;
  type: OrderType;
  status: string;
  device_id: string;
  time_slot_id: string;
  origin_point_id: string;
  destination_point_id: string | null;
  sender_email: string;
  recipient_email: string;
  created_at: string;
}

interface MissionWeatherPoint {
  latitude: string;
  longitude: string;
}

interface OpenWeatherResponse {
  weather?: Array<{
    id?: number;
    main?: string;
    description?: string;
  }>;
  wind?: {
    speed?: number;
    gust?: number;
  };
}

type WeatherValidationResult =
  | { success: true }
  | { success: false; status: number; error: string; message: string };

interface QrPayload {
  orderId: string;
  qrHash: string;
  type: OrderType;
  recipientEmail: string;
}

interface EmailResult {
  sent: boolean;
  skipped: boolean;
  message: string;
}

const VALID_ORDER_TYPES: OrderType[] = ["delivery", "recording"];
const INSTITUTIONAL_EMAIL_RE = /^[A-Z0-9._%+-]+@javerianacali\.edu\.co$/i;
const MOCK_OPERATOR_EMAIL = "m.ramirez@javerianacali.edu.co";
const STRONG_WIND_MPS = 10;
const DEV_QR_SECRET = "development-qr-secret";

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime());
}

function missingFields(body: CreateOrderBody) {
  const required: Array<keyof CreateOrderBody> = [
    "type",
    "deviceId",
    "startTime",
    "endTime",
    "originPointId",
    "senderEmail",
    "recipientEmail",
  ];

  if (body.type !== "recording") {
    required.push("destinationPointId");
  }

  return required.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || value === "";
  });
}

function isUnsafeDroneWeather(weather: OpenWeatherResponse) {
  const conditions = weather.weather ?? [];
  const hasUnsafeCondition = conditions.some((condition) => {
    const id = condition.id ?? 0;
    const main = condition.main?.toLowerCase() ?? "";
    const description = condition.description?.toLowerCase() ?? "";

    return (
      (id >= 200 && id < 400) ||
      (id >= 500 && id < 600) ||
      ["thunderstorm", "drizzle", "rain"].includes(main) ||
      description.includes("rain") ||
      description.includes("lluvia") ||
      description.includes("tormenta") ||
      description.includes("llovizna")
    );
  });

  const windSpeed = weather.wind?.speed ?? 0;
  const windGust = weather.wind?.gust ?? 0;
  const hasStrongWind = windSpeed >= STRONG_WIND_MPS || windGust >= STRONG_WIND_MPS;

  return hasUnsafeCondition || hasStrongWind;
}

function qrSecret() {
  const configuredSecret = process.env.QR_SECRET_KEY?.trim();

  if (configuredSecret) return configuredSecret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("QR_SECRET_KEY must be configured in production");
  }

  console.warn("QR_SECRET_KEY is not configured; using development QR secret.");
  return DEV_QR_SECRET;
}

function generateQrHash(order: CreatedOrder) {
  return crypto
    .createHmac("sha256", qrSecret())
    .update(`${order.id}:${order.recipient_email}:${order.type}:${order.created_at}`)
    .digest("hex");
}

async function buildQr(order: CreatedOrder) {
  const qrHash = generateQrHash(order);
  const payload: QrPayload = {
    orderId: order.id,
    qrHash,
    type: order.type,
    recipientEmail: order.recipient_email,
  };
  const dataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 240,
  });

  return { hash: qrHash, payload, dataUrl };
}

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_PORT?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
  );
}

async function sendOrderEmail(order: CreatedOrder, qrDataUrl: string): Promise<EmailResult> {
  if (!smtpConfigured()) {
    return {
      sent: false,
      skipped: true,
      message:
        "SMTP no esta configurado; la orden fue creada y el QR generado, pero el correo no se envio.",
    };
  }

  const smtpPort = Number(process.env.SMTP_PORT);
  const qrBase64 = qrDataUrl.split(",")[1] ?? "";
  const subject = `Reserva creada ${order.id.slice(0, 8)}`;
  const reservationDetails = [
    `Orden: ${order.id}`,
    `Tipo: ${order.type}`,
    `Estado: ${order.status}`,
    `Destinatario: ${order.recipient_email}`,
  ].join("\n");

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: order.recipient_email,
      cc: order.sender_email !== order.recipient_email ? order.sender_email : undefined,
      subject,
      text: `Tu reserva fue creada correctamente.\n\n${reservationDetails}\n\nPresenta el codigo QR adjunto para validar la orden.`,
      html: `
        <p>Tu reserva fue creada correctamente.</p>
        <ul>
          <li><strong>Orden:</strong> ${order.id}</li>
          <li><strong>Tipo:</strong> ${order.type}</li>
          <li><strong>Estado:</strong> ${order.status}</li>
          <li><strong>Destinatario:</strong> ${order.recipient_email}</li>
        </ul>
        <p>Presenta este codigo QR para validar la orden:</p>
        <img src="cid:reservation-qr" alt="Codigo QR de la orden" />
      `,
      attachments: [
        {
          filename: `orden-${order.id}.png`,
          content: qrBase64,
          encoding: "base64",
          cid: "reservation-qr",
        },
      ],
    });

    return {
      sent: true,
      skipped: false,
      message: "QR enviado por correo a los usuarios involucrados.",
    };
  } catch (err) {
    console.error("Order email send failed:", err);
    return {
      sent: false,
      skipped: false,
      message:
        "La orden fue creada y el QR generado, pero no se pudo enviar el correo.",
    };
  }
}

async function validateDroneWeather(point: MissionWeatherPoint): Promise<WeatherValidationResult> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY?.trim();

  if (!apiKey) {
    console.warn(
      "OPENWEATHERMAP_API_KEY is not configured; skipping drone weather validation in development mode."
    );
    return { success: true };
  }

  const params = new URLSearchParams({
    lat: point.latitude,
    lon: point.longitude,
    appid: apiKey,
    units: "metric",
    lang: "es",
  });

  let response: Response;
  try {
    response = await fetch(`https://api.openweathermap.org/data/2.5/weather?${params}`);
  } catch {
    return {
      success: false,
      status: 503,
      error: "Weather validation unavailable",
      message: "No se pudo validar el clima para la mision del dron. Intenta nuevamente.",
    };
  }

  if (!response.ok) {
    return {
      success: false,
      status: 503,
      error: "Weather validation unavailable",
      message: "No se pudo validar el clima para la mision del dron. Intenta nuevamente.",
    };
  }

  const weather = (await response.json()) as OpenWeatherResponse;

  if (isUnsafeDroneWeather(weather)) {
    return {
      success: false,
      status: 400,
      error: "Weather restriction",
      message:
        "No se puede reservar un dron porque hay lluvia, tormenta o viento fuerte en el punto de mision.",
    };
  }

  return { success: true };
}

router.post("/", async (req, res) => {
  const body = req.body as CreateOrderBody;
  const missing = missingFields(body);

  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields",
      details: missing,
    });
  }

  const {
    type,
    deviceId,
    startTime,
    endTime,
    originPointId,
    destinationPointId,
    senderEmail,
    recipientEmail,
    simulateWeatherBlocked,
  } = body;

  if (!type || !VALID_ORDER_TYPES.includes(type)) {
    return res.status(400).json({
      success: false,
      error: "Invalid order type",
      message: "type must be delivery or recording",
    });
  }

  const start = new Date(startTime as string);
  const end = new Date(endTime as string);

  if (!isValidDate(start) || !isValidDate(end)) {
    return res.status(400).json({
      success: false,
      error: "Invalid date",
      message: "startTime and endTime must be valid ISO date strings",
    });
  }

  if (start >= end) {
    return res.status(400).json({
      success: false,
      error: "Invalid time range",
      message: "startTime must be before endTime",
    });
  }

  if (start < new Date()) {
    return res.status(400).json({
      success: false,
      error: "Invalid schedule",
      message: "startTime cannot be in the past",
    });
  }

  if (
    !INSTITUTIONAL_EMAIL_RE.test(senderEmail as string) ||
    !INSTITUTIONAL_EMAIL_RE.test(recipientEmail as string)
  ) {
    return res.status(400).json({
      success: false,
      error: "Invalid email",
      message: "Emails must use @javerianacali.edu.co",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const deviceResult = await client.query<{
      id: string;
      type: DeviceType;
      battery_level: string;
    }>(
      "SELECT id, type, battery_level FROM devices WHERE id = $1",
      [deviceId]
    );

    if ((deviceResult.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        error: "Device not found",
      });
    }

    const batteryLevel = Number(deviceResult.rows[0].battery_level);
    if (batteryLevel < 30) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        error: "Insufficient battery",
        message: "El dispositivo no tiene bateria suficiente para iniciar esta mision.",
      });
    }

    const originPointResult = await client.query<{ id: string; latitude: string; longitude: string }>(
      "SELECT id, latitude, longitude FROM campus_points WHERE id = $1 AND is_active = true",
      [originPointId]
    );

    if ((originPointResult.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        error: "Campus point not found",
      });
    }

    if (type === "delivery") {
      const destinationPointResult = await client.query<{ id: string }>(
        "SELECT id FROM campus_points WHERE id = $1 AND is_active = true",
        [destinationPointId]
      );

      if ((destinationPointResult.rowCount ?? 0) === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          error: "Campus point not found",
        });
      }
    }

    if (
      deviceResult.rows[0].type === "drone" &&
      simulateWeatherBlocked === true &&
      process.env.NODE_ENV !== "production"
    ) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        error: "Weather restriction demo",
        message: "La reserva fue bloqueada por clima adverso simulado para demo.",
      });
    }

    if (deviceResult.rows[0].type === "drone") {
      const weatherValidation = await validateDroneWeather(originPointResult.rows[0]);

      if (!weatherValidation.success) {
        await client.query("ROLLBACK");
        return res.status(weatherValidation.status).json({
          success: false,
          error: weatherValidation.error,
          message: weatherValidation.message,
        });
      }
    }

    const conflictResult = await client.query<{ id: string }>(
      `SELECT id
       FROM time_slots
       WHERE device_id = $1
         AND $2 < end_time
         AND $3 > start_time
       LIMIT 1`,
      [deviceId, start, end]
    );

    if ((conflictResult.rowCount ?? 0) > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        error: "Time slot conflict",
        message: "El dispositivo ya tiene una reserva en ese intervalo de tiempo.",
      });
    }

    // Temporary operator until real authentication is implemented.
    // Replace this lookup with the authenticated user's id when auth/JWT exists.
    const operatorResult = await client.query<{ id: string }>(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, 'mock-password-hash', 'Maria Ramirez', 'operator')
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      [MOCK_OPERATOR_EMAIL]
    );
    const operatorId = operatorResult.rows[0].id;

    const timeSlotResult = await client.query<{ id: string }>(
      `INSERT INTO time_slots (device_id, start_time, end_time)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [deviceId, start, end]
    );
    const timeSlotId = timeSlotResult.rows[0].id;

    const orderResult = await client.query<CreatedOrder>(
      `INSERT INTO orders (
         type,
         status,
         device_id,
         operator_id,
         time_slot_id,
         origin_point_id,
         destination_point_id,
         sender_email,
         recipient_email
       )
       VALUES ($1, 'pending', $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, type, status, device_id, time_slot_id, origin_point_id,
                 destination_point_id, sender_email, recipient_email, created_at`,
      [
        type,
        deviceId,
        operatorId,
        timeSlotId,
        originPointId,
        destinationPointId,
        senderEmail,
        recipientEmail,
      ]
    );
    const order = orderResult.rows[0];
    const qr = await buildQr(order);

    await client.query("UPDATE time_slots SET order_id = $1 WHERE id = $2", [
      order.id,
      timeSlotId,
    ]);

    await client.query("UPDATE orders SET qr_hash = $1 WHERE id = $2", [
      qr.hash,
      order.id,
    ]);

    await client.query("COMMIT");
    const email = await sendOrderEmail(order, qr.dataUrl);

    return res.status(201).json({
      success: true,
      order: {
        id: order.id,
        type: order.type,
        status: order.status,
        deviceId: order.device_id,
        timeSlotId: order.time_slot_id,
        originPointId: order.origin_point_id,
        destinationPointId: order.destination_point_id,
        senderEmail: order.sender_email,
        recipientEmail: order.recipient_email,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        createdAt: order.created_at,
      },
      qr,
      email,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("POST /api/orders error:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  } finally {
    client.release();
  }
});

export default router;
