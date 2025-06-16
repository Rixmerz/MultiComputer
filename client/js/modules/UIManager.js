/**
 * UIManager - Maneja todos los elementos de la interfaz de usuario
 */
export class UIManager {
    constructor(client) {
        this.client = client;
        this.initializeElements();
    }

    initializeElements() {
        // Connection elements
        this.connectBtn = document.getElementById('connectBtn');
        this.serverIP = document.getElementById('serverIP');
        this.textInput = document.getElementById('textInput');
        this.statusText = document.getElementById('statusText');
        this.statusDot = document.querySelector('.status-dot');
        
        // Screen elements
        this.mousePosition = document.getElementById('mousePosition');
        this.screenResolution = document.getElementById('screenResolution');
        this.precisionInfo = document.getElementById('precisionInfo');
        this.darkModeToggle = document.getElementById('darkModeToggle');
        this.hiddenTextInput = document.getElementById('hiddenTextInput');
        this.mouseTrackingToggle = document.getElementById('mouseTrackingToggle');
        this.testDragBtn = document.getElementById('testDragBtn');
    }

    initEventListeners() {
        // Connection events
        this.connectBtn.addEventListener('click', () => {
            if (this.client.connection.getConnectionStatus()) {
                this.client.connection.disconnect();
            } else {
                this.client.connection.connect();
            }
        });

        this.serverIP.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.client.connection.getConnectionStatus()) {
                this.client.connection.connect();
            }
        });

        // Canvas mouse events
        this.client.canvas.canvas.addEventListener('mousemove', (e) => {
            this.client.mouse.handleCanvasMouseMove(e);
        });

        this.client.canvas.canvas.addEventListener('click', (e) => {
            this.client.mouse.handleCanvasClick(e);
        });

        this.client.canvas.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Prevenir menú contextual
            this.client.mouse.handleCanvasClick(e);
        });

        // Eventos para drag/arrastrar - con prevención de eventos por defecto
        this.client.canvas.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevenir selección de texto y otros comportamientos
            this.client.mouse.handleCanvasMouseDown(e);
        });

        this.client.canvas.canvas.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.client.mouse.handleCanvasMouseUp(e);
        });

        // Agregar eventos globales para capturar mouseup fuera del canvas
        document.addEventListener('mouseup', (e) => {
            if (this.client.mouse.isDragging) {
                this.client.mouse.handleCanvasMouseUp(e);
            }
        });

        // Capturar eventos de scroll en el canvas
        this.client.canvas.canvas.addEventListener('wheel', (e) => {
            e.preventDefault(); // Prevenir scroll de la página
            this.client.mouse.handleCanvasScroll(e);
        });

        // Manejar cuando el mouse sale del canvas
        this.client.canvas.canvas.addEventListener('mouseleave', (e) => {
            if (this.client.mouse.isDragging) {
                this.client.mouse.handleCanvasMouseUp(e);
            }
            this.client.canvas.drawScreen(); // Redibujar sin cursor
        });

        // Dark mode toggle
        this.darkModeToggle.addEventListener('click', () => {
            this.client.darkMode.toggle();
        });

        // Mouse tracking toggle
        this.mouseTrackingToggle.addEventListener('change', (e) => {
            const isEnabled = e.target.checked;
            this.client.logger.log(`🖱️ Control de mouse ${isEnabled ? 'activado' : 'desactivado'} (movimiento y clicks)`, 'info');

            // Actualizar el cursor del canvas según el estado del tracking
            this.client.mouse.updateCursorStyle(isEnabled);

            // Redibujar la pantalla para reflejar el cambio de estado
            if (this.client.canvas.lastCanvasX !== undefined && this.client.canvas.lastCanvasY !== undefined) {
                this.client.canvas.drawScreenWithCursor();
            } else {
                this.client.canvas.drawScreen();
            }
        });

        // Test drag button
        this.testDragBtn.addEventListener('click', () => {
            if (!this.client.connection.getConnectionStatus()) {
                this.client.logger.log(`🚫 Test drag bloqueado - No conectado`, 'warning');
                return;
            }

            this.client.logger.log(`🧪 Iniciando test de drag REALTIME...`, 'info');
            this.testRealtimeDrag();
        });

        // Window resize event with debouncing
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.client.canvas.updateCanvasSize();
                this.client.canvas.drawScreen();
                this.client.logger.log('🔄 Canvas redimensionado para nueva ventana', 'info');
            }, 100);
        });

        // Initial canvas focus - solo enfocar si el click es directamente en el canvas
        this.client.canvas.canvas.addEventListener('click', (e) => {
            // Solo enfocar el canvas si el click fue directamente en él
            if (e.target === this.client.canvas.canvas) {
                this.client.canvas.canvas.focus();
            }
        });
    }

    async testRealtimeDrag() {
        this.client.logger.log(`🧪 Test REALTIME: Iniciando drag...`, 'info');

        // 1. Iniciar drag
        await this.client.api.sendMouseDragStart(100, 100);

        // 2. Simular movimiento realtime
        const steps = 20;
        for (let i = 0; i <= steps; i++) {
            const progress = i / steps;
            const x = 100 + (100 * progress); // De 100 a 200
            const y = 100 + (50 * progress);  // De 100 a 150

            await this.client.api.sendMouseDragRealtime(Math.round(x), Math.round(y));
            await new Promise(resolve => setTimeout(resolve, 50)); // 50ms entre pasos
        }

        // 3. Finalizar drag
        await this.client.api.sendMouseDragEnd(200, 150);

        this.client.logger.log(`🧪 Test REALTIME: Drag completado!`, 'success');
    }
}
