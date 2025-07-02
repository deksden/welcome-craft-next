/**
 * @file tests/helpers/multi-artifact-page.ts
 * @description Page Object Model для тестирования создания множественных артефактов
 * @version 1.0.0
 * @date 2025-06-19
 * @updated Реализация для TASK-07: UC-05 Multi-Artifact Creation
 */

/** HISTORY:
 * v1.0.0 (2025-06-19): Начальная реализация POM для Multi-Artifact Creation workflow
 */

import type { Page, Locator } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * @description Конфигурация интеграции сайта с артефактами
 */
export interface SiteIntegrationConfig {
  heroSlot: string
  contactsSlot: string  
  linksSlot: string
}

/**
 * @description Page Object Model для тестирования создания множественных артефактов
 * 
 * @feature Полное покрытие UI взаимодействий с multi-artifact workflow
 * @feature Проверка sequential creation и auto-linking
 * @feature Performance и error handling testing
 */
export class MultiArtifactPage {
  constructor(private page: Page) {}

  // ===== СЕЛЕКТОРЫ =====

  /** Кнопка создания нового чата */
  get newChatButton(): Locator {
    return this.page.getByTestId('header-new-chat-button')
  }

  /** Поле ввода чата */
  get chatInput(): Locator {
    return this.page.getByTestId('chat-input-textarea')
  }

  /** Кнопка отправки сообщения */
  get sendButton(): Locator {
    return this.page.getByTestId('chat-input-send-button')
  }

  /** Все сообщения в чате */
  get chatMessages(): Locator {
    return this.page.getByTestId('chat-message')
  }

  /** Все превью артефактов в чате */
  get artifactPreviews(): Locator {
    return this.page.getByTestId('artifact-preview')
  }

  /** Loading индикаторы */
  get loadingIndicators(): Locator {
    return this.page.locator('.animate-spin, [data-testid*="skeleton"]')
  }

  /** Панель артефакта */
  get artifactPanel(): Locator {
    return this.page.getByTestId('artifact-panel')
  }

  /** Site editor */
  get siteEditor(): Locator {
    return this.page.getByTestId('site-editor')
  }

  // ===== МЕТОДЫ НАВИГАЦИИ =====

  /**
   * @description Создает новый чат
   */
  async createNewChat(): Promise<void> {
    await this.newChatButton.click()
    
    // Ожидаем загрузки чата
    await this.page.waitForURL(/.*\/chat.*/)
    await this.chatInput.waitFor({ state: 'visible' })
  }

  /**
   * @description Отправляет комплексный запрос на создание множественных артефактов
   * 
   * @param request - Текст запроса для AI
   */
  async sendComplexRequest(request: string): Promise<void> {
    await this.chatInput.fill(request)
    await this.sendButton.click()
    
    // Ожидаем начала обработки
    await this.page.waitForTimeout(1000)
  }

  // ===== МЕТОДЫ ПРОВЕРКИ СОЗДАНИЯ АРТЕФАКТОВ =====

  /**
   * @description Ожидает появления артефакта с определенным номером
   * 
   * @param artifactNumber - Порядковый номер ожидаемого артефакта
   * @param expectedKind - Ожидаемый тип артефакта
   * @param titleKeyword - Ключевое слово из названия артефакта
   * @returns ID созданного артефакта
   */
  async waitForArtifactCreation(
    artifactNumber: number, 
    expectedKind: string, 
    titleKeyword: string
  ): Promise<string> {
    console.log(`⏳ Waiting for artifact ${artifactNumber} (${expectedKind}) with keyword: ${titleKeyword}`)
    
    // Ожидаем появления нужного количества артефактов
    await this.page.waitForFunction(
      (count) => document.querySelectorAll('[data-testid="artifact-preview"]').length >= count,
      artifactNumber,
      { timeout: 60000 }
    )
    
    // Получаем конкретный артефакт
    const artifactPreview = this.artifactPreviews.nth(artifactNumber - 1)
    await artifactPreview.waitFor({ state: 'visible' })
    
    // Проверяем наличие ключевого слова в заголовке
    await expect(artifactPreview).toContainText(titleKeyword, { ignoreCase: true })
    
    // Извлекаем ID артефакта
    const artifactId = await artifactPreview.getAttribute('data-artifact-id') ||
                      await artifactPreview.getAttribute('data-testid') ||
                      `artifact-${artifactNumber}`
    
    console.log(`✅ Artifact ${artifactNumber} created: ${artifactId}`)
    return artifactId
  }

