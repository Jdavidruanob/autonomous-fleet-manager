# Especificación del Sistema - Fleet Control PUJ

## Propósito

Fleet Control PUJ es un sistema de operaciones y control interno diseñado para la **Pontificia Universidad Javeriana Cali**. Su propósito principal es coordinar, monitorear y gestionar una flota simulada de dispositivos autónomos (robots terrestres y drones aéreos) dedicados a dos actividades principales en el campus:

1. **Servicio de Entrega (Reparto)**: Envío seguro de paquetes físicos entre puntos de encuentro predefinidos dentro del campus.
2. **Servicio de Grabación**: Registro audiovisual de eventos o zonas institucionales mediante drones.

Este sistema no está de cara al público general, sino que funciona como una consola de administración e interfaz interactiva para el personal operativo y de administración de la universidad.

---

## 🎯 Contexto e Importancia — Alcance del Demo

Este software forma parte de la **Entrega Final de Grado**. El diseño general del sistema contempla un modelo integral de 60 proyectos y requisitos funcionales detallados. Sin embargo, para efectos prácticos y de demostración técnica de esta entrega final, **este repositorio actúa como un demo completamente funcional que implementa exactamente 10 requisitos funcionales específicos**.

Toda la fundamentación, modelado y marco general se encuentra disponible en:
👉 **[Documento de la Entrega Final (Overleaf)](https://www.overleaf.com/read/dcqtcfdyfyby#2728aa)**

Cada decisión de diseño de código, rutas API, triggers de base de datos y flujos visuales debe servir y responder directamente a estos 10 requisitos.

### 📋 Requisitos Funcionales Implementados en la Demo

| ID | Título | Descripción |
|---|---|---|
| **RF-04** | Gestión de Puntos Predefinidos de Encuentro | Cuando se configure el origen y el destino al registrar una orden de servicio, el sistema deberá desplegar únicamente los puntos de encuentro predefinidos disponibles dentro del campus de la Pontificia Universidad Javeriana Cali, bloqueando por completo la posibilidad de que el usuario digite direcciones libres o ingrese coordenadas manuales. |
| **RF-05** | Creación de Orden de Servicio tipo Entrega | Cuando se procese la creación de una orden de tipo Entrega, el sistema deberá registrar obligatoriamente la descripción del objeto a enviar, el correo electrónico institucional del usuario que envía y el correo electrónico institucional del usuario que recibe, además del tipo de dispositivo seleccionado (Robot o Dron), el punto de origen, el punto de destino y la franja horaria solicitada. |
| **RF-06** | Gestión de Franja Horaria para Entrega | Cuando se intente asignar un dispositivo a una orden de Entrega, el sistema deberá validar el horario y bloquear la disponibilidad de ese dispositivo específico durante una franja exacta de una hora, impidiendo que sea asociado a otra misión en el mismo bloque de tiempo, pero permitiendo que unidades distintas de la flota operen simultáneamente en esa misma franja. |
| **RF-09** | Emisión del Código QR a Ambas Partes | Cuando se confirme de manera exitosa una orden de tipo Entrega, el sistema deberá generar un único código QR criptográfico de un solo uso y enviarlo por correo electrónico de forma simultánea tanto al buzón del remitente como al del destinatario, detallando en el mensaje el identificador de la orden, la franja horaria asignada y el punto de encuentro correspondiente. |
| **RF-18** | Consulta y Filtrado de Bitácora | Cuando un usuario autenticado con los permisos correspondientes acceda al módulo de historial, el sistema deberá desplegar todos los registros de la bitácora transaccional y permitir la aplicación de filtros combinados por tipo de servicio, rango exacto de fechas y estado operativo de la orden. |
| **RF-19** | Panel de Monitoreo de Flota en Tiempo Real | Mientras exista al menos un dispositivo registrado en la flota, el sistema deberá renderizar en la interfaz del Operador un panel telemétrico actualizado en tiempo real que muestre por cada unidad: la ubicación GPS, el nivel de batería, el estado de la misión (en base, en trayecto, esperando o bloqueado), el estado de la conexión y calidad de la señal, el estado de los sensores, la velocidad, la temperatura interna, el estado de la cámara y la orden de servicio asignada actualmente. |
| **RF-20** | Streaming de Cámara por Dispositivo | Cuando un dispositivo de la flota se encuentre ejecutando una orden de servicio activa, el sistema deberá proveer al Operador una interfaz interactiva dentro del panel de monitoreo para visualizar la transmisión de video en vivo captada por la cámara de la unidad de forma continua. |
| **RF-21** | Alerta por Pérdida de Señal | Cuando el sistema detecte una interrupción o ausencia en el flujo de datos telemétricos de un dispositivo en misión activa durante 30 segundos consecutivos, deberá generar de forma automática una alerta visual crítica en el panel del Operador, fijando en la pantalla la última ubicación y el último estado conocidos de dicha unidad. |
| **RF-23** | Bloqueo Automático por Mantenimiento | Cuando los datos históricos acumulados de un dispositivo superen los 300 kilómetros recorridos, las 50 horas de vuelo o se cumpla 1 mes calendario desde su última revisión técnica registrada, el sistema deberá transicionar automáticamente su estado a "Bloqueado — Requiere Mantenimiento" e impedir que sea asignado a cualquier orden futura hasta que se registre una nueva intervención. |
| **RF-24** | Validación de Batería antes de Asignación | Cuando el motor de asignación intente vincular un dispositivo a una orden de servicio, el sistema deberá consultar su telemetría en tiempo real y rechazar la operación si el nivel de carga actual es inferior al 20% de su capacidad total, informando inmediatamente al usuario el motivo del rechazo. |

---

## 👥 Roles del Sistema

- **`operator` (Operador)**:
  - Crea y gestiona órdenes de servicio.
  - Monitorea la ejecución en vivo de los dispositivos en el mapa y el panel de control.
  - Visualiza transmisiones en vivo de cámaras y gestiona alertas del sistema.
- **`administrator` (Administrador)**:
  - Cuenta con todas las facultades del operador.
  - Puede registrar y gestionar usuarios y configurar los dispositivos de la flota.

---

## ⚙️ Reglas de Comportamiento e Infraestructura

1. **Validación de Asignaciones**: 
   - No se permiten solapamientos horológicos (doble reserva) en el mismo dispositivo.
   - Si la batería actual del dispositivo es inferior al 20%, se bloquea su asignación para cualquier tipo de misión (**RF-24**).
2. **Restricción de Mantenimiento Automático**: 
   - El backend monitorea los límites de uso acumulado de cada dispositivo y cambia automáticamente su estado a `blocked` (bloqueado por mantenimiento) si sobrepasa 300 km recorridos, 50 horas de vuelo (solo drones) o 1 mes de su última revisión (**RF-23**).
3. **Flujo de Seguridad por QR (Entregas)**:
   - Toda orden exitosa de tipo Entrega genera un QR único y seguro (**RF-09**).
   - Se emite de forma automática por correo electrónico institucional tanto a remitente como destinatario.
4. **Pérdida de Conexión**:
   - Si no se reciben señales de telemetría de un dispositivo en misión activa durante 30 segundos continuos, el backend emite un evento crítico al operador por WebSockets (**RF-21**).

---

## 🏗️ Arquitectura Técnica de la Solución

El demo se ejecuta en una arquitectura de microservicios dockerizados, lo que garantiza consistencia y un arranque unificado de todo el sistema.

### 🐳 Estructura de Contenedores y Puertos (Docker Compose)

El sistema está orquestado mediante Docker Compose bajo la siguiente distribución de servicios, dependencias y puertos:

| Servicio / Contenedor | Tecnología | Puerto Interno | Puerto Local Expuesto | Depende de | Propósito / Comunicación |
|---|---|---|---|---|---|
| **`frontend`** | Next.js (TS) | `3000` | `3000` | `backend` (saludable) | Interfaz gráfica de usuario. Se conecta con el backend por HTTP y Socket.io. |
| **`backend`** | Express (TS) | `4000` | `4000` | `db` (saludable) | Lógica de negocio y WebSockets. Recibe peticiones del frontend y telemetría del simulador. |
| **`db`** | PostgreSQL 15 | `5432` | `5432` | Ninguno | Persistencia de datos relacionales. Inicializa el esquema mediante `database/init.sql`. |
| **`simulator`** | Python | `8000` | `8000` | `backend` (saludable) | Emulación física del movimiento y batería de los dispositivos. Envía telemetría al backend. |

### 🔌 Canales de Comunicación e Integración

1. **Comunicación Interna de Red Docker**:
   - El contenedor `backend` se conecta a la base de datos a través de la dirección interna `db:5432`.
   - El contenedor `simulator` y la interfaz del `frontend` consumen la API y los WebSockets del backend apuntando internamente a `backend:4000`.
2. **Acceso Local desde el Host (Tu Máquina)**:
   - **Frontend**: Accesible en tu navegador en [http://localhost:3000](http://localhost:3000).
   - **Backend**: API REST expuesta en [http://localhost:4000](http://localhost:4000).
   - **Simulador**: API expuesta en [http://localhost:8000](http://localhost:8000).
   - **Base de Datos (PostgreSQL)**: Expuesta localmente en el puerto `5432`. Esto te permite conectar herramientas de administración externa como **DBeaver** o **pgAdmin** utilizando el host `localhost`, usuario `postgres`, contraseña `postgres` y base de datos `fleetcontrol_puj` (para más información, ver [Referencia de Base de Datos (docs/DATABASE.md)](docs/DATABASE.md)).


---

## 🎨 Restricciones de Interfaz Visual (No Negociables)

Para mantener una consistencia visual de nivel premium y coherencia técnica:

- **Iconografía**: Se permite única y exclusivamente el uso de la biblioteca `lucide-react`.
- **Prohibido**: No se permite agregar librerías adicionales de iconos (`react-icons`, `Heroicons`, etc.), ni usar archivos SVG propios como iconos directos, ni utilizar emojis como iconos dentro de los botones o navegación.
- **Tokens de Diseño**: Todas las vistas de la aplicación deben ceñirse estrictamente a la paleta, tipografía y micro-animaciones declaradas en [Sistema de Diseño (docs/DESIGN_SYSTEM.md)](docs/DESIGN_SYSTEM.md).

---

## 📍 Fuentes de Verdad de la Documentación

- **Propósito y Alcance**: Este archivo (`SPEC.md`).
- **Guía de Desarrollo Local**: [Guía de Desarrollo (docs/DEVS.md)](docs/DEVS.md).
- **Esquema de Base de Datos**: [Base de Datos (docs/DATABASE.md)](docs/DATABASE.md).
- **Manual de Componentes e Interfaz**: [Sistema de Diseño (docs/DESIGN_SYSTEM.md)](docs/DESIGN_SYSTEM.md).
- **Guía de Traspaso y Checklist de Agentes**: [Handoff de Agentes (AGENTS.md)](AGENTS.md).
