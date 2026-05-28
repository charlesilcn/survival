# @evolution-system/core

[![npm version](https://badge.fury.io/js/@evolution-system%2Fcore.svg)](https://www.npmjs.com/package/@evolution-system/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0-brightgreen.svg)](https://nodejs.org/)

> A powerful multi-agent competitive evolution system based on natural selection principles.

## Overview

The Evolution System implements a **generational multi-agent optimization framework** where multiple AI agents compete on tasks, progressively filtering out underperforming agents while survivors learn from eliminated agents through genetic recombination and mutation. This approach mimics natural selection to continuously evolve and produce optimal solutions.

### Key Features

- 🧬 **Multi-Agent Evolution**: Create diverse agent populations with varied strategies and capability profiles
- 🎯 **Competitive Selection**: Six-dimensional evaluation (quality, efficiency, creativity, collaboration, resource usage, error rate)
- 🔀 **Genetic Recombination**: Survivors produce offspring through crossover and mutation
- 📚 **Knowledge Sharing**: Global knowledge pool with anti-toxic competition detection
- 🛡️ **Fault Tolerance**: Checkpoint/resume, misjudgment recovery, and rollback capabilities
- 🔌 **Plugin Architecture**: Extensible via lifecycle hooks and custom metrics
- 📊 **Rich Reporting**: Console, HTML, CSV, JSON, and Markdown export formats
- 🎨 **Visualization**: SVG charts and interactive dashboards

## Installation

```bash
npm install @evolution-system/core
```

### Prerequisites

- Node.js >= 18.0.0
- TypeScript >= 5.0 (for TypeScript projects)

## Quick Start

```typescript
import { EvolutionSystem } from '@evolution-system/core';

const task = {
  id: 'sort-algo-task',
  type: 'code_generation',
  description: 'Implement an efficient sorting algorithm',
  requirements: [
    'Time complexity better than O(n²)',
    'Support custom comparator',
    'Include unit tests'
  ],
  evaluationCriteria: { 
    correctness: 0.4, 
    performance: 0.3, 
    readability: 0.2, 
    testCoverage: 0.1 
  }
};

const report = await EvolutionSystem.run(task, {
  agentCount: 10,
  maxGenerations: 50,
  mode: 'standard',
  visualization: true
});

console.log(EvolutionSystem.generateReport(report));
```

## Runtime Modes

| Mode | Agents | Generations | Selection Rate | Best For |
|------|--------|-------------|----------------|----------|
| `quick` | 5 | 20 | 0.2 | Simple tasks, rapid prototyping |
| `standard` | 10 | 50 | 0.1 | Regular tasks, balanced quality/speed |
| `deep` | 20 | 100 | 0.05 | Complex tasks, optimal solutions |
| `team` | 15 | 80 | 0.08 | Multi-domain collaborative tasks |

### Quick Mode Methods

```typescript
const report = await EvolutionSystem.quick(task);     // Quick mode
const report = await EvolutionSystem.standard(task);  // Standard mode
const report = await EvolutionSystem.deep(task);      // Deep evolution
const report = await EvolutionSystem.team(task);      // Team collaboration
```

## Core Concepts

### Agent Lifecycle

1. **Generation**: Diverse agents created with varied strategies and capability profiles
2. **Execution**: Agents attempt task solutions (simulated or via real AI executors)
3. **Evaluation**: Six-dimensional scoring across quality, efficiency, creativity, collaboration, resource usage, and error rate
4. **Selection**: Low-performing agents eliminated based on adaptive selection rate
5. **Evolution**: Survivors produce offspring through genetic crossover and mutation
6. **Knowledge Transfer**: Eliminated agents' experiences extracted to global knowledge pool

### Execution Strategies

The system supports two execution modes:

- **Simulated Execution** (default): Fast, deterministic testing with simulated agent behavior
- **Live Execution**: Real AI execution via OpenAI or custom executors

```typescript
import { EvolutionEngine, OpenAIExecutor, LiveExecution } from '@evolution-system/core';

// Live execution with OpenAI
const executor = new OpenAIExecutor({ 
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4'
});

const engine = new EvolutionEngine(config, undefined, executor);
const report = await engine.run(task);
```

## Advanced Usage

### Plugin System

```typescript
import { EvolutionEngine, PluginManager, BasePlugin } from '@evolution-system/core';

class PerformanceTracker extends BasePlugin {
  name = 'performance-tracker';
  version = '1.0.0';

  onGenerationStart(generation: number, agents: Agent[]) {
    console.log(`Starting generation ${generation} with ${agents.length} agents`);
  }

  onEvolutionComplete(report: EvolutionReport) {
    console.log(`Evolution complete! ${report.totalGenerations} generations`);
  }
}

const pluginManager = new PluginManager();
pluginManager.register(new PerformanceTracker());

const engine = new EvolutionEngine(config, pluginManager);
```

### Custom Metrics

```typescript
import { Evaluator } from '@evolution-system/core';

const evaluator = new Evaluator(config);
evaluator.registerMetric('maintainability', (agent, task, context) => {
  return calculateMaintainability(agent);
});

evaluator.setWeights({
  quality: 0.3,
  efficiency: 0.2,
  maintainability: 0.2,
  creativity: 0.15,
  collaboration: 0.15
});
```

### Real-time Progress

```typescript
const report = await EvolutionSystem.run(task, config, (progress) => {
  console.log(
    `Gen ${progress.generation}: ` +
    `${progress.activeAgents} agents, ` +
    `best: ${(progress.bestScore * 100).toFixed(1)}%`
  );
});
```

### Checkpoint & Resume

```typescript
const engine = new EvolutionEngine(config);

// Save checkpoint
await engine.saveCheckpoint('checkpoint-001');

// Resume later
const report = await engine.resumeFromCheckpoint('checkpoint-001', {
  maxGenerations: 150  // Adjust parameters on resume
});
```

### Misjudgment Recovery

```typescript
const agentManager = engine.getAgentManager();
const eliminated = agentManager.getEliminatedAgents();

// Resurrect high-potential agent
agentManager.resurrectAgent('agent-007');
```

## Report Export

### Multiple Formats

```typescript
import { ReportExporter, ChartGenerator } from '@evolution-system/core';

// JSON
const json = ReportExporter.toJSON(report, { pretty: true });

// CSV
const csv = ReportExporter.toCSV(report);
const timelineCsv = ReportExporter.timelineToCSV(report);

// Markdown
const markdown = ReportExporter.toMarkdown(report);

// HTML Dashboard
const html = ChartGenerator.generateDashboard(report);

// Batch export all formats
const files = ReportExporter.exportAll(report, './output');
```

### Visualization

```typescript
import { ChartGenerator } from '@evolution-system/core';

// Performance over time
const perfChart = ChartGenerator.generatePerformanceChart(report);

// Feature importance
const featureChart = ChartGenerator.generateFeatureImportanceChart(report);

// Strategy distribution
const strategyChart = ChartGenerator.generateStrategyDistributionChart(report);
```

## Configuration

```typescript
interface EvolutionConfig {
  agentCount: number;              // Initial agent count (default: 10)
  selectionRate: number;           // Selection rate per round (default: 0.1)
  mutationRate: number;            // Mutation probability (default: 0.05)
  inheritanceRate: number;         // Experience inheritance ratio (default: 0.3)
  maxGenerations: number;          // Max evolution generations (default: 100)
  collaborationBonus: number;      // Collaboration bonus (default: 0.2)
  knowledgeSharing: boolean;       // Enable knowledge pool (default: true)
  teamMode: boolean;               // Team evolution mode (default: false)
  teamSize?: number;               // Agents per team
  faultTolerance: boolean;         // Fault tolerance (default: true)
  visualization: boolean;          // Visualization reports (default: true)
  evaluationMetrics: string[];     // Evaluation metrics
  mode: 'quick' | 'standard' | 'deep' | 'team';
  rescueThreshold: number;         // Threshold for auto-rescue (default: 0.7)
  convergenceThreshold: number;    // Convergence detection (default: 0.95)
  stagnationLimit: number;         // Stagnation detection (default: 10)
  checkpointInterval: number;      // Checkpoint frequency (default: 10)
}
```

### Config Validation

```typescript
import { ConfigValidator } from '@evolution-system/core';

const { config, warnings } = ConfigValidator.validateWithWarnings({
  agentCount: 15,
  mode: 'deep'
});

if (warnings.length > 0) {
  warnings.forEach(w => console.warn(w));
}
```

## CLI Usage

```bash
# Install globally
npm install -g @evolution-system/core

# Run evolution
evolution run --config ./config.json --task ./task.json --output ./reports

# Generate default config
evolution config --generate --output ./config.json

# Validate config
evolution config --validate ./config.json

# Benchmark
evolution benchmark --iterations 5 --mode quick

# Compare configurations
evolution compare --configs config-a.json config-b.json --task task.json
```

## Architecture

<p align="center">
  <svg width="700" height="500" viewBox="0 0 700 500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="headerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#4a90d9;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#357abd;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="coreGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#5cb85c;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#4cae4c;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="moduleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#f0ad4e;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#ec971f;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="strategyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#d9534f;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#c9302c;stop-opacity:1" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
      </filter>
    </defs>
    
    <!-- EvolutionSystem -->
    <rect x="200" y="10" width="300" height="60" rx="8" fill="url(#headerGrad)" filter="url(#shadow)"/>
    <text x="350" y="35" text-anchor="middle" fill="white" font-size="16" font-weight="bold">EvolutionSystem</text>
    <text x="350" y="55" text-anchor="middle" fill="white" font-size="11">Static API - quick / standard / deep / team</text>
    
    <!-- Arrow down -->
    <line x1="350" y1="70" x2="350" y2="90" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#666"/>
      </marker>
    </defs>
    
    <!-- EvolutionEngine -->
    <rect x="150" y="95" width="400" height="70" rx="8" fill="url(#coreGrad)" filter="url(#shadow)"/>
    <text x="350" y="125" text-anchor="middle" fill="white" font-size="16" font-weight="bold">EvolutionEngine</text>
    <text x="350" y="145" text-anchor="middle" fill="white" font-size="11">Core evolution loop with PluginManager</text>
    
    <!-- Arrows to modules -->
    <line x1="200" y1="165" x2="100" y2="200" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>
    <line x1="267" y1="165" x2="220" y2="200" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>
    <line x1="350" y1="165" x2="350" y2="200" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>
    <line x1="433" y1="165" x2="480" y2="200" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>
    <line x1="500" y1="165" x2="600" y2="200" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>
    
    <!-- Module boxes -->
    <rect x="30" y="205" width="110" height="50" rx="6" fill="url(#moduleGrad)" filter="url(#shadow)"/>
    <text x="85" y="228" text-anchor="middle" fill="white" font-size="12" font-weight="bold">AgentManager</text>
    <text x="85" y="245" text-anchor="middle" fill="white" font-size="9">Lifecycle &amp; Genetics</text>
    
    <rect x="165" y="205" width="110" height="50" rx="6" fill="url(#moduleGrad)" filter="url(#shadow)"/>
    <text x="220" y="228" text-anchor="middle" fill="white" font-size="12" font-weight="bold">TaskDistributor</text>
    <text x="220" y="245" text-anchor="middle" fill="white" font-size="9">Decomposition</text>
    
    <rect x="295" y="205" width="110" height="50" rx="6" fill="url(#moduleGrad)" filter="url(#shadow)"/>
    <text x="350" y="228" text-anchor="middle" fill="white" font-size="12" font-weight="bold">Evaluator</text>
    <text x="350" y="245" text-anchor="middle" fill="white" font-size="9">6D Scoring</text>
    
    <rect x="425" y="205" width="110" height="50" rx="6" fill="url(#moduleGrad)" filter="url(#shadow)"/>
    <text x="480" y="228" text-anchor="middle" fill="white" font-size="12" font-weight="bold">ReportGenerator</text>
    <text x="480" y="245" text-anchor="middle" fill="white" font-size="9">Visualization</text>
    
    <rect x="555" y="205" width="110" height="50" rx="6" fill="url(#moduleGrad)" filter="url(#shadow)"/>
    <text x="610" y="228" text-anchor="middle" fill="white" font-size="12" font-weight="bold">FaultTolerance</text>
    <text x="610" y="245" text-anchor="middle" fill="white" font-size="9">Recovery</text>
    
    <!-- Arrows to ExecutionStrategy -->
    <line x1="85" y1="255" x2="200" y2="310" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>
    <line x1="350" y1="255" x2="350" y2="310" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>
    
    <!-- ExecutionStrategy -->
    <rect x="100" y="315" width="500" height="80" rx="8" fill="url(#strategyGrad)" filter="url(#shadow)"/>
    <text x="350" y="340" text-anchor="middle" fill="white" font-size="14" font-weight="bold">ExecutionStrategy</text>
    
    <!-- Sub-strategies -->
    <rect x="140" y="355" width="160" height="30" rx="4" fill="white" fill-opacity="0.9"/>
    <text x="220" y="375" text-anchor="middle" fill="#333" font-size="11">SimulatedExecution</text>
    
    <rect x="400" y="355" width="160" height="30" rx="4" fill="white" fill-opacity="0.9"/>
    <text x="480" y="375" text-anchor="middle" fill="#333" font-size="11">LiveExecution</text>
    
    <!-- Legend -->
    <rect x="30" y="420" width="640" height="70" rx="6" fill="#f8f9fa" stroke="#dee2e6" stroke-width="1"/>
    <text x="350" y="440" text-anchor="middle" fill="#333" font-size="12" font-weight="bold">Legend</text>
    
    <rect x="50" y="455" width="15" height="15" rx="3" fill="url(#headerGrad)"/>
    <text x="75" y="467" fill="#666" font-size="10">System Entry</text>
    
    <rect x="150" y="455" width="15" height="15" rx="3" fill="url(#coreGrad)"/>
    <text x="175" y="467" fill="#666" font-size="10">Core Engine</text>
    
    <rect x="250" y="455" width="15" height="15" rx="3" fill="url(#moduleGrad)"/>
    <text x="275" y="467" fill="#666" font-size="10">Modules</text>
    
    <rect x="350" y="455" width="15" height="15" rx="3" fill="url(#strategyGrad)"/>
    <text x="375" y="467" fill="#666" font-size="10">Strategy</text>
    
    <text x="50" y="485" fill="#666" font-size="9">• Simulated: Fast testing, default mode</text>
    <text x="350" y="485" fill="#666" font-size="9">• Live: OpenAI / custom AI executors</text>
  </svg>
</p>

## Modules

| Module | Responsibility |
|--------|---------------|
| `EvolutionEngine` | Main evolution loop, coordinates all modules, executes plugin hooks |
| `AgentManager` | Agent lifecycle, genetic recombination, knowledge pool, anti-toxic detection |
| `Evaluator` | Multi-dimensional evaluation, adaptive selection, convergence detection |
| `TaskDistributor` | Task decomposition, intelligent assignment, load balancing |
| `ReportGenerator` | Settlement reports, HTML visualization, multiple export formats |
| `FaultToleranceManager` | Checkpoint resume, misjudgment recovery, health checks, rollback |
| `PluginManager` | Plugin registration, lifecycle hook execution, custom metrics/mutations |
| `ExecutionStrategy` | Abstract execution layer (simulated or live AI execution) |

## Use Cases

- **Complex Problem Solving**: Parallel multi-solution attempts with optimal selection
- **Code Generation**: Multi-agent competition for best implementation
- **Creative Solution Screening**: Fusion of multiple approaches into optimal output
- **Data Analysis**: Multi-perspective analysis synthesis
- **AI Model Training**: Adversarial evolution for performance improvement
- **Code Review**: Multi-view quality inspection
- **Risk Assessment**: Parallel multi-model evaluation
- **Content Creation**: Multi-style competition for optimal output

## API Reference

See [SKILL.md](./SKILL.md) for detailed API documentation and usage examples.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
git clone https://github.com/evolution-system/evolution-system.git
cd evolution-system
npm install
npm run build
npm test
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
