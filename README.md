# 🖥️ MultiKeyboard - Control Remoto de Escritura

Sistema cliente-servidor que permite controlar la escritura de un computador desde otro dispositivo a través de la red.

## 🚀 Inicio Rápido

### Para ejecutar el CLIENTE (este computador):

**macOS / Linux:**
```bash
./start_client.sh
```

**Windows:**
```cmd
start_client.bat
```

### Para ejecutar el SERVIDOR (computador remoto):
```bash
cd server
python3 server.py
```

## 📋 Requisitos

- **Python 3.x** en ambos computadores
- **Navegador web** moderno para el cliente
- **Misma red** (WiFi/LAN) para ambos dispositivos

## 🔧 Instalación de Dependencias

### Servidor (computador remoto):
```bash
cd server
pip install -r requirements.txt
```

### Cliente (este computador):
No requiere instalación - usa Python estándar

## 💻 Cómo Funciona

1. **🖥️ Servidor** - Se ejecuta en el computador que quieres controlar
2. **📱 Cliente** - Interfaz web que se ejecuta en tu dispositivo de control
3. **🌐 Conexión** - Cliente se conecta al servidor via HTTP
4. **⌨️ Escritura** - Todo lo que escribas se envía al computador remoto

## 📁 Estructura del Proyecto

```
MultiKeyboard/
├── client/                     # Cliente web
│   ├── index.html             # Interfaz principal
│   ├── script.js              # Lógica del cliente
│   ├── style.css              # Estilos
│   ├── start_client_mac.sh    # Script macOS/Linux
│   ├── start_client_windows.bat # Script Windows
│   └── README_CLIENTE.md      # Documentación cliente
├── server/                     # Servidor Python
│   ├── server.py              # Servidor principal
│   ├── requirements.txt       # Dependencias Python
│   └── README.md              # Documentación servidor
├── start_client.sh            # Launcher macOS/Linux
├── start_client.bat           # Launcher Windows
└── README.md                  # Este archivo
```

## 🎯 Características

- ✅ **Escritura en tiempo real** - Cada caracter se envía inmediatamente
- ✅ **Teclas especiales** - Soporta Backspace, Enter
- ✅ **Multiplataforma** - Windows, macOS, Linux
- ✅ **Interfaz web** - Funciona en cualquier navegador
- ✅ **Móvil compatible** - Usa desde tu teléfono
- ✅ **Auto-limpieza** - Scripts limpian puertos automáticamente
- ✅ **Debug integrado** - Logs de conexión y estado

## 🛠️ Uso Detallado

### 1. Preparar el Servidor (computador a controlar)
```bash
cd server
pip install -r requirements.txt
python3 server.py
```
El servidor mostrará su IP, por ejemplo: `192.168.1.100`

### 2. Iniciar el Cliente (tu dispositivo)
```bash
./start_client.sh    # macOS/Linux
# o
start_client.bat     # Windows
```

### 3. Conectar
1. Se abrirá automáticamente el navegador
2. Ingresa la IP del servidor (ej: `192.168.1.100`)
3. Haz clic en "Conectar"
4. ¡Comienza a escribir!

## 📱 Usar desde Móvil

1. Ejecuta el cliente en tu computador
2. Encuentra la IP de tu computador
3. Desde tu móvil ve a: `http://[IP-TU-COMPUTADOR]:8080`
4. Conecta al servidor remoto normalmente

## 🔴 Detener

- **Cliente**: Presiona `Ctrl+C` en la terminal
- **Servidor**: Presiona `Ctrl+C` en la terminal del servidor

## 🛠️ Solución de Problemas

### "No se puede conectar"
- Verifica que ambos dispositivos estén en la misma red
- Verifica que el servidor esté ejecutándose
- Verifica que la IP sea correcta

### "Puerto en uso"
- Los scripts automáticamente limpian puertos
- Si persiste, reinicia y vuelve a intentar

### "Python no encontrado"
- Instala Python desde: https://www.python.org/downloads/
- En Windows, marca "Add Python to PATH"

## 📄 Licencia

Proyecto de código abierto para uso educativo y personal.