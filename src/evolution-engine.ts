import { v4 as uuidv4 } from 'uuid';
import {
  Agent,
  AgentStatus,
  EvolutionConfig,
  Task,
  EvolutionReport,
  ExplainabilityReport,
  Counterfactual,
  StrategyEvolution,
  TimelineEvent,
  EvaluationResult,
} from './types';
import { AgentManager } from './agent-manager';
import { Evaluator, EvaluationContext } from './evaluator';
import { TaskDistributor } from './task-distributor';
import { ReportGenerator } from './report-generator';
import { FaultToleranceManager } from './fault-tolerance';
import { PluginManager } from './plugins/manager';
import { AgentExecutor } from './executors/interface';
import { ExecutionStrategy, SimulatedExecution, LiveExecution } from './executors/execution-strategy';

export interface EvolutionProgress {
  generation: number;
  activeAgents: number;
  bestScore: number;
  avgScore: number;
  isComplete: boolean;
}

export class EvolutionEngine {
  private agentManager: AgentManager;
  private evaluator: Evaluator;
  private taskDistributor: TaskDistributor;
  private reportGenerator: ReportGenerator;
  private faultTolerance: FaultToleranceManager;
  private pluginManager: PluginManager;
  private executor: AgentExecutor | null;
  private executionStrategy: ExecutionStrategy;
  private config: EvolutionConfig;
  private currentGeneration: number = 0;
  private task: Task | null = null;
  private timeline: TimelineEvent[] = [];
  private generationResults: EvaluationResult[][] = [];
  private isRunning: boolean = false;
  private onProgress?: (progress: EvolutionProgress) => void;

  constructor(
    config: EvolutionConfig,
    pluginManager?: PluginManager,
    executor?: AgentExecutor
  ) {
    const pm = pluginManager || new PluginManager();
    this.config = pm.modifyConfig(config);

    this.pluginManager = pm;
    this.executor = executor || null;
    this.executionStrategy = executor
      ? new LiveExecution(executor)
      : new SimulatedExecution();
    this.agentManager = new AgentManager(this.config);
    this.evaluator = new Evaluator(this.config);
    this.taskDistributor = new TaskDistributor();
    this.reportGenerator = new ReportGenerator();
    this.faultTolerance = new FaultToleranceManager();
  }

  async run(task: Task, onProgress?: (progress: EvolutionProgress) => void): Promise<EvolutionReport> {
    this.task = task;
    this.onProgress = onProgress;
    this.isRunning = true;
    this.timeline = [];
    this.generationResults = [];
    this.currentGeneration = 0;

    this.agentManager.initializeAgents();
    await this.pluginManager.executeHook('onInitialize', this.config);
    this.addTimelineEvent('generation_start', `Evolution started with ${this.config.agentCount} agents`);

    for (let gen = 0; gen < this.config.maxGenerations; gen++) {
      if (!this.isRunning) break;

      this.currentGeneration = gen;
      this.agentManager.incrementGeneration();

      const activeAgents = this.agentManager.getActiveAgents();
      await this.pluginManager.executeHook('onGenerationStart', gen, activeAgents);

      this.addTimelineEvent('generation_start', `Generation ${gen} started`);

      if (activeAgents.length <= 1) {
        this.addTimelineEvent('convergence', `Only ${activeAgents.length} agent(s) remaining`);
        break;
      }

      const context = await this.executeGeneration(activeAgents, task);

      const results = this.evaluator.evaluateAgents(activeAgents, task, context);
      this.generationResults.push(results);

      const bestScore = results[0]?.overallScore ?? 0;
      const avgScore =
        results.reduce((s, r) => s + r.overallScore, 0) / results.length;

      this.notifyProgress(bestScore, avgScore);

      const { survivors, eliminated } = this.evaluator.selectSurvivors(results, activeAgents);

      for (const record of eliminated) {
        const agent = activeAgents.find(a => a.id === record.agentId);
        this.agentManager.eliminateAgent(record.agentId, record.reason);
        if (agent) {
          await this.pluginManager.executeHook('onAgentEliminated', agent, record.reason);
        }
        this.addTimelineEvent('elimination', record.reason, { agentId: record.agentId });
      }

      if (this.config.faultTolerance) {
        const rescuedCount = this.faultTolerance.attemptAutoRescue(
          eliminated,
          this.agentManager
        );
        for (let i = 0; i < rescuedCount; i++) {
          this.addTimelineEvent('rescue', 'Agent rescued via auto-rescue');
        }
      }

      await this.pluginManager.executeHook('onGenerationEnd', gen, results);

      if (this.evaluator.isConverged(results)) {
        this.addTimelineEvent('convergence', `Convergence reached at generation ${gen}`);
        break;
      }

      if (this.evaluator.isStagnant(this.generationResults)) {
        this.applyForcedMutations(activeAgents);
        this.addTimelineEvent('mutation', 'Forced mutations applied due to stagnation');
      }

      this.evolvePopulation(survivors, activeAgents);

      await this.saveCheckpoint();

      this.addTimelineEvent('generation_end', `Generation ${gen} completed with ${survivors.length} survivors`);
    }

    this.addTimelineEvent('generation_end', 'Evolution completed');

    const report = this.reportGenerator.generateReport(
      task,
      this.agentManager,
      this.evaluator,
      this.timeline,
      this.generationResults
    );

    await this.pluginManager.executeHook('onEvolutionComplete', report);

    return report;
  }

