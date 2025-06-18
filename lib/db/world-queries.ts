/**
 * @file lib/db/world-queries.ts
 * @description Enhanced database queries с автоматической изоляцией тестовых миров
 * @version 1.0.0
 * @date 2025-06-18
 * @updated Обертки над стандартными queries с поддержкой world_id фильтрации
 */

/** HISTORY:
 * v1.0.0 (2025-06-18): Начальная реализация world-aware queries для Phase 2
 */

import { and, eq, isNull, desc, asc } from 'drizzle-orm'
import { db } from './index'
import { user, chat, artifact, message, suggestion } from './schema'
import { 
  getCurrentWorldContext, 
  createWorldFilter, 
  addWorldId,
  type WorldContext 
} from './world-context'

/**
 * @description Получить пользователей с учетом изоляции мира
 * 
 * @feature Автоматическая фильтрация по world_id
 * @param context - Контекст мира (опционально)
 * @returns Пользователи только из текущего мира
 */
export async function getWorldUsers(context: WorldContext = getCurrentWorldContext()) {
  const filter = createWorldFilter(context)
  
  return await db
    .select()
    .from(user)
    .where(eq(user.world_id, filter.world_id))
    .orderBy(asc(user.email))
}

/**
 * @description Получить пользователя по ID с проверкой изоляции
 * 
 * @param userId - ID пользователя
 * @param context - Контекст мира
 * @returns Пользователь если доступен в текущем мире, иначе null
 */
export async function getWorldUserById(
  userId: string, 
  context: WorldContext = getCurrentWorldContext()
) {
  const filter = createWorldFilter(context)
  
  const users = await db
    .select()
    .from(user)
    .where(and(
      eq(user.id, userId),
      eq(user.world_id, filter.world_id)
    ))
    .limit(1)
  
  return users[0] || null
}

/**
 * @description Создать пользователя с автоматическим world_id
 * 
 * @param userData - Данные пользователя
 * @param context - Контекст мира
 * @returns Созданный пользователь
 */
export async function createWorldUser(
  userData: { email: string; password?: string },
  context: WorldContext = getCurrentWorldContext()
) {
  const dataWithWorld = addWorldId(userData, context)
  
  const [newUser] = await db
    .insert(user)
    .values(dataWithWorld)
    .returning()
  
  return newUser
}

/**
 * @description Получить чаты пользователя с изоляцией мира
 * 
 * @param userId - ID пользователя
 * @param context - Контекст мира
 * @returns Чаты пользователя в текущем мире
 */
export async function getWorldUserChats(
  userId: string,
  context: WorldContext = getCurrentWorldContext()
) {
  const filter = createWorldFilter(context)
  
  return await db
    .select()
    .from(chat)
    .where(and(
      eq(chat.userId, userId),
      eq(chat.world_id, filter.world_id),
      isNull(chat.deletedAt)
    ))
    .orderBy(desc(chat.createdAt))
}

/**
 * @description Получить чат по ID с проверкой изоляции
 * 
 * @param chatId - ID чата
 * @param context - Контекст мира
 * @returns Чат если доступен в текущем мире
 */
export async function getWorldChatById(
  chatId: string,
  context: WorldContext = getCurrentWorldContext()
) {
  const filter = createWorldFilter(context)
  
  const chats = await db
    .select()
    .from(chat)
    .where(and(
      eq(chat.id, chatId),
      eq(chat.world_id, filter.world_id),
      isNull(chat.deletedAt)
    ))
    .limit(1)
  
  return chats[0] || null
}

/**
 * @description Создать чат с автоматическим world_id
 * 
 * @param chatData - Данные чата
 * @param context - Контекст мира
 * @returns Созданный чат
 */
export async function createWorldChat(
  chatData: { 
    title: string
    userId: string
    createdAt: Date
    published_until?: Date | null
  },
  context: WorldContext = getCurrentWorldContext()
) {
  const dataWithWorld = addWorldId(chatData, context)
  
  const [newChat] = await db
    .insert(chat)
    .values(dataWithWorld)
    .returning()
  
  return newChat
}

/**
 * @description Получить артефакты пользователя с изоляцией мира
 * 
 * @param userId - ID пользователя
 * @param context - Контекст мира
 * @returns Артефакты пользователя в текущем мире
 */
export async function getWorldUserArtifacts(
  userId: string,
  context: WorldContext = getCurrentWorldContext()
) {
  const filter = createWorldFilter(context)
  
  return await db
    .select()
    .from(artifact)
    .where(and(
      eq(artifact.userId, userId),
      eq(artifact.world_id, filter.world_id),
      isNull(artifact.deletedAt)
    ))
    .orderBy(desc(artifact.createdAt))
}

/**
 * @description Получить артефакт по ID с проверкой изоляции
 * 
 * @param artifactId - ID артефакта
 * @param createdAt - Timestamp версии (опционально, для latest)
 * @param context - Контекст мира
 * @returns Артефакт если доступен в текущем мире
 */
