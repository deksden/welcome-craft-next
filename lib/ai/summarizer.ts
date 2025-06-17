/**
 * @file lib/ai/summarizer.ts
 * @description Серверная логика для асинхронной генерации краткого содержания (саммари) для артефактов.
 * @version 1.4.0
 * @date 2025-06-10
 * @updated Импорт ArtifactKind теперь из общего файла lib/types.
 */

/** HISTORY:
 * v1.4.0 (2025-06-10): Импорт ArtifactKind теперь из lib/types.
 * v1.3.0 (2025-06-09): Переход на работу с `Artifact` вместо `Document`.
 * v1.2.0 (2025-06-07): Убран выбор специализированной image-generation модели.
 */

import 'server-only'
import { generateText } from 'ai'
import { myProvider } from './providers'
import { db } from '@/lib/db'
import { artifact } from '../db/schema'
import { desc, eq } from 'drizzle-orm'
import type { ArtifactKind } from '@/lib/types' // <-- ИЗМЕНЕН ИМПОРТ

// Извлекает структурную информацию из site content (без конкретных artifactId)
const extractSiteStructure = (content: string): string => {
  try {
    const siteDefinition = JSON.parse(content)
    const structure = {
      theme: siteDefinition.theme,
      blocks: siteDefinition.blocks?.map((block: any) => ({
        type: block.type,
        slots: Object.keys(block.slots || {})
      })) || []
    }
    return JSON.stringify(structure, null, 2)
  } catch {
    return content // Fallback если JSON невалидный
  }
}

const getSummaryPrompt = (kind: ArtifactKind, content: string): string => {
  switch (kind) {
    case 'image':
      return `Опиши это изображение кратко, в пределах 15 слов. URL изображения: ${content}`
    case 'code':
      return `Сделай очень краткое саммари для этого фрагмента кода (не более 15 слов), объясняя его назначение: \n\n${content}`
    case 'sheet':
      return `Сделай очень краткое саммари для этой таблицы (не более 15 слов), описывая ее содержимое: \n\n${content}`
    case 'site': {
      const structure = extractSiteStructure(content)
      return `Опиши структуру этого сайта кратко (не более 15 слов) - какие блоки включены: \n\n${structure}`
    }
    case 'text':
    default:
      return `Сделай очень краткое саммари для этого текста (не более 20 слов): \n\n${content}`
  }
}

export async function generateAndSaveSummary (
  artifactId: string,
  content: string,
  kind: ArtifactKind,
): Promise<void> {
  try {
    const prompt = getSummaryPrompt(kind, content)
    const model = myProvider.languageModel('title-model')

    const { text: summary } = await generateText({
      model: model,
      prompt: prompt,
    })

    if (summary) {
      const [latestVersion] = await db
        .select()
        .from(artifact)
        .where(eq(artifact.id, artifactId))
        .orderBy(desc(artifact.createdAt))
        .limit(1)

      if (latestVersion) {
        await db
          .update(artifact)
          .set({ summary })
          .where(eq(artifact.createdAt, latestVersion.createdAt))
      }
    }
  } catch (error) {
    // Проверяем на ошибки квоты/ограничений AI модели
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('quota') || errorMessage.includes('limit') || errorMessage.includes('rate')) {
      console.warn(`SYS_SUMMARIZER: AI quota/limit reached for artifact ${artifactId}, skipping summary generation`)
      return // Тихо пропускаем, не спамим
    }
    
    console.error(`SYS_SUMMARIZER: Failed to generate summary for artifact ${artifactId}`, error)
  }
}

// END OF: lib/ai/summarizer.ts
