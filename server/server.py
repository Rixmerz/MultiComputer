#!/usr/bin/env python3
"""
Remote Typing Server - Computador Esclavo
Recibe texto via HTTP y lo simula como escritura
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from pynput.keyboard import Controller, Key
from pynput.mouse import Controller as MouseController
import pyautogui
import socket
import threading
import time
import logging

# ============================================================================
# CONFIGURACIÓN DE DEBUG
# ============================================================================
# Cambiar DEBUG_MODE a True para ver todos los mensajes de actividad
# Cambiar DEBUG_MODE a False para modo silencioso (solo errores importantes)
DEBUG_MODE = False
# ============================================================================

app = Flask(__name__)
CORS(app)  # Permite conexiones desde cualquier origen

# Configurar logging de Flask
if not DEBUG_MODE:
    # Deshabilitar logs de Flask cuando debug está desactivado
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)

keyboard = Controller()
mouse = MouseController()

# Configurar pyautogui para mayor seguridad
pyautogui.FAILSAFE = True  # Mover mouse a esquina superior izquierda para parar
pyautogui.PAUSE = 0.1  # Pausa entre comandos

# Estado de conexión
connection_status = {
    'connected_clients': 0,
    'last_activity': None
}

def get_local_ip():
    """Obtiene la IP local del computador"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"

def get_screen_info():
    """Obtiene información de la pantalla"""
    try:
        screen_width, screen_height = pyautogui.size()
        return {
            'width': screen_width,
            'height': screen_height,
            'monitors': [
                {
                    'id': 1,
                    'name': 'Monitor Principal',
                    'x': 0,
                    'y': 0,
                    'width': screen_width,
                    'height': screen_height,
                    'primary': True
                }
            ]
        }
    except Exception as e:
        print(f"⚠️  Error obteniendo información de pantalla: {e}")
        return {
            'width': 1920,
            'height': 1080,
            'monitors': [
                {
                    'id': 1,
                    'name': 'Monitor Principal (Fallback)',
                    'x': 0,
                    'y': 0,
                    'width': 1920,
                    'height': 1080,
                    'primary': True
                }
            ]
        }

