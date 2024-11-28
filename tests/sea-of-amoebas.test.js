import { AmoebaSpace } from '../src/AmoebaSpace.js';

// Variables globales para el resumen
const testResults = {
    passed: 0,
    failed: 0,
    details: [],
};

// Helper para registrar los resultados
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

    // Add amoebas
    space.addAmoeba('S1', amebaAFunction);
    space.addAmoeba('S2', amebaBFunction);
    space.addAmoeba('S3', amebaCFunction);

    // Connect amoebas
    space.connect('S1', 'S2');
    space.connect('S2', 'S3');

    // Finalize configuration and wait for the last amoeba
    space.finalizeConfiguration(['S3']);
    await space.waitForCompletion();

    // Validate results
    const executionsCorrect = executionOrder.length === 3;
    const orderCorrect = JSON.stringify(executionOrder) === JSON.stringify(['S1', 'S2', 'S3']);

    registerResult('Test Sequential Execution (Executions Count)', executionsCorrect, `Expected 3 executions, Got ${executionOrder.length}`);
    registerResult('Test Sequential Execution (Order)', orderCorrect, `Expected order ['S1', 'S2', 'S3'], Got ${JSON.stringify(executionOrder)}`);
}

// Test: Chain execution with parameters
async function testCalculationExecution() {
    const suma = (a, b) => a + b;
    const multiplica = (x, y) => x * y;
    const incrementa = async (z) => z + 1;

    const space = new AmoebaSpace();

    // Add amoebas
    space.addAmoeba('AmoebaA', suma, ['input.a', 'input.b']);
    space.addAmoeba('AmoebaB', multiplica, ['input.y']);
    space.addAmoeba('AmoebaC', incrementa);

    // Connect amoebas
    space.connect('AmoebaA', 'AmoebaB');
    space.connect('AmoebaB', 'AmoebaC');

     // Set initial inputs
     space.setInput('AmoebaA', 'input.a', 5); // Valor inicial para 'input.a'
     space.setInput('AmoebaA', 'input.b', 3); // Valor inicial para 'input.b'
     space.setInput('AmoebaB', 'input.y', 2); // Valor inicial para 'input.y'

    // Finalize configuration and wait for the last amoeba
    space.finalizeConfiguration(['AmoebaC']);

    const results = await space.waitForCompletion();

    // Validate results
    const finalResult = results['AmoebaC'];
    const correctResult = finalResult === 17;

    registerResult('Test Calculation Execution (Final Result)', correctResult, `Expected 17, Got ${finalResult}`);
}

// Test: Mixed completion mechanism
async function testMixedCompletionMechanism() {
    const logResults = [];

    const funcA = () => logResults.push('A');
    const funcB = () => logResults.push('B');
    const funcC = () => logResults.push('C');

    const space = new AmoebaSpace();

    // Add amoebas
    space.addAmoeba('A', funcA);
    space.addAmoeba('B', funcB);
    space.addAmoeba('C', funcC);

    // Connect amoebas
    space.connect('A', 'B');
    space.connect('B', 'C');

    // Finalize configuration without specifying final amoebas
    space.finalizeConfiguration(['A', 'B', 'C']); 
    space.setInput('A', 'trigger', null); //Test trigger after finalizeConfiguration
    const results = await space.waitForCompletion(false); // Resolve when any final amoeba completes

    // Validate results
    const anyCompletionCorrect = Object.keys(results).length === 1;
    registerResult('Test Mixed Completion Mechanism (Any Amoeba)', anyCompletionCorrect, `Expected 1 amoeba to complete, Got ${Object.keys(results).length}`);
}

// Test: Verify result storage in amoebas
async function testResultStorage() {
    const suma = (a, b) => a + b;
    const multiplica = (x, y) => x * y;
    const incrementa = async (z) => z + 1;

    // Enable result storage
    const space = new AmoebaSpace(true);

    // Add amoebas
    space.addAmoeba('AmoebaA', suma, ['input.a', 'input.b']);
    space.addAmoeba('AmoebaB', multiplica, ['input.y']);
    space.addAmoeba('AmoebaC', incrementa);

    // Connect amoebas
    space.connect('AmoebaA', 'AmoebaB');
    space.connect('AmoebaB', 'AmoebaC');

    // Set initial inputs
    space.setInput('AmoebaA', 'input.a', 5);
    space.setInput('AmoebaA', 'input.b', 3);
    space.setInput('AmoebaB', 'input.y', 2);

    // Finalize configuration and wait for the last amoeba
    space.finalizeConfiguration(['AmoebaC']);
    const results = await space.waitForCompletion();

    // Validate that results are stored in the amoebas
    const resultA = space.amoebas['AmoebaA'].result;
    const resultB = space.amoebas['AmoebaB'].result;
    const resultC = space.amoebas['AmoebaC'].result;

    const resultAValid = resultA === 8;
    const resultBValid = resultB === 16;
    const resultCValid = resultC === 17;

    registerResult('Test Result Storage (AmoebaA Result)', resultAValid, `Expected 8, Got ${resultA}`);
    registerResult('Test Result Storage (AmoebaB Result)', resultBValid, `Expected 16, Got ${resultB}`);
    registerResult('Test Result Storage (AmoebaC Result)', resultCValid, `Expected 17, Got ${resultC}`);
}


// Execute all tests
async function runTests() {
    console.log('Running Tests...');
    try {
        await testSequentialExecution();
        await testCalculationExecution();
        await testMixedCompletionMechanism();                
        await testResultStorage(); 
    } catch (error) {
        console.error('Test Failed:', error);
    }

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
   
