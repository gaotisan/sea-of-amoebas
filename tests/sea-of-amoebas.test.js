import { AmoebaSpace } from '../src/AmoebaSpace.js';
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

// Test: Sequential execution of amoebas
async function testSequentialExecution() {
    const executionOrder = []; // Array to record the order of execution

    const amebaAFunction = () => executionOrder.push('S1');
    const amebaBFunction = () => executionOrder.push('S2');
    const amebaCFunction = () => executionOrder.push('S3');

    const space = new AmoebaSpace();

    // Add amoebas using object syntax
    space.addAmoeba({
        id: 'S1',
        func: amebaAFunction,
        outputEvents: ['S2']
    });
    space.addAmoeba({
        id: 'S2',
        func: amebaBFunction,
        expectedEvents: ['S2'],
        outputEvents: ['S3']
    });
    space.addAmoeba({
        id: 'S3',
        func: amebaCFunction,
    });

    // Finalize configuration and wait for the last amoeba
    space.finalizeConfiguration();
    space.setInput('S1'); // Trigger the first amoeba
    await space.waitForAmoebaExecution('S3'); // Wait for S3 to finish

    // Validate results
    const executionsCorrect = executionOrder.length === 3;
    const orderCorrect = JSON.stringify(executionOrder) === JSON.stringify(['S1', 'S2', 'S3']);

    registerResult(
        'Test Sequential Execution (Executions Count)',
        executionsCorrect,
        `Expected 3 executions, Got ${executionOrder.length}`
    );
    registerResult(
        'Test Sequential Execution (Order)',
        orderCorrect,
        `Expected order ['S1', 'S2', 'S3'], Got ${JSON.stringify(executionOrder)}`
    );
}


// Test: Chain execution with parameters
async function testCalculationExecution() {
    const suma = (a, b) => a + b;
    const multiplica = (x, y) => x * y;
    const incrementa = async (z) => z + 1;

    const space = new AmoebaSpace();

    // Add amoebas using the new object syntax
    space.addAmoeba({
        id: 'AmoebaA',
        func: suma,
        expectedEvents: ['input.a', 'input.b'],
        outputEvents: ['AmoebaB.input']
    });

    space.addAmoeba({
        id: 'AmoebaB',
        func: multiplica,
        expectedEvents: ['AmoebaB.input', 'input.y'],
        outputEvents: ['AmoebaC.input']
    });

    space.addAmoeba({
        id: 'AmoebaC',
        func: incrementa,
        expectedEvents: ['AmoebaC.input']
    });

    // Finalize configuration and wait for the last amoeba
    space.finalizeConfiguration();
    // Set initial inputs
    space.setInput('input.a', 5); // Valor inicial para 'input.a'
    space.setInput('input.b', 3); // Valor inicial para 'input.b'
    space.setInput('input.y', 2); // Valor inicial para 'input.y'
    const finalResult = await space.waitForAmoebaExecution('AmoebaC');

    // Validate results
    const correctResult = finalResult === 17;

    registerResult(
        'Test Calculation Execution (Final Result)',
        correctResult,
        `Expected 17, Got ${finalResult}`
    );
}

