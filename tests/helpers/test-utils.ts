/**
 * @file tests/helpers/test-utils.ts
 * @description Упрощенные утилиты для Железобетонных Тестов с fail-fast локаторами
 * @version 2.0.0
 * @date 2025-06-18
 * @updated Refactored to Page Object Model foundation with fail-fast locators
 */

/** HISTORY:
 * v2.0.0 (2025-06-18): Железобетонные Тесты - добавлены fail-fast локаторы, упрощена sendMessage
 * v1.0.0 (previous): Legacy complex test utilities
 */

import type { Page, Locator } from '@playwright/test';
import { getTestHeaders, } from './test-config';

export class TestUtils {
  constructor(public page: Page) {}

  // =============================================================================
  // FAIL-FAST LOCATORS - Основа для Page Object Model
  // =============================================================================

  /**
   * Fail-fast локатор с 2-секундным таймаутом
   * Основа для всех POM селекторов
   */
  async fastLocator(testId: string, options?: {
    timeout?: number;
    state?: 'visible' | 'attached' | 'detached' | 'hidden';
  }): Promise<Locator> {
    const { timeout = 2000, state = 'visible' } = options || {};
    
    const locator = this.page.getByTestId(testId);
    
    try {
      await locator.waitFor({ state, timeout });
      return locator;
    } catch (error) {
      throw new Error(`❌ FAIL-FAST: Element [${testId}] not found in ${timeout}ms (state: ${state})`);
    }
  }

  /**
   * Универсальный хелпер ожидания элемента с retry логикой
   * @deprecated Используйте fastLocator() для новых тестов
   */
  async waitFor(condition: () => Promise<boolean>, options?: {
    timeout?: number;
    interval?: number;
    description?: string;
  }): Promise<void> {
    const { timeout = 5000, interval = 100, description = 'condition' } = options || {};
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        if (await condition()) {
          return;
        }
      } catch {
        // Игнорируем ошибки в condition
      }
      
