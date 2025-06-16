/**
 * MouseManager - Maneja todas las interacciones del mouse
 */
export class MouseManager {
    constructor(client) {
        this.client = client;
        this.mouseThrottle = false;
        this.scrollThrottle = false;
        
        // Variables para drag/arrastrar
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartCanvasX = 0;
        this.dragStartCanvasY = 0;
        this.justFinishedDrag = false;
    }

    handleCanvasMouseMove(e) {
        const rect = this.client.canvas.canvas.getBoundingClientRect();

        // Usar getBoundingClientRect() para mayor precisión
        const canvasX = (e.clientX - rect.left) * (this.client.canvas.canvas.width / rect.width);
        const canvasY = (e.clientY - rect.top) * (this.client.canvas.canvas.height / rect.height);

        // Ajustar coordenadas considerando el margen
        const margin = this.client.canvas.edgeMargin || 20;
        const adjustedX = canvasX - margin;
        const adjustedY = canvasY - margin;

        // Convert canvas coordinates to server screen coordinates con mayor precisión
        const serverX = Math.round(adjustedX / this.client.canvas.canvasScale);
        const serverY = Math.round(adjustedY / this.client.canvas.canvasScale);

        // Ensure coordinates are within bounds (permitir valores negativos para el margen)
        const boundedX = Math.max(0, Math.min(serverX, this.client.canvas.serverScreen.width - 1));
        const boundedY = Math.max(0, Math.min(serverY, this.client.canvas.serverScreen.height - 1));

        // Determinar si estamos en el área útil o en el margen
        const inUsableArea = (adjustedX >= 0 && adjustedX <= this.client.canvas.usableWidth &&
                             adjustedY >= 0 && adjustedY <= this.client.canvas.usableHeight);

        // Actualizar posición en canvas
        this.client.canvas.updateMousePosition(canvasX, canvasY, boundedX, boundedY, inUsableArea);

        // Update UI con indicador de área y estado de tracking
        const trackingEnabled = this.client.ui.mouseTrackingToggle.checked;
        const areaIndicator = inUsableArea ? '' : ' (margen)';
        const trackingIndicator = trackingEnabled ? '' : ' [CONTROL DESACTIVADO]';
        const dragIndicator = this.isDragging ? ' [ARRASTRANDO]' : '';
        this.client.ui.mousePosition.textContent = `Mouse: (${boundedX}, ${boundedY})${areaIndicator}${trackingIndicator}${dragIndicator}`;

        // Send mouse coordinates if connected, tracking enabled, in usable area, and NOT dragging
        if (this.client.connection.getConnectionStatus() && !this.mouseThrottle && inUsableArea && trackingEnabled && !this.isDragging) {
            this.mouseThrottle = true;
            setTimeout(() => {
                this.client.api.sendMouseMove(boundedX, boundedY);
                this.mouseThrottle = false;
            }, 16); // ~60fps para mayor suavidad
        }

        // Redraw with cursor - usar posición guardada para consistencia
        this.client.canvas.drawScreenWithCursor();
    }

    handleCanvasClick(e) {
        if (!this.client.connection.getConnectionStatus()) return;

        // Si acabamos de hacer un drag, no procesar el click
        if (this.justFinishedDrag) {
            this.justFinishedDrag = false;
            return;
        }

        // Verificar si el tracking de mouse está habilitado
        const trackingEnabled = this.client.ui.mouseTrackingToggle.checked;
        if (!trackingEnabled) {
            this.client.logger.log(`🚫 Click bloqueado - Tracking de mouse desactivado`, 'warning');
            return;
        }

        const coords = this._getCanvasCoordinates(e);
        if (!coords.nearEdge) {
            this.client.logger.log(`⚠️ Click fuera del área válida: (${coords.serverX}, ${coords.serverY})`, 'warning');
            return;
        }

        // Determine which mouse button was pressed
        let button = 'left';
        if (e.button === 2) button = 'right';
        else if (e.button === 1) button = 'middle';

        this.client.api.sendMouseClick(coords.boundedX, coords.boundedY, button);
    }

    handleCanvasMouseDown(e) {
        this.client.logger.log(`🔍 MouseDown detectado - botón: ${e.button}, conectado: ${this.client.connection.getConnectionStatus()}`, 'info');

        // Solo procesar botón izquierdo para drag
        if (e.button !== 0) {
            this.client.logger.log(`🚫 MouseDown ignorado - Solo botón izquierdo para drag`, 'info');
            return;
        }

        if (!this.client.connection.getConnectionStatus()) {
            this.client.logger.log(`🚫 MouseDown bloqueado - No conectado`, 'warning');
            return;
        }

        // Verificar si el tracking de mouse está habilitado
        const trackingEnabled = this.client.ui.mouseTrackingToggle.checked;
        if (!trackingEnabled) {
            this.client.logger.log(`🚫 MouseDown bloqueado - Tracking desactivado`, 'warning');
            return;
        }

        const coords = this._getCanvasCoordinates(e);
        this.client.logger.log(`🔍 Coordenadas calculadas: canvas(${coords.canvasX.toFixed(1)}, ${coords.canvasY.toFixed(1)}), server(${coords.boundedX}, ${coords.boundedY}), nearEdge: ${coords.nearEdge}`, 'info');

        if (!coords.nearEdge) {
            this.client.logger.log(`🚫 MouseDown bloqueado - Fuera del área válida`, 'warning');
            return;
        }

        // Iniciar drag
        this.isDragging = true;
        this.dragStartX = coords.boundedX;
        this.dragStartY = coords.boundedY;
        this.dragStartCanvasX = coords.canvasX;
        this.dragStartCanvasY = coords.canvasY;

        // Cambiar cursor para indicar drag
        this.client.canvas.canvas.style.cursor = 'grabbing';

        this.client.logger.log(`🤏 Drag iniciado en (${coords.boundedX}, ${coords.boundedY})`, 'success');
    }

