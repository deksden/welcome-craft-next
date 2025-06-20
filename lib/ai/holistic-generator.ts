/**
 * @file lib/ai/holistic-generator.ts
 * @description Core holistic site generation engine for UC-09
 * @version 1.0.0
 * @date 2025-06-20
 * @updated Initial implementation replacing UC-08 iterative approach
 */

/** HISTORY:
 * v1.0.0 (2025-06-20): Initial holistic generator with candidate aggregation and single AI call
 */

import { createLogger } from '@fab33/fab-logger'
import { generateObject } from 'ai'
import { myProvider } from '@/lib/ai/providers'
import { blockDefinitions } from '@/site-blocks'
import { getPagedArtifactsByUserId } from '@/lib/db/queries'
import { SiteDefinitionSchema } from '@/lib/ai/schemas/site-definition'
import type { 
  AllCandidates, 
  BlockCandidates, 
  SlotCandidates,
  ArtifactCandidate,
  HolisticGenerationContext
} from '@/lib/types/holistic-generation'
import type { ArtifactKind } from '@/lib/types'

const logger = createLogger('ai:holistic-generator')

/**
 * @description Aggregates artifact candidates for all slots across all blocks
 * @param userId - User ID for filtering artifacts
 * @param userPrompt - Original user prompt for context
 * @returns Complete candidates structure for AI analysis
 */
export async function aggregateCandidatesForAllSlots(
  userId: string, 
  userPrompt: string
): Promise<AllCandidates> {
  const childLogger = logger.child({ userId, userPrompt })
  childLogger.trace('Starting candidate aggregation for all slots')

  const blockCandidates: BlockCandidates[] = []
  let totalArtifacts = 0

  // Process each available block type
  for (const [blockType, definition] of Object.entries(blockDefinitions)) {
    const slotCandidates: SlotCandidates[] = []

    // Process each slot in the block
    for (const [slotName, slotDef] of Object.entries(definition.slots)) {
      const kindToSearch = Array.isArray(slotDef.kind) ? slotDef.kind[0] : slotDef.kind

      try {
        // Get candidates for this slot
        const { data: artifacts } = await getPagedArtifactsByUserId({
          userId,
          searchQuery: '', // Simple approach - no complex search queries
          page: 1,
          pageSize: 10, // Limit candidates per slot for AI efficiency
          kind: kindToSearch,
        })

        // Transform to minimal candidate format
        const candidates: ArtifactCandidate[] = artifacts.map(artifact => ({
          artifactId: artifact.id,
          title: artifact.title,
          summary: artifact.summary || null,
          kind: artifact.kind as ArtifactKind
        }))

        slotCandidates.push({
          slotName,
          slotDefinition: {
            kind: slotDef.kind,
            tags: slotDef.tags,
            description: slotDef.description
          },
          candidates
        })

        totalArtifacts += candidates.length
        childLogger.info({ 
          blockType, 
          slotName, 
          candidatesCount: candidates.length,
          kindToSearch
        }, 'Aggregated candidates for slot')

      } catch (error) {
        childLogger.warn({ 
          blockType, 
          slotName, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }, 'Failed to aggregate candidates for slot')
        
        // Add empty candidates for this slot
        slotCandidates.push({
          slotName,
          slotDefinition: {
            kind: slotDef.kind,
            tags: slotDef.tags,
            description: slotDef.description
          },
          candidates: []
        })
      }
    }

    blockCandidates.push({
      blockType,
      slots: slotCandidates
    })
  }

  const result: AllCandidates = {
    blocks: blockCandidates,
    totalArtifacts,
    userPrompt
  }

  childLogger.info({ 
    totalBlocks: blockCandidates.length,
    totalArtifacts,
    aggregationTime: 'completed'
  }, 'Candidate aggregation completed')

  return result
}

/**
 * @description Performs holistic AI generation with single generateObject call
 * @param context - Complete generation context with all candidates
 * @returns JSON string with complete site definition
 */
export async function generateSiteHolistically(
  context: HolisticGenerationContext
): Promise<string> {
  const childLogger = logger.child({ 
    userId: context.userId,
    totalCandidates: context.allCandidates.totalArtifacts
  })
  childLogger.trace('Starting holistic AI site generation')

  const systemPrompt = `You are an expert onboarding site designer. Your task is to create a logically coherent, high-quality onboarding site by selecting the MOST APPROPRIATE artifacts for each slot.

CONTEXT:
- User request: "${context.userPrompt}"
- You have access to artifact candidates for each slot across all blocks
- Select artifacts that work together thematically and contextually
- Prefer higher-quality content and avoid localhost URLs or placeholder content

SELECTION CRITERIA:
1. **Thematic coherence**: All selected artifacts should work together for a unified experience
2. **Role relevance**: Match artifacts to the user's role/department (e.g., developer, HR, etc.)
3. **Content quality**: Prefer well-written, professional content over placeholders
4. **Contextual fit**: Ensure each artifact fits its specific slot purpose

IMPORTANT: You MUST select exactly one artifactId for each slot. If no good candidates exist, select the first available artifact ID.`

  const userPrompt = `Create an onboarding site based on: "${context.userPrompt}"

Available candidates by block and slot:
${JSON.stringify(context.allCandidates, null, 2)}

Select the BEST artifact for each slot, considering:
- Overall theme and coherence
- User role and context  
- Content quality and professionalism
- Logical relationships between selected content`

  try {
    const result = await generateObject({
      model: myProvider.languageModel('gemini-1.5-flash'), // Fast model for structured output
      system: systemPrompt,
      prompt: userPrompt,
      schema: SiteDefinitionSchema,
      temperature: 0.1, // Low temperature for consistent selection
      maxTokens: 4000,
    })

    const siteDefinition = result.object
    childLogger.info({ 
      blocksGenerated: siteDefinition.blocks.length,
      theme: siteDefinition.theme,
      hasReasoning: !!siteDefinition.reasoning
    }, 'Holistic AI generation completed')

    return JSON.stringify(siteDefinition)

  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 'Holistic AI generation failed')
    
    // Fallback: create simple site with first available artifacts
    const fallbackSite = createFallbackSite(context.allCandidates)
    childLogger.warn('Using fallback site generation')
    return JSON.stringify(fallbackSite)
  }
}

/**
 * @description Creates a fallback site when AI generation fails
 * @param allCandidates - All available candidates
 * @returns Basic site definition with first available artifacts
 */
function createFallbackSite(allCandidates: AllCandidates) {
  const blocks = allCandidates.blocks.map(blockCandidate => ({
    type: blockCandidate.blockType,
    slots: Object.fromEntries(
      blockCandidate.slots.map(slotCandidate => [
        slotCandidate.slotName,
        { artifactId: slotCandidate.candidates[0]?.artifactId || '' }
      ])
    )
  }))

  return {
    theme: 'default',
    blocks,
    reasoning: 'Fallback generation due to AI failure'
  }
}

// END OF: lib/ai/holistic-generator.ts