import { Amoeba } from './Amoeba.js';
import EventEmitter from './EventEmitter.js';

export class AmoebaSpace {
    constructor(storeResults = false) {
        this.amoebas = {}; 
        this.eventEmitter = new EventEmitter(); 
        this.finalAmoebas = []; 
        this.storeResults = storeResults;
    }

    addAmoeba(id, func, expectedEvents = []) {
        const ameba = new Amoeba(id, func, this.eventEmitter, this.storeResults, expectedEvents);
        this.amoebas[id] = ameba;        
        if (expectedEvents) {
            expectedEvents.forEach(eventName => {
                this.eventEmitter.on(eventName, (data) => {
                    ameba.receive(eventName, data);
                });
            });
        }
    }

    connect(fromId, toId) {
        const fromEvent = `${fromId}.output`;
        const toAmoeba = this.amoebas[toId];
        if (toAmoeba) {
            toAmoeba.expectedEvents.push(fromEvent);
            this.eventEmitter.on(fromEvent, (data) => {
                toAmoeba.receive(fromEvent, data);
            });
            console.log(`Connected ${fromId} to ${toId}: ${toAmoeba.expectedEvents}`);
        } else {
            throw new Error(`Amoeba with ID ${toId} does not exist.`);
        }
    }

    finalizeConfiguration(finalAmoebaIds = []) {
        this.finalAmoebas = finalAmoebaIds;
        Object.values(this.amoebas).forEach(ameba => ameba.setReady());
    }

    setInput(id, eventName, data) {
        const ameba = this.amoebas[id];
        if (ameba) {
            ameba.receive(eventName, data);
        }
    }

    async waitForCompletion(allMustComplete = true) {
        // Si no hay amoebas finales definidas, selecciona la última amoeba definida
        if (this.finalAmoebas.length === 0) {
            const lastAmoebaId = Object.keys(this.amoebas).pop();
            if (lastAmoebaId) {
                this.finalAmoebas = [lastAmoebaId];
                console.log(`No final amoebas defined. Automatically selected: ${lastAmoebaId}`);
            } else {
                throw new Error('No amoebas defined in the space.');
            }
        }

        if (allMustComplete) {
            // Resolver solo cuando todas las amoebas finales hayan terminado
            return new Promise((resolve) => {
                const results = {};
                let completed = 0;

                this.finalAmoebas.forEach(finalId => {
                    const finalEvent = `${finalId}.output`;
                    this.eventEmitter.on(finalEvent, (result) => {
                        results[finalId] = result;
                        completed++;
                        if (completed === this.finalAmoebas.length) {
                            resolve(results); // Todas las amoebas finales han terminado
                        }
                    });
                });
            });
        } else {
            // Resolver cuando cualquier amoeba final haya terminado
            return new Promise((resolve) => {
                this.finalAmoebas.forEach(finalId => {
                    const finalEvent = `${finalId}.output`;
                    this.eventEmitter.on(finalEvent, (result) => {
                        console.log(`[System] Stopping after completion of: ${finalId}`);
                        this.stopAll(); // Detener el sistema
                        resolve({ [finalId]: result });
                    });
                });
            });
        }
    }

    stopAll() {        
        this.eventEmitter.clearAll(); // Limpiar suscripciones
    }
}
