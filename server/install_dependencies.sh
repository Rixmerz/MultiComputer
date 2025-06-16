#!/bin/bash

# Script para instalar dependencias del servidor MultiKeyboard

echo "🖥️  MultiKeyboard - Instalación de Dependencias del Servidor"
echo "=========================================================="

# Función para verificar si Python está disponible
check_python() {
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
        PIP_CMD="pip3"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
        PIP_CMD="pip"
    else
        echo "❌ Error: Python no está instalado o no está en el PATH"
        echo "📥 Instala Python desde: https://www.python.org/downloads/"
        exit 1
    fi
    echo "🐍 Usando: $PYTHON_CMD"
}

# Función para instalar dependencias
install_dependencies() {
    echo "📦 Instalando dependencias..."
    
    if [ -f "requirements.txt" ]; then
        echo "📋 Instalando desde requirements.txt..."
        $PIP_CMD install -r requirements.txt
        
        if [ $? -eq 0 ]; then
            echo "✅ Dependencias instaladas correctamente"
        else
            echo "❌ Error instalando dependencias"
            echo "💡 Intenta ejecutar manualmente:"
            echo "   $PIP_CMD install -r requirements.txt"
            exit 1
        fi
    else
        echo "❌ Error: No se encontró requirements.txt"
        echo "📁 Asegúrate de ejecutar este script desde la carpeta 'server'"
        exit 1
    fi
}

# Función para verificar instalación
verify_installation() {
    echo ""
    echo "🔍 Verificando instalación..."
    
    # Verificar cada dependencia
    dependencies=("flask" "flask_cors" "pynput" "pyautogui")
    
    for dep in "${dependencies[@]}"; do
        $PYTHON_CMD -c "import $dep" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ $dep - OK"
        else
            echo "❌ $dep - ERROR"
            INSTALL_ERROR=true
        fi
    done
    
    if [ "$INSTALL_ERROR" = true ]; then
        echo ""
        echo "⚠️  Algunas dependencias no se instalaron correctamente"
        echo "💡 Intenta instalar manualmente las que fallaron"
        exit 1
    else
        echo ""
        echo "🎉 ¡Todas las dependencias están instaladas correctamente!"
    fi
}

# Función para mostrar información adicional
show_additional_info() {
    echo ""
    echo "📝 Información adicional:"
    echo "========================"
    echo ""
    echo "🔧 Dependencias instaladas:"
    echo "   • Flask - Servidor web"
    echo "   • Flask-CORS - Soporte para CORS"
    echo "   • pynput - Control de teclado"
    echo "   • pyautogui - Control de mouse y pantalla"
    echo ""
    echo "🚀 Para ejecutar el servidor:"
    echo "   $PYTHON_CMD server.py"
    echo ""
    echo "⚠️  Nota sobre pyautogui:"
    echo "   • En macOS puede requerir permisos de accesibilidad"
    echo "   • Ve a: Preferencias del Sistema > Seguridad y Privacidad > Privacidad > Accesibilidad"
    echo "   • Agrega Terminal o tu aplicación de terminal a la lista"
    echo ""
    echo "🔒 Nota sobre pynput:"
    echo "   • También puede requerir permisos de accesibilidad en macOS"
    echo "   • Sigue las mismas instrucciones que para pyautogui"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "server.py" ]; then
    echo "❌ Error: No se encontró server.py"
    echo "📁 Asegúrate de ejecutar este script desde la carpeta 'server'"
    exit 1
fi

# Ejecutar pasos
check_python
install_dependencies
verify_installation
show_additional_info

echo ""
echo "✅ Instalación completada exitosamente"
echo "🎯 Ya puedes ejecutar el servidor con: $PYTHON_CMD server.py"
