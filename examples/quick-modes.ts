/**
 * Evolution System - Quick Mode Examples
 * 
 * Demonstrates the four built-in quick modes:
 * - quick: Fast results for simple tasks
 * - standard: Balanced quality and speed
 * - deep: Thorough evolution for complex tasks
 * - team: Collaborative team-based evolution
 */

import { EvolutionSystem, Task } from '../src/index';

const sampleTask: Task = {
  id: 'example-task',
  type: 'optimization',
  description: 'Optimize a function for maximum efficiency',
  requirements: ['Minimize execution time', 'Maintain accuracy', 'Handle edge cases'],
  constraints: {},
  evaluationCriteria: { performance: 0.5, accuracy: 0.5 },
};

async function demonstrateQuickModes() {
  console.log('🎯 Evolution System - Quick Mode Demonstrations\n');
  console.log('=' .repeat(60));

  // 1. Quick Mode
  console.log('\n⚡ Quick Mode (5 agents, 20 generations)');
  console.log('Best for: Simple tasks, rapid prototyping');
  try {
    const quickReport = await EvolutionSystem.quick(sampleTask);
    console.log(`Completed: ${quickReport.totalGenerations} generations`);
    console.log(`Survivors: ${quickReport.finalSurvivors.length} agents`);
  } catch (e) {
    console.error('Quick mode failed:', e);
  }

  // 2. Standard Mode
  console.log('\n📊 Standard Mode (10 agents, 50 generations)');
  console.log('Best for: Regular tasks, balanced approach');
  try {
    const standardReport = await EvolutionSystem.standard(sampleTask);
    console.log(`Completed: ${standardReport.totalGenerations} generations`);
    console.log(`Survivors: ${standardReport.finalSurvivors.length} agents`);
  } catch (e) {
    console.error('Standard mode failed:', e);
  }

  // 3. Deep Mode
  console.log('\n🔬 Deep Mode (20 agents, 100 generations)');
  console.log('Best for: Complex tasks, seeking optimal solutions');
  try {
    const deepReport = await EvolutionSystem.deep(sampleTask);
    console.log(`Completed: ${deepReport.totalGenerations} generations`);
    console.log(`Survivors: ${deepReport.finalSurvivors.length} agents`);
  } catch (e) {
    console.error('Deep mode failed:', e);
  }

  // 4. Team Mode
  console.log('\n🤝 Team Mode (15 agents, teams of 3)');
  console.log('Best for: Multi-domain collaborative tasks');
  try {
    const teamReport = await EvolutionSystem.team(sampleTask);
    console.log(`Completed: ${teamReport.totalGenerations} generations`);
    console.log(`Survivors: ${teamReport.finalSurvivors.length} agents`);
  } catch (e) {
    console.error('Team mode failed:', e);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All demonstrations completed!');
}

demonstrateQuickModes();