    handleCanvasMouseUp(e) {
        this.client.logger.log(`🔍 MouseUp detectado - isDragging: ${this.isDragging}`, 'info');

        if (!this.isDragging) {
            this.client.logger.log(`🚫 MouseUp ignorado - No hay drag activo`, 'info');
            return;
        }

        const coords = this._getCanvasCoordinates(e);

        // Calcular distancia del drag
        const dragDistanceX = coords.boundedX - this.dragStartX;
        const dragDistanceY = coords.boundedY - this.dragStartY;
        const dragDistance = Math.sqrt(dragDistanceX * dragDistanceX + dragDistanceY * dragDistanceY);

        this.client.logger.log(`🔍 Distancia de drag calculada: ${Math.round(dragDistance)}px desde (${this.dragStartX}, ${this.dragStartY}) hasta (${coords.boundedX}, ${coords.boundedY})`, 'info');

        // Solo enviar drag si hay movimiento significativo (más de 2 píxeles - reducido para mayor sensibilidad)
        if (dragDistance > 2) {
            this.client.logger.log(`✅ Enviando comando de drag al servidor`, 'success');
            this.client.api.sendMouseDrag(this.dragStartX, this.dragStartY, coords.boundedX, coords.boundedY);
            this.justFinishedDrag = true; // Marcar que acabamos de hacer drag
        } else {
            this.client.logger.log(`⚠️ Drag muy pequeño (${Math.round(dragDistance)}px) - no se envía`, 'warning');
        }

        // Finalizar drag
        this.isDragging = false;
        this.client.canvas.canvas.style.cursor = 'grab';

        this.client.logger.log(`🤏 Drag finalizado en (${coords.boundedX}, ${coords.boundedY}) - distancia: ${Math.round(dragDistance)}px`, 'success');

        // Limpiar la bandera después de un breve delay
        setTimeout(() => {
            this.justFinishedDrag = false;
        }, 50);
    }

    handleCanvasScroll(e) {
        if (!this.client.connection.getConnectionStatus()) return;

        // Verificar si el tracking de mouse está habilitado
        const trackingEnabled = this.client.ui.mouseTrackingToggle.checked;
        if (!trackingEnabled) {
            this.client.logger.log(`🚫 Scroll bloqueado - Tracking de mouse desactivado`, 'warning');
            return;
        }

        const coords = this._getCanvasCoordinates(e);
        if (!coords.nearEdge) {
            this.client.logger.log(`⚠️ Scroll fuera del área válida: (${coords.serverX}, ${coords.serverY})`, 'warning');
            return;
        }

        // Calcular la cantidad de scroll - MUCHO MÁS RÁPIDO
        let scrollAmount = this._calculateScrollAmount(e);

        // Envío inmediato con throttling mínimo para baja latencia
        if (!this.scrollThrottle) {
            this.scrollThrottle = true;
            this.client.api.sendMouseScroll(coords.boundedX, coords.boundedY, scrollAmount);

            // Throttling muy corto solo para evitar spam extremo
            setTimeout(() => {
                this.scrollThrottle = false;
            }, 8); // 8ms = ~120fps, mucho más rápido que mouse movement (16ms = 60fps)
        }
    }

    _getCanvasCoordinates(e) {
        const rect = this.client.canvas.canvas.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left) * (this.client.canvas.canvas.width / rect.width);
        const canvasY = (e.clientY - rect.top) * (this.client.canvas.canvas.height / rect.height);

        // Ajustar coordenadas considerando el margen
        const margin = this.client.canvas.edgeMargin || 20;
        const adjustedX = canvasX - margin;
        const adjustedY = canvasY - margin;

        // Convert canvas coordinates to server screen coordinates
        const serverX = Math.round(adjustedX / this.client.canvas.canvasScale);
        const serverY = Math.round(adjustedY / this.client.canvas.canvasScale);

        // Ensure coordinates are within bounds
        const boundedX = Math.max(0, Math.min(serverX, this.client.canvas.serverScreen.width - 1));
        const boundedY = Math.max(0, Math.min(serverY, this.client.canvas.serverScreen.height - 1));

        // Solo permitir acciones en el área útil (pero cerca del borde también funciona)
        const nearEdge = (adjustedX >= -10 && adjustedX <= this.client.canvas.usableWidth + 10 &&
                         adjustedY >= -10 && adjustedY <= this.client.canvas.usableHeight + 10);

        return {
            canvasX,
            canvasY,
            adjustedX,
            adjustedY,
            serverX,
            serverY,
            boundedX,
            boundedY,
            nearEdge
        };
    }

    _calculateScrollAmount(e) {
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
        return Math.max(-50, Math.min(50, scrollAmount));
    }

    updateCursorStyle(isEnabled) {
        if (isEnabled) {
            this.client.canvas.canvas.style.cursor = 'grab';
        } else {
            this.client.canvas.canvas.style.cursor = 'not-allowed';
        }
    }
}
