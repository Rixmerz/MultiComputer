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
        this.mousePosition = document.getElementById('mousePosition');
        this.screenResolution = document.getElementById('screenResolution');
        this.precisionInfo = document.getElementById('precisionInfo');
        this.darkModeToggle = document.getElementById('darkModeToggle');
        this.hiddenTextInput = document.getElementById('hiddenTextInput');
        this.mouseTrackingToggle = document.getElementById('mouseTrackingToggle');

        // Screen configuration
        this.serverScreen = {
            width: 1920,
            height: 1080
        };
        this.canvasScale = 1; // Direct 1:1 mapping initially
        this.mouseThrottle = false; // Para throttling de mouse movements
        this.scrollThrottle = false; // Para throttling de scroll (separado y más rápido)
        this.serverScreenInfo = null; // Info de pantalla del servidor

        // Variables para tracking preciso del mouse
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.lastCanvasX = 0;
        this.lastCanvasY = 0;
        
        this.initEventListeners();
        this.initDarkMode();
        this.initTextCapture();
        this.updateCanvasSize();
        this.drawScreen();
        this.log('Cliente iniciado - Canvas de pantalla completa', 'info');
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

        // Capturar eventos de scroll en el canvas
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault(); // Prevenir scroll de la página
            this.handleCanvasScroll(e);
        });

        // Limpiar cursor cuando el mouse sale del canvas
        this.canvas.addEventListener('mouseleave', () => {
            this.drawScreen(); // Redibujar sin cursor
        });

        // Dark mode toggle
        this.darkModeToggle.addEventListener('click', () => {
            this.toggleDarkMode();
        });

        // Mouse tracking toggle
        this.mouseTrackingToggle.addEventListener('change', (e) => {
            const isEnabled = e.target.checked;
            this.log(`🖱️ Control de mouse ${isEnabled ? 'activado' : 'desactivado'} (movimiento y clicks)`, 'info');

            // Actualizar el cursor del canvas según el estado del tracking
            if (isEnabled) {
                this.canvas.style.cursor = 'crosshair';
            } else {
                this.canvas.style.cursor = 'not-allowed';
            }

            // Redibujar la pantalla para reflejar el cambio de estado
            if (this.lastCanvasX !== undefined && this.lastCanvasY !== undefined) {
                this.drawScreenWithCursor();
            } else {
                this.drawScreen();
            }
        });

        // Window resize event with debouncing
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updateCanvasSize();
                this.drawScreen();
                this.log('🔄 Canvas redimensionado para nueva ventana', 'info');
            }, 100);
        });

        // Initial canvas focus - solo enfocar si el click es directamente en el canvas
        this.canvas.addEventListener('click', (e) => {
            // Solo enfocar el canvas si el click fue directamente en él
            if (e.target === this.canvas) {
                this.canvas.focus();
            }
        });
    }

    updateCanvasSize() {
        // Get canvas container dimensions
        const canvasContainer = document.querySelector('.canvas-container');
        const containerRect = canvasContainer.getBoundingClientRect();
        const availableWidth = containerRect.width - 40; // 20px padding on each side
        const availableHeight = containerRect.height - 40;

        // Margen de seguridad doble (40px en cada lado)
        const edgeMargin = 40;

        const aspectRatio = this.serverScreen.width / this.serverScreen.height;

        // Calculate maximum usable area within the container
        const maxUsableWidth = availableWidth - (edgeMargin * 2);
        const maxUsableHeight = availableHeight - (edgeMargin * 2);

        let baseCanvasWidth, baseCanvasHeight;

        if (aspectRatio > maxUsableWidth / maxUsableHeight) {
            // Width is the limiting factor
            baseCanvasWidth = maxUsableWidth;
            baseCanvasHeight = Math.round(baseCanvasWidth / aspectRatio);
        } else {
            // Height is the limiting factor
            baseCanvasHeight = maxUsableHeight;
            baseCanvasWidth = Math.round(baseCanvasHeight * aspectRatio);
        }

        // Add safety margin to final canvas
        const canvasWidth = baseCanvasWidth + (edgeMargin * 2);
        const canvasHeight = baseCanvasHeight + (edgeMargin * 2);

        // Set canvas dimensions (both visual and internal)
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;

        // Set CSS size to match internal dimensions for 1:1 pixel mapping
        this.canvas.style.width = `${canvasWidth}px`;
        this.canvas.style.height = `${canvasHeight}px`;

        // Calculate scale factor based on usable area (without margin)
        this.canvasScale = baseCanvasWidth / this.serverScreen.width;

        // Store margin information for later calculations
        this.edgeMargin = edgeMargin;
        this.usableWidth = baseCanvasWidth;
        this.usableHeight = baseCanvasHeight;

        // Configure canvas for crisp rendering
        this.ctx.imageSmoothingEnabled = false;

        this.log(`📐 Canvas: ${canvasWidth}x${canvasHeight} (útil: ${baseCanvasWidth}x${baseCanvasHeight}), Container: ${availableWidth}x${availableHeight}, Servidor: ${this.serverScreen.width}x${this.serverScreen.height}, Margen: ${edgeMargin}px`, 'info');

        // Update precision indicator
        const pixelRatio = (1/this.canvasScale).toFixed(2);
        this.precisionInfo.textContent = `Precisión: 1:${pixelRatio} píxeles`;
    }

    drawScreen() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Colores según el modo
        const isDarkMode = document.body.classList.contains('dark-mode');
        const marginColor = isDarkMode ? '#2c3e50' : '#ecf0f1';
        const screenColor = isDarkMode ? '#34495e' : '#3498db';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)';
        const textColor = isDarkMode ? 'rgba(236, 240, 241, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        const borderColor = isDarkMode ? '#5d6d7e' : '#27ae60';
        const outerBorderColor = isDarkMode ? '#7f8c8d' : '#34495e';
        const labelColor = isDarkMode ? 'rgba(189, 195, 199, 0.6)' : 'rgba(52, 73, 94, 0.3)';

        // Draw margin area (fondo más claro)
        this.ctx.fillStyle = marginColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw main screen area (área útil)
        const margin = this.edgeMargin || 20;
        this.ctx.fillStyle = screenColor;
        this.ctx.fillRect(margin, margin, this.usableWidth || (this.canvas.width - margin * 2), this.usableHeight || (this.canvas.height - margin * 2));

        // Add subtle grid pattern only in the usable area
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1;

        const gridSize = 50 * this.canvasScale;
        const startX = margin;
        const endX = margin + (this.usableWidth || (this.canvas.width - margin * 2));
        const startY = margin;
        const endY = margin + (this.usableHeight || (this.canvas.height - margin * 2));

        for (let x = startX; x < endX; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }

        for (let y = startY; y < endY; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
        }

        // Draw screen label
        this.ctx.fillStyle = textColor;
        this.ctx.font = `${Math.max(12, 16 * this.canvasScale)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `Pantalla Remota (${this.serverScreen.width}x${this.serverScreen.height})`,
            this.canvas.width / 2,
            this.canvas.height / 2
        );

        // Draw border around usable area (pantalla real)
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(margin, margin, this.usableWidth || (this.canvas.width - margin * 2), this.usableHeight || (this.canvas.height - margin * 2));

        // Draw border around entire canvas
        this.ctx.strokeStyle = outerBorderColor;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);

        // Add corner indicators for the margin area
        this.ctx.fillStyle = labelColor;
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Margen de seguridad', 5, 15);
    }

    drawScreenWithCursor() {
        // Dibujar pantalla base
        this.drawScreen();

        // Dibujar cursor en la posición exacta guardada
        if (this.lastCanvasX !== undefined && this.lastCanvasY !== undefined) {
            // Color del cursor dependiendo de si está en área útil, margen, y estado de tracking
            const trackingEnabled = this.mouseTrackingToggle.checked;
            let cursorColor, cursorSize;

            if (!trackingEnabled) {
                // Cursor gris cuando el tracking está desactivado
                cursorColor = '#95a5a6';
                cursorSize = 3;
            } else if (this.inUsableArea) {
                // Cursor rojo cuando está en área útil y tracking activo
                cursorColor = '#e74c3c';
                cursorSize = 4;
            } else {
                // Cursor naranja cuando está en margen y tracking activo
                cursorColor = '#f39c12';
                cursorSize = 3;
            }

            this.ctx.fillStyle = cursorColor;
            this.ctx.beginPath();
            this.ctx.arc(this.lastCanvasX, this.lastCanvasY, cursorSize, 0, 2 * Math.PI);
            this.ctx.fill();

            // Agregar borde blanco para mejor visibilidad
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // Agregar indicadores adicionales según el estado
            if (!trackingEnabled) {
                // Cuando el tracking está desactivado, mostrar una X
                this.ctx.strokeStyle = cursorColor;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(this.lastCanvasX - 6, this.lastCanvasY - 6);
                this.ctx.lineTo(this.lastCanvasX + 6, this.lastCanvasY + 6);
                this.ctx.moveTo(this.lastCanvasX + 6, this.lastCanvasY - 6);
                this.ctx.lineTo(this.lastCanvasX - 6, this.lastCanvasY + 6);
                this.ctx.stroke();
            } else if (this.inUsableArea) {
                // Agregar cruz para mayor precisión (solo en área útil y tracking activo)
                this.ctx.strokeStyle = cursorColor;
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(this.lastCanvasX - 8, this.lastCanvasY);
                this.ctx.lineTo(this.lastCanvasX + 8, this.lastCanvasY);
                this.ctx.moveTo(this.lastCanvasX, this.lastCanvasY - 8);
                this.ctx.lineTo(this.lastCanvasX, this.lastCanvasY + 8);
                this.ctx.stroke();
            } else {
                // En el margen, mostrar un círculo punteado
                this.ctx.strokeStyle = cursorColor;
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([3, 3]);
                this.ctx.beginPath();
                this.ctx.arc(this.lastCanvasX, this.lastCanvasY, 8, 0, 2 * Math.PI);
                this.ctx.stroke();
                this.ctx.setLineDash([]); // Reset line dash
            }
        }
    }

    handleCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();

        // Usar getBoundingClientRect() para mayor precisión
        const canvasX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const canvasY = (e.clientY - rect.top) * (this.canvas.height / rect.height);

        // Ajustar coordenadas considerando el margen
        const margin = this.edgeMargin || 20;
        const adjustedX = canvasX - margin;
        const adjustedY = canvasY - margin;

        // Convert canvas coordinates to server screen coordinates con mayor precisión
        const serverX = Math.round(adjustedX / this.canvasScale);
        const serverY = Math.round(adjustedY / this.canvasScale);

        // Ensure coordinates are within bounds (permitir valores negativos para el margen)
        const boundedX = Math.max(0, Math.min(serverX, this.serverScreen.width - 1));
        const boundedY = Math.max(0, Math.min(serverY, this.serverScreen.height - 1));

        // Determinar si estamos en el área útil o en el margen
        const inUsableArea = (adjustedX >= 0 && adjustedX <= this.usableWidth &&
                             adjustedY >= 0 && adjustedY <= this.usableHeight);

        // Guardar última posición para sincronización
        this.lastMouseX = boundedX;
        this.lastMouseY = boundedY;
        this.lastCanvasX = canvasX;
        this.lastCanvasY = canvasY;
        this.inUsableArea = inUsableArea;

        // Update UI con indicador de área y estado de tracking
        const trackingEnabled = this.mouseTrackingToggle.checked;
        const areaIndicator = inUsableArea ? '' : ' (margen)';
        const trackingIndicator = trackingEnabled ? '' : ' [CONTROL DESACTIVADO]';
        this.mousePosition.textContent = `Mouse: (${boundedX}, ${boundedY})${areaIndicator}${trackingIndicator}`;

        // Send mouse coordinates if connected, tracking enabled, and in usable area
        if (this.isConnected && !this.mouseThrottle && inUsableArea && trackingEnabled) {
            this.mouseThrottle = true;
            setTimeout(() => {
                this.sendMouseMove(boundedX, boundedY);
                this.mouseThrottle = false;
            }, 16); // ~60fps para mayor suavidad
        }

        // Redraw with cursor - usar posición guardada para consistencia
        this.drawScreenWithCursor();
    }

    handleCanvasClick(e) {
        if (!this.isConnected) return;

        // Verificar si el tracking de mouse está habilitado
        const trackingEnabled = this.mouseTrackingToggle.checked;
        if (!trackingEnabled) {
            this.log(`🚫 Click bloqueado - Tracking de mouse desactivado`, 'warning');
            return;
        }

        // Usar la misma lógica de precisión que en mousemove
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const canvasY = (e.clientY - rect.top) * (this.canvas.height / rect.height);

        // Ajustar coordenadas considerando el margen
        const margin = this.edgeMargin || 20;
        const adjustedX = canvasX - margin;
        const adjustedY = canvasY - margin;

        // Convert canvas coordinates to server screen coordinates
        const serverX = Math.round(adjustedX / this.canvasScale);
        const serverY = Math.round(adjustedY / this.canvasScale);

        // Ensure coordinates are within bounds
        const boundedX = Math.max(0, Math.min(serverX, this.serverScreen.width - 1));
        const boundedY = Math.max(0, Math.min(serverY, this.serverScreen.height - 1));

        // Solo permitir clicks en el área útil (pero cerca del borde también funciona)
        const nearEdge = (adjustedX >= -10 && adjustedX <= this.usableWidth + 10 &&
                         adjustedY >= -10 && adjustedY <= this.usableHeight + 10);

        if (!nearEdge) {
            this.log(`⚠️ Click fuera del área válida: (${serverX}, ${serverY})`, 'warning');
            return;
        }

        // Determine which mouse button was pressed
        let button = 'left';
        if (e.button === 2) button = 'right';
        else if (e.button === 1) button = 'middle';

        this.sendMouseClick(boundedX, boundedY, button);
    }

    handleCanvasScroll(e) {
        if (!this.isConnected) return;

        // Verificar si el tracking de mouse está habilitado
        const trackingEnabled = this.mouseTrackingToggle.checked;
        if (!trackingEnabled) {
            this.log(`🚫 Scroll bloqueado - Tracking de mouse desactivado`, 'warning');
            return;
        }

        // Usar la misma lógica de precisión que en mousemove para obtener coordenadas
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const canvasY = (e.clientY - rect.top) * (this.canvas.height / rect.height);

        // Ajustar coordenadas considerando el margen
        const margin = this.edgeMargin || 20;
        const adjustedX = canvasX - margin;
        const adjustedY = canvasY - margin;

        // Convert canvas coordinates to server screen coordinates
        const serverX = Math.round(adjustedX / this.canvasScale);
        const serverY = Math.round(adjustedY / this.canvasScale);

        // Ensure coordinates are within bounds
        const boundedX = Math.max(0, Math.min(serverX, this.serverScreen.width - 1));
        const boundedY = Math.max(0, Math.min(serverY, this.serverScreen.height - 1));

        // Solo permitir scroll en el área útil
        const nearEdge = (adjustedX >= -10 && adjustedX <= this.usableWidth + 10 &&
                         adjustedY >= -10 && adjustedY <= this.usableHeight + 10);

        if (!nearEdge) {
            this.log(`⚠️ Scroll fuera del área válida: (${serverX}, ${serverY})`, 'warning');
            return;
        }

        // Calcular la cantidad de scroll - MUCHO MÁS RÁPIDO
        // deltaY positivo = scroll hacia abajo, negativo = scroll hacia arriba
        let scrollAmount;

        // Detectar tipo de dispositivo de scroll con velocidades muy agresivas
        if (Math.abs(e.deltaY) < 10) {
            // Trackpad o scroll suave - multiplicador mucho más agresivo
            scrollAmount = -e.deltaY * 3;
        } else {
            // Rueda de mouse tradicional - velocidad extrema
            scrollAmount = -Math.sign(e.deltaY) * Math.max(10, Math.abs(e.deltaY) / 3);
        }

        // Límites muy altos para scroll súper rápido
        scrollAmount = Math.max(-50, Math.min(50, scrollAmount));

        // Envío inmediato con throttling mínimo para baja latencia
        if (!this.scrollThrottle) {
            this.scrollThrottle = true;
            this.sendMouseScroll(boundedX, boundedY, scrollAmount);

            // Throttling muy corto solo para evitar spam extremo
            setTimeout(() => {
                this.scrollThrottle = false;
            }, 8); // 8ms = ~120fps, mucho más rápido que mouse movement (16ms = 60fps)
        }
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
                    this.serverScreen.width = data.screen.width;
                    this.serverScreen.height = data.screen.height;

                    this.log(`📺 Pantalla servidor: ${data.screen.width}x${data.screen.height}`, 'info');

                    // Update UI
                    this.screenResolution.textContent = `Resolución: ${data.screen.width}x${data.screen.height}`;

                    // Recalculate canvas size and redraw
                    this.updateCanvasSize();
                    this.drawScreen();

                    // Mostrar información de precisión
                    this.log(`🎯 Precisión: 1 pixel canvas = ${(1/this.canvasScale).toFixed(2)} pixels servidor`, 'info');
                }
            }
        } catch (error) {
            this.log(`⚠️ No se pudo obtener info de pantalla: ${error.message}`, 'warning');
            // Use default resolution
            this.screenResolution.textContent = `Resolución: ${this.serverScreen.width}x${this.serverScreen.height} (por defecto)`;
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
            this.serverIP.disabled = true;
            this.canvas.classList.add('connected');

            // Activar captura de texto global
            this.focusHiddenInputSafely();
            this.log('✨ Escritura global activada - puedes escribir desde cualquier lugar', 'success');
        } else {
            this.statusDot.className = 'status-dot offline';
            this.statusText.textContent = 'Desconectado';
            this.connectBtn.textContent = 'Conectar';
            this.serverIP.disabled = false;
            this.canvas.classList.remove('connected');

            // Desactivar captura de texto
            this.hiddenTextInput.blur();
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

    async sendMouseScroll(x, y, amount) {
        try {
            // Fire-and-forget para mínima latencia - no esperamos respuesta
            fetch(`${this.serverURL}/mouse`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'scroll',
                    x: x,
                    y: y,
                    amount: amount
                })
            }).then(response => {
                // Solo loggear si hay error, para no bloquear
                if (!response.ok) {
                    this.log(`❌ Error scroll: HTTP ${response.status}`, 'error');
                }
            }).catch(error => {
                this.log(`❌ Error scroll: ${error.message}`, 'error');
                if (error.name === 'TypeError' || error.message.includes('fetch')) {
                    this.disconnect();
                }
            });

            // Log inmediato sin esperar respuesta del servidor
            this.log(`🖱️ scroll ${amount > 0 ? '↑' : '↓'} (${x}, ${y})`, 'success');

        } catch (error) {
            this.log(`❌ Error scroll: ${error.message}`, 'error');
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

    initDarkMode() {
        // Verificar si hay preferencia guardada
        const savedDarkMode = localStorage.getItem('darkMode');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Aplicar modo oscuro si está guardado o si el sistema lo prefiere
        if (savedDarkMode === 'true' || (savedDarkMode === null && prefersDark)) {
            this.enableDarkMode();
        }

        // Escuchar cambios en la preferencia del sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (localStorage.getItem('darkMode') === null) {
                if (e.matches) {
                    this.enableDarkMode();
                } else {
                    this.disableDarkMode();
                }
            }
        });
    }

    toggleDarkMode() {
        const isDarkMode = document.body.classList.contains('dark-mode');

        if (isDarkMode) {
            this.disableDarkMode();
        } else {
            this.enableDarkMode();
        }

        // Guardar preferencia
        localStorage.setItem('darkMode', !isDarkMode);

        this.log(`🌙 Modo ${!isDarkMode ? 'oscuro' : 'claro'} activado`, 'info');
    }

    enableDarkMode() {
        document.body.classList.add('dark-mode');
        this.darkModeToggle.innerHTML = '<span class="toggle-icon">☀️</span>';
        this.darkModeToggle.title = 'Cambiar a modo claro';

        // Redibujar canvas con colores oscuros
        this.drawScreen();
    }

    disableDarkMode() {
        document.body.classList.remove('dark-mode');
        this.darkModeToggle.innerHTML = '<span class="toggle-icon">🌙</span>';
        this.darkModeToggle.title = 'Cambiar a modo oscuro';

        // Redibujar canvas con colores claros
        this.drawScreen();
    }

    initTextCapture() {
        // Mantener el input oculto siempre enfocado para capturar escritura
        this.focusHiddenInputSafely();

        // Capturar escritura global
        document.addEventListener('keydown', (e) => {
            if (!this.isConnected) return;

            // Evitar capturar teclas de navegación y shortcuts
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(e.key)) return;
            if (['Tab', 'Escape'].includes(e.key)) return;

            // Manejar teclas especiales
            if (e.key === 'Backspace') {
                this.sendSpecialKey('backspace');
                e.preventDefault();
                return;
            }

            if (e.key === 'Enter') {
                this.sendSpecialKey('enter');
                e.preventDefault();
                return;
            }

            // Manejar caracteres normales
            if (e.key.length === 1) {
                this.sendCharacter(e.key);
                e.preventDefault();
            }
        });

        // Mantener el input oculto enfocado, pero solo si no se hace click en controles UI
        document.addEventListener('click', (e) => {
            if (!this.isConnected) return;

            // Lista de selectores de elementos que NO deben activar el auto-focus
            const uiControlSelectors = [
                'button',
                'input[type="checkbox"]',
                'input[type="radio"]',
                'input[type="text"]',
                'input[type="number"]',
                'select',
                'textarea',
                '.switch',
                '.slider',
                '.switch-container',
                '.dark-mode-toggle',
                '#mouseTrackingToggle',
                '#darkModeToggle',
                '#connectBtn',
                '#serverIP'
            ];

            // Verificar si el click fue en un control UI o sus elementos padre
            const isUIControl = uiControlSelectors.some(selector => {
                return e.target.matches(selector) || e.target.closest(selector);
            });

            // Solo auto-enfocar si NO es un control UI
            if (!isUIControl) {
                setTimeout(() => {
                    this.focusHiddenInputSafely();
                }, 10);
            }
        });

        // Re-enfocar cuando se pierde el foco
        this.hiddenTextInput.addEventListener('blur', () => {
            if (this.isConnected) {
                setTimeout(() => {
                    this.focusHiddenInputSafely();
                }, 10);
            }
        });

        this.log('🎯 Captura de texto global activada - escribe desde cualquier lugar', 'info');
    }

    focusHiddenInputSafely() {
        // Guardar la posición actual del scroll
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        // Enfocar el input oculto
        this.hiddenTextInput.focus({ preventScroll: true });

        // Restaurar la posición del scroll si cambió
        if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
            window.scrollTo(scrollX, scrollY);
        }
    }
}

// Inicializar cliente cuando la página carga
document.addEventListener('DOMContentLoaded', () => {
    new RemoteTypingClient();
});