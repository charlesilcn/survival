import {
  Agent,
  AgentStatus,
  EvaluationMetrics,
  EvaluationResult,
  EvaluationContext,
  MetricFn,
  EvolutionConfig,
  Task,
  EliminationRecord,
} from './types';

export class Evaluator {
  private config: EvolutionConfig;
  private metrics: Map<string, MetricFn> = new Map();
  private weights: Record<string, number>;
  private evaluationLog: EvaluationResult[] = [];
  private eliminationRecords: EliminationRecord[] = [];

  constructor(config: EvolutionConfig, weights?: Record<string, number>) {
    this.config = config;
    this.weights = weights || {
      quality: 0.30,
      efficiency: 0.20,
      creativity: 0.15,
      collaboration: 0.15,
      resourceUsage: 0.10,
      errorRate: 0.10,
    };
    this.registerDefaultMetrics();
  }

  registerMetric(name: string, fn: MetricFn): void {
    this.metrics.set(name, fn);
    if (!(name in this.weights)) {
      this.weights[name] = 0.05;
    }
  }

  setWeights(weights: Record<string, number>): void {
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (Math.abs(total - 1.0) > 0.01) {
      const normalized: Record<string, number> = {};
      for (const [key, val] of Object.entries(weights)) {
        normalized[key] = val / total;
      }
      this.weights = normalized;
    } else {
      this.weights = weights;
    }
  }

  evaluateAgents(
    agents: Agent[],
    task: Task,
    context: EvaluationContext
  ): EvaluationResult[] {
    const results: EvaluationResult[] = [];

    for (const agent of agents) {
      if (agent.status === AgentStatus.ELIMINATED) continue;
      const result = this.evaluateSingle(agent, task, context);
      results.push(result);
    }

    results.sort((a, b) => b.overallScore - a.overallScore);
    results.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    this.evaluationLog.push(...results);
    return results;
  }

  evaluateSingle(
    agent: Agent,
    task: Task,
    context: EvaluationContext
  ): EvaluationResult {
    const metrics: Record<string, number> = {};
    let overallScore = 0;

    for (const [name, metricFn] of this.metrics) {
      const score = this.clamp(metricFn(agent, task, context), 0, 1);
      metrics[name] = score;
      const weight = this.weights[name] || 0;
      overallScore += score * weight;
    }

    return {
      agentId: agent.id,
      generation: context.generation,
      metrics: this.toEvaluationMetrics(metrics),
      overallScore,
      rank: 0,
      details: {
        profile: agent.profile,
        strategy: agent.strategy,
        rawMetrics: metrics,
      },
      timestamp: Date.now(),
    };
  }

  selectSurvivors(
    evaluationResults: EvaluationResult[],
    agents: Agent[]
  ): { survivors: string[]; eliminated: EliminationRecord[] } {
    const selectionRate = this.calculateAdaptiveSelectionRate(evaluationResults);
    const cutoffIndex = Math.max(
      1,
      Math.floor(evaluationResults.length * (1 - selectionRate))
    );

    const sorted = [...evaluationResults].sort(
      (a, b) => b.overallScore - a.overallScore
    );

    const survivorIds = new Set(sorted.slice(0, cutoffIndex).map((r) => r.agentId));
    const eliminated: EliminationRecord[] = [];

    for (let i = cutoffIndex; i < sorted.length; i++) {
      const result = sorted[i];
      const agent = agents.find((a) => a.id === result.agentId);
      const reason = this.generateEliminationReason(result, agent);

      const record: EliminationRecord = {
        agentId: result.agentId,
        generation: result.generation,
        reason,
        metrics: result.metrics,
        eliminatedAt: Date.now(),
        recoverable: this.isRecoverable(result),
      };

      eliminated.push(record);
    }

    this.eliminationRecords.push(...eliminated);

    return {
      survivors: Array.from(survivorIds),
      eliminated,
    };
  }

  getEliminationRecords(): EliminationRecord[] {
    return this.eliminationRecords;
  }

  getEvaluationLog(): EvaluationResult[] {
    return this.evaluationLog;
  }

  getFeatureImportance(generation: number): Record<string, number> {
    const genResults = this.evaluationLog.filter(
      (r) => r.generation === generation
    );
    if (genResults.length === 0) return {};

    const survivors = genResults.slice(0, Math.max(1, genResults.length / 2));
    const eliminated = genResults.slice(survivors.length);

    const importance: Record<string, number> = {};
    const metricKeys = Object.keys(this.weights);

    for (const key of metricKeys) {
      const survivorAvg =
        survivors.reduce((s, r) => s + (r.metrics[key as keyof EvaluationMetrics] || 0), 0) / survivors.length;
      const eliminatedAvg =
        eliminated.reduce((s, r) => s + (r.metrics[key as keyof EvaluationMetrics] || 0), 0) / (eliminated.length || 1);

      importance[key] = Math.abs(survivorAvg - eliminatedAvg);
    }

    return importance;
  }

  isConverged(evaluationResults: EvaluationResult[]): boolean {
    if (evaluationResults.length < 2) return false;
    const threshold = this.config.convergenceThreshold || 0.95;
    const topScores = evaluationResults
      .slice(0, Math.ceil(evaluationResults.length * 0.3))
      .map((r) => r.overallScore);

    const avg = topScores.reduce((s, v) => s + v, 0) / topScores.length;
    const variance =
      topScores.reduce((s, v) => s + (v - avg) ** 2, 0) / topScores.length;

    return variance < (1 - threshold);
  }