  stop(): void {
    this.isRunning = false;
  }

  pause(): void {
    this.isRunning = false;
  }

  async saveCheckpoint(checkpointId?: string): Promise<string> {
    const id = checkpointId || `checkpoint-${uuidv4().slice(0, 8)}`;
    this.faultTolerance.saveCheckpoint(
      id,
      this.task?.id || 'unknown',
      this.currentGeneration,
      this.agentManager.getAllAgents(),
      this.agentManager.getKnowledgePool().entries,
      this.config,
      this.timeline
    );
    return id;
  }

  async resumeFromCheckpoint(
    checkpointId: string,
    adjustedConfig?: Partial<EvolutionConfig>
  ): Promise<EvolutionReport> {
    if (!this.task) {
      throw new Error('Cannot resume: no task has been set. Call run() first.');
    }

    const checkpoint = this.faultTolerance.loadCheckpoint(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    if (adjustedConfig) {
      Object.assign(this.config, adjustedConfig);
    }

    this.currentGeneration = checkpoint.generation;
    this.timeline = this.faultTolerance.getTimeline() || [];

    this.addTimelineEvent('rescue', `Resumed from checkpoint ${checkpointId}`);

    return this.run(this.task, this.onProgress);
  }

  getCurrentGeneration(): number {
    return this.currentGeneration;
  }

  getAgentManager(): AgentManager {
    return this.agentManager;
  }

  getEvaluator(): Evaluator {
    return this.evaluator;
  }

  getFaultTolerance(): FaultToleranceManager {
    return this.faultTolerance;
  }

  getPluginManager(): PluginManager {
    return this.pluginManager;
  }

  getExecutor(): AgentExecutor | null {
    return this.executor;
  }

  getExecutionStrategy(): ExecutionStrategy {
    return this.executionStrategy;
  }

  adjustParameters(params: Partial<EvolutionConfig>): void {
    Object.assign(this.config, params);
    this.addTimelineEvent('mutation', 'Parameters adjusted', params as Record<string, unknown>);
  }

  // ---- Internal Methods ----

  private async executeGeneration(
    agents: Agent[],
    task: Task
  ): Promise<EvaluationContext> {
    const subTasks = this.taskDistributor.distribute(task, agents);
    const context: EvaluationContext = {
      generation: this.currentGeneration,
      taskResults: new Map(),
      resourceUsage: new Map(),
      errorCounts: new Map(),
      collaborationContributions: new Map(),
    };

    for (const agent of agents) {
      const assigned = subTasks.filter((st) =>
        st.assignedAgentIds.includes(agent.id)
      );

      let result: unknown = null;
      let errors = 0;
      let resources = 0;

      for (const subTask of assigned) {
        try {
          result = await this.executionStrategy.executeSubTask(agent, subTask, task);
          resources += this.executionStrategy.generateResourceCost(agent, true);
        } catch {
          errors += 1;
        }
      }

      if (assigned.length === 0) {
        errors = this.executionStrategy.generateErrorCount(agent, false);
        resources = this.executionStrategy.generateResourceCost(agent, false);
      }

      context.taskResults.set(agent.id, result);
      context.errorCounts.set(agent.id, errors);
      context.resourceUsage.set(agent.id, resources);

      const contributions = Math.floor(
        agent.profile.collaboration * 10 * Math.random()
      );
      context.collaborationContributions.set(agent.id, contributions);

      this.executionStrategy.handleKnowledgeSharing(
        agent,
        this.agentManager,
        this.currentGeneration,
        this.config.knowledgeSharing
      );
    }

    return context;
  }

  private async executeSubTask(
    agent: Agent,
    subTask: { id: string; description: string },
    task: Task
  ): Promise<unknown> {
    return this.executionStrategy.executeSubTask(agent, subTask, task);
  }

  private evolvePopulation(survivorIds: string[], agents: Agent[]): void {
    const survivors = agents.filter((a) => survivorIds.includes(a.id));

    for (const survivor of survivors) {
      this.agentManager.applyMutation(survivor);
    }

    const agentsToReplace = this.config.agentCount - survivors.length;
    if (agentsToReplace <= 0) return;

    for (let i = 0; i < agentsToReplace; i++) {
      const parent1 = survivors[Math.floor(Math.random() * survivors.length)];
      const parent2 = survivors[Math.floor(Math.random() * survivors.length)];

      const offspring = this.agentManager.createOffspring(
        parent1,
        parent2,
        this.currentGeneration + 1
      );

      this.agentManager.applyMutation(offspring);

      if (this.config.knowledgeSharing) {
        this.agentManager.acquireKnowledge(offspring.id, 5);
      }
    }
  }

  private applyForcedMutations(agents: Agent[]): void {
    for (const agent of agents) {
      const mutationCount = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < mutationCount; i++) {
        this.agentManager.applyMutation(agent);
      }
    }
  }

  private addTimelineEvent(
    type: TimelineEvent['type'],
    description: string,
    data: Record<string, unknown> = {}
  ): void {
    this.timeline.push({
      generation: this.currentGeneration,
      timestamp: Date.now(),
      type,
      description,
      data,
    });
  }

  private notifyProgress(bestScore: number, avgScore: number): void {
    if (this.onProgress) {
      this.onProgress({
        generation: this.currentGeneration,
        activeAgents: this.agentManager.getActiveAgents().length,
        bestScore,
        avgScore,
        isComplete: false,
      });
    }
  }
}