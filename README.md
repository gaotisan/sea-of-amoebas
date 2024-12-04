# Sea of Amoebas (SofA)
A declarative, event-driven framework for modular and scalable workflow execution in JavaScript, designed to make web development smarter and easier.

Imagine building and orchestrating complex workflows in your web application effortlessly, combining standard functions with the power of AI. With **SofA**, you can seamlessly integrate asynchronous processes, conditionally trigger events, and handle intricate data flows—all while enjoying the simplicity and modularity of its declarative design.

**SofA** transforms your codebase into a dynamic, event-driven environment, empowering your application to handle everything from mundane tasks to advanced AI-powered operations. The best part? It’s so intuitive and efficient, it’s like coding from the comfort of your couch.

Sit back, relax, and let **SofA** handle the flow.

## Overview
SofA enables developers to construct, manage, and execute complex workflows using a network of interconnected Amoeba Nodes. These nodes represent logical functions that process inputs triggered by events.
The framework's declarative nature supports JSON, YAML, and Mermaid syntax, ensuring clarity and flexibility in defining workflows. Its scalability and modularity make it ideal for both small and large-scale systems.

## CORE Features
1. **Event-Driven Execution:**
- Nodes (f(x1, x2, ..., xn)) execute only after receiving all required inputs as events.
- Events can carry data from simple primitives to complex objects.
2. **Multiple Outputs:**
- Nodes can emit multiple output events (e1, e2, ..., em), enabling branching and parallel workflows.
- Modularity and Scalability:
- Event emitters can be shared across multiple AmoebaSpaces, allowing interconnected workflows.
3. **Asynchronous Support:**
- Fully compatible with both synchronous and asynchronous functions.
4. **Declarative Design:**
- Define workflows in JSON or YAML syntax for a readable, shareable structure.
5. **Conditional Outputs:**
- Nodes can emit events based on dynamically evaluated conditions.

## Installation
Clone the repository:

```bash
git clone https://github.com/gaotisan/sea-of-amoebas.git
cd sea-of-amoebas
Install dependencies:
```

```bash
npm install
```

## Quickstart Example

### Basic Example
```javascript
import { AmoebaSpace } from 'sea-of-amoebas';
// Define functions
const add = (a, b) => a + b;
const multiply = (x, y) => x * y;
const increment = async (z) => z + 1;

const space = new AmoebaSpace();
// Add amoebas using the new object syntax
space.addAmoeba({
    id: 'AmoebaA',
    func: add,
    expectedEvents: ['input.a', 'input.b'],
    outputEvents: ['AmoebaB.input']
});
space.addAmoeba({
    id: 'AmoebaB',
    func: multiply,
    expectedEvents: ['AmoebaB.input', 'input.y'],
    outputEvents: ['AmoebaC.input']
});
space.addAmoeba({
    id: 'AmoebaC',
    func: increment,
    expectedEvents: ['AmoebaC.input']
});
// Finalize configuration and wait for the last amoeba
space.finalizeConfiguration();
// Set initial inputs
space.setInput('input.a', 5); //Initial value for 'input.a'
space.setInput('input.b', 3); //Initial value for 'input.b'
space.setInput('input.y', 2); //Initial value for 'input.y'
const finalResult = await space.waitForAmoebaExecution('AmoebaC');
```

### Define a Flow with JSON

```javascript
import { AmoebaFlowParser } from 'sea-of-amoebas';

const jsonFlow = {
    amebas: [
        // Amoeba A: Adds 1 to the input and emits to Logger and either B.Input or C.Input based on conditions
        {
            id: 'A',
            func: "(x) => x + 1",
            inputs: ['input.x'],
            outputEvents: [
                "Logger", // Simple output event that sends all results to Logger, regardless of their value
                {
                    condition: "(result) => result > 5", // Conditional output event that sends the result as input to B
                    outputEvents: ["B.Input"]
                },
                {
                    condition: "(result) => result <= 5", // Conditional output event that sends the result as input to C
                    outputEvents: ["C.Input"]
                }
            ]
        },
        // Amoeba B: Multiplies the input by 2 and emits conditionally to D or Logger
        {
            id: 'B',
            func: "(y) => y * 2",
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
        // Amoeba C: Subtracts 2 from the input and sends the result to Logger
        {
            id: 'C',
            func: "(z) => z - 2",
            inputs: ['C.Input'],
            outputEvents: ["Logger"]
        },
        // Amoeba D: Computes the modulus of the input with 3
        // This amoeba does not have an explicit output event, so its result is not sent to another amoeba.
        // However, all amoebas emit a default event named ID.executed after completing their function.
        // You can capture this event using:
        // - `await space.waitForAmoebaExecution("D")` (simplified method to wait for D's execution)
        // - `await space.waitForOuputEvent("D.executed")` (directly waits for the "D.executed" event)        
        {
            id: 'D',
            func: "(w) => w % 3",
            inputs: ['D.Input']
        },
        // Logger: Logs all incoming data
        // Example of an amoeba without a specified input event.
        // The amoeba listens for events with its own name, in this case, "Logger". 
        // This simplifies the definition and is ideal for functions with a single input event/parameter.
        {
            id: 'Logger',
            func: "(data) => console.log(`Log: ${data}`)"
        }
    ]
};
// Parse the JSON and create the workflow
const space = AmoebaFlowParser.fromJSON(jsonFlow);
// Finalize configuration
space.finalizeConfiguration();
// Test the workflow with different inputs
const inputs = [3, 6, 10];
for (const input of inputs) {
    console.log(`Processing input: ${input}`);
    space.setInput('input.x', input);    
}
```

### Explore Advanced Examples
For more illustrative and complex examples, check the tests folder in the repository. It contains a variety of test cases showcasing advanced workflows, including conditional logic, branching, and modular designs.

### Supported Formats
- **JSON**: Define amebas, inputs, and connections in a structured format.
- **YAML**: Similar to JSON but with more human-readable syntax.

## License
MIT License. See LICENSE for details.

## Contact
Created by gaotisan. Feel free to reach out via GitHub Issues.
You can also connect with me on [LinkedIn](https://www.linkedin.com/in/santiago-ochoa-ceresuela/).


