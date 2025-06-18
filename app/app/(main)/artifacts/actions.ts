/**
 * @file app/(main)/artifacts/actions.ts
 * @description Server Actions для управления артефактами.
 * @version 2.2.0
 * @date 2025-06-17
 * @updated Добавлены Server Actions для публикации сайтов (publishSite, unpublishSite).
 */

/** HISTORY:
 * v2.2.0 (2025-06-17): Добавлены publishSite и unpublishSite для системы публикации с TTL.
 * v2.1.0 (2025-06-12): Added clipboard actions using Redis.
 * v2.0.0 (2025-06-09): Переход на Artifact и мягкое удаление.
 * v1.0.1 (2025-06-06): Исправлен доступ к свойству `userId`.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/app/app/(auth)/auth'
import { deleteArtifactSoftById, getArtifactById, updateArtifactById } from '@/lib/db/queries'
import { ChatSDKError } from '@/lib/errors'
import { withRedis } from '@/lib/redis'
import type { ArtifactKind, PublicationInfo } from '@/lib/types'

interface ActionResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  message?: string;
}

export async function deleteArtifact (artifactId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Пользователь не авторизован.', errorCode: 'unauthorized:artifact' }
  }

  try {
    const artifactResult = await getArtifactById({ id: artifactId })
    if (!artifactResult || !artifactResult.doc || artifactResult.doc.userId !== session.user.id) {
      return { success: false, error: 'Артефакт не найден или доступ запрещен.', errorCode: 'forbidden:artifact' }
    }

    await deleteArtifactSoftById({ artifactId, userId: session.user.id })

    revalidatePath('/artifacts') // Обновляем путь
    return { success: true }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return { success: false, error: error.message, errorCode: `${error.type}:${error.surface}` }
    }
    return { success: false, error: 'Не удалось удалить артефакт.', errorCode: 'bad_request:artifact' }
  }
}

export async function copyArtifactToClipboard ({
  artifactId,
  title,
  kind,
}: {
  artifactId: string
  title: string
  kind: ArtifactKind
}): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Пользователь не авторизован.', errorCode: 'unauthorized:clipboard' }
  }

  try {
    await withRedis(async (client) => {
      await client.set(`user-clipboard:${session.user.id}`, JSON.stringify({ artifactId, title, kind }), { EX: 60 })
    })
    return { success: true }
  } catch (error) {
    console.error('REDIS_CLIPBOARD_SET_ERROR', error)
    return { success: false, error: 'Не удалось сохранить артефакт.', errorCode: 'bad_request:clipboard' }
  }
}

export async function getArtifactFromClipboard () {
  const session = await auth()
  if (!session?.user?.id) return null

  try {
    const result = await withRedis(async (client) => {
      const data = await client.get(`user-clipboard:${session.user.id}`)
      return data
    })
    return result ? JSON.parse(result) : null
  } catch (error) {
    console.error('REDIS_CLIPBOARD_GET_ERROR', error)
    return null
  }
}

export async function clearArtifactFromClipboard (): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Пользователь не авторизован.', errorCode: 'unauthorized:clipboard' }
  }

  try {
    await withRedis(async (client) => {
      await client.del(`user-clipboard:${session.user.id}`)
    })
    return { success: true }
  } catch (error) {
    console.error('REDIS_CLIPBOARD_CLEAR_ERROR', error)
    return { success: false, error: 'Не удалось очистить буфер.', errorCode: 'bad_request:clipboard' }
  }
}

/**
 * @description Публикует сайт с опциональным TTL
 * @param siteId ID артефакта сайта для публикации
 * @param expiresAt Дата истечения публикации (null = бессрочно)
 * @returns Promise с результатом операции
 * @feature Система публикации с поддержкой TTL
 */
