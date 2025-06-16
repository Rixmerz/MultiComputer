# 🖥️ MultiKeyboard - Cliente Web

Cliente web para controlar remotamente el teclado y mouse de otro computador.

## 🚀 Inicio Rápido

### macOS / Linux
```bash
./start_client_mac.sh
```

### Windows
```cmd
start_client_windows.bat
```

## 📋 Requisitos

- **Python 3.x** instalado en el sistema
- **Navegador web** moderno (Chrome, Firefox, Safari, Edge)
- **Conexión de red** al computador servidor

## 🔧 ¿Qué hacen los scripts?

Los scripts automatizan todo el proceso:

1. **🧹 Limpian el puerto 8080** - Terminan cualquier proceso que esté usando el puerto
2. **🐍 Verifican Python** - Se aseguran de que Python esté instalado
3. **🚀 Inician servidor web** - Lanzan un servidor HTTP local en puerto 8080
4. **🌐 Abren navegador** - Automáticamente abren http://localhost:8080
5. **📱 Muestran instrucciones** - Guían sobre cómo conectarse al servidor remoto

## 💻 Uso Manual (sin scripts)

Si prefieres hacerlo manualmente:

```bash
# 1. Ir a la carpeta client
cd client

# 2. Iniciar servidor web
python3 -m http.server 8080

# 3. Abrir navegador en: http://localhost:8080
```

## 🌐 Conectarse al Servidor

1. **Obtén la IP del servidor** - Del computador donde está ejecutándose el servidor
2. **Ingresa la IP** - En el campo del cliente web
3. **Haz clic en "Conectar"** 
4. **¡Comienza a escribir!** - Todo se enviará al computador remoto

## 📱 Usar desde Móvil

1. **Encuentra la IP de este computador** (donde ejecutas el cliente)
2. **Desde tu móvil** ve a: `http://[IP-DE-ESTE-COMPUTADOR]:8080`
3. **Conecta al servidor remoto** igual que desde el computador

## 🔴 Detener el Cliente

- **Presiona `Ctrl+C`** en la terminal donde se ejecuta
- Los scripts automáticamente limpiarán el puerto al salir

## 🛠️ Solución de Problemas

### "Puerto 8080 en uso"
- Los scripts automáticamente limpian el puerto
- Si persiste, reinicia y vuelve a intentar

### "Python no encontrado"
- **macOS**: Instala desde https://www.python.org/downloads/
- **Windows**: Instala desde https://www.python.org/downloads/ (marca "Add to PATH")

### "No se puede conectar al servidor"
- Verifica que el servidor esté ejecutándose
- Verifica que la IP sea correcta
- Asegúrate de estar en la misma red

### "Navegador no abre automáticamente"
- Ve manualmente a: http://localhost:8080

## 📁 Estructura de Archivos

```
client/
├── index.html              # Interfaz web principal
├── script.js               # Lógica del cliente
├── style.css               # Estilos de la interfaz
├── start_client_mac.sh     # Script para macOS/Linux
├── start_client_windows.bat # Script para Windows
└── README_CLIENTE.md       # Este archivo
```

## 🎯 Características

- ✅ **Escritura en tiempo real** - Cada caracter se envía inmediatamente
- ✅ **Control de mouse** - Movimiento, clicks izquierdo/derecho directo 1:1
- ✅ **Detección automática de pantalla** - Se adapta a la resolución del servidor
- ✅ **Interfaz simplificada** - Canvas único con mapeo directo
- ✅ **Teclas especiales** - Soporta Backspace y Enter
- ✅ **Debug log** - Muestra estado de conexiones
- ✅ **Responsive** - Funciona en computador y móvil
- ✅ **Auto-reconexión** - Detecta desconexiones automáticamente
