/**
 * @file artifacts/image/server.ts
 * @description Серверный обработчик для артефактов-изображений.
 * @version 4.0.0
 * @date 2025-06-20
 * @updated Spectrum SCHEMA-DRIVEN CMS - Добавлены схема-ориентированные функции сохранения/загрузки для A_Image таблицы.
 */

/** HISTORY:
 * v4.0.0 (2025-06-20): Spectrum SCHEMA-DRIVEN CMS - Добавлены saveImageArtifact, loadImageArtifact, deleteImageArtifact функции для работы с новой A_Image таблицей.
 * v3.0.0 (2025-06-10): Refactored to export a standalone tool object.
 * v2.4.0 (2025-06-10): Added `providerOptions` to `generateText` to request the correct image modality.
 * v2.3.0 (2025-06-09): Рефакторинг. Обработчик теперь возвращает URL изображения.
 */

import { myEnhancedProvider } from '@/lib/ai/providers.enhanced'
import { type CoreMessage, type GeneratedFile, generateText } from 'ai'
import { put } from '@vercel/blob'
import { generateUUID } from '@/lib/utils'
import { ChatSDKError } from '@/lib/errors'
import type { ArtifactTool } from '@/artifacts/kinds/artifact-tools'
import { getDisplayContent } from '@/lib/artifact-content-utils'
import { createLogger } from '@fab33/fab-logger'
import { db } from '@/lib/db'
import { artifactImage } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import type { Artifact, ArtifactImage } from '@/lib/db/schema'

const logger = createLogger('artifacts:kinds:image:server')

