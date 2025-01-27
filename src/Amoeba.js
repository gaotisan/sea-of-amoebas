export class Amoeba {
    constructor({ id, func, eventEmitter, storeResults = false, expectedEvents = [], outputEvents = [], outputRules = [] }) {        
        if (!id || typeof id !== 'string') {
            throw new Error("Amoeba 'id' is required and must be a string.");
        }
        if (typeof func !== 'function') {
            throw new Error("Amoeba 'func' is required and must be a function.");
        }
        if (!eventEmitter || typeof eventEmitter.emit !== 'function' || typeof eventEmitter.on !== 'function') {
            throw new Error("Amoeba 'eventEmitter' is required and must be a valid EventEmitter instance.");
        }
        this.id = id;
        this.func = func;
        this.eventEmitter = eventEmitter;
        this.storeResults = storeResults;
        this.expectedEvents = expectedEvents;        
        const executedEvent = `${id}.executed`;
        this.outputEvents = [executedEvent, ...outputEvents.filter(event => event !== executedEvent)];
        // Validate that all conditional output events have valid functions
        this.outputEvents.forEach(event => {
            if (typeof event === 'object' && event.condition) {
                if (typeof event.condition !== 'function') {
                    throw new Error(`[${this.id}] Output event condition must be a function.`);
                }
            }
        });
        this.outputRules = outputRules;
        this.receivedData = {};
        this.ready = false;
        console.log(`[${this.id}] Created with expected events:`, this.expectedEvents);
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
        if (this.ready && receivedEvents.length === this.expectedEvents.length) {
            const args = this.expectedEvents.map(eventName => this.receivedData[eventName]);
            const output = await this.func(...args);
            if (this.storeResults) {
                this.result = output;
            }
            this.emit(output);
        }
    }

    emit(output) {
        if (this.eventEmitter && Object.keys(this.eventEmitter.events).length > 0) {            
            this.outputEvents
                .filter(event => typeof event === "string")
                .forEach(eventName => {
                    console.log(`[${this.id}] Emitting output event: "${eventName}" with data:`, output);
                    this.eventEmitter.emit(eventName, output);
                });    
            this.outputEvents
                .filter(event => typeof event === "object" && event.condition)
                .forEach(({ condition, outputEvents }) => {
                    try {                   
                        // Condition is already validated to be a function
                        const isConditionMet = condition(output);   
                        if (isConditionMet) {
                            outputEvents.forEach(eventName => {
                                console.log(`[${this.id}] Emitting conditional event: "${eventName}" with data:`, output);
                                this.eventEmitter.emit(eventName, output);
                            });
                        }
                    } catch (error) {
                        console.error(`[${this.id}] Error evaluating condition: ${error.message}`);
                    }
                });
        } else {
            console.log(`[${this.id}] Event not emitted because no listeners are registered.`);
        }
    }
}
