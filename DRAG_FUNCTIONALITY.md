# Funcionalidad de Arrastrar (Drag) - MultiKeyboard

## 🤏 Nueva Funcionalidad Implementada

Se ha agregado la funcionalidad de **arrastrar (drag)** al cliente MultiKeyboard para permitir mover ventanas y elementos en el computador remoto.

## ✨ Características

### 🎯 Cómo Usar
1. **Conecta** al servidor remoto normalmente
2. **Asegúrate** de que el control de mouse esté activado (toggle switch)
3. **Mantén presionado** el botón izquierdo del mouse en el canvas
4. **Arrastra** hacia donde quieres mover la ventana/elemento
5. **Suelta** el botón del mouse para completar el arrastre

### 🎨 Indicadores Visuales
- **Cursor azul más grande** cuando estás arrastrando
- **Línea punteada** que conecta el punto de inicio con la posición actual
- **Punto negro** que marca donde iniciaste el arrastre
- **Mensaje "[ARRASTRANDO]"** en la información del mouse

### 🖱️ Estados del Cursor
- **🚫 Gris con X**: Control de mouse desactivado
- **🎯 Rojo con cruz**: Listo para usar (área útil)
- **🟠 Naranja punteado**: En margen de seguridad
- **🔵 Azul con cruz grande**: Arrastrando activamente

## 🔧 Implementación Técnica

### Cliente (JavaScript)
- Nuevas variables para tracking de drag: `isDragging`, `dragStartX`, `dragStartY`
- Eventos `mousedown` y `mouseup` para iniciar/terminar drag
- Método `handleCanvasMouseDown()` para iniciar drag
- Método `handleCanvasMouseUp()` para finalizar drag
- Método `sendMouseDrag()` para enviar comando al servidor
- Visualización mejorada en `drawScreenWithCursor()`

### Servidor (Python)
- Endpoint `/mouse` con acción `drag` ya existía
- Corregido mapeo de botones para drag
- Usa `pyautogui.drag()` para ejecutar el arrastre

### 📡 Protocolo de Comunicación
```json
{
    "action": "drag",
    "x": 100,        // Coordenada X de inicio
    "y": 200,        // Coordenada Y de inicio
    "to_x": 300,     // Coordenada X de destino
    "to_y": 400,     // Coordenada Y de destino
    "button": "left" // Botón del mouse (left/right/middle)
}
```

## 🎮 Casos de Uso

### ✅ Funciona Para:
- **Mover ventanas** arrastrando la barra de título
- **Redimensionar ventanas** arrastrando bordes/esquinas
- **Arrastrar archivos** entre carpetas
- **Mover elementos** en aplicaciones gráficas
- **Seleccionar texto** arrastrando
- **Dibujar** en aplicaciones de diseño

### ⚠️ Consideraciones
- **Distancia mínima**: Solo se envía el drag si hay más de 3 píxeles de movimiento
- **Área válida**: Solo funciona dentro del área útil del canvas (no en márgenes)
- **Throttling**: No interfiere con el movimiento normal del mouse
- **Precisión**: Usa la misma lógica de coordenadas que clicks y movimientos

## 🐛 Debugging

### 📊 Logs del Cliente
- `🤏 Drag iniciado en (x, y)` - Cuando empiezas a arrastrar
- `🤏 Drag finalizado en (x, y) - distancia: Npx` - Cuando terminas
- `🖱️ drag desde (x1, y1) hasta (x2, y2)` - Cuando se envía al servidor

### 🖥️ Logs del Servidor
- `🖱️ Mouse drag from (x1, y1) to (x2, y2)` - Cuando se ejecuta el drag

## 🚀 Mejoras Futuras Posibles
- Soporte para drag con botón derecho/medio
- Drag continuo (múltiples drags en secuencia)
- Configuración de sensibilidad de drag
- Drag entre múltiples monitores
- Gestos de drag especiales (como pinch-to-zoom)

---

**¡Ahora puedes arrastrar ventanas y elementos en el computador remoto con total precisión! 🎉**
