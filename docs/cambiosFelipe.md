Unifica las dos vistas actuales del sistema Fleet Control PUJ en una sola interfaz profesional y funcional.

Objetivo:
- Mantener el dashboard de simulador de flota.
- Integrar la vista individual del robot/dron dentro del mismo flujo visual.
- Mantener el diseño moderno actual (cards blancas, bordes suaves, estilo minimalista).

Requisitos:
1. Al hacer click en un robot/dron del simulador, abrir su panel detallado.
2. El panel detallado debe mostrar:
   - cámara en vivo REAL usando navigator.mediaDevices.getUserMedia()
   - telemetría
   - estado del dispositivo
   - ruta actual
   - batería
   - velocidad
   - GPS
   - tiempo de misión
3. La cámara real debe reemplazar el placeholder falso actual.
4. Permitir:
   - seleccionar cámara disponible
   - activar/desactivar cámara
   - manejar permisos correctamente
5. Mantener responsive design.
6. No romper el diseño existente.
7. Reutilizar componentes actuales.
8. Usar React + Tailwind.
9. Mantener navegación fluida entre flota y detalle.