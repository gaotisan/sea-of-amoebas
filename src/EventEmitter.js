export class EventEmitter {
    constructor() {
        this.events = {}; // Diccionario para almacenar eventos y sus listeners
    }

    // Suscribir un listener a un evento
    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        // Verificar si el listener ya está registrado
        const listenerExists = this.events[event].some(registeredListener => registeredListener === listener);
        if (!listenerExists) {
            this.events[event].push(listener);
        }
    }

    // Eliminar un listener de un evento
    off(event, listener) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(registeredListener => registeredListener !== listener);
        }
    }

    // Emitir un evento, notificando a todos los listeners
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(listener => listener(data));
        }
    }

    // Limpiar todas las suscripciones
    clearAll() {
        this.events = {}; // Limpia todas las entradas        
    }
}

export default EventEmitter;