// Test: Mixed Execution and Completion
async function testMixedExecutionAndCompletion() {
    const logResults = [];

    const funcA = () => {
        logResults.push('A executed');
        return 'Result A';
    };
    const funcB = () => {
        logResults.push('B executed');
        return 'Result B';
    };
    const funcC = () => {
        logResults.push('C executed');
        return 'Result C';
    };

    const space = new AmoebaSpace();

    // Add amoebas using new definitions
    space.addAmoeba({
        id: 'A',
        func: funcA,
        outputEvents: ['B.input']
    });

    space.addAmoeba({
        id: 'B',
        func: funcB,
        expectedEvents: ['B.input'],
        outputEvents: ['C.input']
    });

    space.addAmoeba({
        id: 'C',
        func: funcC,
        expectedEvents: ['C.input']
    });

    // Set initial input and trigger execution
    space.finalizeConfiguration();
    space.setInput('A'); // Start by triggering 'A'

    // Wait for a specific amoeba to complete
    const result = await space.waitForAmoebaExecution('C');

    // Validate results
    const correctResults = logResults.includes('A executed') && logResults.includes('B executed') && logResults.includes('C executed');
    const correctFinalResult = result === 'Result C';

    registerResult(
        'Test Mixed Execution and Completion (Logs)',
        correctResults,
        `Expected logs to include 'A executed', 'B executed', and 'C executed'. Got: ${logResults}`
    );

    registerResult(
        'Test Mixed Execution and Completion (Final Result)',
        correctFinalResult,
        `Expected 'Result C', Got: ${result}`
    );
}

// Test: Verify result storage in amoebas
async function testResultStorage() {
    const suma = (a, b) => a + b;
    const multiplica = (x, y) => x * y;
    const incrementa = async (z) => z + 1;

    // Enable result storage
    const space = new AmoebaSpace({ storeResults: true });

    // Add amoebas
    space.addAmoeba({
        id: 'AmoebaA',
        func: suma,
        expectedEvents: ['input.a', 'input.b'],
        outputEvents: ['AmoebaB.input']
    });

    space.addAmoeba({
        id: 'AmoebaB',
        func: multiplica,
        expectedEvents: ['AmoebaB.input', 'input.y'],
        outputEvents: ['AmoebaC.input']
    });

    space.addAmoeba({
        id: 'AmoebaC',
        func: incrementa,
        expectedEvents: ['AmoebaC.input']
    });

    // Finalize configuration
    space.finalizeConfiguration();

    // Set initial inputs
    space.setInput('input.a', 5);
    space.setInput('input.b', 3);
    space.setInput('input.y', 2);

    // Wait for the last amoeba to complete
    const resultC = await space.waitForAmoebaExecution('AmoebaC');

    // Validate that results are stored in the amoebas
    const resultA = space.amoebas['AmoebaA'].result;
    const resultB = space.amoebas['AmoebaB'].result;

    const resultAValid = resultA === 8;
    const resultBValid = resultB === 16;
    const resultCValid = resultC === 17;

    registerResult('Test Result Storage (AmoebaA Result)', resultAValid, `Expected 8, Got ${resultA}`);
    registerResult('Test Result Storage (AmoebaB Result)', resultBValid, `Expected 16, Got ${resultB}`);
    registerResult('Test Result Storage (AmoebaC Result)', resultCValid, `Expected 17, Got ${resultC}`);
}

async function testConditionalEventEmission() {
    const space = new AmoebaSpace();
    
    space.addAmoeba({
        id: 'ConditionTrue',
        func: (x) => x * 2,
        expectedEvents: ['input.x'],
        outputEvents: [
            {
                condition: '(result) => result > 10',
                outputEvents: ['HighValue']
            }
        ]
    });
    
    space.addAmoeba({
        id: 'ConditionFalse',
        func: (x) => x + 2,
        expectedEvents: ['input.x'],
        outputEvents: [
            {
                condition: '(result) => result < 5',
                outputEvents: ['LowValue']
            }
        ]
    });
    
    let highValueTriggered = false;
    let lowValueTriggered = false;

    space.eventEmitter.on('HighValue', () => {
        highValueTriggered = true;
    });

    space.eventEmitter.on('LowValue', () => {
        lowValueTriggered = true;
    });


    space.finalizeConfiguration();

    const promiseConditionTrue = space.waitForAmoebaExecution('ConditionTrue');
    const promiseConditionFalse = space.waitForAmoebaExecution('ConditionFalse');

    space.setInput('input.x', 6);

    await promiseConditionTrue;
    await promiseConditionFalse;

    registerResult(
        'Test Conditional Event Emission (Condition True)',
        highValueTriggered,
        highValueTriggered ? '' : 'HighValue event was not triggered.'
    );

    registerResult(
        'Test Conditional Event Emission (Condition False)',
        !lowValueTriggered,
        lowValueTriggered ? 'LowValue event was incorrectly triggered.' : ''
    );
}

