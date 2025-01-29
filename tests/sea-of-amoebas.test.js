import { AmoebaSea } from '../src/AmoebaSea.js';

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

    const amoebaAFunction = () => executionOrder.push('S1');
    const amoebaBFunction = () => executionOrder.push('S2');
    const amoebaCFunction = () => executionOrder.push('S3');

    const sea = new AmoebaSea();

    // Add amoebas using object syntax
    sea.addAmoeba({
        id: 'S1',
        func: amoebaAFunction,
        outputEvents: ['S2']
    });
    sea.addAmoeba({
        id: 'S2',
        func: amoebaBFunction,
        inputEvents: ['S2'],
        outputEvents: ['S3']
    });
    sea.addAmoeba({
        id: 'S3',
        func: amoebaCFunction,
    });

    // Finalize configuration and wait for the last amoeba
    sea.finalizeConfiguration();
    sea.setInput('S1'); // Trigger the first amoeba
    await sea.waitForAmoebaExecution('S3'); // Wait for S3 to finish

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
    const add = (a, b) => a + b;
    const multiply = (x, y) => x * y;
    const increment = async (z) => z + 1;

    const sea = new AmoebaSea();

    // Add amoebas using the new object syntax
    sea.addAmoeba({
        id: 'AmoebaA',
        func: add,
        inputEvents: ['input.a', 'input.b'],
        outputEvents: ['AmoebaB.input']
    });

    sea.addAmoeba({
        id: 'AmoebaB',
        func: multiply,
        inputEvents: ['AmoebaB.input', 'input.y'],
        outputEvents: ['AmoebaC.input']
    });

    sea.addAmoeba({
        id: 'AmoebaC',
        func: increment,
        inputEvents: ['AmoebaC.input']
    });

    // Finalize configuration and wait for the last amoeba
    sea.finalizeConfiguration();
    // Set initial inputs
    sea.setInput('input.a', 5);
    sea.setInput('input.b', 3);
    sea.setInput('input.y', 2);
    const finalResult = await sea.waitForAmoebaExecution('AmoebaC');

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

    const sea = new AmoebaSea();

    // Add amoebas using new definitions
    sea.addAmoeba({
        id: 'A',
        func: funcA,
        outputEvents: ['B.input']
    });

    sea.addAmoeba({
        id: 'B',
        func: funcB,
        inputEvents: ['B.input'],
        outputEvents: ['C.input']
    });

    sea.addAmoeba({
        id: 'C',
        func: funcC,
        inputEvents: ['C.input']
    });

    // Set initial input and trigger execution
    sea.finalizeConfiguration();
    sea.setInput('A'); // Start by triggering 'A'

    // Wait for a specific amoeba to complete
    const result = await sea.waitForAmoebaExecution('C');

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
    const sea = new AmoebaSea({ storeResults: true });

    // Add amoebas
    sea.addAmoeba({
        id: 'AmoebaA',
        func: suma,
        inputEvents: ['input.a', 'input.b'],
        outputEvents: ['AmoebaB.input']
    });

    sea.addAmoeba({
        id: 'AmoebaB',
        func: multiplica,
        inputEvents: ['AmoebaB.input', 'input.y'],
        outputEvents: ['AmoebaC.input']
    });

    sea.addAmoeba({
        id: 'AmoebaC',
        func: incrementa,
        inputEvents: ['AmoebaC.input']
    });

    // Finalize configuration
    sea.finalizeConfiguration();

    // Set initial inputs
    sea.setInput('input.a', 5);
    sea.setInput('input.b', 3);
    sea.setInput('input.y', 2);

    // Wait for the last amoeba to complete
    const resultC = await sea.waitForAmoebaExecution('AmoebaC');

    // Validate that results are stored in the amoebas
    const resultA = sea.amoebas['AmoebaA'].lastResult;
    const resultB = sea.amoebas['AmoebaB'].lastResult;

    const resultAValid = resultA === 8;
    const resultBValid = resultB === 16;
    const resultCValid = resultC === 17;

    registerResult('Test Result Storage (AmoebaA Result)', resultAValid, `Expected 8, Got ${resultA}`);
    registerResult('Test Result Storage (AmoebaB Result)', resultBValid, `Expected 16, Got ${resultB}`);
    registerResult('Test Result Storage (AmoebaC Result)', resultCValid, `Expected 17, Got ${resultC}`);
}

