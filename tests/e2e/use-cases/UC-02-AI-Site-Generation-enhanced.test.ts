/**
 * @file tests/e2e/use-cases/UC-02-AI-Site-Generation-enhanced.test.ts
 * @description Enhanced E2E тест для UC-02 с полной интеграцией AI Fixtures (Phase 3)
 * @version 1.0.0
 * @date 2025-06-18
 * @updated Демонстрация трехуровневой системы: Use Cases + Worlds + AI Fixtures
 */

/** HISTORY:
 * v1.0.0 (2025-06-18): Начальная реализация с полной AI Fixtures интеграцией
 */

import { test, expect } from '@playwright/test'
import { 
  createUseCaseTest, 
  useCaseMetadata,
  type UseCaseContext 
} from '../../helpers/use-case-integration'
import { aiFixturesUtils } from '../../../lib/ai/providers.enhanced'

/**
 * @description UC-02: AI-генерация онбординг-сайта (Enhanced с AI Fixtures)
 * 
 * @feature Полная интеграция трехуровневой системы тестирования
 * @feature Детерминистичные AI ответы через fixtures
 * @feature Поддержка record/replay режимов
 */
test.describe('UC-02: AI Site Generation (Enhanced)', () => {
  const metadata = useCaseMetadata('UC-02', [
    'ai-site-generation-m3n8r5.json',
    'site-update-contacts.json'
  ])

  test.beforeAll(async () => {
    // Настройка AI Fixtures для этого Use Case
    aiFixturesUtils.startReplay('UC-02', 'CLEAN_USER_WORKSPACE')
  })

  test.afterAll(async () => {
    // Очистка после тестов
    aiFixturesUtils.clearCache()
  })

  test('AI генерация сайта для дизайнера с детерминистичным результатом', createUseCaseTest(
    'UC-02',
    'CLEAN_USER_WORKSPACE',
    async (context: UseCaseContext) => {
      const { page, ui, world } = context
      
      // Получаем данные из мира
      const user = world.users.find(u => u.testId === 'user-sarah')!
      
      console.log(`🎯 Running enhanced UC-02 with user: ${user.name}`)
      console.log(`🤖 AI Fixtures mode: ${aiFixturesUtils.getStats().mode}`)

      // ===== ЧАСТЬ 1: Инициализация =====
      await ui.loginAs('user-sarah')
      
      // Переходим к новому чату
      await page.goto('/chat')
      await expect(page.getByTestId('chat-input')).toBeVisible()

      // ===== ЧАСТЬ 2: AI Команда для создания сайта =====
      const aiCommand = 'Создай онбординг-сайт для нового дизайнера Алекса'
      
      await page.getByTestId('chat-input').fill(aiCommand)
      await page.getByTestId('chat-send-button').click()
      
      // Проверяем что сообщение отправилось
      await expect(page.getByText(aiCommand)).toBeVisible()

      // ===== ЧАСТЬ 3: AI Response с Fixtures =====
      // В replay режиме AI должен вернуть детерминистичный ответ из фикстуры
      
      // Ожидаем появления ArtifactPreview (результат AI tool)
      await expect(page.getByTestId('artifact-preview')).toBeVisible({ timeout: 10000 })
      
      // Проверяем что создался site артефакт
      await expect(page.getByText('Welcome Alex - Designer Onboarding')).toBeVisible()
      
      // Проверяем tool-invocation структуру
      await expect(page.getByTestId('tool-invocation-artifactCreate')).toBeVisible()

      // ===== ЧАСТЬ 4: Проверка содержимого сайта =====
      // Кликаем на ArtifactPreview чтобы открыть панель
      await page.getByTestId('artifact-preview').click()
      
      // Ожидаем загрузки Site Editor
      await ui.waitForAICompletion()
      
      // Проверяем что сайт содержит ожидаемые блоки из фикстуры
      await expect(page.getByTestId('site-block-hero')).toBeVisible()
      await expect(page.getByTestId('site-block-key-contacts')).toBeVisible()
      await expect(page.getByTestId('site-block-useful-links')).toBeVisible()
      
      // Проверяем специфичное содержимое для дизайнера
      await expect(page.getByText('Welcome to the Design Team, Alex! 🎨')).toBeVisible()
      await expect(page.getByText('Maria Rodriguez')).toBeVisible() // Design Director
      await expect(page.getByText('Figma Workspace')).toBeVisible() // Design tool

      // ===== ЧАСТЬ 5: Итеративное улучшение =====
      // Проверим что можно добавить дополнительные блоки
      await page.getByTestId('chat-input').fill('Добавь раздел с контактами дизайн-команды')
      await page.getByTestId('chat-send-button').click()
      
      // AI должен обновить существующий сайт (используя artifactUpdate)
      await ui.waitForAICompletion()
      
      // Проверяем что появилась новая версия
      await expect(page.getByTestId('artifact-version-indicator')).toContainText('v2')

      // ===== ЧАСТЬ 6: Проверка качества AI генерации =====
      // Все эти проверки возможны благодаря детерминистичным AI fixtures
      
      // Структура сайта логична
      const blocks = await page.getByTestId('site-block').count()
      expect(blocks).toBeGreaterThanOrEqual(3) // hero, contacts, links как минимум
      
      // Контент релевантен для дизайнера
      await expect(page.getByText('Design')).toHaveCount(3) // Много упоминаний дизайна
      await expect(page.getByText('UX')).toBeVisible() // UX контент
      
      // Контакты структурированы
      await expect(page.getByText('Design Director')).toBeVisible()
      await expect(page.getByText('Senior UX Designer')).toBeVisible()

      console.log(`✅ UC-02 Enhanced completed successfully: AI site generation with fixtures verified`)
    }
  ))

  test('Переключение режимов AI Fixtures (record/replay)', createUseCaseTest(
    'UC-02',
    'CLEAN_USER_WORKSPACE',
    async (context: UseCaseContext) => {
      const { page, ui } = context

      console.log(`🔄 Testing AI Fixtures mode switching`)
      
      // Тест переключения в record режим
      aiFixturesUtils.setMode('record')
      expect(aiFixturesUtils.getStats().mode).toBe('record')
      
      // Тест переключения в replay режим  
      aiFixturesUtils.setMode('replay')
      expect(aiFixturesUtils.getStats().mode).toBe('replay')
      
      // Тест отключения fixtures
      aiFixturesUtils.disable()
      expect(aiFixturesUtils.getStats().mode).toBe('passthrough')
      
      console.log(`✅ AI Fixtures mode switching verified`)
    }
  ))

  test('Проверка консистентности AI ответов в replay режиме', createUseCaseTest(
    'UC-02',
    'CLEAN_USER_WORKSPACE',
    async (context: UseCaseContext) => {
      const { page, ui } = context
      
      // Активируем replay режим
      aiFixturesUtils.startReplay('UC-02', 'CLEAN_USER_WORKSPACE')
      
      await ui.loginAs('user-sarah')
      await page.goto('/chat')
      
      // Выполняем одинаковую команду несколько раз
      const command = 'Создай онбординг-сайт для нового дизайнера Алекса'
      const results: string[] = []
      
      for (let i = 0; i < 3; i++) {
        // Новый чат для каждой итерации
        await page.getByTestId('new-chat-button').click()
        
        await page.getByTestId('chat-input').fill(command)
        await page.getByTestId('chat-send-button').click()
        
        await ui.waitForAICompletion()
        
        // Получаем заголовок созданного артефакта
        const title = await page.getByTestId('artifact-title').textContent()
        results.push(title || '')
        
        console.log(`Iteration ${i + 1}: ${title}`)
      }
      
      // Проверяем что все результаты идентичны (детерминизм)
      expect(results[0]).toBe(results[1])
      expect(results[1]).toBe(results[2])
      expect(results[0]).toBe('Welcome Alex - Designer Onboarding')
      
      console.log(`✅ AI response consistency verified: ${results.length} identical results`)
    }
  ))
})

