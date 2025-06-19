/**
 * @file tests/helpers/sidebar-page.ts
 * @description Page Object Model для боковой панели приложения согласно Доктрине WelcomeCraft
 * @version 1.0.0
 * @date 2025-06-19
 * @updated Создание POM класса для sidebar с новыми testid
 */

/** HISTORY:
 * v1.0.0 (2025-06-19): Начальная версия с поддержкой новых testid из app-sidebar.tsx
 */

import type { Page, Locator } from '@playwright/test'
import { TestUtils } from './test-utils'

/**
 * @description Page Object Model для боковой панели приложения
 * @feature Поддержка всех testid из schema Доктрины WelcomeCraft
 * @feature Fail-fast локаторы с 2-секундным timeout
 * @feature Fallback стратегии для совместимости
 */
export class SidebarPage {
  private testUtils: TestUtils

  constructor(private page: Page) {
    this.testUtils = new TestUtils(page)
  }

  // ===== ОСНОВНЫЕ ЭЛЕМЕНТЫ =====

  /**
   * @description Кнопка переключения сайдбара (collapse/expand)
   * @returns Локатор кнопки toggle
   */
  async getToggleButton(): Promise<Locator> {
    return await this.testUtils.fastLocator('sidebar-toggle-button')
  }

  /**
   * @description Секция AI чата в сайдбаре
   * @returns Локатор секции чатов
   */
  async getChatSection(): Promise<Locator> {
    return await this.testUtils.fastLocator('sidebar-chat-section')
  }

  /**
   * @description Кнопка секции артефактов
   * @returns Локатор кнопки артефактов
   */
  async getArtifactsButton(): Promise<Locator> {
    return await this.testUtils.fastLocator('sidebar-artifacts-button')
  }

  /**
   * @description Кнопка "Все артефакты"
   * @returns Локатор кнопки всех артефактов
   */
  async getAllArtifactsButton(): Promise<Locator> {
    return await this.testUtils.fastLocator('sidebar-all-artifacts-button')
  }

  // ===== ЭЛЕМЕНТЫ ЧАТОВ =====

  /**
   * @description Элементы чатов в списке
   * @returns Массив локаторов элементов чатов
   */
  async getChatItems(): Promise<Locator[]> {
    const items = await this.page.locator('[data-testid="sidebar-chat-item"]').all()
    return items
  }

  /**
   * @description Кнопка меню действий конкретного чата
   * @param chatIndex - индекс чата в списке (0-based)
   * @returns Локатор кнопки меню
   */
  async getChatMenuButton(chatIndex = 0): Promise<Locator> {
    const chatItems = await this.getChatItems()
    if (chatIndex >= chatItems.length) {
      throw new Error(`Chat index ${chatIndex} out of range (${chatItems.length} chats available)`)
    }
    return chatItems[chatIndex].locator('[data-testid="sidebar-chat-menu-button"]')
  }

  /**
   * @description Действие переименования чата в выпадающем меню
   * @returns Локатор действия переименования
   */
  async getChatRenameAction(): Promise<Locator> {
    return await this.testUtils.fastLocator('sidebar-chat-rename-action')
  }

  /**
   * @description Подменю публикации чата
   * @returns Локатор подменю публикации
   */
  async getChatShareMenu(): Promise<Locator> {
    return await this.testUtils.fastLocator('sidebar-chat-share-menu')
  }

  /**
   * @description Действие удаления чата
   * @returns Локатор действия удаления
   */
  async getChatDeleteAction(): Promise<Locator> {
    return await this.testUtils.fastLocator('sidebar-chat-delete-action')
  }

  // ===== ВЫСОКОУРОВНЕВЫЕ ДЕЙСТВИЯ =====

  /**
   * @description Переключить состояние сайдбара (collapse/expand)
   * @feature Graceful degradation если кнопка не найдена
   */
  async toggleSidebar(): Promise<void> {
    try {
      const toggleButton = await this.getToggleButton()
      await toggleButton.click()
      console.log('✅ Sidebar toggled successfully')
    } catch (error) {
      console.log('⚠️ Sidebar toggle button not found, but continuing')
    }
  }

  /**
   * @description Перейти к секции чатов
   * @feature Fail-fast с логированием
   */
  async navigateToChats(): Promise<void> {
    try {
      const chatSection = await this.getChatSection()
      await chatSection.click()
      console.log('✅ Navigated to chat section')
    } catch (error) {
      console.log('❌ Failed to navigate to chat section:', error)
      throw error
    }
  }

