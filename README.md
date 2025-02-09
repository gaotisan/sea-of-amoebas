# Sea of Amoebas (SofA)
A declarative, event-driven framework for modular and scalable workflow execution in JavaScript, empowering you to manage and orchestrate complex processes within your web application.

Imagine effortlessly building and coordinating intricate workflows in your web application, chaining functions and creating dynamic process flows. With **SofA**, you can seamlessly integrate asynchronous processes, conditionally trigger events, and handle complex data interactions—enabling scenarios like specialized AI assistants collaborating and queuing tasks, where one assistant's output becomes another's input.

The best part? It's so intuitive and efficient, it's like coding from the comfort of your couch ;) .

Sit back, relax, and let **SofA** handle the flow.

## Overview and Features
**SofA** provides a framework to implement workflows as a network of interconnected Amoeba Nodes. Each node represents a function, modeled as *f(x<sub>1</sub>, x<sub>2</sub>, ..., x<sub>n</sub>)*, which waits for all required input parameters to arrive before executing. Once the function completes, it emits output events that can trigger other nodes, creating a continuous flow of processes. This design results in a latent "sea" of nodes (or Amoebas) awaiting events to process, forming a dynamic and responsive system within your web application.

### Key Features
1. **Event-Driven Execution:**
    - Amoebas execute only after receiving all required inputs as events.
    - Events can carry data from simple primitives to complex objects.
2. **Flexible Output Events:**
    - Nodes can emit multiple output events *(e1, e2, ..., em)*, enabling branching and parallel workflows.
    - Conditional events allow nodes to evaluate dynamic conditions and emit specific events based on their results, providing fine-grained control over process flows.
3. **Modularity and Scalability:**
    - Event emitters can be shared across multiple AmoebaSeas, allowing interconnected workflows.
    - Define your "*sea of Amoebas*" in modular parts, simplifying complex systems and allowing the reuse or extension of existing definitions.
4. **Asynchronous Support:**
    - Fully compatible with both synchronous and asynchronous functions.
5. **Declarative Design:**
    - Define workflows in JSON or YAML syntax for a readable, shareable structure.

## Installation
Install the package directly from npm:
```bash
npm install sea-of-amoebas
```
That's it! The package is now ready to use in your project.

## Quickstart Example

### Basic Example
```javascript
import { AmoebaSea } from 'sea-of-amoebas';
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
```

### Define a Flow with a JavaScript Object

```javascript
import { AmoebaFlowParser } from 'sea-of-amoebas';
// Define the workflow as a JavaScript object
const jsonFlow = {
    amoebas: [
        // Amoeba A: Adds 1 to the input and emits to "Logger",
        // and either B.Input or C.Input based on conditions
        {
            id: 'A',
            func: (x) => x + 1,
            inputEvents: ['input.x'],
            outputEvents: [
                "Logger", // Sends all results to Logger, regardless of value
                {
                    condition: (result) => result > 5, // If result > 5, send to B.Input
                    then: ["B.Input"],
                    else: ["C.Input"], // Else 
                },
                {
                    condition: (result) => result == 5, // If result == 5, send to an Extra Logger (All condition are evaluated)
                    then: ["Logger"]
                }
            ]
        },
        // Amoeba B: Multiplies the input by 2 and emits conditionally to D or Logger
        {
            id: 'B',
            func: (y) => y * 2,
            inputEvents: ['B.Input'],
            outputEvents: [
                {
                    condition: (result) => result > 15,// If result > 15, send to D.Input
                    then: ["D.Input"]
                },
                {
                    condition: (result) => result <= 15,// If result <= 15, send to Logger (without 'else' example)
                    then: ["Logger"]
                }
            ]
        },
        // Amoeba C: Subtracts 2 from the input and sends the result to Logger
        {
            id: 'C',
            func: (z) => z - 2,
            inputEvents: ['C.Input'],
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
            inputEvents: ['D.Input']
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
const inputs = [3, 6, 10];
for (const input of inputs) {
    console.log(`Processing input: ${input}`);
    sofa.setInput('input.x', input);    
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


