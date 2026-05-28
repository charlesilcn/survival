import { logger } from '../utils/logger';
import { EvolutionPlugin, MutationStrategy } from './interface';
import { EvolutionConfig, Agent, EvaluationResult, EvolutionReport, MetricFn } from '../types';

export class PluginManager {
  private plugins: Map<string, EvolutionPlugin> = new Map();
  private customMetrics: Map<string, MetricFn> = new Map();
  private customMutations: Map<string, MutationStrategy> = new Map();

  register(plugin: EvolutionPlugin): void {
    if (this.plugins.has(plugin.name)) {
      logger.warn(`Plugin ${plugin.name} is already registered, skipping`);
      return;
    }

    this.plugins.set(plugin.name, plugin);
    logger.info(`Plugin registered: ${plugin.name}@${plugin.version}`);

    // Register custom metrics
    if (plugin.registerMetrics) {
      const metrics = plugin.registerMetrics();
      for (const [name, fn] of metrics) {
        this.customMetrics.set(`${plugin.name}.${name}`, fn);
        logger.debug(`Metric registered: ${plugin.name}.${name}`);
      }
    }

    // Register custom mutations
    if (plugin.registerMutations) {
      const mutations = plugin.registerMutations();
      for (const mutation of mutations) {
        this.customMutations.set(`${plugin.name}.${mutation.name}`, mutation);
        logger.debug(`Mutation registered: ${plugin.name}.${mutation.name}`);
      }
    }
  }

  unregister(pluginName: string): boolean {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      logger.warn(`Plugin ${pluginName} not found`);
      return false;
    }

    // Remove associated metrics
    if (plugin.registerMetrics) {
      for (const [name] of plugin.registerMetrics()) {
        this.customMetrics.delete(`${pluginName}.${name}`);
      }
    }

    // Remove associated mutations
    if (plugin.registerMutations) {
      for (const mutation of plugin.registerMutations()) {
        this.customMutations.delete(`${pluginName}.${mutation.name}`);
      }
    }

    this.plugins.delete(pluginName);
    logger.info(`Plugin unregistered: ${pluginName}`);
    return true;
  }

  async executeHook(
    hook: keyof EvolutionPlugin,
    ...args: unknown[]
  ): Promise<void> {
    for (const [name, plugin] of this.plugins) {
      const fn = plugin[hook];
      if (typeof fn === 'function') {
        try {
          await fn.apply(plugin, args);
        } catch (error) {
          logger.error(`Plugin ${name} hook ${hook} failed`, { error });
        }
      }
    }
  }

  getCustomMetrics(): Map<string, MetricFn> {
    return new Map(this.customMetrics);
  }

  getCustomMutations(): Map<string, MutationStrategy> {
    return new Map(this.customMutations);
  }

  getPlugin(name: string): EvolutionPlugin | undefined {
    return this.plugins.get(name);
  }

  getAllPlugins(): EvolutionPlugin[] {
    return Array.from(this.plugins.values());
  }

  modifyConfig(baseConfig: EvolutionConfig): EvolutionConfig {
    let config = { ...baseConfig };
    for (const plugin of this.plugins.values()) {
      if (plugin.modifyConfig) {
        config = plugin.modifyConfig(config);
      }
    }
    return config;
  }

  clear(): void {
    this.plugins.clear();
    this.customMetrics.clear();
    this.customMutations.clear();
    logger.info('All plugins cleared');
  }
}
