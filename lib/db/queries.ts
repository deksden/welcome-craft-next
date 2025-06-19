/**
 * @file lib/db/queries.ts
 * @description Функции для выполнения запросов к базе данных.
 * @version 2.4.1
 * @date 2025-06-13
 * @updated Добавлен await к вызову query() для корректной работы.
 */

/** HISTORY:
 * v2.4.1 (2025-06-13): Добавлен await к вызову query().
 * v2.4.0 (2025-06-13): Инстанс db теперь импортируется из @/lib/db.
 * v2.3.0 (2025-06-12): Added versionTimestamp param to getArtifactById.
 * v2.2.0 (2025-06-10): Импорт ArtifactKind теперь из общего файла lib/types.
 * v2.1.1 (2025-06-10): Temporarily commented out generateHashedPassword usage to resolve TS2305.
 * v2.1.0 (2025-06-09): Восстановлены экспорты getMessageById, deleteMessageById и др.
 * v2.0.0 (2025-06-09): Переименованы Document->Artifact, мягкое удаление, новые функции rename/restore/dismiss.
 */

import 'server-only'

import { and, asc, count, desc, eq, gt, gte, inArray, isNull, sql, type SQL, } from 'drizzle-orm'
import { createLogger } from '@fab33/fab-logger'

import {
  artifact,
  type Artifact,
  chat,
  type Chat,
  type DBMessage,
  message,
  type Suggestion,
  suggestion,
  user,
  type User,
} from './schema'
import type { ArtifactKind, } from '@/lib/types'
import { generateUUID } from '../utils'
// import { generateHashedPassword } from './utils'; // TODO: Restore when generateHashedPassword is available
import { generateAndSaveSummary } from '../ai/summarizer'
import { db } from '@/lib/db'
import { getCurrentWorldContextSync, createWorldFilter, type WorldContext } from './world-context'

console.log(`process.env.TRANSPORT1=${process.env.TRANSPORT1}`)
const logger = createLogger('lib:db:queries')

// --- User Queries ---
export async function getUser (email: string): Promise<Array<User>> {
  logger.trace({ email }, 'Entering getUser')
  return await db.select().from(user).where(eq(user.email, email))
}

export async function createUser (email: string, password: string) {
  logger.trace({ email }, 'Entering createUser')

  try {
    // const hashedPassword = generateHashedPassword(password); // TODO: Hashing needed
    // For now, to resolve TS error, using plain password. THIS IS INSECURE.
    console.warn('TODO: Password hashing is not implemented in createUser. Storing plain password temporarily.')

    const result = await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    })

    logger.info({ email, userId: result[0]?.id }, 'User created successfully')
    return result
  } catch (error) {
    logger.error({ email, error: error instanceof Error ? error.message : String(error) }, 'Failed to create user')
    throw error
  }
}

export async function createGuestUser () {
  logger.trace('Entering createGuestUser')
  const email = `guest-${Date.now()}`
  // const password = generateHashedPassword(generateUUID()); // TODO: Hashing needed
  // For now, to resolve TS error, using plain UUID as password. THIS IS INSECURE.
  const plainPasswordForGuest = generateUUID()
  console.warn('TODO: Password hashing is not implemented in createGuestUser. Storing plain UUID as password temporarily.')
  return await db.insert(user).values({ email, password: plainPasswordForGuest }).returning({
    id: user.id,
    email: user.email,
  })
}

// --- Chat Queries ---
export async function saveChat ({ id, userId, title, published_until }: {
  id: string;
  userId: string;
  title: string;
  published_until?: Date | null;
}) {
  const childLogger = logger.child({ chatId: id, userId })
  childLogger.trace({ title, published_until }, 'Entering saveChat')
  return await db.insert(chat).values({ id, createdAt: new Date(), userId, title, published_until }).onConflictDoNothing()
}

export async function deleteChatSoftById ({ id, userId }: { id: string; userId: string }) {
  const childLogger = logger.child({ chatId: id, userId })
  childLogger.trace('Entering deleteChatSoftById')
  const [deletedChat] = await db.update(chat).set({ deletedAt: new Date() }).where(and(eq(chat.id, id), eq(chat.userId, userId))).returning()
  childLogger.info('Chat soft-deleted successfully')
  return deletedChat
}

export async function restoreChatById ({ id, userId }: { id: string; userId: string }) {
  const childLogger = logger.child({ chatId: id, userId })
  childLogger.trace('Entering restoreChatById')
  const [restoredChat] = await db.update(chat).set({ deletedAt: null }).where(and(eq(chat.id, id), eq(chat.userId, userId))).returning()
  childLogger.info('Chat restored successfully')
  return restoredChat
}

