# 🤖 La Chota de Proyecto 2.0

## Contexto General

Hay **dos apps web**:
1. **La app principal** — el proyecto como tal.
2. **El simulador** — para simular estados y datos de los robots. Ambas están conectadas y ambas pueden modificarse si es necesario.

El navbar, la página principal y la base ya están hechos. Cada quien solo debe crear su vista y asegurarse de que sus características funcionen.

> 📄 **LEER OBLIGATORIO:** Revisar `docs/DEVS.md` para saber cómo correr el proyecto, en qué rama trabajar, etc. Si no lo leen se van a perder.

---

## 🎨 Diseño Guía

Ya está hecho en Lovable:
👉 [Ver prototipo](https://preview--fleet-vision-puj.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiR2hDNVdlZjBUOVlLdFBrc2ZBa2p4YnppbDdnMSIsInByb2plY3RfaWQiOiJhY2M1OGJjMy02YTk3LTRiMDYtYWY2My01YjU0MjhjZjA0YTEiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6ImFjYzU4YmMzLTZhOTctNGIwNi1hZjYzLTViNTQyOGNmMDRhMSIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3ODAyMDQzMjIsIm5iZiI6MTc3OTU5OTUyMiwiaWF0IjoxNzc5NTk5NTIyfQ.j7ypvPVp_LKCbz5vbBsYMkklYH2fJmex-EkbImUrzepi237OO_qLT71U1CorPNeahL0XUrDWvEwFCTULa9YdhgArEXoWaPRpyU5or2-LAZ2-B5CuVBKJLmlWk9bq8vIYXtmRW07XTpB7n_oHzB_b5hS6aiWqdHEYmN21GBAfKo-8LK5hlSy1AHmQsQQUNKz-B_VB-hFC5tD75gz4EDmoNo_jNv_bjhh7FpZpwZZyx80vVt9XExhND3_0LnLOMjwprQorDOfxesb_GbrDbFWGISvGIch4LeWiUPOgrskM64euz1-wC9c7Q6kaXWJoBB_g-cW88h5ZDsP69tgl4vSZRoLvcs8RzXe86bfEYq8p700OoS9iX8V7Ok_kpwLudQGB1Fw3qUiWVUkBUu3GaBGJcfhVw9cY9nHyfqGfA71VoiD6IQ0F2lrBWMvSUWFVoFMmY-TUMGXBKViAeNXEmyNnkmSoc1s_LLQmQbOkWd3YQpdIKAUmbAKxANhpWw3gH_w2TLLHs47Z4pGHNMYkbzG0ydL1uKkAxFSHLv3OtvMzzt764u0AkX-9DXnW4VNMsyBqA5lFTsRzdxPjAwe3dLYDu-OSRfoqz5_cMYVpyZiFGXYSR3c841GpXnOmlGaTC_9qUN3Kt56O-Dp0M8xPauW7iAi9w4vqBUnHePxNdC5kqXY)

> ⚠️ Está medio buggeado con el inicio de sesión, pero pueden navegar para ver cada sección.

El código del prototipo está en el **zip `Prototype`** que se les envió.

---

## 🛠️ Recomendaciones

- **Usar un agente de código**: Copilot, Codex, Gemini CLI, etc. Se recomienda fuertemente porque así le pasan la carpeta del prototipo y el agente crea el front tal cual.
- Para darle contexto al agente: díganle que entienda el proyecto. Toda la documentación ya está lista.
- Si usan chat normal pueden, pero se van a complicar más.
- **Hacer pruebas** de que todo funciona. Si es necesario, hacer pruebas unitarias.
- Los requisitos detallados están en el **Overleaf**. 👉 [link ](https://www.overleaf.com/read/dcqtcfdyfyby#2728aa)  Revísenlos para asegurarse de cumplirlos correctamente. Acá solo hay número y descripción breve.

---

## 📋 Tareas por Persona

---

### 👤 Sergio — Sección de Bitácora

| Req | Descripción |
|-----|-------------|
| RF-17 | Registro de Órdenes en Bitácora |

- Implementar la vista de bitácora.
- Asegurarse de que funciona correctamente.

---

### 👤 Moncada — Vista de Monitoreo

| Req | Descripción |
|-----|-------------|
| RF-19 | Panel de telemetría en tiempo real |
| RF-20 | Streaming en vivo de la cámara del dispositivo |

- El monitoreo debe estar **conectado con el simulador**.
- En la opción de telemetría: extenderla para poder ingresar datos y que se vean reflejados.
- Conectar una **cámara real** y que se visualice en la app.

---

### 👤 Acosta — Creación de Reserva y Validaciones

| Req | Descripción |
|-----|-------------|
| RF-06 | Gestión de franjas horarias con detección de conflictos |
| RF-09 | Generación del QR y envío por correo (funcional) |
| RF-24 | Validación de batería antes de asignar una misión |
| RN-13 | Restricción climática para drones vía API externa |

- El diseño ya está hecho — es crear tal cual la sección del prototipo.
- Asegurarse de implementar **todas las validaciones** correctamente.

---

## ✅ Checklist General

- [ ] Leer `docs/DEVS.md`
- [ ] Crear rama a partir de `dev`
- [ ] Revisar el prototipo en Lovable
- [ ] Revisar requisitos en Overleaf
- [ ] Implementar la vista asignada
- [ ] Conectar con el backend / simulador según corresponda
- [ ] Hacer pruebas
- [ ] PR hacia `dev`
