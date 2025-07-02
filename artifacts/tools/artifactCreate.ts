/**
 * @file artifacts/tools/artifactCreate.ts
 * @description AI-инструмент для создания нового артефакта.
 * @version 2.3.0
 * @date 2025-07-02
 * @updated CRITICAL BUGFIX: Added worldContext parameter to ensure artifacts are saved with correct world_id for proper world isolation.
 */

/** HISTORY:
 * v2.3.0 (2025-07-02): CRITICAL BUGFIX: Added worldContext parameter to artifactCreate tool. Fixed issue where new artifacts were saved with world_id=null instead of proper world context, causing them not to appear in sidebar recent artifacts list.
 * v2.2.1 (2025-06-11): Replaced non-null assertion with a guard clause for session.user.id.
 * v2.2.0 (2025-06-10): Исправлены все ошибки типизации (TS2305, TS2322, TS2724) путем обновления импортов и явной типизации.
 */

import { generateUUID } from '@/lib/utils'
import { tool } from 'ai'
import { z } from 'zod'
import type { Session } from 'next-auth'
import { artifactTools } from '@/artifacts/kinds/artifact-tools'
import { createLogger } from '@fab33/fab-logger'
import { AI_TOOL_NAMES } from '@/lib/ai/tools/constants'
import { saveArtifact as dbSaveArtifact } from '@/lib/db/queries'
import { saveArtifact as toolsSaveArtifact } from '@/artifacts/kinds/artifact-tools'
import { artifactKinds } from '@/lib/types'
import { generateAndSaveSummary } from '@/lib/ai/summarizer'
import type { WorldContext } from '@/lib/db/world-context'

const logger = createLogger('artifacts:tools:artifactCreate')

const CreateArtifactSchema = z.object({
  title: z.string().describe('A short, descriptive title for the new artifact.'),
  kind: z.enum(artifactKinds).describe('The type of artifact to create.'),
  prompt: z.string().describe('A detailed prompt or instruction for the AI model that will generate the content.'),
})

type CreateArtifactParams = z.infer<typeof CreateArtifactSchema>;

interface CreateArtifactProps {
  session: Session;
  worldContext?: WorldContext;
}

export const artifactCreate = ({ session, worldContext }: CreateArtifactProps) =>
  tool({
    description:
      'Creates a new artifact reference (metadata only) with a title and type. This tool creates only a REFERENCE/LINK to the artifact, not the actual content. The content is generated asynchronously in the background. To access the full content of any artifact, use artifactContent tool with the artifact ID. Use this when the user explicitly asks to "create", "write", "generate", or "make" something new.',
    parameters: CreateArtifactSchema,
    execute: async (args: CreateArtifactParams) => {
      const startTime = Date.now()
      
      if (!session?.user?.id) {
        logger.error('User session or user ID is missing. Cannot proceed with artifact creation.')
        return { error: 'User is not authenticated. This action cannot be performed.' }
      }

      const { title, kind, prompt } = args
      const artifactId = generateUUID()
      const childLogger = logger.child({ artifactId, kind, userId: session.user.id })
      
      childLogger.info({ 
        title, 
        kind,
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        promptLength: prompt.length 
      }, 'Starting artifact creation')

      const handler = artifactTools.find((h) => h.kind === kind)

      if (!handler?.create) {
        const errorMsg = `Create operation for artifact of kind '${kind}' is not supported.`
        childLogger.error({ availableKinds: artifactTools.map(h => h.kind) }, errorMsg)
        return { error: errorMsg }
      }

      try {
        childLogger.debug('Calling artifact handler for content generation')
        const contentGenerationStart = Date.now()
        
        const content = await handler.create({ id: artifactId, title, prompt, session })
        
        const contentGenerationTime = Date.now() - contentGenerationStart
        childLogger.info({ 
          contentGenerationTimeMs: contentGenerationTime,
          contentLength: typeof content === 'string' ? content.length : JSON.stringify(content).length,
          contentType: typeof content
        }, 'Content generation completed')

        childLogger.debug('Saving artifact to database (Spectrum Schema-Driven)')
        const dbSaveStart = Date.now()
        
        // Spectrum: Первый шаг - сохранение в основную таблицу Artifact
        const savedArtifacts = await dbSaveArtifact({
          id: artifactId,
          title,
          content,
          kind,
          userId: session.user.id,
          authorId: null, // Created by AI
          worldContext, // 🔧 BUG-086 FIX: Pass world context for proper world isolation
        })
        
        const savedArtifact = savedArtifacts[0]
        const dbSaveTime = Date.now() - dbSaveStart
        childLogger.info({ dbSaveTimeMs: dbSaveTime }, 'Artifact saved to main table successfully')
        
        // Spectrum: Второй шаг - сохранение в специализированную таблицу через диспетчер
        childLogger.debug('Saving content to specialized table via tools dispatcher')
        const toolsSaveStart = Date.now()
        
        await toolsSaveArtifact(savedArtifact, content)
        
        const toolsSaveTime = Date.now() - toolsSaveStart
        childLogger.info({ toolsSaveTimeMs: toolsSaveTime }, 'Content saved to specialized table successfully')

        // Background summary generation
        childLogger.debug('Starting background summary generation')
        generateAndSaveSummary(artifactId, content, kind)
          .catch(error => {
            childLogger.error({ 
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              artifactId,
              artifactKind: kind
            }, 'Background summary generation failed')
          })

        const totalTime = Date.now() - startTime
        const result = {
          toolName: AI_TOOL_NAMES.ARTIFACT_CREATE,
          artifactId,
          artifactKind: kind,
          artifactTitle: title,
          description: `A new ${kind} artifact titled "${title}" was created.`,
          version: 1,
          totalVersions: 1,
          updatedAt: new Date().toISOString(),
          summary: null, // Summary will be generated in the background
        }

        childLogger.info({ 
          totalExecutionTimeMs: totalTime,
          result: {
            artifactId: result.artifactId,
            kind: result.artifactKind,
            title: result.artifactTitle
          }
        }, 'Artifact creation completed successfully')
        
        return result
      } catch (error) {
        const totalTime = Date.now() - startTime
        childLogger.error({ 
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          executionTimeMs: totalTime
        }, 'Artifact creation failed')
        
        return { error: `Failed to create ${kind} artifact: ${error instanceof Error ? error.message : String(error)}` }
      }
    },
  })

// END OF: artifacts/tools/artifactCreate.ts
