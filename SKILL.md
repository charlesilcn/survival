---
name: "evolution"
description: "Multi-agent competitive evolution system based on natural selection. Launches multiple agents to compete on tasks through generational evolution, progressively selecting the best while survivors learn from eliminated agents. Invoke when user wants competitive multi-agent optimization, iterative agent selection, or evolutionary problem solving."
---

# Multi-Agent Competitive Evolution System

Based on the "Competitive Evolution" philosophy: natural selection, survival of the fittest. Multiple agents execute tasks simultaneously, progressively filtering out underperforming agents. Other agents learn from eliminated agents through genetic recombination and mutation, continuously evolving to produce optimal solutions.

## When to Use

- Need multiple agents to attempt different solutions in parallel for complex problems
- Need to screen and fuse optimal results from multiple candidate solutions
- Need to conduct A/B comparison tests of different strategies
- Need AI models or strategies to continuously improve through adversarial evolution
- Creative solutions require exploration in multiple directions before fusing the best elements

## Quick Start

```typescript
import { EvolutionSystem } from '@evolution-system/core';

const task = {
  id: 'sort-algorithm-task',
  type: 'code_generation',
  description: 'Implement an efficient sorting algorithm',
  requirements: ['Time complexity better than O(n²)', 'Support custom comparator', 'Include unit tests'],
  evaluationCriteria: { correctness: 0.4, performance: 0.3, readability: 0.2, testCoverage: 0.1 }
};

const report = await EvolutionSystem.run(task, {
  agentCount: 10,
  maxGenerations: 50,
  mode: 'standard',
  visualization: true
});

console.log(EvolutionSystem.generateReport(report));
```

## Four Runtime Modes

| Mode | Agent Count | Max Generations | Selection Rate | Use Case |
|------|-------------|-----------------|----------------|----------|
| `quick` | 5 | 20 | 0.2 | Simple tasks, quick results |
| `standard` | 10 | 50 | 0.1 | Regular tasks, balanced quality/speed |
| `deep` | 20 | 100 | 0.05 | Complex tasks, optimal solutions |
| `team` | 15 | 80 | 0.08 | Multi-domain collaborative tasks |

## Quick Mode Methods

```typescript
const report = await EvolutionSystem.quick(task);    // Quick mode
const report = await EvolutionSystem.standard(task); // Standard mode
const report = await EvolutionSystem.deep(task);     // Deep evolution
const report = await EvolutionSystem.team(task);     // Team collaboration
```

## Core Mechanisms

### Agent Generation & Initialization
Create a diverse population of agents with varied strategies and capability profiles. Each agent possesses traits such as speed, accuracy, creativity, collaboration, efficiency, and robustness.

### Parallel Task Execution
The task distributor intelligently decomposes large tasks into subtasks, assigning them based on each agent's strengths, with support for team mode.

### Competitive Selection
The evaluation system scores agents across six dimensions: quality, efficiency, creativity, collaboration, resource usage, and error rate. Low-scoring agents are eliminated according to an adaptive selection rate.

### Experience Inheritance & Evolution
Eliminated agents' failure experiences are extracted into a global knowledge pool. Surviving agents produce offspring through crossover and mutation, inheriting excellent genes.

### Collaboration Promotion
The knowledge sharing pool encourages agents to contribute experiences for score bonuses. Anti-toxic competition detection prevents malicious behavior, and niche protection prevents single-strategy monopolies.

### Visual Settlement Reports
Automatically generates comprehensive reports including elimination analysis, evolution timeline, performance comparison charts, and feature importance. Supports both console display and HTML export.

### Fault Tolerance & Recovery
Supports misjudgment recovery (resurrecting high-potential agents that were mistakenly eliminated), checkpoint resume, and version rollback.

## Advanced Features

### Custom Evaluation Metrics
```typescript
import { Evaluator } from '@evolution-system/core';

const evaluator = new Evaluator(config);
evaluator.registerMetric('maintainability', (agent, task, ctx) => {
  return calculateMaintainability(agent);
});
evaluator.setWeights({ quality: 0.3, efficiency: 0.2, maintainability: 0.2, creativity: 0.15, collaboration: 0.15 });
```

### Real-time Progress Callback
```typescript
const report = await EvolutionSystem.run(task, config, (progress) => {
  console.log(`Gen ${progress.generation}: ${progress.activeAgents} agents, best: ${progress.bestScore.toFixed(3)}`);
});
```

### A/B Comparison Experiment
```typescript
const experiment = EvolutionSystem.experiment()
  .addGroup('aggressive', { selectionRate: 0.2 })
  .addGroup('conservative', { selectionRate: 0.05 });

const results = await experiment.run(task);
const comparison = experiment.compareResults(results);
```

### Checkpoint Resume
```typescript
const engine = new EvolutionEngine(config);
await engine.saveCheckpoint('checkpoint_001');
const report = await engine.resumeFromCheckpoint('checkpoint_001', { maxGenerations: 150 });
```

### Misjudgment Recovery
```typescript
const eliminated = agentManager.getEliminatedAgents();
agentManager.resurrectAgent('agent_007');
```

### HTML Report Export
```typescript
const html = EvolutionSystem.exportHtml(report);
// Can be written to file or displayed directly in browser
```

## Configuration Parameters

```typescript
interface EvolutionConfig {
  agentCount: number;           // Initial agent count (default: 10)
  selectionRate: number;         // Selection rate per round (default: 0.1)
  mutationRate: number;          // Mutation probability (default: 0.05)
  inheritanceRate: number;       // Experience inheritance ratio (default: 0.3)
  maxGenerations: number;        // Max evolution generations (default: 100)
  collaborationBonus: number;    // Collaboration bonus (default: 0.2)
  knowledgeSharing: boolean;     // Enable knowledge pool (default: true)
  teamMode: boolean;             // Team evolution mode (default: false)
  teamSize?: number;             // Agents per team
  faultTolerance: boolean;       // Fault tolerance (default: true)
  visualization: boolean;        // Visualization reports (default: true)
  evaluationMetrics: string[];   // Evaluation metrics
  mode: EvolutionMode;           // Runtime mode
}
```

## Architecture Modules

| Module | Responsibility |
|--------|---------------|
| `EvolutionEngine` | Main evolution loop, coordinates all modules |
| `AgentManager` | Agent lifecycle, genetic recombination, knowledge pool |
| `Evaluator` | Multi-dimensional evaluation, adaptive selection, convergence detection |
| `TaskDistributor` | Task decomposition, intelligent assignment, load balancing |
| `ReportGenerator` | Settlement reports, HTML visualization |
| `FaultToleranceManager` | Checkpoint resume, misjudgment recovery, health checks |

## Use Cases

- Complex problem solving (parallel multi-solution attempts)
- Code generation and optimization (multi-agent competition for best implementation)
- Creative solution screening (fusion of multiple approaches)
- Data analysis (multi-perspective analysis synthesis)
- AI model training (adversarial evolution for performance improvement)
- Code review (multi-view quality inspection)
- Risk assessment (parallel multi-model evaluation)
- Content creation (multi-style competition for optimal output)

## Installation

### Trae Platform
```bash
/skill install evolution
# or
npm install @trae/skill-evolution
```

### OpenCLAW Platform
```bash
openclaw install evolution
```

### Node.js Standalone
```bash
npm install @evolution-system/core
```