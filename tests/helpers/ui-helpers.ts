/**
 * @file tests/helpers/ui-helpers.ts
 * @description Хелперы для тестов с использованием структурированных data-testid
 * @version 1.0.0
 * @date 2025-06-16
 * @created Создан для работы с новой иерархической системой testid
 */

import type { Page, } from '@playwright/test'

/**
 * Хелперы для работы с Header (шапка приложения)
 */
export class HeaderHelpers {
  constructor(private page: Page) {}

  get container() {
    return this.page.getByTestId('header')
  }

  get projectLogo() {
    return this.page.getByTestId('header-project-logo')
  }

  get newChatButton() {
    return this.page.getByTestId('header-new-chat-button')
  }

  get shareButton() {
    return this.page.getByTestId('header-share-button')
  }

  get themeSelector() {
    return this.page.getByTestId('header-theme-selector')
  }

  get userAvatar() {
    return this.page.getByTestId('header-user-avatar')
  }

  get userMenu() {
    return this.page.getByTestId('header-user-menu')
  }

  /**
   * Создает новый чат
   */
  async createNewChat() {
    await this.newChatButton.click()
  }

  /**
   * Открывает диалог шеринга
   */
  async openShareDialog() {
    await this.shareButton.click()
  }

  /**
   * Переключает тему приложения
   */
  async switchTheme() {
    await this.themeSelector.click()
  }

  /**
   * Открывает меню пользователя
   */
  async openUserMenu() {
    await this.userMenu.click()
  }
}

/**
 * Хелперы для работы с Chat Input (поле ввода чата)
 */
export class ChatInputHelpers {
  constructor(private page: Page) {}

  get container() {
    return this.page.getByTestId('chat-input-container')
  }

  get textarea() {
    return this.page.getByTestId('chat-input-textarea')
  }

  get attachMenu() {
    return this.page.getByTestId('chat-input-attach-menu')
  }

  get modelSelector() {
    return this.page.getByTestId('chat-input-model-selector')
  }

  get sendButton() {
    return this.page.getByTestId('chat-input-send-button')
  }

  get attachmentsPreview() {
    return this.page.getByTestId('chat-input-attachments-preview')
  }

  get clipboardArtifact() {
    return this.page.getByTestId('chat-input-clipboard-artifact')
  }

  /**
   * Вводит сообщение в поле ввода
   */
  async typeMessage(message: string) {
    await this.textarea.fill(message)
  }

  /**
   * Отправляет сообщение
   */
  async sendMessage(message?: string) {
    if (message) {
      await this.typeMessage(message)
    }
    await this.sendButton.click()
  }

  /**
   * Отправляет сообщение через Ctrl+Enter
   */
  async sendMessageWithKeyboard(message: string) {
    await this.typeMessage(message)
    await this.textarea.press('Control+Enter')
  }

  /**
   * Открывает меню прикрепления файлов
   */
  async openAttachMenu() {
    await this.attachMenu.click()
  }

  /**
   * Проверяет наличие артефакта в буфере
   */
  async hasClipboardArtifact() {
    return await this.clipboardArtifact.isVisible()
  }

  /**
   * Очищает буфер артефакта
   */
  async clearClipboardArtifact() {
    const cancelButton = this.clipboardArtifact.locator('button')
    await cancelButton.click()
  }
}

/**
 * Хелперы для работы с Artifact Panel (панель артефактов)
 */
export class ArtifactPanelHelpers {
  constructor(private page: Page) {}

  get container() {
    return this.page.getByTestId('artifact-panel')
  }

  get closeButton() {
    return this.page.getByTestId('artifact-panel-close-button')
  }

  get fullscreenButton() {
    return this.page.getByTestId('artifact-panel-fullscreen-button')
  }

  get title() {
    return this.page.getByTestId('artifact-panel-title')
  }

  get content() {
    return this.page.getByTestId('artifact-panel-content')
  }

  /**
   * Закрывает панель артефакта
   */
  async close() {
    await this.closeButton.click()
  }

  /**
   * Переключает в полноэкранный режим
   */
  async toggleFullscreen() {
    await this.fullscreenButton.click()
  }

  /**
   * Проверяет, открыта ли панель артефакта
   */
  async isOpen() {
    return await this.container.isVisible()
  }
}

/**
 * Хелперы для работы с Artifact Actions (действия с артефактами)
 */
export class ArtifactActionsHelpers {
  constructor(private page: Page) {}

  get discussButton() {
    return this.page.getByTestId('artifact-actions-discuss-button')
  }

  get addToChatButton() {
    return this.page.getByTestId('artifact-actions-add-to-chat-button')
  }

  get saveStatus() {
    return this.page.getByTestId('artifact-actions-save-status')
  }

  /**
   * Открывает чат для обсуждения артефакта
   */
  async discussInChat() {
    await this.discussButton.click()
  }

  /**
   * Добавляет артефакт в буфер для использования в чате
   */
  async addToChat() {
    await this.addToChatButton.click()
  }

