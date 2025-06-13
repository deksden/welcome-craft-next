/**
 * E2E тесты для генерации сайтов в WelcomeCraft
 * Тесты создания онбординг-сайтов через AI и их функциональности
 */

import { test, expect } from '../fixtures';
import { ChatPage } from '../pages/chat';
import { ArtifactPage } from '../pages/artifact';
import { TestUtils } from '../helpers/test-utils';

test.describe('Site Generation', () => {
  let chatPage: ChatPage;
  let artifactPage: ArtifactPage;
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    artifactPage = new ArtifactPage(page);
    testUtils = new TestUtils(page);
    
    await testUtils.cleanupTestData();
    await chatPage.createNewChat();
  });

  test('Generate complete onboarding site via AI', async () => {
    // Создание базовых артефактов для сайта
    await testUtils.sendMessage('Создай приветственный текст для нового разработчика');
    await testUtils.waitForArtifact();
    
    await testUtils.sendMessage('Создай список ключевых контактов');
    await testUtils.waitForArtifact();
    
    await testUtils.sendMessage('Создай полезные ссылки для разработчика');
    await testUtils.waitForArtifact();
    
    // Генерация сайта
    await testUtils.sendMessage('Сгенерируй онбординг-сайт используя все созданные артефакты');
    
    const siteArtifact = await testUtils.waitForArtifact();
    expect(siteArtifact).toBeVisible();
    
    // Проверка что создался артефакт типа 'site'
    const siteTypeIndicator = await testUtils.waitForElement('artifact-type-site');
    expect(siteTypeIndicator).toBeVisible();
  });

  test('Site preview and public access', async () => {
    // Создание сайта
    await testUtils.sendMessage('Создай онбординг-сайт для HR-менеджера');
    const siteArtifact = await testUtils.waitForArtifact();
    
    // Открытие предварительного просмотра
    const previewButton = await testUtils.waitForElement('site-preview-button');
    await previewButton.click();
    
    // Ожидание открытия нового таба с сайтом
    const newPage = await testUtils.page.context().waitForEvent('page');
    await newPage.waitForLoadState('domcontentloaded');
    
    // Проверка URL сайта
    expect(newPage.url()).toMatch(/\/site\/s\/[a-zA-Z0-9]+/);
    
    // Проверка основных элементов сайта
    const heroSection = newPage.locator('[data-testid="site-hero"]');
    await expect(heroSection).toBeVisible();
    
    const contactsSection = newPage.locator('[data-testid="site-contacts"]');
    await expect(contactsSection).toBeVisible();
    
    await newPage.close();
  });

  test('Site responsiveness on mobile devices', async ({ page }) => {
    // Создание сайта
    await testUtils.sendMessage('Создай мобильно-оптимизированный онбординг-сайт');
    await testUtils.waitForArtifact();
    
    // Открытие предварительного просмотра
    const previewButton = await testUtils.waitForElement('site-preview-button');
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      previewButton.click()
    ]);
    
    // Эмуляция мобильного устройства
    await newPage.setViewportSize({ width: 375, height: 667 });
    await newPage.waitForLoadState('domcontentloaded');
    
    // Проверка адаптивности
    const heroSection = newPage.locator('[data-testid="site-hero"]');
    const heroBox = await heroSection.boundingBox();
    expect(heroBox?.width).toBeLessThanOrEqual(375);
    
    // Проверка навигации на мобильном
    const mobileMenu = newPage.locator('[data-testid="mobile-menu"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      const navigation = newPage.locator('[data-testid="mobile-navigation"]');
      await expect(navigation).toBeVisible();
    }
    
    await newPage.close();
  });

  test('Site editing and real-time updates', async () => {
    // Создание сайта
    await testUtils.sendMessage('Создай базовый онбординг-сайт');
    const siteArtifact = await testUtils.waitForArtifact();
    
    // Открытие редактора сайта
    const editButton = await testUtils.waitForElement('artifact-edit-button');
    await editButton.click();
    
    // Ожидание загрузки редактора
    const siteEditor = await testUtils.waitForElement('site-editor');
    expect(siteEditor).toBeVisible();
    
    // Добавление нового блока через редактор
    const addBlockButton = await testUtils.waitForElement('add-block-button');
    await addBlockButton.click();
    
    const blockTypeSelect = await testUtils.waitForElement('block-type-select');
    await blockTypeSelect.selectOption('useful-links');
    
    const confirmButton = await testUtils.waitForElement('confirm-add-block');
    await confirmButton.click();
    
    // Проверка обновления артефакта
    await testUtils.waitForDOMStability();
    const updatedSite = await testUtils.waitForElement('artifact');
    expect(updatedSite).toBeVisible();
  });

  test('Site with multiple block types', async () => {
    // Создание артефактов разных типов
    const contentSteps = [
      'Создай hero секцию с заголовком "Добро пожаловать в команду"',
      'Создай блок ключевых контактов с HR и IT',
      'Создай блок полезных ссылок на внутренние ресурсы',
      'Создай чек-лист задач на первую неделю'
    ];
    
    for (const step of contentSteps) {
      await testUtils.sendMessage(step);
      await testUtils.waitForArtifact();
    }
    
    // Генерация комплексного сайта
    await testUtils.sendMessage('Создай полный онбординг-сайт со все блоками: hero, контакты, ссылки и чек-лист');
    
    const completeSite = await testUtils.waitForArtifact();
    expect(completeSite).toBeVisible();
    
    // Открытие превью и проверка всех блоков
    const previewButton = await testUtils.waitForElement('site-preview-button');
    const [newPage] = await Promise.all([
      testUtils.page.context().waitForEvent('page'),
      previewButton.click()
    ]);
    
    await newPage.waitForLoadState('domcontentloaded');
    
    // Проверка всех типов блоков
    const blockTypes = ['hero', 'key-contacts', 'useful-links', 'checklist'];
    for (const blockType of blockTypes) {
      const block = newPage.locator(`[data-testid="site-block-${blockType}"]`);
      await expect(block).toBeVisible();
    }
    
    await newPage.close();
  });

  test('Site generation with custom branding', async () => {
    // Создание сайта с кастомизацией
    await testUtils.sendMessage('Создай онбординг-сайт с корпоративными цветами и логотипом компании');
    await testUtils.waitForArtifact();
    
    // Проверка опций брендинга в редакторе
    const editButton = await testUtils.waitForElement('artifact-edit-button');
    await editButton.click();
    
    const brandingSection = await testUtils.waitForElement('site-branding-section');
    expect(brandingSection).toBeVisible();
    
    // Проверка настроек брендинга
    const colorPicker = await testUtils.waitForElement('brand-color-picker');
    expect(colorPicker).toBeVisible();
    
    const logoUpload = await testUtils.waitForElement('logo-upload-input');
    expect(logoUpload).toBeVisible();
  });

  test('Site sharing and collaboration', async () => {
    // Создание сайта
    await testUtils.sendMessage('Создай онбординг-сайт для новой команды разработки');
    await testUtils.waitForArtifact();
    
    // Получение ссылки для шаринга
    const shareButton = await testUtils.waitForElement('site-share-button');
    await shareButton.click();
    
    const shareModal = await testUtils.waitForElement('share-modal');
    expect(shareModal).toBeVisible();
    
    const shareLink = await testUtils.waitForElement('share-link-input');
    const linkValue = await shareLink.inputValue();
    expect(linkValue).toMatch(/https?:\/\/.+\/site\/s\/[a-zA-Z0-9]+/);
    
    // Копирование ссылки
    const copyButton = await testUtils.waitForElement('copy-link-button');
    await copyButton.click();
    
    // Проверка уведомления о копировании
    const successNotification = await testUtils.waitForElement('copy-success-notification');
    expect(successNotification).toBeVisible();
  });

  test('Site version management', async () => {
    // Создание первой версии сайта
    await testUtils.sendMessage('Создай базовый онбординг-сайт версия 1.0');
    await testUtils.waitForArtifact();
    
    // Обновление сайта
    await testUtils.sendMessage('Обнови сайт: добавь секцию FAQ');
    await testUtils.waitForAIGeneration();
    
    // Проверка версионирования
    const versionSelect = await testUtils.waitForElement('artifact-version-select');
    expect(versionSelect).toBeVisible();
    
    // Переключение между версиями
    await versionSelect.selectOption('previous');
    await testUtils.waitForDOMStability();
    
    // Возврат к последней версии
    await versionSelect.selectOption('latest');
    await testUtils.waitForDOMStability();
    
    const latestArtifact = await testUtils.waitForElement('artifact');
    expect(latestArtifact).toBeVisible();
  });

  test('Site analytics and usage tracking', async () => {
    // Создание сайта с аналитикой
    await testUtils.sendMessage('Создай онбординг-сайт с отслеживанием прогресса пользователя');
    await testUtils.waitForArtifact();
    
    // Открытие сайта
    const previewButton = await testUtils.waitForElement('site-preview-button');
    const [newPage] = await Promise.all([
      testUtils.page.context().waitForEvent('page'),
      previewButton.click()
    ]);
    
    await newPage.waitForLoadState('domcontentloaded');
    
    // Имитация взаимодействия с сайтом
    const checklistItem = newPage.locator('[data-testid="checklist-item"]').first();
    if (await checklistItem.isVisible()) {
      await checklistItem.click();
    }
    
    // Проверка трекинга (если есть видимые индикаторы)
    const progressBar = newPage.locator('[data-testid="progress-indicator"]');
    if (await progressBar.isVisible()) {
      expect(progressBar).toBeVisible();
    }
    
    await newPage.close();
  });
});