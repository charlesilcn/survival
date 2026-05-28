import {
  Agent,
  AgentStatus,
  Task,
  EvolutionReport,
  EliminationRecord,
  TimelineEvent,
  ExplainabilityReport,
  Counterfactual,
  StrategyEvolution,
  EvaluationResult,
} from './types';
import { AgentManager } from './agent-manager';
import { Evaluator } from './evaluator';

export class ReportGenerator {
  generateReport(
    task: Task,
    agentManager: AgentManager,
    evaluator: Evaluator,
    timeline: TimelineEvent[],
    generationResults: EvaluationResult[][]
  ): EvolutionReport {
    const allAgents = agentManager.getAllAgents();
    const eliminatedAgents = allAgents.filter(
      (a) => a.status === AgentStatus.ELIMINATED
    );
    const rescuedAgents = allAgents.filter(
      (a) => a.status === AgentStatus.RESURRECTED
    );
    const mergedAgents = allAgents.filter(
      (a) => a.status === AgentStatus.MERGED
    );
    const survivors = allAgents.filter(
      (a) => a.status !== AgentStatus.ELIMINATED && a.status !== AgentStatus.MERGED
    );

    const eliminationRecords = evaluator.getEliminationRecords();
    const explainability = this.generateExplainability(
      eliminationRecords,
      survivors,
      generationResults
    );

    const performanceComparison = this.buildPerformanceComparison(generationResults);

    return {
      taskId: task.id,
      totalGenerations: agentManager.getGeneration(),
      totalAgents: allAgents.length,
      eliminatedAgents: eliminatedAgents.length,
      rescuedAgents: rescuedAgents.length,
      mergedAgents: mergedAgents.length,
      finalSurvivors: survivors,
      eliminationAnalysis: eliminationRecords,
      evolutionTimeline: timeline,
      performanceComparison,
      explainability,
      generatedAt: Date.now(),
    };
  }

  displayReport(report: EvolutionReport): string {
    const lines: string[] = [];

    lines.push('='.repeat(60));
    lines.push('         Multi-Agent Competitive Evolution - Settlement Report');
    lines.push('='.repeat(60));
    lines.push('');
    lines.push(`Task ID: ${report.taskId}`);
    lines.push(`Total Generations: ${report.totalGenerations}`);
    lines.push(`Total Agents: ${report.totalAgents}`);
    lines.push(`Eliminated Agents: ${report.eliminatedAgents}`);
    lines.push(`Rescued Agents: ${report.rescuedAgents}`);
    lines.push(`Merged Agents: ${report.mergedAgents}`);
    lines.push(`Final Survivors: ${report.finalSurvivors.length}`);
    lines.push('');

    if (report.finalSurvivors.length > 0) {
      lines.push('-'.repeat(60));
      lines.push('  🏆 Final Survivors');
      lines.push('-'.repeat(60));
      for (const agent of report.finalSurvivors) {
        lines.push(`  ${agent.id} | Strategy: ${agent.strategy} | Fitness: ${agent.fitness.toFixed(3)}`);
        lines.push(
          `    Speed:${agent.profile.speed.toFixed(2)} Accuracy:${agent.profile.accuracy.toFixed(2)} Creativity:${agent.profile.creativity.toFixed(2)} Collaboration:${agent.profile.collaboration.toFixed(2)}`
        );
      }
      lines.push('');
    }

    if (report.eliminationAnalysis.length > 0) {
      lines.push('-'.repeat(60));
      lines.push('  📊 Elimination Analysis');
      lines.push('-'.repeat(60));
      for (const record of report.eliminationAnalysis.slice(-10)) {
        lines.push(
          `  Gen ${record.generation} | ${record.agentId}: ${record.reason}`
        );
      }
      if (report.eliminationAnalysis.length > 10) {
        lines.push(`  ... ${report.eliminationAnalysis.length - 10} more records`);
      }
      lines.push('');
    }

    lines.push('-'.repeat(60));
    lines.push('  📈 Evolution Timeline Summary');
    lines.push('-'.repeat(60));
    const lastEvents = report.evolutionTimeline.slice(-15);
    for (const event of lastEvents) {
      const icon = this.getEventIcon(event.type);
      lines.push(`  ${icon} Gen ${event.generation}: ${event.description}`);
    }
    lines.push('');

    if (Object.keys(report.explainability.featureImportance).length > 0) {
      lines.push('-'.repeat(60));
      lines.push('  🔍 Feature Importance Analysis');
      lines.push('-'.repeat(60));
      const sorted = Object.entries(report.explainability.featureImportance)
        .sort(([, a], [, b]) => b - a);
      for (const [key, val] of sorted) {
        const bar = '█'.repeat(Math.round(val * 20));
        lines.push(`  ${key}: ${bar} (${val.toFixed(3)})`);
      }
      lines.push('');
    }

    lines.push('='.repeat(60));
    lines.push(`Report Generated: ${new Date(report.generatedAt).toLocaleString()}`);
    lines.push('='.repeat(60));

    return lines.join('\n');
  }

