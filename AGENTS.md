# Guía de Traspaso para Agentes (Agent Handoff Guide)

## 🎯 Objetivo de este Archivo

Este documento sirve como manual de relevo técnico para cualquier agente de codificación de IA o desarrollador que asuma el trabajo en este repositorio. Su propósito es resumir de forma precisa el estado actual del desarrollo, las restricciones ineludibles y el camino de implementación más seguro para evitar la pérdida de contexto entre sesiones.

---

## 🏛️ Estado Actual del Repositorio

El proyecto se encuentra actualmente en su **fase de esqueleto inicial estructurado**.

### Implementado:
- Entorno de desarrollo local dockerizado con **Docker Compose**.
- Esquema de base de datos relacional inicial en PostgreSQL vía [database/init.sql](database/init.sql).
- Cascarón (Shell) del Frontend en Next.js con el sistema de navegación por pestañas y dock inferior.
- Estructura básica de arranque del Backend en Express + TypeScript.
- Contenedor inicial para el Simulador de dispositivos físicos escrito en Python (Placeholder).

### Pendiente:
- Lógica de autenticación de usuarios y roles.
- Rutas del Backend, controladores, servicios y validaciones.
- Capa de acceso a base de datos (ORM / Cliente SQL) desde el backend.
- Conexión e integración interactiva de WebSockets (Socket.io).
- Lógica real de simulación telemétrica en el contenedor de Python.

---

## 💻 Estado del Frontend (Next.js)

El frontend cuenta con un cascarón interactivo reutilizable para el panel de control:
- [frontend/components/app/header.tsx](frontend/components/app/header.tsx) — Barra superior con selector de rol temporal.
- [frontend/components/app/dock.tsx](frontend/components/app/dock.tsx) — Menú inferior interactivo para la navegación entre módulos.
- [frontend/components/app/app-shell.tsx](frontend/components/app/app-shell.tsx) — Contenedor y diseño del layout responsivo del panel.
- [frontend/components/app/app-state.tsx](frontend/components/app/app-state.tsx) — Contexto de React para control de estados comunes.

### Rutas del cascarón disponibles:
- `/` — Inicio / Dashboard
- `/orders` — Módulo de Órdenes de Servicio
- `/orders/new` — Creación de nuevas Órdenes
- `/devices` — Gestión de Dispositivos de la Flota
- `/reports` — Historial y Reportes
- `/users` — Gestión de Usuarios y Permisos
- `/settings` — Panel de Ajustes del Sistema
- `/profile` — Información de Perfil del Usuario

> ⚠️ **Nota:** El selector de roles en el encabezado es puramente visual y guarda el estado de forma local en el contexto de React (no es autenticación real).

---

## 🔌 Estado del Backend (Express + TS)

El backend únicamente inicia un servidor básico en [backend/src/index.ts](backend/src/index.ts) que responde en el puerto `4000`. No se han implementado rutas de negocio, base de datos ni validación de datos.

---

## 🗄️ Estado de la Base de Datos (PostgreSQL)

La base de datos se inicializa a través del script [database/init.sql](database/init.sql).

### Datos Clave:
- Las llaves primarias son UUIDs autogenerados mediante la función de Postgres `gen_random_uuid()`.
- Se incluye un trigger automático `updated_at` para todas las tablas.
- Se cargan 8 puntos predefinidos del campus (**campus_points**) durante la inicialización inicial del contenedor.
- Si el volumen de datos de Postgres en Docker ya existe, la inicialización se omite automáticamente.
- **Si realizas cambios en el esquema**: actualiza `database/init.sql`, documenta los cambios en [docs/DATABASE.md](docs/DATABASE.md) y ejecuta `docker compose down -v` para recrear los contenedores limpiando volúmenes.

---

## 🐳 Flujo de Trabajo en Docker

Todo el desarrollo se realiza de forma obligatoria mediante Docker Compose.

### Comandos Comunes:
- **Primer arranque o actualización de dependencias**: `docker compose up --build`
- **Inicio diario de desarrollo**: `docker compose up`
- **Detención de contenedores y redes**: `docker compose down`
- **Restablecimiento absoluto (borrado de base de datos)**: `docker compose down -v`

> 🐧 **Nota para Linux**: Los volúmenes montados usan la bandera `:Z` debido a compatibilidad de permisos con SELinux/Linux para evitar errores `EACCES`.

---

## 🎨 Restricciones Críticas de Interfaz de Usuario

Estas directrices de interfaz son inalterables:
- Solo se permite el uso de la biblioteca de iconos **`lucide-react`**.
- Queda prohibido añadir otras librerías como `react-icons`, Heroicons, Phosphor o customizar iconos SVG en archivos independientes.
- No se deben utilizar emojis como iconos principales en la navegación ni en botones.

---

