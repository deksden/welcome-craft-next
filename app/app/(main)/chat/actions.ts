/**
 * @file app/(main)/chat/actions.ts
 * @description Server Actions для управления чатом и сообщениями.
 * @version 1.7.0
 * @date 2025-07-02
 * @updated CRITICAL BUGFIX: Fixed world context access in Server Actions - regenerateFromUserMessage and regenerateAssistantResponse now accept worldContext parameter to prevent world isolation failures.
 */

/** HISTORY:
 * v1.7.0 (2025-07-02): CRITICAL BUGFIX: Fixed world context access in Server Actions - replaced getCurrentWorldContextSync() calls with worldContext parameter to prevent "Invalid message context" errors in test worlds.
 * v1.6.2 (2025-07-02): BUGFIX: Fixed regenerateFromUserMessage to delete only target assistant message, preserving subsequent messages.
 * v1.6.1 (2025-07-02): BUGFIX: Added test-session support to all Server Actions for regeneration functionality.
 * v1.6.0 (2025-07-02): FEATURE: Added regenerateFromUserMessage function for user message regeneration.
 * v1.5.0 (2025-06-17): Добавлены publishChat и unpublishChat для системы публикации с TTL.
 * v1.4.0 (2025-06-09): Исправлены импорты на новые функции.
 * v1.3.0 (2025-06-06): `deleteMessage` теперь возвращает `{ success: boolean }`.
 */

'use server'

import { generateText, type UIMessage } from 'ai'
import { cookies } from 'next/headers.js'
import { revalidatePath } from 'next/cache'
import { eq, sql } from 'drizzle-orm'
import {
  deleteMessageById,
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  getMessageWithSiblings,
  updateChatPublishedUntil,
  getChatById,
  getMessagesByChatId,
  updateArtifactById,
} from '@/lib/db/queries'
import type { VisibilityType, PublicationInfo } from '@/lib/types'
import { myEnhancedProvider } from '@/lib/ai/providers.enhanced'
import { auth } from '@/app/app/(auth)/auth'
import { getTestSession } from '@/lib/test-auth'
import { ChatSDKError } from '@/lib/errors'
import { db } from '@/lib/db'
import { artifact } from '@/lib/db/schema'
import { getCurrentWorldContextSync, type WorldContext } from '@/lib/db/world-context'

export async function saveChatModelAsCookie (model: string) {
  const cookieStore = await cookies()
  cookieStore.set('chat-model', model)
}

export async function generateTitleFromUserMessage ({
  message,
}: {
  message: UIMessage;
}) {
  const { text: title } = await generateText({
    model: myEnhancedProvider.languageModel('title-model'),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  })

  return title
}

export async function deleteTrailingMessages ({ id }: { id: string }) {
  const worldContext = getCurrentWorldContextSync()
  const message = await getMessageById({ id, worldContext })
  if (!message) return

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  })
}

export async function deleteAssistantResponse ({ userMessageId }: { userMessageId: string }) {
  const worldContext = getCurrentWorldContextSync()
  const siblings = await getMessageWithSiblings({ messageId: userMessageId, worldContext })
  if (siblings?.next && siblings.next.role === 'assistant') {
    await deleteMessageById({ messageId: siblings.next.id })
  }
}

export async function regenerateAssistantResponse ({ assistantMessageId, worldContext }: { assistantMessageId: string; worldContext?: WorldContext | null }) {
  let session = await auth()
  if (!session?.user) {
    session = await getTestSession()
  }
  if (!session?.user?.id) {
    throw new ChatSDKError('unauthorized:chat')
  }

  // Use passed worldContext instead of sync version which fails in Server Actions
  const siblings = await getMessageWithSiblings({ messageId: assistantMessageId, worldContext })
  if (!siblings || !siblings.previous || siblings.current.role !== 'assistant') {
    throw new ChatSDKError('bad_request:chat', 'Invalid message context for regeneration.')
  }

  await deleteMessageById({ messageId: assistantMessageId })
  revalidatePath(`/chat/${siblings.current.chatId}`)

  return siblings.previous
}