  exportHtml(report: EvolutionReport): string {
    const performanceData = JSON.stringify(report.performanceComparison);
    const timelineData = JSON.stringify(report.evolutionTimeline);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Evolution Report - ${report.taskId}</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #f8f9fa; }
  h1 { color: #1a1a2e; border-bottom: 3px solid #16213e; padding-bottom: 10px; }
  .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
  .card { background: white; border-radius: 10px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .card .value { font-size: 28px; font-weight: bold; color: #0f3460; }
  .card .label { color: #666; font-size: 13px; margin-top: 5px; }
  .section { background: white; border-radius: 10px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .section h2 { color: #16213e; margin-top: 0; }
  .agent-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; margin: 8px 0; }
  .agent-card .name { font-weight: bold; color: #0f3460; }
  .badge { background: #e94560; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
  .badge-success { background: #27ae60; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee; }
  th { background: #16213e; color: white; }
  .timeline { border-left: 3px solid #0f3460; padding-left: 20px; }
  .timeline-item { margin: 10px 0; padding: 8px; background: #f0f4ff; border-radius: 5px; }
  .bar-container { display: flex; align-items: center; margin: 5px 0; }
  .bar-label { width: 120px; font-size: 13px; }
  .bar-track { flex: 1; height: 20px; background: #eee; border-radius: 10px; overflow: hidden; }
  .bar-fill { height: 100%; background: linear-gradient(90deg, #0f3460, #e94560); border-radius: 10px; transition: width 0.3s; }
</style>
</head>
<body>
<h1>🏆 Multi-Agent Competitive Evolution Report</h1>

<div class="summary">
  <div class="card"><div class="value">${report.totalGenerations}</div><div class="label">Total Generations</div></div>
  <div class="card"><div class="value">${report.totalAgents}</div><div class="label">Total Agents</div></div>
  <div class="card"><div class="value">${report.eliminatedAgents}</div><div class="label">Eliminated</div></div>
  <div class="card"><div class="value">${report.finalSurvivors.length}</div><div class="label">Final Survivors</div></div>
  <div class="card"><div class="value">${report.rescuedAgents}</div><div class="label">Rescued</div></div>
</div>

<div class="section">
  <h2>🏆 Final Survivors</h2>
  ${report.finalSurvivors.map((a) => `
    <div class="agent-card">
      <span class="name">${a.id}</span> <span class="badge badge-success">Survivor</span>
      <div style="margin-top: 8px;">
        <div>Strategy: ${a.strategy} | Fitness: ${(a.fitness * 100).toFixed(1)}%</div>
        <div>Speed:${(a.profile.speed * 100).toFixed(0)}% Accuracy:${(a.profile.accuracy * 100).toFixed(0)}% Creativity:${(a.profile.creativity * 100).toFixed(0)}% Collaboration:${(a.profile.collaboration * 100).toFixed(0)}%</div>
      </div>
    </div>
  `).join('')}
</div>

<div class="section">
  <h2>📊 Elimination Analysis</h2>
  <table>
    <tr><th>Generation</th><th>Agent</th><th>Reason</th><th>Recoverable</th></tr>
    ${report.eliminationAnalysis.slice(-20).reverse().map((r) => `
      <tr>
        <td>${r.generation}</td>
        <td>${r.agentId}</td>
        <td>${r.reason}</td>
        <td>${r.recoverable ? '✅' : '❌'}</td>
      </tr>
    `).join('')}
  </table>
</div>

<div class="section">
  <h2>📈 Evolution Timeline</h2>
  <div class="timeline">
    ${report.evolutionTimeline.slice(-30).map((e) => `
      <div class="timeline-item">
        <strong>Gen ${e.generation}</strong> [${e.type}]: ${e.description}
      </div>
    `).join('')}
  </div>
</div>

<div class="section">
  <h2>🔍 Feature Importance</h2>
  ${Object.entries(report.explainability.featureImportance)
    .sort(([, a], [, b]) => b - a)
    .map(([key, val]) => `
      <div class="bar-container">
        <div class="bar-label">${key}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${(val * 100).toFixed(0)}%"></div>
        </div>
        <span style="margin-left:10px;font-size:13px;">${(val * 100).toFixed(1)}%</span>
      </div>
    `).join('')}
</div>

<p style="text-align:center;color:#999;margin-top:30px;">
  Report Generated: ${new Date(report.generatedAt).toLocaleString()}
</p>
</body>
</html>`;
  }

  private generateExplainability(
    eliminationRecords: EliminationRecord[],
    survivors: Agent[],
    generationResults: EvaluationResult[][]
  ): ExplainabilityReport {
    const allResults = generationResults.flat();

    const featureImportance: Record<string, number> = {};
    const allMetrics = allResults.map((r) => r.metrics);
    if (allMetrics.length > 0) {
      const keys = Object.keys(allMetrics[0]) as (keyof typeof allMetrics[0])[];
      for (const key of keys) {
        const values = allMetrics.map((m) => m[key]);
        const mean = values.reduce((s, v) => s + v, 0) / values.length;
        const variance =
          values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
        featureImportance[key] = variance;
      }
    }

    const eliminationReasons: Record<string, string[]> = {};
    for (const record of eliminationRecords) {
      if (!eliminationReasons[record.agentId]) {
        eliminationReasons[record.agentId] = [];
      }
      eliminationReasons[record.agentId].push(record.reason);
    }

    const survivorStrengths: Record<string, string[]> = {};
    for (const agent of survivors) {
      const strengths: string[] = [];
      if (agent.profile.accuracy > 0.7) strengths.push('high accuracy');
      if (agent.profile.speed > 0.7) strengths.push('high speed');
      if (agent.profile.creativity > 0.7) strengths.push('high creativity');
      if (agent.profile.collaboration > 0.7) strengths.push('high collaboration');
      if (agent.profile.efficiency > 0.7) strengths.push('high efficiency');
      if (strengths.length === 0) strengths.push('balanced profile');
      survivorStrengths[agent.id] = strengths;
    }

    const counterfactuals: Counterfactual[] = eliminationRecords
      .filter((r) => r.recoverable)
      .slice(0, 5)
      .map((r) => ({
        agentId: r.agentId,
        scenario: `If Agent ${r.agentId} was not eliminated, it could have contributed to the next generation`,
        expectedOutcome: `Potential 10-20% improvement in population diversity`,
        confidence: 0.6,
      }));

    const strategyEvolution: StrategyEvolution[] = generationResults
      .map((gen, idx) => {
        const top = gen[0];
        if (!top) return null;
        return {
          generation: idx,
          strategy: top.details?.strategy as string || 'unknown',
          success: top.overallScore > 0.5,
          mutationApplied: [],
        };
      })
      .filter((s): s is StrategyEvolution => s !== null);

    return {
      featureImportance,
      eliminationReasons,
      survivorStrengths,
      counterfactuals,
      strategyEvolution,
    };
  }

  private buildPerformanceComparison(
    generationResults: EvaluationResult[][]
  ): Record<string, number[]> {
    const comparison: Record<string, number[]> = {
      bestScore: [],
      avgScore: [],
      worstScore: [],
      diversity: [],
    };

    for (const gen of generationResults) {
      const scores = gen.map((r) => r.overallScore);
      comparison.bestScore.push(Math.max(...scores));
      comparison.avgScore.push(
        scores.reduce((s, v) => s + v, 0) / scores.length
      );
      comparison.worstScore.push(Math.min(...scores));
      comparison.diversity.push(
        new Set(scores.map((s) => s.toFixed(3))).size / scores.length
      );
    }

    return comparison;
  }

  private getEventIcon(type: string): string {
    switch (type) {
      case 'generation_start':
        return '▶️';
      case 'generation_end':
        return '⏹️';
      case 'elimination':
        return '❌';
      case 'rescue':
        return '🔄';
      case 'merge':
        return '🔀';
      case 'mutation':
        return '🧬';
      case 'convergence':
        return '🎯';
      default:
        return '📌';
    }
  }
}