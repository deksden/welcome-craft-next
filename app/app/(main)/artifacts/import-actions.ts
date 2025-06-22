/**
 * @file app/app/(main)/artifacts/import-actions.ts
 * @description UC-10 SCHEMA-DRIVEN CMS - Server Actions для импорта файлов в артефакты.
 * @version 1.0.0
 * @date 2025-06-20
 * @updated UC-10 SCHEMA-DRIVEN CMS - Созданы Server Actions для интеграции file import system с UI компонентами.
 */

/** HISTORY:
 * v1.0.0 (2025-06-20): UC-10 SCHEMA-DRIVEN CMS - Созданы importArtifactFromFile и getSupportedFileTypes Server Actions для удобной интеграции с React компонентами.
 */

'use server'

import { auth } from '@/app/app/(auth)/auth'
import { importFileToArtifact } from '@/lib/file-import-system'
import { saveArtifact } from '@/artifacts/kinds/artifact-tools'
import { db } from '@/lib/db'
import { artifact } from '@/lib/db/schema'
import { generateUUID } from '@/lib/utils'
import { createLogger } from '@fab33/fab-logger'
import type { ArtifactMetadata } from '@/lib/types'
import { redirect } from 'next/navigation'

const logger = createLogger('server-actions:artifacts:import')

/**
 * @description Server Action для импорта файла в артефакт
 * @feature Полная интеграция с file-import-system и artifact-tools
 * @param fileUrl - URL файла в Vercel Blob
 * @param options - Дополнительные опции импорта
 * @returns Promise с метаданными созданного артефакта
 * @throws Ошибка если импорт не удался
 */
export async function importArtifactFromFile(
  fileUrl: string,
  options?: {
    customTitle?: string
    mimeType?: string
    redirectToArtifact?: boolean
  }
): Promise<ArtifactMetadata> {
  const childLogger = logger.child({ fileUrl, options })
  const startTime = Date.now()
  
  try {
    // Проверяем аутентификацию
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required for file import')
    }
    
    childLogger.info({ 
      userId: session.user.id,
      fileUrl,
      options
    }, 'Starting file import via Server Action')
    
    // Импортируем файл
    const importStart = Date.now()
    const importResult = await importFileToArtifact(fileUrl, options?.mimeType)
    const importTime = Date.now() - importStart
    
    childLogger.info({ 
      artifactKind: importResult.artifactKind,
      contentLength: importResult.content.length,
      suggestedTitle: importResult.suggestedTitle,
      importTimeMs: importTime
    }, 'File import completed')
    
    // Создаем артефакт в БД
    const artifactId = generateUUID()
    const title = options?.customTitle || importResult.suggestedTitle
    
    const newArtifact = {
      id: artifactId,
      createdAt: new Date(),
      title,
      summary: '', // Будет заполнено асинхронно
      kind: importResult.artifactKind,
      userId: session.user.id,
      authorId: session.user.id,
      deletedAt: null,
      publication_state: [],
      world_id: null
    }
    
    const dbStart = Date.now()
    await db.insert(artifact).values(newArtifact)
    const dbTime = Date.now() - dbStart
    
    childLogger.info({ 
      artifactId,
      title,
      kind: importResult.artifactKind,
      dbTimeMs: dbTime
    }, 'Artifact created in database')
    
    // Сохраняем контент через artifact-tools
    const saveStart = Date.now()
    await saveArtifact(newArtifact, importResult.content, importResult.metadata)
    const saveTime = Date.now() - saveStart
    
    childLogger.info({ 
      saveTimeMs: saveTime
    }, 'Artifact content saved via tools registry')
    
    // Формируем результат
    const totalTime = Date.now() - startTime
    const result: ArtifactMetadata = {
      artifactId,
      artifactKind: importResult.artifactKind,
      artifactTitle: title,
      description: `File "${importResult.importInfo.originalFilename}" imported successfully as ${importResult.artifactKind} artifact`,
      version: 1,
      totalVersions: 1,
      updatedAt: newArtifact.createdAt.toISOString(),
      summary: null // Будет заполнено асинхронно
    }
    
    childLogger.info({ 
      totalTimeMs: totalTime,
      importTimeMs: importTime,
      dbTimeMs: dbTime,
      saveTimeMs: saveTime,
      artifactId
    }, 'File import Server Action completed successfully')
    
    // Опциональное перенаправление на страницу артефакта
    if (options?.redirectToArtifact) {
      redirect(`/content?id=${artifactId}`)
    }
    
    return result
    
  } catch (error) {
    const totalTime = Date.now() - startTime
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      totalTimeMs: totalTime
    }, 'File import Server Action failed')
    
    throw error
  }
}

/**
 * @description Server Action для получения списка поддерживаемых типов файлов
 * @returns Promise со списком поддерживаемых типов файлов
 */
export async function getSupportedFileTypes() {
  const supportedTypes = {
    documents: [
      { 
        extension: 'docx', 
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        artifactKind: 'text',
        description: 'Microsoft Word Document'
      },
      { 
        extension: 'doc', 
        mimeType: 'application/msword', 
        artifactKind: 'text',
        description: 'Microsoft Word Document (legacy)'
      }
    ],
    spreadsheets: [
      { 
        extension: 'xlsx', 
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
        artifactKind: 'sheet',
        description: 'Microsoft Excel Spreadsheet'
      },
      { 
        extension: 'xls', 
        mimeType: 'application/vnd.ms-excel', 
        artifactKind: 'sheet',
        description: 'Microsoft Excel Spreadsheet (legacy)'
      },
      { 
        extension: 'csv', 
        mimeType: 'text/csv', 
        artifactKind: 'sheet',
        description: 'Comma Separated Values'
      }
    ],
    text: [
      { 
        extension: 'txt', 
        mimeType: 'text/plain', 
        artifactKind: 'text',
        description: 'Plain Text File'
      },
      { 
        extension: 'md', 
        mimeType: 'text/markdown', 
        artifactKind: 'text',
        description: 'Markdown Document'
      }
    ]
  }
  
  return supportedTypes
}

/**
 * @description Helper функция для проверки поддержки файла
 * @param filename - Имя файла
 * @param mimeType - MIME type файла (опционально)
 * @returns true если файл поддерживается
 */
export async function isFileSupported(filename: string, mimeType?: string): Promise<boolean> {
  const supportedTypes = await getSupportedFileTypes()
  const allTypes = [
    ...supportedTypes.documents,
    ...supportedTypes.spreadsheets,
    ...supportedTypes.text
  ]
  
  // Проверяем по MIME type
  if (mimeType && allTypes.some(type => type.mimeType === mimeType)) {
    return true
  }
  
  // Проверяем по расширению
  const extension = filename.toLowerCase().split('.').pop()
  return allTypes.some(type => type.extension === extension)
}

// END OF: app/app/(main)/artifacts/import-actions.ts