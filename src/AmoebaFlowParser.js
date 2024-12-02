import { AmoebaSpace } from './AmoebaSpace.js';
import YAML from 'yaml'; // If using a YAML library

export class AmoebaFlowParser {
    constructor() { }

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
    * Validates the structure of a flow object.
    * @param {Object} flow - Flow to validate.
    * @throws {Error} If the structure is invalid.
    */
    static validateStructure(flow) {
        if (!Array.isArray(flow.amebas)) {
            throw new Error('Invalid flow structure. Expected a key "amebas" (array).');
        }

        // Iterate over amoebas and validate each one
        flow.amebas.forEach((ameba, index) => {
            const { id, func, outputEvents } = ameba;

            AmoebaFlowParser.validateId(id, index);
            AmoebaFlowParser.validateFunc(func, id);
            AmoebaFlowParser.validateOutputEvents(outputEvents, id);
        });
    }

    /**
     * Validates the "id" field of an amoeba.
     * @param {string} id - The ID to validate.
     * @param {number} index - Index of the amoeba in the array for debugging.
     */
    static validateId(id, index) {
        if (typeof id !== 'string' || id.trim() === '') {
            throw new Error(
                `Invalid "id" for amoeba at index ${index}. Expected a non-empty string.`
            );
        }
    }

    /**
     * Validates the "func" field of an amoeba.
     * @param {string|function} func - The function to validate.
     * @param {string} amoebaId - The ID of the amoeba for debugging.
     */
    static validateFunc(func, amoebaId) {
        if (typeof func !== 'string' && typeof func !== 'function') {
            throw new Error(
                `Amoeba "${amoebaId}" must have a valid "func" (string or function).`
            );
        }
    }

    /**
     * Validates the "outputEvents" field of an amoeba.
     * @param {Array} outputEvents - The output events to validate.
     * @param {string} amoebaId - The ID of the amoeba for debugging.
     */
    static validateOutputEvents(outputEvents, amoebaId) {
        if (outputEvents === undefined) {
            return; // outputEvents is optional
        }

        if (!Array.isArray(outputEvents)) {
            throw new Error(`Amoeba "${amoebaId}" must have an "outputEvents" array.`);
        }

        outputEvents.forEach((event, index) => {
            if (typeof event === 'string') {
                // Valid direct event
                return;
            }

            if (
                typeof event === 'object' &&
                typeof event.condition === 'string' &&
                Array.isArray(event.outputEvents)
            ) {
                // Attempt to compile the condition to ensure it's a valid function
                try {
                    const conditionFunc = new Function(`return ${event.condition}`)();
                    if (typeof conditionFunc !== 'function') {
                        throw new Error('Condition is not a function.');
                    }
                } catch (error) {
                    throw new Error(
                        `Invalid condition in "outputEvents" at index ${index} in amoeba "${amoebaId}": ${error.message}`
                    );
                }
                // Valid conditional event
                return;
            }

            throw new Error(
                `Invalid "outputEvents" format at index ${index} in amoeba "${amoebaId}". ` +
                `Expected a string or an object with "condition" and "outputEvents".`
            );
        });
    }

    /**
     * Generic parser that converts a flow object to an AmoebaSpace.
     * @param {Object} flow - Processed flow (JSON-like).
     * @returns {AmoebaSpace}
     */
    static parse(flow) {

        const space = new AmoebaSpace();


        flow.amebas.forEach(({ id, func, inputs = [], outputEvents = [] }) => {
            const resolvedFunc = AmoebaFlowParser.resolveFunction(func);

            const inputEvents = inputs.map(input =>
                typeof input === 'string' ? input : input.name
            );

            space.addAmoeba({
                id,
                func: resolvedFunc,
                expectedEvents: inputEvents,
                outputEvents 
            });
        });

        return space;
    }

    /**
     * Creates an AmoebaSpace from a YAML flow.
     * @param {string} yaml - YAML definition.
     * @returns {AmoebaSpace}
     */
    static fromYAML(yaml) {
        try {
            // Parse YAML to JSON-like object
            const flow = YAML.parse(yaml);
            
            AmoebaFlowParser.validateStructure(flow);

            return AmoebaFlowParser.parse(flow);
        } catch (error) {
            throw new Error(`Invalid YAML: ${error.message}`);
        }
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

}
