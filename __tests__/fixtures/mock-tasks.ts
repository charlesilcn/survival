import { Task, EvolutionConfig } from '../../src/types';

export const mockTask: Task = {
  id: 'test-task-001',
  type: 'code_generation',
  description: 'Implement a sorting algorithm',
  requirements: ['Time complexity O(n log n)', 'Handle edge cases'],
  constraints: { maxLines: 50 },
  evaluationCriteria: { correctness: 0.5, performance: 0.5 },
  timeout: 5000,
  priority: 1,
};

export const mockConfig: EvolutionConfig = {
  agentCount: 5,
  selectionRate: 0.2,
  mutationRate: 0.1,
  inheritanceRate: 0.3,
  maxGenerations: 10,
  collaborationBonus: 0.2,
  knowledgeSharing: true,
  teamMode: false,
  faultTolerance: true,
  visualization: false,
  evaluationMetrics: ['quality', 'efficiency'],
  mode: 'quick',
  rescueThreshold: 0.7,
  convergenceThreshold: 0.95,
  stagnationLimit: 5,
  checkpointInterval: 5,
};

export const complexTask: Task = {
  id: 'complex-task-001',
  type: 'optimization',
  description: 'Optimize a neural network architecture',
  requirements: [
    'Minimize inference time',
    'Maintain accuracy above 95%',
    'Support batch processing',
    'Memory efficient',
  ],
  constraints: {
    maxParameters: 1000000,
    maxLayers: 50,
  },
  evaluationCriteria: {
    accuracy: 0.4,
    speed: 0.3,
    memory: 0.2,
    complexity: 0.1,
  },
  timeout: 30000,
  priority: 2,
};
