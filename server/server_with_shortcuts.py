#!/usr/bin/env python3
"""
Remote Typing Server - Computador Esclavo
VERSIÓN CON SHORTCUTS Y TECLAS ESPECIALES
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from pynput.keyboard import Controller, Key
from pynput.mouse import Controller as MouseController
import pyautogui
import socket
import threading
import time
import platform

app = Flask(__name__)
CORS(app)  # Permite conexiones desde cualquier origen
keyboard = Controller()
mouse = MouseController()

# Configurar pyautogui para mayor seguridad y velocidad
pyautogui.FAILSAFE = True  # Mover mouse a esquina superior izquierda para parar
pyautogui.PAUSE = 0.02  # Pausa muy reducida para drag realtime

# Modo debug - cambiar a False para producción
DEBUG_MODE = True

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
        button = data.get('button', 'left')

        # Validar coordenadas
        screen_info = get_screen_info()
        max_x = screen_info['width']
        max_y = screen_info['height']
        x = max(0, min(x, max_x - 1))
        y = max(0, min(y, max_y - 1))

        if action == 'move':
            pyautogui.moveTo(x, y, duration=0.1)
            message = f'Mouse moved to ({x}, {y})' if DEBUG_MODE else 'OK'

        elif action == 'click':
            button_map = {'left': 'left', 'right': 'right', 'middle': 'middle'}
            pyautogui.click(x, y, button=button_map.get(button, 'left'))
            message = f'Mouse {button} click at ({x}, {y})'
            if DEBUG_MODE:
                print(f"🖱️  {message}")

        elif action == 'drag_start':
            button_map = {'left': 'left', 'right': 'right', 'middle': 'middle'}
            pyautogui.moveTo(x, y, duration=0.05)
            pyautogui.mouseDown(button=button_map.get(button, 'left'))
            message = f'Drag start at ({x}, {y})'
            if DEBUG_MODE:
                print(f"🤏 REALTIME {message}")

        elif action == 'drag_move':
            pyautogui.moveTo(x, y, duration=0.01)
            message = f'Drag move to ({x}, {y})'

        elif action == 'drag_end':
            button_map = {'left': 'left', 'right': 'right', 'middle': 'middle'}
            pyautogui.moveTo(x, y, duration=0.05)
            pyautogui.mouseUp(button=button_map.get(button, 'left'))
            message = f'Drag end at ({x}, {y})'
            if DEBUG_MODE:
                print(f"🤏 REALTIME {message}")

        elif action == 'scroll':
            scroll_amount = data.get('amount', 1)
            original_pause = pyautogui.PAUSE
            pyautogui.PAUSE = 0.01
            pyautogui.scroll(scroll_amount, x=x, y=y)
            pyautogui.PAUSE = original_pause
            message = f'Mouse scroll {scroll_amount} at ({x}, {y})'
            if DEBUG_MODE:
                print(f"🖱️  {message}")

        else:
            return jsonify({'status': 'error', 'message': f'Acción no reconocida: {action}'}), 400

        connection_status['last_activity'] = time.time()

        # Respuestas optimizadas
        if action == 'move' and not DEBUG_MODE:
            return jsonify({'status': 'success'})
        elif action == 'scroll' and not DEBUG_MODE:
            return jsonify({'status': 'success'})
        elif action == 'drag_move':
            return '', 200
        else:
            return jsonify({'status': 'success', 'message': message, 'coordinates': {'x': x, 'y': y}})

    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Error de mouse: {str(e)}'}), 500

@app.route('/special', methods=['POST'])
def handle_special_key():
    """Endpoint para manejar teclas especiales"""
    try:
        data = request.get_json()
        key = data.get('key', '')
        
        key_map = {
            'backspace': Key.backspace,
            'enter': Key.enter,
            'tab': Key.tab,
            'escape': Key.esc,
            'delete': Key.delete,
            'space': Key.space
        }
        
        if key in key_map:
            keyboard.press(key_map[key])
            keyboard.release(key_map[key])
            action = key.capitalize()
        else:
            return jsonify({'status': 'error', 'message': 'Tecla especial no reconocida'}), 400
            
        connection_status['last_activity'] = time.time()

        if DEBUG_MODE:
            print(f"🔑 Special key: {action}")

        return jsonify({'status': 'success', 'message': f'Special key: {action}' if DEBUG_MODE else 'OK'})
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/shortcut', methods=['POST'])
def handle_shortcut():
    """Endpoint para manejar shortcuts/comandos rápidos"""
    try:
        data = request.get_json()
        shortcut = data.get('shortcut', '')
        
        # Detectar sistema operativo
        is_mac = platform.system() == 'Darwin'
        ctrl_key = Key.cmd if is_mac else Key.ctrl
        
        shortcuts = {
            'select_all': ('a', f'{"Cmd" if is_mac else "Ctrl"} + A (Select All)'),
            'copy': ('c', f'{"Cmd" if is_mac else "Ctrl"} + C (Copy)'),
            'paste': ('v', f'{"Cmd" if is_mac else "Ctrl"} + V (Paste)'),
            'cut': ('x', f'{"Cmd" if is_mac else "Ctrl"} + X (Cut)'),
            'undo': ('z', f'{"Cmd" if is_mac else "Ctrl"} + Z (Undo)'),
            'redo': ('y', f'{"Cmd" if is_mac else "Ctrl"} + Y (Redo)'),
            'save': ('s', f'{"Cmd" if is_mac else "Ctrl"} + S (Save)'),
            'find': ('f', f'{"Cmd" if is_mac else "Ctrl"} + F (Find)'),
            'new': ('n', f'{"Cmd" if is_mac else "Ctrl"} + N (New)'),
            'open': ('o', f'{"Cmd" if is_mac else "Ctrl"} + O (Open)'),
            'print': ('p', f'{"Cmd" if is_mac else "Ctrl"} + P (Print)'),
            'refresh': ('r', f'{"Cmd" if is_mac else "Ctrl"} + R (Refresh)')
        }
        
        if shortcut in shortcuts:
            key_char, action = shortcuts[shortcut]
            with keyboard.pressed(ctrl_key):
                keyboard.press(key_char)
                keyboard.release(key_char)
        else:
            return jsonify({'status': 'error', 'message': 'Shortcut no reconocido'}), 400
            
        connection_status['last_activity'] = time.time()

        if DEBUG_MODE:
            print(f"⚡ Shortcut: {action}")

        return jsonify({'status': 'success', 'message': f'Shortcut: {action}' if DEBUG_MODE else 'OK'})
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/type', methods=['POST'])
def handle_typing():
    """Endpoint para recibir texto y simularlo"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if text:
            keyboard.type(text)
            connection_status['last_activity'] = time.time()

            if DEBUG_MODE:
                message = f'Typed: {text[:50]}...' if len(text) > 50 else f'Typed: {text}'
                print(f"⌨️  {message}")

            return jsonify({'status': 'success', 'message': f'Typed: {text[:50]}...' if len(text) > 50 else f'Typed: {text}' if DEBUG_MODE else 'OK'})
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
    print("=" * 80)
    print("🖥️  Remote Typing Server - ESCLAVO (CON SHORTCUTS)")
    print("=" * 80)
    print(f"🌐 Servidor iniciado en: http://{local_ip}:5000")
    print(f"📡 IP Local: {local_ip}")
    print("🔗 Usa esta IP en el cliente para conectar")
    print("⌨️  Listo para recibir comandos de escritura...")
    print("🤏 DRAG REALTIME: Movimiento en tiempo real")
    print("⚡ SHORTCUTS HABILITADOS:")
    print("   • Ctrl/Cmd + A, C, V, X, Z, Y, S, F, N, O, P, R")
    print("   • Tab, Escape, Delete, Space")
    print("   • Detección automática Mac/Windows/Linux")
    if DEBUG_MODE:
        print("🐛 Modo DEBUG activado")
    print("=" * 80)
    print("Presiona Ctrl+C para detener el servidor")
    print()
    
    try:
        app.run(host='0.0.0.0', port=5000, debug=False)
    except KeyboardInterrupt:
        print("\n👋 Servidor detenido correctamente")
