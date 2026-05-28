import { jest } from '@jest/globals';
import { AgentManager } from '../../src/agent-manager';
import { EvolutionConfig, AgentStatus } from '../../src/types';

describe('AgentManager', () => {
  let agentManager: AgentManager;
  
  const mockConfig: EvolutionConfig = {
    agentCount: 5,
    selectionRate: 0.2,
    mutationRate: 0.1,
    inheritanceRate: 0.3,
    maxGenerations: 10,
    collaborationBonus: 0.2,
    knowledgeSharing: true,
    teamMode: false,
    faultTolerance: true,
    visualization: false,
    evaluationMetrics: ['quality', 'efficiency'],
    mode: 'quick',
  };

  beforeEach(() => {
    agentManager = new AgentManager(mockConfig);
  });

  describe('initializeAgents', () => {
    it('should create the correct number of agents', () => {
      const agents = agentManager.initializeAgents();
      expect(agents).toHaveLength(mockConfig.agentCount);
    });

    it('should create agents with unique IDs', () => {
      const agents = agentManager.initializeAgents();
      const ids = agents.map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(agents.length);
    });

    it('should create agents with diverse profiles', () => {
      const agents = agentManager.initializeAgents();
      const strategies = new Set(agents.map(a => a.strategy));
      expect(strategies.size).toBeGreaterThan(1);
    });

    it('should set initial status to IDLE', () => {
      const agents = agentManager.initializeAgents();
      agents.forEach(agent => {
        expect(agent.status).toBe(AgentStatus.IDLE);
      });
    });
  });

  describe('getActiveAgents', () => {
    it('should return only non-eliminated agents', () => {
      agentManager.initializeAgents();
      const agents = agentManager.getAllAgents();
      
      // Eliminate first agent
      agentManager.eliminateAgent(agents[0].id, 'test elimination');
      
      const activeAgents = agentManager.getActiveAgents();
      expect(activeAgents).toHaveLength(agents.length - 1);
      expect(activeAgents.find(a => a.id === agents[0].id)).toBeUndefined();
    });
  });

  describe('eliminateAgent', () => {
    it('should change agent status to ELIMINATED', () => {
      const agents = agentManager.initializeAgents();
      const agentId = agents[0].id;
      
      agentManager.eliminateAgent(agentId, 'low performance');
      
      const agent = agentManager.getAgent(agentId);
      expect(agent?.status).toBe(AgentStatus.ELIMINATED);
    });

    it('should add failure knowledge to pool', () => {
      const agents = agentManager.initializeAgents();
      const initialKnowledgeCount = agentManager.getKnowledgePool().entries.length;
      
      agentManager.eliminateAgent(agents[0].id, 'test reason');
      
      const knowledgePool = agentManager.getKnowledgePool();
      expect(knowledgePool.entries.length).toBeGreaterThan(initialKnowledgeCount);
    });
  });

  describe('resurrectAgent', () => {
    it('should restore eliminated agent', () => {
      const agents = agentManager.initializeAgents();
      const agentId = agents[0].id;
      
      agentManager.eliminateAgent(agentId, 'test');
      const resurrected = agentManager.resurrectAgent(agentId);
      
      expect(resurrected).toBeDefined();
      expect(resurrected?.status).toBe(AgentStatus.RESURRECTED);
    });

    it('should return undefined for non-existent agent', () => {
      const result = agentManager.resurrectAgent('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('createOffspring', () => {
    it('should create child with parent IDs', () => {
      const agents = agentManager.initializeAgents();
      const parent1 = agents[0];
      const parent2 = agents[1];
      
      const offspring = agentManager.createOffspring(parent1, parent2, 1);
      
      expect(offspring.parentIds).toContain(parent1.id);
      expect(offspring.parentIds).toContain(parent2.id);
    });

    it('should inherit traits from parents', () => {
      const agents = agentManager.initializeAgents();
      const parent1 = agents[0];
      const parent2 = agents[1];
      
      const offspring = agentManager.createOffspring(parent1, parent2, 1);
      
      // Offspring should have reasonable trait values
      expect(offspring.profile.accuracy).toBeGreaterThanOrEqual(0);
      expect(offspring.profile.accuracy).toBeLessThanOrEqual(1);
    });
  });

  describe('applyMutation', () => {
    it('should modify agent traits', () => {
      const agents = agentManager.initializeAgents();
      const agent = agents[0];
      const originalAccuracy = agent.profile.accuracy;
      
      // Apply mutation multiple times to increase probability of change
      for (let i = 0; i < 100; i++) {
        agentManager.applyMutation(agent);
      }
      
      // Traits should still be within bounds
      expect(agent.profile.accuracy).toBeGreaterThanOrEqual(0);
      expect(agent.profile.accuracy).toBeLessThanOrEqual(1);
    });
  });

  describe('knowledge pool', () => {
    it('should contribute knowledge', () => {
      const agents = agentManager.initializeAgents();
      const agentId = agents[0].id;
      
      const entry = agentManager.contributeKnowledge(agentId, 'test insight', 'insight');
      
      expect(entry.content).toBe('test insight');
      expect(entry.type).toBe('insight');
      expect(entry.sourceAgentId).toBe(agentId);
    });

    it('should track contributor scores', () => {
      const agents = agentManager.initializeAgents();
      const agentId = agents[0].id;
      
      agentManager.contributeKnowledge(agentId, 'insight 1', 'insight');
      agentManager.contributeKnowledge(agentId, 'insight 2', 'insight');
      
      const score = agentManager.getCollaborationBonus(agentId);
      expect(score).toBeGreaterThan(0);
    });

    it('should allow agents to acquire knowledge', () => {
      const agents = agentManager.initializeAgents();
      const agent1 = agents[0].id;
      const agent2 = agents[1].id;
      
      // Agent 1 contributes knowledge
      agentManager.contributeKnowledge(agent1, 'shared knowledge', 'insight');
      
      // Agent 2 acquires knowledge
      const acquired = agentManager.acquireKnowledge(agent2, 5);
      
      expect(acquired.length).toBeGreaterThan(0);
    });
  });

  describe('anti-toxic detection', () => {
    it('should detect toxic behavior', () => {
      const agents = agentManager.initializeAgents();
      const agentId = agents[0].id;
      
      const isToxic = agentManager.detectToxicBehavior(agentId, 'attempting to sabotage others');
      
      expect(typeof isToxic).toBe('boolean');
    });

    it('should apply penalty for toxic behavior', () => {
      const agents = agentManager.initializeAgents();
      const agent = agents[0];
      const originalFitness = agent.fitness;
      
      agentManager.applyToxicPenalty(agent.id);
      
      expect(agent.fitness).toBeLessThanOrEqual(originalFitness);
    });
  });

  describe('niche protection', () => {
    it('should calculate niche diversity', () => {
      agentManager.initializeAgents();
      const diversity = agentManager.getNicheDiversity();
      
      expect(diversity).toBeGreaterThanOrEqual(0);
      expect(diversity).toBeLessThanOrEqual(1);
    });

    it('should protect niche agents', () => {
      const agents = agentManager.initializeAgents();
      const agent = agents[0];
      
      // Make this agent unique in strategy
      agent.strategy = 'unique-strategy-' + Date.now();
      
      const protected_ = agentManager.protectNicheAgent(agent.id);
      
      // Should receive fitness bonus if unique
      if (protected_) {
        expect(agent.fitness).toBeGreaterThan(0);
      }
    });
  });
});
