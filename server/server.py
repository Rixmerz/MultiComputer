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

        elif action == 'drag_start':
            # Iniciar drag realtime - presionar botón y mantener
            button_map = {
                'left': 'left',
                'right': 'right',
                'middle': 'middle'
            }

            # Mover a posición inicial y presionar botón
            pyautogui.moveTo(x, y, duration=0.05)
            pyautogui.mouseDown(button=button_map.get(button, 'left'))

            message = f'Drag start at ({x}, {y})'
            if DEBUG_MODE:
                print(f"🤏 {message}")

        elif action == 'drag_move':
            # Mover durante drag realtime - solo mover el mouse (botón ya presionado)
            pyautogui.moveTo(x, y, duration=0.02)  # Movimiento muy rápido para realtime

            # No hacer log para evitar spam
            message = f'Drag move to ({x}, {y})'

        elif action == 'drag_end':
            # Finalizar drag realtime - mover a posición final y soltar botón
            button_map = {
                'left': 'left',
                'right': 'right',
                'middle': 'middle'
            }

            pyautogui.moveTo(x, y, duration=0.05)
            pyautogui.mouseUp(button=button_map.get(button, 'left'))

            message = f'Drag end at ({x}, {y})'
            if DEBUG_MODE:
                print(f"🤏 {message}")

        elif action == 'drag':
            # Para drag necesitamos coordenadas de destino
            to_x = data.get('to_x', x)
            to_y = data.get('to_y', y)
            to_x = max(0, min(to_x, max_x - 1))
            to_y = max(0, min(to_y, max_y - 1))

            # Mapear botones para drag
            button_map = {
                'left': 'left',
                'right': 'right',
                'middle': 'middle'
            }

            # Implementar drag correctamente:
            # 1. Mover a la posición inicial
            # 2. Presionar el botón
            # 3. Arrastrar a la posición final
            # 4. Soltar el botón

            try:
                # Mover a posición inicial
                pyautogui.moveTo(x, y, duration=0.1)

                # Hacer el drag desde la posición actual hasta la final
                pyautogui.dragTo(to_x, to_y, duration=0.3, button=button_map.get(button, 'left'))

                message = f'Mouse drag from ({x}, {y}) to ({to_x}, {to_y})'
                if DEBUG_MODE:
                    print(f"🖱️  {message}")

            except Exception as drag_error:
                # Si dragTo falla, intentar método alternativo
                if DEBUG_MODE:
                    print(f"⚠️  dragTo falló, usando método alternativo: {drag_error}")

                # Método alternativo: mouseDown, moveTo, mouseUp
                pyautogui.moveTo(x, y, duration=0.1)
                pyautogui.mouseDown(button=button_map.get(button, 'left'))
                pyautogui.moveTo(to_x, to_y, duration=0.3)
                pyautogui.mouseUp(button=button_map.get(button, 'left'))

                message = f'Mouse drag (alternative) from ({x}, {y}) to ({to_x}, {to_y})'
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
        elif action == 'drag_move':
            # Respuesta ultra-rápida para drag realtime - sin JSON para máxima velocidad
            return '', 200
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
        elif key == 'tab':
            keyboard.press(Key.tab)
            keyboard.release(Key.tab)
            action = 'Tab'
        elif key == 'escape':
            keyboard.press(Key.esc)
            keyboard.release(Key.esc)
            action = 'Escape'
        elif key == 'delete':
            keyboard.press(Key.delete)
            keyboard.release(Key.delete)
            action = 'Delete'
        elif key == 'space':
            keyboard.press(Key.space)
            keyboard.release(Key.space)
            action = 'Space'
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

@app.route('/shortcut', methods=['POST'])
def handle_shortcut():
    """Endpoint para manejar shortcuts/comandos rápidos como Ctrl+C, Cmd+V, etc."""
    try:
        data = request.get_json()
        shortcut = data.get('shortcut', '')

        # Detectar sistema operativo para usar Cmd en Mac o Ctrl en Windows/Linux
        import platform
        is_mac = platform.system() == 'Darwin'
        ctrl_key = Key.cmd if is_mac else Key.ctrl

        if shortcut == 'select_all':  # Ctrl/Cmd + A
            with keyboard.pressed(ctrl_key):
                keyboard.press('a')
                keyboard.release('a')
            action = f'{"Cmd" if is_mac else "Ctrl"} + A (Select All)'

        elif shortcut == 'copy':  # Ctrl/Cmd + C
            with keyboard.pressed(ctrl_key):
                keyboard.press('c')
                keyboard.release('c')
            action = f'{"Cmd" if is_mac else "Ctrl"} + C (Copy)'

        elif shortcut == 'paste':  # Ctrl/Cmd + V
            with keyboard.pressed(ctrl_key):
                keyboard.press('v')
                keyboard.release('v')
            action = f'{"Cmd" if is_mac else "Ctrl"} + V (Paste)'

        elif shortcut == 'undo':  # Ctrl/Cmd + Z
            with keyboard.pressed(ctrl_key):
                keyboard.press('z')
                keyboard.release('z')
            action = f'{"Cmd" if is_mac else "Ctrl"} + Z (Undo)'

        elif shortcut == 'redo':  # Ctrl/Cmd + Y
            with keyboard.pressed(ctrl_key):
                keyboard.press('y')
                keyboard.release('y')
            action = f'{"Cmd" if is_mac else "Ctrl"} + Y (Redo)'

        elif shortcut == 'cut':  # Ctrl/Cmd + X
            with keyboard.pressed(ctrl_key):
                keyboard.press('x')
                keyboard.release('x')
            action = f'{"Cmd" if is_mac else "Ctrl"} + X (Cut)'

        elif shortcut == 'save':  # Ctrl/Cmd + S
            with keyboard.pressed(ctrl_key):
                keyboard.press('s')
                keyboard.release('s')
            action = f'{"Cmd" if is_mac else "Ctrl"} + S (Save)'

        elif shortcut == 'find':  # Ctrl/Cmd + F
            with keyboard.pressed(ctrl_key):
                keyboard.press('f')
                keyboard.release('f')
            action = f'{"Cmd" if is_mac else "Ctrl"} + F (Find)'

        elif shortcut == 'new':  # Ctrl/Cmd + N
            with keyboard.pressed(ctrl_key):
                keyboard.press('n')
                keyboard.release('n')
            action = f'{"Cmd" if is_mac else "Ctrl"} + N (New)'

        elif shortcut == 'open':  # Ctrl/Cmd + O
            with keyboard.pressed(ctrl_key):
                keyboard.press('o')
                keyboard.release('o')
            action = f'{"Cmd" if is_mac else "Ctrl"} + O (Open)'

        elif shortcut == 'print':  # Ctrl/Cmd + P
            with keyboard.pressed(ctrl_key):
                keyboard.press('p')
                keyboard.release('p')
            action = f'{"Cmd" if is_mac else "Ctrl"} + P (Print)'

        elif shortcut == 'refresh':  # Ctrl/Cmd + R
            with keyboard.pressed(ctrl_key):
                keyboard.press('r')
                keyboard.release('r')
            action = f'{"Cmd" if is_mac else "Ctrl"} + R (Refresh)'

        else:
            return jsonify({'status': 'error', 'message': 'Shortcut no reconocido'}), 400

        connection_status['last_activity'] = time.time()

        # Solo mostrar mensaje de debug si está habilitado
        if DEBUG_MODE:
            print(f"⚡ Shortcut: {action}")

        return jsonify({
            'status': 'success',
            'message': f'Shortcut: {action}' if DEBUG_MODE else 'OK'
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