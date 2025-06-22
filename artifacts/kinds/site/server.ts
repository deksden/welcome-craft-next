
/**
 * @file artifacts/kinds/site/server.ts
 * @description UC-09 Holistic Site Generation - single AI call approach
 * @version 4.0.0
 * @date 2025-06-20
 * @updated UC-10 SCHEMA-DRIVEN CMS - Добавлены схема-ориентированные функции для работы с A_Site таблицей.
 */

/** HISTORY:
 * v4.0.0 (2025-06-20): UC-10 SCHEMA-DRIVEN CMS - Добавлены saveSiteArtifact, loadSiteArtifact, deleteSiteArtifact функции для работы с новой A_Site таблицей.
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
import { db } from '@/lib/db'
import { artifactSite } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import type { Artifact, ArtifactSite } from '@/lib/db/schema'

const logger = createLogger('artifacts:kinds:site:server')

const siteLegacyTool: ArtifactTool = {
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

/**
 * @description Site artifact tool с поддержкой UC-10 schema-driven операций
 * @feature Поддержка как legacy AI операций (UC-09), так и новых save/load/delete
 */
export const siteTool = {
  kind: 'site' as const,
  // Legacy AI operations (для совместимости)
  create: siteLegacyTool.create,
  update: siteLegacyTool.update,
  // UC-10 Schema-Driven операции
  save: saveSiteArtifact,
  load: loadSiteArtifact,
  delete: deleteSiteArtifact,
}

// =============================================================================
// UC-10 SCHEMA-DRIVEN CMS: Новые функции для работы с A_Site таблицей
// =============================================================================

/**
 * @description Сохраняет site артефакт в специализированную таблицу A_Site
 * @feature Поддержка UC-09 полей (reasoning, блоков, темы) и автоматический подсчет блоков
 * @param artifact - Базовая информация об артефакте
 * @param content - JSON строка с site definition
 * @param metadata - Дополнительные метаданные (theme, reasoning)
 * @returns Promise с результатом операции
 * @throws Ошибка если сохранение не удалось
 */
export async function saveSiteArtifact(
  artifact: Artifact, 
  content: string, 
  metadata?: Record<string, any>
): Promise<void> {
  const childLogger = logger.child({ artifactId: artifact.id, kind: artifact.kind })
  
  try {
    // Парсим site definition
    let siteDefinition: Record<string, any>
    try {
      siteDefinition = JSON.parse(content)
    } catch (parseError) {
      childLogger.error({ content, parseError }, 'Failed to parse site definition JSON')
      throw new Error(`Invalid site definition JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`)
    }
    
    // Извлечение данных из site definition и metadata
    const theme = siteDefinition.theme || metadata?.theme || 'default'
    const reasoning = siteDefinition.reasoning || metadata?.reasoning
    const blocks = siteDefinition.blocks || []
    const blocksCount = Array.isArray(blocks) ? blocks.length : 0
    
    childLogger.info({ 
      theme,
      blocksCount,
      hasReasoning: !!reasoning,
      siteDefinitionSize: content.length
    }, 'Saving site artifact to A_Site table')
    
    await db.insert(artifactSite).values({
      artifactId: artifact.id,
      createdAt: artifact.createdAt,
      siteDefinition,
      theme,
      reasoning,
      blocksCount,
      lastOptimized: new Date() // UC-09 feature: track optimization time
    }).onConflictDoUpdate({
      target: [artifactSite.artifactId, artifactSite.createdAt],
      set: {
        siteDefinition,
        theme,
        reasoning,
        blocksCount,
        lastOptimized: new Date()
      }
    })
    
    childLogger.info('Site artifact saved successfully to A_Site table')
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to save site artifact to A_Site table')
    
    throw error
  }
}

/**
 * @description Загружает данные site артефакта из таблицы A_Site
 * @param artifactId - ID артефакта для загрузки
 * @returns Promise с данными site артефакта или null
 */
export async function loadSiteArtifact(artifactId: string, createdAt: Date): Promise<ArtifactSite | null> {
  const childLogger = logger.child({ artifactId, createdAt })
  
  try {
    childLogger.debug('Loading site artifact from A_Site table')
    
    const result = await db.select().from(artifactSite)
      .where(and(
        eq(artifactSite.artifactId, artifactId),
        eq(artifactSite.createdAt, createdAt)
      ))
      .limit(1)
    
    const siteData = result[0] || null
    
    if (siteData) {
      childLogger.info({ 
        theme: siteData.theme,
        blocksCount: siteData.blocksCount,
        hasReasoning: !!siteData.reasoning,
        lastOptimized: siteData.lastOptimized
      }, 'Site artifact loaded successfully from A_Site table')
    } else {
      childLogger.warn('Site artifact not found in A_Site table')
    }
    
    return siteData
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to load site artifact from A_Site table')
    
    throw error
  }
}

/**
 * @description Удаляет данные site артефакта из таблицы A_Site
 * @param artifactId - ID артефакта для удаления
 * @returns Promise с результатом операции
 */
export async function deleteSiteArtifact(artifactId: string, createdAt: Date): Promise<void> {
  const childLogger = logger.child({ artifactId, createdAt })
  
  try {
    childLogger.info('Deleting site artifact from A_Site table')
    
    await db.delete(artifactSite)
      .where(and(
        eq(artifactSite.artifactId, artifactId),
        eq(artifactSite.createdAt, createdAt)
      ))
    
    childLogger.info('Site artifact deleted successfully from A_Site table')
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to delete site artifact from A_Site table')
    
    throw error
  }
}

// END OF: artifacts/kinds/site/server.ts