export async function regenerateFromUserMessage ({ userMessageId, worldContext }: { userMessageId: string; worldContext?: WorldContext | null }) {
  let session = await auth()
  if (!session?.user) {
    session = await getTestSession()
  }
  if (!session?.user?.id) {
    throw new ChatSDKError('unauthorized:chat')
  }

  // Use passed worldContext instead of sync version which fails in Server Actions
  console.log('🔧 REGENERATE ACTION DEBUG: Searching for message:', { userMessageId, worldContext })
  
  const siblings = await getMessageWithSiblings({ messageId: userMessageId, worldContext })
  
  console.log('🔧 REGENERATE ACTION DEBUG: Message search result:', {
    found: !!siblings,
    currentRole: siblings?.current?.role,
    currentId: siblings?.current?.id,
    hasAll: !!siblings?.all,
    allCount: siblings?.all?.length || 0
  })
  
  if (!siblings || siblings.current.role !== 'user') {
    console.error('🔧 REGENERATE ACTION ERROR: Invalid message context', {
      siblings: !!siblings,
      currentRole: siblings?.current?.role,
      userMessageId,
      worldContext
    })
    throw new ChatSDKError('bad_request:chat', 'Invalid message context for regeneration.')
  }

  // Просто возвращаем информацию для фронтенда
  // Фронтенд сам заменит сообщение через новый API /api/chat/regenerate
  // БД обновится автоматически при сохранении нового сообщения с тем же ID
  
  revalidatePath(`/chat/${siblings.current.chatId}`)

  return {
    userMessage: siblings.current,
    assistantMessage: siblings.next && siblings.next.role === 'assistant' ? siblings.next : null
  }
}

export async function deleteMessage ({ messageId }: { messageId: string }): Promise<{
  success: boolean;
  error?: string
}> {
  let session = await auth()
  if (!session?.user) {
    session = await getTestSession()
  }
  if (!session?.user?.id) {
    return { success: false, error: 'Пользователь не авторизован.' }
  }

  try {
    const worldContext = getCurrentWorldContextSync()
    const message = await getMessageById({ id: messageId, worldContext })
    if (!message) {
      return { success: false, error: 'Сообщение не найдено.' }
    }

    await deleteMessageById({ messageId })
    revalidatePath(`/chat/${message.chatId}`)
    return { success: true }
  } catch (error) {
    console.error(`SYS_ACT_DELETE_MESSAGE: Failed to delete message ${messageId}`, error)
    return { success: false, error: 'Не удалось удалить сообщение.' }
  }
}