  isStagnant(generationResults: EvaluationResult[][]): boolean {
    if (generationResults.length < 2) return false;

    const limit = this.config.stagnationLimit || 10;
    const recent = generationResults.slice(-limit);
    const topScores = recent.map(
      (gen) => Math.max(...gen.map((r) => r.overallScore))
    );

    const firstHalf = topScores.slice(0, Math.floor(topScores.length / 2));
    const secondHalf = topScores.slice(Math.floor(topScores.length / 2));

    const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;

    return Math.abs(secondAvg - firstAvg) < 0.01;
  }

  // ---- Adaptive Selection Rate ----

  private calculateAdaptiveSelectionRate(
    results: EvaluationResult[]
  ): number {
    const diversity =
      new Set(results.map((r) => r.overallScore.toFixed(3))).size /
      results.length;

    const baseRate = this.config.selectionRate;
    const diversityFactor = Math.max(0.5, diversity);
    const adjustedRate = baseRate * diversityFactor;

    return Math.min(adjustedRate, 0.5);
  }

  // ---- Elimination Reason Analysis ----

  private generateEliminationReason(
    result: EvaluationResult,
    agent?: Agent
  ): string {
    const reasons: string[] = [];
    const sortedMetrics = Object.entries(this.weights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    for (const [key, weight] of sortedMetrics) {
      const score = result.metrics[key as keyof EvaluationMetrics] || 0;
      if (score < 0.3) {
        reasons.push(`${key} score critically low (${score.toFixed(2)}, weight: ${weight.toFixed(2)})`);
      }
    }

    if (agent && agent.fitness < 0.2) {
      reasons.push(`overall fitness too low (${agent.fitness.toFixed(2)})`);
    }

    if (reasons.length === 0) {
      reasons.push(
        `eliminated due to competition, rank ${result.rank} with score ${result.overallScore.toFixed(3)}`
      );
    }

    return reasons.join('; ');
  }

  // ---- Recoverability Assessment ----

  private isRecoverable(result: EvaluationResult): boolean {
    const rescueThreshold = this.config.rescueThreshold || 0.7;
    const hasHighMetric = Object.values(result.metrics).some(
      (v) => v >= rescueThreshold
    );

    const weightedPenalty = Object.entries(this.weights)
      .filter(([key]) => (result.metrics[key as keyof EvaluationMetrics] || 0) < 0.3)
      .reduce((sum, [, w]) => sum + w, 0);

    return hasHighMetric && weightedPenalty <= 0.5;
  }

  // ---- Default Metric Functions ----

  private registerDefaultMetrics(): void {
    this.metrics.set('quality', (agent, _task, ctx) => {
      const taskResult = ctx.taskResults.get(agent.id);
      if (taskResult === undefined) return 0;
      const quality = typeof taskResult === 'object' && taskResult !== null
        ? Object.keys(taskResult).length / 10
        : 0.5;
      return this.clamp(quality * agent.profile.accuracy, 0, 1);
    });

    this.metrics.set('efficiency', (agent, task, ctx) => {
      const resources = ctx.resourceUsage.get(agent.id) || 1;
      const baseEfficiency = agent.profile.efficiency * agent.profile.speed;
      const resourcePenalty = Math.min(resources / 100, 0.5);
      const constraintsBonus = Object.keys(task.constraints).length * 0.05;
      return this.clamp(baseEfficiency - resourcePenalty + constraintsBonus, 0, 1);
    });

    this.metrics.set('creativity', (agent, _task, _ctx) => {
      const profileBonus = agent.profile.creativity * 0.6;
      const strategyBonus = agent.strategy !== 'iterative-refinement' ? 0.2 : 0;
      const knowledgeBonus = agent.knowledge.length > 10 ? 0.2 : 0;
      return this.clamp(profileBonus + strategyBonus + knowledgeBonus, 0, 1);
    });

    this.metrics.set('collaboration', (agent, _task, ctx) => {
      const contributions = ctx.collaborationContributions.get(agent.id) || 0;
      const profileBonus = agent.profile.collaboration * 0.4;
      const contributionBonus = Math.min(contributions / 20, 0.6);
      return this.clamp(profileBonus + contributionBonus, 0, 1);
    });

    this.metrics.set('resourceUsage', (agent, _task, ctx) => {
      const resources = ctx.resourceUsage.get(agent.id) || 50;
      return this.clamp(1 - resources / 100, 0, 1);
    });

    this.metrics.set('errorRate', (agent, _task, ctx) => {
      const errors = ctx.errorCounts.get(agent.id) || 0;
      return this.clamp(1 - errors / 10, 0, 1);
    });
  }

  // ---- Utility Methods ----

  private toEvaluationMetrics(metrics: Record<string, number>): EvaluationMetrics {
    return {
      quality: metrics['quality'] || 0,
      efficiency: metrics['efficiency'] || 0,
      creativity: metrics['creativity'] || 0,
      collaboration: metrics['collaboration'] || 0,
      resourceUsage: metrics['resourceUsage'] || 0,
      errorRate: metrics['errorRate'] || 0,
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

export type { EvaluationContext };