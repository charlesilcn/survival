#!/usr/bin/env node

import { Command } from 'commander';
import { EvolutionSystem } from '../evolution-system';
import { ConfigValidator } from '../config/validator';
import { logger } from '../utils/logger';
import { promises as fs } from 'fs';
import path from 'path';
import { Task, EvolutionConfig } from '../types';

const program = new Command();

program
  .name('survival')
  .description('Multi-agent competitive evolution')
  .version('1.0.0');

program
  .command('run')
  .description('Run an evolution task')
  .option('-c, --config <path>', 'Configuration file path')
  .option('-t, --task <path>', 'Task definition file path')
  .option('-o, --output <path>', 'Output directory for reports')
  .option('-m, --mode <mode>', 'Evolution mode (quick, standard, deep, team)', 'standard')
  .option('--agents <number>', 'Number of agents', '10')
  .option('--generations <number>', 'Max generations', '50')
  .option('-v, --verbose', 'Verbose logging', false)
  .action(async (options) => {
    try {
      // Setup logging
      if (options.verbose) {
        logger.level = 'debug';
      }

      // Load or create config
      let config: Partial<EvolutionConfig> = {
        mode: options.mode as any,
        agentCount: parseInt(options.agents),
        maxGenerations: parseInt(options.generations),
      };

      if (options.config) {
        const configFile = await fs.readFile(options.config, 'utf-8');
        const fileConfig = JSON.parse(configFile);
        config = { ...config, ...fileConfig };
      }

      // Validate config
      const { config: validatedConfig, warnings } = ConfigValidator.validateWithWarnings(config);
      
      if (warnings.length > 0) {
        console.warn('⚠️  Configuration warnings:');
        warnings.forEach(w => console.warn(`  - ${w}`));
      }

      // Load or create task
      let task: Partial<Task>;
      if (options.task) {
        const taskFile = await fs.readFile(options.task, 'utf-8');
        task = JSON.parse(taskFile);
      } else {
        // Interactive task creation or use default
        task = {
          type: 'optimization',
          description: 'Optimize solution through evolution',
          requirements: ['Find optimal solution', 'Minimize cost'],
          evaluationCriteria: { quality: 0.5, efficiency: 0.5 },
        };
      }

      console.log('🚀 Starting evolution...');
      console.log(`   Mode: ${validatedConfig.mode}`);
      console.log(`   Agents: ${validatedConfig.agentCount}`);
      console.log(`   Generations: ${validatedConfig.maxGenerations}`);
      console.log();

      // Run evolution
      const startTime = Date.now();
      const report = await EvolutionSystem.run(task, validatedConfig, (progress) => {
        process.stdout.write(`\r📊 Gen ${progress.generation}/${validatedConfig.maxGenerations} | Agents: ${progress.activeAgents} | Best: ${(progress.bestScore * 100).toFixed(1)}%`);
      });

      const duration = (Date.now() - startTime) / 1000;
      console.log('\n\n✅ Evolution completed!');
      console.log(`   Duration: ${duration.toFixed(2)}s`);
      console.log(`   Total generations: ${report.totalGenerations}`);
      console.log(`   Survivors: ${report.finalSurvivors.length}`);

      // Save reports
      const outputDir = options.output || './evolution-output';
      await fs.mkdir(outputDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Save JSON report
      await fs.writeFile(
        path.join(outputDir, `report-${timestamp}.json`),
        JSON.stringify(report, null, 2)
      );

      // Save HTML report
      const htmlReport = EvolutionSystem.exportHtml(report);
      await fs.writeFile(
        path.join(outputDir, `report-${timestamp}.html`),
        htmlReport
      );

      // Save console report
      const consoleReport = EvolutionSystem.generateReport(report);
      await fs.writeFile(
        path.join(outputDir, `report-${timestamp}.txt`),
        consoleReport
      );

      console.log(`\n📁 Reports saved to: ${outputDir}`);

    } catch (error) {
      logger.error('CLI execution failed', { error });
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Generate or validate configuration')
  .option('-g, --generate', 'Generate default configuration', false)
  .option('-v, --validate <path>', 'Validate configuration file')
  .option('-o, --output <path>', 'Output file for generated config')
  .action(async (options) => {
    if (options.generate) {
      const defaultConfig = ConfigValidator.getDefaults();
      const output = JSON.stringify(defaultConfig, null, 2);
      
      if (options.output) {
        await fs.writeFile(options.output, output);
        console.log(`✅ Configuration saved to: ${options.output}`);
      } else {
        console.log(output);
      }
    }

    if (options.validate) {
      try {
        const configFile = await fs.readFile(options.validate, 'utf-8');
        const config = JSON.parse(configFile);
        const { config: validated, warnings } = ConfigValidator.validateWithWarnings(config);
        
        console.log('✅ Configuration is valid');
        
        if (warnings.length > 0) {
          console.warn('\n⚠️  Warnings:');
          warnings.forEach(w => console.warn(`  - ${w}`));
        }
      } catch (error) {
        console.error('❌ Configuration invalid:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }
  });

program
  .command('benchmark')
  .description('Run performance benchmark')
  .option('-i, --iterations <number>', 'Number of iterations', '5')
  .option('-m, --mode <mode>', 'Evolution mode', 'quick')
  .action(async (options) => {
    const iterations = parseInt(options.iterations);
    const times: number[] = [];

    console.log(`🏃 Running ${iterations} benchmark iterations...\n`);

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      
      await EvolutionSystem.run(
        {
          type: 'benchmark',
          description: 'Benchmark task',
          requirements: ['Test performance'],
        },
        { mode: options.mode }
      );
      
      const duration = Date.now() - start;
      times.push(duration);
      console.log(`  Iteration ${i + 1}: ${duration}ms`);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    console.log('\n📊 Benchmark Results:');
    console.log(`   Average: ${avg.toFixed(0)}ms`);
    console.log(`   Min: ${min}ms`);
    console.log(`   Max: ${max}ms`);
    console.log(`   StdDev: ${Math.sqrt(times.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / times.length).toFixed(0)}ms`);
  });

program
  .command('compare')
  .description('Compare different evolution configurations')
  .option('-c, --configs <paths...>', 'Configuration files to compare')
  .option('-t, --task <path>', 'Task definition file')
  .action(async (options) => {
    if (!options.configs || options.configs.length < 2) {
      console.error('❌ Please provide at least 2 configuration files');
      process.exit(1);
    }

    let task: Partial<Task> = {
      type: 'comparison',
      description: 'Comparison task',
      requirements: ['Compare configurations'],
    };

    if (options.task) {
      const taskFile = await fs.readFile(options.task, 'utf-8');
      task = JSON.parse(taskFile);
    }

    console.log('🔬 Comparing configurations...\n');

    const results = [];
    for (const configPath of options.configs) {
      const configFile = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configFile);
      
      console.log(`Running: ${path.basename(configPath)}`);
      const start = Date.now();
      const report = await EvolutionSystem.run(task, config);
      const duration = Date.now() - start;

      results.push({
        name: path.basename(configPath, '.json'),
        config,
        report,
        duration,
      });
    }

    console.log('\n📊 Comparison Results:');
    console.table(results.map(r => ({
      Config: r.name,
      Generations: r.report.totalGenerations,
      Survivors: r.report.finalSurvivors.length,
      Duration: `${r.duration}ms`,
      'Best Fitness': r.report.finalSurvivors.length > 0 
        ? Math.max(...r.report.finalSurvivors.map(a => a.fitness)).toFixed(3)
        : 'N/A',
    })));
  });

program.parse();
