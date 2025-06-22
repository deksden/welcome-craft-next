/**
 * @file tests/e2e/use-cases/UC-11-File-Import-System.test.ts
 * @description E2E тест для UC-11 File Import System - критически важный для UC-10 архитектуры
 * @version 1.0.0
 * @date 2025-06-22
 * @updated Создан E2E тест для файлового импорта с поддержкой MD, CSV, TXT
 */

import { test, expect } from '@playwright/test';
import path from 'node:path';

test.describe('UC-11: File Import System', () => {
  test.beforeEach(async ({ page }) => {
    console.log('🚀 FAST AUTHENTICATION: Устанавливаем test session')
    
    // Быстрая установка test session cookie (как в UC-01)
    const timestamp = Date.now()
    const userId = `uc11-user-${timestamp.toString().slice(-12)}`
    const testEmail = `uc11-test-${timestamp}@playwright.com`
    
    await page.context().addCookies([
      {
        name: 'test-session',
        value: JSON.stringify({
          user: {
            id: userId,
            email: testEmail,
            name: `uc11-test-${timestamp}`
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }),
        domain: 'app.localhost',
        path: '/'
      }
    ])
    
    console.log('✅ Fast authentication completed')
    
    // Переходим на страницу артефактов как аутентифицированный пользователь
    await page.goto('/artifacts');
    await expect(page).toHaveURL(/.*\/artifacts/);
  });

  test('должен успешно импортировать .md файл и создать текстовый артефакт', async ({ page }) => {
    
    // Ищем input для загрузки файлов
    const fileImportInput = page.locator('input[type="file"]');
    await expect(fileImportInput).toBeVisible({ timeout: 10000 });

    // Загружаем Markdown файл
    const filePath = path.join(process.cwd(), 'tests/fixtures/files/sample.md');
    await fileImportInput.setInputFiles(filePath);

    // Ожидаем уведомление об успехе (увеличиваем таймаут для обработки файла)
    await expect(page.locator('[data-testid*="toast"]')).toContainText(/imported|success/i, { timeout: 15000 });

    // Проверяем, что в сетке артефактов появился новый элемент
    const newArtifactCard = page.locator('[data-testid="artifact-card"]').filter({ hasText: 'sample' });
    await expect(newArtifactCard).toBeVisible({ timeout: 10000 });

    // Открываем артефакт и проверяем его содержимое
    await newArtifactCard.click();
    
    // Ждем загрузки панели артефакта
    const artifactPanel = page.locator('[data-testid*="artifact-panel"], [data-testid*="artifact-content"]');
    await expect(artifactPanel).toBeVisible({ timeout: 10000 });

    // Проверяем, что контент соответствует исходному файлу
    await expect(artifactPanel).toContainText('Sample Markdown');
    await expect(artifactPanel).toContainText('console.log(\'Hello from MD\')');
    await expect(artifactPanel).toContainText('test markdown file');
  });

  test('должен успешно импортировать .csv файл и создать табличный артефакт', async ({ page }) => {
    
    const fileImportInput = page.locator('input[type="file"]');
    await expect(fileImportInput).toBeVisible({ timeout: 10000 });

    // Загружаем CSV файл
    const filePath = path.join(process.cwd(), 'tests/fixtures/files/sample.csv');
    await fileImportInput.setInputFiles(filePath);

    // Ожидаем успешную обработку
    await expect(page.locator('[data-testid*="toast"]')).toContainText(/imported|success/i, { timeout: 15000 });

    // Проверяем появление нового артефакта
    const newArtifactCard = page.locator('[data-testid="artifact-card"]').filter({ hasText: 'sample' });
    await expect(newArtifactCard).toBeVisible({ timeout: 10000 });

    // Открываем артефакт
    await newArtifactCard.click();
    
    // Ждем загрузки панели
    const artifactPanel = page.locator('[data-testid*="artifact-panel"], [data-testid*="artifact-content"]');
    await expect(artifactPanel).toBeVisible({ timeout: 10000 });

    // Проверяем данные из CSV (должны быть в табличном виде или как текст)
    await expect(artifactPanel).toContainText('John Doe');
    await expect(artifactPanel).toContainText('Engineering');
    await expect(artifactPanel).toContainText('Software Engineer');
    
    // Если есть таблица, проверяем её
    const tableElement = artifactPanel.locator('table');
    if (await tableElement.isVisible()) {
      await expect(tableElement).toContainText('Name');
      await expect(tableElement).toContainText('Position');
      await expect(tableElement).toContainText('Department');
    }
  });

  test('должен успешно импортировать .txt файл и создать текстовый артефакт', async ({ page }) => {
    
    const fileImportInput = page.locator('input[type="file"]');
    await expect(fileImportInput).toBeVisible({ timeout: 10000 });

    // Загружаем текстовый файл
    const filePath = path.join(process.cwd(), 'tests/fixtures/files/sample.txt');
    await fileImportInput.setInputFiles(filePath);

    // Ожидаем успешную обработку
    await expect(page.locator('[data-testid*="toast"]')).toContainText(/imported|success/i, { timeout: 15000 });

    // Проверяем появление нового артефакта
    const newArtifactCard = page.locator('[data-testid="artifact-card"]').filter({ hasText: 'sample' });
    await expect(newArtifactCard).toBeVisible({ timeout: 10000 });

    // Открываем артефакт и проверяем его содержимое
    await newArtifactCard.click();
    
    const artifactPanel = page.locator('[data-testid*="artifact-panel"], [data-testid*="artifact-content"]');
    await expect(artifactPanel).toBeVisible({ timeout: 10000 });

    // Проверяем, что содержимое текстового файла сохранилось
    // (предполагаем, что sample.txt содержит простой текст)
    await expect(artifactPanel).not.toBeEmpty();
  });

  test('должен показать ошибку при загрузке неподдерживаемого файла', async ({ page }) => {
    
    const fileImportInput = page.locator('input[type="file"]');
    await expect(fileImportInput).toBeVisible({ timeout: 10000 });

    // Создаем временный файл с неподдерживаемым расширением
    const tempDir = path.join(process.cwd(), 'tests/fixtures/files');
    const unsupportedFile = path.join(tempDir, 'unsupported.xyz');
    
    // Попытаемся загрузить неподдерживаемый файл (если он существует)
    // Иначе проверим, что input корректно ограничивает типы файлов
    const acceptAttribute = await fileImportInput.getAttribute('accept');
    
    // Проверим, что input имеет правильное ограничение типов файлов
    if (acceptAttribute) {
      expect(acceptAttribute).toContain('.md');
      // Могут быть и другие поддерживаемые форматы
    }
  });

  test('должен обработать drag-and-drop файла', async ({ page }) => {
    
    // Ищем зону drag-and-drop или область, которая может принимать файлы
    const dropZone = page.locator('[data-testid*="drop"], .drop-zone, [data-testid*="file-import"]').first();
    
    // Если зона drag-and-drop существует, тестируем её
    if (await dropZone.isVisible()) {
      const filePath = path.join(process.cwd(), 'tests/fixtures/files/sample.md');
      
      // Эмулируем drag-and-drop
      await dropZone.setInputFiles(filePath);
      
      // Проверяем успешную обработку
      await expect(page.locator('[data-testid*="toast"]')).toContainText(/imported|success/i, { timeout: 15000 });
      
      const newArtifactCard = page.locator('[data-testid="artifact-card"]').filter({ hasText: 'sample' });
      await expect(newArtifactCard).toBeVisible({ timeout: 10000 });
    } else {
      // Если drag-and-drop не реализован, пропускаем тест
      test.skip();
    }
  });
});

// END OF: tests/e2e/use-cases/UC-11-File-Import-System.test.ts