## 📋 Checklist de Tareas del Proyecto (Faltantes y en Progreso)

*Esta lista sirve de guía interactiva sobre el estado real de la demo. Se indican los elementos completados (`[x]`), a medias o con advertencias (`[/]`) y los pendientes (`[ ]`).*

### 🛠️ Infraestructura Base del Sistema
- [x] **Conectar el Backend a la base de datos PostgreSQL de Docker.**
  * *Razón*: Conexión activa implementada en `backend/src/db.ts` utilizando la URI de conexión de Docker. Los datos persisten correctamente en Postgres.
- [x] **Implementar la arquitectura interna del Backend (Rutas, Controladores, Modelos, Servicios).**
  * *Razón*: El backend cuenta con una estructura limpia de routers (`/api/devices`, `/api/orders`, `/api/telemetry`, `/api/alerts`, `/api/campus-points` y `/api/dashboard`) conectados a la DB.
- [x] **Diseñar el sistema de autenticación de usuarios (JWT / Sesiones) diferenciando roles (`operator` y `administrator`).**
  * *Razón*: JWT implementado con `bcryptjs` y `jsonwebtoken` en `backend/src/routes/auth.ts` (`POST /api/auth/login`, `GET /api/auth/me`) y middleware `backend/src/middleware/auth.ts`. Usuarios demo creados automáticamente al iniciar (`admin@javerianacali.edu.co` / `Admin1234`, `operador@javerianacali.edu.co` / `Operador1234`) con hashes bcrypt reales. `JWT_SECRET` en `.env`.
- [x] **Integrar el flujo de autenticación del Frontend con las credenciales y roles devueltos por el Backend.**
  * *Razón*: `frontend/lib/auth.ts` maneja token en localStorage + cookie `fleet_session`. `frontend/middleware.ts` redirige a `/login` sin sesión. `app-state.tsx` carga usuario real desde `/api/auth/me`. Login page llama `POST /api/auth/login`. Header muestra usuario real y botón logout funcional. Se eliminaron rutas duplicadas (flat vs `(fleet)` group).
- [x] **Implementar la comunicación bidireccional en tiempo real con Socket.io en Backend y Frontend.**
  * *Razón*: Backend migrado a `http.createServer` + `Server` de Socket.io (`backend/src/socket.ts`). El endpoint `POST /api/telemetry` emite `telemetry:update` a todos los clientes. El check de pérdida de señal emite `device:status` y `alert:new`. Frontend usa `socket.io-client` (`frontend/lib/socket.ts`) singleton. Dashboard reemplaza polling por suscripción a `telemetry:update`, `device:status`, `alert:new`.
- [x] **Crear el protocolo de comunicación física telemétrica entre el Simulador y el Backend.**
  * *Razón*: El simulador en `simulator/` transmite telemetría física real (coordenadas GPS, nivel de batería, velocidad, sensores) al backend mediante llamadas recurrentes a la API `POST /api/telemetry`.

### 🤖 Requisitos Funcionales del Demo
- [x] **RF-04: Gestión de Puntos Predefinidos de Encuentro**
  - [x] Cargar los puntos predefinidos del campus en la vista de nueva orden.
  - [x] Bloquear por completo la escritura manual o coordenadas libres por parte del usuario.
  * *Razón*: Los puntos se cargan dinámicamente de la base de datos y solo se pueden elegir en menús desplegables estáticos, previniendo entradas manuales.
- [x] **RF-05: Creación de Orden de Servicio tipo Entrega**
  - [x] Guardar descripción de objeto, email del remitente y email del destinatario obligatoriamente.
  - [x] Validar formato de correos institucionales.
  - [x] Capturar tipo de dispositivo, origen, destino y franja horaria solicitada.
  * *Razón*: Implementado con validación rigurosa en backend (`POST /api/orders`) y frontend (formulario interactivo por pasos).
- [x] **RF-06: Gestión de Franja Horaria para Entrega**
  - [x] Impedir doble reserva de un mismo dispositivo durante una misma franja exacta de una hora.
  - [x] Impedir solapamientos en rango horario intermedio (por ejemplo, 14:00–15:00 y 14:30–15:30 en la misma unidad).
  - [x] Permitir que otros dispositivos operen simultáneamente en la misma franja de tiempo sin bloqueos cruzados.
  * *Razón*: `POST /api/orders` consulta `tstzrange(start_time, end_time) && tstzrange($2, $3)` antes del INSERT para detectar cualquier solapamiento de rango. Además, `database/init.sql` añade `EXCLUDE USING gist` con `btree_gist` como garantía atómica a nivel de DB. **Requiere `docker compose down -v && docker compose up --build` para recrear el schema con la extensión.**
