export class Amoeba {
    constructor(id, func, eventEmitter, expectedEvents = []) {
        this.id = id; // Identificador único de la ameba
        this.func = func; // Función que realiza esta ameba
        this.expectedEvents = expectedEvents; // Eventos esperados como entrada
        this.receivedData = {}; // Datos recibidos de los eventos
        this.executed = false; // Indica si ya ejecutó su función
        this.ready = false;        
        this.eventEmitter = eventEmitter; // Se inicializa como null
        console.log(`[${this.id}] Creada con eventos esperados:`, this.expectedEvents);
    }
    
    setReady() {
        this.ready = true;
        this.checkAndExecute();
    }
    
    receive(eventName, data) {
        this.receivedData[eventName] = data;
        console.log(`[${this.id}] Estado actual de entradas:`, this.receivedData);
        this.checkAndExecute();
    }

    async checkAndExecute() {
        const receivedEvents = Object.keys(this.receivedData);
        if (this.ready && receivedEvents.length === this.expectedEvents.length && !this.executed) {
            const args = this.expectedEvents.map(eventName => this.receivedData[eventName]);
            console.log(`[${this.id}] Ejecutando función con argumentos:`, args);
            const output = await this.func(...args);
            console.log(`[${this.id}] Generó salida:`, output);
            this.emit(output);
            this.executed = true;
        }
    }

    emit(output) {
        const eventName = `${this.id}.output`;        
        if (this.eventEmitter) {
            console.log(`[${this.id}] Emite evento: "${eventName}" con datos:`, output);
            this.eventEmitter.emit(eventName, output);
        } else {
            console.error(`[${this.id}] Error: No hay un eventEmitter configurado.`);
        }
    }
}
