import { Agent, Task } from '../types';
import { AgentExecutor, ExecutionResult } from './interface';
import { AgentManager } from '../agent-manager';

const RESOURCE_COST_MIN = 10;
const RESOURCE_COST_MAX = 40;
const DEFAULT_RESOURCE_MIN = 5;
const DEFAULT_RESOURCE_MAX = 25;
const KNOWLEDGE_SHARING_CHANCE = 0.3;
const KNOWLEDGE_ACQUISITION_CHANCE = 0.5;

export interface ExecutionStrategy {
  readonly name: string;

  executeSubTask(
    agent: Agent,
    subTask: { id: string; description: string },
    task: Task
  ): Promise<unknown>;

  handleKnowledgeSharing(
    agent: Agent,
    agentManager: AgentManager,
    generation: number,
    knowledgeSharingEnabled: boolean
  ): void;

  generateResourceCost(agent: Agent, hasAssignments: boolean): number;

  generateErrorCount(agent: Agent, hasAssignments: boolean): number;
}

export class SimulatedExecution implements ExecutionStrategy {
  readonly name = 'simulated';

  async executeSubTask(
    agent: Agent,
    subTask: { id: string; description: string },
    task: Task
  ): Promise<unknown> {
    if (task.data && subTask.id in task.data) {
      return task.data[subTask.id];
    }

    return {
      agentId: agent.id,
      strategy: agent.strategy,
      subTaskId: subTask.id,
      quality: agent.profile.accuracy * (0.5 + Math.random() * 0.5),
      complexity: agent.profile.creativity * (0.3 + Math.random() * 0.7),
      result: `Solution by ${agent.id} using ${agent.strategy}`,
    };
  }

  handleKnowledgeSharing(
    agent: Agent,
    agentManager: AgentManager,
    generation: number,
    knowledgeSharingEnabled: boolean
  ): void {
    if (!knowledgeSharingEnabled) return;

    if (Math.random() < KNOWLEDGE_SHARING_CHANCE) {
      agentManager.contributeKnowledge(
        agent.id,
        `Insight from agent ${agent.id} at generation ${generation}`,
        'insight'
      );
    }

    if (Math.random() < KNOWLEDGE_ACQUISITION_CHANCE) {
      agentManager.acquireKnowledge(agent.id, 3);
    }
  }

  generateResourceCost(_agent: Agent, hasAssignments: boolean): number {
    if (hasAssignments) {
      return Math.random() * (RESOURCE_COST_MAX - RESOURCE_COST_MIN) + RESOURCE_COST_MIN;
    }
    return Math.random() * (DEFAULT_RESOURCE_MAX - DEFAULT_RESOURCE_MIN) + DEFAULT_RESOURCE_MIN;
  }

  generateErrorCount(_agent: Agent, hasAssignments: boolean): number {
    if (hasAssignments) return 0;
    return Math.floor(Math.random() * 3);
  }
}

export class LiveExecution implements ExecutionStrategy {
  readonly name = 'live';

  private executor: AgentExecutor;

  constructor(executor: AgentExecutor) {
    this.executor = executor;
  }

  async executeSubTask(
    agent: Agent,
    subTask: { id: string; description: string },
    task: Task
  ): Promise<unknown> {
    try {
      const result: ExecutionResult = await this.executor.execute(task, agent);

      return {
        agentId: agent.id,
        strategy: agent.strategy,
        subTaskId: subTask.id,
        output: result.output,
        tokensUsed: result.tokensUsed,
        latency: result.latency,
        cost: result.cost,
        metadata: result.metadata,
      };
    } catch (error) {
      return {
        agentId: agent.id,
        strategy: agent.strategy,
        subTaskId: subTask.id,
        error: error instanceof Error ? error.message : 'Execution failed',
        output: '',
      };
    }
  }

  handleKnowledgeSharing(
    agent: Agent,
    agentManager: AgentManager,
    generation: number,
    knowledgeSharingEnabled: boolean
  ): void {
    if (!knowledgeSharingEnabled) return;

    if (Math.random() < KNOWLEDGE_SHARING_CHANCE) {
      agentManager.contributeKnowledge(
        agent.id,
        `Insight from agent ${agent.id} at generation ${generation}`,
        'insight'
      );
    }

    if (Math.random() < KNOWLEDGE_ACQUISITION_CHANCE) {
      agentManager.acquireKnowledge(agent.id, 3);
    }
  }

  generateResourceCost(_agent: Agent, hasAssignments: boolean): number {
    if (hasAssignments) {
      return Math.random() * (RESOURCE_COST_MAX - RESOURCE_COST_MIN) + RESOURCE_COST_MIN;
    }
    return Math.random() * (DEFAULT_RESOURCE_MAX - DEFAULT_RESOURCE_MIN) + DEFAULT_RESOURCE_MIN;
  }

  generateErrorCount(agent: Agent, hasAssignments: boolean): number {
    if (!hasAssignments) return Math.floor(Math.random() * 3);

    // Errors proportional to low accuracy
    return agent.profile.accuracy < 0.5 ? Math.floor(Math.random() * 2) : 0;
  }
}