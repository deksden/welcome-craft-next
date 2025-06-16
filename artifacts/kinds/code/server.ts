/**
 * @file artifacts/code/server.ts
 * @description Серверный обработчик для артефактов типа "код".
 * @version 2.0.0
 * @date 2025-06-10
 * @updated Refactored to export a standalone `codeTool` object, removing the factory function.
 */

/** HISTORY:
 * v2.0.0 (2025-06-10): Refactored to export a standalone tool object.
 * v1.4.1 (2025-06-10): Ensured 'object' promise from streamObject is awaited before property access (TS2339).
 */

import { z } from 'zod'
import { streamObject } from 'ai'
import { myProvider } from '@/lib/ai/providers'
import { codePrompt, updateDocumentPrompt } from '@/lib/ai/prompts'
import type { ArtifactTool } from '@/artifacts/kinds/artifact-tools'
import { getDisplayContent } from '@/lib/artifact-content-utils'
import { createLogger } from '@fab33/fab-logger'

const logger = createLogger('artifacts:kinds:code:server')

export const codeTool: ArtifactTool = {
  kind: 'code',
  create: async ({ id, title, prompt, session }) => {
    const childLogger = logger.child({ artifactId: id, userId: session?.user?.id })
    const startTime = Date.now()
    
    childLogger.info({ 
      title, 
      prompt: prompt?.substring(0, 100) + (prompt && prompt.length > 100 ? '...' : ''),
      promptLength: prompt?.length || 0
    }, 'Starting code artifact creation')

    try {
      const systemPrompt = codePrompt
      const userPrompt = prompt || title
      
      childLogger.debug({ 
        systemPromptLength: systemPrompt.length,
        model: 'artifact-model',
        schema: 'z.object({ code: z.string() })'
      }, 'Calling AI model for code generation')
      
      const aiCallStart = Date.now()
      const { object } = await streamObject({
        model: myProvider.languageModel('artifact-model'),
        system: systemPrompt,
        prompt: userPrompt,
        schema: z.object({
          code: z.string(),
        }),
      })
      const resolvedObject = await object
      const aiCallTime = Date.now() - aiCallStart
      
      const totalTime = Date.now() - startTime
      
      childLogger.info({ 
        aiCallTimeMs: aiCallTime,
        totalTimeMs: totalTime,
        generatedCodeLength: resolvedObject.code.length,
        generatedCodePreview: resolvedObject.code.substring(0, 150) + (resolvedObject.code.length > 150 ? '...' : '')
      }, 'Code artifact creation completed successfully')
      
      return resolvedObject.code
    } catch (error) {
      const totalTime = Date.now() - startTime
      childLogger.error({ 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        executionTimeMs: totalTime
      }, 'Code artifact creation failed')
      
      throw error
    }
  },
  update: async ({ document, description }) => {
    const childLogger = logger.child({ artifactId: document.id })
    const startTime = Date.now()
    
    const existingContent = getDisplayContent(document)
    childLogger.info({ 
      description: description.substring(0, 100) + (description.length > 100 ? '...' : ''),
      descriptionLength: description.length,
      existingCodeLength: existingContent.length
    }, 'Starting code artifact update')

    try {
      const systemPrompt = updateDocumentPrompt(existingContent, 'code')
      
      childLogger.debug({ 
        systemPromptLength: systemPrompt.length,
        model: 'artifact-model',
        schema: 'z.object({ code: z.string() })'
      }, 'Calling AI model for code update')
      
      const aiCallStart = Date.now()
      const { object } = await streamObject({
        model: myProvider.languageModel('artifact-model'),
        system: systemPrompt,
        prompt: description,
        schema: z.object({
          code: z.string(),
        }),
      })
      const resolvedObject = await object
      const aiCallTime = Date.now() - aiCallStart
      
      const totalTime = Date.now() - startTime
      
      childLogger.info({ 
        aiCallTimeMs: aiCallTime,
        totalTimeMs: totalTime,
        updatedCodeLength: resolvedObject.code.length,
        updatedCodePreview: resolvedObject.code.substring(0, 150) + (resolvedObject.code.length > 150 ? '...' : '')
      }, 'Code artifact update completed successfully')
      
      return resolvedObject.code
    } catch (error) {
      const totalTime = Date.now() - startTime
      childLogger.error({ 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        executionTimeMs: totalTime
      }, 'Code artifact update failed')
      
      throw error
    }
  },
}

// END OF: artifacts/code/server.ts
