/**
 * @file tests/helpers/use-case-integration.ts
 * @description Интеграция Use Cases и Worlds с существующей тестовой инфраструктурой
 * @version 1.1.0
 * @date 2025-06-28
 * @updated UNIFIED COOKIE ARCHITECTURE - миграция на единый test-session источник для world isolation
 */

/** HISTORY:
 * v1.1.0 (2025-06-28): UNIFIED COOKIE ARCHITECTURE - убран устаревший test-world-id cookie, все данные теперь в test-session
 * v1.0.0 (2025-06-18): Базовая интеграция для Phase 1
 */

import type { Page } from '@playwright/test'
import type { WorldId } from './worlds.config'
import { setupWorld, type WorldSetupResult } from './world-setup'
import { UIHelpers } from './ui-helpers'

/**
 * @description Контекст Use Case теста с автоматической инициализацией мира
 */
export interface UseCaseContext {
  /** Идентификатор Use Case */
  useCaseId: string
  /** Инициализированный мир */
  world: WorldSetupResult
  /** Playwright page объект */
  page: Page
  /** Утилиты для взаимодействия с элементами */
  ui: UseCaseUIHelpers & { uiHelpers: UIHelpers }
}

/**
 * @description UI утилиты специфичные для Use Case тестов
 */
export interface UseCaseUIHelpers {
  /** Авторизация под пользователем из мира */
  loginAs: (userTestId: string) => Promise<void>
  /** Переход к артефакту из мира */
  navigateToArtifact: (artifactTestId: string) => Promise<void>
  /** Открытие чата из мира */
  openChat: (chatTestId: string) => Promise<void>
  /** Ожидание завершения AI операций */
  waitForAICompletion: () => Promise<void>
  /** Проверка статуса публикации */
  checkPublicationStatus: (testId: string, expectedStatus: 'published' | 'private') => Promise<void>
}

/**
 * @description Инициализирует контекст для выполнения Use Case теста
 * 
 * @feature Автоматическая настройка мира, пользователя и UI утилит
 * @param useCaseId - Идентификатор Use Case (UC-01, UC-02, etc.)
 * @param worldId - Идентификатор мира для инициализации
 * @param page - Playwright page объект
 * @returns Promise с полным контекстом для теста
 */
export async function initializeUseCaseTest(
  useCaseId: string,
  worldId: WorldId,
  page: Page
): Promise<UseCaseContext> {
  console.log(`🎯 Initializing Use Case test: ${useCaseId} in world ${worldId}`)
  
  // Инициализация мира
  const world = await setupWorld(worldId)
  
  // Создание UI утилит
  const ui = createUIHelpers(page, world)
  
  // Базовая настройка страницы
  await setupPageDefaults(page)
  
  const context: UseCaseContext = {
    useCaseId,
    world,
    page,
    ui
  }
  
  console.log(`✅ Use Case test context ready: ${useCaseId}`)
  return context
}

/**
 * @description Создает UI утилиты для работы с элементами в контексте мира
 */
