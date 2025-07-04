/**
 * @file app/api/artifacts/import/route.ts
 * @description UC-10 SCHEMA-DRIVEN CMS - API endpoint для импорта файлов в артефакты.
 * @version 1.2.0
 * @date 2025-06-28
 * @updated Убрана GET функция - перенесена в отдельный supported-types/route.ts
 */

/** HISTORY:
 * v1.2.0 (2025-06-28): Убрана GET функция - перенесена в отдельный supported-types/route.ts для правильной Next.js маршрутизации
 * v1.1.0 (2025-06-28): Исправлена аутентификация - переход с auth() на getAuthSession() для поддержки route тестов
 * v1.0.0 (2025-06-20): UC-10 SCHEMA-DRIVEN CMS - Создан API endpoint с интеграцией file-import-system, artifact-tools и генерацией уникальных ID для артефактов.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/test-auth'
import { importFileToArtifact } from '@/lib/file-import-system'
import { saveArtifact } from '@/artifacts/kinds/artifact-tools'
import { db } from '@/lib/db'
import { artifact } from '@/lib/db/schema'
import { generateUUID } from '@/lib/utils'
import { createLogger } from '@fab33/fab-logger'
import type { ArtifactMetadata } from '@/lib/types'

const logger = createLogger('api:artifacts:import')

/**
 * @description POST /api/artifacts/import - Импортирует файл и создает артефакт
 * @feature Интеграция с file-import-system и artifact-tools для полного цикла импорта
 */
export async function POST(request: NextRequest) {
  const childLogger = logger.child({ endpoint: 'POST /api/artifacts/import' })
  const startTime = Date.now()
  
  try {
    // Проверяем аутентификацию (unified auth для NextAuth.js + test-session)
    const session = await getAuthSession()
    if (!session?.user?.id) {
      childLogger.warn('Unauthorized import attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Парсим запрос
    const body = await request.json()
    const { fileUrl, mimeType, customTitle } = body
    
    if (!fileUrl) {
      childLogger.warn({ body }, 'Missing fileUrl in request')
      return NextResponse.json(
        { error: 'fileUrl is required' },
        { status: 400 }
      )
    }
    
    childLogger.info({ 
      fileUrl, 
      mimeType, 
      customTitle,
      userId: session.user.id 
    }, 'Starting file import process')
    
    // Импортируем файл
    const importStart = Date.now()
    const importResult = await importFileToArtifact(fileUrl, mimeType)
    const importTime = Date.now() - importStart
    
    childLogger.info({ 
      artifactKind: importResult.artifactKind,
      contentLength: importResult.content.length,
      importTimeMs: importTime
    }, 'File import completed')
    
    // Создаем артефакт в БД
    const artifactId = generateUUID()
    const title = customTitle || importResult.suggestedTitle
    
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
    
    // Формируем ответ в формате ArtifactMetadata
    const totalTime = Date.now() - startTime
    const response: ArtifactMetadata = {
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
      response
    }, 'File import API completed successfully')
    
    return NextResponse.json(response, { status: 201 })
    
  } catch (error) {
    const totalTime = Date.now() - startTime
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      totalTimeMs: totalTime
    }, 'File import API failed')
    
    return NextResponse.json(
      { 
        error: 'Import failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


// END OF: app/api/artifacts/import/route.ts