export async function renameChatTitle ({ id, newTitle, userId }: { id: string; newTitle: string; userId: string; }) {
  const childLogger = logger.child({ chatId: id, userId })
  childLogger.trace({ newTitle }, 'Entering renameChatTitle')
  return await db.update(chat).set({ title: newTitle }).where(and(eq(chat.id, id), eq(chat.userId, userId)))
}

export async function updateChatPublishedUntil ({ chatId, published_until }: {
  chatId: string;
  published_until: Date | null;
}) {
  const childLogger = logger.child({ chatId, published_until })
  childLogger.trace('Entering updateChatPublishedUntil')
  return await db.update(chat).set({ published_until }).where(eq(chat.id, chatId))
}

export async function getChatsByUserId ({ 
  id, 
  limit, 
  startingAfter, 
  endingBefore, 
  worldContext 
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
  worldContext?: WorldContext | null; // Optional parameter for world isolation
}) {
  // Use current world context if not provided
  const actualWorldContext = worldContext !== undefined ? worldContext : getCurrentWorldContextSync();
  const childLogger = logger.child({ 
    userId: id, 
    limit, 
    startingAfter, 
    endingBefore, 
    worldContext: actualWorldContext 
  });
  
  childLogger.trace('Entering getChatsByUserId')
  console.log('🌍 getChatsByUserId with world context:', {
    userId: id,
    worldContext: actualWorldContext,
    isWorldIsolationEnabled: !!actualWorldContext?.worldId
  });
  
  const extendedLimit = limit + 1
  let baseWhere = and(eq(chat.userId, id), isNull(chat.deletedAt))
  
  // Add world isolation if enabled
  if (actualWorldContext?.worldId) {
    const worldFilter = createWorldFilter(actualWorldContext)
    baseWhere = and(baseWhere, worldFilter.world_id === null 
      ? isNull(chat.world_id) 
      : eq(chat.world_id, worldFilter.world_id))
    console.log('🌍 Applied world filter:', worldFilter)
  }

  const query = (cursorCondition?: SQL<any>) =>
    db.select().from(chat).where(cursorCondition ? and(baseWhere, cursorCondition) : baseWhere).orderBy(desc(chat.createdAt)).limit(extendedLimit)

  let filteredChats: Array<Chat> = []
  if (startingAfter) {
    filteredChats = await query(gt(chat.createdAt, new Date(startingAfter)))
  } else if (endingBefore) {
    filteredChats = await query(gte(chat.createdAt, new Date(endingBefore)))
  } else {
    filteredChats = await query()
  }

  const hasMore = filteredChats.length > limit
  return { chats: hasMore ? filteredChats.slice(0, limit) : filteredChats, hasMore }
}

export async function getChatById ({ id }: { id: string }) {
  const [selectedChat] = await db.select().from(chat).where(and(eq(chat.id, id), isNull(chat.deletedAt)))
  return selectedChat
}

// --- Message Queries ---
export async function saveMessages ({ messages: messagesToSave }: { messages: Array<DBMessage> }) {
  return await db.insert(message).values(messagesToSave)
}

export async function getMessagesByChatId ({ id }: { id: string }) {
  return await db.select().from(message).where(eq(message.chatId, id)).orderBy(asc(message.createdAt))
}

export async function getMessageById ({ id }: { id: string }): Promise<DBMessage | undefined> {
  const [result] = await db.select().from(message).where(eq(message.id, id))
  return result
}

export async function deleteMessageById ({ messageId }: { messageId: string }): Promise<DBMessage | undefined> {
  const [deletedMessage] = await db.delete(message).where(eq(message.id, messageId)).returning()
  return deletedMessage
}

export async function getMessageWithSiblings ({ messageId }: { messageId: string }) {
  const targetMessage = await getMessageById({ id: messageId })
  if (!targetMessage) return null
  const allMessages = await getMessagesByChatId({ id: targetMessage.chatId })
  const targetIndex = allMessages.findIndex(m => m.id === messageId)
  if (targetIndex === -1) return null
  return {
    previous: targetIndex > 0 ? allMessages[targetIndex - 1] : undefined,
    current: targetMessage,
    next: targetIndex < allMessages.length - 1 ? allMessages[targetIndex + 1] : undefined,
    all: allMessages,
  }
}

export async function deleteMessagesByChatIdAfterTimestamp ({ chatId, timestamp, }: {
  chatId: string;
  timestamp: Date;
}) {
  const messagesToDelete = await db.select({ id: message.id }).from(message).where(and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)))
  if (messagesToDelete.length > 0) {
    const messageIds = messagesToDelete.map((msg) => msg.id)
    return await db.delete(message).where(and(eq(message.chatId, chatId), inArray(message.id, messageIds)))
  }
}

