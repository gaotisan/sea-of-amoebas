import { AmoebaSea } from '../src/AmoebaSea.js';

// Define the API key as a constant at the top
const API_KEY = '<your-api-key>';

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

// Function to simulate an AI call
async function aiCalculate(operation, ...args) {
    const url = 'https://genieaddin.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-08-01-preview';

    const messages = [
        {
            role: "system",
            content: "You are an assistant capable of performing simple mathematical operations. Only return the result of the calculation as a number."
        },
        {
            role: "user",
            content: `Perform the operation "${operation}" with the inputs ${args.join(', ')} and return the result strictly as a number.`
        }
    ];

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': API_KEY
            },
            body: JSON.stringify({ messages, temperature: 0.2 })
        });

        const data = await response.json();
        const result = parseFloat(data.choices[0].message.content.trim());
        if (isNaN(result)) {
            throw new Error(`Invalid response from AI: ${data.choices[0].message.content}`);
        }
        return result;
    } catch (error) {
        console.error("Error while calculating with AI:", error);
        throw error;
    }
}

// Test: Chain execution with AI calculations
async function testAICalculationExecution() {
    const sea = new AmoebaSea();

    // Add amoebas using AI for calculations
    sea.addAmoeba({
        id: 'AmoebaA',
        func: async (a, b) => aiCalculate('add', a, b),
        expectedEvents: ['input.a', 'input.b'],
        outputEvents: ['AmoebaB.input']
    });

    sea.addAmoeba({
        id: 'AmoebaB',
        func: async (x, y) => aiCalculate('multiply', x, y),
        expectedEvents: ['AmoebaB.input', 'input.y'],
        outputEvents: ['AmoebaC.input']
    });

    sea.addAmoeba({
        id: 'AmoebaC',
        func: async (z) => aiCalculate('increment', z),
        expectedEvents: ['AmoebaC.input']
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
        'Test AI Calculation Execution (Final Result)',
        correctResult,
        `Expected 17, Got ${finalResult}`
    );
}

// Execute the AI test
async function runAITests() {
    console.log('Running AI Tests...');
    await testAICalculationExecution();

    // Display summary
    console.log('\n--- AI Test Summary ---');
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

runAITests();
