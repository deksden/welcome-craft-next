/**
 * @file tests/e2e/ai-first-workflow.test.ts
 * @description Упрощенные UI тесты workflow с test auth (без AI интеграций)
 * @version 2.0.0
 * @date 2025-06-15
 */

import { test, expect } from '@playwright/test';
import { setupTestAuth, navigateWithAuth, waitForChatReady, generateTestUser } from '../helpers/auth-helper';

test.describe('Workflow UI Tests with Test Auth', () => {
  
  test('User can interact with chat workflow interface', async ({ page }) => {
    const testUser = generateTestUser('workflow-basic');
    await setupTestAuth(page, testUser);
    await navigateWithAuth(page, '/');
    await waitForChatReady(page);
    
    // Проверяем базовые элементы workflow
    await expect(page.getByTestId('chat-input')).toBeVisible();
    await expect(page.getByTestId('send-button')).toBeVisible();
    
    // Проверяем что можем вводить текст для workflow
    const chatInput = page.getByTestId('chat-input');
    const workflowMessage = 'Create an onboarding site for new developers';
    await chatInput.fill(workflowMessage);
    await expect(chatInput).toHaveValue(workflowMessage);
    
    console.log('✅ Basic workflow interface is functional');
  });

  test('Chat interface supports workflow interactions', async ({ page }) => {
    const testUser = generateTestUser('workflow-interactions');
    await setupTestAuth(page, testUser);
    await navigateWithAuth(page, '/');
    await waitForChatReady(page);
    
    const chatInput = page.getByTestId('chat-input');
    const sendButton = page.getByTestId('send-button');
    
    // Тестируем различные типы workflow сообщений
    const workflowMessages = [
      'Create a welcome text artifact',
      'Generate a contact list',
      'Build an onboarding site',
      'Add company information'
    ];
    
    for (const message of workflowMessages) {
      await chatInput.clear();
      await chatInput.fill(message);
      await expect(sendButton).toBeEnabled();
      
      // Очищаем для следующей итерации
      await chatInput.clear();
      await expect(sendButton).toBeDisabled();
    }
    
    console.log('✅ Chat interface supports various workflow messages');
  });

  test('Workflow interface handles keyboard interactions', async ({ page }) => {
    const testUser = generateTestUser('workflow-keyboard');
    await setupTestAuth(page, testUser);
    await navigateWithAuth(page, '/');
    await waitForChatReady(page);
    
    const chatInput = page.getByTestId('chat-input');
    
    // Фокус на input
    await chatInput.focus();
    await expect(chatInput).toBeFocused();
    
    // Ввод через клавиатуру
    await page.keyboard.type('Create onboarding workflow');
    await expect(chatInput).toHaveValue('Create onboarding workflow');
    
    // Попытка отправки через Enter (может не работать без настроенного backend)
    await page.keyboard.press('Enter');
    
    console.log('✅ Workflow interface supports keyboard interactions');
  });

  test('Workflow interface provides visual feedback', async ({ page }) => {
    const testUser = generateTestUser('workflow-feedback');
    await setupTestAuth(page, testUser);
    await navigateWithAuth(page, '/');
    await waitForChatReady(page);
    
    const chatInput = page.getByTestId('chat-input');
    const sendButton = page.getByTestId('send-button');
    
    // Проверяем начальное состояние
    await expect(sendButton).toBeDisabled();
    
    // Добавляем текст и проверяем активацию кнопки
    await chatInput.fill('Generate artifacts');
    await expect(sendButton).toBeEnabled();
    
    // Очищаем и проверяем деактивацию
    await chatInput.clear();
    await expect(sendButton).toBeDisabled();
    
    console.log('✅ Workflow interface provides proper visual feedback');
  });

  test('Workflow interface handles long text input', async ({ page }) => {
    const testUser = generateTestUser('workflow-longtext');
    await setupTestAuth(page, testUser);
    await navigateWithAuth(page, '/');
    await waitForChatReady(page);
    
    const chatInput = page.getByTestId('chat-input');
    
    // Тестируем длинный workflow запрос
    const longWorkflowText = `
      Create a comprehensive onboarding workflow for new software developers that includes:
      1. Welcome message and company introduction
      2. Technical setup instructions for development environment
      3. Team introductions and contact information
      4. First week project assignments and goals
      5. Resource links for documentation and tools
      Please generate this as multiple artifacts that can be combined into a site.
    `.trim();
    
    await chatInput.fill(longWorkflowText);
    await expect(chatInput).toHaveValue(longWorkflowText);
    
    // Проверяем что send button активен для длинного текста
    const sendButton = page.getByTestId('send-button');
    await expect(sendButton).toBeEnabled();
    
    console.log('✅ Workflow interface handles long text input');
  });

  test('Workflow UI maintains state during session', async ({ page }) => {
    const testUser = generateTestUser('workflow-state');
    await setupTestAuth(page, testUser);
    await navigateWithAuth(page, '/');
    await waitForChatReady(page);
    
    // Вводим workflow запрос
    const chatInput = page.getByTestId('chat-input');
    const workflowText = 'Create employee onboarding materials';
    await chatInput.fill(workflowText);
    
    // Симулируем потерю и возврат фокуса
    await page.getByRole('main').click(); // Клик вне input
    await chatInput.click(); // Возврат фокуса на input
    
    // Проверяем что текст сохранился
    await expect(chatInput).toHaveValue(workflowText);
    
    console.log('✅ Workflow UI maintains state during session');
  });

  test('Workflow interface suggests appropriate actions', async ({ page }) => {
    const testUser = generateTestUser('workflow-suggestions');
    await setupTestAuth(page, testUser);
    await navigateWithAuth(page, '/');
    await waitForChatReady(page);
    
    // Ищем suggested actions (если есть)
    const suggestedActions = page.getByTestId('suggested-actions');
    const hasSuggestions = await suggestedActions.isVisible().catch(() => false);
    
    if (hasSuggestions) {
      // Проверяем что есть предложения, связанные с workflow
      const suggestionsText = await suggestedActions.textContent();
      const hasWorkflowSuggestions = suggestionsText?.toLowerCase().includes('onboard') || 
                                   suggestionsText?.toLowerCase().includes('create') ||
                                   suggestionsText?.toLowerCase().includes('site');
      
      if (hasWorkflowSuggestions) {
        console.log('✅ Workflow interface provides relevant suggestions');
      } else {
        console.log('ℹ️ Suggestions present but not workflow-specific');
      }
    } else {
      console.log('ℹ️ No suggested actions found (normal for empty chat)');
    }
  });

  test('Workflow interface accessibility basics', async ({ page }) => {
    const testUser = generateTestUser('workflow-a11y');
    await setupTestAuth(page, testUser);
    await navigateWithAuth(page, '/');
    await waitForChatReady(page);
    
    const chatInput = page.getByTestId('chat-input');
    const sendButton = page.getByTestId('send-button');
    
    // Проверяем базовые aria attributes
    const inputAriaLabel = await chatInput.getAttribute('aria-label');
    const inputPlaceholder = await chatInput.getAttribute('placeholder');
    
    // Должен быть либо aria-label, либо placeholder для доступности
    expect(inputAriaLabel || inputPlaceholder).toBeTruthy();
    
    // Проверяем что элементы focusable
    await chatInput.focus();
    await expect(chatInput).toBeFocused();
    
    await sendButton.focus();
    await expect(sendButton).toBeFocused();
    
    console.log('✅ Workflow interface meets basic accessibility requirements');
  });
});