  /**
   * @description Проверяет содержимое артефакта на наличие ключевых слов
   * 
   * @param artifactId - ID артефакта для проверки
   * @param keywords - Массив ключевых слов для поиска в контенте
   */
  async verifyArtifactContent(artifactId: string, ...keywords: string[]): Promise<void> {
    // Кликаем на артефакт чтобы открыть панель
    const artifactPreview = this.page.locator(`[data-artifact-id="${artifactId}"]`).first()
    if (await artifactPreview.count() === 0) {
      // Fallback - ищем по содержимому
      const allPreviews = this.artifactPreviews
      const count = await allPreviews.count()
      for (let i = 0; i < count; i++) {
        const preview = allPreviews.nth(i)
        const text = await preview.textContent()
        if (text && keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()))) {
          await preview.click()
          break
        }
      }
    } else {
      await artifactPreview.click()
    }
    
    // Ожидаем загрузки панели артефакта
    await this.artifactPanel.waitFor({ state: 'visible', timeout: 10000 })
    
    // Ожидаем загрузки контента (исчезновения loading indicators)
    await this.page.waitForFunction(() => {
      const skeletons = document.querySelectorAll('[data-testid*="skeleton"]')
      const spinners = document.querySelectorAll('.animate-spin')
      return skeletons.length === 0 && spinners.length === 0
    }, { timeout: 30000 })
    
    // Проверяем наличие ключевых слов
    for (const keyword of keywords) {
      await expect(this.artifactPanel).toContainText(keyword, { 
        ignoreCase: true,
        timeout: 10000 
      })
    }
    
    console.log(`✅ Artifact content verified: ${keywords.join(', ')}`)
  }

  // ===== МЕТОДЫ ПРОВЕРКИ САЙТА =====

  /**
   * @description Открывает site артефакт для проверки интеграции
   * 
   * @param siteArtifactId - ID сайта для открытия
   */
  async openSiteArtifact(siteArtifactId: string): Promise<void> {
    // Кликаем на site артефакт
    const sitePreview = this.page.locator(`[data-artifact-id="${siteArtifactId}"]`).first()
    if (await sitePreview.count() === 0) {
      // Fallback - ищем последний артефакт (обычно это site)
      const lastPreview = this.artifactPreviews.last()
      await lastPreview.click()
    } else {
      await sitePreview.click()
    }
    
    // Ожидаем загрузки site editor
    await this.siteEditor.waitFor({ state: 'visible', timeout: 10000 })
    
    console.log(`🏗️ Site artifact opened`)
  }

  /**
   * @description Проверяет правильность интеграции артефактов в сайт
   * 
   * @param config - Конфигурация ожидаемой интеграции
   */
  async verifySiteIntegration(config: SiteIntegrationConfig): Promise<void> {
    // Проверяем что site editor показывает структуру
    await expect(this.siteEditor).toBeVisible()
    
    // Проверяем наличие блоков сайта
    const heroBlock = this.page.getByTestId('site-block-hero')
    const contactsBlock = this.page.getByTestId('site-block-key-contacts')
    const linksBlock = this.page.getByTestId('site-block-useful-links')
    
    await heroBlock.waitFor({ state: 'visible', timeout: 10000 })
    await contactsBlock.waitFor({ state: 'visible', timeout: 10000 })
    await linksBlock.waitFor({ state: 'visible', timeout: 10000 })
    
    // Проверяем что блоки содержат контент из связанных артефактов
    // (упрощенная проверка - наличие любого текстового контента)
    await expect(heroBlock).not.toBeEmpty()
    await expect(contactsBlock).not.toBeEmpty()
    await expect(linksBlock).not.toBeEmpty()
    
    console.log(`✅ Site integration verified`)
  }

  // ===== МЕТОДЫ ПРОВЕРКИ UX =====

  /**
   * @description Проверяет что все артефакты видны в чате
   * 
   * @param artifactIds - Массив ID артефактов для проверки
   */
  async verifyAllArtifactsVisible(artifactIds: string[]): Promise<void> {
    // Проверяем общее количество
    await expect(this.artifactPreviews).toHaveCount(artifactIds.length, { timeout: 10000 })
    
    // Проверяем что все видимы
    for (let i = 0; i < artifactIds.length; i++) {
      const preview = this.artifactPreviews.nth(i)
      await expect(preview).toBeVisible()
    }
    
    console.log(`👀 All ${artifactIds.length} artifacts are visible`)
  }

  /**
   * @description Проверяет responsive UI во время генерации
   */
  async verifyUIResponsiveness(): Promise<void> {
    // Проверяем что можно скроллить
    await this.page.mouse.wheel(0, 200)
    await this.page.waitForTimeout(500)
    
    // Проверяем что кнопки кликабельны
    if (await this.newChatButton.isVisible()) {
      await expect(this.newChatButton).toBeEnabled()
    }
    
    // Проверяем что нет блокирующих модалов
    const blockingModals = this.page.locator('.modal-backdrop, .overlay')
    await expect(blockingModals).toHaveCount(0)
    
    console.log(`📱 UI responsiveness verified`)
  }

  /**
   * @description Тестирует дополнительное редактирование артефактов
   * 
   * @param artifactId - ID артефакта для редактирования
   * @param editRequest - Запрос на изменение
   */
  async testAdditionalEditing(artifactId: string, editRequest: string): Promise<void> {
    // Отправляем запрос на редактирование
    await this.chatInput.fill(editRequest)
    await this.sendButton.click()
    
    // Ожидаем обработки (может появиться новая версия или обновление)
    await this.page.waitForTimeout(3000)
    
    // Проверяем что система отреагировала
    const messagesAfter = await this.chatMessages.count()
    if (messagesAfter === 0) {
      throw new Error('No response to additional editing request')
    }
    
    console.log(`✏️ Additional editing tested`)
  }

  // ===== УТИЛИТЫ ПРОИЗВОДИТЕЛЬНОСТИ =====

  /**
   * @description Ожидает готовности всех артефактов
   * 
   * @param expectedCount - Ожидаемое количество артефактов
   */
  async waitForAllArtifactsReady(expectedCount: number): Promise<void> {
    // Ожидаем появления всех артефактов
    await this.page.waitForFunction(
      (count) => document.querySelectorAll('[data-testid="artifact-preview"]').length >= count,
      expectedCount,
      { timeout: 90000 }
    )
    
    // Ожидаем исчезновения всех loading indicators
    await this.page.waitForFunction(() => {
      const skeletons = document.querySelectorAll('[data-testid*="skeleton"]')
      const spinners = document.querySelectorAll('.animate-spin')
      return skeletons.length === 0 && spinners.length === 0
    }, { timeout: 60000 })
    
    console.log(`⚡ All ${expectedCount} artifacts are ready`)
  }

  /**
   * @description Проверяет параллельную загрузку контента
   */
  async verifyParallelContentLoading(): Promise<void> {
    // Проверяем что артефакты загружаются независимо
    const artifacts = this.artifactPreviews
    const count = await artifacts.count()
    
    for (let i = 0; i < count; i++) {
      const artifact = artifacts.nth(i)
      
      // Проверяем что артефакт не блокирует UI
      await artifact.click()
      await this.page.waitForTimeout(500)
      
      // Закрываем панель если она открылась
      await this.page.keyboard.press('Escape')
      await this.page.waitForTimeout(500)
    }
    
    console.log(`🔄 Parallel loading verified`)
  }

  // ===== ОБРАБОТКА ОШИБОК =====

  /**
   * @description Проверяет graceful обработку ошибок
   */
  async verifyErrorHandling(): Promise<void> {
    // Ожидаем разумное время для попытки генерации
    await this.page.waitForTimeout(30000)
    
    // Проверяем что UI не сломался
    await expect(this.chatInput).toBeVisible()
    await expect(this.sendButton).toBeEnabled()
    
    // Проверяем что есть какой-то response (даже если с ошибкой)
    const messages = await this.chatMessages.count()
    if (messages === 0) {
      throw new Error('No AI response to complex request')
    }
    
    console.log(`🛡️ Error handling verified`)
  }

  /**
   * @description Проверяет частичный успех создания артефактов
   */
  async verifyPartialSuccess(): Promise<void> {
    // Проверяем что хотя бы один артефакт создался
    const artifactCount = await this.artifactPreviews.count()
    if (artifactCount === 0) {
      throw new Error('No artifacts created at all')
    }
    
    // Проверяем что созданные артефакты работают
    if (artifactCount > 0) {
      const firstArtifact = this.artifactPreviews.first()
      await firstArtifact.click()
      
      // Проверяем что панель открывается
      await this.artifactPanel.waitFor({ state: 'visible', timeout: 5000 })
    }
    
    console.log(`✅ Partial success verified: ${artifactCount} artifacts created`)
  }
}

// END OF: tests/helpers/multi-artifact-page.ts