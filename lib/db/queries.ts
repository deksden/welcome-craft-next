/**
 * @file lib/db/queries.ts
 * @description Функции для выполнения запросов к базе данных.
 * @version 2.6.0
 * @date 2025-07-02
 * @updated BUG-082 FIX - добавлена world isolation в message query функции для предотвращения cross-world data access
 */

/** HISTORY:
 * v2.6.0 (2025-07-02): BUG-082 FIX - добавлена world isolation в getMessageById, getMessagesByChatId, getMessageWithSiblings для предотвращения доступа к сообщениям из других миров
 * v2.5.0 (2025-06-28): УНИФИКАЦИЯ МИРНОЙ СИСТЕМЫ - включена изоляция данных по world_id, убрана временная отладка
 * v2.4.1 (2025-06-13): Добавлен await к вызову query() для корректной работы.
 * v2.4.0 (2025-06-13): Инстанс db теперь импортируется из @/lib/db.
 * v2.3.0 (2025-06-12): Added versionTimestamp param to getArtifactById.
 * v2.2.0 (2025-06-10): Импорт ArtifactKind теперь из общего файла lib/types.
 * v2.1.1 (2025-06-10): Temporarily commented out generateHashedPassword usage to resolve TS2305.
 * v2.1.0 (2025-06-09): Восстановлены экспорты getMessageById, deleteMessageById и др.
 * v2.0.0 (2025-06-09): Переименованы Document->Artifact, мягкое удаление, новые функции rename/restore/dismiss.
 */

import 'server-only'

import { and, asc, count, desc, eq, gt, gte, inArray, isNull, sql, type SQL, } from 'drizzle-orm'
// ИСПРАВЛЕНИЕ BUG-071: Заменяем проблемный fab-logger на стандартное логирование  
// import { createLogger } from '@fab33/fab-logger'

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
import { getCurrentWorldContextSync, createWorldFilter, addWorldId, type WorldContext } from './world-context'

// ИСПРАВЛЕНИЕ BUG-071: Используем стандартное console логирование вместо проблемного fab-logger
// console.log(`process.env.TRANSPORT1=${process.env.TRANSPORT1}`)
// const logger = createLogger('lib:db:queries')
const logger = {
  trace: (obj: any, msg?: string) => console.debug(`[lib:db:queries] ${msg || ''}`, obj),
  debug: (msg: string | object, ...args: any[]) => console.debug(`[lib:db:queries]`, typeof msg === 'string' ? msg : JSON.stringify(msg), ...args),
  info: (msg: string | object, ...args: any[]) => console.info(`[lib:db:queries]`, typeof msg === 'string' ? msg : JSON.stringify(msg), ...args),
  warn: (msg: string | object, ...args: any[]) => console.warn(`[lib:db:queries]`, typeof msg === 'string' ? msg : JSON.stringify(msg), ...args),
  error: (msg: string | object, ...args: any[]) => console.error(`[lib:db:queries]`, typeof msg === 'string' ? msg : JSON.stringify(msg), ...args),
  child: (context: any) => logger, // Stub для совместимости с fab-logger API
}

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

/**
 * @description Ensures a user exists in the database. Creates the user if they don't exist.
 * @param userId - The user ID to check/create
 * @param email - The email for the user (required for test users)
 * @param type - The user type (defaults to 'user')
 * @returns User record or null if creation failed
 */
export async function ensureUserExists(userId: string, email: string, type: 'user' | 'admin' = 'user') {
  const childLogger = logger.child({ userId, email, type })
  childLogger.trace('Entering ensureUserExists')
  
  try {
    // Check if user already exists
    const existingUser = await db.select().from(user).where(eq(user.id, userId)).limit(1)
    
    if (existingUser.length > 0) {
      childLogger.trace('User already exists')
      return existingUser[0]
    }
    
    // Create user if they don't exist
    childLogger.info('User does not exist, creating new user')
    const result = await db.insert(user).values({ 
      id: userId, 
      email, 
      password: 'test-password', // Test users don't need real passwords
      type 
    }).returning({
      id: user.id,
      email: user.email,
      type: user.type,
    })
    
    childLogger.info({ userId }, 'Test user created successfully')
    return result[0]
  } catch (error) {
    childLogger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to ensure user exists')
    return null
  }
}

