/**
 * Logger - Maneja el sistema de logging y debug
 */
export class Logger {
    constructor(client) {
        this.client = client;
        this.debugLog = document.getElementById('debugLog');
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
