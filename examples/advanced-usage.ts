import {
  EvolutionSystem,
  EvolutionEngine,
  PluginManager,
  ReportExporter,
  PerformanceProfiler,
  ChartGenerator,
  SimulatedExecution,
  ConfigValidator,
} from '@evolution-system/core';

async function advancedExample() {
  console.log('=== Advanced Usage Examples ===\n');

  // --- Custom Config with Validation ---
  console.log('1. Config validation:');
  const { config, warnings } = ConfigValidator.validateWithWarnings({
    agentCount: 15,
    mode: 'deep',
    selectionRate: 0.05,
    knowledgeSharing: true,
    faultTolerance: true,
  });
  console.log(`   Validated config. Warnings: ${warnings.length}`);
  if (warnings.length > 0) {
    warnings.forEach(w => console.log(`   - ${w}`));
  }

  // --- Plugin System ---
  console.log('\n2. Plugin system:');
  const pluginManager = new PluginManager();

  const myPlugin = {
    name: 'performance-tracker',
    version: '1.0.0',
    onGenerationStart(generation: number) {
      console.log(`   [Plugin] Starting generation ${generation}`);
    },
    onEvolutionComplete(report: { totalGenerations: number; finalSurvivors: { length: number } }) {
      console.log(`   [Plugin] Evolution complete! ${report.totalGenerations} gens, ${report.finalSurvivors.length} survivors`);
    },
  };

  pluginManager.register(myPlugin);
  console.log('   Registered plugin: performance-tracker');

  // --- Execution Strategy ---
  console.log('\n3. Execution strategy:');
  const strategy = new SimulatedExecution();
  console.log(`   Using strategy: ${strategy.name}`);

  // --- Profiler ---
  console.log('\n4. Performance profiling:');
  const profiler = new PerformanceProfiler();
  profiler.start('evolution-run');

  const task = {
    id: 'advanced-example',
    type: 'optimization',
    description: 'Optimize a complex system',
    requirements: ['Minimize latency', 'Maximize throughput', 'Keep costs low'],
    evaluationCriteria: { quality: 0.4, efficiency: 0.3, creativity: 0.3 },
  };

  const report = await EvolutionSystem.run(task, config, (progress) => {
    if (progress.generation % 10 === 0) {
      console.log(`   Gen ${progress.generation}: ${progress.activeAgents} agents, best ${(progress.bestScore * 100).toFixed(1)}%`);
    }
  });

  const metrics = profiler.end('evolution-run');
  console.log(`   Done in ${metrics?.duration.toFixed(0)}ms`);

  // --- Export ---
  console.log('\n5. Report export:');
  const json = ReportExporter.toJSON(report, { pretty: true });
  const csv = ReportExporter.toCSV(report);
  const markdown = ReportExporter.toMarkdown(report);
  console.log(`   JSON: ${json.length} chars`);
  console.log(`   CSV: ${csv.split('\n').length} lines`);
  console.log(`   Markdown: ${markdown.length} chars`);

  // --- Visualization ---
  console.log('\n6. Chart generation:');
  const perfChart = ChartGenerator.generatePerformanceChart(report);
  const featureChart = ChartGenerator.generateFeatureImportanceChart(report);
  console.log(`   Performance chart SVG: ${perfChart.length} chars`);
  console.log(`   Feature chart SVG: ${featureChart.length} chars`);

  // --- Dashboard ---
  const dashboard = ChartGenerator.generateDashboard(report);
  console.log(`   Dashboard HTML: ${dashboard.length} chars`);

  console.log('\n=== Advanced example complete ===');
}

async function engineExample() {
  console.log('\n--- Direct Engine Usage ---\n');

  const config = ConfigValidator.validateWithWarnings({
    agentCount: 5,
    mode: 'quick',
    maxGenerations: 10,
  }).config;

  const engine = new EvolutionEngine(config);

  const task = {
    id: 'engine-example',
    type: 'test',
    description: 'Engine test task',
    requirements: ['Test direct engine usage'],
  };

  const report = await engine.run(task, (progress) => {
    console.log(`   Gen ${progress.generation}: ${progress.activeAgents} agents`);
  });

  console.log(`\n   Completed: ${report.totalGenerations} generations`);
  console.log(`   Survivors: ${report.finalSurvivors.length}`);
}

async function main() {
  await advancedExample();
  await engineExample();
}

main().catch(console.error);