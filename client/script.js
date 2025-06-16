class RemoteTypingClient {
    constructor() {
        this.serverURL = '';
        this.isConnected = false;
        this.connectBtn = document.getElementById('connectBtn');
        this.serverIP = document.getElementById('serverIP');
        this.textInput = document.getElementById('textInput');
        this.statusText = document.getElementById('statusText');
        this.statusDot = document.querySelector('.status-dot');
        this.debugLog = document.getElementById('debugLog');
        
        // Screen elements
        this.canvas = document.getElementById('screenCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.screen1Width = document.getElementById('screen1Width');
        this.screen1Height = document.getElementById('screen1Height');
        this.screen2Width = document.getElementById('screen2Width');
        this.screen2Height = document.getElementById('screen2Height');
        this.updateScreensBtn = document.getElementById('updateScreens');
        this.mousePosition = document.getElementById('mousePosition');
        this.activeScreen = document.getElementById('activeScreen');
        
        // Screen configuration
        this.screens = {
            screen1: { x: 0, y: 0, width: 1920, height: 1080 },
            screen2: { x: 0, y: 1080, width: 1920, height: 1080 }
        };
        this.canvasScale = 0.2; // Scale factor for display
        this.currentScreen = 1;
        this.mouseThrottle = false; // Para throttling de mouse
        this.serverScreenInfo = null; // Info de pantalla del servidor
        
        this.initEventListeners();
        this.updateCanvasSize();
        this.drawScreens();
        this.log('Cliente iniciado', 'info');
    }

    initEventListeners() {
        // Existing connection events
        this.connectBtn.addEventListener('click', () => {
            if (this.isConnected) {
                this.disconnect();
            } else {
                this.connect();
            }
        });

        this.serverIP.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isConnected) {
                this.connect();
            }
        });

        // Screen configuration
        this.updateScreensBtn.addEventListener('click', () => {
            this.updateScreenConfig();
        });

        // Canvas mouse events
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleCanvasMouseMove(e);
        });

        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Prevenir menú contextual
            this.handleCanvasClick(e);
        });

        // Keyboard events
        this.textInput.addEventListener('input', (e) => {
            if (!this.isConnected) return;
            
            const char = e.data;
            if (char && char !== '\n') {
                this.sendCharacter(char);
            }
        });

        this.textInput.addEventListener('keydown', (e) => {
            if (!this.isConnected) return;
            
            if (e.key === 'Backspace') {
                this.sendSpecialKey('backspace');
                e.preventDefault();
            } else if (e.key === 'Enter') {
                this.sendSpecialKey('enter');
                e.preventDefault();
            }
        });

        this.textInput.addEventListener('focus', () => {
            if (this.isConnected) {
                this.log('Textarea enfocado - listo para escribir', 'info');
            }
        });
    }

    updateScreenConfig() {
        this.screens.screen1.width = parseInt(this.screen1Width.value);
        this.screens.screen1.height = parseInt(this.screen1Height.value);
        this.screens.screen2.width = parseInt(this.screen2Width.value);
        this.screens.screen2.height = parseInt(this.screen2Height.value);
        
        // Position screen2 below screen1
        this.screens.screen2.y = this.screens.screen1.height;
        
        this.updateCanvasSize();
        this.drawScreens();
        this.log('Configuración de pantallas actualizada', 'info');
    }

    updateCanvasSize() {
        const totalWidth = Math.max(this.screens.screen1.width, this.screens.screen2.width);
        const totalHeight = this.screens.screen1.height + this.screens.screen2.height;
        
        this.canvas.width = totalWidth * this.canvasScale;
        this.canvas.height = totalHeight * this.canvasScale;
    }

    drawScreens() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Screen 1 (top)
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(
            this.screens.screen1.x * this.canvasScale,
            this.screens.screen1.y * this.canvasScale,
            this.screens.screen1.width * this.canvasScale,
            this.screens.screen1.height * this.canvasScale
        );
        
        // Screen 2 (bottom)
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fillRect(
            this.screens.screen2.x * this.canvasScale,
            this.screens.screen2.y * this.canvasScale,
            this.screens.screen2.width * this.canvasScale,
            this.screens.screen2.height * this.canvasScale
        );
        
        // Labels
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        
        this.ctx.fillText(
            'Pantalla 1',
            (this.screens.screen1.width / 2) * this.canvasScale,
            (this.screens.screen1.height / 2) * this.canvasScale
        );
        
        this.ctx.fillText(
            'Pantalla 2',
            (this.screens.screen2.width / 2) * this.canvasScale,
            (this.screens.screen1.height + this.screens.screen2.height / 2) * this.canvasScale
        );
        
        // Borders
        this.ctx.strokeStyle = '#34495e';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            this.screens.screen1.x * this.canvasScale,
            this.screens.screen1.y * this.canvasScale,
            this.screens.screen1.width * this.canvasScale,
            this.screens.screen1.height * this.canvasScale
        );
        this.ctx.strokeRect(
            this.screens.screen2.x * this.canvasScale,
            this.screens.screen2.y * this.canvasScale,
            this.screens.screen2.width * this.canvasScale,
            this.screens.screen2.height * this.canvasScale
        );
    }

    handleCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;

        // Convert to virtual coordinates
        const virtualX = canvasX / this.canvasScale;
        const virtualY = canvasY / this.canvasScale;

        // Para el servidor actualizado, usamos coordenadas absolutas
        let absoluteX = virtualX;
        let absoluteY = virtualY;
        let screen = 1;

        // Determinar pantalla para mostrar en UI
        if (virtualY >= this.screens.screen1.height) {
            screen = 2;
        }

        this.currentScreen = screen;
        this.mousePosition.textContent = `Mouse: (${Math.round(absoluteX)}, ${Math.round(absoluteY)})`;
        this.activeScreen.textContent = `Pantalla: ${screen}`;

        // Send mouse coordinates if connected (throttle to avoid spam)
        if (this.isConnected && !this.mouseThrottle) {
            this.mouseThrottle = true;
            setTimeout(() => {
                this.sendMouseMove(Math.round(absoluteX), Math.round(absoluteY));
                this.mouseThrottle = false;
            }, 50); // Throttle to 20fps
        }

        // Redraw with cursor
        this.drawScreens();
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(canvasX, canvasY, 3, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    handleCanvasClick(e) {
        if (!this.isConnected) return;

        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;

        const virtualX = canvasX / this.canvasScale;
        const virtualY = canvasY / this.canvasScale;

        // Para el servidor actualizado, usamos coordenadas absolutas
        let absoluteX = virtualX;
        let absoluteY = virtualY;

        // Determinar qué botón del mouse se presionó
        let button = 'left';
        if (e.button === 2) button = 'right';
        else if (e.button === 1) button = 'middle';

        this.sendMouseClick(Math.round(absoluteX), Math.round(absoluteY), button);
    }

    async connect() {
        const ip = this.serverIP.value.trim();
        if (!ip) {
            this.log('ERROR: Ingresa una IP válida', 'error');
            return;
        }

        this.serverURL = `http://${ip}:5000`;
        this.connectBtn.disabled = true;
        this.connectBtn.textContent = 'Conectando...';
        this.log(`Intentando conectar a ${this.serverURL}`, 'info');

        try {
            const response = await fetch(`${this.serverURL}/ping`, {
                method: 'GET',
                timeout: 5000
            });

            if (response.ok) {
                this.isConnected = true;
                this.updateConnectionStatus(true);
                this.log('✅ Conectado exitosamente', 'success');

                // Obtener información de pantalla del servidor
                await this.getServerScreenInfo();

                // Enfocar textarea automáticamente
                setTimeout(() => {
                    this.textInput.focus();
                }, 100);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            this.log(`❌ Error de conexión: ${error.message}`, 'error');
            this.updateConnectionStatus(false);
        }

        this.connectBtn.disabled = false;
    }

    async getServerScreenInfo() {
        try {
            const response = await fetch(`${this.serverURL}/screen`, {
                method: 'GET'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success') {
                    this.serverScreenInfo = data.screen;
                    this.log(`📺 Pantalla servidor: ${data.screen.width}x${data.screen.height}`, 'info');

                    // Actualizar configuración local con datos del servidor
                    this.screen1Width.value = data.screen.width;
                    this.screen1Height.value = data.screen.height;
                    this.updateScreenConfig();
                }
            }
        } catch (error) {
            this.log(`⚠️ No se pudo obtener info de pantalla: ${error.message}`, 'warning');
        }
    }

    disconnect() {
        this.isConnected = false;
        this.updateConnectionStatus(false);
        this.log('🔌 Desconectado', 'info');
    }

    updateConnectionStatus(connected) {
        if (connected) {
            this.statusDot.className = 'status-dot online';
            this.statusText.textContent = `Conectado a ${this.serverIP.value}`;
            this.connectBtn.textContent = 'Desconectar';
            this.textInput.disabled = false;
            this.serverIP.disabled = true;
            this.canvas.classList.add('connected');
        } else {
            this.statusDot.className = 'status-dot offline';
            this.statusText.textContent = 'Desconectado';
            this.connectBtn.textContent = 'Conectar';
            this.textInput.disabled = true;
            this.serverIP.disabled = false;
            this.textInput.value = ''; // Limpiar textarea al desconectar
            this.canvas.classList.remove('connected');
        }
    }

    async sendCharacter(char) {
        try {
            const response = await fetch(`${this.serverURL}/type`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: char })
            });

            if (response.ok) {
                this.log(`📤 "${char}"`, 'success');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                this.disconnect();
            }
        }
    }

    async sendSpecialKey(key) {
        // Validar tecla
        if (!['backspace', 'enter'].includes(key)) {
            return;
        }

        try {
            const response = await fetch(`${this.serverURL}/special`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ key: key })
            });

            if (response.ok) {
                this.log(`🔑 ${key}`, 'success');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            this.log(`❌ Error tecla especial: ${error.message}`, 'error');
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                this.disconnect();
            }
        }
    }

    async sendMouseMove(x, y) {
        try {
            const response = await fetch(`${this.serverURL}/mouse`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'move',
                    x: x,
                    y: y
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                this.disconnect();
            }
        }
    }

    async sendMouseClick(x, y, button = 'left') {
        try {
            const response = await fetch(`${this.serverURL}/mouse`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'click',
                    x: x,
                    y: y,
                    button: button
                })
            });

            if (response.ok) {
                this.log(`🖱️ ${button} click (${x}, ${y})`, 'success');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            this.log(`❌ Error mouse: ${error.message}`, 'error');
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                this.disconnect();
            }
        }
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = `debug-entry debug-${type}`;
        entry.innerHTML = `<span class="debug-time">[${timestamp}]</span> ${message}`;

        this.debugLog.appendChild(entry);
        this.debugLog.scrollTop = this.debugLog.scrollHeight;

        // Mantener solo últimas 50 entradas
        while (this.debugLog.children.length > 50) {
            this.debugLog.removeChild(this.debugLog.firstChild);
        }
    }
}

// Inicializar cliente cuando la página carga
document.addEventListener('DOMContentLoaded', () => {
    new RemoteTypingClient();
});