@app.route('/screen', methods=['GET'])
def get_screen():
    """Endpoint para obtener información de la pantalla"""
    try:
        screen_info = get_screen_info()
        return jsonify({
            'status': 'success',
            'screen': screen_info
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/mouse', methods=['POST'])
def handle_mouse():
    """Endpoint para manejar movimientos y clicks de mouse"""
    try:
        data = request.get_json()
        action = data.get('action', '')
        x = data.get('x', 0)
        y = data.get('y', 0)
        button = data.get('button', 'left')  # left, right, middle

        # Validar coordenadas
        screen_info = get_screen_info()
        max_x = screen_info['width']
        max_y = screen_info['height']

        # Asegurar que las coordenadas estén dentro de los límites
        x = max(0, min(x, max_x - 1))
        y = max(0, min(y, max_y - 1))

        if action == 'move':
            pyautogui.moveTo(x, y, duration=0.1)
            message = f'Mouse moved to ({x}, {y})' if DEBUG_MODE else 'OK'

        elif action == 'click':
            # Mapear botones
            button_map = {
                'left': 'left',
                'right': 'right',
                'middle': 'middle'
            }
            pyautogui.click(x, y, button=button_map.get(button, 'left'))
            message = f'Mouse {button} click at ({x}, {y})'
            if DEBUG_MODE:
                print(f"🖱️  {message}")

        elif action == 'drag':
            # Para drag necesitamos coordenadas de destino
            to_x = data.get('to_x', x)
            to_y = data.get('to_y', y)
            to_x = max(0, min(to_x, max_x - 1))
            to_y = max(0, min(to_y, max_y - 1))

            pyautogui.drag(to_x - x, to_y - y, duration=0.2, button=button_map.get(button, 'left'))
            message = f'Mouse drag from ({x}, {y}) to ({to_x}, {to_y})'
            if DEBUG_MODE:
                print(f"🖱️  {message}")

        elif action == 'scroll':
            scroll_amount = data.get('amount', 1)

            # Temporalmente reducir pausa para scroll más responsivo
            original_pause = pyautogui.PAUSE
            pyautogui.PAUSE = 0.01  # Pausa mínima para scroll

            pyautogui.scroll(scroll_amount, x=x, y=y)

            # Restaurar pausa original
            pyautogui.PAUSE = original_pause

            message = f'Mouse scroll {scroll_amount} at ({x}, {y})'
            if DEBUG_MODE:
                print(f"🖱️  {message}")

        else:
            return jsonify({'status': 'error', 'message': f'Acción no reconocida: {action}'}), 400

        connection_status['last_activity'] = time.time()

        # Respuestas optimizadas para baja latencia
        if action == 'move' and not DEBUG_MODE:
            return jsonify({'status': 'success'})
        elif action == 'scroll' and not DEBUG_MODE:
            # Respuesta mínima para scroll - máxima velocidad
            return jsonify({'status': 'success'})
        else:
            return jsonify({
                'status': 'success',
                'message': message,
                'coordinates': {'x': x, 'y': y}
            })

    except pyautogui.FailSafeException:
        return jsonify({'status': 'error', 'message': 'FailSafe activado - mouse movido a esquina'}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Error de mouse: {str(e)}'}), 500

@app.route('/special', methods=['POST'])
def handle_special_key():
    """Endpoint para manejar teclas especiales como backspace, enter, etc."""
    try:
        data = request.get_json()
        key = data.get('key', '')
        
        if key == 'backspace':
            keyboard.press(Key.backspace)
            keyboard.release(Key.backspace)
            action = 'Backspace'
        elif key == 'enter':
            keyboard.press(Key.enter)
            keyboard.release(Key.enter)
            action = 'Enter'
        else:
            return jsonify({'status': 'error', 'message': 'Tecla especial no reconocida'}), 400
            
        connection_status['last_activity'] = time.time()

        # Solo mostrar mensaje de debug si está habilitado
        if DEBUG_MODE:
            print(f"🔑 Special key: {action}")

        return jsonify({
            'status': 'success',
            'message': f'Special key: {action}' if DEBUG_MODE else 'OK'
        })
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/type', methods=['POST'])
def handle_typing():
    """Endpoint para recibir texto y simularlo"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if text:
            # Simula la escritura del texto
            keyboard.type(text)
            connection_status['last_activity'] = time.time()

            # Solo mostrar mensaje de debug si está habilitado
            if DEBUG_MODE:
                message = f'Typed: {text[:50]}...' if len(text) > 50 else f'Typed: {text}'
                print(f"⌨️  {message}")

            return jsonify({
                'status': 'success',
                'message': f'Typed: {text[:50]}...' if len(text) > 50 else f'Typed: {text}' if DEBUG_MODE else 'OK'
            })
        else:
            return jsonify({'status': 'error', 'message': 'No text provided'}), 400
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/status', methods=['GET'])
def get_status():
    """Endpoint para verificar estado del servidor"""
    return jsonify({
        'status': 'online',
        'server': 'Remote Typing Server',
        'last_activity': connection_status['last_activity'],
        'uptime': time.time()
    })

@app.route('/ping', methods=['GET'])
def ping():
    """Endpoint simple para verificar conectividad"""
    return jsonify({'status': 'pong'})

if __name__ == '__main__':
    local_ip = get_local_ip()
    print("=" * 50)
    print("🖥️  Remote Typing Server - ESCLAVO")
    print("=" * 50)
    print(f"🌐 Servidor iniciado en: http://{local_ip}:5000")
    print(f"📡 IP Local: {local_ip}")
    print("🔗 Usa esta IP en el cliente para conectar")
    print("⌨️  Listo para recibir comandos de escritura...")
    if DEBUG_MODE:
        print("🐛 Modo DEBUG activado - Se mostrarán todos los mensajes")
    else:
        print("🔇 Modo silencioso activado - Solo errores importantes")
    print("=" * 50)
    print("Presiona Ctrl+C para detener el servidor")
    print()

    try:
        app.run(host='0.0.0.0', port=5000, debug=False)
    except KeyboardInterrupt:
        print("\n👋 Servidor detenido correctamente")