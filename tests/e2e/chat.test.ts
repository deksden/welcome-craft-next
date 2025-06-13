import { ChatPage } from '../pages/chat';
import { test, expect } from '../fixtures';

test.describe('Chat activity', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.createNewChat();
  });

  test('Send a user message and receive AI response', async () => {
    await chatPage.sendUserMessage('Привет! Расскажи мне о себе');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toContain('Я ИИ-ассистент WelcomeCraft');
  });

  test('Create new chat with unique ID after submitting message', async () => {
    await chatPage.sendUserMessage('Создай новый чат');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toBeDefined();
    await chatPage.hasChatIdInUrl();
  });

  test('Send message from suggested prompt', async () => {
    await chatPage.sendUserMessageFromSuggestion();
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toContain(
      'Создание онбординг-сайта',
    );
  });

  test('Toggle between send/stop button based on activity', async () => {
    await expect(chatPage.sendButton).toBeVisible();
    await expect(chatPage.sendButton).toBeDisabled();

    await chatPage.sendUserMessage('Why is grass green?');

    await expect(chatPage.sendButton).not.toBeVisible();
    await expect(chatPage.stopButton).toBeVisible();

    await chatPage.isGenerationComplete();

    await expect(chatPage.stopButton).not.toBeVisible();
    await expect(chatPage.sendButton).toBeVisible();
  });

  test('Stop AI generation during processing', async () => {
    await chatPage.sendUserMessage('Создай сложный артефакт с большим содержанием');
    await expect(chatPage.stopButton).toBeVisible();
    await chatPage.stopButton.click();
    await expect(chatPage.sendButton).toBeVisible();
  });

  test('Edit user message and regenerate AI response', async () => {
    await chatPage.sendUserMessage('Создай текстовый артефакт');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toBeDefined();

    const userMessage = await chatPage.getRecentUserMessage();
    await userMessage.edit('Создай кодовый артефакт');

    await chatPage.isGenerationComplete();

    const updatedAssistantMessage = await chatPage.getRecentAssistantMessage();
    expect(updatedAssistantMessage.content).toBeDefined();
  });

  test('Hide suggested actions after sending message', async () => {
    await chatPage.isElementVisible('suggested-actions');
    await chatPage.sendUserMessageFromSuggestion();
    await chatPage.isElementNotVisible('suggested-actions');
  });

  test('Upload file and analyze with AI', async () => {
    await chatPage.addImageAttachment();

    await chatPage.isElementVisible('attachments-preview');
    await chatPage.isElementVisible('input-attachment-loader');
    await chatPage.isElementNotVisible('input-attachment-loader');

    await chatPage.sendUserMessage('Проанализируй этот файл для создания онбординга');

    const userMessage = await chatPage.getRecentUserMessage();
    expect(userMessage.attachments).toHaveLength(1);

    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toContain('анализ');
  });

  test('Create artifact via AI tool', async () => {
    await chatPage.sendUserMessage('Создай текстовый артефакт с приветствием для нового сотрудника');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toContain('артефакт');
  });

  test('Upvote AI response', async () => {
    await chatPage.sendUserMessage('Помоги создать онбординг');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    await assistantMessage.upvote();
    await chatPage.isVoteComplete();
  });

  test('Downvote AI response', async () => {
    await chatPage.sendUserMessage('Создай артефакт');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    await assistantMessage.downvote();
    await chatPage.isVoteComplete();
  });

  test('Change vote on AI response', async () => {
    await chatPage.sendUserMessage('Помоги с созданием контента');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    await assistantMessage.upvote();
    await chatPage.isVoteComplete();

    await assistantMessage.downvote();
    await chatPage.isVoteComplete();
  });

  test('Start chat from URL query parameter', async ({ page }) => {
    await page.goto('http://app.localhost:3000/?query=Создай онбординг-сайт для разработчика');

    await chatPage.isGenerationComplete();

    const userMessage = await chatPage.getRecentUserMessage();
    expect(userMessage.content).toBe('Создай онбординг-сайт для разработчика');

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toBeDefined();
  });

  test('Auto-scroll to bottom after AI responses', async () => {
    await chatPage.sendMultipleMessages(5, (i) => `Создай артефакт номер ${i}`);
    await chatPage.waitForScrollToBottom();
  });

  test('scroll button appears when user scrolls up, hides on click', async () => {
    await chatPage.sendMultipleMessages(5, (i) => `filling message #${i}`);
    await expect(chatPage.scrollToBottomButton).not.toBeVisible();

    await chatPage.scrollToTop();
    await expect(chatPage.scrollToBottomButton).toBeVisible();

    await chatPage.scrollToBottomButton.click();
    await chatPage.waitForScrollToBottom();
    await expect(chatPage.scrollToBottomButton).not.toBeVisible();
  });
});