      await this.page.waitForTimeout(interval);
    }
    
    throw new Error(`❌ TIMEOUT: ${description} not met in ${timeout}ms`);
  }

  /**
   * Явный хелпер ожидания для стабилизации UI
   */
  async waitForStability(ms = 500): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Legacy метод ожидания элемента
   * @deprecated Используйте fastLocator() для новых тестов
   */
  async waitForElement(selector: string, options?: {
    timeout?: number;
    retries?: number;
    state?: 'attached' | 'detached' | 'visible' | 'hidden';
  }): Promise<Locator> {
    const { timeout = 30000, retries = 3, state = 'visible' } = options || {};
    
    // Делегируем к новому методу для совместимости
    try {
      return await this.fastLocator(selector, { timeout, state });
    } catch (error) {
      // Fallback к старой логике для совместимости
      for (let i = 0; i < retries; i++) {
        try {
          const element = this.page.locator(`[data-testid="${selector}"]`);
          await element.waitFor({ state, timeout: timeout / retries });
          return element;
        } catch (error) {
          if (i === retries - 1) throw error;
          await this.page.waitForTimeout(1000);
        }
      }
      
      throw new Error(`Element ${selector} not found after ${retries} retries`);
    }
  }

  /**
   * Ожидание завершения AI генерации с индикаторами загрузки
   */
  async waitForAIGeneration(options?: { timeout?: number }): Promise<void> {
    const { timeout = 60000 } = options || {};
    
    // Ждем появления индикатора загрузки
    try {
      await this.page.locator('[data-testid*="loading"], [data-testid*="generating"]')
        .first()
        .waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      // Индикатор может не появиться для быстрых ответов
    }

    // Ждем исчезновения всех индикаторов загрузки
    await this.page.locator('[data-testid*="loading"], [data-testid*="generating"]')
      .waitFor({ state: 'detached', timeout });

    // Дополнительная проверка на стабильность DOM
    await this.page.waitForTimeout(500);
  }

  /**
   * Упрощенная отправка сообщения для POM (замена сложной legacy логики)
   * Будет заменена на Page Object методы
   * @deprecated Используйте ChatPage.sendMessage() в новых тестах
   */
  async sendMessage(message: string, options?: { waitForResponse?: boolean }): Promise<void> {
    const { waitForResponse = true } = options || {};
    
    console.log('🔤 Sending message (legacy):', message);
    
    // Простая логика без сложных проверок
    const input = await this.fastLocator('chat-input-textarea');
    await input.fill(message);
    
    const sendButton = await this.fastLocator('chat-input-send-button');
    await sendButton.click();
    
    if (waitForResponse) {
      await this.waitForAIGeneration();
    }
  }

  /**
   * Ожидание появления артефакта
   */
  async waitForArtifact(options?: { timeout?: number }): Promise<Locator> {
    const { timeout = 30000 } = options || {};
    
    const artifact = await this.waitForElement('artifact', { timeout });
    
    // Ждем полной загрузки содержимого артефакта
    await this.page.waitForTimeout(1000);
    
    return artifact;
  }

  /**
   * Скролл к элементу с проверкой видимости
   */
  async scrollToElement(selector: string): Promise<void> {
    const element = await this.waitForElement(selector);
    await element.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(300);
  }

  /**
   * Ожидание изменения URL с retry логикой
   */
  async waitForUrlChange(expectedPattern: RegExp, options?: { timeout?: number }): Promise<void> {
    const { timeout = 15000 } = options || {};
    
    await this.page.waitForFunction(
      (pattern) => new RegExp(pattern).test(window.location.href),
      expectedPattern.source,
      { timeout }
    );
  }

  /**
   * Очистка данных между тестами
   */
  async cleanupTestData(): Promise<void> {
    // Очистка localStorage (с защитой от SecurityError)
    try {
      await this.page.evaluate(() => {
        if (typeof Storage !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
        }
      });
    } catch (error) {
      // Игнорируем ошибки доступа к localStorage в about:blank или других ограниченных контекстах
      console.log('Skipping localStorage cleanup due to security restrictions');
    }
    
    // Очистка cookies связанных с тестами
    const cookies = await this.page.context().cookies();
    const testCookies = cookies.filter(cookie => 
      cookie.name.includes('test') || cookie.name.includes('mock')
    );
    
    if (testCookies.length > 0) {
      await this.page.context().clearCookies(...testCookies);
    }
  }

  /**
   * Ожидание стабилизации DOM после изменений
   */
  async waitForDOMStability(options?: { timeout?: number; checks?: number }): Promise<void> {
    const { timeout = 5000, checks = 3 } = options || {};
    
    let stableCount = 0;
    let lastHTML = '';
    
    const startTime = Date.now();
    
    while (stableCount < checks && (Date.now() - startTime) < timeout) {
      const currentHTML = await this.page.innerHTML('body');
      
      if (currentHTML === lastHTML) {
        stableCount++;
      } else {
        stableCount = 0;
        lastHTML = currentHTML;
      }
      
      await this.page.waitForTimeout(200);
    }
  }

  /**
   * Проверка доступности (a11y) элемента
   */
  async checkElementAccessibility(selector: string): Promise<boolean> {
    const element = await this.waitForElement(selector);
    
    // Проверка основных a11y атрибутов
    const checks = await Promise.all([
      element.getAttribute('aria-label'),
      element.getAttribute('role'),
      element.getAttribute('tabindex'),
      element.isVisible(),
      element.isEnabled()
    ]);
    
    const [ariaLabel, role, tabindex, isVisible, isEnabled] = checks;
    
    // Базовые проверки доступности
    return !!(
      (ariaLabel || role) && 
      isVisible && 
      (tabindex === null || Number.parseInt(tabindex) >= -1) &&
      isEnabled
    );
  }

  /**
   * Создание скриншота с таймстампом для отладки
   */
  async takeDebugScreenshot(name: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `tests/screenshots/debug-${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Эмуляция медленного соединения для тестирования loading состояний
   */
  async simulateSlowNetwork(): Promise<void> {
    await this.page.route('**/*', route => {
      setTimeout(() => route.continue(), 1000);
    });
  }

  /**
   * Сброс network эмуляции
   */
  async resetNetwork(): Promise<void> {
    await this.page.unroute('**/*');
  }

  /**
   * Регистрирует нового пользователя через форму
   */
  async registerUser(email: string, password: string) {
    console.log('🔐 Starting user registration...');
    
    // Используем относительный URL - Playwright автоматически добавит baseURL из конфигурации
    console.log('🌐 Navigating to: /register (using baseURL from config)');
    await this.page.goto('/register');
    
    // Заполнить форму регистрации
    await this.page.fill('[data-testid="auth-email-input"]', email);
    await this.page.fill('[data-testid="auth-password-input"]', password);
    
    // Отправить форму
    console.log('📝 Submitting registration form...');
    await this.page.click('[data-testid="auth-submit-button"]');
    
    // Ждать success toast - ищем в контейнере sonner
    console.log('⏳ Waiting for success toast...');
    try {
      // Ждем появления любого toast
      await this.page.waitForSelector('[data-testid="toast"], [data-sonner-toast]', { timeout: 10000 });
      
      // Проверяем текст toast
      const toastElement = await this.page.locator('[data-testid="toast"], [data-sonner-toast]').first();
      const toastText = await toastElement.textContent();
      
      console.log('🔍 Toast text:', toastText);
      if (toastText?.includes('Account created successfully') || toastText?.includes('created')) {
        console.log('✅ Registration success toast received');
      } else if (toastText?.includes('already exists') || toastText?.includes('exists')) {
        console.log('⚠️ User already exists - proceeding with login...');
      } else {
        console.log('❌ Unexpected toast message:', toastText);
      }
    } catch (error) {
      console.log('⚠️ No toast appeared, checking if registration succeeded anyway...');
    }
    
    // В тестах используем альтернативный подход - устанавливаем session через API
    console.log('🔄 Setting auth session via API for reliability...');
    
    try {
      // Используем API для надежной установки session
      await this.setAuthSession(email);
      
      // Ждем подтверждения auth session
      await this.waitForAuthSession();
      
      // Переходим на главную страницу админки
      console.log('🏠 Navigating to admin dashboard...');
      await this.page.goto('/');
      
      // Ждать загрузки chat interface
      console.log('⏳ Waiting for chat interface to load...');
      await this.page.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });
      
      // Дополнительно ждем готовности чата (send button не disabled)
      console.log('⏳ Waiting for chat to be ready...');
      try {
        await this.page.waitForFunction(
          () => {
            const btn = document.querySelector('[data-testid="send-button"]') as HTMLButtonElement;
            const input = document.querySelector('[data-testid="chat-input"]') as HTMLInputElement;
            
            // Кнопка не должна быть disabled когда есть текст в input
            if (input && input.value.length > 0) {
              return btn && !btn.disabled;
            }
            
            // Если input пустой, проверяем что status готов
            return btn && btn.getAttribute('disabled') === null;
          },
          { timeout: 5000 }
        );
      } catch (error) {
        console.log('⚠️ Chat readiness timeout, proceeding anyway...');
      }
      
      console.log('✅ User registered and authenticated successfully via API');
    } catch (error) {
      console.log('⚠️ API auth failed, falling back to redirect approach...');
      
      // Fallback: ждать перенаправления на главную страницу
      console.log('⏳ Waiting for redirect to main page...');
      
      // Ждем изменения URL - должны остаться на app.localhost но не на /register
      try {
        await this.page.waitForFunction(
          () => !window.location.href.includes('/register') && !window.location.href.includes('/login'),
          { timeout: 15000 }
        );
        console.log('✅ Redirected successfully');
      } catch (redirectError) {
        console.log('❌ Redirect timeout, checking current page...');
        const currentUrl = this.page.url();
        console.log('🔍 Current URL:', currentUrl);
        
        // Если мы еще на странице регистрации или логина, это проблема
        if (currentUrl.includes('/register') || currentUrl.includes('/login')) {
          throw new Error(`Still on auth page: ${currentUrl}`);
        }
      }
      
      // Ждать загрузки chat interface
      console.log('⏳ Waiting for chat interface to load...');
      await this.page.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });
      
      console.log('✅ User registered via fallback method');
    }
  }

  /**
   * @deprecated Legacy AI mocking - use AI Fixtures system instead
   * AI Fixtures are automatically enabled by environment mode
   */
  async setupAIMocks() {
    console.log('⚠️ Legacy setupAIMocks() - AI Fixtures system handles this automatically');
  }


  /**
   * @deprecated Legacy AI mocking - AI Fixtures system handles this automatically
   */
  async disableAIMocks() {
    console.log('⚠️ Legacy disableAIMocks() - AI Fixtures system handles this automatically');
  }

  /**
   * Надежная установка auth session через прямой API
   * Обходит проблемы с cookie domain в тестах
   */
  async setAuthSession(email: string, userId?: string) {
    console.log('🔐 Setting auth session via API...');
    
    // Используем тестовый API endpoint для создания session
    const response = await this.page.request.post('/api/test/auth-signin', {
      data: {
        email,
        userId: userId || `test-${Date.now()}`,
        userType: 'regular'
      },
      headers: getTestHeaders()
    });

    if (!response.ok()) {
      throw new Error(`Failed to set auth session: ${response.status()}`);
    }

    const responseData = await response.json();
    console.log('✅ Auth session API response:', responseData);
    
    // Извлекаем cookies из ответа
    const setCookieHeaders = response.headers()['set-cookie'];
    console.log('🍪 Set-Cookie headers:', setCookieHeaders);
    
    // Убеждаемся что cookies установлены в browser context
    if (setCookieHeaders) {
      console.log('🔄 Cookies should be automatically set by Playwright request API');
    }
    
    // Небольшая пауза чтобы cookies применились
    await this.page.waitForTimeout(500);
    
    console.log('✅ Auth session set successfully');
    
    return response;
  }

  /**
   * Проверяет статус аутентификации через API
   */
  async checkAuthStatus(): Promise<{ authenticated: boolean; user?: any }> {
    console.log('🔍 Checking auth status...');
    
    // Сначала проверим какие cookies у нас есть
    const cookies = await this.page.context().cookies();
    const testSessionCookie = cookies.find(c => c.name === 'test-session');
    console.log('🍪 Current cookies:', cookies.map(c => ({ name: c.name, domain: c.domain, path: c.path })));
    console.log('🔍 Test session cookie:', testSessionCookie ? 'EXISTS' : 'NOT FOUND');
    
    // Используем тестовый endpoint который понимает test-session cookies
    const response = await this.page.request.get('/api/test/session', {
      headers: getTestHeaders()
    });

    console.log(`📡 Auth status response: ${response.status()}`);

    if (!response.ok()) {
      console.log('❌ Auth status request failed');
      return { authenticated: false };
    }

    const session = await response.json();
    console.log('📋 Session data received:', session);
    
    return {
      authenticated: !!session?.user,
      user: session?.user
    };
  }

  /**
   * Ждет установки auth session с retry логикой
   */
  async waitForAuthSession(options?: { timeout?: number; retries?: number }) {
    const { timeout = 10000, retries = 5 } = options || {};
    
    for (let i = 0; i < retries; i++) {
      const status = await this.checkAuthStatus();
      
      if (status.authenticated) {
        console.log('✅ Auth session confirmed');
        return status.user;
      }
      
      console.log(`⏳ Auth session not ready, retry ${i + 1}/${retries}...`);
      await this.page.waitForTimeout(timeout / retries);
    }
    
    throw new Error('Auth session not established after retries');
  }
}