const imageLegacyTool: ArtifactTool = {
  kind: 'image',
  create: async ({ id, title, prompt, session }) => {
    const childLogger = logger.child({ artifactId: id, userId: session?.user?.id })
    const startTime = Date.now()
    
    childLogger.info({ 
      title, 
      prompt: prompt?.substring(0, 100) + (prompt && prompt.length > 100 ? '...' : ''),
      promptLength: prompt?.length || 0
    }, 'Starting image artifact creation')

    try {
      const userPrompt = prompt || title
      
      childLogger.debug({ 
        model: 'omni-image-model',
        responseModalities: ['IMAGE', 'TEXT']
      }, 'Calling AI model for image generation')
      
      const aiCallStart = Date.now()
      const { files } = await generateText({
        model: myEnhancedProvider.languageModel('omni-image-model'),
        prompt: userPrompt,
        providerOptions: {
          google: { responseModalities: ['IMAGE', 'TEXT'] },
        },
      })
      const aiCallTime = Date.now() - aiCallStart

      childLogger.debug({ 
        aiCallTimeMs: aiCallTime,
        filesCount: files.length,
        fileTypes: files.map(f => f.mimeType)
      }, 'AI model call completed, processing files')

      const imagePart = files.find(
        (p: GeneratedFile): p is GeneratedFile => p.mimeType?.startsWith('image/'),
      )

      if (!imagePart || !imagePart.uint8Array) {
        const error = new ChatSDKError('bad_request:api', 'Image generation failed: no image data received from the model.')
        childLogger.error({ 
          filesReceived: files.length,
          fileTypes: files.map(f => f.mimeType)
        }, 'Image generation failed: no image data')
        throw error
      }

      const imageBuffer = Buffer.from(imagePart.uint8Array)
      const filename = `${generateUUID()}.png`

      childLogger.debug({ 
        imageSize: imageBuffer.length,
        filename,
        mimeType: imagePart.mimeType
      }, 'Uploading generated image to blob storage')

      const uploadStart = Date.now()
      const { url } = await put(filename, imageBuffer, { access: 'public' })
      const uploadTime = Date.now() - uploadStart
      
      const totalTime = Date.now() - startTime
      
      childLogger.info({ 
        aiCallTimeMs: aiCallTime,
        uploadTimeMs: uploadTime,
        totalTimeMs: totalTime,
        imageUrl: url,
        imageSizeBytes: imageBuffer.length
      }, 'Image artifact creation completed successfully')
      
      return url
    } catch (error) {
      const totalTime = Date.now() - startTime
      childLogger.error({ 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        executionTimeMs: totalTime
      }, 'Image artifact creation failed')
      
      throw error
    }
  },
  update: async ({ document, description }) => {
    const childLogger = logger.child({ artifactId: document.id })
    const startTime = Date.now()
    
    const imageUrl = getDisplayContent(document)
    childLogger.info({ 
      description: description.substring(0, 100) + (description.length > 100 ? '...' : ''),
      descriptionLength: description.length,
      originalImageUrl: imageUrl
    }, 'Starting image artifact update')

    try {
      if (!imageUrl) {
        const error = new ChatSDKError('bad_request:api', 'Cannot update image: source document content (URL) is empty.')
        childLogger.error('No source image URL found')
        throw error
      }

      childLogger.debug('Fetching original image from URL')
      const fetchStart = Date.now()
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        const error = new ChatSDKError('bad_request:api', `Failed to fetch original image from URL: ${imageUrl}`)
        childLogger.error({ 
          status: imageResponse.status,
          statusText: imageResponse.statusText 
        }, 'Failed to fetch original image')
        throw error
      }
      
      const imageArrayBuffer = await imageResponse.arrayBuffer()
      const imageBufferOriginal = Buffer.from(imageArrayBuffer)
      const fetchTime = Date.now() - fetchStart
      
      childLogger.debug({ 
        fetchTimeMs: fetchTime,
        originalImageSize: imageBufferOriginal.length
      }, 'Original image fetched successfully')

      const messages: CoreMessage[] = [{
        role: 'user',
        content: [
          { type: 'text', text: description },
          { type: 'image', image: imageBufferOriginal },
        ],
      }]

      childLogger.debug({ 
        model: 'omni-image-model',
        responseModalities: ['IMAGE', 'TEXT'],
        messageContentTypes: ['text', 'image']
      }, 'Calling AI model for image editing')
      
      const aiCallStart = Date.now()
      const { files } = await generateText({
        model: myEnhancedProvider.languageModel('omni-image-model'),
        messages,
        providerOptions: {
          google: { responseModalities: ['IMAGE', 'TEXT'] },
        },
      })
      const aiCallTime = Date.now() - aiCallStart

      childLogger.debug({ 
        aiCallTimeMs: aiCallTime,
        filesCount: files.length,
        fileTypes: files.map(f => f.mimeType)
      }, 'AI model call completed, processing edited image')

      const imagePart = files.find(
        (p: GeneratedFile): p is GeneratedFile => p.mimeType?.startsWith('image/'),
      )
      if (!imagePart || !imagePart.uint8Array) {
        const error = new ChatSDKError('bad_request:api', 'Image editing failed: no image data received from the model.')
        childLogger.error({ 
          filesReceived: files.length,
          fileTypes: files.map(f => f.mimeType)
        }, 'Image editing failed: no image data')
        throw error
      }

      const imageBufferNew = Buffer.from(imagePart.uint8Array)
      const filename = `${generateUUID()}.png`

      childLogger.debug({ 
        newImageSize: imageBufferNew.length,
        filename,
        mimeType: imagePart.mimeType
      }, 'Uploading edited image to blob storage')

      const uploadStart = Date.now()
      const { url } = await put(filename, imageBufferNew, { access: 'public' })
      const uploadTime = Date.now() - uploadStart
      
      const totalTime = Date.now() - startTime
      
      childLogger.info({ 
        fetchTimeMs: fetchTime,
        aiCallTimeMs: aiCallTime,
        uploadTimeMs: uploadTime,
        totalTimeMs: totalTime,
        newImageUrl: url,
        newImageSizeBytes: imageBufferNew.length
      }, 'Image artifact update completed successfully')
      
      return url
    } catch (error) {
      const totalTime = Date.now() - startTime
      childLogger.error({ 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        executionTimeMs: totalTime
      }, 'Image artifact update failed')
      
      throw error
    }
  },
}

/**
 * @description Image artifact tool с поддержкой Spectrum schema-driven операций  
 * @feature Поддержка как legacy AI операций, так и новых save/load/delete
 */
export const imageTool = {
  kind: 'image' as const,
  // Legacy AI operations (для совместимости)
  create: imageLegacyTool.create,
  update: imageLegacyTool.update,
  // Spectrum Schema-Driven операции
  save: async (artifact: Artifact, content: string, metadata?: Record<string, any>) => {
    return saveImageArtifact(artifact, content, metadata)
  },
  load: loadImageArtifact,
  delete: deleteImageArtifact,
}

