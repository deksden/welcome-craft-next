/**
 * @file tests/helpers/clipboard-page.ts
 * @description Page Object Model для системы буфера обмена артефактов (Clipboard System)
 * @version 1.0.0
 * @date 2025-06-19
 * @updated Реализация для TASK-05: UC-03 Artifact Reuse
 */

/** HISTORY:
 * v1.0.0 (2025-06-19): Начальная реализация Page Object Model для Clipboard System
 */

import type { Page, Locator } from '@playwright/test'

/**
 * @description Статус буфера обмена
 */
export type ClipboardStatus = 'empty' | 'has-artifact' | 'expired'

/**
 * @description Page Object Model для работы с системой буфера обмена артефактов
 * 
 * @feature Полное покрытие UI взаимодействий с clipboard system
 * @feature TTL управление и автоочистка
 * @feature Multi-chat переиспользование
 */
export class ClipboardPage {
  constructor(private page: Page) {}

  // ===== СЕЛЕКТОРЫ =====

  /** Кнопка "Добавить в чат" в панели артефакта */
  get addToChatButton(): Locator {
    return this.page.getByTestId('artifact-actions-add-to-chat-button')
  }

  /** Preview прикрепления в чате */
  get clipboardArtifact(): Locator {
    return this.page.getByTestId('chat-clipboard-artifact')
  }

  /** Кнопка подтверждения прикрепления (✓) */
  get confirmButton(): Locator {
    return this.clipboardArtifact.locator('button').first()
  }

  /** Кнопка отмены прикрепления (✕) */
  get cancelButton(): Locator {
    return this.clipboardArtifact.locator('button').last()
  }

  /** Меню скрепки в чате */
  get attachMenu(): Locator {
    return this.page.getByTestId('chat-attach-menu')
  }

  /** Опция "Прикрепить артефакт" в меню */
  get attachArtifactOption(): Locator {
    return this.page.getByText('Прикрепить артефакт')
  }

  /** Диалог выбора артефакта */
  get artifactSelectorDialog(): Locator {
    return this.page.getByTestId('artifact-selector-dialog')
  }

  /** Кнопка подтверждения выбора артефакта */
  get confirmSelectionButton(): Locator {
    return this.page.getByTestId('confirm-artifact-selection')
  }

  /** Toast уведомление о копировании */
  get copyToast(): Locator {
    return this.page.getByText('Ссылка на артефакт скопирована')
  }

  /** Текстовое поле ввода чата */
  get chatInput(): Locator {
    return this.page.getByTestId('chat-input-textarea')
  }

  // ===== МЕТОДЫ ВЗАИМОДЕЙСТВИЯ =====

  /**
   * @description Добавляет артефакт в буфер обмена
   * 
   * @feature Кликает по кнопке "Добавить в чат" и ожидает toast уведомления
   */
  async addArtifactToClipboard(): Promise<void> {
    await this.addToChatButton.click()
    await this.copyToast.waitFor({ state: 'visible', timeout: 5000 })
  }

  /**
   * @description Проверяет статус буфера обмена в текущем чате
   * 
   * @returns Статус буфера
   */
  async getClipboardStatus(): Promise<ClipboardStatus> {
    const isVisible = await this.clipboardArtifact.isVisible().catch(() => false)
    
    if (!isVisible) {
      return 'empty'
    }
    
    // Можно добавить дополнительные проверки на expired состояние
    return 'has-artifact'
  }

  /**
   * @description Подтверждает прикрепление артефакта из буфера
   * 
   * @feature Кликает по кнопке ✓ и проверяет добавление в input
   */
  async confirmAttachment(): Promise<void> {
    await this.confirmButton.click()
    
    // Ожидаем появления артефакта в input
    await this.page.waitForFunction(() => {
      const input = document.querySelector('[data-testid="chat-input-textarea"]') as HTMLTextAreaElement
      return input?.value?.includes('artifact:') || false
    }, {}, { timeout: 5000 })
  }

