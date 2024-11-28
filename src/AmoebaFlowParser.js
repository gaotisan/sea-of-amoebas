import { AmoebaSpace } from './AmoebaSpace.js';
import YAML from 'yaml'; // Si usas una librería para YAML

export class AmoebaFlowParser {
    constructor() {}

    /**
     * Crea un espacio de amebas a partir de un flujo en JSON.
     * @param {Object} json - Definición en JSON.
     * @returns {AmoebaSpace}
     */
    static fromJSON(json) {
        return AmoebaFlowParser.parse(json);
    }

    /**
     * Crea un espacio de amebas a partir de un flujo en YAML.
     * @param {string} yaml - Definición en YAML.
     * @returns {AmoebaSpace}
     */
    static fromYAML(yaml) {
        const json = YAML.parse(yaml); // Convertir YAML a JSON
        return AmoebaFlowParser.parse(json);
    }

    /**
     * Crea un espacio de amebas a partir de un flujo en Mermaid.
     * @param {string} mermaidText - Definición en Mermaid.
     * @returns {AmoebaSpace}
     */
    static fromMermaid(mermaidText) {
        const parsedData = AmoebaFlowParser.parseMermaid(mermaidText);
        return AmoebaFlowParser.parse(parsedData);
    }

    /**
     * Realiza el parseo genérico de un flujo a un `AmoebaSpace`.
     * @param {Object} flow - Flujo procesado (JSON-like).
     * @returns {AmoebaSpace}
     */
    static parse(flow) {
        const space = new AmoebaSpace();

        // Crear amebas
        flow.amebas.forEach(({ id, func, inputs }) => {
            const resolvedFunc = AmoebaFlowParser.resolveFunction(func);
            space.addAmoeba(id, resolvedFunc, inputs || []);
        });

        // Crear conexiones
        flow.connections.forEach(({ from, to }) => {
            space.connect(from, to);
        });

        return space;
    }

    /**
     * Convierte un texto Mermaid en un flujo JSON-like.
     * @param {string} mermaidText
     * @returns {Object} - Flujo equivalente.
     */
    static parseMermaid(mermaidText) {
        const lines = mermaidText.split('\n').map(line => line.trim()).filter(Boolean);

        const amebas = [];
        const connections = [];

        lines.forEach(line => {
            const nodeMatch = line.match(/^(\w+)\(([^)]+)\)$/);
            if (nodeMatch) {
                const [, id, func] = nodeMatch;
                amebas.push({ id, func, inputs: [] });
                return;
            }

            const connectionMatch = line.match(/^(\w+)\s*-->\s*(\w+)$/);
            if (connectionMatch) {
                const [, from, to] = connectionMatch;
                connections.push({ from, to });
                return;
            }
        });

        return { amebas, connections };
    }

    /**
     * Convierte un string de función a una función ejecutable.
     * @param {string | Function} func
     * @returns {Function}
     */
    static resolveFunction(func) {
        if (typeof func === 'function') {
            return func;
        }
        if (typeof func === 'string') {
            return new Function(`return ${func}`)();
        }
        throw new Error(`Función no válida: ${func}`);
    }
}