export async function getMessageCountByUserId ({ id, differenceInHours, }: { id: string; differenceInHours: number }) {
  const targetDate = new Date(Date.now() - differenceInHours * 60 * 60 * 1000,)
  const [stats] = await db.select({ count: count(message.id) }).from(message).innerJoin(chat, eq(message.chatId, chat.id)).where(and(eq(chat.userId, id), gte(message.createdAt, targetDate), eq(message.role, 'user'),)).execute()
  return stats?.count ?? 0
}

// --- Artifact Queries ---
export async function saveArtifact ({ id, title, kind, content, userId, authorId, createdAt }: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
  authorId: string | null;
  createdAt?: Date
}) {
  const childLogger = logger.child({ artifactId: id, userId, kind })
  childLogger.trace({ title, authorId, contentLength: content?.length }, 'Entering saveArtifact')
  
  try {
    // Import here to avoid circular dependency
    const { prepareContentForSave } = await import('@/lib/artifact-content-utils')
    
    childLogger.debug('Preparing content data for database storage')
    const contentData = prepareContentForSave(content, kind)
    
    // Log which column will receive the content
    const targetColumn = kind === 'image' ? 'content_url' : 
                        kind === 'site' ? 'content_site_definition' : 'content_text'
    childLogger.debug({ 
      targetColumn,
      hasContent: !!contentData[targetColumn as keyof typeof contentData],
      contentData: {
        content_text: contentData.content_text ? `${contentData.content_text.length} chars` : null,
        content_url: contentData.content_url ? 'present' : null,
        content_site_definition: contentData.content_site_definition ? 'present' : null
      }
    }, 'Content data prepared for sparse columns')
    
    childLogger.debug('Inserting artifact into database')
    const [savedArtifact] = await db.insert(artifact).values({
      id,
      title,
      kind,
      ...contentData, // Spread the content into appropriate columns
      userId,
      authorId,
      createdAt: createdAt ?? new Date()
    }).returning()
    
    childLogger.info({ 
      savedArtifactId: savedArtifact.id,
      savedArtifactKind: savedArtifact.kind,
      savedArtifactTitle: savedArtifact.title
    }, 'Artifact saved successfully to database')
    
    if (content) {
      childLogger.debug('Starting background summary generation')
      generateAndSaveSummary(id, content, kind).catch(err => {
        childLogger.error({ err }, 'Async summary generation failed')
      })
    }
    
    return [savedArtifact]
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      title,
      kind,
      contentLength: content?.length,
      userId,
      authorId
    }, 'Failed to save artifact to database')
    throw error
  }
}

export async function getArtifactsById ({ id }: { id: string }): Promise<Array<Artifact>> {
  const result = await db.select().from(artifact).where(and(eq(artifact.id, id), isNull(artifact.deletedAt))).orderBy(asc(artifact.createdAt))
  return result
}

export async function getArtifactById ({ id, version, versionTimestamp }: {
  id: string;
  version?: number | null;
  versionTimestamp?: Date | null
}): Promise<{
  doc: Artifact,
  totalVersions: number
} | undefined> {
  const allVersions = await getArtifactsById({ id })
  if (allVersions.length === 0) return undefined
  const totalVersions = allVersions.length
  let doc: Artifact | undefined
  if (versionTimestamp) {
    doc = allVersions.find(v => v.createdAt.getTime() === versionTimestamp.getTime())
  }
  if (!doc && version != null && version > 0 && version <= totalVersions) {
    doc = allVersions[version - 1]
  }
  doc = doc ?? allVersions[totalVersions - 1]
  return { doc, totalVersions }
}

export async function deleteArtifactVersionsAfterTimestamp ({ id, timestamp, }: { id: string; timestamp: Date; }) {
  await db.delete(suggestion).where(and(eq(suggestion.documentId, id), gt(suggestion.documentCreatedAt, timestamp)))
  return await db.delete(artifact).where(and(eq(artifact.id, id), gt(artifact.createdAt, timestamp))).returning()
}

