import OpenAI from 'openai';
import { BaseExecutor, ExecutionResult, ExecutorConfig } from './interface';
import { Agent, Task } from '../types';
import { logger } from '../utils/logger';

export interface OpenAIConfig extends ExecutorConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export class OpenAIExecutor extends BaseExecutor {
  readonly name = 'openai';
  readonly version = '1.0.0';
  
  private client: OpenAI;
  private defaultModel = 'gpt-4';
  
  constructor(config: OpenAIConfig = {}) {
    super(config);
    
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass apiKey in config.');
    }
    
    this.client = new OpenAI({
      apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeout,
      maxRetries: config.maxRetries,
    });
    
    // Prevent config serialization from leaking API key
    delete (this.config as Record<string, unknown>).apiKey;
  }
  
  async execute(task: Task, agent: Agent): Promise<ExecutionResult> {
    const startTime = Date.now();
    const model = this.config.model || this.defaultModel;
    
    try {
      const systemPrompt = this.buildSystemPrompt(agent);
      
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: this.buildTaskPrompt(task) },
        ],
        temperature: this.mapCreativityToTemp(agent.profile.creativity),
        max_tokens: (this.config as OpenAIConfig).maxTokens || 2000,
        top_p: (this.config as OpenAIConfig).topP,
        frequency_penalty: (this.config as OpenAIConfig).frequencyPenalty,
        presence_penalty: (this.config as OpenAIConfig).presencePenalty,
      });
      
      const latency = Date.now() - startTime;
      const output = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;
      
      logger.debug('OpenAI execution completed', {
        agentId: agent.id,
        model,
        tokensUsed,
        latency,
      });
      
      return {
        output,
        tokensUsed,
        latency,
        cost: this.calculateCost(tokensUsed, model),
        metadata: {
          model,
          finishReason: response.choices[0]?.finish_reason,
        },
      };
    } catch (error) {
      logger.error('OpenAI execution failed', {
        agentId: agent.id,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
  
  supports(model: string): boolean {
    const supportedModels = [
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4-turbo-preview',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
    ];
    return supportedModels.some(m => model.startsWith(m));
  }
  
  getCapabilities(): string[] {
    return [
      'text-generation',
      'code-generation',
      'function-calling',
      'json-mode',
    ];
  }
  
  estimateCost(task: Task, agent: Agent): number {
    const model = this.config.model || this.defaultModel;
    const estimatedTokens = this.estimateTokens(task);
    return this.calculateCost(estimatedTokens, model);
  }
  
  private buildTaskPrompt(task: Task): string {
    let prompt = `Task: ${task.description}\n\n`;
    
    if (task.requirements.length > 0) {
      prompt += 'Requirements:\n';
      task.requirements.forEach((req, i) => {
        prompt += `${i + 1}. ${req}\n`;
      });
      prompt += '\n';
    }
    
    if (Object.keys(task.constraints).length > 0) {
      prompt += 'Constraints:\n';
      for (const [key, value] of Object.entries(task.constraints)) {
        prompt += `- ${key}: ${value}\n`;
      }
      prompt += '\n';
    }
    
    prompt += 'Please provide your solution:';
    
    return prompt;
  }
  
  private estimateTokens(task: Task): number {
    // Rough estimation: 1 token ≈ 4 characters
    const descriptionLength = task.description.length;
    const requirementsLength = task.requirements.join(' ').length;
    return Math.ceil((descriptionLength + requirementsLength) / 4) + 500; // +500 for response
  }
  
  private calculateCost(tokens: number, model: string): number {
    // Pricing per 1K tokens (as of 2024)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'gpt-3.5-turbo-16k': { input: 0.001, output: 0.002 },
    };
    
    const price = pricing[model] || pricing['gpt-4'];
    // Assume 70% input, 30% output
    const inputTokens = tokens * 0.7;
    const outputTokens = tokens * 0.3;
    
    return (inputTokens / 1000) * price.input + (outputTokens / 1000) * price.output;
  }
}
