import { Amoeba } from './Amoeba.js';
import EventEmitter from './EventEmitter.js';

export class AmoebaSpace {
    constructor() {
        this.amoebas = {}; // Diccionario para almacenar las amebas
        this.eventEmitter = new EventEmitter(); // EventEmitter dedicado
    }

    addAmoeba(id, func, expectedEvents = []) {
        const ameba = new Amoeba(id, func, this.eventEmitter, expectedEvents);
        this.amoebas[id] = ameba;
        // Registrar suscripciones centralizadas para los eventos esperados
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
            console.log(`Conectadas ${fromId} con ${toId}: ${toAmoeba.expectedEvents}`);
        } else {
            throw new Error(`La ameba con ID ${toId} no existe.`);
        }
    }

    finalizeConfiguration() {
        Object.values(this.amoebas).forEach(ameba => ameba.setReady());
    }

    setInput(id, eventName, data) {
        const ameba = this.amoebas[id];
        if (ameba) {
            ameba.receive(eventName, data);
        }
    }
}
