/**
 * @file artifacts/tools/artifactEnhance.ts
 * @description Инструмент для "улучшения" артефакта по предопределенному рецепту.
 * @version 2.1.1
 * @date 2025-06-11
 * @updated Added a guard clause to safely handle session.user.id.
 */

/** HISTORY:
 * v2.1.1 (2025-06-11): Replaced non-null assertion with a guard clause for session.user.id.
 * v2.1.0 (2025-06-11): Добавлена проверка типа артефакта. Улучшение теперь работает только для текста.
 */

import { streamObject, tool } from 'ai'
import type { Session } from 'next-auth'
import { z } from 'zod'
import { getArtifactById, saveArtifact, saveSuggestions } from '@/lib/db/queries'
import { createLogger } from '@fab33/fab-logger'
import { myProvider } from '@/lib/ai/providers'
import { generateUUID } from '@/lib/utils'
import type { Suggestion } from '@/lib/db/schema'
import { AI_TOOL_NAMES } from '@/lib/ai/tools/constants'
import { getDisplayContent } from '@/lib/artifact-content-utils'

const logger = createLogger('artifacts:tools:artifactEnhance')

interface EnhanceArtifactProps {
  session: Session;
}

const recipes = {
  polish: 'Please add final polish and check for grammar, add section titles for better structure, and ensure everything reads smoothly.',
  suggest: 'You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.',
} as const

export const artifactEnhance = ({ session }: EnhanceArtifactProps) =>
  tool({
    description: 'Enhances a document by applying a specific recipe, like "polish" or "suggest". This creates a new version of the artifact with suggestions.',
    parameters: z.object({
      id: z.string().describe('The UUID of the artifact to enhance.'),
      recipe: z.enum(['polish', 'suggest']).describe('The enhancement recipe to apply.'),
    }),
    execute: async ({ id, recipe }) => {
      if (!session?.user?.id) {
        logger.error('User session or user ID is missing. Cannot proceed with artifact enhancement.')
        return { error: 'User is not authenticated. This action cannot be performed.' }
      }

      const childLogger = logger.child({ artifactId: id, userId: session.user.id, recipe })
      childLogger.trace('Entering artifactEnhance tool')

      const artifactResult = await getArtifactById({ id })
      const content = artifactResult ? getDisplayContent(artifactResult.doc) : ''
      if (!artifactResult || !content) {
        childLogger.warn('Artifact not found or content is empty')
        return { error: 'Artifact not found or has no content to enhance.' }
      }

      const { doc: artifact, totalVersions } = artifactResult

      if (artifact.kind !== 'text') {
        const errorMessage = `The "${recipe}" feature is currently only available for text artifacts.`
        childLogger.warn(`Enhance recipe '${recipe}' is not applicable for artifact kind '${artifact.kind}'.`)
        return { error: errorMessage }
      }

      const newVersionDate = new Date()
      // 1. Create a new artifact version row
      await saveArtifact({
        ...artifact,
        createdAt: newVersionDate,
        content: getDisplayContent(artifact) || ''
      })

      // 2. Generate suggestions
      const prompt = recipes[recipe]
      const suggestions: Array<Omit<Suggestion, 'userId' | 'createdAt' | 'documentCreatedAt'>> = []

      const { object: objectPromise } = await streamObject({
        model: myProvider.languageModel('artifact-model'),
        system: prompt,
        prompt: getDisplayContent(artifact) || '',
        schema: z.object({
          suggestions: z.array(z.object({
            originalSentence: z.string(),
            suggestedSentence: z.string(),
            description: z.string(),
          }))
        }),
      })
      const resolvedObject = await objectPromise

      if (resolvedObject.suggestions) {
        for (const item of resolvedObject.suggestions) {
          if (item?.originalSentence && item?.suggestedSentence && item?.description) {
            suggestions.push({
              originalText: item.originalSentence,
              suggestedText: item.suggestedSentence,
              description: item.description,
              id: generateUUID(),
              documentId: id,
              isResolved: false,
              isDismissed: false,
            })
          }
        }
      }

      // 3. Save suggestions pointing to the new version
      if (suggestions.length > 0) {
        childLogger.info(`Saving ${suggestions.length} suggestions to DB for new version`)
        await saveSuggestions({
          suggestions: suggestions.map((s) => ({
            ...s,
            userId: session.user.id,
            createdAt: new Date(),
            documentCreatedAt: newVersionDate,
          })),
        })
      }

      const newVersionNumber = totalVersions + 1
      const result = {
        toolName: AI_TOOL_NAMES.ARTIFACT_ENHANCE,
        artifactId: id,
        artifactKind: artifact.kind,
        artifactTitle: artifact.title,
        description: `Applied recipe "${recipe}" and created suggestions.`,
        version: newVersionNumber,
        totalVersions: newVersionNumber,
        updatedAt: newVersionDate.toISOString(),
        summary: artifact.summary,
      }

      childLogger.trace({ result }, 'Exiting artifactEnhance tool')
      return result
    },
  })

// END OF: artifacts/tools/artifactEnhance.ts
