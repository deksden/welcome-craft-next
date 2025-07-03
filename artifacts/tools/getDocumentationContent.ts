/**
 * @file artifacts/tools/getDocumentationContent.ts
 * @description AI инструмент для получения полного содержимого разделов документации
 * @version 1.0.0
 * @date 2025-07-02
 * @updated TASK-AI-TOOLS-IMPLEMENTATION - RAG система для чтения содержимого документации
 */

/** HISTORY:
 * v1.0.0 (2025-07-02): TASK-AI-TOOLS-IMPLEMENTATION - Создан инструмент для чтения полного содержимого документации с поддержкой multiple files
 */

import 'server-only'
import { tool } from 'ai'
import { z } from 'zod'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { db } from '@/lib/db'
import { systemDocs } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'

/**
 * @description Читает содержимое файла документации с диска
 * @param filePath - Относительный путь к файлу
 * @returns Promise с содержимым файла или null при ошибке
 */
async function readDocumentationFile(filePath: string): Promise<string | null> {
  try {
    // Безопасная проверка пути (должен начинаться с .memory-bank или docs/)
    if (!filePath.startsWith('.memory-bank/') && !filePath.startsWith('docs/')) {
      console.warn(`DOC_CONTENT: Unsafe file path rejected: ${filePath}`)
      return null
    }
    
    const fullPath = path.join(process.cwd(), filePath)
    const content = await fs.readFile(fullPath, 'utf8')
    
    return content
  } catch (error) {
    console.error(`DOC_CONTENT: Failed to read file ${filePath}:`, error)
    return null
  }
}

/**
 * @description Проверяет существование файлов в базе данных SystemDocs
 * @param sectionIds - Массив ID разделов для проверки
 * @returns Promise с массивом существующих разделов
 */
async function validateSectionIds(sectionIds: string[]): Promise<string[]> {
  try {
    const existingSections = await db
      .select({ id: systemDocs.id })
      .from(systemDocs)
      .where(inArray(systemDocs.id, sectionIds))
    
    return existingSections.map(section => section.id)
  } catch (error) {
    console.error('DOC_CONTENT: Failed to validate section IDs', error)
    return []
  }
}

/**
 * @description AI инструмент для получения полного содержимого документации
 * @feature Читает и возвращает полное содержимое указанных файлов документации
 * @feature Поддержка множественного выбора файлов
 * @feature Безопасная проверка путей к файлам
 * @feature Валидация через SystemDocs таблицу
 */
export const getDocumentationContentTool = tool({
  description: 'Получает полное содержимое указанных разделов документации проекта WelcomeCraft. Используй ID разделов, полученные от listDocumentationSections.',
  parameters: z.object({
    sectionIds: z.array(z.string()).describe('Массив ID разделов документации для чтения (например, [".memory-bank/README.md", ".memory-bank/tech-context.md"])'),
    maxSections: z.number().optional().default(5).describe('Максимальное количество разделов для чтения за раз (максимум 10)'),
  }),
  execute: async ({ sectionIds, maxSections = 5 }) => {
    try {
      // Ограничиваем количество разделов
      const safeSectionIds = sectionIds.slice(0, Math.min(maxSections, 10))
      
      if (safeSectionIds.length === 0) {
        return {
          sections: [],
          totalRequested: 0,
          totalRead: 0,
          error: 'Не указаны ID разделов для чтения'
        }
      }
      
      // Валидируем что разделы существуют в базе данных
      const validSectionIds = await validateSectionIds(safeSectionIds)
      
      if (validSectionIds.length === 0) {
        return {
          sections: [],
          totalRequested: safeSectionIds.length,
          totalRead: 0,
          error: 'Указанные разделы не найдены в базе документации'
        }
      }
      
      // Читаем содержимое каждого файла
      const sectionContents = []
      
      for (const sectionId of validSectionIds) {
        console.log(`DOC_CONTENT: Reading ${sectionId}`)
        
        const content = await readDocumentationFile(sectionId)
        
        if (content) {
          // Получаем метаданные из базы данных
          const sectionInfo = await db
            .select({
              title: systemDocs.title,
              summary: systemDocs.summary,
              updatedAt: systemDocs.updatedAt,
              fileSize: systemDocs.fileSize,
            })
            .from(systemDocs)
            .where(eq(systemDocs.id, sectionId))
            .limit(1)
          
          const metadata = sectionInfo[0] || {
            title: path.basename(sectionId, '.md'),
            summary: 'Документация проекта',
            updatedAt: null,
            fileSize: null,
          }
          
          sectionContents.push({
            id: sectionId,
            title: metadata.title,
            summary: metadata.summary,
            content: content,
            lastUpdated: metadata.updatedAt,
            fileSizeKB: metadata.fileSize ? Math.round(metadata.fileSize / 1024) : null,
            contentLength: content.length,
          })
        } else {
          console.warn(`DOC_CONTENT: Failed to read content for ${sectionId}`)
        }
      }
      
      return {
        sections: sectionContents,
        totalRequested: safeSectionIds.length,
        totalRead: sectionContents.length,
        validSections: validSectionIds.length,
        invalidSections: safeSectionIds.filter(id => !validSectionIds.includes(id))
      }
    } catch (error) {
      console.error('DOC_CONTENT: Tool execution failed', error)
      return {
        sections: [],
        totalRequested: sectionIds.length,
        totalRead: 0,
        error: 'Чтение документации временно недоступно'
      }
    }
  },
})

// END OF: artifacts/tools/getDocumentationContent.ts