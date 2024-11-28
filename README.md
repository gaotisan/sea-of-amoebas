# Sea of Amoebas
A declarative and event-driven execution framework designed for creating, managing, and executing complex flows with minimal configuration.

## Features
- **Amoeba Nodes**: Define functions that wait for specific events, process inputs, and emit results.
- **Event-Driven**: Uses an efficient custom EventEmitter for managing dependencies and data flow.
- **Declarative Support**: Define flows using JSON, YAML, or Mermaid syntax.
- **Asynchronous Ready**: Functions can be synchronous or asynchronous.
- **Scalable**: Designed to handle large graphs of interconnected nodes.

## Installation
Clone the repository:

```bash
Copiar código
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


