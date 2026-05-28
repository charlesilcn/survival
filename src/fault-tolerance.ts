import { v4 as uuidv4 } from 'uuid';
import {
  Agent,
  AgentStatus,
  EvolutionConfig,
  Checkpoint,
  EliminationRecord,
  TimelineEvent,
} from './types';
import { AgentManager } from './agent-manager';

export class FaultToleranceManager {
  private checkpoints: Map<string, Checkpoint> = new Map();
  private rescueLog: Array<{ agentId: string; reason: string; timestamp: number }> = [];
  private healthStatus: 'healthy' | 'degraded' | 'failed' = 'healthy';
  private errorCount: number = 0;
  private timeline: TimelineEvent[] = [];
  private readonly MAX_ERRORS = 5;
  private readonly RESCUE_COOLDOWN = 1000;

  saveCheckpoint(
    id: string,
    taskId: string,
    generation: number,
    agents: Agent[],
    knowledgePool: import('./types').KnowledgeEntry[],
    config: EvolutionConfig,
    timeline: TimelineEvent[]
  ): void {
    this.timeline = timeline.map(t => ({ ...t }));

    const checkpoint: Checkpoint = {
      id,
      taskId,
      generation,
      agents: agents.map((a) => ({ ...a })),
      knowledgePool: knowledgePool.map((k) => ({ ...k })),
      config: { ...config },
      timestamp: Date.now(),
    };

    this.checkpoints.set(id, checkpoint);
  }

  loadCheckpoint(id: string): Checkpoint | undefined {
    const checkpoint = this.checkpoints.get(id);
    if (checkpoint) {
      this.errorCount = 0;
      this.healthStatus = 'healthy';
    }
    return checkpoint;
  }

  listCheckpoints(): Array<{ id: string; generation: number; timestamp: number }> {
    return Array.from(this.checkpoints.entries()).map(([id, cp]) => ({
      id,
      generation: cp.generation,
      timestamp: cp.timestamp,
    }));
  }

  getLatestCheckpoint(): Checkpoint | undefined {
    if (this.checkpoints.size === 0) return undefined;
    return Array.from(this.checkpoints.values()).sort(
      (a, b) => b.timestamp - a.timestamp
    )[0];
  }

  autoRescue(
    agentManager: AgentManager,
    eliminated: Agent[]
  ): number {
    let rescued = 0;

    for (const agent of eliminated) {
      if (agent.status !== AgentStatus.ELIMINATED) continue;

      if (this.shouldRescue(agent)) {
        const restored = agentManager.resurrectAgent(agent.id);
        if (restored) {
          rescued++;
          this.rescueLog.push({
            agentId: agent.id,
            reason: `Auto-rescue: high potential profile detected`,
            timestamp: Date.now(),
          });
        }
      }
    }

    return rescued;
  }

  attemptAutoRescue(
    eliminationRecords: EliminationRecord[],
    agentManager: AgentManager
  ): number {
    let rescued = 0;

    for (const record of eliminationRecords) {
      if (!record.recoverable) continue;

      const agent = agentManager.getAgent(record.agentId);
      if (!agent || agent.status !== AgentStatus.ELIMINATED) continue;

      const restored = agentManager.resurrectAgent(record.agentId);
      if (restored) {
        rescued++;
        this.rescueLog.push({
          agentId: record.agentId,
          reason: `Auto-rescue via recovery mechanism`,
          timestamp: Date.now(),
        });
      }
    }

    return rescued;
  }

  rollback(
    agentManager: AgentManager,
    targetGeneration: number,
    fallbackAgents: Agent[]
  ): void {
    agentManager.restoreFromSnapshot(fallbackAgents, targetGeneration);
    this.errorCount = 0;
    this.healthStatus = 'healthy';

    this.rescueLog.push({
      agentId: 'system',
      reason: `Rollback to generation ${targetGeneration}`,
      timestamp: Date.now(),
    });
  }

  getHealthStatus(): 'healthy' | 'degraded' | 'failed' {
    return this.healthStatus;
  }

  checkHealth(): { status: string; errorCount: number; rescueCount: number } {
    return {
      status: this.healthStatus,
      errorCount: this.errorCount,
      rescueCount: this.rescueLog.length,
    };
  }

  recordError(): void {
    this.errorCount++;
    if (this.errorCount >= this.MAX_ERRORS) {
      this.healthStatus = 'failed';
    } else if (this.errorCount >= this.MAX_ERRORS / 2) {
      this.healthStatus = 'degraded';
    }
  }

  getRescueLog(): typeof this.rescueLog {
    return this.rescueLog;
  }

  getTimeline(): TimelineEvent[] {
    return this.timeline;
  }

  private shouldRescue(agent: Agent): boolean {
    const highTraits = [
      agent.profile.accuracy,
      agent.profile.creativity,
      agent.profile.collaboration,
      agent.profile.robustness,
    ].filter((v) => v >= 0.7).length;

    if (highTraits >= 2) return true;

    if (agent.fitness > 0.6 && agent.generation <= 3) return true;

    return false;
  }
}