// --- Chat Queries ---
export async function saveChat ({ id, userId, title, published_until, worldContext }: {
  id: string;
  userId: string;
  title: string;
  published_until?: Date | null;
  worldContext?: WorldContext;
}) {
  const childLogger = logger.child({ chatId: id, userId })
  childLogger.trace({ title, published_until }, 'Entering saveChat')
  
  // 🌍 BUG-080 FIX: Use world context passed from request instead of sync version
  const chatData = addWorldId({
    id, 
    createdAt: new Date(), 
    userId, 
    title, 
    published_until
  }, worldContext)
  
  childLogger.debug('Saving chat with world context', { world_id: chatData.world_id })
  return await db.insert(chat).values(chatData).onConflictDoNothing()
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

export async function getMessagesByChatId ({ id, worldContext }: { id: string; worldContext?: WorldContext | null }) {
  const actualWorldContext = worldContext !== undefined ? worldContext : getCurrentWorldContextSync()
  
  let baseWhere = eq(message.chatId, id)
  
  // Add world isolation if enabled
  if (actualWorldContext?.worldId) {
    const worldFilter = createWorldFilter(actualWorldContext)
    const worldCondition = worldFilter.world_id === null 
      ? isNull(message.world_id) 
      : eq(message.world_id, worldFilter.world_id)
    const combinedWhere = and(baseWhere, worldCondition)
    if (combinedWhere) {
      baseWhere = combinedWhere
    }
  }
  
  return await db.select().from(message).where(baseWhere).orderBy(asc(message.createdAt))
}

export async function getMessageById ({ id, worldContext }: { id: string; worldContext?: WorldContext | null }): Promise<DBMessage | undefined> {
  const actualWorldContext = worldContext !== undefined ? worldContext : getCurrentWorldContextSync()
  
  let baseWhere = eq(message.id, id)
  
  // Add world isolation if enabled
  if (actualWorldContext?.worldId) {
    const worldFilter = createWorldFilter(actualWorldContext)
    const worldCondition = worldFilter.world_id === null 
      ? isNull(message.world_id) 
      : eq(message.world_id, worldFilter.world_id)
    const combinedWhere = and(baseWhere, worldCondition)
    if (combinedWhere) {
      baseWhere = combinedWhere
    }
  }
  
  const [result] = await db.select().from(message).where(baseWhere)
  return result
}

export async function deleteMessageById ({ messageId }: { messageId: string }): Promise<DBMessage | undefined> {
  const [deletedMessage] = await db.delete(message).where(eq(message.id, messageId)).returning()
  return deletedMessage
}

export async function getMessageWithSiblings ({ messageId, worldContext }: { messageId: string; worldContext?: WorldContext | null }) {
  const targetMessage = await getMessageById({ id: messageId, worldContext })
  if (!targetMessage) return null
  const allMessages = await getMessagesByChatId({ id: targetMessage.chatId, worldContext })
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
export async function saveArtifact ({ id, title, kind, content, userId, authorId, createdAt, worldContext }: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
  authorId: string | null;
  createdAt?: Date;
  worldContext?: WorldContext;
}) {
  const childLogger = logger.child({ artifactId: id, userId, kind })
  childLogger.trace({ title, authorId, contentLength: content?.length }, 'Entering saveArtifact')
  
  try {
    // 🌍 BUG-080 FIX: Use world context passed from request instead of sync version
    const artifactData = addWorldId({
      id,
      title,
      kind,
      userId,
      authorId,
      createdAt: createdAt ?? new Date()
    }, worldContext)
    
    childLogger.debug('Creating artifact record in main table', { world_id: artifactData.world_id })
    const [savedArtifact] = await db.insert(artifact).values(artifactData).returning()
    
    // UC-10 SCHEMA-DRIVEN CMS: Use artifact-tools unified dispatcher for specialized tables
    childLogger.debug('Saving content using UC-10 artifact-tools unified dispatcher')
    const { saveArtifact: saveArtifactContent } = await import('@/artifacts/kinds/artifact-tools')
    await saveArtifactContent(savedArtifact, content)
    
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
  worldContext,
  groupByVersions = true,
  showOnlyMyArtifacts = false // 🚀 NEW: Collaborative filter
}: {
  userId: string;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  kind?: ArtifactKind;
  worldContext?: WorldContext | null; // Optional parameter for world isolation
  groupByVersions?: boolean; // ✅ New parameter to control version grouping
  showOnlyMyArtifacts?: boolean; // 🚀 NEW: If true, filter by userId; if false, show all artifacts
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
    kind,
    groupByVersions,
    showOnlyMyArtifacts
  });
  const offset = (page - 1) * pageSize
  
  // UC-10 SCHEMA-DRIVEN CMS: Basic search by title and summary only 
  // TODO: Implement content search across specialized tables
  let searchConditions: SQL<unknown> | undefined
  if (searchQuery) {
    const searchPattern = `%${searchQuery}%`
    searchConditions = sql`(
      ${artifact.title} ILIKE ${searchPattern} OR 
      ${artifact.summary} ILIKE ${searchPattern}
    )`
  }
  
  // 🚀 COLLABORATIVE SYSTEM: New filtering logic based on user preference
  // By default, show ALL artifacts (collaborative); optionally filter by userId if requested
  let baseWhere: SQL<unknown> | undefined;
  if (showOnlyMyArtifacts) {
    console.log('🚀 PERSONAL FILTER MODE: Showing only user-owned artifacts');
    baseWhere = and(
      eq(artifact.userId, userId), 
      isNull(artifact.deletedAt), 
      searchConditions,
      kind ? eq(artifact.kind, kind) : undefined
    );
  } else {
    console.log('🚀 COLLABORATIVE MODE: Showing all artifacts for collaboration');
    baseWhere = and(
      isNull(artifact.deletedAt), 
      searchConditions,
      kind ? eq(artifact.kind, kind) : undefined
    );
  }
  
  // Add world isolation if enabled
  let finalWhere = baseWhere
  if (actualWorldContext?.worldId) {
    console.log('🌍 World isolation ENABLED for worldId:', actualWorldContext.worldId)
    const worldFilter = createWorldFilter(actualWorldContext)
    finalWhere = and(baseWhere, worldFilter.world_id === null 
      ? isNull(artifact.world_id) 
      : eq(artifact.world_id, worldFilter.world_id))
    console.log('🌍 Applied artifact world filter:', worldFilter)
  } else {
    console.log('🌍 World isolation DISABLED - showing production data')
  }
  if (groupByVersions) {
    // ✅ JAVASCRIPT GROUPING: Compatible approach that works with mocked tests
    console.log('🔍 BUG-023 FIXED: Using JavaScript grouping for latest versions only')
    
    // Get all artifacts and group by ID in JavaScript (PostgreSQL subquery equivalent)
    console.log('🔍 About to execute DB query with finalWhere:', finalWhere)
    let allData: Artifact[] = []
    try {
      allData = await db.select().from(artifact).where(finalWhere).orderBy(desc(artifact.createdAt))
      console.log(`🔍 Found ${allData.length} total artifact versions`)
    } catch (dbError) {
      console.error('🚨 DB Query failed:', dbError)
      throw dbError
    }
    
    // Group by ID, keeping only the latest version (first in sorted order)
    const latestVersionsMap = new Map<string, Artifact>()
    for (const item of allData) {
      if (!latestVersionsMap.has(item.id)) {
        // Since data is already sorted by createdAt DESC, first occurrence = latest version
        latestVersionsMap.set(item.id, item)
      }
    }
    
    const latestVersions = Array.from(latestVersionsMap.values())
    console.log(`🔍 After JavaScript grouping: ${latestVersions.length} unique artifacts`)
    
    // Apply pagination to the grouped results
    const data = latestVersions.slice(offset, offset + pageSize)
    
    return { 
      data, 
      totalCount: latestVersions.length 
    }
  } else {
    // ✅ ALL VERSIONS: Show all artifact versions separately
    const totalCountResult = await db.select({ count: count() }).from(artifact).where(finalWhere)
    const data = await db.select().from(artifact).where(finalWhere).orderBy(desc(artifact.createdAt)).limit(pageSize).offset(offset)
    return { data, totalCount: totalCountResult[0]?.count ?? 0 }
  }
}

