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

- ✅ **Control completo de mouse** - Movimiento, clicks, y tracking preciso
- ✅ **Escritura en tiempo real** - Cada caracter se envía inmediatamente
- ✅ **Control completo de mouse** - Movimiento, clicks (izq/der/medio), scroll
- ✅ **Scroll inteligente** - Scroll en canvas sin afectar la página web
- ✅ **Teclas especiales** - Soporta Backspace, Enter
- ✅ **Multiplataforma** - Windows, macOS, Linux
- ✅ **Interfaz web moderna** - Funciona en cualquier navegador
- ✅ **Móvil compatible** - Usa desde tu teléfono
- ✅ **Auto-limpieza** - Scripts limpian puertos automáticamente
- ✅ **Debug integrado** - Logs de conexión y estado
- ✅ **Modo oscuro** - Interfaz adaptable
- ✅ **Control granular** - Toggle para activar/desactivar funciones

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

## ⚠️ ADVERTENCIAS DE SEGURIDAD

### 🔒 **USO EN REDES PRIVADAS ÚNICAMENTE**
- **NUNCA uses este software en redes públicas** (WiFi de cafeterías, aeropuertos, hoteles, etc.)
- **Solo para redes domésticas o corporativas confiables**
- El tráfico NO está encriptado - cualquiera en la red puede interceptar las comunicaciones

### 🛡️ **Consideraciones de Seguridad**
- **Sin autenticación**: Cualquier dispositivo en la red puede conectarse al servidor
- **Sin encriptación**: Todas las teclas y movimientos del mouse se envían en texto plano
- **Acceso completo**: El servidor permite control total del teclado y mouse
- **Firewall**: Asegúrate de que tu firewall esté configurado apropiadamente

### 🏠 **Casos de Uso Recomendados**
- ✅ Control remoto dentro de tu hogar
- ✅ Redes corporativas privadas y seguras
- ✅ Laboratorios y entornos de desarrollo controlados
- ✅ Presentaciones en redes locales confiables

### � **NO Usar En**
- ❌ WiFi público (cafeterías, aeropuertos, hoteles)
- ❌ Redes compartidas con desconocidos
- ❌ Entornos donde la privacidad es crítica
- ❌ Sistemas con información sensible sin medidas adicionales de seguridad

### 🔧 **Recomendaciones Adicionales**
- Usa solo cuando sea necesario y desconecta cuando termines
- Considera usar una VPN si necesitas mayor seguridad
- Monitorea las conexiones activas en tu red
- Mantén el software actualizado

## �📄 Licencia

**Licencia de Uso Público**

Este software se proporciona "tal como está" para uso público y educativo.

### ✅ **Permisos**
- ✅ Uso personal y comercial
- ✅ Modificación del código
- ✅ Distribución
- ✅ Uso privado

### ❌ **Limitaciones**
- ❌ Sin garantía de ningún tipo
- ❌ Los autores no son responsables por daños o mal uso
- ❌ Sin soporte técnico garantizado

### 📋 **Condiciones**
- Mantén este aviso de licencia en las copias
- Usa bajo tu propia responsabilidad
- Respeta las leyes locales sobre software de control remoto

### ⚖️ **Descargo de Responsabilidad**
El uso de este software es bajo tu propia responsabilidad. Los desarrolladores no se hacen responsables por:
- Uso indebido del software
- Violaciones de seguridad
- Daños a sistemas o datos
- Uso en entornos no seguros
- Violaciones de privacidad

**Desarrollado por:** Rixmerz 😵‍💫
**Contribuciones:** Bienvenidas a través de pull requests