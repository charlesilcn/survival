import { EvolutionReport, Agent, EvaluationResult } from '../types';

export interface ChartOptions {
  width?: number;
  height?: number;
  title?: string;
  theme?: 'light' | 'dark';
}

export class ChartGenerator {
  /**
   * Generate SVG line chart for performance over generations
   */
  static generatePerformanceChart(
    report: EvolutionReport,
    options: ChartOptions = {}
  ): string {
    const { width = 800, height = 400, title = 'Performance Over Generations' } = options;
    const { bestScore, avgScore, worstScore } = report.performanceComparison;

    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxScore = Math.max(...bestScore, 1);
    const minScore = Math.min(...worstScore, 0);
    const scoreRange = maxScore - minScore;

    const points = {
      best: bestScore.map((score, i) => ({
        x: padding + (i / (bestScore.length - 1)) * chartWidth,
        y: height - padding - ((score - minScore) / scoreRange) * chartHeight,
      })),
      avg: avgScore.map((score, i) => ({
        x: padding + (i / (avgScore.length - 1)) * chartWidth,
        y: height - padding - ((score - minScore) / scoreRange) * chartHeight,
      })),
      worst: worstScore.map((score, i) => ({
        x: padding + (i / (worstScore.length - 1)) * chartWidth,
        y: height - padding - ((score - minScore) / scoreRange) * chartHeight,
      })),
    };

    const pathData = {
      best: `M ${points.best.map(p => `${p.x},${p.y}`).join(' L ')}`,
      avg: `M ${points.avg.map(p => `${p.x},${p.y}`).join(' L ')}`,
      worst: `M ${points.worst.map(p => `${p.x},${p.y}`).join(' L ')}`,
    };

    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bestGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:#4CAF50;stop-opacity:0" />
    </linearGradient>
  </defs>
  
  <rect width="100%" height="100%" fill="#f5f5f5"/>
  
  <text x="${width / 2}" y="30" text-anchor="middle" font-size="18" font-weight="bold">${title}</text>
  
  <!-- Grid lines -->
  ${Array.from({ length: 5 }, (_, i) => {
    const y = padding + (i / 4) * chartHeight;
    const value = maxScore - (i / 4) * scoreRange;
    return `
      <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#ddd" stroke-width="1"/>
      <text x="${padding - 10}" y="${y + 4}" text-anchor="end" font-size="12">${value.toFixed(2)}</text>
    `;
  }).join('')}
  
  <!-- X axis labels -->
  ${Array.from({ length: 6 }, (_, i) => {
    const x = padding + (i / 5) * chartWidth;
    const gen = Math.round((i / 5) * (bestScore.length - 1));
    return `<text x="${x}" y="${height - padding + 20}" text-anchor="middle" font-size="12">Gen ${gen}</text>`;
  }).join('')}
  
  <!-- Lines -->
  <path d="${pathData.worst}" fill="none" stroke="#f44336" stroke-width="2"/>
  <path d="${pathData.avg}" fill="none" stroke="#2196F3" stroke-width="2"/>
  <path d="${pathData.best}" fill="none" stroke="#4CAF50" stroke-width="2"/>
  
  <!-- Legend -->
  <g transform="translate(${width - 150}, ${padding})">
    <rect x="0" y="0" width="140" height="80" fill="white" stroke="#ddd" rx="5"/>
    <line x1="10" y1="20" x2="40" y2="20" stroke="#4CAF50" stroke-width="2"/>
    <text x="50" y="24" font-size="12">Best</text>
    <line x1="10" y1="45" x2="40" y2="45" stroke="#2196F3" stroke-width="2"/>
    <text x="50" y="49" font-size="12">Average</text>
    <line x1="10" y1="70" x2="40" y2="70" stroke="#f44336" stroke-width="2"/>
    <text x="50" y="74" font-size="12">Worst</text>
  </g>
</svg>
    `.trim();
  }

  /**
   * Generate SVG bar chart for feature importance
   */
  static generateFeatureImportanceChart(
    report: EvolutionReport,
    options: ChartOptions = {}
  ): string {
    const { width = 600, height = 400, title = 'Feature Importance' } = options;
    const features = Object.entries(report.explainability.featureImportance)
      .sort(([, a], [, b]) => b - a);

    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const barHeight = chartHeight / features.length * 0.7;
    const barSpacing = chartHeight / features.length * 0.3;

    const bars = features.map(([name, importance], i) => {
      const barWidth = importance * chartWidth;
      const y = padding + i * (barHeight + barSpacing);
      const color = `hsl(${200 + i * 20}, 70%, 50%)`;

      return `
        <rect x="${padding}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="3"/>
        <text x="${padding - 10}" y="${y + barHeight / 2 + 4}" text-anchor="end" font-size="12">${name}</text>
        <text x="${padding + barWidth + 5}" y="${y + barHeight / 2 + 4}" font-size="12">${(importance * 100).toFixed(1)}%</text>
      `;
    }).join('');

    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f5f5f5"/>
  <text x="${width / 2}" y="30" text-anchor="middle" font-size="18" font-weight="bold">${title}</text>
  ${bars}
</svg>
    `.trim();
  }