async function testConditionalEventEmission() {
    const sea = new AmoebaSea();

    // Amoeba with a condition that triggers 'HighValue' if true and 'NotHighValue' if false
    sea.addAmoeba({
        id: 'ConditionWithElse',
        func: (x) => x * 2,
        inputEvents: ['input.x'],
        outputEvents: [
            {
                condition: (result) => result > 10,
                then: ['HighValue'],
                else: ['NotHighValue']
            }
        ]
    });

    // Amoeba with a condition that triggers 'LowValue' if true (no else specified)
    sea.addAmoeba({
        id: 'ConditionWithoutElse',
        func: (x) => x + 2,
        inputEvents: ['input.x'],
        outputEvents: [
            {
                condition: (result) => result < 5,
                then: ['LowValue']
            }
        ]
    });

    // Event tracking
    let highValueTriggered = false;
    let notHighValueTriggered = false;
    let lowValueTriggered = false;

    // Listeners for events
    sea.eventEmitter.on('HighValue', () => {
        highValueTriggered = true;
    });

    sea.eventEmitter.on('NotHighValue', () => {
        notHighValueTriggered = true;
    });

    sea.eventEmitter.on('LowValue', () => {
        lowValueTriggered = true;
    });

    // Finalize configuration
    sea.finalizeConfiguration();

    // Set up promises for execution
    const promiseConditionWithElse = sea.waitForAmoebaExecution('ConditionWithElse');
    const promiseConditionWithoutElse = sea.waitForAmoebaExecution('ConditionWithoutElse');

    // Trigger an input event
    sea.setInput('input.x', 6);

    // Await promises
    await promiseConditionWithElse;
    await promiseConditionWithoutElse;

    // Validate results
    registerResult(
        'Test Conditional Event Emission with Else',
        highValueTriggered && !notHighValueTriggered,
        highValueTriggered
            ? ''
            : 'HighValue event was not triggered or NotHighValue was incorrectly triggered.'
    );

    registerResult(
        'Test Conditional Event Emission without Else',
        !lowValueTriggered,
        lowValueTriggered
            ? 'LowValue event was incorrectly triggered.'
            : 'LowValue was correctly not triggered (as expected).'
    );
}

async function testInvalidConditionHandling() {
    const sea = new AmoebaSea();

    let errorDetected = false;


    const originalConsoleError = console.error;
    console.error = (message) => {
        if (message.includes('[InvalidCondition] Output event condition must be a function.')) {
            errorDetected = true;
        }
        originalConsoleError(message);
    };

    errorDetected = false;
    try {
        sea.addAmoeba({
            id: 'InvalidCondition',
            func: (x) => x * 2,
            inputEvents: ['input.x'],
            outputEvents: [
                {
                    condition: '(result) => ', 
                    then: ['InvalidEvent']
                }
            ]
        });

        sea.finalizeConfiguration();
        sea.setInput('input.x', 5);

        await sea.waitForAmoebaExecution('InvalidCondition');
    } catch (error) {        
        errorDetected = error.message.includes("Amoeba 'InvalidCondition':");        
    } 

    // Registrar el resultado como exitoso si se detectó el error esperado
    registerResult(
        'Test Invalid Condition Handling',
        errorDetected,
        errorDetected
            ? 'Invalid condition was correctly rejected.'
            : 'The invalid condition was not detected as an error.'
    );
}

