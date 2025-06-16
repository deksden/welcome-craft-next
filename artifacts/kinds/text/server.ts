/**
 * @file artifacts/text/server.ts
 * @description Серверный обработчик для текстовых артефактов.
 * @version 2.0.0
 * @date 2025-06-10
 * @updated Refactored to export a standalone `textTool` object, removing the factory function.
 */

/** HISTORY:
 * v2.0.0 (2025-06-10): Refactored to export a standalone tool object.
 * v1.3.0 (2025-06-09): Рефакторинг. Обработчик теперь возвращает сгенерированный текст.
 */

import { generateText } from 'ai'
import { myProvider } from '@/lib/ai/providers'
import { updateDocumentPrompt } from '@/lib/ai/prompts'
import type { ArtifactTool } from '@/artifacts/kinds/artifact-tools'
import { getDisplayContent } from '@/lib/artifact-content-utils'
import { createLogger } from '@fab33/fab-logger'

const logger = createLogger('artifacts:kinds:text:server')

export const textTool: ArtifactTool = {
  kind: 'text',
  create: async ({ id, title, prompt, session }) => {
    const childLogger = logger.child({ artifactId: id, userId: session?.user?.id })
    const startTime = Date.now()
    
    childLogger.info({ 
      title, 
      prompt: prompt?.substring(0, 100) + (prompt && prompt.length > 100 ? '...' : ''),
      promptLength: prompt?.length || 0
    }, 'Starting text artifact creation')

    try {
      const systemPrompt = 'Write about the given topic. Markdown is supported. Use headings wherever appropriate.'
      const userPrompt = prompt || title
      
      childLogger.debug({ 
        systemPrompt,
        model: 'artifact-model'
      }, 'Calling AI model for text generation')
      
      const aiCallStart = Date.now()
      
      // Создаем Promise для таймаута (80 секунд)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI model call timed out after 80 seconds')), 80000)
      )

      // Запускаем гонку между вызовом API и таймаутом
      const generateTextPromise = generateText({
        model: myProvider.languageModel('artifact-model'),
        system: systemPrompt,
        prompt: userPrompt,
      })
      
      const { text } = await Promise.race([generateTextPromise, timeoutPromise]) as { text: string }
      const aiCallTime = Date.now() - aiCallStart
      
      childLogger.info({ aiCallTimeMs: aiCallTime }, 'AI model call completed successfully')
      
      const generatedText = text
      const totalTime = Date.now() - startTime
      
      childLogger.info({ 
        aiCallTimeMs: aiCallTime,
        totalTimeMs: totalTime,
        generatedTextLength: generatedText.length,
        generatedTextPreview: generatedText.substring(0, 150) + (generatedText.length > 150 ? '...' : '')
      }, 'Text artifact creation completed successfully')
      
      return generatedText
    } catch (error) {
      const totalTime = Date.now() - startTime
      
      const err = error as Error
      if (err.message?.includes('timed out')) {
        childLogger.error({ 
          error: 'AI model call timed out after 80 seconds',
          executionTimeMs: totalTime,
          recommendation: 'Check network connectivity or consider using mock data'
        }, 'Text artifact creation failed due to timeout')
      } else {
        childLogger.error({ 
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          executionTimeMs: totalTime
        }, 'Text artifact creation failed')
      }
      
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
      existingContentLength: existingContent.length
    }, 'Starting text artifact update')

    try {
      const systemPrompt = updateDocumentPrompt(existingContent, 'text')
      
      childLogger.debug({ 
        systemPromptLength: systemPrompt.length,
        model: 'artifact-model'
      }, 'Calling AI model for text update')
      
      const aiCallStart = Date.now()
      const { text } = await generateText({
        model: myProvider.languageModel('artifact-model'),
        system: systemPrompt,
        prompt: description,
        experimental_providerMetadata: {
          openai: {
            prediction: {
              type: 'content',
              content: existingContent,
            },
          },
        },
      })
      const aiCallTime = Date.now() - aiCallStart
      
      const updatedText = text
      const totalTime = Date.now() - startTime
      
      childLogger.info({ 
        aiCallTimeMs: aiCallTime,
        totalTimeMs: totalTime,
        updatedTextLength: updatedText.length,
        updatedTextPreview: updatedText.substring(0, 150) + (updatedText.length > 150 ? '...' : '')
      }, 'Text artifact update completed successfully')
      
      return updatedText
    } catch (error) {
      const totalTime = Date.now() - startTime
      childLogger.error({ 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        executionTimeMs: totalTime
      }, 'Text artifact update failed')
      
      throw error
    }
  },
}

// END OF: artifacts/text/server.ts
