import { Amoeba } from './Amoeba.js';
import EventEmitter from './EventEmitter.js';

export class AmoebaSpace {
    constructor({ eventEmitter = null, storeResults = false } = {}) {
        this.amoebas = {};
        this.eventEmitter = eventEmitter || new EventEmitter();
        this.storeResults = storeResults;
    }

    addAmoeba({ id, func, expectedEvents = [], outputEvents = [], outputRules = [] }) {
        if (expectedEvents.length === 0) {
            //console.warn(`[AmoebaSpace] Amoeba "${id}" has no explicit inputs. Defaulting to its own ID as input.`);
            expectedEvents.push(id);            
        }
        const ameba = new Amoeba({ id, func, eventEmitter: this.eventEmitter, storeResults: this.storeResults, expectedEvents, outputEvents, outputRules });
        this.amoebas[id] = ameba;

        // Register listeners for the expected events
        expectedEvents.forEach(eventName => {
            this.eventEmitter.on(eventName, (data) => {
                ameba.receive(eventName, data);
            });
        });        
    }    

    finalizeConfiguration() {        
        Object.values(this.amoebas).forEach(ameba => ameba.setReady());
    }

    setInput(eventName, data) {
        console.log(`[AmoebaSpace] Introducing event: "${eventName}" with data:`, data);
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
        this.eventEmitter.clearAll(); // Limpiar suscripciones
    }
}
