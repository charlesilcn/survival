import { EvolutionReport, Agent, EvaluationResult } from '../types';
import { logger } from '../utils/logger';

export interface ExportOptions {
  includeMetadata?: boolean;
  pretty?: boolean;
  compression?: boolean;
}

export class ReportExporter {
  /**
   * Export report to JSON format
   */
  static toJSON(report: EvolutionReport, options: ExportOptions = {}): string {
    const data = options.includeMetadata 
      ? { ...report, _exportedAt: new Date().toISOString(), _version: '1.0.0' }
      : report;
    
    return JSON.stringify(data, null, options.pretty ? 2 : undefined);
  }

  /**
   * Export report to CSV format
   */
  static toCSV(report: EvolutionReport): string {
    const lines: string[] = [];
    
    // Header
    lines.push('Agent ID,Generation,Status,Strategy,Fitness,Speed,Accuracy,Creativity,Collaboration,Efficiency,Robustness');
    
    // Data
    for (const agent of report.finalSurvivors) {
      lines.push([
        agent.id,
        agent.generation,
        agent.status,
        agent.strategy,
        agent.fitness.toFixed(4),
        agent.profile.speed.toFixed(4),
        agent.profile.accuracy.toFixed(4),
        agent.profile.creativity.toFixed(4),
        agent.profile.collaboration.toFixed(4),
        agent.profile.efficiency.toFixed(4),
        agent.profile.robustness.toFixed(4),
      ].join(','));
    }
    
    return lines.join('\n');
  }

  /**
   * Export timeline to CSV
   */
  static timelineToCSV(report: EvolutionReport): string {
    const lines: string[] = [];
    lines.push('Generation,Timestamp,Type,Description');
    
    for (const event of report.evolutionTimeline) {
      lines.push([
        event.generation,
        new Date(event.timestamp).toISOString(),
        event.type,
        `"${event.description.replace(/"/g, '""')}"`,
      ].join(','));
    }
    
    return lines.join('\n');
  }

  /**
   * Export elimination analysis to CSV
   */
  static eliminationsToCSV(report: EvolutionReport): string {
    const lines: string[] = [];
    lines.push('Agent ID,Generation,Reason,Quality,Efficiency,Creativity,Collaboration,Resource Usage,Error Rate,Recoverable');
    
    for (const record of report.eliminationAnalysis) {
      lines.push([
        record.agentId,
        record.generation,
        `"${record.reason.replace(/"/g, '""')}"`,
        record.metrics.quality.toFixed(4),
        record.metrics.efficiency.toFixed(4),
        record.metrics.creativity.toFixed(4),
        record.metrics.collaboration.toFixed(4),
        record.metrics.resourceUsage.toFixed(4),
        record.metrics.errorRate.toFixed(4),
        record.recoverable ? 'Yes' : 'No',
      ].join(','));
    }
    
    return lines.join('\n');
  }

  /**
   * Export performance comparison data
   */
  static performanceToCSV(report: EvolutionReport): string {
    const lines: string[] = [];
    lines.push('Generation,Best Score,Average Score,Worst Score,Diversity');
    
    const { bestScore, avgScore, worstScore, diversity } = report.performanceComparison;
    
    for (let i = 0; i < bestScore.length; i++) {
      lines.push([
        i,
        bestScore[i]?.toFixed(4) || '',
        avgScore[i]?.toFixed(4) || '',
        worstScore[i]?.toFixed(4) || '',
        diversity[i]?.toFixed(4) || '',
      ].join(','));
    }
    
    return lines.join('\n');
  }

  /**
   * Generate Markdown report
   */
  static toMarkdown(report: EvolutionReport): string {
    const lines: string[] = [];
    
    lines.push('# Evolution Report\n');
    lines.push(`**Task ID**: ${report.taskId}\n`);
    lines.push(`**Generated**: ${new Date(report.generatedAt).toLocaleString()}\n`);
    lines.push('---\n\n');
    
    // Summary
    lines.push('## Summary\n\n');
    lines.push(`- **Total Generations**: ${report.totalGenerations}\n`);
    lines.push(`- **Total Agents**: ${report.totalAgents}\n`);
    lines.push(`- **Eliminated**: ${report.eliminatedAgents}\n`);
    lines.push(`- **Rescued**: ${report.rescuedAgents}\n`);
    lines.push(`- **Final Survivors**: ${report.finalSurvivors.length}\n\n`);
    
    // Survivors
    lines.push('## Final Survivors\n\n');
    lines.push('| Agent ID | Generation | Strategy | Fitness | Speed | Accuracy | Creativity | Collaboration |\n');
    lines.push('|----------|------------|----------|---------|-------|----------|------------|---------------|\n');
    
    for (const agent of report.finalSurvivors) {
      lines.push(`| ${agent.id} | ${agent.generation} | ${agent.strategy} | ${agent.fitness.toFixed(3)} | ${agent.profile.speed.toFixed(2)} | ${agent.profile.accuracy.toFixed(2)} | ${agent.profile.creativity.toFixed(2)} | ${agent.profile.collaboration.toFixed(2)} |\n`);
    }
    
    lines.push('\n');
    
    // Feature Importance
    lines.push('## Feature Importance\n\n');
    const sortedFeatures = Object.entries(report.explainability.featureImportance)
      .sort(([, a], [, b]) => b - a);
    
    for (const [feature, importance] of sortedFeatures) {
      const bar = '█'.repeat(Math.round(importance * 20));
      lines.push(`- **${feature}**: ${bar} (${(importance * 100).toFixed(1)}%)\n`);
    }
    
    return lines.join('');
  }

