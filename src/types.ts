/** Evolution runtime mode */
export type EvolutionMode = 'quick' | 'standard' | 'deep' | 'team';

/** Agent status */
export enum AgentStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ELIMINATED = 'ELIMINATED',
  RESURRECTED = 'RESURRECTED',
  MERGED = 'MERGED',
}

/** Agent capability profile */
export interface AgentProfile {
  speed: number;
  accuracy: number;
  creativity: number;
  collaboration: number;
  efficiency: number;
  robustness: number;
}

/** Evaluation metrics */
export interface EvaluationMetrics {
  quality: number;
  efficiency: number;
  creativity: number;
  collaboration: number;
  resourceUsage: number;
  errorRate: number;
}

/** Metric function signature (shared) */
export interface MetricFn {
  (agent: Agent, task: Task, context: EvaluationContext): number;
}

/** Evaluation context (shared) */
export interface EvaluationContext {
  generation: number;
  taskResults: Map<string, unknown>;
  resourceUsage: Map<string, number>;
  errorCounts: Map<string, number>;
  collaborationContributions: Map<string, number>;
}

/** Individual Agent */
export interface Agent {
  id: string;
  generation: number;
  profile: AgentProfile;
  status: AgentStatus;
  parentIds: string[];
  strategy: string;
  knowledge: KnowledgeEntry[];
  fitness: number;
  generationHistory: number[];
}

/** Knowledge entry */
export interface KnowledgeEntry {
  id: string;
  type: 'success' | 'failure' | 'insight' | 'collaboration';
  content: string;
  sourceAgentId: string;
  timestamp: number;
  relevance: number;
  tags: string[];
}

/** Task definition */
export interface Task {
  id: string;
  type: string;
  description: string;
  requirements: string[];
  constraints: Record<string, unknown>;
  evaluationCriteria: Record<string, number>;
  subTasks?: Task[];
  data?: Record<string, unknown>;
  timeout?: number;
  priority?: number;
}

/** Sub-task */
export interface SubTask {
  id: string;
  parentTaskId: string;
  description: string;
  assignedAgentIds: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: unknown;
  deadline?: number;
}

/** Evolution system configuration */
export interface EvolutionConfig {
  agentCount: number;
  selectionRate: number;
  mutationRate: number;
  inheritanceRate: number;
  maxGenerations: number;
  collaborationBonus: number;
  knowledgeSharing: boolean;
  teamMode: boolean;
  teamSize?: number;
  faultTolerance: boolean;
  visualization: boolean;
  evaluationMetrics: string[];
  mode: EvolutionMode;
  rescueThreshold?: number;
  convergenceThreshold?: number;
  stagnationLimit?: number;
  checkpointInterval?: number;
}

/** Evaluation result */
export interface EvaluationResult {
  agentId: string;
  generation: number;
  metrics: EvaluationMetrics;
  overallScore: number;
  rank: number;
  details: Record<string, unknown>;
  timestamp: number;
}

/** Evolution report */
export interface EvolutionReport {
  taskId: string;
  totalGenerations: number;
  totalAgents: number;
  eliminatedAgents: number;
  rescuedAgents: number;
  mergedAgents: number;
  finalSurvivors: Agent[];
  eliminationAnalysis: EliminationRecord[];
  evolutionTimeline: TimelineEvent[];
  performanceComparison: Record<string, number[]>;
  explainability: ExplainabilityReport;
  generatedAt: number;
}

/** Elimination record */
export interface EliminationRecord {
  agentId: string;
  generation: number;
  reason: string;
  metrics: EvaluationMetrics;
  eliminatedAt: number;
  recoverable: boolean;
}

/** Timeline event */
export interface TimelineEvent {
  generation: number;
  timestamp: number;
  type: 'generation_start' | 'generation_end' | 'elimination' | 'rescue' | 'merge' | 'mutation' | 'convergence';
  description: string;
  data: Record<string, unknown>;
}

/** Explainability report */
export interface ExplainabilityReport {
  featureImportance: Record<string, number>;
  eliminationReasons: Record<string, string[]>;
  survivorStrengths: Record<string, string[]>;
  counterfactuals: Counterfactual[];
  strategyEvolution: StrategyEvolution[];
}

/** Counterfactual analysis */
export interface Counterfactual {
  agentId: string;
  scenario: string;
  expectedOutcome: string;
  confidence: number;
}

/** Strategy evolution */
export interface StrategyEvolution {
  generation: number;
  strategy: string;
  success: boolean;
  parentStrategy?: string;
  mutationApplied: string[];
}

/** Checkpoint */
export interface Checkpoint {
  id: string;
  taskId: string;
  generation: number;
  agents: Agent[];
  knowledgePool: KnowledgeEntry[];
  config: EvolutionConfig;
  timestamp: number;
}

/** Team */
export interface Team {
  id: string;
  name: string;
  memberIds: string[];
  score: number;
  collaborationScore: number;
  generation: number;
  status: 'active' | 'eliminated' | 'completed';
}

/** Knowledge sharing pool */
export interface KnowledgePool {
  entries: KnowledgeEntry[];
  contributorScores: Record<string, number>;
  topInsights: KnowledgeEntry[];
}

/** Default configuration */
export const DEFAULT_CONFIG: EvolutionConfig = {
  agentCount: 10,
  selectionRate: 0.1,
  mutationRate: 0.05,
  inheritanceRate: 0.3,
  maxGenerations: 100,
  collaborationBonus: 0.2,
  knowledgeSharing: true,
  teamMode: false,
  faultTolerance: true,
  visualization: true,
  evaluationMetrics: ['quality', 'efficiency', 'creativity', 'collaboration'],
  mode: 'standard',
  rescueThreshold: 0.7,
  convergenceThreshold: 0.95,
  stagnationLimit: 10,
  checkpointInterval: 10,
};

/** Mode preset configurations */
export const MODE_CONFIGS: Record<EvolutionMode, Partial<EvolutionConfig>> = {
  quick: {
    agentCount: 5,
    maxGenerations: 20,
    selectionRate: 0.2,
  },
  standard: {
    agentCount: 10,
    maxGenerations: 50,
    selectionRate: 0.1,
  },
  deep: {
    agentCount: 20,
    maxGenerations: 100,
    selectionRate: 0.05,
    mutationRate: 0.1,
    teamMode: true,
    faultTolerance: true,
  },
  team: {
    agentCount: 15,
    teamMode: true,
    teamSize: 3,
    knowledgeSharing: true,
    collaborationBonus: 0.3,
    selectionRate: 0.08,
    maxGenerations: 80,
  },
};