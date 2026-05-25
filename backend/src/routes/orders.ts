import { Router } from "express";
import { query, queryOne } from "../db";
import crypto from "crypto";
import QRCode from "qrcode";
import { Resend } from "resend";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { status, type, deviceId, limit = 50 } = req.query;

    let sql = `
      SELECT o.*,
             d.code as device_code, d.name as device_name,
             cp_origin.name as origin_point_name,
             cp_dest.name as destination_point_name,
             u.full_name as operator_name
      FROM orders o
      LEFT JOIN devices d ON o.device_id = d.id
      LEFT JOIN campus_points cp_origin ON o.origin_point_id = cp_origin.id
      LEFT JOIN campus_points cp_dest ON o.destination_point_id = cp_dest.id
      LEFT JOIN users u ON o.operator_id = u.id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let p = 1;

    if (status && status !== "all") {
      sql += ` AND o.status = $${p++}`;
      params.push(status);
    }
    if (type && type !== "all") {
      sql += ` AND o.type = $${p++}`;
      params.push(type);
    }
    if (deviceId) {
      sql += ` AND o.device_id = $${p++}`;
      params.push(deviceId);
    }

    sql += ` ORDER BY o.created_at DESC LIMIT $${p++}`;
    params.push(Number(limit));

    const rows = await query(sql, params);

    const orders = rows.map((row: any) => ({
      id: row.id,
      type: row.type,
      status: row.status,
      deviceId: row.device_id,
      deviceCode: row.device_code,
      deviceName: row.device_name,
      operatorId: row.operator_id,
      operatorName: row.operator_name,
      originPointId: row.origin_point_id,
      originPointName: row.origin_point_name,
      destinationPointId: row.destination_point_id,
      destinationPointName: row.destination_point_name,
      senderEmail: row.sender_email,
      recipientEmail: row.recipient_email,
      qrHash: row.qr_hash,
      qrScannedAt: row.qr_scanned_at,
      cancellationReason: row.cancellation_reason,
      cancelledAt: row.cancelled_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json(orders);
  } catch (err) {
    console.error("GET /api/orders error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const row: any = await queryOne(`
      SELECT o.*,
             d.code as device_code, d.name as device_name,
             cp_origin.name as origin_point_name,
             cp_dest.name as destination_point_name,
             u.full_name as operator_name
      FROM orders o
      LEFT JOIN devices d ON o.device_id = d.id
      LEFT JOIN campus_points cp_origin ON o.origin_point_id = cp_origin.id
      LEFT JOIN campus_points cp_dest ON o.destination_point_id = cp_dest.id
      LEFT JOIN users u ON o.operator_id = u.id
      WHERE o.id = $1
    `, [id]);

    if (!row) {
      return res.status(404).json({ error: "Order not found" });
    }

    const events = await query(`
      SELECT * FROM event_logs WHERE order_id = $1 ORDER BY created_at ASC
    `, [id]);

    const order = {
      id: row.id,
      type: row.type,
      status: row.status,
      deviceId: row.device_id,
      deviceCode: row.device_code,
      deviceName: row.device_name,
      operatorId: row.operator_id,
      operatorName: row.operator_name,
      originPointId: row.origin_point_id,
      originPointName: row.origin_point_name,
      destinationPointId: row.destination_point_id,
      destinationPointName: row.destination_point_name,
      senderEmail: row.sender_email,
      recipientEmail: row.recipient_email,
      qrHash: row.qr_hash,
      qrScannedAt: row.qr_scanned_at,
      cancellationReason: row.cancellation_reason,
      cancelledAt: row.cancelled_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      timeline: events.map((e: any) => ({
        label: e.event_type,
        ts: e.created_at,
        description: e.description,
      })),
    };

    res.json(order);
  } catch (err) {
    console.error("GET /api/orders/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
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
    } = req.body;

    const errors: string[] = [];

    if (!type || !["delivery", "recording"].includes(type)) {
      errors.push("type must be 'delivery' or 'recording'");
    }
    if (!deviceId) errors.push("deviceId is required");
    if (!startTime) errors.push("startTime is required");
    if (!endTime) errors.push("endTime is required");
    if (!originPointId) errors.push("originPointId is required");
    if (type === "delivery" && !destinationPointId) {
      errors.push("destinationPointId is required for delivery orders");
    }
    if (!senderEmail || !senderEmail.match(/^[A-Z0-9._%+-]+@javerianacali\.edu\.co$/i)) {
      errors.push("senderEmail must be a valid @javerianacali.edu.co address");
    }
    if (!recipientEmail || !recipientEmail.match(/^[A-Z0-9._%+-]+@javerianacali\.edu\.co$/i)) {
      errors.push("recipientEmail must be a valid @javerianacali.edu.co address");
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: "Validation failed", details: errors });
    }

    const device = await queryOne<any>("SELECT * FROM devices WHERE id = $1", [deviceId]);
    if (!device) {
      return res.status(404).json({ success: false, error: "Device not found" });
    }

    if (type === "recording" && device.type !== "drone") {
      return res.status(400).json({ success: false, error: "Recording orders require a drone" });
    }

    const originPoint = await queryOne<any>("SELECT * FROM campus_points WHERE id = $1", [originPointId]);
    if (!originPoint) {
      return res.status(404).json({ success: false, error: "Origin point not found" });
    }

    if (destinationPointId) {
      const destPoint = await queryOne<any>("SELECT * FROM campus_points WHERE id = $1", [destinationPointId]);
      if (!destPoint) {
        return res.status(404).json({ success: false, error: "Destination point not found" });
      }
    }

    if (simulateWeatherBlocked) {
      return res.status(400).json({
        success: false,
        error: "Weather blocked",
        details: ["Condiciones climáticas no permiten el vuelo en este momento."],
      });
    }

    const operatorId = "00000000-0000-0000-0000-000000000000";

    const orderId = crypto.randomUUID();
    const qrHash = `ORD-${orderId.slice(0, 8).toUpperCase()}`;

    // time_slots.order_id → orders.id (FK), orders.time_slot_id → time_slots.id (FK NOT NULL)
    // Break the circular dependency: insert time_slot without order_id, then order, then update time_slot
    const timeSlotId = crypto.randomUUID();
    await query(`
      INSERT INTO time_slots (id, device_id, start_time, end_time)
      VALUES ($1, $2, $3, $4)
    `, [timeSlotId, deviceId, startTime, endTime]);

    await query(`
      INSERT INTO orders (id, type, status, device_id, operator_id, time_slot_id, origin_point_id, destination_point_id, sender_email, recipient_email, qr_hash)
      VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8, $9, $10)
    `, [orderId, type, deviceId, operatorId, timeSlotId, originPointId, destinationPointId || null, senderEmail, recipientEmail, qrHash]);

    await query(`
      UPDATE time_slots SET order_id = $1 WHERE id = $2
    `, [orderId, timeSlotId]);

    await query(`
      INSERT INTO event_logs (order_id, event_type, description)
      VALUES ($1, 'created', 'Orden creada y en espera de asignacion')
    `, [orderId]);

    // Generate real QR code
    const qrDataUrl = await QRCode.toDataURL(qrHash, {
      width: 300,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    });

    // Send email via Resend
    const emailResult = await sendOrderEmail({
      orderId,
      qrHash,
      qrDataUrl,
      type,
      senderEmail,
      recipientEmail,
      originPointName: originPoint.name,
      destinationPointName: destinationPointId
        ? (await queryOne<any>("SELECT name FROM campus_points WHERE id = $1", [destinationPointId]))?.name ?? ""
        : "",
      deviceCode: device.code,
      startTime,
      endTime,
    });

    res.json({
      success: true,
      order: { id: orderId, status: "pending", recipientEmail },
      qr: { dataUrl: qrDataUrl },
      email: emailResult,
    });
  } catch (err) {
    console.error("POST /api/orders error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancellationReason } = req.body;

    const existing = await queryOne<any>("SELECT * FROM orders WHERE id = $1", [id]);
    if (!existing) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (status) {
      await query("UPDATE orders SET status = $1 WHERE id = $2", [status, id]);

      let eventType = status;
      let eventDesc = `Estado cambiado a ${status}`;

      if (status === "in_progress") {
        eventDesc = "Orden iniciada, dispositivo en camino";
        const deviceId = existing.device_id;
        if (deviceId) {
          const originPt = await queryOne<any>("SELECT name FROM campus_points WHERE id = $1", [existing.origin_point_id]);
          const destPt = existing.destination_point_id ? await queryOne<any>("SELECT name FROM campus_points WHERE id = $1", [existing.destination_point_id]) : null;
          await query(`
            UPDATE devices SET status = 'in_mission', sub_status = null,
              current_route_origin = $1, current_route_destination = $2
            WHERE id = $3
          `, [originPt?.name || null, destPt?.name || null, deviceId]);
        }
      } else if (status === "completed") {
        eventDesc = "Orden completada con exito";
        const deviceId = existing.device_id;
        if (deviceId) {
          await query(`
            UPDATE devices SET status = 'available', sub_status = 'en_base',
              current_route_origin = null, current_route_destination = null
            WHERE id = $1
          `, [deviceId]);
        }
      } else if (status === "cancelled") {
        eventDesc = `Orden cancelada. Razon: ${cancellationReason || "No especificada"}`;
        const deviceId = existing.device_id;
        if (deviceId) {
          await query(`
            UPDATE devices SET status = 'available', sub_status = 'en_base',
              current_route_origin = null, current_route_destination = null
            WHERE id = $1
          `, [deviceId]);
        }
        await query("UPDATE orders SET cancelled_at = NOW(), cancellation_reason = $1 WHERE id = $2", [cancellationReason || "Cancelado", id]);
      }

      await query(`
        INSERT INTO event_logs (order_id, event_type, description)
        VALUES ($1, $2, $3)
      `, [id, eventType, eventDesc]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/orders/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

interface OrderEmailParams {
  orderId: string;
  qrHash: string;
  qrDataUrl: string;
  type: string;
  senderEmail: string;
  recipientEmail: string;
  originPointName: string;
  destinationPointName: string;
  deviceCode: string;
  startTime: string;
  endTime: string;
}

async function sendOrderEmail(p: OrderEmailParams): Promise<{ sent: boolean; skipped: boolean; message: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, skipped: true, message: "RESEND_API_KEY no configurado." };
  }

  const resend = new Resend(apiKey);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("es-CO", {
      dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota",
    });

  const typeLabel = p.type === "recording" ? "Grabación de evento" : "Entrega de paquete";
  const routeLabel = p.type === "recording"
    ? `<strong>Ubicación:</strong> ${p.originPointName}`
    : `<strong>Origen:</strong> ${p.originPointName}<br><strong>Destino:</strong> ${p.destinationPointName}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f6fc;font-family:ui-sans-serif,system-ui,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #d5d8db;">

    <div style="background:#1d58dc;padding:28px 32px 24px;">
      <div style="display:inline-flex;align-items:center;gap:10px;">
        <div style="background:#fff;color:#1d58dc;font-weight:700;font-size:13px;width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;text-align:center;line-height:32px;">FC</div>
        <span style="color:#fff;font-weight:600;font-size:16px;letter-spacing:-0.3px;">Fleet Control PUJ</span>
      </div>
      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:20px 0 4px;">Reserva confirmada</h1>
      <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:0;">Pontificia Universidad Javeriana Cali</p>
    </div>

    <div style="padding:28px 32px;">
      <p style="font-size:14px;color:#3c4754;margin:0 0 20px;">
        Tu solicitud de <strong>${typeLabel}</strong> ha sido registrada exitosamente.
        Presenta el código QR adjunto al operador en el punto de recogida para confirmar la entrega.
      </p>

      <div style="background:#f1f6fc;border-radius:8px;padding:16px 20px;margin-bottom:24px;border:1px solid #d5d8db;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr>
            <td style="color:#5c646f;padding:5px 0;width:38%;">Código de orden</td>
            <td style="color:#0a121f;font-weight:700;font-family:monospace;">${p.qrHash}</td>
          </tr>
          <tr>
            <td style="color:#5c646f;padding:5px 0;">Tipo de servicio</td>
            <td style="color:#0a121f;font-weight:600;">${typeLabel}</td>
          </tr>
          <tr>
            <td style="color:#5c646f;padding:5px 0;">Dispositivo</td>
            <td style="color:#0a121f;font-weight:600;">${p.deviceCode}</td>
          </tr>
          <tr>
            <td style="color:#5c646f;padding:5px 0;">${p.type === "recording" ? "Ubicación" : "Origen"}</td>
            <td style="color:#0a121f;font-weight:600;">${p.originPointName}</td>
          </tr>
          ${p.type !== "recording" ? `<tr>
            <td style="color:#5c646f;padding:5px 0;">Destino</td>
            <td style="color:#0a121f;font-weight:600;">${p.destinationPointName}</td>
          </tr>` : ""}
          <tr>
            <td style="color:#5c646f;padding:5px 0;">Franja horaria</td>
            <td style="color:#0a121f;font-weight:600;">${fmt(p.startTime)} – ${new Date(p.endTime).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", timeZone: "America/Bogota" })}</td>
          </tr>
          <tr>
            <td style="color:#5c646f;padding:5px 0;">Remitente</td>
            <td style="color:#0a121f;">${p.senderEmail}</td>
          </tr>
          <tr>
            <td style="color:#5c646f;padding:5px 0;">Destinatario</td>
            <td style="color:#0a121f;">${p.recipientEmail}</td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        <p style="font-size:12px;color:#5c646f;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Código QR de la orden</p>
        <img src="${p.qrDataUrl}" alt="QR ${p.qrHash}" width="200" height="200" style="border-radius:8px;border:1px solid #d5d8db;display:block;margin:0 auto;">
        <p style="font-size:11px;color:#92a0b3;margin:8px 0 0;font-family:monospace;">${p.qrHash}</p>
      </div>

      <div style="border-top:1px solid #d5d8db;padding-top:16px;text-align:center;">
        <p style="font-size:11px;color:#92a0b3;margin:0;">
          Este es un correo automático del sistema Fleet Control PUJ.<br>
          Campus Cali · Pontificia Universidad Javeriana
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

  try {
    // In demo mode with onboarding@resend.dev, Resend only allows sending to the
    // account owner's email. We redirect all recipients there for the demo.
    const DEMO_EMAIL = "jdavidruanob@gmail.com";
    const { error } = await resend.emails.send({
      from: "Fleet Control PUJ <onboarding@resend.dev>",
      to: [DEMO_EMAIL],
      subject: `✅ Reserva confirmada – ${p.qrHash}`,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return { sent: false, skipped: false, message: `Error al enviar: ${error.message}` };
    }

    return { sent: true, skipped: false, message: "Correo enviado correctamente." };
  } catch (err: any) {
    console.error("sendOrderEmail error:", err);
    return { sent: false, skipped: false, message: `Error al enviar: ${err?.message ?? "desconocido"}` };
  }
}

export default router;