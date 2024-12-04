# Sea of Amoebas (SofA)
A declarative, event-driven framework for modular and scalable workflow execution in JavaScript, designed to make web development smarter and easier.

Imagine building and orchestrating complex workflows in your web application effortlessly, combining standard functions with the power of AI. With **SofA**, you can seamlessly integrate asynchronous processes, conditionally trigger events, and handle intricate data flows—all while enjoying the simplicity and modularity of its declarative design.

**SofA** transforms your codebase into a dynamic, event-driven environment, empowering your application to handle everything from mundane tasks to advanced AI-powered operations. The best part? It’s so intuitive and efficient, it’s like coding from the comfort of your couch.

Sit back, relax, and let **SofA** handle the flow.

## Overview
**SofA** enables developers to construct, manage, and execute complex workflows using a network of interconnected Amoeba Nodes. These nodes represent logical functions that process inputs triggered by events.
The framework's declarative nature supports JSON and YAML syntax, ensuring clarity and flexibility in defining workflows. Its scalability and modularity make it ideal for both small and large-scale systems.

## Core Features
1. **Event-Driven Execution:**
    - Nodes f(x<sub>1</sub>, x<sub>2</sub>, ..., x<sub>n</sub>) execute only after receiving all required inputs as events.
    - Events can carry data from simple primitives to complex objects.
2. **Multiple Outputs:**
    - Nodes can emit multiple output events (e1, e2, ..., em), enabling branching and parallel workflows.
3. **Modularity and Scalability:**
    - Event emitters can be shared across multiple AmoebaSpaces, allowing interconnected workflows.
4. **Asynchronous Support:**
    - Fully compatible with both synchronous and asynchronous functions.
5. **Declarative Design:**
    - Define workflows in JSON or YAML syntax for a readable, shareable structure.
6. **Conditional Outputs:**
    - Nodes can emit events based on dynamically evaluated conditions.

## Installation
Clone the repository:
```bash
git clone https://github.com/gaotisan/sea-of-amoebas.git
cd sea-of-amoebas
```
Now, install the dependencies:
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
// Finalize configuration
space.finalizeConfiguration();
// Set initial inputs
space.setInput('input.a', 5); //Initial value for 'input.a'
space.setInput('input.b', 3); //Initial value for 'input.b'
space.setInput('input.y', 2); //Initial value for 'input.y'
// Wait for the last amoeba to execute
const finalResult = await space.waitForAmoebaExecution('AmoebaC');
```

### Define a Flow with JSON

```javascript
import { AmoebaFlowParser } from 'sea-of-amoebas';
// Define the workflow as a JavaScript object
const jsonFlow = {
    amoebas: [
        // Amoeba A: Adds 1 to the input and emits to "Logger",
        // and either B.Input or C.Input based on conditions
        {
            id: 'A',
            func: "(x) => x + 1",
            inputs: ['input.x'],
            outputEvents: [
                "Logger", // Sends all results to Logger, regardless of value
                {
                    condition: "(result) => result > 5", // If result > 5, send to B.Input
                    outputEvents: ["B.Input"]
                },
                {
                    condition: "(result) => result <= 5", // If result <= 5, send to C.Input
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
                    condition: "(result) => result > 15",// If result > 15, send to D.Input
                    outputEvents: ["D.Input"]
                },
                {
                    condition: "(result) => result <= 15",// If result <= 15, send to Logger
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
        // Amoeba D: Computes modulus of input with 3
        // While it does not define explicit output events to pass its result to another amoeba,
        // every amoeba emits a default event named `ID.executed` upon completion.
        // This allows you to retrieve its result if needed.
        // Example: Use `await space.waitForAmoebaExecution("D")` to wait for its execution
        // or `await space.waitForOutputEvent("D.executed")` to directly capture the emitted event.
        {
            id: 'D',
            func: "(w) => w % 3",
            inputs: ['D.Input']
        },
        // Logger: Logs all incoming data
        // If no input events are specified, the amoeba listens for events matching its name by default.
        // This simplify the definition for single-input functions.
        // In this case, "Logger" listens for "Logger" events        
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

## Supported Formats
- **JSON**: Define amoeba, inputs, and connections in a structured format.
- **YAML**: Similar to JSON but with more human-readable syntax.

## License
MIT License. See LICENSE for details.

## Contact
Created by Gaotisan. Feel free to reach out via GitHub Issues.
You can also connect with me on [LinkedIn](https://www.linkedin.com/in/santiago-ochoa-ceresuela/).