  /**
   * Export all formats at once
   */
  static exportAll(report: EvolutionReport, basePath: string): Record<string, string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    return {
      [`${basePath}/report-${timestamp}.json`]: this.toJSON(report, { pretty: true, includeMetadata: true }),
      [`${basePath}/report-${timestamp}.csv`]: this.toCSV(report),
      [`${basePath}/timeline-${timestamp}.csv`]: this.timelineToCSV(report),
      [`${basePath}/eliminations-${timestamp}.csv`]: this.eliminationsToCSV(report),
      [`${basePath}/performance-${timestamp}.csv`]: this.performanceToCSV(report),
      [`${basePath}/report-${timestamp}.md`]: this.toMarkdown(report),
    };
  }
}

export class DataTransformer {
  /**
   * Flatten agent data for analysis
   */
  static flattenAgent(agent: Agent): Record<string, unknown> {
    return {
      id: agent.id,
      generation: agent.generation,
      status: agent.status,
      strategy: agent.strategy,
      fitness: agent.fitness,
      speed: agent.profile.speed,
      accuracy: agent.profile.accuracy,
      creativity: agent.profile.creativity,
      collaboration: agent.profile.collaboration,
      efficiency: agent.profile.efficiency,
      robustness: agent.profile.robustness,
      parentCount: agent.parentIds.length,
      knowledgeCount: agent.knowledge.length,
    };
  }

  /**
   * Aggregate statistics from multiple reports
   */
  static aggregateReports(reports: EvolutionReport[]): {
    avgGenerations: number;
    avgSurvivors: number;
    avgEliminations: number;
    bestOverallFitness: number;
    strategyDistribution: Record<string, number>;
  } {
    const totalGenerations = reports.reduce((sum, r) => sum + r.totalGenerations, 0);
    const totalSurvivors = reports.reduce((sum, r) => sum + r.finalSurvivors.length, 0);
    const totalEliminations = reports.reduce((sum, r) => sum + r.eliminatedAgents, 0);
    
    const allFitness = reports.flatMap(r => r.finalSurvivors.map(a => a.fitness));
    const bestOverallFitness = allFitness.length > 0 ? Math.max(...allFitness) : 0;
    
    const strategyDistribution: Record<string, number> = {};
    for (const report of reports) {
      for (const agent of report.finalSurvivors) {
        strategyDistribution[agent.strategy] = (strategyDistribution[agent.strategy] || 0) + 1;
      }
    }
    
    return {
      avgGenerations: totalGenerations / reports.length,
      avgSurvivors: totalSurvivors / reports.length,
      avgEliminations: totalEliminations / reports.length,
      bestOverallFitness,
      strategyDistribution,
    };
  }

  /**
   * Convert to D3.js compatible format for visualization
   */
  static toD3Format(report: EvolutionReport): {
    nodes: Array<{ id: string; group: number; fitness: number }>;
    links: Array<{ source: string; target: string; value: number }>;
    timeline: Array<{ generation: number; event: string; type: string }>;
  } {
    const nodes = report.finalSurvivors.map((agent, idx) => ({
      id: agent.id,
      group: idx,
      fitness: agent.fitness,
    }));
    
    const links: Array<{ source: string; target: string; value: number }> = [];
    for (const agent of report.finalSurvivors) {
      for (const parentId of agent.parentIds) {
        links.push({
          source: parentId,
          target: agent.id,
          value: 1,
        });
      }
    }
    
    const timeline = report.evolutionTimeline.map(e => ({
      generation: e.generation,
      event: e.description,
      type: e.type,
    }));
    
    return { nodes, links, timeline };
  }
}
