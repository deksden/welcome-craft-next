/**
 * @file tests/helpers/world-setup.ts
 * @description Утилиты для инициализации и очистки тестовых миров
 * @version 1.0.0
 * @date 2025-06-18
 * @updated Начальная реализация без изменений БД (Phase 1)
 */

/** HISTORY:
 * v1.0.0 (2025-06-18): Базовая реализация для Phase 1 без world_id в БД
 */

import { readFile } from 'fs/promises'
import { join } from 'path'
import type { WorldId, WorldDefinition, WorldUser, WorldArtifact, WorldChat } from './worlds.config'
import { getWorldDefinition, validateWorld } from './worlds.config'

/**
 * @description Результат инициализации мира
 */
export interface WorldSetupResult {
  worldId: WorldId
  users: SetupUser[]
  artifacts: SetupArtifact[]
  chats: SetupChat[]
  cleanup: () => Promise<void>
}

/**
 * @description Созданный пользователь в тестовом мире
 */
export interface SetupUser {
  testId: string
  name: string
  email: string
  role: string
  /** Реальный UUID из БД (если создан) */
  dbId?: string
}

/**
 * @description Созданный артефакт в тестовом мире
 */
export interface SetupArtifact {
  testId: string
  title: string
  kind: string
  ownerId: string
  /** Реальный ID из БД (если создан) */
  dbId?: string
  /** Загруженный контент */
  content?: string
}

/**
 * @description Созданный чат в тестовом мире
 */
export interface SetupChat {
  testId: string
  title: string
  ownerId: string
  /** Реальный ID из БД (если создан) */
  dbId?: string
}

/**
 * @description Инициализирует тестовый мир для выполнения E2E тестов
 * 
 * @feature Phase 1 implementation - работает без изменений БД
 * @param worldId - ID мира для инициализации
 * @returns Promise с результатом настройки и функцией очистки
 */
export async function setupWorld(worldId: WorldId): Promise<WorldSetupResult> {
  console.log(`🌍 Setting up world: ${worldId}`)
  
  // Валидация мира
  validateWorld(worldId)
  const worldDef = getWorldDefinition(worldId)
  
  // Инициализация компонентов
  const users = await setupUsers(worldDef.users)
  const artifacts = await setupArtifacts(worldDef.artifacts, users)
  const chats = await setupChats(worldDef.chats, users)
  
  console.log(`✅ World ${worldId} setup complete:`, {
    users: users.length,
    artifacts: artifacts.length,
    chats: chats.length
  })
  
  // Функция очистки
  const cleanup = async () => {
    if (worldDef.settings.autoCleanup) {
      await cleanupWorld(worldId, { users, artifacts, chats })
    }
  }
  
  return {
    worldId,
    users,
    artifacts,
    chats,
    cleanup
  }
}

/**
 * @description Создает пользователей для тестового мира
 * 
 * @feature Phase 2: Создание пользователей в БД с world_id изоляцией
 */
async function setupUsers(userDefs: WorldUser[]): Promise<SetupUser[]> {
  const users: SetupUser[] = []
  
  // Импортируем DB утилиты динамически для избежания server-only ошибок
  const { createWorldUser } = await import('@/lib/db/world-queries')
  const { getCurrentWorldContext } = await import('@/lib/db/world-context')
  
  const worldContext = getCurrentWorldContext()
  
  for (const userDef of userDefs) {
    let dbId: string | undefined
    
    try {
      // Phase 2: Создаем пользователя в БД с world_id
      const dbUser = await createWorldUser({
        email: userDef.email,
        password: 'test-password' // Все тестовые пользователи имеют одинаковый пароль
      }, worldContext)
      
      dbId = dbUser.id
      console.log(`👤 User created in DB: ${userDef.name} (${userDef.testId}) -> ${dbId}`)
    } catch (error) {
      console.warn(`⚠️  Failed to create user ${userDef.testId} in DB:`, error)
      // Fallback to Phase 1 behavior
    }
    
    const user: SetupUser = {
      testId: userDef.testId,
      name: userDef.name,
      email: userDef.email,
      role: userDef.role,
      dbId // Теперь включаем реальный DB ID
    }
    
    users.push(user)
  }
  
  return users
}

/**
 * @description Создает артефакты для тестового мира
 * 
 * @feature Phase 2: Создание артефактов в БД с world_id изоляцией
 */
async function setupArtifacts(
  artifactDefs: WorldArtifact[], 
  users: SetupUser[]
): Promise<SetupArtifact[]> {
  const artifacts: SetupArtifact[] = []
  
  // Импортируем DB утилиты динамически
  const { createWorldArtifact } = await import('@/lib/db/world-queries')
  const { getCurrentWorldContext } = await import('@/lib/db/world-context')
  
  const worldContext = getCurrentWorldContext()
  
  for (const artifactDef of artifactDefs) {
    // Проверяем владельца
    const owner = users.find(u => u.testId === artifactDef.ownerId)
    if (!owner) {
      throw new Error(`Artifact ${artifactDef.testId} owner ${artifactDef.ownerId} not found`)
    }
    
    // Загружаем контент из fixture файла
    let content: string | undefined
    if (artifactDef.contentPath) {
      try {
        const fixturePath = join(
          process.cwd(), 
          'tests/fixtures/worlds', 
          artifactDef.contentPath
        )
        content = await readFile(fixturePath, 'utf-8')
      } catch (error) {
        console.warn(`⚠️  Could not load fixture: ${artifactDef.contentPath}`)
        content = createPlaceholderContent(artifactDef)
      }
    } else {
      content = createPlaceholderContent(artifactDef)
    }
    
    let dbId: string | undefined
    
    try {
      // Phase 2: Создаем артефакт в БД с world_id
      const artifactData = {
        title: artifactDef.title,
        kind: artifactDef.kind as any,
        userId: owner.dbId!, // Используем реальный DB ID владельца
        summary: `Test artifact: ${artifactDef.title}`,
        createdAt: new Date(),
        // Определяем поле контента в зависимости от типа
        ...(artifactDef.kind === 'site' 
          ? { content_site_definition: JSON.parse(content || '{}') }
          : { content_text: content }
        )
      }
      
      const dbArtifact = await createWorldArtifact(artifactData, worldContext)
      dbId = dbArtifact.id
      
      console.log(`📄 Artifact created in DB: ${artifactDef.title} (${artifactDef.testId}) -> ${dbId}`)
    } catch (error) {
      console.warn(`⚠️  Failed to create artifact ${artifactDef.testId} in DB:`, error)
      // Fallback to Phase 1 behavior
    }
    
    const artifact: SetupArtifact = {
      testId: artifactDef.testId,
      title: artifactDef.title,
      kind: artifactDef.kind,
      ownerId: artifactDef.ownerId,
      content,
      dbId // Теперь включаем реальный DB ID
    }
    
    artifacts.push(artifact)
  }
  
  return artifacts
}

