/**
 * @file tests/helpers/seed-engine.ts
 * @description Высокопроизводительный движок для инициализации тестовых миров с bulk операциями
 * @version 1.0.0
 * @date 2025-06-18
 * @updated Создание оптимизированной системы seed скриптов для системной оптимизации E2E тестов
 */

/** HISTORY:
 * v1.0.0 (2025-06-18): Создание высокопроизводительного seed engine с bulk операциями для быстрого setup миров
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { user, artifact, chat, message, suggestion } from '@/lib/db/schema'
import type { WorldId, WorldUser, WorldArtifact, WorldChat } from './worlds.config'
import { getWorldDefinition } from './worlds.config'

/**
 * @description Результат инициализации мира с производительными метриками
 */
export interface SeedResult {
  worldId: WorldId
  totalTime: number
  operations: {
    users: { count: number; time: number }
    artifacts: { count: number; time: number }
    chats: { count: number; time: number }
    messages: { count: number; time: number }
  }
  createdEntities: {
    users: string[]
    artifacts: string[]
    chats: string[]
  }
}

/**
 * @description Высокопроизводительный движок для seed операций
 */
export class SeedEngine {
  private fixturesPath: string
  
  constructor() {
    this.fixturesPath = join(process.cwd(), 'tests/fixtures/worlds')
  }

  /**
   * @description Инициализация мира с bulk операциями для максимальной производительности
   */
  async seedWorld(worldId: WorldId): Promise<SeedResult> {
    const startTime = Date.now()
    console.log(`🌱 SEED ENGINE: Initializing world ${worldId}...`)
    
    const worldDef = getWorldDefinition(worldId)
    const result: SeedResult = {
      worldId,
      totalTime: 0,
      operations: {
        users: { count: 0, time: 0 },
        artifacts: { count: 0, time: 0 },
        chats: { count: 0, time: 0 },
        messages: { count: 0, time: 0 }
      },
      createdEntities: {
        users: [],
        artifacts: [],
        chats: []
      }
    }

    try {
      // ЭТАП 1: Bulk создание пользователей
      if (worldDef.users.length > 0) {
        const userStart = Date.now()
        const userIds = await this.bulkCreateUsers(worldDef.users, worldId)
        result.operations.users = {
          count: userIds.length,
          time: Date.now() - userStart
        }
        result.createdEntities.users = userIds
        console.log(`✅ Created ${userIds.length} users in ${result.operations.users.time}ms`)
      }

      // ЭТАП 2: Bulk создание артефактов с контентом
      if (worldDef.artifacts.length > 0) {
        const artifactStart = Date.now()
        const artifactIds = await this.bulkCreateArtifacts(worldDef.artifacts, worldId, worldDef.users)
        result.operations.artifacts = {
          count: artifactIds.length,
          time: Date.now() - artifactStart
        }
        result.createdEntities.artifacts = artifactIds
        console.log(`✅ Created ${artifactIds.length} artifacts in ${result.operations.artifacts.time}ms`)
      }

      // ЭТАП 3: Bulk создание чатов
      if (worldDef.chats.length > 0) {
        const chatStart = Date.now()
        const chatIds = await this.bulkCreateChats(worldDef.chats, worldId, worldDef.users)
        result.operations.chats = {
          count: chatIds.length,
          time: Date.now() - chatStart
        }
        result.createdEntities.chats = chatIds
        console.log(`✅ Created ${chatIds.length} chats in ${result.operations.chats.time}ms`)
      }

      result.totalTime = Date.now() - startTime
      console.log(`🎉 SEED ENGINE: World ${worldId} initialized in ${result.totalTime}ms`)
      
      return result

    } catch (error) {
      console.error(`❌ SEED ENGINE ERROR: Failed to seed world ${worldId}:`, error)
      throw error
    }
  }

  /**
   * @description Bulk создание пользователей одним запросом
   */
  private async bulkCreateUsers(users: WorldUser[], worldId: WorldId): Promise<string[]> {
    const timestamp = Date.now()
    const userRecords = users.map((userData, index) => ({
      id: this.generateUserId(userData.testId, timestamp, index),
      email: userData.email,
      name: userData.name,
      world_id: worldId, // Добавляем world_id для изоляции данных по мирам
    }))

    // Одна bulk операция вместо N отдельных INSERT
    const insertedUsers = await db.insert(user).values(userRecords).returning({ id: user.id })
    
    return insertedUsers.map(u => u.id)
  }

