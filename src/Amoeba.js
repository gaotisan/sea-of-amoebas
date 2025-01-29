export class Amoeba {
    constructor({ id, func, eventEmitter, storeResults = false, inputEvents = [], outputEvents = [] }) {
        // Validate required properties
        if (!id || typeof id !== 'string') {
            throw new Error("Amoeba 'id' is required and must be a string.");
        }
        if (typeof func !== 'function') {
            throw new Error("Amoeba 'func' is required and must be a function.");
        }
        if (!eventEmitter || typeof eventEmitter.emit !== 'function' || typeof eventEmitter.on !== 'function') {
            throw new Error("Amoeba 'eventEmitter' is required and must be a valid EventEmitter instance.");
        }

        // If inputEvents is undefined, null, or an empty array, set it to [id]
        if (!Array.isArray(inputEvents)) {
            if (inputEvents === undefined || inputEvents === null) {
                inputEvents = [id];
            } else {
                throw new Error(`Amoeba '${id}': 'inputEvents' must be an array.`);
            }
        }

        // If inputEvents is an empty array, default to [id]
        if (inputEvents.length === 0) {
            inputEvents = [id];
        }

        // Validate that all elements in inputEvents are strings
        if (!inputEvents.every(event => typeof event === 'string')) {
            throw new Error(`Amoeba '${id}': 'inputEvents' must be an array of strings.`);
        }

        // Validate outputEvents (must be an array of strings or objects with condition and then)
        if (!Array.isArray(outputEvents)) {
            if (outputEvents === undefined || outputEvents === null) {
                outputEvents = [];
            } else {
                throw new Error(`Amoeba '${id}': 'outputEvents' must be an array.`);
            }
        }

        outputEvents.forEach((event, index) => {
            if (typeof event !== 'string' && typeof event !== 'object') {
                throw new Error(`Amoeba '${id}': 'outputEvents[${index}]' must be a string or an object.`);
            }

            if (typeof event === 'object') {
                // Ensure each output event object contains 'condition' and 'then'
                if (!event.hasOwnProperty('condition') || !event.hasOwnProperty('then')) {
                    throw new Error(`Amoeba '${id}': 'outputEvents[${index}]' must contain 'condition' and 'then'.`);
                }
                if (typeof event.condition !== 'function') {
                    throw new Error(`Amoeba '${id}': 'outputEvents[${index}].condition' must be a function.`);
                }
                if (!Array.isArray(event.then) || !event.then.every(e => typeof e === 'string')) {
                    throw new Error(`Amoeba '${id}': 'outputEvents[${index}].then' must be an array of strings.`);
                }
                if (event.hasOwnProperty('else') && (!Array.isArray(event.else) || !event.else.every(e => typeof e === 'string'))) {
                    throw new Error(`Amoeba '${id}': 'outputEvents[${index}].else' must be an array of strings if defined.`);
                }
            }
        });
        this.id = id;
        this.func = func;
        this.storeResults = storeResults;
        this.inputEvents = inputEvents;
        this.eventEmitter = eventEmitter;
        // Register listeners for the input events
        inputEvents.forEach(eventName => {
            this.eventEmitter.on(eventName, (data) => {
                this.receive(eventName, data);
            });
        });
        const executedEvent = `${id}.executed`; // Ensure an 'executed' event is always included
        this.outputEvents = [executedEvent, ...outputEvents.filter(event => event !== executedEvent)];
        this.receivedData = {}; //Maps event names to their latest received data. * Overwrites previous values if the event is received again. 
        this.ready = false;
        // Internal state tracking
        this.lastResult = null;
        this.executionLog = [];

        console.log(`[${this.id}] Created with input events:`, this.inputEvents);
    }

    setReady() {
        this.ready = true;
        this.checkAndExecute();
    }

    receive(eventName, data) {
        this.receivedData[eventName] = data;
        console.log(`[${this.id}] Receive input state:`, this.receivedData);
        this.checkAndExecute();
    }

    async checkAndExecute() {
        const receivedEvents = Object.keys(this.receivedData);
        if (this.ready && receivedEvents.length === this.inputEvents.length) {
            const args = this.inputEvents.map(eventName => this.receivedData[eventName]);
            const output = await this.func(...args);
            if (this.storeResults) {
                this.lastResult = output;
                this.executionLog.push({ output, timestamp: Date.now() });
            }
            this.emit(output);
        }
    }

    emit(output) {
        if (this.eventEmitter && Object.keys(this.eventEmitter.events).length > 0) {
            this.outputEvents.forEach(event => {
                if (typeof event === "string") {
                    console.log(`[${this.id}] Emitting output event: "${event}" with data:`, output);
                    this.eventEmitter.emit(event, output);
                } else if (typeof event === "object" && event.condition) {
                    try {
                        const isConditionMet = event.condition(output);
                        const eventsToEmit = isConditionMet ? event.then : event.else || [];
                        eventsToEmit.forEach(eventName => {
                            console.log(`[${this.id}] Emitting conditional event: "${eventName}" with data:`, output);
                            this.eventEmitter.emit(eventName, output);
                        });
                    } catch (error) {
                        console.error(`[${this.id}] Error evaluating condition: ${error.message}`);
                    }
                }
            });
        } else {
            console.log(`[${this.id}] Event not emitted because no listeners are registered.`);
        }
    }
}
