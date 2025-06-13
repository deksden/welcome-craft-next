import { expect, test } from '../fixtures';
import { ChatPage } from '../pages/chat';
import { ArtifactPage } from '../pages/artifact';

test.describe('Artifacts activity', () => {
  let chatPage: ChatPage;
  let artifactPage: ArtifactPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    artifactPage = new ArtifactPage(page);

    await chatPage.createNewChat();
  });

  test('Create text artifact for onboarding content', async () => {
    await chatPage.createNewChat();

    await chatPage.sendUserMessage(
      'Создай текстовый артефакт с приветствием для нового сотрудника',
    );
    await artifactPage.isGenerationComplete();

    expect(artifactPage.artifact).toBeVisible();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toContain('артефакт');

    await chatPage.hasChatIdInUrl();
  });

  test('Toggle artifact visibility in UI', async () => {
    await chatPage.createNewChat();

    await chatPage.sendUserMessage(
      'Создай кодовый артефакт с компонентом React',
    );
    await artifactPage.isGenerationComplete();

    expect(artifactPage.artifact).toBeVisible();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toContain('артефакт');

    await artifactPage.closeArtifact();
    await chatPage.isElementNotVisible('artifact');
  });

  test('Continue conversation after artifact creation', async () => {
    await chatPage.createNewChat();

    await chatPage.sendUserMessage(
      'Создай список контактов для онбординга',
    );
    await artifactPage.isGenerationComplete();

    expect(artifactPage.artifact).toBeVisible();

    const assistantMessage = await artifactPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toContain('артефакт');

    await artifactPage.sendUserMessage('Добавь еще контакты HR');
    await artifactPage.isGenerationComplete();

    const secondAssistantMessage = await chatPage.getRecentAssistantMessage();
    expect(secondAssistantMessage.content).toBeDefined();
  });
});
