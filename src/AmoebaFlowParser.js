import { AmoebaSpace } from './AmoebaSpace.js';
import YAML from 'yaml'; // If using a YAML library

export class AmoebaFlowParser {
    constructor() {}

    /**
     * Creates an AmoebaSpace from a JSON flow.
     * @param {Object|string} json - JSON definition or JSON string.
     * @returns {AmoebaSpace}
     */
    static fromJSON(json) {
        let parsedJSON;

        // Validate and parse JSON string if necessary
        if (typeof json === 'string') {
            try {
                parsedJSON = JSON.parse(json);
            } catch (error) {
                throw new Error(`Invalid JSON string: ${error.message}`);
            }
        } else if (typeof json === 'object' && json !== null) {
            parsedJSON = json;
        } else {
            throw new Error('Input must be a valid JSON object or string.');
        }

        // Validate minimum structure
        AmoebaFlowParser.validateStructure(parsedJSON);

        return AmoebaFlowParser.parse(parsedJSON);
    }

    /**
     * Creates an AmoebaSpace from a YAML flow.
     * @param {string} yaml - YAML definition.
     * @returns {AmoebaSpace}
     */
    static fromYAML(yaml) {
        try {
            const json = YAML.parse(yaml); // Convert YAML to JSON
            AmoebaFlowParser.validateStructure(json); // Validate structure
            return AmoebaFlowParser.parse(json);
        } catch (error) {
            throw new Error(`Invalid YAML: ${error.message}`);
        }
    }

    /**
     * Creates an AmoebaSpace from a Mermaid flow definition.
     * @param {string} mermaidText - Mermaid definition.
     * @returns {AmoebaSpace}
     */
    static fromMermaid(mermaidText) {
        try {
            const parsedData = AmoebaFlowParser.parseMermaid(mermaidText);
            AmoebaFlowParser.validateStructure(parsedData); // Validate structure
            return AmoebaFlowParser.parse(parsedData);
        } catch (error) {
            throw new Error(`Invalid Mermaid syntax: ${error.message}`);
        }
    }

    /**
     * Generic parser that converts a flow object to an AmoebaSpace.
     * @param {Object} flow - Processed flow (JSON-like).
     * @returns {AmoebaSpace}
     */
    static parse(flow) {
        const space = new AmoebaSpace();

        // Add amoebas
        flow.amebas.forEach(({ id, func, inputs }) => {
            const resolvedFunc = AmoebaFlowParser.resolveFunction(func);
            space.addAmoeba(id, resolvedFunc, inputs || []);
        });

        // Connect amoebas
        flow.connections.forEach(({ from, to }) => {
            space.connect(from, to);
        });

        return space;
    }

    /**
     * Parses a Mermaid text into a JSON-like flow object.
     * @param {string} mermaidText
     * @returns {Object} - Equivalent flow.
     */
    static parseMermaid(mermaidText) {
        const lines = mermaidText.split('\n').map(line => line.trim()).filter(Boolean);
    
        const amebas = [];
        const connections = [];
    
        lines.forEach(line => {
            // Match nodes with Mermaid syntax like A((x => x + 1|input.x))
            const nodeMatch = line.match(/^(\w+)\(\(\s*([^|]+)\|\s*(.+?)\s*\)\)$/);
            if (nodeMatch) {
                const [, id, func, inputs] = nodeMatch;
    
                const parsedInputs = inputs.split(',').map(input => input.trim());
                amebas.push({ id, func: func.trim(), inputs: parsedInputs });
                return;
            }
    
            // Match connections like A --> B
            const connectionMatch = line.match(/^(\w+)\s*-->\s*(\w+)$/);
            if (connectionMatch) {
                const [, from, to] = connectionMatch;
                connections.push({ from, to });
                return;
            }
        });
    
        if (amebas.length === 0 && connections.length === 0) {
            throw new Error('Invalid Mermaid syntax. No valid nodes or connections found.');
        }
    
        // Post-process connections to ensure completeness
        connections.forEach(({ from, to }) => {
            const targetAmoeba = amebas.find(a => a.id === to);
            if (targetAmoeba) {
                const fromEvent = `${from}.output`;
                if (!targetAmoeba.inputs.includes(fromEvent)) {
                    targetAmoeba.inputs.push(fromEvent);
                }
            }
        });
    
        console.log("Check amebas in Mermaid:", amebas);
        console.log("Check connections in Mermaid:", connections);
        return { amebas, connections };
    }
    
    /**
     * Converts a string representation of a function to an executable function.
     * @param {string | Function} func
     * @returns {Function}
     */
    static resolveFunction(func) {
        if (typeof func === 'function') {
            return func;
        }
        if (typeof func === 'string') {
            try {
                return new Function(`return ${func}`)();
            } catch (error) {
                throw new Error(`Error resolving function: ${error.message}`);
            }
        }
        throw new Error(`Invalid function: ${func}`);
    }

    /**
     * Validates the structure of a flow object.
     * @param {Object} flow - Flow to validate.
     * @throws {Error} If the structure is invalid.
     */
    static validateStructure(flow) {
        if (!Array.isArray(flow.amebas) || !Array.isArray(flow.connections)) {
            throw new Error('Invalid flow structure. Expected keys: "amebas" (array) and "connections" (array).');
        }

        flow.amebas.forEach(({ id, func }) => {
            if (typeof id !== 'string' || id.trim() === '') {
                throw new Error('Each amoeba must have a valid "id" (non-empty string).');
            }
            if (typeof func !== 'string' && typeof func !== 'function') {
                throw new Error(`Amoeba "${id}" must have a valid "func" (string or function).`);
            }
        });

        flow.connections.forEach(({ from, to }) => {
            if (typeof from !== 'string' || from.trim() === '' || typeof to !== 'string' || to.trim() === '') {
                throw new Error('Each connection must specify "from" and "to" as non-empty strings.');
            }
        });
    }
}
