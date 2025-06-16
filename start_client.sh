#!/bin/bash

# Script principal para iniciar el cliente MultiKeyboard
# Detecta el sistema operativo y ejecuta el script apropiado

echo "🖥️  MultiKeyboard - Launcher"
echo "=========================="

# Detectar sistema operativo
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    CYGWIN*)    MACHINE=Cygwin;;
    MINGW*)     MACHINE=MinGw;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo "🔍 Sistema detectado: $MACHINE"

# Verificar que estamos en el directorio correcto
if [ ! -d "client" ]; then
    echo "❌ Error: No se encontró la carpeta 'client'"
    echo "📁 Asegúrate de ejecutar este script desde la raíz del proyecto MultiKeyboard"
    exit 1
fi

# Cambiar a directorio client
cd client

# Ejecutar script apropiado según el sistema
case "${MACHINE}" in
    Mac|Linux)
        echo "🚀 Ejecutando script para macOS/Linux..."
        if [ ! -f "start_client_mac.sh" ]; then
            echo "❌ Error: No se encontró start_client_mac.sh"
            exit 1
        fi
        chmod +x start_client_mac.sh
        ./start_client_mac.sh
        ;;
    Cygwin|MinGw)
        echo "🚀 Ejecutando script para Windows..."
        if [ ! -f "start_client_windows.bat" ]; then
            echo "❌ Error: No se encontró start_client_windows.bat"
            exit 1
        fi
        cmd.exe /c start_client_windows.bat
        ;;
    *)
        echo "❌ Sistema operativo no soportado: $MACHINE"
        echo "💡 Ejecuta manualmente:"
        echo "   - macOS/Linux: cd client && ./start_client_mac.sh"
        echo "   - Windows: cd client && start_client_windows.bat"
        exit 1
        ;;
esac
