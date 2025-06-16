@echo off
chcp 65001 >nul

REM Script principal para iniciar el cliente MultiKeyboard en Windows
REM Ejecuta el script apropiado desde la raíz del proyecto

echo 🖥️  MultiKeyboard - Launcher (Windows)
echo ====================================

REM Verificar que estamos en el directorio correcto
if not exist "client" (
    echo ❌ Error: No se encontró la carpeta 'client'
    echo 📁 Asegúrate de ejecutar este script desde la raíz del proyecto MultiKeyboard
    pause
    exit /b 1
)

REM Verificar que existe el script del cliente
if not exist "client\start_client_windows.bat" (
    echo ❌ Error: No se encontró client\start_client_windows.bat
    pause
    exit /b 1
)

echo 🚀 Ejecutando cliente para Windows...
echo.

REM Cambiar a directorio client y ejecutar script
cd client
call start_client_windows.bat

REM Volver al directorio original
cd ..
