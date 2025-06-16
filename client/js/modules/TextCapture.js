/**
 * TextCapture - Maneja la captura de texto global
 */
export class TextCapture {
    constructor(client) {
        this.client = client;
    }

    init() {
        // Mantener el input oculto siempre enfocado para capturar escritura
        this.focusHiddenInputSafely();

        // Capturar escritura global
        document.addEventListener('keydown', (e) => {
            if (!this.client.connection.getConnectionStatus()) return;

            // Evitar capturar teclas de navegación y shortcuts
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(e.key)) return;
            if (['Tab', 'Escape'].includes(e.key)) return;

            // Manejar teclas especiales
            if (e.key === 'Backspace') {
                this.client.api.sendSpecialKey('backspace');
                e.preventDefault();
                return;
            }

            if (e.key === 'Enter') {
                this.client.api.sendSpecialKey('enter');
                e.preventDefault();
                return;
            }

            // Manejar caracteres normales
            if (e.key.length === 1) {
                this.client.api.sendCharacter(e.key);
                e.preventDefault();
            }
        });

        // Mantener el input oculto enfocado, pero solo si no se hace click en controles UI
        document.addEventListener('click', (e) => {
            if (!this.client.connection.getConnectionStatus()) return;

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
        this.client.ui.hiddenTextInput.addEventListener('blur', () => {
            if (this.client.connection.getConnectionStatus()) {
                setTimeout(() => {
                    this.focusHiddenInputSafely();
                }, 10);
            }
        });

        this.client.logger.log('🎯 Captura de texto global activada - escribe desde cualquier lugar', 'info');
    }

    focusHiddenInputSafely() {
        // Guardar la posición actual del scroll
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        // Enfocar el input oculto
        this.client.ui.hiddenTextInput.focus({ preventScroll: true });

        // Restaurar la posición del scroll si cambió
        if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
            window.scrollTo(scrollX, scrollY);
        }
    }
}
