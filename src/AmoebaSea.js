import { Amoeba } from './Amoeba.js';
import EventEmitter from './EventEmitter.js';

export class AmoebaSea {
    constructor({ eventEmitter = null, storeResults = false } = {}) {
        this.amoebas = {};
        this.eventEmitter = eventEmitter || new EventEmitter();
        this.storeResults = storeResults;
    }

    addAmoeba({ id, func, expectedEvents = [], outputEvents = [], outputRules = [] }) {
        if (expectedEvents.length === 0) {
            //console.warn(`[AmoebaSea] Amoeba "${id}" has no explicit inputs. Defaulting to its own ID as input.`);
            expectedEvents.push(id);            
        }
        const amoeba = new Amoeba({ id, func, eventEmitter: this.eventEmitter, storeResults: this.storeResults, expectedEvents, outputEvents, outputRules });
        this.amoebas[id] = amoeba;

        // Register listeners for the expected events
        expectedEvents.forEach(eventName => {
            this.eventEmitter.on(eventName, (data) => {
                amoeba.receive(eventName, data);
            });
        });        
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
        this.eventEmitter.clearAll(); // Limpiar suscripciones
    }
}