  /**
   * @description Отменяет прикрепление и очищает буфер
   * 
   * @feature Кликает по кнопке ✕ и проверяет очистку буфера
   */
  async cancelAttachment(): Promise<void> {
    await this.cancelButton.click()
    
    // Ожидаем исчезновения preview
    await this.clipboardArtifact.waitFor({ state: 'hidden', timeout: 5000 })
  }

  /**
   * @description Прикрепляет артефакт через меню скрепки
   * 
   * @param artifactTitle - Название артефакта для выбора
   */
  async attachThroughMenu(artifactTitle: string): Promise<void> {
    await this.attachMenu.click()
    await this.attachArtifactOption.waitFor({ state: 'visible' })
    await this.attachArtifactOption.click()
    
    // Ожидаем открытия диалога выбора
    await this.artifactSelectorDialog.waitFor({ state: 'visible' })
    
    // Выбираем артефакт
    await this.page.getByText(artifactTitle).click()
    
    // Подтверждаем выбор
    await this.confirmSelectionButton.click()
    
    // Ожидаем добавления в input
    await this.page.waitForFunction(() => {
      const input = document.querySelector('[data-testid="chat-input-textarea"]') as HTMLTextAreaElement
      return input?.value?.includes('artifact:') || false
    }, {}, { timeout: 5000 })
  }

  /**
   * @description Проверяет наличие артефакта в сообщении
   * 
   * @param expectedContent - Ожидаемый контент или указание на артефакт
   */
  async verifyArtifactInInput(expectedContent = 'artifact:'): Promise<void> {
    await this.page.waitForFunction((content) => {
      const input = document.querySelector('[data-testid="chat-input-textarea"]') as HTMLTextAreaElement
      return input?.value?.includes(content) || false
    }, expectedContent, { timeout: 5000 })
  }

  // ===== УТИЛИТЫ =====

  /**
   * @description Эмулирует истечение TTL буфера
   * 
   * @feature Для тестирования автоочистки буфера
   */
  async emulateClipboardExpiry(): Promise<void> {
    await this.page.evaluate(() => {
      // Эмулируем истечение TTL через cookie
      document.cookie = 'clipboard-expired=true; path=/; domain=.localhost'
    })
  }

  /**
   * @description Навигация к артефакту по названию
   * 
   * @param artifactTitle - Название артефакта
   */
  async navigateToArtifact(artifactTitle: string): Promise<void> {
    await this.page.goto('/artifacts')
    await this.page.getByText(artifactTitle).first().click()
    
    // Ожидаем загрузки панели артефакта
    await this.page.getByTestId('artifact-title').waitFor({ state: 'visible' })
  }

  /**
   * @description Создает новый чат для проверки буфера
   */
  async createNewChat(): Promise<void> {
    await this.page.getByTestId('header-new-chat-button').click()
    
    // Ожидаем загрузки чата
    await this.page.waitForURL(/.*\/chat.*/)
  }

  /**
   * @description Отправляет сообщение с прикрепленным артефактом
   * 
   * @param prompt - Промпт для AI
   */
  async sendMessageWithArtifact(prompt: string): Promise<void> {
    // Добавляем промпт к уже прикрепленному артефакту
    const currentValue = await this.chatInput.inputValue()
    await this.chatInput.fill(`${currentValue} ${prompt}`)
    
    // Отправляем сообщение
    await this.page.getByTestId('chat-send-button').click()
  }

  /**
   * @description Ожидает завершения AI ответа
   */
  async waitForAIResponse(): Promise<void> {
    // Ожидание исчезновения loading индикаторов
    await this.page.waitForFunction(() => {
      const skeletons = document.querySelectorAll('[data-testid*="skeleton"]')
      const loadingSpinners = document.querySelectorAll('.animate-spin')
      return skeletons.length === 0 && loadingSpinners.length === 0
    }, { timeout: 30000 })
    
    // Дополнительная пауза для стабильности
    await this.page.waitForTimeout(1000)
  }