async function testPerformance() {
    const numAmoebas = 1000; // You can adjust this number
    const sea = new AmoebaSea();

    // Record initial memory usage
    const initialMemory = process.memoryUsage().heapUsed;

    // Start timing
    const startTime = performance.now();

    // Add a chain of amoebas
    for (let i = 0; i < numAmoebas; i++) {
        sea.addAmoeba({
            id: `Amoeba${i}`,
            func: (input) => input + 1,
            inputEvents: i === 0 ? ['input.start'] : [`Amoeba${i - 1}.executed`],
            outputEvents: [`Amoeba${i}.executed`]
        });
    }

    // Finalize configuration
    sea.finalizeConfiguration();

    // Set initial input to trigger the chain
    sea.setInput('input.start', 0);

    // Wait for the last amoeba to execute
    await sea.waitForAmoebaExecution(`Amoeba${numAmoebas - 1}`);

    // Stop timing
    const endTime = performance.now();

    // Record final memory usage
    const finalMemory = process.memoryUsage().heapUsed;

    // Calculate metrics
    const totalTime = endTime - startTime;
    const memoryUsed = finalMemory - initialMemory;

    console.log(`Total time for executing ${numAmoebas} amoebas: ${totalTime.toFixed(2)} ms`);
    console.log(`Memory used: ${(memoryUsed / 1024 / 1024).toFixed(2)} MB`);

    // Set acceptable thresholds based on observed performance
    const acceptableTimePerAmoeba = 5; // ms per amoeba
    const acceptableMemoryPerAmoeba = 0.004; // MB per amoeba (4 KB)


    const timeThreshold = numAmoebas * acceptableTimePerAmoeba;
    const memoryThreshold = numAmoebas * acceptableMemoryPerAmoeba * 1024 * 1024;

    // Validate performance
    const performanceAcceptable = totalTime < timeThreshold;
    const memoryAcceptable = memoryUsed < memoryThreshold;

    registerResult(
        'Test Performance Execution Time',
        performanceAcceptable,
        `Expected less than ${timeThreshold.toFixed(2)} ms, got ${totalTime.toFixed(2)} ms`
    );

    registerResult(
        'Test Performance Memory Usage',
        memoryAcceptable,
        `Expected less than ${(memoryThreshold / 1024 / 1024).toFixed(2)} MB, got ${(memoryUsed / 1024 / 1024).toFixed(2)} MB`
    );
}

async function testExampleWeb1() {
    // Define functions
    const add = (a, b) => a + b;
    const multiply = (x, y) => x * y;
    const increment = async (z) => z + 1;

    const sofa = new AmoebaSea();
    // Add amoebas using the new object syntax
    sofa.addAmoeba({
        id: 'AmoebaA',
        func: add,
        inputEvents: ['input.a', 'input.b'],
        outputEvents: ['AmoebaB.input']
    });
    sofa.addAmoeba({
        id: 'AmoebaB',
        func: multiply,
        inputEvents: ['AmoebaB.input', 'input.y'],
        outputEvents: ['AmoebaC.input']
    });
    sofa.addAmoeba({
        id: 'AmoebaC',
        func: increment,
        inputEvents: ['AmoebaC.input']
    });
    // Finalize configuration
    sofa.finalizeConfiguration();
    // Set initial inputs
    sofa.setInput('input.a', 5); //Initial value for 'input.a'
    sofa.setInput('input.b', 3); //Initial value for 'input.b'
    sofa.setInput('input.y', 2); //Initial value for 'input.y'
    // Wait for the last amoeba to execute
    const finalResult = await sofa.waitForAmoebaExecution('AmoebaC');
    // Validate the result
    const correctResult = finalResult === 17;
    registerResult(
        'Test Example Web Workflow',
        correctResult,
        `Expected 17, Got ${finalResult}`
    );
}