/**
 * @description Создает чаты для тестового мира
 */
async function setupChats(
  chatDefs: WorldChat[], 
  users: SetupUser[]
): Promise<SetupChat[]> {
  const chats: SetupChat[] = []
  
  for (const chatDef of chatDefs) {
    const owner = users.find(u => u.testId === chatDef.ownerId)
    if (!owner) {
      throw new Error(`Chat ${chatDef.testId} owner ${chatDef.ownerId} not found`)
    }
    
    const chat: SetupChat = {
      testId: chatDef.testId,
      title: chatDef.title,
      ownerId: chatDef.ownerId
      // dbId: будет добавлен в Phase 2
    }
    
    chats.push(chat)
    console.log(`💬 Chat prepared: ${chat.title} (${chat.testId})`)
  }
  
  return chats
}

/**
 * @description Создает placeholder контент для артефактов без fixture файлов
 */
function createPlaceholderContent(artifactDef: WorldArtifact): string {
  switch (artifactDef.kind) {
    case 'text':
      return `# ${artifactDef.title}\n\nThis is a placeholder content for testing purposes.\n\nTags: ${artifactDef.tags?.join(', ') || 'none'}`
    
    case 'code':
      return `// ${artifactDef.title}\n// Placeholder code for testing\n\nfunction placeholder() {\n  return 'test content';\n}`
    
    case 'sheet':
      return `Name,Email,Role\nTest User,test@example.com,Test Role\nPlaceholder,placeholder@example.com,Placeholder`
    
    case 'site':
      return JSON.stringify({
        blocks: [
          {
            type: 'hero',
            slots: {
              title: { content: artifactDef.title },
              subtitle: { content: 'Placeholder site for testing' }
            }
          }
        ]
      }, null, 2)
    
    default:
      return `Placeholder content for ${artifactDef.kind} artifact: ${artifactDef.title}`
  }
}

/**
 * @description Очищает тестовый мир после выполнения тестов
 * 
 * @feature Phase 2: Полная очистка данных из БД по world_id
 */
export async function cleanupWorld(
  worldId: WorldId, 
  setupResult: Omit<WorldSetupResult, 'worldId' | 'cleanup'>
): Promise<void> {
  console.log(`🧹 Cleaning up world: ${worldId}`)
  
  const worldDef = getWorldDefinition(worldId)
  
  if (!worldDef.settings.autoCleanup) {
    console.log(`⏸️  Auto-cleanup disabled for world ${worldId}`)
    return
  }
  
  try {
    // Phase 2: Полная очистка данных из БД
    const { cleanupWorldData } = await import('@/lib/db/world-queries')
    const cleanupStats = await cleanupWorldData(worldId)
    
    console.log(`✅ World ${worldId} cleanup complete:`, cleanupStats)
  } catch (error) {
    console.warn(`⚠️  World ${worldId} cleanup failed:`, error)
    
    // Fallback: Phase 1 логирование
    console.log(`📊 World ${worldId} local cleanup:`, {
      usersRemoved: setupResult.users.length,
      artifactsRemoved: setupResult.artifacts.length,
      chatsRemoved: setupResult.chats.length
    })
  }
}

/**
 * @description Получает данные уже инициализированного мира
 * 
 * @feature Утилита для доступа к данным мира в тестах
 */
export function getWorldData(worldId: WorldId) {
  const worldDef = getWorldDefinition(worldId)
  
  return {
    definition: worldDef,
    getUser: (testId: string) => worldDef.users.find(u => u.testId === testId),
    getArtifact: (testId: string) => worldDef.artifacts.find(a => a.testId === testId),
    getChat: (testId: string) => worldDef.chats.find(c => c.testId === testId),
    getUserByRole: (role: string) => worldDef.users.find(u => u.role === role)
  }
}

/**
 * @description Проверяет готовность мира к выполнению тестов
 */
export async function verifyWorldSetup(setupResult: WorldSetupResult): Promise<boolean> {
  const { worldId, users, artifacts } = setupResult
  
  console.log(`🔍 Verifying world setup: ${worldId}`)
  
  // Базовые проверки
  if (users.length === 0) {
    throw new Error(`World ${worldId} has no users`)
  }
  
  // Проверяем что все пользователи имеют уникальные testId
  const userIds = users.map(u => u.testId)
  if (new Set(userIds).size !== userIds.length) {
    throw new Error(`World ${worldId} has duplicate user testIds`)
  }
  
  console.log(`✅ World ${worldId} verification passed`)
  return true
}

// END OF: tests/helpers/world-setup.ts