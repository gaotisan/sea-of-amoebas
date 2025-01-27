import { AmoebaFlowParser } from '../src/AmoebaFlowParser.js';
const testResults = {
    passed: 0,
    failed: 0,
    details: [],
};

function registerResult(testName, passed, message = '') {
    if (passed) {
        testResults.passed += 1;
        console.log(`✅ ${testName} passed.`);
    } else {
        testResults.failed += 1;
        console.error(`❌ ${testName} failed: ${message}`);
    }
    testResults.details.push({ testName, passed, message });
}

async function testExampleFromObject() {
    // Define the workflow as a JavaScript object
    const jsonFlow = {
        amoebas: [
            // Amoeba A: Adds 1 to the input and emits to "Logger",
            // and either B.Input or C.Input based on conditions
            {
                id: 'A',
                func: (x) => x + 1,
                inputs: ['input.x'],
                outputEvents: [
                    "Logger", // Sends all results to Logger, regardless of value
                    {
                        condition: (result) => result > 5, // If result > 5, send to B.Input
                        outputEvents: ["B.Input"]
                    },
                    {
                        condition: (result) => result <= 5, // If result <= 5, send to C.Input
                        outputEvents: ["C.Input"]
                    }
                ]
            },
            // Amoeba B: Multiplies the input by 2 and emits conditionally to D or Logger
            {
                id: 'B',
                func: (y) => y * 2,
                inputs: ['B.Input'],
                outputEvents: [
                    {
                        condition: (result) => result > 15,// If result > 15, send to D.Input
                        outputEvents: ["D.Input"]
                    },
                    {
                        condition: '(result) => result <= 15',// If result <= 15, send to Logger
                        outputEvents: ["Logger"]
                    }
                ]
            },
            // Amoeba C: Subtracts 2 from the input and sends the result to Logger
            {
                id: 'C',
                func: (z) => z - 2,
                inputs: ['C.Input'],
                outputEvents: ["Logger"]
            },
            // Amoeba D: Computes modulus of input with 3
            // While it does not define explicit output events to pass its result to another amoeba,
            // every amoeba emits a default event named `ID.executed` upon completion.
            // This allows you to retrieve its result if needed.
            // Example: Use `await sea.waitForAmoebaExecution("D")` to wait for its execution
            // or `await sea.waitForOutputEvent("D.executed")` to directly capture the emitted event.
            {
                id: 'D',
                func: (w) => w % 3,
                inputs: ['D.Input']
            },
            // Logger: Logs all incoming data
            // If no input events are specified, the amoeba listens for events matching its name by default.
            // This simplify the definition for single-input functions.
            // In this case, "Logger" listens for "Logger" events        
            {
                id: 'Logger',
                func: (data) => console.log(`Log: ${data}`)
            }
        ]
    };
    // Parse the JSON and create the workflow
    const sofa = AmoebaFlowParser.fromObject(jsonFlow);
    // Finalize configuration
    sofa.finalizeConfiguration();
    // Test the workflow with different inputs
    
    const expectedResults = [
        { input: 3, expectedAmoeba: 'C', expectedResult: 2 },
        { input: 6, expectedAmoeba: 'B', expectedResult: 14 },
        { input: 10, expectedAmoeba: 'D', expectedResult: 1 }
    ];

    let allResultsMatch = true;

    for (const { input, expectedAmoeba, expectedResult } of expectedResults) {
        console.log(`Processing input: ${input}`);
        sofa.setInput('input.x', input);
        // Wait for the expected amoeba to execute
        const result = await sofa.waitForAmoebaExecution(expectedAmoeba);

        // Validate the result
        const isResultCorrect = result === expectedResult;
        allResultsMatch = allResultsMatch && isResultCorrect;

        registerResult(
            `Test Web 2 Conditional Flow Execution (Input ${input}, Expected Amoeba: ${expectedAmoeba})`,
            isResultCorrect,
            `Expected result ${expectedResult}, got ${result}`
        );
    }

    registerResult(
        'Test Web 2 Conditional Flow Execution (Overall)',
        allResultsMatch,
        allResultsMatch ? '' : 'One or more results did not match expected values.'
    );
}

async function testTrustedVsUntrustedSources() {
    const example = {
        amoebas: [
            { id: 'A', func: '(x) => x + 1', inputs: ['input.x'], outputEvents: ['Log'] },
            { id: 'Logger', func: '(data) => console.log(`Log: ${data}`)' },
        ],
    };    
    
    // Test trusted source
    try {
        const trustedSea = AmoebaFlowParser.fromObject(example, true);
        trustedSea.finalizeConfiguration();
        trustedSea.setInput('input.x', 2);
        const result = await trustedSea.waitForAmoebaExecution('A');
        registerResult(
            'Test Trusted Source (Execution)',
            result === 3,
            `Expected 3, got ${result}`
        );
    } catch (error) {
        registerResult('Test Trusted Source (Execution)', false, `Unexpected error: ${error.message}`);
    }

    
    // Test untrusted source parsing
    let untrustedSea;
    try {
        untrustedSea = AmoebaFlowParser.fromObject(example, false); // Fuente no confiable        
        registerResult('Test Untrusted Source (Parsing)', false);
    } catch (error) {
        registerResult(
            'Test Untrusted Source (Parsing)',
            true,
            `Parsing failed for untrusted source: ${error.message}`
        );
    }    
        
}

