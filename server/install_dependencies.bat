@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM Script para instalar dependencias del servidor MultiKeyboard en Windows

echo 🖥️  MultiKeyboard - Instalación de Dependencias del Servidor
echo ==========================================================

REM Función para verificar si Python está disponible
:check_python
set "PYTHON_CMD="
set "PIP_CMD="

python --version >nul 2>&1
if !errorlevel! equ 0 (
    set "PYTHON_CMD=python"
    set "PIP_CMD=pip"
    goto :python_found
)

python3 --version >nul 2>&1
if !errorlevel! equ 0 (
    set "PYTHON_CMD=python3"
    set "PIP_CMD=pip3"
    goto :python_found
)

py --version >nul 2>&1
if !errorlevel! equ 0 (
    set "PYTHON_CMD=py"
    set "PIP_CMD=py -m pip"
    goto :python_found
)

echo ❌ Error: Python no está instalado o no está en el PATH
echo 📥 Instala Python desde: https://www.python.org/downloads/
echo 💡 Asegúrate de marcar "Add Python to PATH" durante la instalación
pause
exit /b 1

:python_found
echo 🐍 Usando: !PYTHON_CMD!
goto :eof

REM Función para instalar dependencias
:install_dependencies
echo 📦 Instalando dependencias...

if exist "requirements.txt" (
    echo 📋 Instalando desde requirements.txt...
    !PIP_CMD! install -r requirements.txt
    
    if !errorlevel! equ 0 (
        echo ✅ Dependencias instaladas correctamente
    ) else (
        echo ❌ Error instalando dependencias
        echo 💡 Intenta ejecutar manualmente:
        echo    !PIP_CMD! install -r requirements.txt
        pause
        exit /b 1
    )
) else (
    echo ❌ Error: No se encontró requirements.txt
    echo 📁 Asegúrate de ejecutar este script desde la carpeta 'server'
    pause
    exit /b 1
)
goto :eof

REM Función para verificar instalación
:verify_installation
echo.
echo 🔍 Verificando instalación...

set "INSTALL_ERROR="

REM Verificar Flask
!PYTHON_CMD! -c "import flask" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ flask - OK
) else (
    echo ❌ flask - ERROR
    set "INSTALL_ERROR=true"
)

REM Verificar Flask-CORS
!PYTHON_CMD! -c "import flask_cors" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ flask_cors - OK
) else (
    echo ❌ flask_cors - ERROR
    set "INSTALL_ERROR=true"
)

REM Verificar pynput
!PYTHON_CMD! -c "import pynput" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ pynput - OK
) else (
    echo ❌ pynput - ERROR
    set "INSTALL_ERROR=true"
)

REM Verificar pyautogui
!PYTHON_CMD! -c "import pyautogui" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ pyautogui - OK
) else (
    echo ❌ pyautogui - ERROR
    set "INSTALL_ERROR=true"
)

if defined INSTALL_ERROR (
    echo.
    echo ⚠️  Algunas dependencias no se instalaron correctamente
    echo 💡 Intenta instalar manualmente las que fallaron
    pause
    exit /b 1
) else (
    echo.
    echo 🎉 ¡Todas las dependencias están instaladas correctamente!
)
goto :eof

REM Función para mostrar información adicional
:show_additional_info
echo.
echo 📝 Información adicional:
echo ========================
echo.
echo 🔧 Dependencias instaladas:
echo    • Flask - Servidor web
echo    • Flask-CORS - Soporte para CORS
echo    • pynput - Control de teclado
echo    • pyautogui - Control de mouse y pantalla
echo.
echo 🚀 Para ejecutar el servidor:
echo    !PYTHON_CMD! server.py
echo.
echo ⚠️  Nota sobre pyautogui:
echo    • Puede requerir permisos especiales en algunos sistemas
echo    • Si hay problemas, ejecuta como administrador
echo.
echo 🔒 Nota sobre pynput:
echo    • También puede requerir permisos especiales
echo    • En algunos antivirus puede ser detectado como sospechoso
goto :eof

REM Verificar que estamos en el directorio correcto
if not exist "server.py" (
    echo ❌ Error: No se encontró server.py
    echo 📁 Asegúrate de ejecutar este script desde la carpeta 'server'
    pause
    exit /b 1
)

REM Ejecutar pasos principales
call :check_python
call :install_dependencies
call :verify_installation
call :show_additional_info

echo.
echo ✅ Instalación completada exitosamente
echo 🎯 Ya puedes ejecutar el servidor con: !PYTHON_CMD! server.py
pause
