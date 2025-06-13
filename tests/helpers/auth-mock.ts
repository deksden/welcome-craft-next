/**
 * Mock для обхода аутентификации в тестах
 * Создает фиктивную сессию без реальной регистрации
 */

import type { Page } from '@playwright/test';

export async function mockAuthentication(page: Page, userEmail = 'test@playwright.com') {
  // Создаем моковую сессию через localStorage для обхода аутентификации
  await page.goto('http://app.localhost:3000/');
  
  // Добавляем моковую сессию в localStorage
  await page.evaluate((email) => {
    // Создаем фиктивную сессию
    const mockSession = {
      user: {
        id: `mock-user-${Date.now()}`,
        email: email,
        name: 'Test User'
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 часа
    };
    
    // Сохраняем в localStorage (это может быть переопределено в зависимости от того, как работает NextAuth)
    localStorage.setItem('nextauth.session', JSON.stringify(mockSession));
    localStorage.setItem('mock-authenticated', 'true');
  }, userEmail);
  
  // Обновляем страницу для применения изменений
  await page.reload();
  
  return userEmail;
}

/**
 * Очистка mock аутентификации
 */
export async function clearMockAuthentication(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('nextauth.session');
    localStorage.removeItem('mock-authenticated');
  });
}