  /**
   * Проверяет статус сохранения артефакта
   */
  async getSaveStatus(): Promise<'idle' | 'saving' | 'saved'> {
    const saveStatusElement = this.saveStatus
    
    // Проверяем классы для определения статуса
    if (await saveStatusElement.locator('.animate-spin').isVisible()) {
      return 'saving'
    }
    if (await saveStatusElement.locator('.text-green-500').isVisible()) {
      return 'saved'
    }
    return 'idle'
  }

  /**
   * Ждет завершения сохранения артефакта
   */
  async waitForSaved(timeout = 10000) {
    await this.page.waitForFunction(
      () => {
        const element = document.querySelector('[data-testid="artifact-actions-save-status"]')
        return element?.querySelector('.text-green-500') !== null
      },
      {},
      { timeout }
    )
  }
}

/**
 * Хелперы для работы с Sidebar (боковая панель)
 */
export class SidebarHelpers {
  constructor(private page: Page) {}

  get container() {
    return this.page.getByTestId('sidebar')
  }

  get chatsSection() {
    return this.page.getByTestId('sidebar-chats-section')
  }

  get chatsHistory() {
    return this.page.getByTestId('sidebar-chats-history')
  }

  get artifactsSection() {
    return this.page.getByTestId('sidebar-artifacts-section')
  }

  get artifactsList() {
    return this.page.getByTestId('sidebar-artifacts-list')
  }

  get toggle() {
    return this.page.getByTestId('sidebar-toggle')
  }

  /**
   * Получает элемент чата по индексу
   */
  getChatItem(index: number) {
    return this.page.getByTestId('sidebar-chat-item').nth(index)
  }

  /**
   * Получает кнопку удаления чата по индексу
   */
  getChatDeleteButton(index: number) {
    return this.getChatItem(index).getByTestId('sidebar-chat-item-delete-button')
  }

  /**
   * Получает элемент артефакта по индексу
   */
  getArtifactItem(index: number) {
    return this.page.getByTestId('sidebar-artifact-item').nth(index)
  }

  /**
   * Переключает видимость сайдбара
   */
  async toggleSidebar() {
    await this.toggle.click()
  }

  /**
   * Удаляет чат по индексу
   */
  async deleteChat(index: number) {
    await this.getChatDeleteButton(index).click()
  }

  /**
   * Кликает по чату для открытия
   */
  async openChat(index: number) {
    await this.getChatItem(index).click()
  }

  /**
   * Проверяет, сколько чатов в истории
   */
  async getChatCount() {
    return await this.page.getByTestId('sidebar-chat-item').count()
  }
}

/**
 * Хелперы для работы с Messages (сообщения чата)
 */
export class ChatMessageHelpers {
  constructor(private page: Page) {}

  /**
   * Получает сообщение по индексу
   */
  getMessage(index: number) {
    return this.page.getByTestId('chat-message').nth(index)
  }

  /**
   * Получает кнопку копирования сообщения
   */
  getMessageCopyButton(index: number) {
    return this.getMessage(index).getByTestId('chat-message-copy-button')
  }

  /**
   * Получает кнопку редактирования сообщения
   */
  getMessageEditButton(index: number) {
    return this.getMessage(index).getByTestId('chat-message-edit-button')
  }

  /**
   * Получает кнопку удаления сообщения
   */
  getMessageDeleteButton(index: number) {
    return this.getMessage(index).getByTestId('chat-message-delete-button')
  }

  /**
   * Получает превью артефакта в сообщении
   */
  getArtifactPreview(messageIndex: number) {
    return this.getMessage(messageIndex).getByTestId('chat-message-artifact-preview')
  }

  /**
   * Копирует сообщение
   */
  async copyMessage(index: number) {
    await this.getMessageCopyButton(index).click()
  }

  /**
   * Редактирует сообщение
   */
  async editMessage(index: number) {
    await this.getMessageEditButton(index).click()
  }

  /**
   * Удаляет сообщение
   */
  async deleteMessage(index: number) {
    await this.getMessageDeleteButton(index).click()
  }

  /**
   * Открывает артефакт из превью в сообщении
   */
  async openArtifactFromMessage(messageIndex: number) {
    await this.getArtifactPreview(messageIndex).click()
  }

  /**
   * Получает количество сообщений
   */
  async getMessageCount() {
    return await this.page.getByTestId('chat-message').count()
  }
}

/**
 * Главный класс для всех UI хелперов
 */
export class UIHelpers {
  public header: HeaderHelpers
  public chatInput: ChatInputHelpers
  public artifactPanel: ArtifactPanelHelpers
  public artifactActions: ArtifactActionsHelpers
  public sidebar: SidebarHelpers
  public chatMessages: ChatMessageHelpers

  constructor(private page: Page) {
    this.header = new HeaderHelpers(page)
    this.chatInput = new ChatInputHelpers(page)
    this.artifactPanel = new ArtifactPanelHelpers(page)
    this.artifactActions = new ArtifactActionsHelpers(page)
    this.sidebar = new SidebarHelpers(page)
    this.chatMessages = new ChatMessageHelpers(page)
  }

  /**
   * Фабричная функция для создания UI хелперов
   */
  static create(page: Page) {
    return new UIHelpers(page)
  }
}

// Экспорт для удобного использования
export function createUIHelpers(page: Page) {
  return UIHelpers.create(page)
}

// END OF: tests/helpers/ui-helpers.ts