#!/bin/bash

# Script para iniciar el cliente MultiKeyboard en macOS
# Limpia el puerto 8080 y lanza el servidor web local

echo "🖥️  MultiKeyboard - Cliente Web (macOS)"
echo "======================================"

# Función para limpiar el puerto 8080
cleanup_port() {
    echo "🧹 Limpiando puerto 8080..."
    
    # Buscar procesos usando el puerto 8080
    PIDS=$(lsof -ti:8080 2>/dev/null)
    
    if [ ! -z "$PIDS" ]; then
        echo "📍 Encontrados procesos en puerto 8080: $PIDS"
        echo "🔪 Terminando procesos..."
        
        # Intentar terminar procesos amablemente
        kill $PIDS 2>/dev/null
        sleep 2
        
        # Verificar si aún hay procesos y forzar terminación si es necesario
        REMAINING_PIDS=$(lsof -ti:8080 2>/dev/null)
        if [ ! -z "$REMAINING_PIDS" ]; then
            echo "⚡ Forzando terminación de procesos restantes..."
            kill -9 $REMAINING_PIDS 2>/dev/null
        fi
        
        echo "✅ Puerto 8080 liberado"
    else
        echo "✅ Puerto 8080 ya está libre"
    fi
}

# Función para verificar si Python está disponible
check_python() {
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
    else
        echo "❌ Error: Python no está instalado o no está en el PATH"
        echo "📥 Instala Python desde: https://www.python.org/downloads/"
        exit 1
    fi
    echo "🐍 Usando: $PYTHON_CMD"
}

# Función para abrir el navegador automáticamente
open_browser() {
    echo "🌐 Abriendo navegador en 3 segundos..."
    sleep 3
    open "http://localhost:8080" 2>/dev/null || echo "⚠️  No se pudo abrir el navegador automáticamente"
    echo "📱 URL manual: http://localhost:8080"
}

# Función de limpieza al salir
cleanup_on_exit() {
    echo ""
    echo "🛑 Deteniendo servidor..."
    cleanup_port
    echo "👋 Cliente detenido correctamente"
    exit 0
}

# Configurar trap para limpieza al salir
trap cleanup_on_exit SIGINT SIGTERM

# Verificar que estamos en el directorio correcto
if [ ! -f "index.html" ]; then
    echo "❌ Error: No se encontró index.html"
    echo "📁 Asegúrate de ejecutar este script desde la carpeta 'client'"
    exit 1
fi

# Ejecutar pasos
cleanup_port
check_python

echo ""
echo "🚀 Iniciando servidor web local en puerto 8080..."
echo "📂 Sirviendo archivos desde: $(pwd)"
echo ""
echo "💡 Instrucciones:"
echo "   1. El navegador se abrirá automáticamente"
echo "   2. Ingresa la IP del servidor remoto"
echo "   3. Haz clic en 'Conectar'"
echo "   4. ¡Comienza a escribir!"
echo ""
echo "🔴 Para detener: Presiona Ctrl+C"
echo "======================================"

# Abrir navegador en segundo plano
open_browser &

# Iniciar servidor web (esto bloquea hasta Ctrl+C)
$PYTHON_CMD -m http.server 8080
