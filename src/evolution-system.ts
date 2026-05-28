import {
  EvolutionConfig,
  Task,
  EvolutionReport,
  EvolutionMode,
  DEFAULT_CONFIG,
  MODE_CONFIGS,
} from './types';
import { EvolutionEngine, EvolutionProgress } from './evolution-engine';
import { ReportGenerator } from './report-generator';

export class EvolutionSystem {
  static async run(
    task: Partial<Task> & { type?: string },
    config?: Partial<EvolutionConfig> & { mode?: EvolutionMode },
    onProgress?: (progress: EvolutionProgress) => void
  ): Promise<EvolutionReport> {
    const mode = config?.mode || 'standard';
    const modeDefaults = MODE_CONFIGS[mode] || {};
    const mergedConfig: EvolutionConfig = {
      ...DEFAULT_CONFIG,
      ...modeDefaults,
      ...config,
      mode,
    };

    const fullTask: Task = {
      id: task.id || `task-${Date.now()}`,
      type: task.type || 'general',
      description: task.description || 'Evolution task',
      requirements: task.requirements || [],
      constraints: task.constraints || {},
      evaluationCriteria: task.evaluationCriteria || {},
      subTasks: task.subTasks,
      data: task.data,
      timeout: task.timeout,
      priority: task.priority,
    };

    const engine = new EvolutionEngine(mergedConfig);
    const report = await engine.run(fullTask, onProgress);

    return report;
  }

  static async runWithConfig(
    task: Partial<Task> & { type?: string },
    config: EvolutionConfig,
    onProgress?: (progress: EvolutionProgress) => void
  ): Promise<EvolutionReport> {
    return EvolutionSystem.run(task, config, onProgress);
  }

  static quick(
    task: Partial<Task> & { type?: string },
    onProgress?: (progress: EvolutionProgress) => void
  ): Promise<EvolutionReport> {
    return EvolutionSystem.run(task, { mode: 'quick' }, onProgress);
  }

  static standard(
    task: Partial<Task> & { type?: string },
    onProgress?: (progress: EvolutionProgress) => void
  ): Promise<EvolutionReport> {
    return EvolutionSystem.run(task, { mode: 'standard' }, onProgress);
  }

  static deep(
    task: Partial<Task> & { type?: string },
    onProgress?: (progress: EvolutionProgress) => void
  ): Promise<EvolutionReport> {
    return EvolutionSystem.run(task, { mode: 'deep' }, onProgress);
  }

  static team(
    task: Partial<Task> & { type?: string },
    onProgress?: (progress: EvolutionProgress) => void
  ): Promise<EvolutionReport> {
    return EvolutionSystem.run(task, { mode: 'team' }, onProgress);
  }

  static generateReport(report: EvolutionReport): string {
    const generator = new ReportGenerator();
    return generator.displayReport(report);
  }

  static exportHtml(report: EvolutionReport): string {
    const generator = new ReportGenerator();
    return generator.exportHtml(report);
  }

  static experiment(): ExperimentBuilder {
    return new ExperimentBuilder();
  }
}

export class ExperimentBuilder {
  private groups: Array<{ name: string; config: Partial<EvolutionConfig> }> = [];

  addGroup(name: string, config: Partial<EvolutionConfig>): this {
    this.groups.push({ name, config });
    return this;
  }

  async run(
    task: Partial<Task> & { type?: string }
  ): Promise<Map<string, EvolutionReport>> {
    const results = new Map<string, EvolutionReport>();

    for (const group of this.groups) {
      const report = await EvolutionSystem.run(task, group.config);
      results.set(group.name, report);
    }

    return results;
  }

  compareResults(
    results: Map<string, EvolutionReport>
  ): Array<{ name: string; bestScore: number; eliminations: number; generations: number }> {
    const comparison: Array<{
      name: string;
      bestScore: number;
      eliminations: number;
      generations: number;
    }> = [];

    for (const [name, report] of results) {
      const bestScore =
        report.finalSurvivors.length > 0
          ? Math.max(...report.finalSurvivors.map((a) => a.fitness))
          : 0;

      comparison.push({
        name,
        bestScore,
        eliminations: report.eliminatedAgents,
        generations: report.totalGenerations,
      });
    }

    comparison.sort((a, b) => b.bestScore - a.bestScore);
    return comparison;
  }
}