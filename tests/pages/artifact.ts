import { expect, type Page } from '@playwright/test';

export class ArtifactPage {
  constructor(private page: Page) {}

  public get artifact() {
    return this.page.getByTestId('artifact');
  }

  public get sendButton() {
    return this.artifact.getByTestId('send-button');
  }

  public get stopButton() {
    return this.page.getByTestId('stop-button');
  }

  public get chatInput() {
    return this.page.getByTestId('chat-input');
  }

  async isGenerationComplete() {
    const response = await this.page.waitForResponse((response) =>
      response.url().includes('/api/chat'),
    );

    await response.finished();
    
    // Дополнительное ожидание для стабилизации артефакта
    await this.page.waitForTimeout(1000);
  }

  async sendUserMessage(message: string) {
    await this.artifact.getByTestId('chat-input').click();
    await this.artifact.getByTestId('chat-input').fill(message);
    await this.artifact.getByTestId('send-button').click();
  }

  async getRecentAssistantMessage() {
    const messageElements = await this.artifact
      .getByTestId('message-assistant')
      .all();
    const lastMessageElement = messageElements[messageElements.length - 1];

    const content = await lastMessageElement
      .getByTestId('message-content')
      .innerText()
      .catch(() => null);

    const reasoningElement = await lastMessageElement
      .getByTestId('message-reasoning')
      .isVisible()
      .then(async (visible) =>
        visible
          ? await lastMessageElement
              .getByTestId('message-reasoning')
              .innerText()
          : null,
      )
      .catch(() => null);

    return {
      element: lastMessageElement,
      content,
      reasoning: reasoningElement,
      async toggleReasoningVisibility() {
        await lastMessageElement
          .getByTestId('message-reasoning-toggle')
          .click();
      },
    };
  }

  async getRecentUserMessage() {
    const messageElements = await this.artifact
      .getByTestId('message-user')
      .all();
    const lastMessageElement = messageElements[messageElements.length - 1];

    const content = await lastMessageElement.innerText();

    const hasAttachments = await lastMessageElement
      .getByTestId('message-attachments')
      .isVisible()
      .catch(() => false);

    const attachments = hasAttachments
      ? await lastMessageElement.getByTestId('message-attachments').all()
      : [];

    const page = this.artifact;

    return {
      element: lastMessageElement,
      content,
      attachments,
      async edit(newMessage: string) {
        await page.getByTestId('message-edit-button').click();
        await page.getByTestId('message-editor').fill(newMessage);
        await page.getByTestId('message-editor-send-button').click();
        await expect(
          page.getByTestId('message-editor-send-button'),
        ).not.toBeVisible();
      },
    };
  }

  async closeArtifact() {
    return this.page.getByTestId('artifact-close-button').click();
  }

  async waitForArtifactType(type: string) {
    return this.page.getByTestId(`artifact-type-${type}`).waitFor({ state: 'visible' });
  }

  async getArtifactContent() {
    const contentElement = this.artifact.locator('[data-testid="artifact-content"]');
    return await contentElement.textContent();
  }

  async editArtifact() {
    const editButton = this.page.getByTestId('artifact-edit-button');
    await editButton.click();
    return this.page.getByTestId('artifact-editor');
  }

  async previewSite() {
    const previewButton = this.page.getByTestId('site-preview-button');
    await previewButton.click();
  }

  async shareSite() {
    const shareButton = this.page.getByTestId('site-share-button');
    await shareButton.click();
    return this.page.getByTestId('share-modal');
  }
}
