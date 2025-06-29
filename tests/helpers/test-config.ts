/**
 * @file tests/helpers/test-config.ts
 * @description Центральная конфигурация для тестов - определение портов, доменов и URL
 * @version 1.0.0
 * @date 2025-06-15
 */

/**
 * Получает порт из конфигурации Playwright
 * Поддерживает как environment variable, так и динамическое определение
 */
export function getTestPort(): number {
  // 1. Проверяем PLAYWRIGHT_PORT (установлен в playwright.config.ts)
  if (process.env.PLAYWRIGHT_PORT) {
    const envPort = Number.parseInt(process.env.PLAYWRIGHT_PORT, 10);
    if (!Number.isNaN(envPort)) {
      return envPort;
    }
  }

  // 2. Fallback к стандартному порту для разработки
  return 3000;
}

/**
 * Конфигурация доменов для мультидоменной архитектуры
 */
export interface TestDomainConfig {
  /** Основной домен для публичного сайта */
  public: string;
  /** Домен для админ панели */
  admin: string;
}

/**
 * Получает конфигурацию доменов в зависимости от окружения
 */
export function getTestDomains(): TestDomainConfig {
  const port = getTestPort();
  
  // Check if we're in real production (not local production testing)
  // ИСПРАВЛЕНИЕ: В Playwright тестах всегда используем локальные домены
  const isRealProduction = process.env.NODE_ENV === 'production' && 
                          !process.env.PLAYWRIGHT_USE_PRODUCTION && 
                          !process.env.PLAYWRIGHT_PORT &&
                          !isPlaywrightEnvironment();
  
  if (isRealProduction) {
    return {
      public: 'welcome-onboard.ru', // Real production domain
      admin: 'app.welcome-onboard.ru' // Real production admin domain
    };
  }

  // For local development and local production testing
  return {
    public: `localhost:${port}`,
    admin: `app.localhost:${port}`
  };
}

/**
 * Конфигурация URL для тестов
 */
export interface TestUrlConfig {
  /** Базовый URL для публичного сайта */
  publicBase: string;
  /** Базовый URL для админ панели */
  adminBase: string;
  /** URL для health check */
  ping: string;
}

/**
 * Получает полную конфигурацию URL для тестов
 */
export function getTestUrls(): TestUrlConfig {
  const port = getTestPort();
  const domains = getTestDomains();
  
  // Check if we're in real production (not local production testing)
  // ИСПРАВЛЕНИЕ: В Playwright тестах всегда используем локальные домены
  const isRealProduction = process.env.NODE_ENV === 'production' && 
                          !process.env.PLAYWRIGHT_USE_PRODUCTION && 
                          !process.env.PLAYWRIGHT_PORT &&
                          !isPlaywrightEnvironment();
  const protocol = isRealProduction ? 'https' : 'http';
  
  return {
    publicBase: `${protocol}://${domains.public}`,
    adminBase: `${protocol}://${domains.admin}`,
    ping: `${protocol}://${domains.public}/api/ping`
  };
}

/**
 * Получает заголовки для тестирования
 */
export function getTestHeaders(): Record<string, string> {
  return {
    'X-Test-Environment': 'playwright'
  };
}

/**
 * Проверяет, запущен ли тест в Playwright окружении
 */
export function isPlaywrightEnvironment(): boolean {
  return process.env.PLAYWRIGHT === 'True' || 
         process.env.CI === 'true' ||
         !!process.env.PLAYWRIGHT_PORT;
}

/**
 * Получает настройки cookie для мультидоменной архитектуры
 */
export function getCookieConfig() {
  const domains = getTestDomains();
  
  return {
    // Для разработки используем .localhost чтобы cookie работали между доменами
    domain: process.env.NODE_ENV === 'development' ? '.localhost' : undefined,
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure: process.env.NODE_ENV === 'production'
  };
}

/**
 * Преобразует относительный URL в абсолютный для админ панели
 */
export function getAdminUrl(path: string): string {
  const urls = getTestUrls();
  return `${urls.adminBase}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Преобразует относительный URL в абсолютный для публичного сайта
 */
export function getPublicUrl(path: string): string {
  const urls = getTestUrls();
  return `${urls.publicBase}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Получает конфигурацию для Chrome launcher с поддержкой app.localhost
 */
export function getChromeConfig() {
  const port = getTestPort();
  
  return {
    args: [
      `--host-resolver-rules=MAP app.localhost:* 127.0.0.1:${port}`,
      '--disable-features=VizDisplayCompositor',
      '--no-sandbox'
    ]
  };
}

/**
 * Выводит информацию о конфигурации тестов для отладки
 */
export function logTestConfig(): void {
  const port = getTestPort();
  const domains = getTestDomains();
  const urls = getTestUrls();
  
  console.log('🔧 Test Configuration:');
  console.log(`   Port: ${port}`);
  console.log(`   Public Domain: ${domains.public}`);
  console.log(`   Admin Domain: ${domains.admin}`);
  console.log(`   Public Base URL: ${urls.publicBase}`);
  console.log(`   Admin Base URL: ${urls.adminBase}`);
  console.log(`   Ping URL: ${urls.ping}`);
  console.log(`   Is Playwright: ${isPlaywrightEnvironment()}`);
}