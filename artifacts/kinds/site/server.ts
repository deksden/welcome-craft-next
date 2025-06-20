
/**
 * @file artifacts/kinds/site/server.ts
 * @description UC-09 Holistic Site Generation - single AI call approach
 * @version 3.0.0
 * @date 2025-06-20
 * @updated PHASE2 UC-09 IMPLEMENTATION - Complete rewrite for holistic generation
 */

/** HISTORY:
 * v3.0.0 (2025-06-20): PHASE2 UC-09 IMPLEMENTATION - Complete rewrite for holistic approach (aggregation + single AI call)
 * v2.1.0 (2025-06-20): PHASE1 UC-08 CLEANUP - Removed UC-08 imports, ready for holistic refactoring
 * v2.0.0 (2025-06-20): Integrated SmartSearchEngine for intelligent artifact search and slot filling
 * v1.x.x: Previous versions with primitive tag-based search
 */

import { createLogger } from '@fab33/fab-logger'
import type { ArtifactTool } from '@/artifacts/kinds/artifact-tools'
import { 
  aggregateCandidatesForAllSlots, 
  generateSiteHolistically 
} from '@/lib/ai/holistic-generator'
import type { HolisticGenerationContext } from '@/lib/types/holistic-generation'

const logger = createLogger('artifacts:kinds:site:server')

export const siteTool: ArtifactTool = {
  kind: 'site',
  
  create: async ({ id, title, prompt, session }) => {
    // UC-09 Holistic Site Generation - single AI call approach
    const childLogger = logger.child({ userId: session.user.id, artifactId: id, title, prompt })
    childLogger.trace('Entering UC-09 holistic siteTool.create')

    try {
      // Phase 1: Aggregate candidates for all slots across all blocks
      childLogger.info('Phase 1: Starting candidate aggregation')
      const allCandidates = await aggregateCandidatesForAllSlots(
        session.user.id as string,
        prompt
      )

      childLogger.info({ 
        totalBlocks: allCandidates.blocks.length,
        totalArtifacts: allCandidates.totalArtifacts,
        phase: 'aggregation_completed'
      }, 'Candidate aggregation completed')

      // Phase 2: Single holistic AI call for complete site generation
      childLogger.info('Phase 2: Starting holistic AI generation')
      const context: HolisticGenerationContext = {
        userId: session.user.id as string,
        userPrompt: prompt,
        allCandidates
      }

      const siteDefinitionJson = await generateSiteHolistically(context)
      
      childLogger.info({ 
        approach: 'holistic_single_ai_call',
        aiCalls: 1, // UC-09 achievement: 1 call vs ~20 in UC-08
        phase: 'generation_completed'
      }, 'UC-09 holistic site generation completed successfully')

      return siteDefinitionJson

    } catch (error) {
      childLogger.error({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        phase: 'holistic_generation_failed'
      }, 'UC-09 holistic generation failed')
      
      // Fallback: return empty site structure
      const fallbackSite = {
        theme: 'default',
        blocks: [],
        reasoning: 'Generation failed, returning empty site'
      }
      
      return JSON.stringify(fallbackSite)
    }
  },
  async update () {
    // Логика обновления сайта может быть сложной и будет реализована позже.
    // Например, "добавь блок FAQ" или "поменяй заголовок".
    logger.warn('Update operation for "site" artifact is not yet implemented.')
    return ''
  },
}

// END OF: artifacts/kinds/site/server.ts
