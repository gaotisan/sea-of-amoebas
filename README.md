# Sea of Amoebas (SofA)
A declarative, event-driven framework for modular and scalable workflow execution in JavaScript, ideal for client-side environments.

## Overview
SofA enables developers to construct, manage, and execute complex workflows using a network of interconnected Amoeba Nodes. These nodes represent logical functions that process inputs triggered by events.
The framework's declarative nature supports JSON, YAML, and Mermaid syntax, ensuring clarity and flexibility in defining workflows. Its scalability and modularity make it ideal for both small and large-scale systems.

## CORE Featyres
1. **Event-Driven Execution:**
    * Nodes (f(x1, x2, ..., xn)) execute only after receiving all required inputs as events.
    * Events can carry data from simple primitives to complex objects.
2. **Multiple Outputs:**
    * Nodes can emit multiple output events (e1, e2, ..., em), enabling branching and parallel workflows.
    * Modularity and Scalability:
    * Event emitters can be shared across multiple AmoebaSpaces, allowing interconnected workflows.
3. **Asynchronous Support:**
    * Fully compatible with both synchronous and asynchronous functions.
4. **Declarative Design:**
    * Define workflows in JSON or YAML syntax for a readable, shareable structure.
5. **Conditional Outputs:**
    * Nodes can emit events based on dynamically evaluated conditions.

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
const jsonFlow = {
    amebas: [
        { id: 'A', func: "(a, b) => a + b", inputs: ['input.a', 'input.b'], outputEvents: ['B.input'] },
        { id: 'B', func: "(x, y) => x * y", inputs: ['B.input', 'input.y'], outputEvents: ['C.input'] },
        { id: 'C', func: "(z) => z + 1", inputs: ['C.input'] }
    ]
};

const space = AmoebaFlowParser.fromJSON(jsonFlow);
space.finalizeConfiguration();
space.setInput('input.a', 5);
space.setInput('input.b', 3);
space.setInput('input.y', 2);
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


