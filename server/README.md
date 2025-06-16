# 🖥️ MultiKeyboard - Servidor

Servidor que permite el control remoto de teclado y mouse a través de HTTP.

## 🚀 Instalación Rápida

### Instalar Dependencias

**macOS / Linux:**
```bash
./install_dependencies.sh
```

**Windows:**
```cmd
install_dependencies.bat
```

### Ejecutar Servidor
```bash
python3 server.py
```

## 📋 Dependencias

- **Flask** - Servidor web HTTP
- **Flask-CORS** - Soporte para CORS (Cross-Origin Resource Sharing)
- **pynput** - Control de teclado
- **pyautogui** - Control de mouse y pantalla

## 🔧 Instalación Manual

Si los scripts automáticos no funcionan:

```bash
pip install Flask==2.3.3
pip install Flask-CORS==4.0.0
pip install pynput==1.7.6
pip install pyautogui==0.9.54
```

## 🌐 API Endpoints

### `/ping` - GET
Verificar conectividad del servidor
```json
Response: {"status": "pong"}
```

### `/screen` - GET
Obtener información de la pantalla
```json
Response: {
  "status": "success",
  "screen": {
    "width": 1920,
    "height": 1080,
    "monitors": [...]
  }
}
```

### `/type` - POST
Enviar texto para escribir
```json
Request: {"text": "Hola mundo"}
Response: {"status": "success", "message": "Typed: Hola mundo"}
```

### `/special` - POST
Enviar teclas especiales
```json
Request: {"key": "backspace"}  // o "enter"
Response: {"status": "success", "message": "Special key: Backspace"}
```

### `/mouse` - POST
Control de mouse

**Mover mouse:**
```json
Request: {"action": "move", "x": 100, "y": 200}
```

**Click de mouse:**
```json
Request: {"action": "click", "x": 100, "y": 200, "button": "left"}
```

**Arrastrar mouse:**
```json
Request: {"action": "drag", "x": 100, "y": 200, "to_x": 300, "to_y": 400}
```

**Scroll de mouse:**
```json
Request: {"action": "scroll", "x": 100, "y": 200, "amount": 3}
```

## 🔒 Permisos y Seguridad

### macOS
El servidor requiere permisos de accesibilidad:

1. Ve a **Preferencias del Sistema** > **Seguridad y Privacidad** > **Privacidad**
2. Selecciona **Accesibilidad** en la lista izquierda
3. Haz clic en el candado y ingresa tu contraseña
4. Agrega **Terminal** (o tu aplicación de terminal) a la lista
5. Reinicia el terminal y ejecuta el servidor nuevamente

### Windows
- Algunos antivirus pueden detectar las librerías como sospechosas
- Puede requerir ejecutar como administrador
- Windows Defender puede solicitar permisos adicionales

### Linux
- Generalmente no requiere permisos especiales
- En algunos entornos de escritorio puede requerir configuración adicional

## 🛠️ Solución de Problemas

### "ModuleNotFoundError"
```bash
# Instalar dependencias faltantes
pip install -r requirements.txt
```

### "Permission denied" en macOS
```bash
# Verificar permisos de accesibilidad
# Seguir instrucciones de la sección "Permisos y Seguridad"
```

### "FailSafeException" en pyautogui
```bash
# El mouse se movió a la esquina superior izquierda
# Esto es una característica de seguridad de pyautogui
# Evita mover el mouse a (0,0) muy rápido
```

### Puerto 5000 en uso
```bash
# Encontrar proceso usando el puerto
lsof -ti:5000

# Terminar proceso
kill -9 <PID>
```

## 📊 Características

- ✅ **Control de teclado** - Escritura en tiempo real
- ✅ **Control de mouse** - Movimiento, clicks, drag, scroll
- ✅ **Detección automática de pantalla** - Obtiene resolución automáticamente
- ✅ **API REST** - Fácil integración con clientes
- ✅ **CORS habilitado** - Funciona con clientes web
- ✅ **Seguridad integrada** - FailSafe de pyautogui
- ✅ **Multiplataforma** - Windows, macOS, Linux

## 🔧 Configuración Avanzada

### Cambiar Puerto
Edita `server.py` línea 161:
```python
app.run(host='0.0.0.0', port=5000, debug=False)
```

### Deshabilitar FailSafe
⚠️ **No recomendado** - Edita `server.py` línea 21:
```python
pyautogui.FAILSAFE = False  # PELIGROSO
```

### Ajustar Velocidad de Mouse
Edita `server.py` línea 22:
```python
pyautogui.PAUSE = 0.05  # Más rápido (default: 0.1)
```

## 📄 Logs y Debug

El servidor muestra información detallada en la consola:
- IP local del servidor
- Requests recibidos
- Errores y excepciones
- Estado de conexiones

## 🚀 Uso en Producción

Para uso en producción, considera:
- Usar un servidor web real (nginx, apache)
- Implementar autenticación
- Usar HTTPS
- Configurar firewall apropiadamente
- Monitorear logs de seguridad