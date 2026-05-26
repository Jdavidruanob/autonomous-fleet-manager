"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Loader2, Package, PlusCircle, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Device, DeviceType } from "@/types/device";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const INSTITUTIONAL_EMAIL_RE = /^[A-Z0-9._%+-]+@javerianacali\.edu\.co$/i;

type OrderType = "delivery" | "recording";
type WizardStep = 1 | 2 | 3;
type DeviceTypeFilter = "all" | DeviceType;
type TouchedFields = Partial<Record<keyof FormState, boolean>>;

interface CampusPoint {
  id: string;
  name: string;
}

const DELIVERY_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

interface FormState {
  type: OrderType;
  deviceId: string;
  date: string;
  timeSlot: string;   // for delivery: "09:00", "10:00", etc.
  startTime: string;  // for recording only
  endTime: string;    // for recording only (auto +2h)
  originPointId: string;
  destinationPointId: string;
  senderEmail: string;
  recipientEmail: string;
  description: string;
  simulateWeatherBlocked: boolean;
}

interface CreateOrderResponse {
  success: boolean;
  order?: { id: string; status: string; recipientEmail: string };
  qr?: { dataUrl: string };
  email?: { sent: boolean; skipped: boolean; message: string };
  error?: string;
  message?: string;
  details?: string[];
}

const initialForm: FormState = {
  type: "delivery",
  deviceId: "",
  date: "",
  timeSlot: "",
  startTime: "",
  endTime: "",
  originPointId: "",
  destinationPointId: "",
  senderEmail: "",
  recipientEmail: "",
  description: "",
  simulateWeatherBlocked: false,
};

const steps: Array<{ id: WizardStep; label: string }> = [
  { id: 1, label: "Tipo de servicio" },
  { id: 2, label: "Detalles" },
  { id: 3, label: "Confirmación" },
];

const serviceOptions = [
  {
    type: "delivery" as const,
    title: "Entrega de paquete",
    description: "Transporte de objetos pequeños entre puntos del campus.",
    Icon: Package,
  },
  {
    type: "recording" as const,
    title: "Grabación de evento",
    description: "Captura aérea de eventos académicos. Duración fija 2h, solo drones.",
    Icon: Video,
  },
];

function selectClassName(hasError = false) {
  return [
    "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    hasError ? "border-destructive focus-visible:ring-destructive" : "border-input",
  ].join(" ");
}

function textareaClassName() {
  return [
    "flex min-h-[84px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors",
    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ].join(" ");
}

function inputClassName(hasError = false) {
  return hasError ? "border-destructive focus-visible:ring-destructive" : undefined;
}

function FieldError({ show, message }: { show: boolean; message: string }) {
  if (!show) return null;
  return (
    <span className="flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="h-3.5 w-3.5" />
      {message}
    </span>
  );
}

function toIsoDateTime(date: string, time: string) {
  return new Date(`${date}T${time}`).toISOString();
}

