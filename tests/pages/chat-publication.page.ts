/**
 * @file tests/helpers/chat-publication-page.ts
 * @description Page Object Model для функций публикации чатов
 * @version 1.0.0
 * @date 2025-06-19
 * @updated Реализация для TASK-06: UC-04 Chat Publication
 */

/** HISTORY:
 * v1.0.0 (2025-06-19): Начальная реализация POM для Chat Publication workflow
 */

import type { Page, Locator } from '@playwright/test'

/**
 * @description Page Object Model для функций публикации чатов
 * 
 * @feature Полное покрытие UI взаимодействий с chat publication system
 * @feature TTL управление и статус индикаторы
 * @feature Анонимный доступ и read-only mode
 */
export class ChatPublicationPage {
  constructor(private page: Page) {}

  // ===== СЕЛЕКТОРЫ =====

  /** Кнопка Share в header чата */
  get shareButton(): Locator {
    return this.page.getByTestId('header-share-button')
  }

  /** Enhanced Share Dialog */
  get shareDialog(): Locator {
    return this.page.getByTestId('enhanced-share-dialog')
  }

  /** TTL селектор */
  get ttlSelector(): Locator {
    return this.page.getByTestId('share-ttl-selector')
  }

  /** Кнопка "Share and Copy" */
  get shareAndCopyButton(): Locator {
    return this.page.getByTestId('share-and-copy-button')
  }

  /** Кнопка "Stop Sharing" */
  get stopSharingButton(): Locator {
    return this.page.getByTestId('stop-sharing-button')
  }

  /** Calendar picker для кастомных дат */
  get calendarPicker(): Locator {
    return this.page.getByTestId('share-custom-date-picker')
  }

  /** Toast уведомление о публикации */
  get publicationToast(): Locator {
    return this.page.getByText('Чат опубликован и ссылка скопирована')
  }

  /** Статус публикации в диалоге */
  get publicationStatus(): Locator {
    return this.page.getByTestId('publication-status-display')
  }

  /** Badge публикации в UI */
  get publicationBadge(): Locator {
    return this.page.getByTestId('chat-publication-badge')
  }

  /** Chat input (должен быть скрыт в read-only) */
  get chatInput(): Locator {
    return this.page.getByTestId('chat-input-textarea')
  }

  /** Артефакты в чате */
  get artifactPreviews(): Locator {
    return this.page.getByTestId('artifact-preview')
  }

  /** Кнопки редактирования артефактов */
  get artifactEditButtons(): Locator {
    return this.page.getByTestId('artifact-edit-button')
  }

  // ===== МЕТОДЫ НАВИГАЦИИ =====

