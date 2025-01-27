import { AmoebaSea } from './AmoebaSea.js';
import YAML from 'yaml'; // If using a YAML library

export class AmoebaFlowParser {
    constructor() { }

    /**
     * Directly parses a flow object into an AmoebaSea without requiring JSON conversion.
     * @param {Object} flow - Flow definition as a JavaScript object.
     * @param {boolean} isTrustedSource - Whether the source is trusted.
     * @returns {AmoebaSea}
     */
    static fromObject(flow, isTrustedSource = true) {
        // Validate the flow structure directly
        AmoebaFlowParser.validateStructure(flow, isTrustedSource);

        // Parse the flow into an AmoebaSea
        return AmoebaFlowParser.parse(flow, isTrustedSource);
    }

    /**
     * Creates an AmoebaSea from a JSON flow.
     * @param {Object|string} json - JSON definition or JSON string.
     * @param {boolean} isTrustedSource - Whether the source of the JSON is trusted.
     * @returns {AmoebaSea}
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
        AmoebaFlowParser.validateStructure(parsedJSON, true);

        return AmoebaFlowParser.parse(parsedJSON, true);
    }

    /**
     * Creates an AmoebaSea from a YAML flow.
     * @param {string} yaml - YAML definition.
     * @param {boolean} isTrustedSource - Whether the source is trusted.
     * @returns {AmoebaSea}
     */
    static fromYAML(yaml) {
        try {
            const flow = YAML.parse(yaml);

            AmoebaFlowParser.validateStructure(flow, true);

            return AmoebaFlowParser.parse(flow, true);
        } catch (error) {
            throw new Error(`Invalid YAML: ${error.message}`);
        }
    }

    /**
     * Validates the structure of a flow object.
     * @param {Object} flow - Flow to validate.
     * @param {boolean} isTrustedSource - Whether the source is trusted.
     * @throws {Error} If the structure is invalid.
     */
    static validateStructure(flow, isTrustedSource) {
        if (!Array.isArray(flow.amoebas)) {
            throw new Error('Invalid flow structure. Expected a key "amoebas" (array).');
        }

        // Iterate over amoebas and validate each one
        flow.amoebas.forEach((amoeba, index) => {
            const { id, func, outputEvents } = amoeba;

            AmoebaFlowParser.validateId(id, index);

            // Validate functions and conditions based on source trust
            AmoebaFlowParser.validateFunc(func, id, isTrustedSource);
            AmoebaFlowParser.validateOutputEvents(outputEvents, id, isTrustedSource);
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
     * @param {boolean} isTrustedSource - Whether the source is trusted.
     */
    static validateFunc(func, amoebaId, isTrustedSource) {
        if (typeof func === 'function') {
            return;
        }

        if (isTrustedSource && typeof func === 'string') {
            try {
                // Validate if the string can be converted to a function
                AmoebaFlowParser.resolveFunction(func);
            } catch (error) {
                throw new Error(
                    `Invalid "func" in amoeba "${amoebaId}". Failed to parse function: ${error.message}`
                );
            }
            return;
        }

        throw new Error(
            `Amoeba "${amoebaId}" must have a valid "func" (function or string from a trusted source).`
        );
    }

    /**
     * Validates the "outputEvents" field of an amoeba.
     * @param {Array} outputEvents - The output events to validate.
     * @param {string} amoebaId - The ID of the amoeba for debugging.
     * @param {boolean} isTrustedSource - Whether the source is trusted.
     */
    static validateOutputEvents(outputEvents, amoebaId, isTrustedSource) {
        if (outputEvents === undefined) {
            return; // outputEvents es opcional
        }

        if (!Array.isArray(outputEvents)) {
            throw new Error(`Amoeba "${amoebaId}" must have an "outputEvents" array.`);
        }

        outputEvents.forEach((event, index) => {
            if (typeof event === 'string') {
                // Evento directo válido
                return;
            }

            if (
                typeof event === 'object' &&
                (typeof event.condition === 'function' || (isTrustedSource && typeof event.condition === 'string')) &&
                Array.isArray(event.outputEvents)
            ) {
                // Validar condición si es cadena (fuente confiable)
                if (typeof event.condition === 'string' && isTrustedSource) {
                    try {
                        AmoebaFlowParser.resolveFunction(event.condition);
                    } catch (error) {
                        throw new Error(
                            `Invalid condition in "outputEvents" at index ${index} in amoeba "${amoebaId}": ${error.message}`
                        );
                    }
                }

                return; // Evento válido
            }

            throw new Error(
                `Invalid "outputEvents" format at index ${index} in amoeba "${amoebaId}". ` +
                `Expected a string or an object with "condition" and "outputEvents".`
            );
        });
    }

    /**
     * Generic parser that converts a flow object to an AmoebaSea.
     * @param {Object} flow - Processed flow (JSON-like).
     * @param {boolean} isTrustedSource - Whether the source is trusted.
     * @returns {AmoebaSea}
     */
    static parse(flow, isTrustedSource) {
        const sea = new AmoebaSea();

        flow.amoebas.forEach(({ id, func, inputs = [], outputEvents = [] }) => {
            const resolvedFunc = typeof func === 'function'
                ? func
                : isTrustedSource
                    ? AmoebaFlowParser.resolveFunction(func)
                    : () => {
                        throw new Error(
                            `Execution of functions is not allowed for untrusted sources.`
                        );
                    };

            const resolvedOutputEvents = outputEvents.map((event) => {
                        if (typeof event === 'string') {
                            return event; // Evento directo
                        }

                        if (event.condition && Array.isArray(event.outputEvents)) {
                            const resolvedCondition = typeof event.condition === 'function'
                                ? event.condition // Condición como función
                                : isTrustedSource
                                    ? AmoebaFlowParser.resolveFunction(event.condition) // Resolver condición como cadena
                                    : () => {
                                        throw new Error(
                                            `Execution of conditions is not allowed for untrusted sources.`
                                        );
                                    };
                            return {
                                ...event,
                                condition: resolvedCondition,
                            };
                        }

                        throw new Error(
                            `Invalid output event format in amoeba "${id}".`
                        );
                    });

            const inputEvents = inputs.map((input) =>
                typeof input === 'string' ? input : input.name
            );

            sea.addAmoeba({
                id,
                func: resolvedFunc,
                expectedEvents: inputEvents,
                outputEvents: resolvedOutputEvents,
            });
        });

        return sea;
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
