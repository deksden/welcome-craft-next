// tests/helpers/e2e-auth.helper.ts

import type { Page } from '@playwright/test';

/**
 * @description Надежная и быстрая аутентификация для E2E-тестов.
 * @feature Реализует "Multi-Domain Cookie Pattern" для стабильной работы в мультидоменной архитектуре.
 */
export async function fastAuthentication(
  page: Page,
  user: { email: string; id?: string; name?: string }
): Promise<void> {
  console.log(`🚀 FAST AUTHENTICATION: Setting up test session for ${user.email}`);

  const timestamp = Date.now();
  const userId = user.id || `test-user-${timestamp}`;
  const userName = user.name || user.email.split('@')[0];

  const cookieValue = JSON.stringify({
    user: { id: userId, email: user.email, name: userName },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });

  // ШАГ 1: СНАЧАЛА устанавливаем cookies БЕЗ navigation
  await page.context().addCookies([
    { name: 'test-session', value: cookieValue, domain: '.localhost', path: '/' },
    { name: 'test-session-fallback', value: cookieValue, domain: 'localhost', path: '/' },
    { name: 'test-session', value: cookieValue, domain: 'app.localhost', path: '/' },
  ]);

  // ШАГ 2: Устанавливаем test environment header
  await page.setExtraHTTPHeaders({ 'X-Test-Environment': 'playwright' });

  console.log('✅ Fast authentication cookies and headers set.');
}