export async function getRecentArtifactsByUserId ({ 
  userId, 
  limit = 5, 
  kind,
  worldContext,
  showOnlyMyArtifacts = false // 🚀 NEW: Collaborative filter
}: {
  userId: string;
  limit?: number;
  kind?: ArtifactKind;
  worldContext?: WorldContext | null; // Optional parameter for world isolation
  showOnlyMyArtifacts?: boolean; // 🚀 NEW: Filter preference
}): Promise<Artifact[]> {
  const result = await getPagedArtifactsByUserId({ 
    userId, 
    page: 1, 
    pageSize: limit, 
    kind,
    worldContext,
    groupByVersions: true, // ✅ Always group for recent artifacts 
    showOnlyMyArtifacts // 🚀 Pass collaborative filter
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

// --- User Helper Functions ---

/**
 * Resolve user ID from test session data (handles both real UUIDs and email-based lookup)
 */
export async function resolveUserIdFromSession(sessionUserId: string, sessionUserEmail?: string): Promise<string> {
  // First, check if the provided ID exists in the database
  const userById = await db.select({ id: user.id })
    .from(user)
    .where(eq(user.id, sessionUserId))
    .limit(1);
  
  if (userById.length > 0) {
    return sessionUserId; // Use the provided ID if it exists
  }
  
  // If ID doesn't exist and we have email, look up by email
  if (sessionUserEmail) {
    const userByEmail = await db.select({ id: user.id })
      .from(user)
      .where(eq(user.email, sessionUserEmail))
      .limit(1);
    
    if (userByEmail.length > 0) {
      return userByEmail[0].id; // Return the real database ID
    }
  }
  
  // If neither worked, return the original ID (fallback)
  return sessionUserId;
}

// --- User Preferences Queries ---

/**
 * Get user's artifact filter preference by ID or email
 */
export async function getUserArtifactFilterPreference(userIdOrEmail: string): Promise<boolean> {
  // Try by ID first, then by email for test sessions
  let result = await db.select({ showOnlyMyArtifacts: user.show_only_my_artifacts })
    .from(user)
    .where(eq(user.id, userIdOrEmail))
    .limit(1);
  
  if (result.length === 0) {
    // Try by email if ID lookup failed (for test sessions)
    result = await db.select({ showOnlyMyArtifacts: user.show_only_my_artifacts })
      .from(user)
      .where(eq(user.email, userIdOrEmail))
      .limit(1);
  }
  
  return result[0]?.showOnlyMyArtifacts ?? false; // Default to collaborative mode
}

/**
 * Update user's artifact filter preference by ID or email
 */
export async function updateUserArtifactFilterPreference({ 
  userIdOrEmail, 
  showOnlyMyArtifacts 
}: { 
  userIdOrEmail: string; 
  showOnlyMyArtifacts: boolean; 
}): Promise<void> {
  // Try by ID first, then by email for test sessions
  const result = await db.update(user)
    .set({ 
      show_only_my_artifacts: showOnlyMyArtifacts,
      updatedAt: new Date()
    })
    .where(eq(user.id, userIdOrEmail))
    .returning({ id: user.id });
  
  if (result.length === 0) {
    // Try by email if ID update failed (for test sessions)
    await db.update(user)
      .set({ 
        show_only_my_artifacts: showOnlyMyArtifacts,
        updatedAt: new Date()
      })
      .where(eq(user.email, userIdOrEmail));
  }
}

// END OF: lib/db/queries.ts