async function testInterconnectedAmoebaSeas() {

    // First AmoebaSea
    const sea1 = new AmoebaSea();
    sea1.addAmoeba({
        id: 'A1',
        func: (x) => {
            console.log('Amoeba A1 executed');
            return x + 1;
        },
        inputEvents: ['input.start'],
        outputEvents: ['sharedEvent']
    });

    // Second AmoebaSea
    const sea2 = new AmoebaSea({ eventEmitter: sea1.eventEmitter });
    sea2.addAmoeba({
        id: 'B1',
        func: (x) => {
            console.log('Amoeba B1 executed');
            return x * 2;
        },
        inputEvents: ['sharedEvent']
    });

    // Finalize configurations
    sea1.finalizeConfiguration();
    sea2.finalizeConfiguration();

    // Set initial input to sea1
    sea1.setInput('input.start', 3);

    // Wait for execution in sea2
    const result = await sea2.waitForAmoebaExecution('B1');

    // Validate result
    const expected = (3 + 1) * 2; // A1: 3+1, B1: 4*2
    const resultValid = result === expected;

    registerResult(
        'Test Interconnected AmoebaSeas',
        resultValid,
        resultValid
            ? `Expected ${expected}, Got ${result}`
            : `Execution failed. Expected ${expected}, Got ${result}`
    );
}

async function testGlobalAndIndividualResultStorage() {
    const add = (a, b) => a + b;
    const multiply = (x, y) => x * y;
    const increment = async (z) => z + 1;

    // Global configuration: storeResults = true
    const sea = new AmoebaSea({ storeResults: true });

    // Add amoebas with different `storeResults` configurations
    sea.addAmoeba({
        id: 'AmoebaA',
        func: add,
        inputEvents: ['input.a', 'input.b'],
        outputEvents: ['AmoebaB.input'],
        storeResults: false, // Overrides global setting
    });

    sea.addAmoeba({
        id: 'AmoebaB',
        func: multiply,
        inputEvents: ['AmoebaB.input', 'input.y'],
        outputEvents: ['AmoebaC.input'], // Inherits global setting
    });

    sea.addAmoeba({
        id: 'AmoebaC',
        func: increment,
        inputEvents: ['AmoebaC.input'],
        storeResults: true, // Overrides global setting
    });

    // Finalize configuration
    sea.finalizeConfiguration();

    // Set inputs
    sea.setInput('input.a', 5);
    sea.setInput('input.b', 3);
    sea.setInput('input.y', 2);

    // Wait for final execution
    const finalResult = await sea.waitForAmoebaExecution('AmoebaC');

    // Validate results
    const amoebaAResult = sea.amoebas['AmoebaA'].lastResult;
    const amoebaBResult = sea.amoebas['AmoebaB'].lastResult;
    const amoebaCResult = sea.amoebas['AmoebaC'].lastResult;

    const amoebaAValid = amoebaAResult === null; // `storeResults` is false
    const amoebaBValid = amoebaBResult === 16; // Inherited from global `storeResults`
    const amoebaCValid = amoebaCResult === 17; // Overrides global `storeResults`

    registerResult(
        'Test Global and Individual Result Storage (AmoebaA)',
        amoebaAValid,
        amoebaAValid
            ? ''
            : `Expected undefined for AmoebaA, got ${amoebaAResult}`
    );

    registerResult(
        'Test Global and Individual Result Storage (AmoebaB)',
        amoebaBValid,
        amoebaBValid
            ? ''
            : `Expected 16 for AmoebaB, got ${amoebaBResult}`
    );

    registerResult(
        'Test Global and Individual Result Storage (AmoebaC)',
        amoebaCValid,
        amoebaCValid
            ? ''
            : `Expected 17 for AmoebaC, got ${amoebaCResult}`
    );

    // Validate final result
    const finalResultValid = finalResult === 17;
    registerResult(
        'Test Global and Individual Result Storage (Final Result)',
        finalResultValid,
        finalResultValid
            ? ''
            : `Expected final result 17, got ${finalResult}`
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
    //await runTest(testPerformance, "Test Performance");
    await runTest(testInterconnectedAmoebaSeas, 'Test Interconnected AmoebaSeas');
    await runTest(testExampleWeb1, "Test Example Web Workflow");
    await runTest(testGlobalAndIndividualResultStorage, "Test Global and Individual Result Storage");
       
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

