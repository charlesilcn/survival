/**
 * Evolution System - Basic Usage Example
 * 
 * This example demonstrates how to use the Evolution System
 * to solve a code generation task with multiple competing agents.
 */

import { EvolutionSystem, EvolutionConfig, Task } from '../src/index';

async function main() {
  // Define a task for the evolution system
  const task: Task = {
    id: 'sort-algo-task',
    type: 'code_generation',
    description: 'Implement an efficient sorting algorithm',
    requirements: [
      'Time complexity better than O(n²)',
      'Support custom comparator function',
      'Handle edge cases (empty array, single element)',
      'Include comprehensive unit tests'
    ],
    constraints: {
      maxLines: 100,
      noExternalLibs: true
    },
    evaluationCriteria: {
      correctness: 0.4,
      performance: 0.3,
      readability: 0.2,
      testCoverage: 0.1
    },
    timeout: 60000,
    priority: 1
  };

  // Configuration for standard mode
  const config: EvolutionConfig = {
    agentCount: 10,
    selectionRate: 0.1,
    mutationRate: 0.05,
    inheritanceRate: 0.3,
    maxGenerations: 50,
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
    checkpointInterval: 10
  };

  console.log('🚀 Starting Evolution Process...\n');

  try {
    // Run evolution with progress callback
    const report = await EvolutionSystem.run(task, config, (progress) => {
      console.log(
        `Generation ${progress.generation}: ` +
        `${progress.activeAgents} agents active | ` +
        `Best: ${(progress.bestScore * 100).toFixed(1)}% | ` +
        `Avg: ${(progress.avgScore * 100).toFixed(1)}%`
      );
    });

    // Display settlement report
    console.log('\n' + '='.repeat(60));
    console.log(EvolutionSystem.generateReport(report));

    // Export HTML report
    const htmlReport = EvolutionSystem.exportHtml(report);
    console.log('\n📄 HTML report generated (length:', htmlReport.length, 'chars)');

    // Show final survivors
    console.log('\n🏆 Final Survivors:');
    report.finalSurvivors.forEach((agent, idx) => {
      console.log(`  ${idx + 1}. ${agent.id} - Strategy: ${agent.strategy}`);
      console.log(`     Fitness: ${(agent.fitness * 100).toFixed(1)}%`);
    });

  } catch (error) {
    console.error('❌ Evolution failed:', error);
    process.exit(1);
  }
}

// Run the example
main();
