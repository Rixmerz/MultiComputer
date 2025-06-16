/**
 * RemoteTypingClient - Aplicación principal refactorizada
 * Arquitectura modular para mejor mantenibilidad y escalabilidad
 */

// Importar todos los módulos
import { ConnectionManager } from './modules/ConnectionManager.js';
import { CanvasManager } from './modules/CanvasManager.js';
import { MouseManager } from './modules/MouseManager.js';
import { ApiClient } from './modules/ApiClient.js';
import { UIManager } from './modules/UIManager.js';
import { TextCapture } from './modules/TextCapture.js';
import { DarkMode } from './modules/DarkMode.js';
import { Logger } from './modules/Logger.js';

/**
 * Clase principal que coordina todos los módulos
 */
class RemoteTypingClient {
    constructor() {
        // Inicializar logger primero
        this.logger = new Logger(this);
        
        // Inicializar todos los módulos
        this.connection = new ConnectionManager(this);
        this.canvas = new CanvasManager(this);
        this.mouse = new MouseManager(this);
        this.api = new ApiClient(this);
        this.ui = new UIManager(this);
        this.textCapture = new TextCapture(this);
        this.darkMode = new DarkMode(this);

        // Inicializar la aplicación
        this.init();
    }

    init() {
        // Inicializar módulos en el orden correcto
        this.ui.initEventListeners();
        this.darkMode.init();
        this.textCapture.init();
        this.canvas.updateCanvasSize();
        this.canvas.drawScreen();
        
        // Logs de inicio
        this.logger.log('Cliente iniciado - Canvas de pantalla completa', 'info');
        this.logger.log('🤏 Funcionalidad de arrastrar habilitada - mantén presionado y arrastra para mover ventanas', 'info');
        this.logger.log('🏗️ Arquitectura modular cargada exitosamente', 'info');
    }
}

// Inicializar cliente cuando la página carga
document.addEventListener('DOMContentLoaded', () => {
    new RemoteTypingClient();
});
