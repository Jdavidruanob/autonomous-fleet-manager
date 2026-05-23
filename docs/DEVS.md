# Developer Setup

## Requisitos previos

- **Windows**: Docker Desktop (con WSL2 activado)
- **Linux**: Docker Engine + Docker Compose v2
- **Mac**: Docker Desktop
- Git

---

## Pasos para arrancar el proyecto

### 1. Crear el archivo de entorno

Copia el archivo de ejemplo `.env.example` a `.env`. Esto crea la configuración que Docker necesita para conectar los servicios:

**Windows (PowerShell):**
```powershell
copy .env.example .env
```

**Linux / Mac:**
```bash
cp .env.example .env
```

### 2. Construir y arrancar todos los servicios

La primera vez que arranques el proyecto (o después de cambiar dependencias o Dockerfiles) usa `--build`:

```bash
docker compose up --build
```

> **Windows**: Si estás en PowerShell o CMD, el comando es igual. Si usas Git Bash o WSL, puede que necesites `docker.exe compose up --build` dependiendo de cómo instalaste Docker.

Esto descarga imágenes, compila el frontend y backend, e inicia todos los contenedores. La primera vez puede tardar varios minutos.

### 3. Abrir el proyecto

Abre tu navegador en:

```
http://localhost:3000
```

---

## Comandos diarios

### Iniciar el proyecto (sin rebuild)

```bash
docker compose up
```

### Detener el proyecto

Si usaste `Ctrl+C` para detener, Docker limpiará automáticamente.

```bash
docker compose down
```

---

## Comandos útiles

### Ver logs de un servicio en tiempo real

```bash
# Solo el backend
docker compose logs -f backend

# Solo el frontend
docker compose logs -f frontend

# Solo la base de datos
docker compose logs -f db

# Todos los servicios a la vez
docker compose logs -f
```

### Acceder a la base de datos directamente

```bash
docker compose exec db psql -U postgres -d fleetcontrol_puj
```

### Instalar una dependencia en el frontend

```bash
docker compose exec frontend npm install <paquete>
docker compose up --build frontend
```

### Instalar una dependencia en el backend

```bash
docker compose exec backend npm install <paquete>
docker compose up --build backend
```

### Ver qué contenedores están corriendo

```bash
docker compose ps
```

---

## Resetear todo (borrar datos)

Si necesitas borrar la base de datos y empezar desde cero:

```bash
docker compose down -v
docker compose up --build
```

**Cuidado**: esto elimina todos los datos guardados en la base de datos.

---

## Diferencias entre Windows y Linux

### Docker Compose

En la mayoría de los casos el comando es el mismo para ambos sistemas:

```bash
docker compose up
```

Si Docker está dentro de WSL2 en Windows, corre los comandos desde la terminal de Linux (WSL) y funcionan igual que en Linux nativo.

### Permisos y ejecución

**Linux**:
- Si tienes errores de permisos, prueba con `sudo`:
  ```bash
  sudo docker compose up
  ```
- Si quieres evitar usar `sudo` siempre, agrega tu usuario al grupo `docker`:
  ```bash
  sudo usermod -aG docker $USER
  # Luego cierra sesión y vuelve a entrar
  ```

**Windows**:
- Ejecuta PowerShell o Terminal como **Administrador** si tienes errores de permisos.
- Si usas Docker Desktop con WSL2, todo funciona desde la terminal de Linux dentro de WSL2.

### Line endings (Windows)

Si los scripts fallan dentro de los contenedores de Linux, puede ser por los saltos de línea de Windows (`\r\n` vs `\n`). Antes de clonar el repositorio, configura Git:

```bash
git config --global core.autocrlf false
```

Si ya clonaste el repo y tienes problemas, ejecuta esto dentro de la carpeta del proyecto:

```bash
git rm -rf --cached .
git reset --hard
```

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| **Puerto en uso** (`3000`, `4000` o `5432` ya está ocupado) | Cierra la aplicación que esté usando ese puerto o cambia el puerto en `docker-compose.yml` |
| **Docker no responde** | Reinicia Docker Desktop (Windows) o el servicio `docker` (Linux) |
| **`docker compose` no existe** | Instala Docker Compose v2 o usa `docker-compose` (con guión) en lugar de `docker compose` (con espacio) |
| **Cambios de código no se reflejan** | Usa `docker compose up --build` para reconstruir el servicio afectado |
| **La base de datos no inicia** | Verifica que PostgreSQL no esté corriendo localmente en el puerto `5432` |
| **Contenedores se caen inmediatamente** | Revisa los logs con `docker compose logs <servicio>` |

---

## Reglas del equipo

- **Nunca hagas commit de `.env`**. Ese archivo tiene secrets y no debe subirse al repositorio.
- **Nunca corras `npm install` o `pip install` fuera de Docker**. Siempre usa `docker compose exec`.
- Los cambios de código en `frontend/`, `backend/` y `simulator/` se reflejan sin hacer rebuild gracias a los volúmenes montados.
- Si agregas un nuevo servicio o cambias un Dockerfile, avisa al equipo para que todos hagan `docker compose up --build`.

---

## Flujo de trabajo con Git

### Ramas

```
main (estable, protegido)
└── dev (rama base para integración)
    ├── feat/reservas
    ├── feat/bitacora
    └── feat/alertas
```

### Cómo trabajar en una feature

**1. Siempre parte de `dev`:**
```bash
git checkout dev
git checkout -b feat/nombre-de-tu-feature
```

**2. Trabaja en tu rama, haz commits:**
```bash
git add .
git commit -m "feat: descripción de lo que hiciste"
```

**3. Sube tu rama al repositorio:**
```bash
git push -u origin feat/nombre-de-tu-feature
```

**4. Crea un Pull Request (PR) a `dev`** en GitHub.

**5. Cuando el PR esté aprobado, haz merge a `dev`.**

### Reglas importantes

- **Nunca hagas commit directo a `main` ni a `dev`**
- **El título del commit** debe seguir el formato: `feat: descripción` o `fix: descripción`
- **La descripción del PR** debe incluir: qué cambiaste, cómo probarlo, y notas para el revisor

### Si tu feature depende de otra que aún no existe

1. Construye tu feature usando **datos mock** o **stubs de interfaz**
2. Documenta en la descripción del PR exactamente qué necesitas de la otra feature
3. Usa el template de "Contract interface" en `AGENTS.md` para dejar claro qué datos esperas

### Sincronizar tu rama con dev

Si `dev` avanzó mientras trabajas en tu feature:

```bash
git checkout dev
git pull
git checkout feat/tu-feature
git merge dev
```

Resolve conflictos si hay y haz commit del merge.