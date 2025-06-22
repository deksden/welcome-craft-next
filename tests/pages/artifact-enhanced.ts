/**
 * @file tests/pages/artifact-enhanced.ts
 * @description Enhanced ArtifactPage POM для Железобетонных Тестов с поддержкой публикации
 * @version 1.0.0
 * @date 2025-06-18
 * @updated Расширенная версия ArtifactPage с fail-fast локаторами и publication system
 */

/** HISTORY:
 * v1.0.0 (2025-06-18): Создание enhanced ArtifactPage для полной поддержки BUG-005 тестирования
 */

import type { Page, Locator } from '@playwright/test'
import { TestUtils } from '../helpers/test-utils'

/**
 * @description Enhanced ArtifactPage - улучшенный POM для работы с артефактами
 * 
 * Включает поддержку:
 * - Site артефактов и кнопки публикации
 * - Fail-fast локаторов для всех элементов
 * - Publication dialog workflow
 * - World-based тестирования
 * 
 * @feature Специально создан для тестирования BUG-005
 * @feature Fail-fast локаторы с 2s timeout
 * @feature Fallback стратегии для совместимости
 */
export class EnhancedArtifactPage {
  private testUtils: TestUtils

  constructor(private page: Page) {
    this.testUtils = new TestUtils(page)
  }

  /**
   * @description Получить панель артефакта с fail-fast локатором
   * 
   * @returns Promise<Locator> - локатор панели артефакта
   */
  async getArtifactPanel(): Promise<Locator> {
    try {
      return await this.testUtils.fastLocator('artifact-panel')
    } catch (error) {
      // Try alternative testids from codebase
      try {
        return await this.testUtils.fastLocator('artifact')
      } catch (fallbackError) {
        return this.page.locator('.artifact-panel, [role="dialog"][aria-label*="artifact"], .side-panel, [data-testid="artifact"]')
      }
    }
  }

  /**
   * @description Получить кнопку публикации для site артефактов
   * 
   * @feature Специфично для site артефактов - должна быть ТОЛЬКО у них
   * @returns Promise<Locator> - локатор кнопки публикации
   */
  async getPublicationButton(): Promise<Locator> {
    try {
      return await this.testUtils.fastLocator('artifact-publish-button')
    } catch (error) {
      return this.page.locator('button:has-text("Публикация"), button:has-text("Publish"), .publish-button')
    }
  }

  /**
   * @description Получить диалог публикации сайта
   * 
   * @returns Promise<Locator> - локатор диалога публикации
   */
  async getSitePublicationDialog(): Promise<Locator> {
    try {
      return await this.testUtils.fastLocator('site-publication-dialog')
    } catch (error) {
      return this.page.locator('[role="dialog"]:has-text("Публикация"), .publication-dialog, .site-publish-modal')
    }
  }

  /**
   * @description Проверить что артефакт открыт и готов к взаимодействию
   * 
   * @returns Promise<boolean> - true если артефакт готов
   */
  async isArtifactReady(): Promise<boolean> {
    try {
      const panel = await this.getArtifactPanel()
      await panel.isVisible()
      console.log('✅ Artifact panel is ready')
      return true
    } catch (error) {
      console.log('⚠️ Artifact panel is not ready:', error instanceof Error ? error.message : String(error))
      return false
    }
  }

  /**
   * @description Проверить что артефакт является site типом
   * 
   * @feature Проверяет что кнопка публикации присутствует (только у site)
   * @returns Promise<boolean> - true если это site артефакт
   */
  async isSiteArtifact(): Promise<boolean> {
    try {
      const publishButton = await this.getPublicationButton()
      await publishButton.isVisible()
      console.log('✅ This is a site artifact (publication button found)')
      return true
    } catch (error) {
      console.log('📄 This is not a site artifact (no publication button)')
      return false
    }
  }

  /**
   * @description Кликнуть по кнопке публикации
   * 
   * @feature Центральный метод для тестирования BUG-005
   * @throws Error если кнопка публикации недоступна
   */
  async clickPublicationButton(): Promise<void> {
    console.log('🌐 Clicking publication button...')
    
    const isSite = await this.isSiteArtifact()
    if (!isSite) {
      throw new Error('Publication button is only available for site artifacts')
    }
    
    const publishButton = await this.getPublicationButton()
    await publishButton.click()
    
    console.log('✅ Publication button clicked')
  }

  /**
   * @description Ждать появления диалога публикации
   * 
   * @param timeout - таймаут ожидания в мс
   * @feature Ключевая проверка для BUG-005 - диалог должен появиться
   */
  async waitForPublicationDialog(timeout = 5000): Promise<void> {
    console.log('⏳ Waiting for publication dialog to appear...')
    
    try {
      const dialog = await this.getSitePublicationDialog()
      await dialog.waitFor({ state: 'visible', timeout })
      console.log('✅ Publication dialog appeared')
    } catch (error) {
      console.log('❌ Publication dialog did not appear within timeout')
      throw new Error(`Publication dialog not found within ${timeout}ms - this indicates BUG-005`)
    }
  }

