import { v4 as uuidv4 } from 'uuid';
import {
  Agent,
  AgentProfile,
  AgentStatus,
  KnowledgeEntry,
  EvolutionConfig,
  KnowledgePool,
  Team,
} from './types';

export class AgentManager {
  private agents: Map<string, Agent> = new Map();
  private knowledgePool: KnowledgePool = {
    entries: [],
    contributorScores: {},
    topInsights: [],
  };
  private teams: Map<string, Team> = new Map();
  private generation: number = 0;
  private config: EvolutionConfig;
  private antiToxicDetector: AntiToxicDetector;

  constructor(config: EvolutionConfig) {
    this.config = config;
    this.antiToxicDetector = new AntiToxicDetector();
  }

  initializeAgents(): Agent[] {
    this.agents.clear();
    this.generation = 0;
    const created: Agent[] = [];

    for (let i = 0; i < this.config.agentCount; i++) {
      const agent = this.createAgent(0);
      this.agents.set(agent.id, agent);
      created.push(agent);
    }

    if (this.config.teamMode && this.config.teamSize) {
      this.initializeTeams(created);
    }

    return created;
  }

  private createAgent(generation: number, parentIds: string[] = []): Agent {
    const id = `agent-${uuidv4().slice(0, 8)}`;
    const profile = this.generateDiverseProfile();

    return {
      id,
      generation,
      profile,
      status: AgentStatus.IDLE,
      parentIds,
      strategy: this.generateStrategy(),
      knowledge: [],
      fitness: 0,
      generationHistory: [generation],
    };
  }

  private generateDiverseProfile(): AgentProfile {
    return {
      speed: this.clamp(Math.random(), 0.1, 1.0),
      accuracy: this.clamp(Math.random(), 0.1, 1.0),
      creativity: this.clamp(Math.random(), 0.1, 1.0),
      collaboration: this.clamp(Math.random(), 0.1, 1.0),
      efficiency: this.clamp(Math.random(), 0.1, 1.0),
      robustness: this.clamp(Math.random(), 0.1, 1.0),
    };
  }

  private generateStrategy(): string {
    const strategies = [
      'iterative-refinement',
      'divide-and-conquer',
      'heuristic-search',
      'pattern-matching',
      'bayesian-optimization',
      'gradient-descent',
      'random-exploration',
      'ensemble-learning',
      'case-based-reasoning',
      'constraint-satisfaction',
    ];
    return strategies[Math.floor(Math.random() * strategies.length)];
  }