async function testInvalidConditionHandling() {
    const space = new AmoebaSpace();

    let errorLogged = false;
    
    const originalConsoleError = console.error;
    console.error = (message) => {
        if (message.includes('Error evaluating condition')) {
            errorLogged = true;
        }
        originalConsoleError(message);
    };

    space.addAmoeba({
        id: 'InvalidCondition',
        func: (x) => x * 2,
        expectedEvents: ['input.x'],
        outputEvents: [
            {
                condition: '(result) => ', // Invalid
                outputEvents: ['InvalidEvent']
            }
        ]
    });
    
    space.finalizeConfiguration();
    space.setInput('input.x', 5);

    await space.waitForAmoebaExecution('InvalidCondition');

    console.error = originalConsoleError;

    registerResult(
        'Test Invalid Condition Handling',
        errorLogged,
        errorLogged ? '' : 'Error in invalid condition was not logged.'
    );
}


async function testParseFromJSON() {
    const jsonFlow = {
        amebas: [
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

    console.log("Running JSON Parsing Test with Unified OutputEvents...");

    // Parse the JSON and create the AmoebaSpace
    const space = AmoebaFlowParser.fromJSON(jsonFlow);

    // Validate amoebas creation
    const expectedIds = ['A', 'B', 'C', 'D', 'Logger'];
    const actualIds = Object.keys(space.amoebas);
    const idsMatch = JSON.stringify(expectedIds) === JSON.stringify(actualIds);

    registerResult(
        'Test Parse From JSON (Amoeba IDs)',
        idsMatch,
        `Expected IDs: ${JSON.stringify(expectedIds)}, Got: ${JSON.stringify(actualIds)}`
    );

    // Validate one amoeba's configuration
    const amoebaA = space.amoebas['A'];
    const amoebaAValid =
        amoebaA &&
        amoebaA.expectedEvents.includes('input.x') && 
        amoebaA.outputEvents.some(event => event === 'Log') && 
        amoebaA.outputEvents.some(
            event => typeof event === 'object' && event.condition && Array.isArray(event.outputEvents)
        ); 

    registerResult(
        'Test Parse From JSON (Amoeba A Configuration)',
        amoebaAValid,
        `Amoeba A is not configured correctly. Got: ${JSON.stringify(amoebaA)}`
    );

    // Validate functional execution
    space.finalizeConfiguration();

    const inputs = [3, 6, 10];
    const results = [];

    for (const input of inputs) {
        console.log(`Testing with input.x = ${input}`);
        space.setInput('input.x', input);
        
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
        
        const result = await space.waitForAmoebaExecution(expectedAmoebaId);
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
}

// Test: Parse and execute from YAML
async function testParseFromYAML() {
    const yamlFlow = `
amebas:
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


    // Parse the YAML to create the AmoebaSpace
    const space = AmoebaFlowParser.fromYAML(yamlFlow);
        
    space.finalizeConfiguration(); // Finalize with B as the target amoeba
    // Define a promise to wait for the final amoeba's execution
    const finalPromise = space.waitForAmoebaExecution('B');
    space.setInput('input.x', 4); // Input for amoeba A
    
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
    await runTest(testSequentialExecution, 'Test Sequential Execution');
    await runTest(testCalculationExecution, 'Test Calculation Execution');
    await runTest(testMixedExecutionAndCompletion, 'Test Mixed Execution and Completion');
    await runTest(testResultStorage, 'Test Result Storage');
    await runTest(testConditionalEventEmission, "Test Conditional Event Emission");
    await runTest(testInvalidConditionHandling, "Test Invalid Conditional Handling")
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

