/**
 * ApiClient - Maneja todas las comunicaciones con el servidor
 */
export class ApiClient {
    constructor(client) {
        this.client = client;
    }

    async sendCharacter(char) {
        try {
            const response = await fetch(`${this.client.connection.getServerURL()}/type`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: char })
            });

            if (response.ok) {
                this.client.logger.log(`📤 "${char}"`, 'success');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            this.client.logger.log(`❌ Error: ${error.message}`, 'error');
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                this.client.connection.disconnect();
            }
        }
    }

    async sendSpecialKey(key) {
        // Validar tecla
        const validKeys = ['backspace', 'enter', 'tab', 'escape', 'delete', 'space', 'arrow_up', 'arrow_down', 'arrow_left', 'arrow_right'];
        if (!validKeys.includes(key)) {
            return;
        }

        try {
            const response = await fetch(`${this.client.connection.getServerURL()}/special`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ key: key })
            });

            if (response.ok) {
                this.client.logger.log(`🔑 ${key}`, 'success');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            this.client.logger.log(`❌ Error tecla especial: ${error.message}`, 'error');
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                this.client.connection.disconnect();
            }
        }
    }

    async sendShortcut(shortcut) {
        try {
            const response = await fetch(`${this.client.connection.getServerURL()}/shortcut`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ shortcut: shortcut })
            });

            if (response.ok) {
                this.client.logger.log(`⚡ ${shortcut}`, 'success');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            this.client.logger.log(`❌ Error shortcut: ${error.message}`, 'error');
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                this.client.connection.disconnect();
            }
        }
    }

    async sendMouseMove(x, y) {
        try {
            const response = await fetch(`${this.client.connection.getServerURL()}/mouse`, {
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
                this.client.connection.disconnect();
            }
        }
    }

    async sendMouseClick(x, y, button = 'left') {
        try {
            const response = await fetch(`${this.client.connection.getServerURL()}/mouse`, {
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
                this.client.logger.log(`🖱️ ${button} click (${x}, ${y})`, 'success');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            this.client.logger.log(`❌ Error mouse: ${error.message}`, 'error');
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                this.client.connection.disconnect();
            }
        }
    }

    async sendMouseDrag(fromX, fromY, toX, toY, button = 'left') {
        const payload = {
            action: 'drag',
            x: fromX,
            y: fromY,
            to_x: toX,
            to_y: toY,
            button: button
        };

        this.client.logger.log(`📤 Enviando drag al servidor: ${JSON.stringify(payload)}`, 'info');

        try {
            const response = await fetch(`${this.client.connection.getServerURL()}/mouse`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                this.client.logger.log(`✅ Drag exitoso: ${result.message || 'OK'}`, 'success');
                this.client.logger.log(`🖱️ drag desde (${fromX}, ${fromY}) hasta (${toX}, ${toY})`, 'success');
            } else {
                const errorText = await response.text();
                this.client.logger.log(`❌ Error HTTP ${response.status}: ${errorText}`, 'error');
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
        } catch (error) {
            this.client.logger.log(`❌ Error drag: ${error.message}`, 'error');
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                this.client.connection.disconnect();
            }
        }
    }

    async sendMouseDragStart(x, y, button = 'left') {
        try {
            const response = await fetch(`${this.client.connection.getServerURL()}/mouse`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'drag_start',
                    x: x,
                    y: y,
                    button: button
                })
            });

            if (response.ok) {
                this.client.logger.log(`🤏 Drag start (${x}, ${y})`, 'success');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            this.client.logger.log(`❌ Error drag start: ${error.message}`, 'error');
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                this.client.connection.disconnect();
            }
        }
    }

    async sendMouseDragRealtime(x, y) {
        try {
            // Fire-and-forget para máxima velocidad
            fetch(`${this.client.connection.getServerURL()}/mouse`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'drag_move',
                    x: x,
                    y: y
                })
            }).catch(() => {}); // Ignorar errores para no bloquear

        } catch (error) {
            // Silencioso para no spam de logs
        }
    }

    async sendMouseDragEnd(x, y, button = 'left') {
        try {
            const response = await fetch(`${this.client.connection.getServerURL()}/mouse`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'drag_end',
                    x: x,
                    y: y,
                    button: button
                })
            });

            if (response.ok) {
                this.client.logger.log(`🤏 Drag end (${x}, ${y})`, 'success');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            this.client.logger.log(`❌ Error drag end: ${error.message}`, 'error');
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                this.client.connection.disconnect();
            }
        }
    }

    async sendMouseScroll(x, y, amount) {
        try {
            // Fire-and-forget para mínima latencia - no esperamos respuesta
            fetch(`${this.client.connection.getServerURL()}/mouse`, {
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
                    this.client.logger.log(`❌ Error scroll: HTTP ${response.status}`, 'error');
                }
            }).catch(error => {
                this.client.logger.log(`❌ Error scroll: ${error.message}`, 'error');
                if (error.name === 'TypeError' || error.message.includes('fetch')) {
                    this.client.connection.disconnect();
                }
            });

            // Log inmediato sin esperar respuesta del servidor
            this.client.logger.log(`🖱️ scroll ${amount > 0 ? '↑' : '↓'} (${x}, ${y})`, 'success');

        } catch (error) {
            this.client.logger.log(`❌ Error scroll: ${error.message}`, 'error');
        }
    }
}
