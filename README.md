# Fleet Control PUJ - Gestor de Flota Autónoma

Fleet Control PUJ es una plataforma de operaciones y panel de control interno para el monitoreo y gestión de una flota simulada de robots autónomos de reparto y drones de grabación en el campus de la **Pontificia Universidad Javeriana Cali**.

Este repositorio forma parte del proyecto final de grado. El documento detallado con toda la información técnica, teórica y de diseño de la entrega final se encuentra en el siguiente enlace:
👉 **[Documento de la Entrega Final (Google Drive)](https://drive.google.com/file/d/1MGXuxiOFTTuLPXiUF7opfhuQ92TFwlTK/view?usp=sharing)**

---

## 🎯 Alcance del Demo

Este código representa un **demo completamente funcional** diseñado para validar e implementar exactamente **10 requisitos funcionales clave** de los 60 modelados en el sistema a gran escala del proyecto final. 

Para ver el comportamiento interno esperado, flujos de negocio y la especificación detallada de estos 10 requisitos, consulta el archivo [Especificación del Sistema (SPEC.md)](SPEC.md).

---

## 💻 Stack Tecnológico

El proyecto está diseñado bajo una arquitectura modular y moderna:

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS para estilos premium y dinámicos.
- **Backend**: Node.js, Express, TypeScript para el manejo de rutas y lógica de negocio.
- **Base de Datos**: PostgreSQL 15, encargada de la persistencia de usuarios, órdenes, dispositivos y logs.
- **Tiempo Real (Real-time)**: Socket.io para la telemetría activa en tiempo real.
- **Simulador**: Servicio independiente en Python que emula los movimientos, batería y estado físico de los dispositivos.
- **Entorno de Ejecución**: Docker Compose para la orquestación local y estandarización del ambiente de desarrollo.

---

## 🚀 Instalación y Uso Rápido

El entorno completo de desarrollo se ejecuta mediante contenedores de Docker. Consulta la guía detallada en [Configuración del Desarrollador (docs/DEVS.md)](docs/DEVS.md) para más detalles.

### Pasos Iniciales:

1. **Clonar el repositorio** y entrar en la carpeta del proyecto.
2. **Crear el archivo de variables de entorno**:
   ```bash
   cp .env.example .env
   ```
3. **Construir y levantar el entorno por primera vez** (o tras cambios de dependencias):
   ```bash
   docker compose up --build
   ```
4. **Levantar el entorno para desarrollo diario**:
   ```bash
   docker compose up
   ```
5. **Acceder a la aplicación**:
   Abre tu navegador en [http://localhost:3000](http://localhost:3000).

### Credenciales de Acceso (Demo)

El sistema crea automáticamente dos cuentas de demostración al iniciar por primera vez:

| Rol | Correo | Contraseña |
|---|---|---|
| **Administrador** | `admin@javerianacali.edu.co` | `Admin1234` |
| **Operador** | `operador@javerianacali.edu.co` | `Operador1234` |

> La página de login también incluye botones de **acceso rápido demo** que rellenan las credenciales automáticamente.

---

## 📂 Estructura del Proyecto

```text
.
├── AGENTS.md             # Guía técnica de relevo y checklist para agentes de IA
├── SPEC.md               # Especificación funcional de los 10 requisitos y reglas internas
├── docker-compose.yml    # Orquestación de servicios en Docker
├── backend/              # Código fuente del servidor Express (Node.js + TS)
├── frontend/             # Código fuente de la interfaz de usuario (Next.js)
├── database/             # Scripts de inicialización y esquema de PostgreSQL
├── simulator/            # Código fuente del simulador físico en Python
└── docs/                 # Documentación técnica adicional (DB, Diseño, etc.)
    ├── DATABASE.md       # Referencia del esquema de la Base de Datos
    ├── DESIGN_SYSTEM.md  # Tokens visuales y diseño premium del sistema
    └── DEVS.md           # Guía detallada de instalación y solución de problemas
```

---

## 👥 Contribución y Desarrollo

- **Ramas**: El desarrollo se realiza sobre ramas de características basadas en la rama principal.
- **Base de Datos**: Si deseas reiniciar los datos y volver a ejecutar el esquema de la base de datos de manera limpia, utiliza:
  ```bash
   docker compose down -v
   docker compose up --build
  ```