export async function publishSite({
  siteId,
  expiresAt
}: {
  siteId: string;
  expiresAt: Date | null;
}): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Пользователь не авторизован.', errorCode: 'unauthorized:site' }
  }

  try {
    // 1. Получить артефакт сайта и проверить права
    const artifactResult = await getArtifactById({ id: siteId })
    if (!artifactResult || !artifactResult.doc) {
      return { success: false, error: 'Сайт не найден.', errorCode: 'not_found:site' }
    }

    const siteArtifact = artifactResult.doc
    
    // 2. Проверить что это сайт и принадлежит пользователю
    if (siteArtifact.kind !== 'site') {
      return { success: false, error: 'Артефакт не является сайтом.', errorCode: 'bad_request:site' }
    }
    
    if (siteArtifact.userId !== session.user.id) {
      return { success: false, error: 'Доступ запрещен.', errorCode: 'forbidden:site' }
    }

    // 3. Создать объект публикации
    const publicationInfo: PublicationInfo = {
      source: 'site',
      sourceId: siteId,
      publishedAt: new Date().toISOString(),
      expiresAt: expiresAt ? expiresAt.toISOString() : null
    }

    // 4. Обновить publication_state
    const currentPublications = siteArtifact.publication_state || []
    
    // Удаляем существующую site публикацию (если есть)
    const filteredPublications = currentPublications.filter(
      (pub: PublicationInfo) => !(pub.source === 'site' && pub.sourceId === siteId)
    )
    
    // Добавляем новую публикацию
    const updatedPublications = [...filteredPublications, publicationInfo]
    
    await updateArtifactById({ 
      id: siteId, 
      updateData: { 
        publication_state: updatedPublications 
      } 
    })

    revalidatePath('/artifacts')
    revalidatePath(`/artifacts/${siteId}`) // Если есть такой роут
    return { 
      success: true, 
      message: 'Сайт успешно опубликован' 
    }

  } catch (error) {
    console.error('Failed to publish site:', error)
    if (error instanceof ChatSDKError) {
      return { success: false, error: error.message, errorCode: `${error.type}:${error.surface}` }
    }
    return { success: false, error: 'Не удалось опубликовать сайт.', errorCode: 'internal_error:site' }
  }
}

/**
 * @description Отменяет публикацию сайта
 * @param siteId ID артефакта сайта для отмены публикации
 * @returns Promise с результатом операции
 * @feature Система публикации с поддержкой TTL
 */
export async function unpublishSite({ siteId }: { siteId: string }): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Пользователь не авторизован.', errorCode: 'unauthorized:site' }
  }

  try {
    // 1. Получить артефакт сайта и проверить права
    const artifactResult = await getArtifactById({ id: siteId })
    if (!artifactResult || !artifactResult.doc) {
      return { success: false, error: 'Сайт не найден.', errorCode: 'not_found:site' }
    }

    const siteArtifact = artifactResult.doc
    
    // 2. Проверить что это сайт и принадлежит пользователю
    if (siteArtifact.kind !== 'site') {
      return { success: false, error: 'Артефакт не является сайтом.', errorCode: 'bad_request:site' }
    }
    
    if (siteArtifact.userId !== session.user.id) {
      return { success: false, error: 'Доступ запрещен.', errorCode: 'forbidden:site' }
    }

    // 3. Удалить site публикацию из publication_state
    const currentPublications = siteArtifact.publication_state || []
    const filteredPublications = currentPublications.filter(
      (pub: PublicationInfo) => !(pub.source === 'site' && pub.sourceId === siteId)
    )
    
    await updateArtifactById({ 
      id: siteId, 
      updateData: { 
        publication_state: filteredPublications 
      } 
    })

    revalidatePath('/artifacts')
    revalidatePath(`/artifacts/${siteId}`) // Если есть такой роут
    return { 
      success: true, 
      message: 'Публикация сайта отменена' 
    }

  } catch (error) {
    console.error('Failed to unpublish site:', error)
    if (error instanceof ChatSDKError) {
      return { success: false, error: error.message, errorCode: `${error.type}:${error.surface}` }
    }
    return { success: false, error: 'Не удалось отменить публикацию сайта.', errorCode: 'internal_error:site' }
  }
}

// END OF: app/(main)/artifacts/actions.ts