  /**
   * @description Bulk создание артефактов с загрузкой контента из файлов
   */
  private async bulkCreateArtifacts(
    artifacts: WorldArtifact[], 
    worldId: WorldId, 
    users: WorldUser[]
  ): Promise<string[]> {
    const timestamp = Date.now()
    
    // Параллельная загрузка всех файлов контента
    const contentPromises = artifacts.map(async (artifactData, index) => {
      const content = artifactData.contentPath 
        ? await this.loadFixtureContent(worldId, artifactData.contentPath)
        : null

      return {
        id: this.generateArtifactId(artifactData.testId, timestamp, index),
        title: artifactData.title,
        kind: artifactData.kind,
        userId: this.findUserDbId(artifactData.ownerId, users, timestamp),
        authorId: this.findUserDbId(artifactData.ownerId, users, timestamp), // Автор = владелец
        // Используем sparse columns для оптимального хранения
        content_text: this.getTextContent(artifactData.kind, content),
        content_url: this.getUrlContent(artifactData.kind, content),
        content_site_definition: this.getSiteContent(artifactData.kind, content),
        summary: `Test fixture: ${artifactData.title}`, // Placeholder summary для тестов
        publication_state: [], // Пустой массив для тестовых данных
        deletedAt: null,
        createdAt: new Date(),
        world_id: worldId, // Добавляем world_id для изоляции данных по мирам
      }
    })

    const artifactRecords = await Promise.all(contentPromises)
    
    // Одна bulk операция для всех артефактов
    const insertedArtifacts = await db.insert(artifact).values(artifactRecords).returning({ id: artifact.id })
    
    return insertedArtifacts.map(a => a.id)
  }

  /**
   * @description Bulk создание чатов с сообщениями
   */
  private async bulkCreateChats(
    chats: WorldChat[], 
    worldId: WorldId, 
    users: WorldUser[]
  ): Promise<string[]> {
    const timestamp = Date.now()
    
    // Создаем чаты bulk операцией
    const chatRecords = chats.map((chatData, index) => ({
      id: this.generateChatId(chatData.testId, timestamp, index),
      title: chatData.title,
      userId: this.findUserDbId(chatData.ownerId, users, timestamp),
      createdAt: new Date(),
      published_until: chatData.publishedUntil ? new Date(chatData.publishedUntil) : null,
      world_id: worldId, // Добавляем world_id для изоляции данных по мирам
    }))

    const insertedChats = await db.insert(chat).values(chatRecords).returning({ id: chat.id })
    
    // Если есть сообщения для чатов, создаем их bulk операциями
    for (let i = 0; i < chats.length; i++) {
      const chatData = chats[i]
      const chatDbId = insertedChats[i].id
      
      if (chatData.messagesPath) {
        await this.bulkCreateMessages(chatDbId, worldId, chatData.messagesPath)
      }
    }
    
    return insertedChats.map(c => c.id)
  }

  /**
   * @description Bulk создание сообщений чата
   */
  private async bulkCreateMessages(chatId: string, worldId: WorldId, messagesPath: string): Promise<void> {
    try {
      const messagesData = await this.loadFixtureContent(worldId, messagesPath)
      const chatHistory = JSON.parse(messagesData)
      
      if (chatHistory.messages && Array.isArray(chatHistory.messages)) {
        const messageRecords = chatHistory.messages.map((msg: any) => {
          // Конвертация старого формата фикстур в новый формат AI SDK Message_v2
          const parts = []
          
          // Добавляем текстовую часть если есть content
          if (msg.content) {
            parts.push({ type: 'text', text: msg.content })
          }
          
          // Добавляем tool invocations как части сообщения (не как attachments!)
          if (msg.toolInvocations && Array.isArray(msg.toolInvocations)) {
            msg.toolInvocations.forEach((toolInvocation: any) => {
              parts.push({
                type: 'tool-invocation',
                toolInvocation: toolInvocation
              })
            })
          }
          
          return {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            chatId,
            role: msg.role,
            parts: parts, // Массив частей сообщения (text + tool-invocations)
            attachments: msg.attachments || [], // Файловые вложения (если есть)
            createdAt: new Date(msg.timestamp || Date.now()),
            world_id: worldId, // Добавляем world_id для изоляции данных по мирам
          }
        })

        await db.insert(message).values(messageRecords)
      }
    } catch (error) {
      console.warn(`⚠️ Could not load messages for chat ${chatId}:`, error)
    }
  }

