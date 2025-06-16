import { CONFIG } from '../config/constants.js';

/**
 * CanvasManager - Maneja el canvas y la representación visual de la pantalla remota
 */
export class CanvasManager {
    constructor(client) {
        this.client = client;
        this.canvas = document.getElementById('screenCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Screen configuration
        this.serverScreen = {
            width: CONFIG.CANVAS.DEFAULT_SCREEN_WIDTH,
            height: CONFIG.CANVAS.DEFAULT_SCREEN_HEIGHT
        };
        this.canvasScale = 1; // Direct 1:1 mapping initially
        this.edgeMargin = CONFIG.CANVAS.EDGE_MARGIN;
        this.usableWidth = 0;
        this.usableHeight = 0;

        // Variables para tracking preciso del mouse
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.lastCanvasX = 0;
        this.lastCanvasY = 0;
        this.inUsableArea = false;
    }

    updateCanvasSize() {
        // Get canvas container dimensions
        const canvasContainer = document.querySelector('.canvas-container');
        const containerRect = canvasContainer.getBoundingClientRect();
        const availableWidth = containerRect.width - 40; // 20px padding on each side
        const availableHeight = containerRect.height - 40;

        // Margen de seguridad doble (40px en cada lado)
        const edgeMargin = CONFIG.CANVAS.EDGE_MARGIN;

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

        this.client.logger.log(`📐 Canvas: ${canvasWidth}x${canvasHeight} (útil: ${baseCanvasWidth}x${baseCanvasHeight}), Container: ${availableWidth}x${availableHeight}, Servidor: ${this.serverScreen.width}x${this.serverScreen.height}, Margen: ${edgeMargin}px`, 'info');

        // Update precision indicator
        const pixelRatio = (1/this.canvasScale).toFixed(2);
        this.client.ui.precisionInfo.textContent = `Precisión: 1:${pixelRatio} píxeles`;
    }

    drawScreen() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Colores según el modo
        const isDarkMode = document.body.classList.contains('dark-mode');
        const colors = isDarkMode ? CONFIG.COLORS.DARK : CONFIG.COLORS.LIGHT;
        const marginColor = colors.MARGIN;
        const screenColor = colors.SCREEN;
        const gridColor = colors.GRID;
        const textColor = colors.TEXT;
        const borderColor = colors.BORDER;
        const outerBorderColor = colors.OUTER_BORDER;
        const labelColor = colors.LABEL;

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

        const gridSize = CONFIG.CANVAS.GRID_SIZE_MULTIPLIER * this.canvasScale;
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
            const trackingEnabled = this.client.ui.mouseTrackingToggle.checked;
            let cursorColor, cursorSize;

            if (!trackingEnabled) {
                // Cursor gris cuando el tracking está desactivado
                cursorColor = CONFIG.COLORS.CURSOR.DISABLED;
                cursorSize = 3;
            } else if (this.client.mouse.isDragging) {
                // Cursor azul cuando está arrastrando
                cursorColor = CONFIG.COLORS.CURSOR.DRAGGING;
                cursorSize = 5;
            } else if (this.inUsableArea) {
                // Cursor rojo cuando está en área útil y tracking activo
                cursorColor = CONFIG.COLORS.CURSOR.ACTIVE;
                cursorSize = 4;
            } else {
                // Cursor naranja cuando está en margen y tracking activo
                cursorColor = CONFIG.COLORS.CURSOR.MARGIN;
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
            this._drawCursorIndicators(trackingEnabled, cursorColor);
        }
    }

    _drawCursorIndicators(trackingEnabled, cursorColor) {
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
        } else if (this.client.mouse.isDragging) {
            // Cuando está arrastrando, mostrar línea desde punto de inicio
            if (this.client.mouse.dragStartCanvasX !== undefined && this.client.mouse.dragStartCanvasY !== undefined) {
                this.ctx.strokeStyle = cursorColor;
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.moveTo(this.client.mouse.dragStartCanvasX, this.client.mouse.dragStartCanvasY);
                this.ctx.lineTo(this.lastCanvasX, this.lastCanvasY);
                this.ctx.stroke();
                this.ctx.setLineDash([]); // Reset line dash
                
                // Mostrar punto de inicio
                this.ctx.fillStyle = '#2c3e50';
                this.ctx.beginPath();
                this.ctx.arc(this.client.mouse.dragStartCanvasX, this.client.mouse.dragStartCanvasY, 3, 0, 2 * Math.PI);
                this.ctx.fill();
            }
            
            // Agregar cruz más grande para drag
            this.ctx.strokeStyle = cursorColor;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.lastCanvasX - 10, this.lastCanvasY);
            this.ctx.lineTo(this.lastCanvasX + 10, this.lastCanvasY);
            this.ctx.moveTo(this.lastCanvasX, this.lastCanvasY - 10);
            this.ctx.lineTo(this.lastCanvasX, this.lastCanvasY + 10);
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

    updateMousePosition(canvasX, canvasY, serverX, serverY, inUsableArea) {
        this.lastCanvasX = canvasX;
        this.lastCanvasY = canvasY;
        this.lastMouseX = serverX;
        this.lastMouseY = serverY;
        this.inUsableArea = inUsableArea;
    }
}
