import { v4 as uuidv4 } from 'uuid';
import { Agent, Task, SubTask } from './types';

export class TaskDistributor {
  distribute(task: Task, agents: Agent[]): SubTask[] {
    const subTasks: SubTask[] = [];

    if (task.subTasks && task.subTasks.length > 0) {
      for (const st of task.subTasks) {
        const assigned = this.smartAssign(st, agents);
        subTasks.push(...assigned);
      }
      return subTasks;
    }

    const pieces = this.decomposeTask(task, agents.length);
    for (let i = 0; i < pieces.length; i++) {
      const subTask: SubTask = {
        id: pieces[i].id,
        parentTaskId: task.id,
        description: pieces[i].description,
        assignedAgentIds: [agents[i % agents.length].id],
        status: 'pending',
        deadline: task.timeout
          ? Date.now() + task.timeout / pieces.length
          : undefined,
      };
      subTasks.push(subTask);
    }

    return subTasks;
  }

  private smartAssign(task: Task, agents: Agent[]): SubTask[] {
    const subTasks: SubTask[] = [];
    const requirementCount = task.requirements.length;

    if (requirementCount > 1) {
      for (let i = 0; i < requirementCount; i++) {
        const bestAgent = this.findBestAgentForRequirement(
          task.requirements[i],
          agents
        );

        subTasks.push({
          id: `sub-${uuidv4().slice(0, 6)}`,
          parentTaskId: task.id,
          description: `Requirement: ${task.requirements[i]}`,
          assignedAgentIds: [bestAgent.id],
          status: 'pending',
        });
      }

      const collaborationAgent = this.findBestCollaborator(agents);
      subTasks.push({
        id: `sub-${uuidv4().slice(0, 6)}`,
        parentTaskId: task.id,
        description: 'Integration and review',
        assignedAgentIds: [collaborationAgent.id],
        status: 'pending',
      });
    } else {
      const primaryAgent = this.findBestFitAgent(task, agents);
      subTasks.push({
        id: `sub-${uuidv4().slice(0, 6)}`,
        parentTaskId: task.id,
        description: task.description,
        assignedAgentIds: [primaryAgent.id],
        status: 'pending',
      });
    }

    return subTasks;
  }

  private decomposeTask(
    task: Task,
    count: number
  ): { id: string; description: string }[] {
    const pieces: { id: string; description: string }[] = [];

    if (task.requirements.length > 0) {
      for (let i = 0; i < Math.min(task.requirements.length, count); i++) {
        pieces.push({
          id: `piece-${uuidv4().slice(0, 6)}`,
          description: task.requirements[i],
        });
      }
    } else {
      const pieceCount = Math.max(2, Math.min(count, 5));
      for (let i = 0; i < pieceCount; i++) {
        pieces.push({
          id: `piece-${uuidv4().slice(0, 6)}`,
          description: `${task.description} (part ${i + 1}/${pieceCount})`,
        });
      }
    }

    return pieces;
  }

  private findBestFitAgent(task: Task, agents: Agent[]): Agent {
    let bestAgent = agents[0];
    let bestScore = -Infinity;

    for (const agent of agents) {
      const score =
        agent.profile.accuracy * 0.3 +
        agent.profile.speed * 0.2 +
        agent.profile.creativity * 0.2 +
        agent.profile.efficiency * 0.3;

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  private findBestAgentForRequirement(
    requirement: string,
    agents: Agent[]
  ): Agent {
    let bestAgent = agents[0];
    let bestScore = -Infinity;
    const lowerReq = requirement.toLowerCase();

    for (const agent of agents) {
      let score =
        agent.profile.accuracy * 0.25 +
        agent.profile.efficiency * 0.25 +
        agent.profile.speed * 0.25 +
        agent.profile.creativity * 0.25;

      if (lowerReq.includes('creative') || lowerReq.includes('design')) {
        score += agent.profile.creativity * 0.5;
      } else if (
        lowerReq.includes('performance') ||
        lowerReq.includes('speed') ||
        lowerReq.includes('efficient')
      ) {
        score += agent.profile.speed * agent.profile.efficiency * 0.5;
      } else if (
        lowerReq.includes('accurate') ||
        lowerReq.includes('correct') ||
        lowerReq.includes('quality')
      ) {
        score += agent.profile.accuracy * 0.5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  private findBestCollaborator(agents: Agent[]): Agent {
    return agents.reduce((best, agent) =>
      agent.profile.collaboration > best.profile.collaboration ? agent : best
    );
  }
}