  /**
   * @description Полная очистка мира с помощью bulk DELETE операций
   */
  async cleanupWorld(worldId: WorldId): Promise<void> {
    console.log(`🧹 SEED ENGINE: Cleaning up world ${worldId}...`)
    
    try {
      // Удаляем в обратном порядке зависимостей для соблюдения FK constraints
      // 1. Сообщения
      await db.delete(message).where(eq(message.world_id, worldId))
      // 2. Предложения
      await db.delete(suggestion).where(eq(suggestion.world_id, worldId))
      // 3. Артефакты
      await db.delete(artifact).where(eq(artifact.world_id, worldId))
      // 4. Чаты
      await db.delete(chat).where(eq(chat.world_id, worldId))
      // 5. Пользователи
      await db.delete(user).where(eq(user.world_id, worldId))
      
      console.log(`✅ SEED ENGINE: World ${worldId} cleaned up successfully`)
      
    } catch (error) {
      console.error(`❌ SEED ENGINE: Failed to cleanup world ${worldId}:`, error)
      throw error
    }
  }

  /**
   * @description Загрузка контента fixture файла
   */
  private async loadFixtureContent(worldId: WorldId, contentPath: string): Promise<string> {
    const worldDir = worldId.toLowerCase().replace(/_/g, '-').replace('content-library-base', 'library')
    const fullPath = join(this.fixturesPath, worldDir, contentPath)
    
    try {
      return await readFile(fullPath, 'utf-8')
    } catch (error) {
      console.warn(`⚠️ Could not load fixture ${fullPath}:`, error)
      return `[FIXTURE_MISSING: ${contentPath}]`
    }
  }

  /**
   * @description Генерация консистентных ID для тестирования
   */
  private generateUserId(testId: string, timestamp: number, index: number): string {
    // UUID формат для совместимости с PostgreSQL
    const hex = (timestamp + index).toString(16).padStart(12, '0')
    return `550e8400-e29b-41d4-a716-${hex}`
  }

  private generateArtifactId(testId: string, timestamp: number, index: number): string {
    const hex = (timestamp + index + 1000).toString(16).padStart(12, '0')
    return `660e8400-e29b-41d4-a716-${hex}`
  }

  private generateChatId(testId: string, timestamp: number, index: number): string {
    const hex = (timestamp + index + 2000).toString(16).padStart(12, '0')
    return `770e8400-e29b-41d4-a716-${hex}`
  }

  /**
   * @description Поиск DB ID пользователя по testId
   */
  private findUserDbId(ownerTestId: string, users: WorldUser[], timestamp: number): string {
    const userIndex = users.findIndex(u => u.testId === ownerTestId)
    if (userIndex === -1) {
      throw new Error(`User with testId ${ownerTestId} not found in world definition`)
    }
    return this.generateUserId(ownerTestId, timestamp, userIndex)
  }

  /**
   * @description Получение контента для sparse columns на основе типа артефакта
   */
  private getTextContent(kind: string, content: string | null): string | null {
    return ['text', 'code', 'sheet'].includes(kind) ? content : null
  }

  private getUrlContent(kind: string, content: string | null): string | null {
    return kind === 'image' ? content : null
  }

  private getSiteContent(kind: string, content: string | null): any | null {
    if (kind === 'site' && content) {
      try {
        return JSON.parse(content)
      } catch {
        return null
      }
    }
    return null
  }
}

/**
 * @description Основной экспортируемый экземпляр seed engine
 */
export const seedEngine = new SeedEngine()

/**
 * @description Utility функция для быстрой инициализации мира в тестах
 */
export async function quickSeedWorld(worldId: WorldId): Promise<SeedResult> {
  return await seedEngine.seedWorld(worldId)
}

/**
 * @description Utility функция для быстрой очистки мира в тестах
 */
export async function quickCleanupWorld(worldId: WorldId): Promise<void> {
  return await seedEngine.cleanupWorld(worldId)
}

// END OF: tests/helpers/seed-engine.ts