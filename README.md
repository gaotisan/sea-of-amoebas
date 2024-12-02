# Sea of Amoebas
A declarative, event-driven execution framework for constructing, managing, and executing complex workflows in a modular and scalable manner.

## Key Concepts
At its core, Sea of Amoebas operates on the concept of Amoeba Nodes (functions) that process inputs triggered by events. These functions are orchestrated in a graph-like structure where dependencies between nodes are defined declaratively.

Each node can:
    1.	Represent a mathematical or logical function f(x1,x2,…,xn) where each parameter is received via an event.
    2.	Emit multiple output events e1,e2,…,em enabling branching flows.
    3.	Act as a building block for complex, event-driven systems.

The framework ensures that:
    •	A node executes only after receiving all required inputs (events).
    •	Outputs from one node can trigger multiple subsequent nodes, allowing for the creation of parallel and branching workflows.
    •	Event emitters can be shared across different workflows for modular design

##Core Principles
1.	**Event-Driven Execution:**
    •	Each function f(x1,x2,…,xn)f(x_1, x_2, \ldots, x_n)f(x1,x2,…,xn) receives its parameters as distinct events.
    •	Functions do not execute until all required events are received.
    •	Events can represent any type of data, from simple primitives to complex objects.
2.	**Multiple Outputs:**
    •	Nodes can emit multiple output events e1,e2,…,eme_1, e_2, \ldots, e_me1,e2,…,em.
    •	This supports parallel and branching workflows, enabling functionalities like logging or data storage alongside the primary flow.
3.	**Interconnected Spaces:**
    •	Event emitters can be shared between spaces, allowing multiple "seas" of amoebas to work together modularly.
    •	This facilitates modular, manageable, and reusable workflow definitions.
4.	**Infinite Listening or Stopping Events:**
    •	Define explicit stopping conditions using final events, or keep the workflow latent, continuously listening for events.

## Features
- **Event-Driven Paradigm**: Nodes are triggered by the reception of specific events, ensuring precise and asynchronous execution.
- **Multiple Outputs**: Nodes can emit multiple events, facilitating advanced branching and modular functionality (e.g., logging, parallel tasks).
- **Declarative Design**: Workflows can be defined in JSON, YAML, or Mermaid syntax for clarity and portability.
- **Asynchronous Support**: Fully compatible with both synchronous and asynchronous functions.
- **Modularity**: Event emitters can be shared between spaces, allowing distinct workflows to interconnect seamlessly.
- **Scalability**: Designed to handle extensive and intricate workflows effectively.

## Advanced Features
**Event Sharing Across Spaces**
Create modular workflows that interconnect seamlessly by sharing a common EventEmitter across different AmoebaSpace instances. This feature is useful for modular and reusable system design.

**Dynamic Event Outputs**
Nodes can emit events dynamically based on their logic, enabling complex decision-making processes within workflows.

**Flexible Stopping Conditions**
You can specify stopping conditions explicitly or allow workflows to remain active indefinitely, listening for additional events.

## Installation
Clone the repository:

```bash
git clone https://github.com/gaotisan/sea-of-amoebas.git
cd sea-of-amoebas
Install dependencies (if applicable):
```

```bash
npm install
```

## Usage

```javascript
// Define functions
const add = (a, b) => a + b;
const multiply = (x, y) => x * y;
const increment = async (z) => z + 1;

// Create an AmoebaSpace
const space = new AmoebaSpace();

// Add nodes
space.addAmoeba('amebaA', add, ['input.a', 'input.b']);
space.addAmoeba('amebaB', multiply, ['amebaA.output', 'input.y']);
space.addAmoeba('amebaC', increment, ['amebaB.output']);

// Connect nodes
space.connect('amebaA', 'amebaB');
space.connect('amebaB', 'amebaC');

// Provide initial inputs
space.setInput('amebaA', 'input.a', 5);
space.setInput('amebaA', 'input.b', 3);
space.setInput('amebaB', 'input.y', 2);

// Finalize configuration
space.finalizeConfiguration();

// Listen to the final output
space.eventEmitter.on('amebaC.output', (result) => {
    console.log('Final Result:', result); // Output: 17
});
```

### Define a Flow with JSON

```javascript
const jsonFlow = {
    "amebas": [
        { "id": "amebaA", "func": "(a, b) => a + b", "inputs": ["input.a", "input.b"] },
        { "id": "amebaB", "func": "(x, y) => x * y", "inputs": ["amebaA.output", "input.y"] },
        { "id": "amebaC", "func": "(z) => z + 1", "inputs": ["amebaB.output"] }
    ],
    "connections": [
        { "from": "amebaA", "to": "amebaB" },
        { "from": "amebaB", "to": "amebaC" }
    ]
};

const space = AmoebaFlowParser.fromJSON(jsonFlow);
space.setInput("amebaA", "input.a", 5);
space.setInput("amebaA", "input.b", 3);
space.setInput("amebaB", "input.y", 2);
space.finalizeConfiguration();
space.eventEmitter.on('amebaC.output', (result) => console.log('Final Result:', result));
```

### Supported Formats
- **JSON**: Define amebas, inputs, and connections in a structured format.
- **YAML**: Similar to JSON but with more human-readable syntax.
- **Mermaid**: Use Mermaid-like syntax for flows and connections.

## License
MIT License. See LICENSE for details.

## Contact
Created by gaotisan. Feel free to reach out via GitHub Issues.


