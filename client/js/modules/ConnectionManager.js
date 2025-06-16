/**
 * ConnectionManager - Maneja la conexión con el servidor
 */
export class ConnectionManager {
    constructor(client) {
        this.client = client;
        this.serverURL = '';
        this.isConnected = false;
        this.serverScreenInfo = null;
    }

    async connect() {
        const ip = this.client.ui.serverIP.value.trim();
        if (!ip) {
            this.client.logger.log('ERROR: Ingresa una IP válida', 'error');
            return;
        }

        this.serverURL = `http://${ip}:5000`;
        this.client.ui.connectBtn.disabled = true;
        this.client.ui.connectBtn.textContent = 'Conectando...';
        this.client.logger.log(`Intentando conectar a ${this.serverURL}`, 'info');

        try {
            const response = await fetch(`${this.serverURL}/ping`, {
                method: 'GET',
                timeout: 5000
            });

            if (response.ok) {
                this.isConnected = true;
                this.updateConnectionStatus(true);
                this.client.logger.log('✅ Conectado exitosamente', 'success');

                // Obtener información de pantalla del servidor
                await this.getServerScreenInfo();

                // Enfocar textarea automáticamente
                setTimeout(() => {
                    this.client.ui.textInput.focus();
                }, 100);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            this.client.logger.log(`❌ Error de conexión: ${error.message}`, 'error');
            this.updateConnectionStatus(false);
        }

        this.client.ui.connectBtn.disabled = false;
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
                    this.client.canvas.serverScreen.width = data.screen.width;
                    this.client.canvas.serverScreen.height = data.screen.height;

                    this.client.logger.log(`📺 Pantalla servidor: ${data.screen.width}x${data.screen.height}`, 'info');

                    // Update UI
                    this.client.ui.screenResolution.textContent = `Resolución: ${data.screen.width}x${data.screen.height}`;

                    // Recalculate canvas size and redraw
                    this.client.canvas.updateCanvasSize();
                    this.client.canvas.drawScreen();

                    // Mostrar información de precisión
                    this.client.logger.log(`🎯 Precisión: 1 pixel canvas = ${(1/this.client.canvas.canvasScale).toFixed(2)} pixels servidor`, 'info');
                }
            }
        } catch (error) {
            this.client.logger.log(`⚠️ No se pudo obtener info de pantalla: ${error.message}`, 'warning');
            // Use default resolution
            this.client.ui.screenResolution.textContent = `Resolución: ${this.client.canvas.serverScreen.width}x${this.client.canvas.serverScreen.height} (por defecto)`;
        }
    }

    disconnect() {
        this.isConnected = false;
        this.updateConnectionStatus(false);
        this.client.logger.log('🔌 Desconectado', 'info');
    }

    updateConnectionStatus(connected) {
        if (connected) {
            this.client.ui.statusDot.className = 'status-dot online';
            this.client.ui.statusText.textContent = `Conectado a ${this.client.ui.serverIP.value}`;
            this.client.ui.connectBtn.textContent = 'Desconectar';
            this.client.ui.serverIP.disabled = true;
            this.client.canvas.canvas.classList.add('connected');

            // Activar captura de texto global
            this.client.textCapture.focusHiddenInputSafely();
            this.client.logger.log('✨ Escritura global activada - puedes escribir desde cualquier lugar', 'success');
        } else {
            this.client.ui.statusDot.className = 'status-dot offline';
            this.client.ui.statusText.textContent = 'Desconectado';
            this.client.ui.connectBtn.textContent = 'Conectar';
            this.client.ui.serverIP.disabled = false;
            this.client.canvas.canvas.classList.remove('connected');

            // Desactivar captura de texto
            this.client.ui.hiddenTextInput.blur();
        }
    }

    getServerURL() {
        return this.serverURL;
    }

    getConnectionStatus() {
        return this.isConnected;
    }
}