function addHoursToTime(time: string, hours: number) {
  if (!time) return "";
  const [hourValue, minuteValue] = time.split(":").map(Number);
  if (Number.isNaN(hourValue) || Number.isNaN(minuteValue)) return "";
  const totalMinutes = hourValue * 60 + minuteValue + hours * 60;
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const nextHour = Math.floor(normalizedMinutes / 60).toString().padStart(2, "0");
  const nextMinute = (normalizedMinutes % 60).toString().padStart(2, "0");
  return `${nextHour}:${nextMinute}`;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function pointName(points: CampusPoint[], id: string) {
  return points.find((point) => point.id === id)?.name ?? "Sin seleccionar";
}

function formatSchedule(date: string, startTime: string, endTime: string) {
  if (!date || !startTime || !endTime) return "Sin programar";
  return `${date} · ${startTime} - ${endTime}`;
}

export default function NewOrderPage() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<DeviceTypeFilter>("all");
  const [touched, setTouched] = useState<TouchedFields>({});
  const [attemptedDetails, setAttemptedDetails] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [campusPoints, setCampusPoints] = useState<CampusPoint[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CreateOrderResponse | null>(null);

  const selectedDevice = devices.find((device) => device.id === form.deviceId);

  const availableDevices = devices.filter((device) => {
    if (form.type === "recording" && device.type !== "drone") return false;
    if (deviceTypeFilter !== "all" && device.type !== deviceTypeFilter) return false;
    return true;
  });

  const selectedService = serviceOptions.find((option) => option.type === form.type);
  const showFieldErrors = attemptedDetails || attemptedSubmit;

  useEffect(() => {
    async function fetchOptions() {
      try {
        const [devicesRes, campusPointsRes] = await Promise.all([
          fetch(`${API_BASE}/api/devices`),
          fetch(`${API_BASE}/api/campus-points`),
        ]);
        if (!devicesRes.ok || !campusPointsRes.ok) throw new Error("No se pudieron cargar los datos.");
        const [devicesData, campusPointsData] = await Promise.all([
          devicesRes.json(),
          campusPointsRes.json(),
        ]);
        setDevices(devicesData);
        setCampusPoints(campusPointsData);
      } catch {
        setError("No se pudieron cargar los datos del formulario.");
      } finally {
        setInitialLoading(false);
      }
    }
    fetchOptions();
  }, []);

  useEffect(() => {
    if (form.type !== "recording") return;
    const calculatedEndTime = addHoursToTime(form.startTime, 2);
    if (form.endTime !== calculatedEndTime) {
      setForm((current) => ({ ...current, endTime: calculatedEndTime }));
    }
  }, [form.endTime, form.startTime, form.type]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (next.type === "recording" && (field === "date" || field === "startTime")) {
        next.endTime = addHoursToTime(next.startTime, 2);
      }
      return next;
    });
    setTouched((current) => ({ ...current, [field]: true }));
    setError(null);
    setSuccess(null);
  }

  function selectService(type: OrderType) {
    setForm((current) => ({
      ...current,
      type,
      timeSlot: "",
      startTime: "",
      endTime: type === "recording" ? addHoursToTime(current.startTime, 2) : "",
      destinationPointId: type === "recording" ? "" : current.destinationPointId,
      simulateWeatherBlocked: type === "recording" || selectedDevice?.type === "drone" ? current.simulateWeatherBlocked : false,
      deviceId: type === "recording" && selectedDevice?.type === "robot" ? "" : current.deviceId,
    }));
    setDeviceTypeFilter(type === "recording" ? "drone" : "all");
    setError(null);
    setSuccess(null);
  }

  function updateDeviceTypeFilter(value: DeviceTypeFilter) {
    setDeviceTypeFilter(value);
    setForm((current) => ({
      ...current,
      simulateWeatherBlocked: selectedDevice && value !== "all" && selectedDevice.type !== value ? false : current.simulateWeatherBlocked,
      deviceId: selectedDevice && value !== "all" && selectedDevice.type !== value ? "" : current.deviceId,
    }));
  }

  function shouldShowFieldError(field: keyof FormState) {
    return Boolean(touched[field] || showFieldErrors);
  }

  function validateForm() {
    if (!form.deviceId) return "Selecciona un dispositivo.";
    if (!form.date) return "Selecciona una fecha.";
    if (!form.originPointId) return "Selecciona el punto de origen.";
    if (form.type === "delivery" && !form.destinationPointId) return "Selecciona el punto de destino.";
    if (!form.senderEmail || !INSTITUTIONAL_EMAIL_RE.test(form.senderEmail)) return "El correo remitente debe ser @javerianacali.edu.co.";
    if (!form.recipientEmail || !INSTITUTIONAL_EMAIL_RE.test(form.recipientEmail)) return "El correo destinatario debe ser @javerianacali.edu.co.";

    if (form.type === "delivery") {
      if (!form.timeSlot) return "Selecciona una franja horaria.";
      const start = new Date(`${form.date}T${form.timeSlot}:00`);
      if (start < new Date()) return "La franja horaria no puede ser en el pasado.";
    } else {
      if (!form.startTime || !form.endTime) return "Indica la hora de inicio de la grabación.";
      const start = new Date(`${form.date}T${form.startTime}`);
      const end = new Date(`${form.date}T${form.endTime}`);
      if (Number.isNaN(start.getTime())) return "La fecha y hora de inicio no son válidas.";
      if (start < new Date()) return "La grabación no puede iniciar en el pasado.";
      if (start >= end) return "La hora de inicio debe ser anterior a la hora fin.";
    }
    return null;
  }

  function goToDetails() {
    setError(null);
    setCurrentStep(2);
  }

  function goToConfirmation() {
    setAttemptedDetails(true);
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }
    setError(null);
    setCurrentStep(3);
  }

  function goBack() {
    setError(null);
    setSuccess(null);
    if (currentStep === 1) { window.location.href = "/orders"; return; }
    setCurrentStep((current) => (current === 3 ? 2 : 1));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttemptedSubmit(true);
    const validationError = validateForm();
    if (validationError) { setError(validationError); setCurrentStep(2); return; }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      let startTimeISO: string;
      let endTimeISO: string;
      if (form.type === "delivery") {
        const slotStart = new Date(`${form.date}T${form.timeSlot}:00`);
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
        startTimeISO = slotStart.toISOString();
        endTimeISO = slotEnd.toISOString();
      } else {
        startTimeISO = toIsoDateTime(form.date, form.startTime);
        endTimeISO = toIsoDateTime(form.date, form.endTime);
      }

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          deviceId: form.deviceId,
          startTime: startTimeISO,
          endTime: endTimeISO,
          originPointId: form.originPointId,
          destinationPointId: form.type === "recording" ? null : form.destinationPointId,
          senderEmail: form.senderEmail.trim(),
          recipientEmail: form.recipientEmail.trim(),
          simulateWeatherBlocked: form.simulateWeatherBlocked,
        }),
      });
      const data = (await res.json()) as CreateOrderResponse;
      if (!res.ok || !data.success || !data.order) {
        const detailText = data.details?.length ? ` (${data.details.join(", ")})` : "";
        throw new Error(data.message ?? `${data.error ?? "No se pudo crear la reserva."}${detailText}`);
      }
      setCreatedOrder(data);
      setSuccess(`Reserva creada correctamente. Orden ${data.order.id.slice(0, 8)}.`);
      setForm((current) => ({ ...initialForm, type: current.type, senderEmail: current.senderEmail }));
      setTouched({});
      setAttemptedDetails(false);
      setAttemptedSubmit(false);
      setCurrentStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la reserva.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reservas</p>
        <h1 className="text-2xl font-semibold tracking-tight">Crear orden de servicio</h1>
        <p className="mt-1 text-sm text-muted-foreground">Completa los pasos para programar una entrega o grabación.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-card p-4 text-card-foreground shadow sm:p-6">
        <Stepper currentStep={currentStep} />

        {initialLoading ? (
          <div className="flex items-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando datos disponibles...
          </div>
        ) : (
          <>
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {serviceOptions.map(({ type, title, description, Icon }) => {
                    const selected = form.type === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => selectService(type)}
                        className={[
                          "rounded-xl border bg-background p-4 text-left shadow-sm transition-colors",
                          "hover:border-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                          selected ? "border-primary bg-primary/10" : "border-border",
                        ].join(" ")}
                      >
                        <span className={[
                          "mb-4 grid h-10 w-10 place-items-center rounded-lg",
                          selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                        ].join(" ")}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="block text-base font-semibold">{title}</span>
                        <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-5">
                {form.type === "recording" && (
                  <div className="flex items-start gap-2 rounded-md border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
                    <Video className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>La grabación de evento usa una franja fija de 2 horas y solo permite drones.</span>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">Correo remitente</span>
                    <Input type="email" placeholder="remitente@javerianacali.edu.co"
                      value={form.senderEmail}
                      onChange={(event) => updateField("senderEmail", event.target.value)}
                      disabled={submitting}
                      className={inputClassName(shouldShowFieldError("senderEmail") && (!form.senderEmail || !INSTITUTIONAL_EMAIL_RE.test(form.senderEmail)))}
                    />
                    <FieldError show={shouldShowFieldError("senderEmail") && (!form.senderEmail || !INSTITUTIONAL_EMAIL_RE.test(form.senderEmail))} message="Usa un correo @javerianacali.edu.co." />
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">Correo destinatario</span>
                    <Input type="email" placeholder="destinatario@javerianacali.edu.co"
                      value={form.recipientEmail}
                      onChange={(event) => updateField("recipientEmail", event.target.value)}
                      disabled={submitting}
                      className={inputClassName(shouldShowFieldError("recipientEmail") && (!form.recipientEmail || !INSTITUTIONAL_EMAIL_RE.test(form.recipientEmail)))}
                    />
                    <FieldError show={shouldShowFieldError("recipientEmail") && (!form.recipientEmail || !INSTITUTIONAL_EMAIL_RE.test(form.recipientEmail))} message="Usa un correo @javerianacali.edu.co." />
                  </label>

                  <label className="space-y-1.5 sm:col-span-2">
                    <span className="text-sm font-medium">{form.type === "delivery" ? "Descripción del paquete" : "Descripción breve"}</span>
                    <textarea className={textareaClassName()}
                      placeholder={form.type === "delivery" ? "Ej. Documentos para entregar en biblioteca" : "Ej. Conferencia en Auditorio Principal"}
                      value={form.description}
                      onChange={(event) => updateField("description", event.target.value)}
                      disabled={submitting}
                    />
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">Tipo de dispositivo</span>
                    <select className={selectClassName()} value={form.type === "recording" ? "drone" : deviceTypeFilter}
                      onChange={(event) => updateDeviceTypeFilter(event.target.value as DeviceTypeFilter)}
                      disabled={submitting || form.type === "recording"}
                    >
                      <option value="all">Robot o dron</option>
                      <option value="robot">Robot</option>
                      <option value="drone">Dron</option>
                    </select>
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">Dispositivo</span>
                    <select className={selectClassName(!form.deviceId && shouldShowFieldError("deviceId"))}
                      value={form.deviceId}
                      onChange={(event) => {
                        const nextDevice = devices.find((device) => device.id === event.target.value);
                        updateField("deviceId", event.target.value);
                        if (nextDevice?.type !== "drone") updateField("simulateWeatherBlocked", false);
                      }}
                      disabled={submitting}
                    >
                      <option value="">Seleccionar dispositivo</option>
                      {availableDevices.map((device) => {
                        const lowBattery = device.batteryLevel < 20;
                        const notAvailable = device.status !== "available";
                        const disabled = lowBattery || notAvailable;
                        const label = `${device.code} — ${device.type === "robot" ? "Robot" : "Dron"} · ${Math.round(device.batteryLevel)}%${lowBattery ? " ⚠ Batería baja" : ""}${notAvailable ? ` (${device.status})` : ""}`;
                        return (
                          <option key={device.id} value={device.id} disabled={disabled}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                    {selectedDevice && (
                      <span className="block text-xs text-muted-foreground">
                        Batería {selectedDevice.batteryLevel}% - Estado {selectedDevice.status}
                      </span>
                    )}
                    <FieldError show={!form.deviceId && shouldShowFieldError("deviceId")} message="Selecciona un dispositivo." />
                  </label>

                  {selectedDevice?.type === "drone" && (
                    <label className="flex items-start gap-3 rounded-md border border-dashed p-3 sm:col-span-2">
                      <input type="checkbox" className="mt-1 h-4 w-4 rounded border-input"
                        checked={form.simulateWeatherBlocked}
                        onChange={(event) => updateField("simulateWeatherBlocked", event.target.checked)}
                        disabled={submitting}
                      />
                      <span className="space-y-1">
                        <span className="block text-sm font-medium">Simular clima adverso (solo demo)</span>
                        <span className="block text-xs text-muted-foreground">Bloquea la reserva como si OpenWeather reportara lluvia, tormenta o viento fuerte.</span>
                      </span>
                    </label>
                  )}

                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">Fecha</span>
                    <Input type="date" min={todayInputValue()} value={form.date}
                      onChange={(event) => updateField("date", event.target.value)}
                      disabled={submitting}
                      className={inputClassName(!form.date && shouldShowFieldError("date"))}
                    />
                    <FieldError show={!form.date && shouldShowFieldError("date")} message="Selecciona una fecha." />
                  </label>

                  {form.type === "delivery" ? (
                    <div className="sm:col-span-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Franja horaria</span>
                        <span className="text-xs text-muted-foreground">Bloques de 1 hora</span>
                      </div>
                      {!form.date ? (
                        <p className="text-xs text-muted-foreground py-2">Selecciona una fecha primero para ver las franjas disponibles.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {DELIVERY_SLOTS.map((slot) => {
                            const endHour = (parseInt(slot.split(":")[0]) + 1).toString().padStart(2, "0");
                            const selected = form.timeSlot === slot;
                            const isPast = new Date(`${form.date}T${slot}:00`) < new Date();
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => !isPast && updateField("timeSlot", slot)}
                                disabled={submitting || isPast}
                                className={[
                                  "rounded-lg border px-2 py-2.5 text-xs font-medium text-center transition-colors",
                                  selected
                                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                    : isPast
                                    ? "border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                    : "border-border bg-background hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
                                ].join(" ")}
                              >
                                {slot}
                                <span className="block text-[10px] opacity-75">– {endHour}:00</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <FieldError show={!form.timeSlot && shouldShowFieldError("timeSlot")} message="Selecciona una franja horaria." />
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium">Hora inicio</span>
                        <Input type="time" value={form.startTime}
                          onChange={(event) => updateField("startTime", event.target.value)}
                          disabled={submitting}
                          className={inputClassName(!form.startTime && shouldShowFieldError("startTime"))}
                        />
                        <FieldError show={!form.startTime && shouldShowFieldError("startTime")} message="Indica inicio." />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium">Hora fin calculada</span>
                        <Input type="time" value={form.endTime} disabled className={inputClassName(!form.endTime && shouldShowFieldError("endTime"))} />
                        <span className="block text-xs text-muted-foreground">La franja termina 2 horas después del inicio.</span>
                        <FieldError show={!form.endTime && shouldShowFieldError("endTime")} message="Indica inicio para calcular fin." />
                      </label>
                    </div>
                  )}

                  {form.type === "delivery" ? (
                    <>
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium">Punto de origen</span>
                        <select className={selectClassName(!form.originPointId && shouldShowFieldError("originPointId"))}
                          value={form.originPointId}
                          onChange={(event) => updateField("originPointId", event.target.value)}
                          disabled={submitting}
                        >
                          <option value="">Seleccionar origen</option>
                          {campusPoints.map((point) => (
                            <option key={point.id} value={point.id}>{point.name}</option>
                          ))}
                        </select>
                        <FieldError show={!form.originPointId && shouldShowFieldError("originPointId")} message="Selecciona un origen." />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium">Punto de destino</span>
                        <select className={selectClassName(!form.destinationPointId && shouldShowFieldError("destinationPointId"))}
                          value={form.destinationPointId}
                          onChange={(event) => updateField("destinationPointId", event.target.value)}
                          disabled={submitting}
                        >
                          <option value="">Seleccionar destino</option>
                          {campusPoints.map((point) => (
                            <option key={point.id} value={point.id}>{point.name}</option>
                          ))}
                        </select>
                        <FieldError show={!form.destinationPointId && shouldShowFieldError("destinationPointId")} message="Selecciona un destino." />
                      </label>
                    </>
                  ) : (
                    <label className="space-y-1.5 sm:col-span-2">
                      <span className="text-sm font-medium">Punto de grabación</span>
                      <select className={selectClassName(!form.originPointId && shouldShowFieldError("originPointId"))}
                        value={form.originPointId}
                        onChange={(event) => updateField("originPointId", event.target.value)}
                        disabled={submitting}
                      >
                        <option value="">Seleccionar punto de grabación</option>
                        {campusPoints.map((point) => (
                          <option key={point.id} value={point.id}>{point.name}</option>
                        ))}
                      </select>
                      <FieldError show={!form.originPointId && shouldShowFieldError("originPointId")} message="Selecciona el punto de grabación." />
                    </label>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="rounded-xl border bg-secondary/30 p-4">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-primary" />
                    <h2 className="text-base font-semibold">Resumen de la reserva</h2>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <SummaryItem label="Tipo de servicio" value={selectedService?.title ?? "Sin seleccionar"} />
                    <SummaryItem label="Dispositivo" value={selectedDevice ? `${selectedDevice.code} - ${selectedDevice.name}` : "Sin seleccionar"} />
                    <SummaryItem label="Remitente" value={form.senderEmail || "Sin registrar"} />
                    <SummaryItem label="Destinatario" value={form.recipientEmail || "Sin registrar"} />
                    {form.type === "delivery" ? (
                      <>
                        <SummaryItem label="Origen" value={pointName(campusPoints, form.originPointId)} />
                        <SummaryItem label="Destino" value={pointName(campusPoints, form.destinationPointId)} />
                      </>
                    ) : (
                      <SummaryItem label="Punto de grabación" value={pointName(campusPoints, form.originPointId)} />
                    )}
                    <SummaryItem
                      label="Programada"
                      value={form.type === "delivery" && form.timeSlot
                        ? `${form.date} · ${form.timeSlot} – ${(parseInt(form.timeSlot.split(":")[0]) + 1).toString().padStart(2, "0")}:00`
                        : formatSchedule(form.date, form.startTime, form.endTime)}
                    />
                    <SummaryItem label="Descripción" value={form.description || "Sin descripción"} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={goBack} disabled={submitting}>
            <ChevronLeft className="h-4 w-4" /> Atrás
          </Button>
          {currentStep === 1 && (
            <Button type="button" onClick={goToDetails} disabled={initialLoading || submitting}>
              Siguiente <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {currentStep === 2 && (
            <Button type="button" onClick={goToConfirmation} disabled={submitting}>
              Siguiente <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {currentStep === 3 && (
            <Button type="submit" disabled={initialLoading || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
              Crear reserva
            </Button>
          )}
        </div>
      </form>

      {createdOrder?.order && createdOrder.qr && createdOrder.email && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 px-4 py-6">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 text-center shadow-lg">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">Orden creada</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {createdOrder.email.sent ? "QR enviado por correo a los usuarios involucrados." : createdOrder.email.message}
            </p>
            {createdOrder.email.skipped && (
              <div className="mt-4 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-left text-sm text-warning-foreground">
                El QR fue generado, pero el correo no se envió porque SMTP no está configurado.
              </div>
            )}
            <div className="mx-auto mt-5 w-fit rounded-lg border bg-card p-3">
              <img src={createdOrder.qr.dataUrl} alt="Código QR de la orden" className="h-40 w-40" />
            </div>
            <div className="mt-5 grid gap-2 text-left">
              <SummaryItem label="Código de orden" value={createdOrder.order.id.slice(0, 8) + "..."} />
              <SummaryItem label="Correo destinatario" value={createdOrder.order.recipientEmail} />
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={() => window.location.href = "/"}>Ir al panel</Button>
              <Button onClick={() => window.location.href = "/orders"}>Ver bitácora</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stepper({ currentStep }: { currentStep: WizardStep }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {steps.map((step) => {
        const isActive = step.id === currentStep;
        const isComplete = step.id < currentStep;
        return (
          <div key={step.id} className={[
            "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
            isActive ? "border-primary bg-primary/10 text-primary" : "border-border bg-background",
            isComplete ? "border-success/30 bg-success/10 text-success" : "",
          ].join(" ")}>
            <span className={[
              "grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
              isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
              isComplete ? "bg-success text-success-foreground" : "",
            ].join(" ")}>
              {isComplete ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.id}
            </span>
            <span className="truncate font-medium">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}