export async function getWorldArtifactById(
  artifactId: string,
  createdAt?: Date,
  context: WorldContext = getCurrentWorldContext()
) {
  const filter = createWorldFilter(context)
  
  let query = db
    .select()
    .from(artifact)
    .where(and(
      eq(artifact.id, artifactId),
      eq(artifact.world_id, filter.world_id),
      isNull(artifact.deletedAt)
    ))
  
  if (createdAt) {
    query = query.where(eq(artifact.createdAt, createdAt))
  } else {
    // Получаем последнюю версию
    query = query.orderBy(desc(artifact.createdAt))
  }
  
  const artifacts = await query.limit(1)
  return artifacts[0] || null
}

/**
 * @description Создать артефакт с автоматическим world_id
 * 
 * @param artifactData - Данные артефакта
 * @param context - Контекст мира
 * @returns Созданный артефакт
 */
export async function createWorldArtifact(
  artifactData: {
    id?: string
    title: string
    kind: 'text' | 'code' | 'image' | 'sheet' | 'site'
    userId: string
    authorId?: string
    content_text?: string
    content_url?: string
    content_site_definition?: any
    summary?: string
    createdAt: Date
  },
  context: WorldContext = getCurrentWorldContext()
) {
  const dataWithWorld = addWorldId(artifactData, context)
  
  const [newArtifact] = await db
    .insert(artifact)
    .values(dataWithWorld)
    .returning()
  
  return newArtifact
}

/**
 * @description Получить сообщения чата с изоляцией мира
 * 
 * @param chatId - ID чата
 * @param context - Контекст мира
 * @returns Сообщения чата в текущем мире
 */
export async function getWorldChatMessages(
  chatId: string,
  context: WorldContext = getCurrentWorldContext()
) {
  const filter = createWorldFilter(context)
  
  return await db
    .select()
    .from(message)
    .where(and(
      eq(message.chatId, chatId),
      eq(message.world_id, filter.world_id)
    ))
    .orderBy(asc(message.createdAt))
}

/**
 * @description Создать сообщение с автоматическим world_id
 * 
 * @param messageData - Данные сообщения
 * @param context - Контекст мира
 * @returns Созданное сообщение
 */
export async function createWorldMessage(
  messageData: {
    chatId: string
    role: string
    parts: any
    attachments: any
    createdAt: Date
  },
  context: WorldContext = getCurrentWorldContext()
) {
  const dataWithWorld = addWorldId(messageData, context)
  
  const [newMessage] = await db
    .insert(message)
    .values(dataWithWorld)
    .returning()
  
  return newMessage
}

/**
 * @description Очистить все данные тестового мира
 * 
 * @feature Используется при cleanup после тестов
 * @param worldId - ID мира для очистки
 * @returns Статистика удаленных записей
 */
export async function cleanupWorldData(worldId: string) {
  console.log(`🧹 Cleaning up world data: ${worldId}`)
  
  // Удаляем в порядке зависимостей
  const deletedMessages = await db
    .delete(message)
    .where(eq(message.world_id, worldId))
    .returning({ id: message.id })
  
  const deletedSuggestions = await db
    .delete(suggestion)
    .where(eq(suggestion.world_id, worldId))
    .returning({ id: suggestion.id })
  
  const deletedArtifacts = await db
    .delete(artifact)
    .where(eq(artifact.world_id, worldId))
    .returning({ id: artifact.id })
  
  const deletedChats = await db
    .delete(chat)
    .where(eq(chat.world_id, worldId))
    .returning({ id: chat.id })
  
  const deletedUsers = await db
    .delete(user)
    .where(eq(user.world_id, worldId))
    .returning({ id: user.id })
  
  const stats = {
    users: deletedUsers.length,
    chats: deletedChats.length,
    artifacts: deletedArtifacts.length,
    messages: deletedMessages.length,
    suggestions: deletedSuggestions.length
  }
  
  console.log(`✅ World ${worldId} cleanup complete:`, stats)
  return stats
}

/**
 * @description Проверить изоляцию мира - нет cross-contamination
 * 
 * @feature Debug утилита для валидации изоляции
 * @param worldId - ID мира для проверки
 * @returns Статистика данных в мире
 */
export async function validateWorldIsolation(worldId: string) {
  const stats = {
    users: await db.select().from(user).where(eq(user.world_id, worldId)),
    chats: await db.select().from(chat).where(eq(chat.world_id, worldId)),
    artifacts: await db.select().from(artifact).where(eq(artifact.world_id, worldId)),
    messages: await db.select().from(message).where(eq(message.world_id, worldId)),
    suggestions: await db.select().from(suggestion).where(eq(suggestion.world_id, worldId))
  }
  
  console.log(`🔍 World ${worldId} isolation check:`, {
    users: stats.users.length,
    chats: stats.chats.length,
    artifacts: stats.artifacts.length,
    messages: stats.messages.length,
    suggestions: stats.suggestions.length
  })
  
  return stats
}

// END OF: lib/db/world-queries.ts