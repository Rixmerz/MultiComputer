/**
 * DarkMode - Maneja el modo oscuro de la aplicación
 */
export class DarkMode {
    constructor(client) {
        this.client = client;
    }

    init() {
        // Verificar si hay preferencia guardada
        const savedDarkMode = localStorage.getItem('darkMode');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Aplicar modo oscuro si está guardado o si el sistema lo prefiere
        if (savedDarkMode === 'true' || (savedDarkMode === null && prefersDark)) {
            this.enable();
        }

        // Escuchar cambios en la preferencia del sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (localStorage.getItem('darkMode') === null) {
                if (e.matches) {
                    this.enable();
                } else {
                    this.disable();
                }
            }
        });
    }

    toggle() {
        const isDarkMode = document.body.classList.contains('dark-mode');

        if (isDarkMode) {
            this.disable();
        } else {
            this.enable();
        }

        // Guardar preferencia
        localStorage.setItem('darkMode', !isDarkMode);

        this.client.logger.log(`🌙 Modo ${!isDarkMode ? 'oscuro' : 'claro'} activado`, 'info');
    }

    enable() {
        document.body.classList.add('dark-mode');
        this.client.ui.darkModeToggle.innerHTML = '<span class="toggle-icon">☀️</span>';
        this.client.ui.darkModeToggle.title = 'Cambiar a modo claro';

        // Redibujar canvas con colores oscuros
        this.client.canvas.drawScreen();
    }

    disable() {
        document.body.classList.remove('dark-mode');
        this.client.ui.darkModeToggle.innerHTML = '<span class="toggle-icon">🌙</span>';
        this.client.ui.darkModeToggle.title = 'Cambiar a modo oscuro';

        // Redibujar canvas con colores claros
        this.client.canvas.drawScreen();
    }
}