  private initializeTeams(agents: Agent[]): void {
    const teamSize = this.config.teamSize || 3;
    const shuffled = [...agents].sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffled.length; i += teamSize) {
      const members = shuffled.slice(i, i + teamSize);
      if (members.length < 2) continue;

      const team: Team = {
        id: `team-${uuidv4().slice(0, 6)}`,
        name: `Team ${Math.floor(i / teamSize) + 1}`,
        memberIds: members.map((a) => a.id),
        score: 0,
        collaborationScore: 0,
        generation: 0,
        status: 'active',
      };

      this.teams.set(team.id, team);
    }
  }

  getActiveAgents(): Agent[] {
    return Array.from(this.agents.values()).filter(
      (a) => a.status !== AgentStatus.ELIMINATED && a.status !== AgentStatus.MERGED
    );
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  updateAgentStatus(id: string, status: AgentStatus): void {
    const agent = this.agents.get(id);
    if (agent) {
      agent.status = status;
    }
  }

  updateAgentFitness(id: string, fitness: number): void {
    const agent = this.agents.get(id);
    if (agent) {
      agent.fitness = fitness;
    }
  }

  eliminateAgent(id: string, reason: string): void {
    const agent = this.agents.get(id);
    if (!agent) return;

    agent.status = AgentStatus.ELIMINATED;
    this.recordFailureKnowledge(agent, reason);
  }

  resurrectAgent(id: string): Agent | undefined {
    const agent = this.agents.get(id);
    if (!agent || agent.status !== AgentStatus.ELIMINATED) return undefined;

    agent.status = AgentStatus.RESURRECTED;
    agent.generation += 1;
    return agent;
  }

  createOffspring(
    parent1: Agent,
    parent2: Agent,
    generation: number
  ): Agent {
    const offspring = this.createAgent(generation, [parent1.id, parent2.id]);

    offspring.profile = {
      speed: this.inherit(parent1.profile.speed, parent2.profile.speed),
      accuracy: this.inherit(parent1.profile.accuracy, parent2.profile.accuracy),
      creativity: this.inherit(parent1.profile.creativity, parent2.profile.creativity),
      collaboration: this.inherit(parent1.profile.collaboration, parent2.profile.collaboration),
      efficiency: this.inherit(parent1.profile.efficiency, parent2.profile.efficiency),
      robustness: this.inherit(parent1.profile.robustness, parent2.profile.robustness),
    };

    this.applyGeneticInheritance(offspring, parent1, parent2);

    this.agents.set(offspring.id, offspring);
    return offspring;
  }

  private inherit(value1: number, value2: number): number {
    const inherited = Math.random() > 0.5
      ? value1 * 0.7 + value2 * 0.3
      : value2 * 0.7 + value1 * 0.3;

    const mutated = inherited + (Math.random() - 0.5) * 0.2 * this.config.mutationRate * 10;
    return this.clamp(mutated, 0.0, 1.0);
  }

  private applyGeneticInheritance(
    offspring: Agent,
    parent1: Agent,
    parent2: Agent
  ): void {
    const parentKnowledge = [...parent1.knowledge, ...parent2.knowledge];
    const sorted = parentKnowledge.sort((a, b) => b.relevance - a.relevance);
    const inheritedCount = Math.floor(
      sorted.length * this.config.inheritanceRate
    );

    offspring.knowledge = sorted.slice(0, inheritedCount).map((k) => ({
      ...k,
      id: `k-${uuidv4().slice(0, 6)}`,
      sourceAgentId: offspring.id,
      timestamp: Date.now(),
    }));
  }

  applyMutation(agent: Agent): void {
    const traitKeys: (keyof AgentProfile)[] = [
      'speed',
      'accuracy',
      'creativity',
      'collaboration',
      'efficiency',
      'robustness',
    ];

    for (const key of traitKeys) {
      if (Math.random() < this.config.mutationRate) {
        agent.profile[key] = this.clamp(
          agent.profile[key] + (Math.random() - 0.5) * 0.3,
          0.0,
          1.0
        );
      }
    }

    if (Math.random() < this.config.mutationRate * 0.5) {
      agent.strategy = this.generateStrategy();
    }
  }

  getEliminatedAgents(): Agent[] {
    return Array.from(this.agents.values()).filter(
      (a) => a.status === AgentStatus.ELIMINATED
    );
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getGeneration(): number {
    return this.generation;
  }

  incrementGeneration(): void {
    this.generation += 1;
  }

  // ---- Knowledge Sharing Pool ----

  contributeKnowledge(agentId: string, content: string, type: KnowledgeEntry['type']): KnowledgeEntry {
    const entry: KnowledgeEntry = {
      id: `k-${uuidv4().slice(0, 8)}`,
      type,
      content,
      sourceAgentId: agentId,
      timestamp: Date.now(),
      relevance: 1.0,
      tags: [],
    };

    this.knowledgePool.entries.push(entry);

    const prevScore = this.knowledgePool.contributorScores[agentId] || 0;
    this.knowledgePool.contributorScores[agentId] = prevScore + 1;

    this.refreshTopInsights();
    return entry;
  }

  acquireKnowledge(agentId: string, count: number = 5): KnowledgeEntry[] {
    const topEntries = this.knowledgePool.entries
      .filter((e) => e.sourceAgentId !== agentId)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, count);

    const agent = this.agents.get(agentId);
    if (agent) {
      agent.knowledge = [...agent.knowledge, ...topEntries].slice(-50);
    }

    return topEntries;
  }

  getCollaborationBonus(agentId: string): number {
    const contributions = this.knowledgePool.contributorScores[agentId] || 0;
    return Math.min(contributions * this.config.collaborationBonus * 0.1, this.config.collaborationBonus);
  }

  private refreshTopInsights(): void {
    this.knowledgePool.topInsights = this.knowledgePool.entries
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10);
  }

  getKnowledgePool(): KnowledgePool {
    return this.knowledgePool;
  }

  // ---- Anti-toxic Competition ----

  detectToxicBehavior(agentId: string, behavior: string): boolean {
    return this.antiToxicDetector.analyze(agentId, behavior);
  }

  applyToxicPenalty(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    agent.fitness *= 0.5;
  }

  // ---- Niche Protection ----

  getNicheDiversity(): number {
    const strategies = new Set(
      Array.from(this.agents.values())
        .filter((a) => a.status !== AgentStatus.ELIMINATED)
        .map((a) => a.strategy)
    );
    return strategies.size / this.config.agentCount;
  }

  protectNicheAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    const sameStrategyCount = Array.from(this.agents.values()).filter(
      (a) =>
        a.strategy === agent.strategy &&
        a.status !== AgentStatus.ELIMINATED &&
        a.id !== agent.id
    ).length;

    if (sameStrategyCount <= 1) {
      agent.fitness *= 1.2;
      return true;
    }

    return false;
  }

  // ---- Team Operations ----

  getTeams(): Team[] {
    return Array.from(this.teams.values()).filter(
      (t) => t.status === 'active'
    );
  }

  updateTeamScore(teamId: string, score: number): void {
    const team = this.teams.get(teamId);
    if (team) {
      team.score = score;
    }
  }

  updateTeamCollaborationScore(teamId: string, score: number): void {
    const team = this.teams.get(teamId);
    if (team) {
      team.collaborationScore = score;
    }
  }

  eliminateTeam(teamId: string): void {
    const team = this.teams.get(teamId);
    if (!team) return;

    team.status = 'eliminated';
    for (const memberId of team.memberIds) {
      this.eliminateAgent(memberId, `Team ${team.name} eliminated`);
    }
  }

  // ---- Utility Methods ----

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private recordFailureKnowledge(agent: Agent, reason: string): void {
    const entry: KnowledgeEntry = {
      id: `k-${uuidv4().slice(0, 8)}`,
      type: 'failure',
      content: `Agent ${agent.id} eliminated: ${reason}. Strategy: ${agent.strategy}`,
      sourceAgentId: agent.id,
      timestamp: Date.now(),
      relevance: 0.8,
      tags: ['elimination', agent.strategy],
    };

    this.knowledgePool.entries.push(entry);
    this.refreshTopInsights();
  }

  restoreFromSnapshot(agents: Agent[], targetGeneration: number): void {
    this.agents.clear();
    for (const agent of agents) {
      this.agents.set(agent.id, { ...agent });
    }
    this.generation = targetGeneration;
  }
}

class AntiToxicDetector {
  private toxicScore: Map<string, number> = new Map();
  private readonly TOXIC_THRESHOLD = 3;

  analyze(agentId: string, behavior: string): boolean {
    const toxicKeywords = ['sabotage', 'block', 'undermine', 'monopolize', 'hoard'];
    const isToxic = toxicKeywords.some((kw) => behavior.toLowerCase().includes(kw));

    if (isToxic) {
      const current = this.toxicScore.get(agentId) || 0;
      this.toxicScore.set(agentId, current + 1);
    }

    return (this.toxicScore.get(agentId) || 0) >= this.TOXIC_THRESHOLD;
  }
}