async function testParseFromObject() {
    const jsonFlow = {
        amoebas: [
            {
                id: 'A',
                func: '(x) => x + 1',
                inputs: ['input.x'],
                outputEvents: [
                    "Log",
                    {
                        condition: "(result) => result > 5",
                        outputEvents: ["B.Input", "Logger"]
                    },
                    {
                        condition: "(result) => result <= 5",
                        outputEvents: ["C.Input"]
                    }
                ]
            },
            {
                id: 'B',
                func: '(y) => y * 2',
                inputs: ['B.Input'],
                outputEvents: [
                    {
                        condition: "(result) => result > 15",
                        outputEvents: ["D.Input"]
                    },
                    {
                        condition: "(result) => result <= 15",
                        outputEvents: ["Logger"]
                    }
                ]
            },
            {
                id: 'C',
                func: '(z) => z - 2',
                inputs: ['C.Input'],
                outputEvents: ["Logger"]
            },
            {
                id: 'D',
                func: '(w) => w % 3',
                inputs: ['D.Input']
            },
            {
                id: 'Logger',
                func: '(data) => console.log(`Log: ${data}`)',
            }
        ],
    };

    console.log("Running Object Parsing Test with Unified OutputEvents...");

    // Parse the JSON and create the AmoebaSea
    const sea = AmoebaFlowParser.fromObject(jsonFlow, true);

    // Validate amoebas creation
    const expectedIds = ['A', 'B', 'C', 'D', 'Logger'];
    const actualIds = Object.keys(sea.amoebas);
    const idsMatch = JSON.stringify(expectedIds) === JSON.stringify(actualIds);

    registerResult(
        'Test Parse From Object (Amoeba IDs)',
        idsMatch,
        `Expected IDs: ${JSON.stringify(expectedIds)}, Got: ${JSON.stringify(actualIds)}`
    );

    // Validate one amoeba's configuration
    const amoebaA = sea.amoebas['A'];
    const amoebaAValid =
        amoebaA &&
        amoebaA.expectedEvents.includes('input.x') &&
        amoebaA.outputEvents.some(event => event === 'Log') &&
        amoebaA.outputEvents.some(
            event => typeof event === 'object' && event.condition && Array.isArray(event.outputEvents)
        );

    registerResult(
        'Test Parse From Object (Amoeba A Configuration)',
        amoebaAValid,
        `Amoeba A is not configured correctly. Got: ${JSON.stringify(amoebaA)}`
    );

    // Validate functional execution
    sea.finalizeConfiguration();

    const inputs = [3, 6, 10];
    const results = [];

    for (const input of inputs) {
        console.log(`Testing with input.x = ${input}`);
        sea.setInput('input.x', input);

        let expectedAmoebaId;
        const incremented = input + 1;

        if (incremented <= 5) {
            expectedAmoebaId = 'C';
        } else {
            const bResult = incremented * 2;
            if (bResult > 15) {
                expectedAmoebaId = 'D';
            } else {
                expectedAmoebaId = 'B';
            }
        }

        const result = await sea.waitForAmoebaExecution(expectedAmoebaId);
        results.push({ input, result });
    }

    console.log('Execution results:', results);

    const outputsValid = results.every(({ input, result }) => {
        const incremented = input + 1;

        if (incremented <= 5) {
            // Flow through C
            return result === incremented - 2;
        } else {
            // Flow through B
            const bResult = incremented * 2;
            if (bResult > 15) {
                // Flow through D
                return result === bResult % 3;
            } else {
                // Flow through Logger
                return result === bResult;
            }
        }
    });

    registerResult(
        'Test Parse From Object (Execution Results)',
        outputsValid,
        `Results do not match expected logic. Got: ${JSON.stringify(results)}`
    );
}

