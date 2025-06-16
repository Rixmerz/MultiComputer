@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM Script para iniciar el cliente MultiKeyboard en Windows
REM Limpia el puerto 8080 y lanza el servidor web local

echo 🖥️  MultiKeyboard - Cliente Web (Windows)
echo ======================================

REM Función para limpiar el puerto 8080
:cleanup_port
echo 🧹 Limpiando puerto 8080...

REM Buscar procesos usando el puerto 8080
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do (
    set "pid=%%a"
    if defined pid (
        echo 📍 Encontrado proceso en puerto 8080: !pid!
        echo 🔪 Terminando proceso...
        taskkill /PID !pid! /F >nul 2>&1
    )
)

REM Verificar nuevamente
netstat -aon | findstr :8080 >nul 2>&1
if !errorlevel! equ 0 (
    echo ⚡ Forzando limpieza adicional...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do (
        taskkill /PID %%a /F >nul 2>&1
    )
)

echo ✅ Puerto 8080 liberado
goto :eof

REM Función para verificar si Python está disponible
:check_python
set "PYTHON_CMD="
python --version >nul 2>&1
if !errorlevel! equ 0 (
    set "PYTHON_CMD=python"
    goto :python_found
)

python3 --version >nul 2>&1
if !errorlevel! equ 0 (
    set "PYTHON_CMD=python3"
    goto :python_found
)

py --version >nul 2>&1
if !errorlevel! equ 0 (
    set "PYTHON_CMD=py"
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

REM Función para abrir el navegador automáticamente
:open_browser
echo 🌐 Abriendo navegador en 3 segundos...
timeout /t 3 /nobreak >nul
start "" "http://localhost:8080" 2>nul || echo ⚠️  No se pudo abrir el navegador automáticamente
echo 📱 URL manual: http://localhost:8080
goto :eof

REM Verificar que estamos en el directorio correcto
if not exist "index.html" (
    echo ❌ Error: No se encontró index.html
    echo 📁 Asegúrate de ejecutar este script desde la carpeta 'client'
    pause
    exit /b 1
)

REM Ejecutar pasos principales
call :cleanup_port
call :check_python

echo.
echo 🚀 Iniciando servidor web local en puerto 8080...
echo 📂 Sirviendo archivos desde: %CD%
echo.
echo 💡 Instrucciones:
echo    1. El navegador se abrirá automáticamente
echo    2. Ingresa la IP del servidor remoto
echo    3. Haz clic en 'Conectar'
echo    4. ¡Comienza a escribir!
echo.
echo 🔴 Para detener: Presiona Ctrl+C
echo ======================================

REM Abrir navegador en segundo plano
start /b cmd /c "call :open_browser"

REM Iniciar servidor web (esto bloquea hasta Ctrl+C)
%PYTHON_CMD% -m http.server 8080

REM Limpieza al salir
echo.
echo 🛑 Deteniendo servidor...
call :cleanup_port
echo 👋 Cliente detenido correctamente
pause
