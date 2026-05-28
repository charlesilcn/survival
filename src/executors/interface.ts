import { Agent, Task } from '../types';

export interface ExecutionResult {
  output: string;
  tokensUsed?: number;
  latency?: number;
  cost?: number;
  metadata?: Record<string, unknown>;
}

export interface AgentExecutor {
  readonly name: string;
  readonly version: string;
  
  execute(task: Task, agent: Agent): Promise<ExecutionResult>;
  supports(model: string): boolean;
  getCapabilities(): string[];
  estimateCost(task: Task, agent: Agent): number;
}

export interface ExecutorConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
  maxRetries?: number;
  rateLimit?: number;
}

export abstract class BaseExecutor implements AgentExecutor {
  abstract readonly name: string;
  abstract readonly version: string;
  
  protected config: ExecutorConfig;
  
  constructor(config: ExecutorConfig = {}) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      rateLimit: 10,
      ...config,
    };
  }
  
  abstract execute(task: Task, agent: Agent): Promise<ExecutionResult>;
  abstract supports(model: string): boolean;
  
  getCapabilities(): string[] {
    return ['text-generation'];
  }
  
  estimateCost(task: Task, agent: Agent): number {
    // Base cost estimation
    const complexity = task.requirements.length;
    return complexity * 0.001;
  }
  
  protected buildSystemPrompt(agent: Agent): string {
    return `You are an AI agent with the following characteristics:
- Speed: ${(agent.profile.speed * 100).toFixed(0)}%
- Accuracy: ${(agent.profile.accuracy * 100).toFixed(0)}%
- Creativity: ${(agent.profile.creativity * 100).toFixed(0)}%
- Collaboration: ${(agent.profile.collaboration * 100).toFixed(0)}%
- Strategy: ${agent.strategy}

Approach the task according to your profile. Be concise and effective.`;
  }
  
  protected mapCreativityToTemp(creativity: number): number {
    // Map 0-1 creativity to 0-1 temperature
    return Math.min(1, Math.max(0, creativity));
  }
}
