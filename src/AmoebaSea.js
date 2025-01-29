import { Amoeba } from './Amoeba.js';
import EventEmitter from './EventEmitter.js';

export class AmoebaSea {
    constructor({ eventEmitter = null, storeResults = false } = {}) {
        this.amoebas = {};
        this.eventEmitter = eventEmitter || new EventEmitter();
        this.storeResults = storeResults;
    }

    addAmoeba({ id, func, inputEvents = [], outputEvents = [], storeResults = null }) {
        
        const finalStoreResults = storeResults !== null ? storeResults : this.storeResults;

        const amoeba = new Amoeba({ 
            id, 
            func, 
            eventEmitter: this.eventEmitter, 
            storeResults: finalStoreResults, 
            inputEvents, 
            outputEvents,             
        });           
        this.amoebas[id] = amoeba;
        
    }    

    finalizeConfiguration() {        
        Object.values(this.amoebas).forEach(amoeba => amoeba.setReady());
    }

    setInput(eventName, data) {
        console.log(`[AmoebaSea] Introducing event: "${eventName}" with data:`, data);
        this.eventEmitter.emit(eventName, data);
    }

    async waitForOuputEvent(eventName) {
        return new Promise((resolve) => {            
            this.eventEmitter.on(eventName, (data) => {                
                resolve(data);
            });
        });
    }

    async waitForAmoebaExecution(amoebaId) {
        const outputEvent = `${amoebaId}.executed`;
        return this.waitForOuputEvent(outputEvent);
    }

    stopAll() {
        this.eventEmitter.clearAll(); 
    }
}
