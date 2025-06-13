/**
 * Утилиты для E2E тестов WelcomeCraft
 * Содержит переиспользуемые функции для надежного тестирования
 */

import { Page, Locator } from '@playwright/test';

export class TestUtils {
  constructor(private page: Page) {}

  /**
   * Надежное ожидание элемента с retry логикой
   */
  async waitForElement(selector: string, options?: {
    timeout?: number;
    retries?: number;
    state?: 'attached' | 'detached' | 'visible' | 'hidden';
  }): Promise<Locator> {
    const { timeout = 30000, retries = 3, state = 'visible' } = options || {};
    
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
   * Безопасная отправка сообщения с проверкой состояния
   */
  async sendMessage(message: string, options?: { waitForResponse?: boolean }): Promise<void> {
    const { waitForResponse = true } = options || {};
    
    // Найти и заполнить поле ввода
    const input = this.page.getByTestId('chat-input');
    await input.click();
    await input.fill(message);
    
    // Найти и нажать кнопку отправки
    const sendButton = await this.waitForElement('send-button');
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
      (tabindex === null || parseInt(tabindex) >= -1) &&
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
    await this.page.goto('http://app.localhost:3000/register');
    
    // Заполнить форму регистрации
    await this.page.fill('[data-testid="auth-email-input"]', email);
    await this.page.fill('[data-testid="auth-password-input"]', password);
    
    // Отправить форму
    console.log('📝 Submitting registration form...');
    await this.page.click('[data-testid="auth-submit-button"]');
    
    // Ждать success toast
    console.log('⏳ Waiting for success toast...');
    await this.page.waitForSelector('[data-testid="toast"]', { timeout: 8000 });
    
    const toastText = await this.page.locator('[data-testid="toast"]').first().textContent();
    if (!toastText?.includes('Account created successfully')) {
      throw new Error(`Registration failed: ${toastText}`);
    }
    console.log('✅ Registration success toast received');
    
    // Ждать перенаправления на главную страницу
    console.log('⏳ Waiting for redirect to main page...');
    await this.page.waitForURL('http://app.localhost:3000/', { timeout: 5000 });
    
    // Ждать загрузки chat interface
    console.log('⏳ Waiting for chat interface to load...');
    await this.page.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });
    console.log('✅ User registered and chat interface loaded successfully');
  }
}