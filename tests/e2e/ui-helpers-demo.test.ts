/**
 * @file tests/e2e/ui-helpers-demo.test.ts
 * @description Демонстрация использования UI хелперов с новыми data-testid
 * @version 1.0.0
 * @date 2025-06-16
 * @created Пример использования структурированных UI хелперов
 */

import { test, expect } from '@playwright/test'
import { createUIHelpers } from '../helpers/ui-helpers'

// logTestConfig() // Удалили использование '' из несуществующей функции

test.describe('UI Helpers Demo', () => {
  test('должен демонстрировать работу с Header хелперами', async ({ page }) => {
    const ui = createUIHelpers(page)
    
    // Переходим на страницу
    await page.goto(`${''}/api/test/auth-signin?redirect=/`)
    
    // Проверяем, что header загрузился
    await expect(ui.header.container).toBeVisible()
    
    // Проверяем логотип проекта
    await expect(ui.header.projectLogo).toBeVisible()
    await expect(ui.header.projectLogo).toContainText('WelcomeCraft')
    
    // Проверяем кнопку создания нового чата
    await expect(ui.header.newChatButton).toBeVisible()
    await expect(ui.header.newChatButton).toContainText('New Chat')
    
    // Создаем новый чат
    await ui.header.createNewChat()
    
    // Проверяем, что перешли на страницу чата
    await expect(page).toHaveURL(/\/chat\/[a-zA-Z0-9-]+/)
  })

  test('должен демонстрировать работу с ChatInput хелперами', async ({ page }) => {
    const ui = createUIHelpers(page)
    
    // Переходим на страницу чата
    await page.goto(`${''}/api/test/auth-signin?redirect=/`)
    await ui.header.createNewChat()
    
    // Проверяем контейнер поля ввода
    await expect(ui.chatInput.container).toBeVisible()
    
    // Проверяем основные элементы
    await expect(ui.chatInput.textarea).toBeVisible()
    await expect(ui.chatInput.attachMenu).toBeVisible()
    await expect(ui.chatInput.sendButton).toBeVisible()
    
    // Отправляем сообщение
    await ui.chatInput.sendMessage('Привет! Создай текстовый артефакт с приветствием.')
    
    // Проверяем, что сообщение отправилось
    await expect(ui.chatInput.textarea).toHaveValue('')
  })

  test('должен демонстрировать работу с Artifact хелперами', async ({ page }) => {
    const ui = createUIHelpers(page)
    
    // Переходим на страницу чата и отправляем запрос на создание артефакта
    await page.goto(`${''}/api/test/auth-signin?redirect=/`)
    await ui.header.createNewChat()
    
    await ui.chatInput.sendMessage('Создай простой текстовый артефакт с приветствием')
    
    // Ждем появления артефакта (может занять время из-за AI)
    // В реальном тесте здесь должна быть логика ожидания ответа AI
    
    // Проверяем действия с артефактами (если артефакт создан)
    const artifactPreview = ui.chatMessages.getArtifactPreview(0)
    if (await artifactPreview.isVisible()) {
      // Открываем артефакт
      await ui.chatMessages.openArtifactFromMessage(0)
      
      // Проверяем, что панель артефакта открылась
      await expect(ui.artifactPanel.container).toBeVisible()
      
      // Проверяем кнопки действий
      await expect(ui.artifactActions.addToChatButton).toBeVisible()
      await expect(ui.artifactActions.discussButton).toBeVisible()
      
      // Добавляем артефакт в буфер
      await ui.artifactActions.addToChat()
      
      // Закрываем панель артефакта
      await ui.artifactPanel.close()
      
      // Проверяем, что панель закрылась
      await expect(ui.artifactPanel.container).not.toBeVisible()
    }
  })

  test('должен демонстрировать работу с ChatMessage хелперами', async ({ page }) => {
    const ui = createUIHelpers(page)
    
    // Переходим на страницу чата
    await page.goto(`${''}/api/test/auth-signin?redirect=/`)
    await ui.header.createNewChat()
    
    // Отправляем несколько сообщений
    await ui.chatInput.sendMessage('Первое сообщение')
    await ui.chatInput.sendMessage('Второе сообщение')
    
    // Проверяем количество сообщений
    const messageCount = await ui.chatMessages.getMessageCount()
    expect(messageCount).toBeGreaterThanOrEqual(2)
    
    // Проверяем первое сообщение
    const firstMessage = ui.chatMessages.getMessage(0)
    await expect(firstMessage).toBeVisible()
    
    // Проверяем кнопки действий с сообщениями (если они доступны)
    const copyButton = ui.chatMessages.getMessageCopyButton(0)
    if (await copyButton.isVisible()) {
      await ui.chatMessages.copyMessage(0)
    }
  })

  test('должен демонстрировать работу с Sidebar хелперами', async ({ page }) => {
    const ui = createUIHelpers(page)
    
    // Переходим на страницу
    await page.goto(`${''}/api/test/auth-signin?redirect=/`)
    
    // Проверяем сайдбар
    await expect(ui.sidebar.container).toBeVisible()
    
    // Проверяем toggle кнопку
    await expect(ui.sidebar.toggle).toBeVisible()
    
    // Создаем несколько чатов для тестирования
    await ui.header.createNewChat()
    await ui.chatInput.sendMessage('Тестовое сообщение 1')
    
    await ui.header.createNewChat()
    await ui.chatInput.sendMessage('Тестовое сообщение 2')
    
    // Проверяем количество чатов в истории
    const chatCount = await ui.sidebar.getChatCount()
    expect(chatCount).toBeGreaterThanOrEqual(1)
    
    // Открываем первый чат из истории
    if (chatCount > 0) {
      await ui.sidebar.openChat(0)
    }
  })

  test('должен демонстрировать полный workflow создания и работы с артефактом', async ({ page }) => {
    const ui = createUIHelpers(page)
    
    // 1. Начальная настройка
    await page.goto(`${''}/api/test/auth-signin?redirect=/`)
    await ui.header.createNewChat()
    
    // 2. Создание артефакта
    await ui.chatInput.sendMessage('Создай простой текстовый артефакт')
    
    // 3. Ожидание создания артефакта (в реальном тесте нужен proper wait)
    await page.waitForTimeout(2000)
    
    // 4. Работа с артефактом (если создан)
    const messageCount = await ui.chatMessages.getMessageCount()
    if (messageCount > 0) {
      const artifactPreview = ui.chatMessages.getArtifactPreview(messageCount - 1)
      
      if (await artifactPreview.isVisible()) {
        // Открываем артефакт
        await ui.chatMessages.openArtifactFromMessage(messageCount - 1)
        
        // Проверяем панель
        await expect(ui.artifactPanel.container).toBeVisible()
        
        // Добавляем в буфер
        await ui.artifactActions.addToChat()
        
        // Проверяем буфер
        await expect(ui.chatInput.clipboardArtifact).toBeVisible()
        
        // Создаем новый чат с артефактом в буфере
        await ui.header.createNewChat()
        
        // Проверяем, что буфер перенесся
        await expect(ui.chatInput.clipboardArtifact).toBeVisible()
        
        // Отправляем сообщение с прикрепленным артефактом
        await ui.chatInput.sendMessage('Используй этот артефакт для создания улучшенной версии')
        
        // Проверяем, что буфер очистился
        await expect(ui.chatInput.clipboardArtifact).not.toBeVisible()
      }
    }
  })
})

// END OF: tests/e2e/ui-helpers-demo.test.ts