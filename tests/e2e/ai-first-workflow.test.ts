/**
 * E2E тесты для AI-first workflow WelcomeCraft
 * Основные сценарии взаимодействия с AI для создания онбординг-материалов
 */

import { test, expect } from '../fixtures';
import { ChatPage } from '../pages/chat';
import { ArtifactPage } from '../pages/artifact';
import { TestUtils } from '../helpers/test-utils';
import { AIMockHelper } from '../helpers/ai-mock';

test.describe('AI-First Workflow', () => {
  let chatPage: ChatPage;
  let artifactPage: ArtifactPage;
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    artifactPage = new ArtifactPage(page);
    testUtils = new TestUtils(page);
    
    await testUtils.cleanupTestData();
    
    // Настройка AI mocks перед регистрацией
    await testUtils.setupAIMocks();
    
    // Регистрация пользователя перед каждым тестом
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    await testUtils.registerUser(email, 'testpassword123');
  });

  test.afterEach(async () => {
    await testUtils.disableAIMocks();
    await testUtils.resetNetwork();
    AIMockHelper.clearCustomResponses();
  });

  test('Complete onboarding creation workflow via AI', async () => {
    // Шаг 1: Создание базового контента
    await testUtils.sendMessage('Создай текстовый артефакт с приветствием для нового сотрудника');
    
    const firstArtifact = await testUtils.waitForArtifact();
    expect(firstArtifact).toBeVisible();
    
    // Шаг 2: Создание списка контактов
    await testUtils.sendMessage('Создай список ключевых контактов для онбординга');
    
    const secondArtifact = await testUtils.waitForArtifact();
    expect(secondArtifact).toBeVisible();
    
    // Шаг 3: Генерация сайта из артефактов
    await testUtils.sendMessage('Сгенерируй онбординг-сайт используя созданные артефакты');
    
    const siteArtifact = await testUtils.waitForArtifact();
    expect(siteArtifact).toBeVisible();
    
    // Проверка завершенности workflow
    const messages = await chatPage.getAllMessages();
    expect(messages.length).toBeGreaterThanOrEqual(6); // 3 пользователя + 3 AI ответа
  });

  test('AI artifact creation and modification flow', async () => {
    // Создание артефакта
    await testUtils.sendMessage('Создай код компонента React для приветствия');
    
    let artifact = await testUtils.waitForArtifact();
    expect(artifact).toBeVisible();
    
    // Модификация через AI
    await testUtils.sendMessage('Добавь в компонент стили и анимацию');
    await testUtils.waitForAIGeneration();
    
    // Проверка обновления артефакта
    artifact = await testUtils.waitForElement('artifact');
    expect(artifact).toBeVisible();
    
    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toContain('обновил');
  });

  test('Multiple artifact types creation', async () => {
    const artifactTypes = [
      { command: 'Создай текстовый артефакт с инструкцией', type: 'text' },
      { command: 'Создай код React компонента', type: 'code' },
      { command: 'Создай HTML страницу приветствия', type: 'code' }
    ];

    for (const { command, type } of artifactTypes) {
      await testUtils.sendMessage(command);
      
      const artifact = await testUtils.waitForArtifact();
      expect(artifact).toBeVisible();
      
      // Проверка типа артефакта через UI индикаторы
      const typeIndicator = await testUtils.waitForElement(`artifact-type-${type}`);
      expect(typeIndicator).toBeVisible();
    }
  });

  test('AI conversation context preservation', async () => {
    // Создание первого артефакта
    await testUtils.sendMessage('Создай список задач для первого дня');
    await testUtils.waitForArtifact();
    
    // Контекстная модификация
    await testUtils.sendMessage('Добавь туда встречу с наставником');
    await testUtils.waitForAIGeneration();
    
    // Создание связанного контента
    await testUtils.sendMessage('Теперь создай артефакт с информацией о наставнике');
    await testUtils.waitForArtifact();
    
    const messages = await chatPage.getAllMessages();
    const aiMessages = messages.filter(m => m.role === 'assistant');
    
    // Проверка что AI сохраняет контекст
    expect(aiMessages[1].content).toContain('добавил');
    expect(aiMessages[2].content).toContain('наставник');
  });

  test('AI error handling and recovery', async () => {
    // Симуляция медленного соединения
    await testUtils.simulateSlowNetwork();
    
    await testUtils.sendMessage('Создай большой артефакт с детальной информацией');
    
    // Остановка генерации
    const stopButton = await testUtils.waitForElement('stop-button');
    await stopButton.click();
    
    // Проверка состояния после остановки
    const sendButton = await testUtils.waitForElement('send-button');
    expect(sendButton).toBeVisible();
    
    // Повторная попытка
    await testUtils.resetNetwork();
    await testUtils.sendMessage('Создай простой текстовый артефакт');
    
    const artifact = await testUtils.waitForArtifact();
    expect(artifact).toBeVisible();
  });

  test('Collaborative AI workflow with file upload', async () => {
    // Загрузка файла
    await chatPage.addImageAttachment();
    
    await testUtils.waitForElement('attachments-preview');
    await testUtils.sendMessage('Проанализируй этот файл и создай на его основе онбординг контент');
    
    await testUtils.waitForAIGeneration();
    
    const userMessage = await chatPage.getRecentUserMessage();
    expect(userMessage.attachments).toHaveLength(1);
    
    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toContain('анализ');
  });

  test('AI suggestion-based workflow', async () => {
    // Использование предложенного промпта
    await chatPage.sendUserMessageFromSuggestion();
    await testUtils.waitForAIGeneration();
    
    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toContain('создание онбординг-сайта');
    
    // Скрытие предложений после использования
    const suggestions = testUtils.page.locator('[data-testid="suggested-actions"]');
    await expect(suggestions).not.toBeVisible();
  });

  test('Long conversation with AI context management', async () => {
    const conversationSteps = [
      'Привет! Помоги создать онбординг для разработчика',
      'Создай приветственный текст',
      'Добавь список необходимых инструментов',
      'Создай чек-лист для первой недели',
      'Объедини все в красивый сайт'
    ];

    for (const step of conversationSteps) {
      await testUtils.sendMessage(step);
      await testUtils.waitForAIGeneration();
    }

    // Проверка автопрокрутки
    await testUtils.waitForDOMStability();
    const isAtBottom = await chatPage.isScrolledToBottom();
    expect(isAtBottom).toBe(true);

    // Проверка что все сообщения сохранились
    const messages = await chatPage.getAllMessages();
    expect(messages.length).toBe(conversationSteps.length * 2); // user + AI для каждого шага
  });

  test('AI accessibility in workflow', async () => {
    await testUtils.sendMessage('Создай артефакт с инструкцией');
    await testUtils.waitForArtifact();
    
    // Проверка доступности ключевых элементов
    const chatInputAccessible = await testUtils.checkElementAccessibility('chat-input');
    expect(chatInputAccessible).toBe(true);
    
    const sendButtonAccessible = await testUtils.checkElementAccessibility('send-button');
    expect(sendButtonAccessible).toBe(true);
    
    const artifactAccessible = await testUtils.checkElementAccessibility('artifact');
    expect(artifactAccessible).toBe(true);
  });
});