  /**
   * @description Перейти к секции артефактов
   * @feature Fail-fast с логированием
   */
  async navigateToArtifacts(): Promise<void> {
    try {
      const artifactsButton = await this.getArtifactsButton()
      await artifactsButton.click()
      console.log('✅ Navigated to artifacts section')
    } catch (error) {
      console.log('❌ Failed to navigate to artifacts section:', error)
      throw error
    }
  }

  /**
   * @description Перейти на страницу всех артефактов
   * @feature Проверка навигации
   */
  async navigateToAllArtifacts(): Promise<void> {
    try {
      const allArtifactsButton = await this.getAllArtifactsButton()
      await allArtifactsButton.click()
      
      // Проверяем что навигация прошла успешно
      await this.page.waitForURL('**/artifacts', { timeout: 5000 })
      console.log('✅ Navigated to all artifacts page')
    } catch (error) {
      console.log('❌ Failed to navigate to all artifacts page:', error)
      throw error
    }
  }

  /**
   * @description Открыть меню действий для чата
   * @param chatIndex - индекс чата в списке
   * @feature Ожидание появления меню
   */
  async openChatMenu(chatIndex = 0): Promise<void> {
    try {
      const menuButton = await this.getChatMenuButton(chatIndex)
      await menuButton.click()
      
      // Ждем появление меню
      await this.testUtils.fastLocator('sidebar-chat-rename-action')
      console.log(`✅ Opened chat menu for chat #${chatIndex}`)
    } catch (error) {
      console.log(`❌ Failed to open chat menu for chat #${chatIndex}:`, error)
      throw error
    }
  }

  /**
   * @description Переименовать чат через меню
   * @param chatIndex - индекс чата
   * @feature Полный workflow переименования
   */
  async renameChat(chatIndex = 0): Promise<void> {
    try {
      await this.openChatMenu(chatIndex)
      
      const renameAction = await this.getChatRenameAction()
      await renameAction.click()
      
      console.log(`✅ Initiated rename for chat #${chatIndex}`)
    } catch (error) {
      console.log(`❌ Failed to rename chat #${chatIndex}:`, error)
      throw error
    }
  }

  /**
   * @description Удалить чат через меню
   * @param chatIndex - индекс чата
   * @feature Полный workflow удаления
   */
  async deleteChat(chatIndex = 0): Promise<void> {
    try {
      await this.openChatMenu(chatIndex)
      
      const deleteAction = await this.getChatDeleteAction()
      await deleteAction.click()
      
      console.log(`✅ Initiated delete for chat #${chatIndex}`)
    } catch (error) {
      console.log(`❌ Failed to delete chat #${chatIndex}:`, error)
      throw error
    }
  }

  // ===== ИНФОРМАЦИОННЫЕ МЕТОДЫ =====

  /**
   * @description Получить количество чатов в списке
   * @returns Количество чатов
   */
  async getChatCount(): Promise<number> {
    try {
      const chatItems = await this.getChatItems()
      console.log(`📊 Found ${chatItems.length} chats in sidebar`)
      return chatItems.length
    } catch (error) {
      console.log('⚠️ Could not count chats, returning 0')
      return 0
    }
  }

  /**
   * @description Проверить видимость секций сайдбара
   * @returns Статус видимости различных секций
   */
  async getSidebarStatus(): Promise<{
    toggleButton: boolean
    chatSection: boolean
    artifactsSection: boolean
    allArtifactsButton: boolean
  }> {
    const status = {
      toggleButton: false,
      chatSection: false,
      artifactsSection: false,
      allArtifactsButton: false
    }

    try {
      status.toggleButton = await (await this.getToggleButton()).isVisible()
    } catch { /* ignore */ }

    try {
      status.chatSection = await (await this.getChatSection()).isVisible()
    } catch { /* ignore */ }

    try {
      status.artifactsSection = await (await this.getArtifactsButton()).isVisible()
    } catch { /* ignore */ }

    try {
      status.allArtifactsButton = await (await this.getAllArtifactsButton()).isVisible()
    } catch { /* ignore */ }

    console.log('📋 Sidebar status:', status)
    return status
  }
}

// END OF: tests/helpers/sidebar-page.ts