function createUIHelpers(page: Page, world: WorldSetupResult): UseCaseUIHelpers & { uiHelpers: UIHelpers } {
  const uiHelpers = new UIHelpers(page)
  
  return {
    uiHelpers,
    async loginAs(userTestId: string) {
      const user = world.users.find(u => u.testId === userTestId)
      if (!user) {
        throw new Error(`User ${userTestId} not found in world ${world.worldId}`)
      }
      
      console.log(`👤 Logging in as: ${user.name} (${userTestId})`)
      
      // Phase 2: Устанавливаем world context cookie + test-auth
      await page.goto('/')
      
      await page.evaluate(({ email, name, testId, worldId, userId }) => {
        // UNIFIED COOKIE ARCHITECTURE: используем только test-session с worldId внутри
        const sessionUser = {
          email,
          name,
          id: userId || `test-user-${testId}`
        }
        
        // Единый test-session cookie содержит и пользователя и world isolation
        const sessionData = {
          user: sessionUser,
          worldId: worldId, // World isolation в составе test-session
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 часа
        }
        
        document.cookie = `test-session=${JSON.stringify(sessionData)}; path=/; domain=.localhost`
      }, {
        email: user.email,
        name: user.name,
        testId: userTestId,
        worldId: world.worldId,
        userId: user.dbId
      })
      
      await page.reload()
    },

    async navigateToArtifact(artifactTestId: string) {
      const artifact = world.artifacts.find(a => a.testId === artifactTestId)
      if (!artifact) {
        throw new Error(`Artifact ${artifactTestId} not found in world ${world.worldId}`)
      }
      
      console.log(`📄 Navigating to artifact: ${artifact.title} (${artifactTestId})`)
      
      // Phase 1: Навигация через UI
      // В Phase 2: Прямая навигация по DB ID
      await page.goto('/artifacts')
      await page.getByText(artifact.title).first().click()
    },

    async openChat(chatTestId: string) {
      const chat = world.chats.find(c => c.testId === chatTestId)
      if (!chat) {
        throw new Error(`Chat ${chatTestId} not found in world ${world.worldId}`)
      }
      
      console.log(`💬 Opening chat: ${chat.title} (${chatTestId})`)
      
      await page.goto('/chat')
      // Поиск чата в сайдбаре
      await page.getByText(chat.title).first().click()
    },

    async waitForAICompletion() {
      console.log(`🤖 Waiting for AI completion...`)
      
      // Ожидание исчезновения skeleton loading состояний
      await page.waitForFunction(() => {
        const skeletons = document.querySelectorAll('[data-testid*="skeleton"]')
        return skeletons.length === 0
      }, { timeout: 30000 })
      
      // Дополнительная пауза для стабилизации
      await page.waitForTimeout(1000)
    },

    async checkPublicationStatus(testId: string, expectedStatus: 'published' | 'private') {
      console.log(`🔍 Checking publication status: ${testId} should be ${expectedStatus}`)
      
      // Phase 1: Проверка через UI индикаторы
      const isPublished = expectedStatus === 'published'
      
      if (isPublished) {
        // Ожидаем badge "Published" или аналогичный индикатор
        await page.getByTestId(`${testId}-published-badge`).waitFor({ 
          state: 'visible',
          timeout: 5000 
        })
      } else {
        // Ожидаем отсутствие badge или индикатор "Private"
        await page.getByTestId(`${testId}-published-badge`).waitFor({ 
          state: 'hidden',
          timeout: 5000 
        })
      }
    }
  }
}

/**
 * @description Базовая настройка страницы для Use Case тестов
 */
async function setupPageDefaults(page: Page): Promise<void> {
  // Установка размера viewport для консистентности
  await page.setViewportSize({ width: 1280, height: 720 })
  
  // Предотвращение анимаций для стабильности тестов
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-delay: 0.01ms !important;
        transition-duration: 0.01ms !important;
        transition-delay: 0.01ms !important;
      }
    `
  })
}

/**
 * @description Финализирует Use Case тест и очищает ресурсы
 * 
 * @param context - Контекст Use Case теста
 */
export async function finalizeUseCaseTest(context: UseCaseContext): Promise<void> {
  console.log(`🧹 Finalizing Use Case test: ${context.useCaseId}`)
  
  // Выполняем cleanup мира
  await context.world.cleanup()
  
  console.log(`✅ Use Case test finalized: ${context.useCaseId}`)
}

/**
 * @description Утилита для создания E2E теста из Use Case спецификации
 * 
 * @feature Декоратор для автоматической инициализации мира
 */
export function createUseCaseTest(
  useCaseId: string,
  worldId: WorldId,
  testImplementation: (context: UseCaseContext) => Promise<void>
) {
  return async ({ page }: { page: Page }) => {
    // Инициализация контекста
    const context = await initializeUseCaseTest(useCaseId, worldId, page)
    
    try {
      // Выполнение теста
      await testImplementation(context)
    } finally {
      // Гарантированная очистка
      await finalizeUseCaseTest(context)
    }
  }
}

/**
 * @description Маркеры для связи тестов с Use Cases и AI фикстурами
 * 
 * @feature Метаданные для трекинга покрытия Use Cases
 */
export function useCaseMetadata(useCaseId: string, aiFixtures?: string[]) {
  return {
    useCase: useCaseId,
    aiFixtures: aiFixtures || [],
    timestamp: new Date().toISOString()
  }
}

// END OF: tests/helpers/use-case-integration.ts