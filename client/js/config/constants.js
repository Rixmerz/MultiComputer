/**
 * Constantes de configuración de la aplicación
 */

export const CONFIG = {
    // Configuración del servidor
    SERVER: {
        DEFAULT_PORT: 5000,
        PING_ENDPOINT: '/ping',
        SCREEN_ENDPOINT: '/screen',
        TYPE_ENDPOINT: '/type',
        SPECIAL_ENDPOINT: '/special',
        MOUSE_ENDPOINT: '/mouse'
    },

    // Configuración del canvas
    CANVAS: {
        DEFAULT_SCREEN_WIDTH: 1920,
        DEFAULT_SCREEN_HEIGHT: 1080,
        EDGE_MARGIN: 40,
        CONTAINER_PADDING: 40,
        GRID_SIZE_MULTIPLIER: 50
    },

    // Configuración del mouse
    MOUSE: {
        THROTTLE_DELAY: 16, // ~60fps para movimiento
        SCROLL_THROTTLE_DELAY: 8, // ~120fps para scroll
        MIN_DRAG_DISTANCE: 3, // píxeles mínimos para considerar drag
        EDGE_TOLERANCE: 10, // píxeles de tolerancia cerca del borde
        SCROLL_MULTIPLIER_TRACKPAD: 3,
        SCROLL_MULTIPLIER_WHEEL: 3,
        SCROLL_MAX_AMOUNT: 50
    },

    // Configuración de UI
    UI: {
        CONNECTION_TIMEOUT: 5000,
        RESIZE_DEBOUNCE_DELAY: 100,
        FOCUS_DELAY: 10,
        AUTO_FOCUS_DELAY: 100
    },

    // Configuración de logging
    LOGGING: {
        MAX_LOG_ENTRIES: 50
    },

    // Colores del tema
    COLORS: {
        LIGHT: {
            MARGIN: '#ecf0f1',
            SCREEN: '#3498db',
            GRID: 'rgba(255, 255, 255, 0.1)',
            TEXT: 'rgba(255, 255, 255, 0.8)',
            BORDER: '#27ae60',
            OUTER_BORDER: '#34495e',
            LABEL: 'rgba(52, 73, 94, 0.3)'
        },
        DARK: {
            MARGIN: '#2c3e50',
            SCREEN: '#34495e',
            GRID: 'rgba(255, 255, 255, 0.05)',
            TEXT: 'rgba(236, 240, 241, 0.8)',
            BORDER: '#5d6d7e',
            OUTER_BORDER: '#7f8c8d',
            LABEL: 'rgba(189, 195, 199, 0.6)'
        },
        CURSOR: {
            DISABLED: '#95a5a6',
            DRAGGING: '#3498db',
            ACTIVE: '#e74c3c',
            MARGIN: '#f39c12',
            DRAG_START: '#2c3e50',
            WHITE: '#ffffff'
        }
    },

    // Teclas especiales permitidas
    SPECIAL_KEYS: ['backspace', 'enter', 'tab', 'escape', 'delete', 'space'],

    // Shortcuts permitidos
    SHORTCUTS: {
        'select_all': 'Ctrl/Cmd + A',
        'copy': 'Ctrl/Cmd + C',
        'paste': 'Ctrl/Cmd + V',
        'cut': 'Ctrl/Cmd + X',
        'undo': 'Ctrl/Cmd + Z',
        'redo': 'Ctrl/Cmd + Y',
        'save': 'Ctrl/Cmd + S',
        'find': 'Ctrl/Cmd + F',
        'new': 'Ctrl/Cmd + N',
        'open': 'Ctrl/Cmd + O',
        'print': 'Ctrl/Cmd + P',
        'refresh': 'Ctrl/Cmd + R'
    },

    // Teclas de navegación que se ignoran
    IGNORED_KEYS: [
        'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
        'Tab', 'Escape'
    ],

    // Selectores de elementos UI que no deben activar auto-focus
    UI_CONTROL_SELECTORS: [
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
    ]
};
