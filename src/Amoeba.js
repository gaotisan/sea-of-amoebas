export class Amoeba {
    constructor(id, func, eventEmitter, storeResults = false, expectedEvents = []) {
        this.id = id; 
        this.func = func; 
        this.expectedEvents = expectedEvents; 
        this.receivedData = {}; 
        this.eventEmitter = eventEmitter; 
        this.storeResults = storeResults;
        this.executed = false; 
        this.ready = false;        
        console.log(`[${this.id}] Created with expected events:`, this.expectedEvents);
    }
    
    setReady() {
        this.ready = true;
        this.checkAndExecute();
    }
    
    receive(eventName, data) {
        this.receivedData[eventName] = data;
        console.log(`[${this.id}] Current input state:`, this.receivedData);        
        this.checkAndExecute();
    }

    async checkAndExecute() {
        const receivedEvents = Object.keys(this.receivedData);
        if (this.ready && receivedEvents.length === this.expectedEvents.length && !this.executed) {
            const args = this.expectedEvents.map(eventName => this.receivedData[eventName]);
            const output = await this.func(...args);
            if (this.storeResults) {
                this.result = output; 
            }
            this.emit(output);
            this.executed = true;
        }
    }

    emit(output) {
        const eventName = `${this.id}.output`;
    
        if (this.eventEmitter && Object.keys(this.eventEmitter.events).length > 0) { 
            // Solo emitir si hay listeners registrados
            console.log(`[${this.id}] Emitting event: "${eventName}" with data:`, output);
            this.eventEmitter.emit(eventName, output);
        } else {
            console.log(`[${this.id}] Event not emitted because no listeners are registered.`);
        }
    }
}