// =============================================================================
// Spectrum SCHEMA-DRIVEN CMS: Новые функции для работы с A_Image таблицей
// =============================================================================

/**
 * @description Сохраняет артефакт-изображение в специализированную таблицу A_Image
 * @feature Извлечение метаданных изображения из URL и metadata
 * @param artifact - Базовая информация об артефакте
 * @param content - URL изображения
 * @param metadata - Дополнительные метаданные (altText, width, height, fileSize, mimeType)
 * @returns Promise с результатом операции
 * @throws Ошибка если сохранение не удалось
 */
export async function saveImageArtifact(
  artifact: Artifact, 
  content: string, 
  metadata?: Record<string, any>
): Promise<void> {
  const childLogger = logger.child({ artifactId: artifact.id, kind: artifact.kind })
  
  try {
    childLogger.info({ 
      url: content,
      metadata,
      altText: metadata?.altText
    }, 'Saving image artifact to A_Image table')
    
    await db.insert(artifactImage).values({
      artifactId: artifact.id,
      createdAt: artifact.createdAt,
      url: content,
      altText: metadata?.altText || artifact.title,
      width: metadata?.width ? Number(metadata.width) : undefined,
      height: metadata?.height ? Number(metadata.height) : undefined,
      fileSize: metadata?.fileSize ? Number(metadata.fileSize) : undefined,
      mimeType: metadata?.mimeType || 'image/png'
    }).onConflictDoUpdate({
      target: [artifactImage.artifactId, artifactImage.createdAt],
      set: {
        url: content,
        altText: metadata?.altText || artifact.title,
        width: metadata?.width ? Number(metadata.width) : undefined,
        height: metadata?.height ? Number(metadata.height) : undefined,
        fileSize: metadata?.fileSize ? Number(metadata.fileSize) : undefined,
        mimeType: metadata?.mimeType || 'image/png'
      }
    })
    
    childLogger.info('Image artifact saved successfully to A_Image table')
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to save image artifact to A_Image table')
    
    throw error
  }
}

/**
 * @description Загружает данные артефакта-изображения из таблицы A_Image
 * @param artifactId - ID артефакта для загрузки
 * @param createdAt - Timestamp версии артефакта (composite key)
 * @returns Promise с данными артефакта-изображения или null
 */
export async function loadImageArtifact(artifactId: string, createdAt: Date): Promise<ArtifactImage | null> {
  const childLogger = logger.child({ artifactId, createdAt })
  
  try {
    childLogger.debug('Loading image artifact from A_Image table')
    
    const result = await db.select().from(artifactImage)
      .where(and(
        eq(artifactImage.artifactId, artifactId),
        eq(artifactImage.createdAt, createdAt)
      ))
      .limit(1)
    
    const imageData = result[0] || null
    
    if (imageData) {
      childLogger.info({ 
        url: imageData.url,
        width: imageData.width,
        height: imageData.height,
        fileSize: imageData.fileSize,
        mimeType: imageData.mimeType
      }, 'Image artifact loaded successfully from A_Image table')
    } else {
      childLogger.warn('Image artifact not found in A_Image table')
    }
    
    return imageData
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to load image artifact from A_Image table')
    
    throw error
  }
}

/**
 * @description Удаляет данные артефакта-изображения из таблицы A_Image
 * @param artifactId - ID артефакта для удаления
 * @param createdAt - Timestamp версии артефакта (composite key)
 * @returns Promise с результатом операции
 */
export async function deleteImageArtifact(artifactId: string, createdAt: Date): Promise<void> {
  const childLogger = logger.child({ artifactId, createdAt })
  
  try {
    childLogger.info('Deleting image artifact from A_Image table')
    
    await db.delete(artifactImage)
      .where(and(
        eq(artifactImage.artifactId, artifactId),
        eq(artifactImage.createdAt, createdAt)
      ))
    
    childLogger.info('Image artifact deleted successfully from A_Image table')
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to delete image artifact from A_Image table')
    
    throw error
  }
}

// END OF: artifacts/image/server.ts