export async function updateChatVisibility ({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  const published_until = visibility === 'public' ? null : null // Временная логика, будет заменена в следующих задачах
  await updateChatPublishedUntil({ chatId, published_until })
  revalidatePath(`/chat/${chatId}`)
}

/**
 * @description Публикует чат с опциональным TTL и каскадно публикует все артефакты в сообщениях
 * @param chatId ID чата для публикации
 * @param expiresAt Дата истечения публикации (null = бессрочно)
 * @returns Promise с результатом операции
 * @feature Система публикации с поддержкой TTL и каскадной публикации
 */
export async function publishChat({
  chatId,
  expiresAt
}: {
  chatId: string;
  expiresAt: Date | null;
}) {
  let session = await auth()
  if (!session?.user) {
    session = await getTestSession()
  }
  if (!session?.user?.id) {
    throw new ChatSDKError('unauthorized:chat')
  }

  try {
    // 1. Проверить что чат существует и принадлежит пользователю
    const chat = await getChatById({ id: chatId })
    if (!chat) {
      throw new ChatSDKError('not_found:chat')
    }
    
    if (chat.userId !== session.user.id) {
      throw new ChatSDKError('forbidden:chat')
    }

    // 2. Установить published_until для чата
    await updateChatPublishedUntil({ 
      chatId, 
      published_until: expiresAt 
    })

    // 3. Найти все artifact IDs в сообщениях чата
    const worldContext = getCurrentWorldContextSync()
    const messages = await getMessagesByChatId({ id: chatId, worldContext })
    const artifactIds = new Set<string>()

    for (const message of messages) {
      if (message.parts && Array.isArray(message.parts)) {
        for (const part of message.parts) {
          // Поддержка нового формата AI SDK Message_v2
          if (part && typeof part === 'object' && (part as any).type === 'tool-invocation') {
            const toolInvocation = (part as any).toolInvocation
            if (toolInvocation?.result && typeof toolInvocation.result === 'object') {
              const artifactId = toolInvocation.result.artifactId
              if (artifactId && typeof artifactId === 'string') {
                artifactIds.add(artifactId)
              }
            }
          }
          // Обратная совместимость со старым форматом (deprecated)
          else if (part && typeof part === 'object' && 'toolInvocations' in part) {
            const toolInvocations = (part as any).toolInvocations
            if (Array.isArray(toolInvocations)) {
              for (const invocation of toolInvocations) {
                if (invocation.result && typeof invocation.result === 'object') {
                  const artifactId = invocation.result.artifactId
                  if (artifactId && typeof artifactId === 'string') {
                    artifactIds.add(artifactId)
                  }
                }
              }
            }
          }
        }
      }
    }

    // 4. Для каждого уникального artifactId добавить PublicationInfo
    const publicationInfo: PublicationInfo = {
      source: 'chat',
      sourceId: chatId,
      publishedAt: new Date().toISOString(),
      expiresAt: expiresAt ? expiresAt.toISOString() : null
    }

    for (const artifactId of artifactIds) {
      try {
        // Получаем текущий artifact для обновления publication_state
        const artifactResult = await db.select()
          .from(artifact)
          .where(eq(artifact.id, artifactId))
          .orderBy(artifact.createdAt)
          .limit(1)

        if (artifactResult.length > 0) {
          const currentArtifact = artifactResult[0]
          const currentPublications = currentArtifact.publication_state || []
          
          // Удаляем существующие публикации от этого чата (если есть)
          const filteredPublications = currentPublications.filter(
            (pub: PublicationInfo) => !(pub.source === 'chat' && pub.sourceId === chatId)
          )
          
          // Добавляем новую публикацию
          const updatedPublications = [...filteredPublications, publicationInfo]
          
          await updateArtifactById({ 
            id: artifactId, 
            updateData: { 
              publication_state: updatedPublications 
            } 
          })
        }
      } catch (error) {
        console.error(`Failed to update publication_state for artifact ${artifactId}:`, error)
        // Продолжаем с другими артефактами
      }
    }

    revalidatePath(`/chat/${chatId}`)
    return { 
      success: true, 
      publishedArtifacts: artifactIds.size,
      message: `Чат и ${artifactIds.size} артефактов опубликованы` 
    }

  } catch (error) {
    console.error('Failed to publish chat:', error)
    if (error instanceof ChatSDKError) {
      throw error
    }
    throw new ChatSDKError('bad_request:chat', 'Не удалось опубликовать чат')
  }
}

/**
 * @description Отменяет публикацию чата и удаляет публикацию артефактов от этого чата
 * @param chatId ID чата для отмены публикации
 * @returns Promise с результатом операции
 * @feature Система публикации с поддержкой TTL
 */
export async function unpublishChat({ chatId }: { chatId: string }) {
  let session = await auth()
  if (!session?.user) {
    session = await getTestSession()
  }
  if (!session?.user?.id) {
    throw new ChatSDKError('unauthorized:chat')
  }

  try {
    // 1. Проверить что чат существует и принадлежит пользователю
    const chat = await getChatById({ id: chatId })
    if (!chat) {
      throw new ChatSDKError('not_found:chat')
    }
    
    if (chat.userId !== session.user.id) {
      throw new ChatSDKError('forbidden:chat')
    }

    // 2. Установить published_until = null для чата
    await updateChatPublishedUntil({ 
      chatId, 
      published_until: null 
    })

    // 3. Найти все артефакты, у которых есть публикация от этого чата
    const allArtifacts = await db.select()
      .from(artifact)
      .where(sql`publication_state::jsonb @> ${JSON.stringify([{source: 'chat', sourceId: chatId}])}`)

    let unpublishedArtifacts = 0

    // 4. Удалить записи публикации от этого чата
    for (const art of allArtifacts) {
      try {
        const currentPublications = art.publication_state || []
        const filteredPublications = currentPublications.filter(
          (pub: PublicationInfo) => !(pub.source === 'chat' && pub.sourceId === chatId)
        )
        
        if (filteredPublications.length !== currentPublications.length) {
          await updateArtifactById({ 
            id: art.id, 
            updateData: { 
              publication_state: filteredPublications 
            } 
          })
          unpublishedArtifacts++
        }
      } catch (error) {
        console.error(`Failed to unpublish artifact ${art.id}:`, error)
      }
    }

    revalidatePath(`/chat/${chatId}`)
    return { 
      success: true, 
      unpublishedArtifacts,
      message: `Публикация чата отменена, ${unpublishedArtifacts} артефактов отозваны` 
    }

  } catch (error) {
    console.error('Failed to unpublish chat:', error)
    if (error instanceof ChatSDKError) {
      throw error
    }
    throw new ChatSDKError('bad_request:chat', 'Не удалось отменить публикацию чата')
  }
}

// END OF: app/(main)/chat/actions.ts