  /**
   * Generate SVG pie chart for strategy distribution
   */
  static generateStrategyDistributionChart(
    report: EvolutionReport,
    options: ChartOptions = {}
  ): string {
    const { width = 400, height = 400, title = 'Strategy Distribution' } = options;

    const strategyCount: Record<string, number> = {};
    for (const agent of report.finalSurvivors) {
      strategyCount[agent.strategy] = (strategyCount[agent.strategy] || 0) + 1;
    }

    const total = Object.values(strategyCount).reduce((a, b) => a + b, 0);
    const strategies = Object.entries(strategyCount);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;

    let currentAngle = 0;
    const slices = strategies.map(([strategy, count], i) => {
      const percentage = count / total;
      const angle = percentage * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);

      const largeArc = angle > Math.PI ? 1 : 0;
      const color = `hsl(${i * 360 / strategies.length}, 70%, 50%)`;

      const path = `M ${centerX},${centerY} L ${x1},${y1} A ${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`;

      currentAngle += angle;

      return { strategy, count, percentage, color, path };
    });

    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f5f5f5"/>
  <text x="${width / 2}" y="30" text-anchor="middle" font-size="18" font-weight="bold">${title}</text>
  
  <g transform="translate(0, 20)">
    ${slices.map(s => `<path d="${s.path}" fill="${s.color}" stroke="white" stroke-width="2"/>`).join('')}
  </g>
  
  <!-- Legend -->
  <g transform="translate(${width - 150}, ${height / 2 - strategies.length * 15})">
    ${slices.map((s, i) => `
      <rect x="0" y="${i * 30}" width="15" height="15" fill="${s.color}"/>
      <text x="25" y="${i * 30 + 12}" font-size="12">${s.strategy} (${(s.percentage * 100).toFixed(1)}%)</text>
    `).join('')}
  </g>
</svg>
    `.trim();
  }

  /**
   * Generate complete dashboard HTML
   */
  static generateDashboard(report: EvolutionReport): string {
    const performanceChart = this.generatePerformanceChart(report);
    const featureChart = this.generateFeatureImportanceChart(report);
    const strategyChart = this.generateStrategyDistributionChart(report);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Evolution Report Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0f2f5; padding: 20px; }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { color: #333; margin-bottom: 20px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stat-label { color: #666; font-size: 14px; margin-bottom: 5px; }
    .stat-value { color: #333; font-size: 28px; font-weight: bold; }
    .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
    .chart-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .chart-card h3 { color: #333; margin-bottom: 15px; }
    .chart-card svg { width: 100%; height: auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧬 Evolution Report Dashboard</h1>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Generations</div>
        <div class="stat-value">${report.totalGenerations}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Final Survivors</div>
        <div class="stat-value">${report.finalSurvivors.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Eliminated Agents</div>
        <div class="stat-value">${report.eliminatedAgents}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Rescued Agents</div>
        <div class="stat-value">${report.rescuedAgents}</div>
      </div>
    </div>
    
    <div class="charts-grid">
      <div class="chart-card">
        <h3>Performance Over Time</h3>
        ${performanceChart}
      </div>
      <div class="chart-card">
        <h3>Feature Importance</h3>
        ${featureChart}
      </div>
      <div class="chart-card">
        <h3>Strategy Distribution</h3>
        ${strategyChart}
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}
