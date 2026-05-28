# 物竞天择 / Survival

[English](README.md) | [中文](README.zh-CN.md)

[![npm version](https://badge.fury.io/js/@wujingtianze%2Fcore.svg)](https://www.npmjs.com/package/@wujingtianze/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0-brightgreen.svg)](https://nodejs.org/)

> 基于自然选择原理的强大多智能体竞优进化系统

## 项目概述

物竞天择 / Survival 实现了一个**世代多智能体优化框架**，多个 AI 智能体在任务上竞争，逐步筛选表现不佳的智能体，同时幸存者通过基因重组和变异从被淘汰的智能体中学习。这种方法模拟自然选择，持续进化并产生最优解决方案。

### 核心特性

- 🧬 **多智能体进化**：创建具有多样化策略和能力画像的智能体群体
- 🎯 **竞争性选择**：六维评估（质量、效率、创造力、协作性、资源使用、错误率）
- 🔀 **基因重组**：幸存者通过交叉和变异产生后代
- 📚 **知识共享**：全局知识池，具备反恶性竞争检测
- 🛡️ **容错机制**：检查点/恢复、误判恢复和回滚能力
- 🔌 **插件架构**：通过生命周期钩子和自定义指标进行扩展
- 📊 **丰富报告**：控制台、HTML、CSV、JSON 和 Markdown 导出格式
- 🎨 **可视化**：SVG 图表和交互式仪表板

## 安装

```bash
npm install @wujingtianze/core
```

### 前置条件

- Node.js >= 18.0.0
- TypeScript >= 5.0（用于 TypeScript 项目）

## 快速开始

```typescript
import { EvolutionSystem } from '@wujingtianze/core';

const task = {
  id: 'sort-algo-task',
  type: 'code_generation',
  description: '实现一个高效的排序算法',
  requirements: [
    '时间复杂度优于 O(n²)',
    '支持自定义比较器',
    '包含单元测试'
  ],
  evaluationCriteria: { 
    correctness: 0.4, 
    performance: 0.3, 
    readability: 0.2, 
    testCoverage: 0.1 
  }
};

const report = await EvolutionSystem.run(task, {
  agentCount: 10,
  maxGenerations: 50,
  mode: 'standard',
  visualization: true
});

console.log(EvolutionSystem.generateReport(report));
```

## 运行模式

| 模式 | 智能体数 | 世代数 | 选择率 | 适用场景 |
|------|---------|--------|--------|----------|
| `quick` | 5 | 20 | 0.2 | 简单任务，快速原型 |
| `standard` | 10 | 50 | 0.1 | 常规任务，质量/速度平衡 |
| `deep` | 20 | 100 | 0.05 | 复杂任务，最优解 |
| `team` | 15 | 80 | 0.08 | 多领域协作任务 |

### 快速模式方法

```typescript
const report = await EvolutionSystem.quick(task);     // 快速模式
const report = await EvolutionSystem.standard(task);  // 标准模式
const report = await EvolutionSystem.deep(task);      // 深度进化
const report = await EvolutionSystem.team(task);      // 团队协作
```

## 核心概念

### 智能体生命周期

1. **生成**：创建具有多样化策略和能力画像的智能体
2. **执行**：智能体尝试任务解决方案（模拟或通过真实 AI 执行器）
3. **评估**：六维评分（质量、效率、创造力、协作性、资源使用、错误率）
4. **选择**：根据自适应选择率淘汰表现不佳的智能体
5. **进化**：幸存者通过基因交叉和变异产生后代
6. **知识传递**：将被淘汰智能体的经验提取到全局知识池

### 执行策略

系统支持两种执行模式：

- **模拟执行**（默认）：快速、确定性的测试，模拟智能体行为
- **实时执行**：通过 OpenAI 或自定义执行器进行真实 AI 执行

```typescript
import { EvolutionEngine, OpenAIExecutor, LiveExecution } from '@wujingtianze/core';

// 使用 OpenAI 的实时执行
const executor = new OpenAIExecutor({ 
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4'
});

const engine = new EvolutionEngine(config, undefined, executor);
const report = await engine.run(task);
```

## 高级用法

### 插件系统

```typescript
import { EvolutionEngine, PluginManager, BasePlugin } from '@wujingtianze/core';

class PerformanceTracker extends BasePlugin {
  name = 'performance-tracker';
  version = '1.0.0';

  onGenerationStart(generation: number, agents: Agent[]) {
    console.log(`开始第 ${generation} 代，共 ${agents.length} 个智能体`);
  }

  onEvolutionComplete(report: EvolutionReport) {
    console.log(`进化完成！共 ${report.totalGenerations} 代`);
  }
}

const pluginManager = new PluginManager();
pluginManager.register(new PerformanceTracker());

const engine = new EvolutionEngine(config, pluginManager);
```

### 自定义指标

```typescript
import { Evaluator } from '@wujingtianze/core';

const evaluator = new Evaluator(config);
evaluator.registerMetric('maintainability', (agent, task, context) => {
  return calculateMaintainability(agent);
});

evaluator.setWeights({
  quality: 0.3,
  efficiency: 0.2,
  maintainability: 0.2,
  creativity: 0.15,
  collaboration: 0.15
});
```

### 实时进度

```typescript
const report = await EvolutionSystem.run(task, config, (progress) => {
  console.log(
    `第 ${progress.generation} 代: ` +
    `${progress.activeAgents} 个智能体, ` +
    `最佳: ${(progress.bestScore * 100).toFixed(1)}%`
  );
});
```

### 检查点与恢复

```typescript
const engine = new EvolutionEngine(config);

// 保存检查点
await engine.saveCheckpoint('checkpoint-001');

// 稍后恢复
const report = await engine.resumeFromCheckpoint('checkpoint-001', {
  maxGenerations: 150  // 恢复时调整参数
});
```

### 误判恢复

```typescript
const agentManager = engine.getAgentManager();
const eliminated = agentManager.getEliminatedAgents();

// 复活高潜力智能体
agentManager.resurrectAgent('agent-007');
```

## 报告导出

### 多种格式

```typescript
import { ReportExporter, ChartGenerator } from '@wujingtianze/core';

// JSON
const json = ReportExporter.toJSON(report, { pretty: true });

// CSV
const csv = ReportExporter.toCSV(report);
const timelineCsv = ReportExporter.timelineToCSV(report);

// Markdown
const markdown = ReportExporter.toMarkdown(report);

// HTML 仪表板
const html = ChartGenerator.generateDashboard(report);

// 批量导出所有格式
const files = ReportExporter.exportAll(report, './output');
```

### 可视化

```typescript
import { ChartGenerator } from '@wujingtianze/core';

// 性能趋势
const perfChart = ChartGenerator.generatePerformanceChart(report);

// 特征重要性
const featureChart = ChartGenerator.generateFeatureImportanceChart(report);

// 策略分布
const strategyChart = ChartGenerator.generateStrategyDistributionChart(report);
```

## 配置

```typescript
interface EvolutionConfig {
  agentCount: number;              // 初始智能体数量（默认：10）
  selectionRate: number;           // 每轮选择率（默认：0.1）
  mutationRate: number;            // 变异概率（默认：0.05）
  inheritanceRate: number;         // 经验继承比例（默认：0.3）
  maxGenerations: number;          // 最大进化世代（默认：100）
  collaborationBonus: number;      // 协作奖励（默认：0.2）
  knowledgeSharing: boolean;       // 启用知识池（默认：true）
  teamMode: boolean;               // 团队进化模式（默认：false）
  teamSize?: number;               // 每队智能体数
  faultTolerance: boolean;         // 容错机制（默认：true）
  visualization: boolean;          // 可视化报告（默认：true）
  evaluationMetrics: string[];     // 评估指标
  mode: 'quick' | 'standard' | 'deep' | 'team';
  rescueThreshold: number;         // 自动救援阈值（默认：0.7）
  convergenceThreshold: number;    // 收敛检测（默认：0.95）
  stagnationLimit: number;         // 停滞检测（默认：10）
  checkpointInterval: number;      // 检查点频率（默认：10）
}
```

### 配置验证

```typescript
import { ConfigValidator } from '@wujingtianze/core';

const { config, warnings } = ConfigValidator.validateWithWarnings({
  agentCount: 15,
  mode: 'deep'
});

if (warnings.length > 0) {
  warnings.forEach(w => console.warn(w));
}
```

## CLI 用法

```bash
# 全局安装
npm install -g @wujingtianze/core

# 运行进化
evolution run --config ./config.json --task ./task.json --output ./reports

# 生成默认配置
evolution config --generate --output ./config.json

# 验证配置
evolution config --validate ./config.json

# 基准测试
evolution benchmark --iterations 5 --mode quick

# 对比配置
evolution compare --configs config-a.json config-b.json --task task.json
```

## 架构

```mermaid
graph TB
    User([用户]) -->|任务| API[EvolutionSystem<br/>静态 API]
    API -->|初始化| Engine[EvolutionEngine<br/>核心循环]
    
    Engine -->|管理| AM[智能体管理器<br/>AgentManager]
    Engine -->|分发| TD[任务分发器<br/>TaskDistributor]
    Engine -->|评估| EV[评估器<br/>Evaluator]
    Engine -->|生成| RG[报告生成器<br/>ReportGenerator]
    Engine -->|恢复| FT[容错管理器<br/>FaultTolerance]
    
    AM -->|执行| ES[执行策略<br/>ExecutionStrategy]
    EV -->|执行| ES
    
    ES -->|默认| SE[模拟执行<br/>SimulatedExecution]
    ES -->|生产| LE[实时执行<br/>LiveExecution]
    
    style API fill:#4a90d9,stroke:#333,stroke-width:2px,color:#fff
    style Engine fill:#5cb85c,stroke:#333,stroke-width:2px,color:#fff
    style AM fill:#f0ad4e,stroke:#333,stroke-width:2px,color:#fff
    style TD fill:#f0ad4e,stroke:#333,stroke-width:2px,color:#fff
    style EV fill:#f0ad4e,stroke:#333,stroke-width:2px,color:#fff
    style RG fill:#f0ad4e,stroke:#333,stroke-width:2px,color:#fff
    style FT fill:#f0ad4e,stroke:#333,stroke-width:2px,color:#fff
    style ES fill:#d9534f,stroke:#333,stroke-width:2px,color:#fff
    style SE fill:#fff,stroke:#333,stroke-width:2px
    style LE fill:#fff,stroke:#333,stroke-width:2px
```

## 模块

| 模块 | 职责 |
|------|------|
| `EvolutionEngine` | 核心进化循环，协调所有模块，执行插件钩子 |
| `AgentManager` | 智能体生命周期、基因重组、知识池、反恶性竞争检测 |
| `Evaluator` | 多维评估、自适应选择、收敛检测 |
| `TaskDistributor` | 任务分解、智能分配、负载均衡 |
| `ReportGenerator` | 结算报告、HTML 可视化、多种导出格式 |
| `FaultToleranceManager` | 检查点恢复、误判恢复、健康检查、回滚 |
| `PluginManager` | 插件注册、生命周期钩子执行、自定义指标/变异 |
| `ExecutionStrategy` | 抽象执行层（模拟或实时 AI 执行） |

## 应用场景

- **复杂问题解决**：并行多解决方案尝试，最优选择
- **代码生成**：多智能体竞争最佳实现
- **创意方案筛选**：融合多种方法产生最优输出
- **数据分析**：多视角分析综合
- **AI 模型训练**：对抗性进化提升性能
- **代码审查**：多视角质量检查
- **风险评估**：并行多模型评估
- **内容创作**：多风格竞争最优输出

## API 参考

详见 [SKILL.md](./SKILL.md) 获取详细 API 文档和使用示例。

## 贡献指南

我们欢迎贡献！请参阅我们的 [贡献指南](CONTRIBUTING.md) 了解详情。

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m '添加 amazing 功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发环境搭建

```bash
git clone https://github.com/charlesilcn/survival.git
cd survival
npm install
npm run build
npm test
```

### 运行测试

```bash
# 运行所有测试
npm test

# 带覆盖率运行
npm run test:coverage

# 监视模式运行
npm run test:watch
```

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