- [/] **RF-09: Emisión del Código QR a Ambas Partes**
  - [x] Generar QR criptográfico único de un solo uso por cada orden de entrega exitosa.
  - [/] Implementar el motor de envío de correo electrónico para remitente y destinatario con ID de orden, franja y punto de encuentro.
  * *⚠️ Advertencia (A medias)*: El backend genera el código QR (Base64) usando `qrcode` e implementa la integración real con `Resend` enviando un correo HTML premium. Sin embargo, para la demo, todos los correos se redirigen a `jdavidruanob@gmail.com` debido a restricciones de sandbox en cuentas gratuitas de Resend (donde solo se puede enviar al dueño de la cuenta).
- [x] **RF-18: Consulta y Filtrado de Bitácora**
  - [x] Mostrar en la interfaz los registros de la bitácora transaccional conectados a la API real.
  - [x] Filtros combinados por tipo de servicio, rango exacto de fechas (from/to) y estado operativo.
  * *Razón*: `frontend/app/(fleet)/reports/page.tsx` reemplaza el placeholder por fetch real a `GET /api/orders?from=&to=&type=&status=`. Backend ampliado con filtros `from` y `to` que usan `created_at >= $from AND created_at < ($to + 1 day)`. La página incluye KPIs de resumen (total, completadas, canceladas, en curso, entregas, grabaciones) y tabla completa. La página de órdenes (`/orders`) ya tenía fetch real desde el commit anterior.
- [x] **RF-19: Panel de Monitoreo de Flota en Tiempo Real**
  - [x] Renderizar panel interactivo para el operador con mapa interactivo del campus.
  - [x] Mostrar ubicación GPS en tiempo real por cada unidad activa sobre el mapa.
  - [x] Mostrar nivel de batería, estado de la misión, velocidad en tiempo real por Socket.io.
  * *Razón*: `frontend/components/dashboard/campus-map.tsx` implementa el mapa con `react-leaflet` y tiles de OpenStreetMap (sin API key). Muestra los 8 puntos del campus como marcadores estáticos y los dispositivos con marcadores dinámicos coloreados por estado (verde=available, azul=in_mission, rojo=blocked). Al recibir `telemetry:update` via Socket.io el dashboard actualiza `latitude`/`longitude` en el estado de React, refrescando los marcadores en tiempo real. El backend `/api/devices` incluye ahora la última posición GPS conocida (via LATERAL JOIN a telemetry).
- [/] **RF-20: Streaming de Cámara por Dispositivo**
  - [/] Proveer visualizador de video interactivo para el Operador en misiones activas.
  - [ ] Conectar flujo continuo captado por el dispositivo.
  * *⚠️ Advertencia (A medias)*: La vista de detalle del dispositivo (`frontend/app/devices/[id]/page.tsx`) incluye una caja de reproducción para la cámara en vivo que muestra un enlace RTSP simulado (`rtsp://fleet.puj/{device.id}`), pero no realiza streaming real.
- [x] **RF-21: Alerta por Pérdida de Señal**
  - [x] Detectar inactividad telemétrica de 30 segundos consecutivos en misión activa.
  - [x] Generar de forma automática alerta crítica visual en el panel fijando la última posición y estado conocidos del dispositivo.
  * *Razón*: Un proceso periódico en `backend/src/index.ts` (cada 5s) actualiza los dispositivos inactivos a `sin_senal` y bloqueados, creando alertas en la base de datos. El frontend lee este estado y despliega una advertencia visual crítica en color rojo con el último estado conocido.
- [x] **RF-23: Bloqueo Automático por Mantenimiento**
  - [x] Calcular uso de los dispositivos (>300 km recorridos, >50 horas de vuelo o >1 mes desde última revisión).
  - [x] Transicionar automáticamente el estado a "Bloqueado — Requiere Mantenimiento" e impedir nuevas reservas.
  * *Razón*: Lógica implementada a nivel de API en `backend/src/routes/devices.ts` (`PATCH /:id`), transicionando el estado del dispositivo y disparando la alerta de mantenimiento requerida a la base de datos al superar los umbrales.
- [x] **RF-24: Validación de Batería antes de Asignación**
  - [x] Consultar nivel de batería en tiempo real antes de vincular el dispositivo.
  - [x] Rechazar operaciones si la carga es inferior al 20%, con mensaje detallado al usuario.
  - [x] Rechazar operaciones si el dispositivo no está en estado `available`.
  * *Razón*: `POST /api/orders` valida `device.status !== 'available'` y `device.battery_level < 20` inmediatamente después de cargar el dispositivo de la DB, devolviendo `400` con mensaje específico ("Batería insuficiente: X% — se requiere mínimo 20%"). El formulario frontend (`orders/new/page.tsx`) muestra los dispositivos con batería <20% o estado no disponible como `<option disabled>` con badge "⚠ Batería baja" o "(status)".

