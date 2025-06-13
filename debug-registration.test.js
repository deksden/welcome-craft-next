import { test, expect } from '@playwright/test';

test('simple registration test', async ({ page }) => {
  // Включить логирование сетевых запросов
  page.on('request', request => console.log('>>', request.method(), request.url()));
  page.on('response', response => console.log('<<', response.status(), response.url()));
  
  await page.goto('http://app.localhost:3000/register');
  
  await page.fill('[data-testid="auth-email-input"]', 'test@example.com');
  await page.fill('[data-testid="auth-password-input"]', 'password123');
  
  await page.click('[data-testid="auth-submit-button"]');
  
  // Ждем ответа
  await page.waitForTimeout(5000);
  
  // Проверяем тосты
  const toasts = page.locator('.sonner-toast');
  if (await toasts.count() > 0) {
    const toastText = await toasts.first().textContent();
    console.log('Toast:', toastText);
  }
});
EOF < /dev/null