/**
 * @description Utility тест для записи новых AI fixtures
 * 
 * @feature Отдельный тест для record режима
 * @feature Не запускается в обычном CI/CD
 */
test.describe('UC-02: AI Fixtures Recording (Manual)', () => {
  test.skip(({ }, testInfo) => {
    // Пропускаем если не установлена переменная для записи
    return !process.env.RECORD_AI_FIXTURES
  })

  test('Record new AI fixtures for UC-02', createUseCaseTest(
    'UC-02',
    'CLEAN_USER_WORKSPACE',
    async (context: UseCaseContext) => {
      const { page, ui } = context
      
      // Активируем record режим
      aiFixturesUtils.startRecording('UC-02', 'CLEAN_USER_WORKSPACE')
      
      console.log(`📝 Recording new AI fixtures for UC-02...`)
      
      await ui.loginAs('user-sarah')
      await page.goto('/chat')
      
      // Выполняем различные AI команды для записи фикстур
      const commands = [
        'Создай онбординг-сайт для нового дизайнера Алекса',
        'Добавь раздел с контактами дизайн-команды',
        'Включи информацию о дизайн-системе компании'
      ]
      
      for (const command of commands) {
        await page.getByTestId('chat-input').fill(command)
        await page.getByTestId('chat-send-button').click()
        
        // Ждем настоящего AI ответа (не из фикстур)
        await ui.waitForAICompletion()
        
        console.log(`📝 Recorded AI response for: "${command}"`)
      }
      
      const stats = aiFixturesUtils.getStats()
      console.log(`✅ Recording complete. Cache size: ${stats.cacheSize}`)
    }
  ))
})

// END OF: tests/e2e/use-cases/UC-02-AI-Site-Generation-enhanced.test.ts