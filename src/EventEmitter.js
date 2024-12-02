export class EventEmitter {
    constructor() {
        this.events = {}; // Dictionary to store events and their listeners
    }

    // Subscribe a listener to an event
    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        // Prevent duplicate listeners for the same event
        if (!this.events[event].includes(listener)) {
            this.events[event].push(listener);
        }
    }

    // Unsubscribe a listener from an event
    off(event, listener) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(registeredListener => registeredListener !== listener);
        }
    }

    // Emit an event, notifying all listeners
    emit(event, data) {
        if (this.events[event]) {
            console.log(`[EventEmitter] Emitting event "${event}" to ${this.events[event].length} listener(s).`);
            this.events[event].forEach(listener => listener(data));
        } else {
            console.log(`[EventEmitter] No listeners registered for event "${event}".`);
        }
    }

    // Clear all subscriptions
    clearAll() {
        console.log(`[EventEmitter] Clearing all event listeners.`);
        this.events = {}; // Clear all entries
    }

    // Get all listeners for debugging or inspection
    getListeners(event) {
        return this.events[event] || [];
    }
}

export default EventEmitter;
