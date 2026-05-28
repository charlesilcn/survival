import { performance } from 'perf_hooks';
import { logger } from '../utils/logger';

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  startTime: number;
  endTime: number;
  memoryDelta?: number;
  cpuDelta?: number;
}

export class PerformanceProfiler {
  private metrics: PerformanceMetrics[] = [];
  private activeTimers: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  start(operation: string): void {
    this.activeTimers.set(operation, performance.now());
  }

  /**
   * End timing an operation
   */
  end(operation: string): PerformanceMetrics | null {
    const startTime = this.activeTimers.get(operation);
    if (!startTime) {
      logger.warn(`No active timer found for operation: ${operation}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    const metric: PerformanceMetrics = {
      operation,
      duration,
      startTime,
      endTime,
    };

    this.metrics.push(metric);
    this.activeTimers.delete(operation);

    logger.debug(`Performance: ${operation} took ${duration.toFixed(2)}ms`);
    return metric;
  }

  /**
   * Profile a function execution
   */
  async profile<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; metrics: PerformanceMetrics }> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    const result = await fn();

    const endTime = performance.now();
    const endMemory = process.memoryUsage();

    const metrics: PerformanceMetrics = {
      operation,
      duration: endTime - startTime,
      startTime,
      endTime,
      memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
    };

    this.metrics.push(metrics);

    return { result, metrics };
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get metrics for a specific operation
   */
  getMetricsForOperation(operation: string): PerformanceMetrics[] {
    return this.metrics.filter(m => m.operation === operation);
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(operation: string): number {
    const metrics = this.getMetricsForOperation(operation);
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    totalOperations: number;
    totalDuration: number;
    averageDuration: number;
    slowestOperation: PerformanceMetrics | null;
    fastestOperation: PerformanceMetrics | null;
    operationsByFrequency: Record<string, number>;
  } {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        totalDuration: 0,
        averageDuration: 0,
        slowestOperation: null,
        fastestOperation: null,
        operationsByFrequency: {},
      };
    }

    const sorted = [...this.metrics].sort((a, b) => b.duration - a.duration);
    const operationsByFrequency: Record<string, number> = {};

    for (const metric of this.metrics) {
      operationsByFrequency[metric.operation] = 
        (operationsByFrequency[metric.operation] || 0) + 1;
    }

    return {
      totalOperations: this.metrics.length,
      totalDuration: this.metrics.reduce((sum, m) => sum + m.duration, 0),
      averageDuration: this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length,
      slowestOperation: sorted[0],
      fastestOperation: sorted[sorted.length - 1],
      operationsByFrequency,
    };
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const summary = this.getSummary();

    const lines: string[] = [];
    lines.push('Performance Profile Report');
    lines.push('==========================\n');
    lines.push(`Total Operations: ${summary.totalOperations}`);
    lines.push(`Total Duration: ${summary.totalDuration.toFixed(2)}ms`);
    lines.push(`Average Duration: ${summary.averageDuration.toFixed(2)}ms\n`);

    if (summary.slowestOperation) {
      lines.push(`Slowest: ${summary.slowestOperation.operation} (${summary.slowestOperation.duration.toFixed(2)}ms)`);
    }
    if (summary.fastestOperation) {
      lines.push(`Fastest: ${summary.fastestOperation.operation} (${summary.fastestOperation.duration.toFixed(2)}ms)`);
    }

    lines.push('\nOperations by Frequency:');
    const sortedOps = Object.entries(summary.operationsByFrequency)
      .sort(([, a], [, b]) => b - a);
    for (const [op, count] of sortedOps) {
      const avgDuration = this.getAverageDuration(op);
      lines.push(`  ${op}: ${count} calls, avg ${avgDuration.toFixed(2)}ms`);
    }

    return lines.join('\n');
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.activeTimers.clear();
  }

  /**
   * Export metrics to JSON
   */
  toJSON(): string {
    return JSON.stringify({
      metrics: this.metrics,
      summary: this.getSummary(),
      generatedAt: new Date().toISOString(),
    }, null, 2);
  }
}

export class MemoryProfiler {
  private snapshots: Array<{ label: string; usage: NodeJS.MemoryUsage; timestamp: number }> = [];

  /**
   * Take a memory snapshot
   */
  snapshot(label: string): void {
    this.snapshots.push({
      label,
      usage: process.memoryUsage(),
      timestamp: Date.now(),
    });
  }

  /**
   * Get memory diff between two snapshots
   */
  getDiff(startLabel: string, endLabel: string): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  } | null {
    const start = this.snapshots.find(s => s.label === startLabel);
    const end = this.snapshots.find(s => s.label === endLabel);

    if (!start || !end) return null;

    return {
      heapUsed: end.usage.heapUsed - start.usage.heapUsed,
      heapTotal: end.usage.heapTotal - start.usage.heapTotal,
      external: end.usage.external - start.usage.external,
      rss: end.usage.rss - start.usage.rss,
    };
  }

  /**
   * Generate memory report
   */
  generateReport(): string {
    const lines: string[] = [];
    lines.push('Memory Profile Report');
    lines.push('=====================\n');

    for (let i = 0; i < this.snapshots.length; i++) {
      const snap = this.snapshots[i];
      lines.push(`Snapshot ${i + 1}: ${snap.label}`);
      lines.push(`  Heap Used: ${(snap.usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      lines.push(`  Heap Total: ${(snap.usage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
      lines.push(`  RSS: ${(snap.usage.rss / 1024 / 1024).toFixed(2)} MB\n`);
    }

    return lines.join('\n');
  }

  /**
   * Clear all snapshots
   */
  clear(): void {
    this.snapshots = [];
  }
}
