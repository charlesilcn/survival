import { EvolutionConfig, Agent, EvaluationResult, EvolutionReport, Task, MetricFn } from '../types';

export interface MutationStrategy {
  name: string;
  apply(agent: Agent, intensity: number): void;
}

export interface EvolutionPlugin {
  name: string;
  version: string;
  
  // Lifecycle hooks
  onInitialize?(config: EvolutionConfig): void | Promise<void>;
  onGenerationStart?(generation: number, agents: Agent[]): void | Promise<void>;
  onGenerationEnd?(generation: number, results: EvaluationResult[]): void | Promise<void>;
  onAgentEliminated?(agent: Agent, reason: string): void | Promise<void>;
  onEvolutionComplete?(report: EvolutionReport): void | Promise<void>;
  
  // Custom metrics
  registerMetrics?(): Map<string, MetricFn>;
  
  // Custom mutations
  registerMutations?(): MutationStrategy[];
  
  // Configuration modifications
  modifyConfig?(config: EvolutionConfig): EvolutionConfig;
}

export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  dependencies?: string[];
  compatibleVersions?: string[];
}

export class BasePlugin implements EvolutionPlugin {
  name: string = 'base-plugin';
  version: string = '1.0.0';
  
  protected config?: EvolutionConfig;
  
  onInitialize(config: EvolutionConfig): void {
    this.config = config;
  }
  
  onGenerationStart?(): void { /* no-op */ }
  onGenerationEnd?(): void { /* no-op */ }
  onAgentEliminated?(): void { /* no-op */ }
  onEvolutionComplete?(): void { /* no-op */ }
}