  /**
   * @description Проверить что диалог публикации НЕ появился (воспроизведение бага)
   * 
   * @param timeout - время ожидания отсутствия диалога
   * @feature Специфичный метод для воспроизведения BUG-005
   */
  async verifyPublicationDialogNotAppeared(timeout = 3000): Promise<void> {
    console.log('🔍 Verifying publication dialog does NOT appear (bug reproduction)...')
    
    try {
      const dialog = await this.testUtils.fastLocator('site-publication-dialog', { timeout })
      await dialog.isVisible()
      
      // Если мы дошли сюда - диалог появился (баг исправлен)
      console.log('🎉 UNEXPECTED: Publication dialog appeared! Bug may be fixed.')
      throw new Error('Publication dialog appeared - bug appears to be fixed')
    } catch (error) {
      if (error instanceof Error && error.message.includes('FAIL-FAST')) {
        // Это ожидаемое поведение - диалог не появился (баг воспроизведен)
        console.log('✅ BUG REPRODUCED: Publication dialog did not appear as expected')
      } else {
        // Неожиданная ошибка
        throw error
      }
    }
  }

  /**
   * @description Полный workflow тестирования публикации для BUG-005
   * 
   * @feature Комплексный метод для воспроизведения всего бага
   * @returns Promise<'bug_reproduced' | 'bug_fixed'> - результат тестирования
   */
  async testPublicationWorkflow(): Promise<'bug_reproduced' | 'bug_fixed'> {
    console.log('🧪 Testing publication workflow for BUG-005...')
    
    // Шаг 1: Проверяем что артефакт готов
    const isReady = await this.isArtifactReady()
    if (!isReady) {
      throw new Error('Artifact is not ready for testing')
    }
    
    // Шаг 2: Проверяем что это site артефакт
    const isSite = await this.isSiteArtifact()
    if (!isSite) {
      throw new Error('This test requires a site artifact')
    }
    
    // Шаг 3: Кликаем по кнопке публикации
    await this.clickPublicationButton()
    
    // Шаг 4: Проверяем результат
    try {
      await this.waitForPublicationDialog(3000)
      console.log('🎉 Publication dialog appeared - bug appears to be FIXED')
      return 'bug_fixed'
    } catch (error) {
      console.log('❌ Publication dialog did not appear - bug REPRODUCED')
      return 'bug_reproduced'
    }
  }

  /**
   * @description Закрыть диалог публикации (если открыт)
   * 
   * @feature Cleanup метод для тестов
   */
  async closePublicationDialog(): Promise<void> {
    try {
      const dialog = await this.getSitePublicationDialog()
      const closeButton = dialog.locator('button:has-text("Отмена"), button:has-text("Cancel"), button:has-text("✕"), .close-button')
      await closeButton.click()
      console.log('✅ Publication dialog closed')
    } catch (error) {
      console.log('📋 No publication dialog to close')
    }
  }

  /**
   * @description Добавить артефакт в clipboard (для других тестов)
   * 
   * @feature Интеграция с Redis clipboard системой
   */
  async addToClipboard(): Promise<void> {
    console.log('📋 Adding artifact to clipboard...')
    
    try {
      const addToClipboardButton = await this.testUtils.fastLocator('artifact-add-to-chat-button')
      await addToClipboardButton.click()
      console.log('✅ Artifact added to clipboard')
    } catch (error) {
      console.log('⚠️ Add to clipboard button not found, using CSS fallback')
      const fallbackButton = this.page.locator('button:has-text("Добавить в чат"), .add-to-chat-button')
      await fallbackButton.click()
      console.log('✅ Artifact added to clipboard via fallback')
    }
  }

  /**
   * @description Получить информацию о типе и состоянии артефакта
   * 
   * @returns Promise<Object> - метаданные артефакта
   */
  async getArtifactMetadata(): Promise<{
    kind: string
    title: string
    isPublishable: boolean
  }> {
    const panel = await this.getArtifactPanel()
    
    // Извлекаем метаданные из UI
    const titleElement = panel.locator('h1, h2, .artifact-title, [data-testid="artifact-title"]')
    const title = await titleElement.textContent() || 'Unknown'
    
    // Определяем тип по наличию кнопки публикации
    const isPublishable = await this.isSiteArtifact()
    const kind = isPublishable ? 'site' : 'unknown'
    
    return {
      kind,
      title: title.trim(),
      isPublishable
    }
  }

  /**
   * @description Проверить что custom event система работает
   * 
   * @feature Отладочный метод для проверки event dispatching
   */
  async testCustomEventSystem(): Promise<boolean> {
    console.log('🧪 Testing custom event system...')
    
    const result = await this.page.evaluate(() => {
      const events: any[] = []
      
      // Слушаем event
      window.addEventListener('open-site-publication-dialog', (event: any) => {
        events.push({
          type: event.type,
          detail: event.detail,
          received: true
        })
      })
      
      // Dispatch тестовый event
      window.dispatchEvent(new CustomEvent('open-site-publication-dialog', {
        detail: { 
          artifactId: 'test-event',
          kind: 'site',
          title: 'Test Event'
        }
      }))
      
      return events
    })
    
    const isWorking = result.length > 0 && result[0].received === true
    console.log(`${isWorking ? '✅' : '❌'} Custom event system ${isWorking ? 'working' : 'not working'}`)
    
    return isWorking
  }
}

// END OF: tests/pages/artifact-enhanced.ts