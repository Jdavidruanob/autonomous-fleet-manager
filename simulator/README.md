# Simulator

The simulator container exists in Docker Compose, but the real simulator logic is not implemented yet.

Current state:

- `simulator/Dockerfile` exists
- `simulator/requirements.txt` exists
- the container can start as a placeholder

Expected future responsibility:

- simulate robots and drones
- POST telemetry to the backend
- receive commands back from the backend
- support interactive keyboard commands when launched with:

```bash
docker compose run --rm simulator
```