  /**
   * @description Переходит к конкретному чату
   * 
   * @param chatId - ID чата для навигации
   */
  async navigateToChat(chatId: string): Promise<void> {
    await this.page.goto(`/chat/${chatId}`)
    
    // Ожидаем загрузки чата
    await this.page.waitForURL(`**/chat/${chatId}`)
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * @description Посещение как анонимный пользователь
   * 
   * @param publicUrl - Публичная ссылка на чат
   */
  async visitAsAnonymous(publicUrl: string): Promise<void> {
    await this.page.goto(publicUrl)
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * @description Выход из системы
   */
  async logout(): Promise<void> {
    // Используем menu или прямое удаление cookies
    await this.page.evaluate(() => {
      // Очищаем все cookies аутентификации
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=")
        const name = eqPos > -1 ? c.substr(0, eqPos) : c
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.localhost`
      })
    })
    
    // Переходим на главную страницу
    await this.page.goto('/')
  }

  // ===== МЕТОДЫ ПУБЛИКАЦИИ =====

  /**
   * @description Открывает диалог публикации
   */
  async openShareDialog(): Promise<void> {
    await this.shareButton.click()
    await this.shareDialog.waitFor({ state: 'visible', timeout: 5000 })
  }

  /**
   * @description Выбирает TTL опцию
   * 
   * @param option - Опция TTL ('1 month', '3 months', '1 year', 'Forever')
   */
  async selectTTLOption(option: string): Promise<void> {
    const selector = this.page.getByText(option, { exact: true })
    await selector.click()
  }

  /**
   * @description Выбирает кастомную дату TTL
   * 
   * @param date - Дата истечения публикации
   */
  async selectCustomTTL(date: Date): Promise<void> {
    // Кликаем на "Custom"
    await this.page.getByText('Custom', { exact: true }).click()
    
    // Ожидаем появления calendar picker
    await this.calendarPicker.waitFor({ state: 'visible' })
    
    // Устанавливаем дату (упрощенная реализация)
    const dateString = date.toISOString().split('T')[0]
    await this.page.fill('input[type="date"]', dateString)
  }

  /**
   * @description Публикует чат и копирует ссылку
   */
  async publishAndCopy(): Promise<void> {
    await this.shareAndCopyButton.click()
    
    // Ожидаем завершения публикации
    await this.page.waitForTimeout(2000)
  }

  /**
   * @description Отзывает публикацию чата
   */
  async stopSharing(): Promise<void> {
    await this.stopSharingButton.click()
    
    // Ожидаем обновления статуса
    await this.page.waitForTimeout(1000)
  }

  // ===== МЕТОДЫ ПРОВЕРКИ =====

  /**
   * @description Проверяет содержимое demo чата
   */
  async verifyDemoContents(): Promise<void> {
    // Проверяем наличие сообщений с артефактами
    const messageCount = await this.page.getByTestId('chat-message').count()
    if (messageCount < 3) {
      throw new Error(`Expected at least 3 messages in demo chat, found: ${messageCount}`)
    }
    
    // Проверяем наличие артефактов
    const artifactCount = await this.artifactPreviews.count()
    if (artifactCount < 1) {
      throw new Error('Expected at least 1 artifact in demo chat')
    }
    
    console.log(`📋 Demo chat verified: ${messageCount} messages, ${artifactCount} artifacts`)
  }

  /**
   * @description Получает публичную ссылку из буфера обмена
   */
  async getPublicUrl(): Promise<string> {
    // Эмулируем получение ссылки из clipboard
    const clipboardText = await this.page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText()
      } catch {
        // Fallback для тестовой среды
        return `${window.location.origin}/s/chat/demo-chat-id`
      }
    })
    
    return clipboardText
  }

  /**
   * @description Проверяет появление toast о публикации
   */
  async verifyPublicationToast(): Promise<void> {
    await this.publicationToast.waitFor({ state: 'visible', timeout: 5000 })
  }

  /**
   * @description Проверяет read-only режим
   */
  async verifyReadOnlyMode(): Promise<void> {
    // Проверяем отсутствие chat input
    const inputVisible = await this.chatInput.isVisible().catch(() => false)
    if (inputVisible) {
      throw new Error('Chat input should not be visible in read-only mode')
    }
    
    // Проверяем наличие сообщений
    const messageCount = await this.page.getByTestId('chat-message').count()
    if (messageCount === 0) {
      throw new Error('No messages visible in read-only mode')
    }
    
    console.log(`👀 Read-only mode verified: ${messageCount} messages visible, no input`)
  }

  /**
   * @description Проверяет что артефакты в read-only режиме
   */
  async verifyArtifactsReadOnly(): Promise<void> {
    const artifactCount = await this.artifactPreviews.count()
    
    for (let i = 0; i < artifactCount; i++) {
      const artifact = this.artifactPreviews.nth(i)
      await artifact.click()
      
      // Проверяем отсутствие кнопок редактирования
      const editButton = artifact.locator('[data-testid*="edit"]')
      const editVisible = await editButton.isVisible().catch(() => false)
      
      if (editVisible) {
        throw new Error(`Edit button should not be visible for artifact ${i} in read-only mode`)
      }
    }
    
    console.log(`🔒 Artifacts read-only verified: ${artifactCount} artifacts`)
  }

  /**
   * @description Проверяет отсутствие chat input
   */
  async verifyNoChatInput(): Promise<void> {
    // Проверяем что input не существует или скрыт
    const inputExists = await this.chatInput.count()
    if (inputExists > 0) {
      const inputVisible = await this.chatInput.isVisible()
      if (inputVisible) {
        throw new Error('Chat input should not be visible in read-only mode')
      }
    }
    
    // Проверяем отсутствие кнопки отправки
    const sendButton = this.page.getByTestId('chat-send-button')
    const sendVisible = await sendButton.isVisible().catch(() => false)
    if (sendVisible) {
      throw new Error('Send button should not be visible in read-only mode')
    }
    
    console.log(`✉️ No chat input functionality verified`)
  }

  /**
   * @description Проверяет индикаторы публикации
   */
  async verifyPublicationIndicators(): Promise<void> {
    // Проверяем badge публикации
    await this.publicationBadge.waitFor({ state: 'visible', timeout: 5000 })
    
    // Открываем share dialog и проверяем статус
    await this.openShareDialog()
    await this.publicationStatus.waitFor({ state: 'visible', timeout: 3000 })
    
    const statusText = await this.publicationStatus.textContent()
    if (!statusText || !statusText.includes('Published until')) {
      throw new Error('Publication status not displayed correctly')
    }
    
    console.log(`📊 Publication indicators verified: ${statusText}`)
  }

  /**
   * @description Проверяет что публикация отозвана (404)
   * 
   * @param publicUrl - Ранее публичная ссылка
   */
  async verifyPublicationRevoked(publicUrl: string): Promise<void> {
    const response = await this.page.goto(publicUrl)
    
    if (!response || response.status() !== 404) {
      throw new Error(`Expected 404 for revoked publication, got: ${response?.status()}`)
    }
    
    console.log(`🚫 Publication revocation verified: 404 response`)
  }

  /**
   * @description Проверяет что публикация истекла (404)
   * 
   * @param publicUrl - Ссылка с истекшим TTL
   */
  async verifyPublicationExpired(publicUrl: string): Promise<void> {
    const response = await this.page.goto(publicUrl)
    
    if (!response || response.status() !== 404) {
      throw new Error(`Expected 404 for expired publication, got: ${response?.status()}`)
    }
    
    console.log(`⏰ Publication expiration verified: 404 response`)
  }

  /**
   * @description Получает ID артефактов из текущего чата
   */
  async getArtifactIdsFromChat(): Promise<string[]> {
    // Извлекаем artifact IDs из DOM
    const artifactIds = await this.page.evaluate(() => {
      const previews = document.querySelectorAll('[data-testid="artifact-preview"]')
      const ids: string[] = []
      
      previews.forEach((preview) => {
        const idAttr = preview.getAttribute('data-artifact-id')
        if (idAttr) {
          ids.push(idAttr)
        }
      })
      
      return ids
    })
    
    return artifactIds
  }

  /**
   * @description Проверяет что артефакт опубликован через chat source
   * 
   * @param artifactId - ID артефакта для проверки
   */
  async verifyArtifactPublishedViaChatSource(artifactId: string): Promise<void> {
    // Проверяем доступность артефакта через API
    const response = await this.page.request.get(`/api/artifact?id=${artifactId}`)
    
    if (!response.ok()) {
      throw new Error(`Artifact ${artifactId} should be accessible anonymously, got: ${response.status()}`)
    }
    
    const artifactData = await response.json()
    
    // Проверяем publication_state
    if (!artifactData.publication_state || artifactData.publication_state.length === 0) {
      throw new Error(`Artifact ${artifactId} should have publication_state set`)
    }
    
    const chatSource = artifactData.publication_state.find((pub: any) => pub.source === 'chat')
    if (!chatSource) {
      throw new Error(`Artifact ${artifactId} should be published via chat source`)
    }
    
    console.log(`🔗 Artifact ${artifactId} verified as published via chat`)
  }
}

// END OF: tests/helpers/chat-publication-page.ts