  /**
   * @description Проверяет последнее сообщение AI на содержание контекста
   * 
   * @param expectedKeyword - Ключевое слово из контекста артефакта
   */
  async verifyAIContextResponse(expectedKeyword: string): Promise<void> {
    const lastMessage = this.page.getByTestId('chat-message').last()
    await lastMessage.waitFor({ state: 'visible' })
    
    // Проверяем что AI использовал контекст артефакта
    await this.page.waitForFunction((keyword) => {
      const messages = document.querySelectorAll('[data-testid="chat-message"]')
      const lastMsg = messages[messages.length - 1]
      return lastMsg?.textContent?.toLowerCase().includes(keyword.toLowerCase()) || false
    }, expectedKeyword, { timeout: 10000 })
  }
}

/**
 * @description Хелперы для тестирования cross-chat переиспользования
 * 
 * @feature Утилиты для проверки поведения буфера между разными чатами
 */
export class CrossChatHelpers {
  constructor(private page: Page, private clipboardPage: ClipboardPage) {}

  /**
   * @description Тестирует переиспользование артефакта в нескольких чатах
   * 
   * @param chatCount - Количество чатов для тестирования
   * @param prompts - Массив промптов для каждого чата
   */
  async testMultiChatReuse(chatCount: number, prompts: string[]): Promise<void> {
    for (let i = 0; i < chatCount; i++) {
      console.log(`🔄 Testing chat ${i + 1}/${chatCount}`)
      
      // Создаем новый чат
      await this.clipboardPage.createNewChat()
      
      // Проверяем наличие артефакта в буфере
      const status = await this.clipboardPage.getClipboardStatus()
      if (status !== 'has-artifact') {
        throw new Error(`Expected artifact in clipboard for chat ${i + 1}, but got: ${status}`)
      }
      
      // Подтверждаем прикрепление
      await this.clipboardPage.confirmAttachment()
      
      // Отправляем сообщение с промптом
      const prompt = prompts[i] || `Test prompt for chat ${i + 1}`
      await this.clipboardPage.sendMessageWithArtifact(prompt)
      
      // Ожидаем ответа AI
      await this.clipboardPage.waitForAIResponse()
      
      console.log(`✅ Chat ${i + 1} completed successfully`)
    }
  }

  /**
   * @description Проверяет что буфер очищается только при явной отмене
   */
  async verifyBufferPersistence(): Promise<void> {
    // Создаем несколько чатов и проверяем что буфер сохраняется
    for (let i = 1; i <= 3; i++) {
      await this.clipboardPage.createNewChat()
      
      const status = await this.clipboardPage.getClipboardStatus()
      if (status !== 'has-artifact') {
        throw new Error(`Buffer should persist across chats, but was empty in chat ${i}`)
      }
      
      // Подтверждаем прикрепление (НЕ очищает буфер)
      await this.clipboardPage.confirmAttachment()
    }
    
    console.log(`🔄 Buffer persistence verified across multiple chats`)
  }

  /**
   * @description Тестирует очистку буфера при отмене
   */
  async testBufferClearance(): Promise<void> {
    // Создаем чат и отменяем прикрепление
    await this.clipboardPage.createNewChat()
    
    const statusBefore = await this.clipboardPage.getClipboardStatus()
    if (statusBefore !== 'has-artifact') {
      throw new Error('Expected artifact in buffer before clearance test')
    }
    
    // Отменяем прикрепление (очищаем буфер)
    await this.clipboardPage.cancelAttachment()
    
    // Создаем новый чат и проверяем что буфер пуст
    await this.clipboardPage.createNewChat()
    
    const statusAfter = await this.clipboardPage.getClipboardStatus()
    if (statusAfter !== 'empty') {
      throw new Error(`Expected empty buffer after clearance, but got: ${statusAfter}`)
    }
    
    console.log(`🗑️ Buffer clearance verified`)
  }
}

// END OF: tests/helpers/clipboard-page.ts