async function testParseFromJSON() {
    // JSON Flow como cadena válida
    const jsonFlow = JSON.stringify({
        amoebas: [
            {
                id: 'A',
                func: '(x) => x + 1', // Representado como cadena
                inputs: ['input.x'],
                outputEvents: [
                    "Logger",
                    {
                        condition: "(result) => result > 5", // Representado como cadena
                        outputEvents: ["B.Input"]
                    },
                    {
                        condition: "(result) => result <= 5", // Representado como cadena
                        outputEvents: ["C.Input"]
                    }
                ]
            },
            {
                id: 'B',
                func: '(y) => y * 2', // Representado como cadena
                inputs: ['B.Input'],
                outputEvents: [
                    {
                        condition: "(result) => result > 15", // Representado como cadena
                        outputEvents: ["D.Input"]
                    },
                    {
                        condition: "(result) => result <= 15", // Representado como cadena
                        outputEvents: ["Logger"]
                    }
                ]
            },
            {
                id: 'C',
                func: '(z) => z - 2', // Representado como cadena
                inputs: ['C.Input'],
                outputEvents: ["Logger"]
            },
            {
                id: 'D',
                func: '(w) => w % 3', // Representado como cadena
                inputs: ['D.Input']
            },
            {
                id: 'Logger',
                func: '(data) => console.log(`Log: ${data}`)', // Representado como cadena
            }
        ],
    });

    console.log("Running JSON Parsing Test...");

    try {
        // Parsear el flujo JSON y crear el AmoebaSea
        const sea = AmoebaFlowParser.fromJSON(jsonFlow, true);

        // Validar la creación de las amebas
        const expectedIds = ['A', 'B', 'C', 'D', 'Logger'];
        const actualIds = Object.keys(sea.amoebas);
        const idsMatch = JSON.stringify(expectedIds) === JSON.stringify(actualIds);

        registerResult(
            'Test Parse From JSON (Amoeba IDs)',
            idsMatch,
            `Expected IDs: ${JSON.stringify(expectedIds)}, Got: ${JSON.stringify(actualIds)}`
        );

        // Validar la configuración de la amoeba A
        const amoebaA = sea.amoebas['A'];
        const amoebaAValid =
            amoebaA &&
            amoebaA.expectedEvents.includes('input.x') &&
            amoebaA.outputEvents.some(event => event === 'Logger') &&
            amoebaA.outputEvents.some(
                event => typeof event === 'object' && event.condition && Array.isArray(event.outputEvents)
            );

        registerResult(
            'Test Parse From JSON (Amoeba A Configuration)',
            amoebaAValid,
            `Amoeba A is not configured correctly. Got: ${JSON.stringify(amoebaA)}`
        );

        // Finalizar configuración y ejecutar pruebas funcionales
        sea.finalizeConfiguration();

        const inputs = [3, 6, 10];
        const results = [];

        for (const input of inputs) {
            console.log(`Testing with input.x = ${input}`);
            sea.setInput('input.x', input);

            let expectedAmoebaId;
            const incremented = input + 1;

            if (incremented <= 5) {
                expectedAmoebaId = 'C';
            } else {
                const bResult = incremented * 2;
                if (bResult > 15) {
                    expectedAmoebaId = 'D';
                } else {
                    expectedAmoebaId = 'B';
                }
            }

            const result = await sea.waitForAmoebaExecution(expectedAmoebaId);
            results.push({ input, result });
        }

        console.log('Execution results:', results);

        const outputsValid = results.every(({ input, result }) => {
            const incremented = input + 1;

            if (incremented <= 5) {
                // Flow through C
                return result === incremented - 2;
            } else {
                // Flow through B
                const bResult = incremented * 2;
                if (bResult > 15) {
                    // Flow through D
                    return result === bResult % 3;
                } else {
                    // Flow through Logger
                    return result === bResult;
                }
            }
        });

        registerResult(
            'Test Parse From JSON (Execution Results)',
            outputsValid,
            `Results do not match expected logic. Got: ${JSON.stringify(results)}`
        );

    } catch (error) {
        registerResult('Test Parse From JSON', false, `Unexpected error: ${error.message}`);
    }
}

// Test: Parse and execute from YAML
async function testParseFromYAML() {
    const yamlFlow = `
amoebas:
  - id: A
    func: "(x) => x + 1"
    inputs:
      - input.x
    outputEvents:
      - A.output
  - id: B
    func: "(y) => y * 2"
    inputs:
      - A.output
`;


    // Parse the YAML to create the AmoebaSea
    const sea = AmoebaFlowParser.fromYAML(yamlFlow, true);

    sea.finalizeConfiguration(); // Finalize with B as the target amoeba
    // Define a promise to wait for the final amoeba's execution
    const finalPromise = sea.waitForAmoebaExecution('B');
    sea.setInput('input.x', 4); // Input for amoeba A

    // Wait for the result of amoeba B
    const finalResult = await finalPromise;

    const correctResult = finalResult === 10; // 4 + 1 = 5, 5 * 2 = 10

    registerResult(
        'Test Parse From YAML',
        correctResult,
        correctResult ? `Expected 10, Got ${finalResult}` : `Expected 10, Got ${finalResult}`
    );
}

async function runTest(testFunction, testName) {
    try {
        await testFunction();
    } catch (error) {
        registerResult(testName, false, error.message);
    }
}

// Execute all tests
async function runTests() {
    console.log('Running Tests...');
    await runTest(testExampleFromObject, "Test FromObject");
    await runTest(testTrustedVsUntrustedSources, 'Test Trusted vs Untrusted Sources');
    await runTest(testParseFromObject, 'Test Parse From Object');
    await runTest(testParseFromJSON, 'Test Parse From JSON');    
    await runTest(testParseFromYAML, 'Test Parse From YAML');    

    // Display summary
    console.log('\n--- Test Summary ---');
    if (testResults.passed > 0) {
        console.log(`✅ Passed: ${testResults.passed}`);
    }
    if (testResults.failed > 0) {
        console.log(`❌ Failed: ${testResults.failed}`);
    }
    testResults.details.forEach((result) => {
        console.log(`${result.passed ? '✅' : '❌'} ${result.testName}: ${result.message}`);
    });
    console.log('--- End of Summary ---');
}

runTests();

