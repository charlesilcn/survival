import { z } from 'zod';
import { EvolutionConfig, EvolutionMode } from '../types';

const EvolutionModeSchema = z.enum(['quick', 'standard', 'deep', 'team']);

const EvolutionConfigSchema = z.object({
  agentCount: z.number().int().min(2).max(1000).default(10),
  selectionRate: z.number().min(0.01).max(0.5).default(0.1),
  mutationRate: z.number().min(0).max(1).default(0.05),
  inheritanceRate: z.number().min(0).max(1).default(0.3),
  maxGenerations: z.number().int().min(1).max(10000).default(100),
  collaborationBonus: z.number().min(0).max(1).default(0.2),
  knowledgeSharing: z.boolean().default(true),
  teamMode: z.boolean().default(false),
  teamSize: z.number().int().min(2).max(10).optional(),
  faultTolerance: z.boolean().default(true),
  visualization: z.boolean().default(true),
  evaluationMetrics: z.array(z.string()).default(['quality', 'efficiency', 'creativity', 'collaboration']),
  mode: EvolutionModeSchema.default('standard'),
  rescueThreshold: z.number().min(0).max(1).default(0.7),
  convergenceThreshold: z.number().min(0).max(1).default(0.95),
  stagnationLimit: z.number().int().min(1).max(100).default(10),
  checkpointInterval: z.number().int().min(1).max(1000).default(10),
});

export class ConfigValidator {
  static validate(config: unknown): EvolutionConfig {
    return EvolutionConfigSchema.parse(config);
  }

  static validateWithWarnings(config: unknown): { config: EvolutionConfig; warnings: string[] } {
    const warnings: string[] = [];
    
    try {
      const validated = EvolutionConfigSchema.parse(config);
      
      // Custom validation warnings
      if (validated.agentCount > 100 && validated.maxGenerations > 500) {
        warnings.push('Large agent count with many generations may cause performance issues');
      }
      
      if (validated.selectionRate > 0.3) {
        warnings.push('High selection rate may lead to premature convergence');
      }
      
      if (validated.mutationRate > 0.2) {
        warnings.push('High mutation rate may destabilize the population');
      }
      
      if (validated.teamMode && !validated.teamSize) {
        warnings.push('Team mode enabled but teamSize not specified, using default');
      }
      
      return { config: validated, warnings };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        throw new Error(`Configuration validation failed:\n${errorMessages.join('\n')}`);
      }
      throw error;
    }
  }

  static partialValidate(config: Partial<EvolutionConfig>): Partial<EvolutionConfig> {
    return EvolutionConfigSchema.partial().parse(config);
  }

  static getDefaults(): EvolutionConfig {
    return EvolutionConfigSchema.parse({});
  }
}

export { EvolutionConfigSchema };
