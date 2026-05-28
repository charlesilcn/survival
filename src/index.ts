// Core exports
export { EvolutionSystem, ExperimentBuilder } from './evolution-system';
export { EvolutionEngine, EvolutionProgress } from './evolution-engine';
export { AgentManager } from './agent-manager';
export { Evaluator } from './evaluator';
export { TaskDistributor } from './task-distributor';
export { ReportGenerator } from './report-generator';
export { FaultToleranceManager } from './fault-tolerance';

// Config exports
export { ConfigValidator, EvolutionConfigSchema } from './config/validator';

// Utils exports
export {
  logger,
  createEvolutionLogger,
  createAgentLogger,
  logEvolutionEvent,
  logAgentEvent,
  logPerformance,
} from './utils/logger';

// Plugin exports
export {
  EvolutionPlugin,
  MutationStrategy,
  PluginMetadata,
  BasePlugin,
} from './plugins/interface';
export { PluginManager } from './plugins/manager';

// Executor exports
export {
  AgentExecutor,
  ExecutionResult,
  ExecutorConfig,
  BaseExecutor,
} from './executors/interface';
export { OpenAIExecutor, OpenAIConfig } from './executors/openai-executor';
export {
  ExecutionStrategy,
  SimulatedExecution,
  LiveExecution,
} from './executors/execution-strategy';

// Tools exports
export {
  ReportExporter,
  DataTransformer,
  ExportOptions,
} from './tools/exporters';
export {
  PerformanceProfiler,
  MemoryProfiler,
  PerformanceMetrics,
} from './tools/profiler';
export {
  ChartGenerator,
  ChartOptions,
} from './tools/visualizer';

// Type exports
export {
  EvolutionMode,
  AgentStatus,
  AgentProfile,
  EvaluationMetrics,
  EvaluationContext,
  MetricFn,
  Agent,
  KnowledgeEntry,
  Task,
  SubTask,
  EvolutionConfig,
  EvaluationResult,
  EvolutionReport,
  EliminationRecord,
  TimelineEvent,
  ExplainabilityReport,
  Counterfactual,
  StrategyEvolution,
  Checkpoint,
  Team,
  KnowledgePool,
  DEFAULT_CONFIG,
  MODE_CONFIGS,
} from './types';

// Version
export const VERSION = '1.0.0';