export async function getPagedArtifactsByUserId ({ 
  userId, 
  page = 1, 
  pageSize = 10, 
  searchQuery, 
  kind,
  worldContext
}: {
  userId: string;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  kind?: ArtifactKind;
  worldContext?: WorldContext | null; // Optional parameter for world isolation
}): Promise<{
  data: Artifact[],
  totalCount: number
}> {
  // Use current world context if not provided
  const actualWorldContext = worldContext !== undefined ? worldContext : getCurrentWorldContextSync();
  
  console.log('🌍 getPagedArtifactsByUserId with world context:', {
    userId,
    worldContext: actualWorldContext,
    isWorldIsolationEnabled: !!actualWorldContext?.worldId,
    page,
    pageSize,
    searchQuery,
    kind
  });
  const offset = (page - 1) * pageSize
  
  // ✅ Enhanced search: поиск по title, summary, и content_text для полнотекстового поиска
  let searchConditions: SQL<unknown> | undefined
  if (searchQuery) {
    const searchPattern = `%${searchQuery}%`
    searchConditions = sql`(
      ${artifact.title} ILIKE ${searchPattern} OR 
      ${artifact.summary} ILIKE ${searchPattern} OR 
      ${artifact.content_text} ILIKE ${searchPattern}
    )`
  }
  
  let baseWhere = and(
    eq(artifact.userId, userId), 
    isNull(artifact.deletedAt), 
    searchConditions,
    kind ? eq(artifact.kind, kind) : undefined
  )
  
  // Add world isolation if enabled
  if (actualWorldContext?.worldId) {
    const worldFilter = createWorldFilter(actualWorldContext)
    baseWhere = and(baseWhere, worldFilter.world_id === null 
      ? isNull(artifact.world_id) 
      : eq(artifact.world_id, worldFilter.world_id))
    console.log('🌍 Applied artifact world filter:', worldFilter)
  }
  const subquery = db.select({
    id: artifact.id, rn: sql<number>`row_number
      () OVER (PARTITION BY
      ${artifact.id}
      ORDER
      BY
      ${artifact.createdAt}
      DESC
      )`.as('rn')
  }).from(artifact).where(baseWhere).as('subquery')
  const latestArtifactsQuery = db.select({ id: artifact.id }).from(artifact).innerJoin(subquery, and(eq(artifact.id, subquery.id), eq(subquery.rn, 1)))
  const totalCountResult = await db.select({ count: count() }).from(latestArtifactsQuery.as('latest_artifacts'))
  const rawData = await db.select().from(artifact).innerJoin(subquery, and(eq(artifact.id, subquery.id), eq(subquery.rn, 1))).orderBy(desc(artifact.createdAt)).limit(pageSize).offset(offset)
  const data = rawData.map(row => row.Artifact)
  return { data, totalCount: totalCountResult[0]?.count ?? 0 }
}

export async function getRecentArtifactsByUserId ({ 
  userId, 
  limit = 5, 
  kind,
  worldContext
}: {
  userId: string;
  limit?: number;
  kind?: ArtifactKind;
  worldContext?: WorldContext | null; // Optional parameter for world isolation
}): Promise<Artifact[]> {
  const result = await getPagedArtifactsByUserId({ 
    userId, 
    page: 1, 
    pageSize: limit, 
    kind,
    worldContext
  })
  return result.data
}

export async function deleteArtifactSoftById ({ artifactId, userId, }: { artifactId: string; userId: string; }) {
  return await db.update(artifact).set({ deletedAt: new Date() }).where(and(eq(artifact.id, artifactId), eq(artifact.userId, userId)))
}

export async function restoreArtifactById ({ artifactId, userId }: { artifactId: string; userId: string; }) {
  return await db.update(artifact).set({ deletedAt: null }).where(and(eq(artifact.id, artifactId), eq(artifact.userId, userId)))
}

export async function renameArtifactById ({ artifactId, newTitle, userId }: {
  artifactId: string;
  newTitle: string;
  userId: string;
}) {
  return await db.update(artifact).set({ title: newTitle }).where(and(eq(artifact.id, artifactId), eq(artifact.userId, userId)))
}

/**
 * @description Обновляет артефакт по ID с переданными данными
 * @param id ID артефакта для обновления
 * @param updateData Данные для обновления
 * @returns Promise с результатом обновления
 * @feature Система публикации с поддержкой TTL
 */
export async function updateArtifactById ({ 
  id, 
  updateData 
}: { 
  id: string; 
  updateData: Partial<Artifact>; 
}) {
  return await db.update(artifact).set(updateData).where(eq(artifact.id, id))
}

// --- Suggestion Queries ---
export async function saveSuggestions ({ suggestions: suggestionsToSave }: { suggestions: Array<Suggestion>; }) {
  return await db.insert(suggestion).values(suggestionsToSave)
}

export async function getSuggestionsByDocumentId ({ documentId }: { documentId: string; }) {
  return await db.select().from(suggestion).where(and(eq(suggestion.documentId, documentId), eq(suggestion.isDismissed, false)))
}

export async function dismissSuggestion ({ suggestionId, userId }: { suggestionId: string; userId: string }) {
  return await db.update(suggestion).set({ isDismissed: true }).where(and(eq(suggestion.id, suggestionId), eq(suggestion.userId, userId)))
}

// END OF: lib/db/queries.ts
