/**
 * @file tests/helpers/dynamic-timeouts.ts
 * @description Dynamic timeout configuration. Simplified for local-prod vs CI environments.
 * @version 2.0.0
 * @date 2025-06-27
 */

export interface TimeoutConfig {
  navigation: number;
  element: number;
  interaction: number;
  aiProcessing: number;
  wait: number;
}

function getEnvTimeout(envVar: string, fallback: number): number {
  const envValue = process.env[envVar];
  if (envValue) {
    const parsed = Number.parseInt(envValue, 10);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

export function getTimeoutConfig(): TimeoutConfig {
  const isCI = !!process.env.CI;
  
  let defaults: TimeoutConfig;
  
  if (isCI) {
    // Generous timeouts for CI environment
    defaults = {
      navigation: 45000,
      element: 20000,
      interaction: 15000,
      aiProcessing: 15000,
      wait: 5000
    };
  } else {
    // Consistent timeouts for local production-like testing
    defaults = {
      navigation: 15000,
      element: 8000,
      interaction: 5000,
      aiProcessing: 10000,
      wait: 2000
    };
  }
  
  return {
    navigation: getEnvTimeout('PLAYWRIGHT_TIMEOUT_NAVIGATION', defaults.navigation),
    element: getEnvTimeout('PLAYWRIGHT_TIMEOUT_ELEMENT', defaults.element),
    interaction: getEnvTimeout('PLAYWRIGHT_TIMEOUT_INTERACTION', defaults.interaction),
    aiProcessing: getEnvTimeout('PLAYWRIGHT_TIMEOUT_AI', defaults.aiProcessing),
    wait: getEnvTimeout('PLAYWRIGHT_TIMEOUT_WAIT', defaults.wait)
  };
}

export function logTimeoutConfig(): void {
  const config = getTimeoutConfig();
  console.log('⏱️  Dynamic Timeout Configuration:');
  console.log(`   Environment: ${process.env.CI ? 'CI' : 'Local (Production Build)'}`);
  console.log(`   Navigation Timeout: ${config.navigation}ms`);
  console.log(`   Element Timeout: ${config.element}ms`);
}

export async function navigateWithDynamicTimeout(page: any, url: string): Promise<void> {
  const config = getTimeoutConfig();
  console.log(`🔗 Navigating to ${url} with ${config.navigation}ms timeout`);
  await page.goto(url, { timeout: config.navigation });
}

export async function waitForElementWithDynamicTimeout(page: any, selector: string): Promise<void> {
  const config = getTimeoutConfig();
  console.log(`👁️ Waiting for element ${selector} with ${config.element}ms timeout`);
  await page.locator(selector).waitFor({ state: 'visible', timeout: config.element });
}

export function getExpectTimeout(): number {
  const config = getTimeoutConfig();
  return config.element;
}

export async function waitForAIProcessing(): Promise<void> {
  const config = getTimeoutConfig();
  console.log(`🤖 Waiting for AI processing: ${config.aiProcessing}ms`);
  await new Promise(resolve => setTimeout(resolve, config.aiProcessing));
}

/**
 * Measures actual page compilation/loading time and suggests optimal timeout profile
 */
export async function measureCompilationTimeAndSelectProfile(page: any, url: string): Promise<{
  actualTime: number,
  recommendedProfile: 'fast' | 'medium' | 'slow',
  timeoutConfig: TimeoutConfig
}> {
  console.log(`⏱️ Measuring compilation time for ${url}...`);
  
  const startTime = Date.now();
  
  try {
    // Попытка быстрой навигации с базовым timeout'ом
    await page.goto(url, { timeout: 10000, waitUntil: 'domcontentloaded' });
    const actualTime = Date.now() - startTime;
    
    // Определяем профиль на основе реального времени
    let profile: 'fast' | 'medium' | 'slow';
    let timeoutConfig: TimeoutConfig;
    
    if (actualTime <= 3000) {
      // Быстрая компиляция - prod или cached
      profile = 'fast';
      timeoutConfig = {
        navigation: 10000,
        element: 5000,
        interaction: 3000,
        aiProcessing: 6000,
        wait: 1000
      };
    } else if (actualTime <= 10000) {
      // Средняя компиляция - local prod или хорошо прогретый dev
      profile = 'medium';
      timeoutConfig = {
        navigation: 15000,
        element: 8000,
        interaction: 5000,
        aiProcessing: 8000,
        wait: 2000
      };
    } else {
      // Медленная компиляция - холодный dev режим
      profile = 'slow';
      timeoutConfig = {
        navigation: 30000,
        element: 15000,
        interaction: 8000,
        aiProcessing: 10000,
        wait: 3000
      };
    }
    
    console.log(`📊 Compilation measurement result:`);
    console.log(`   Actual time: ${actualTime}ms`);
    console.log(`   Selected profile: ${profile.toUpperCase()}`);
    console.log(`   Navigation timeout: ${timeoutConfig.navigation}ms`);
    
    return { actualTime, recommendedProfile: profile, timeoutConfig };
    
  } catch (error) {
    // Если даже 10s не хватило, используем максимальные timeout'ы
    const actualTime = Date.now() - startTime;
    const slowProfile: TimeoutConfig = {
      navigation: 45000,   // Очень медленная компиляция
      element: 20000,
      interaction: 10000,
      aiProcessing: 12000,
      wait: 4000
    };
    
    console.log(`🐌 Very slow compilation detected:`);
    console.log(`   Timeout at: ${actualTime}ms`);
    console.log(`   Using EXTRA_SLOW profile`);
    console.log(`   Navigation timeout: ${slowProfile.navigation}ms`);
    
    return { actualTime, recommendedProfile: 'slow', timeoutConfig: slowProfile };
  }
}

/**
 * Smart navigation with automatic compilation time measurement
 */
export async function navigateWithAutoProfile(page: any, url: string): Promise<TimeoutConfig> {
  const measurement = await measureCompilationTimeAndSelectProfile(page, url);
  
  // Устанавливаем измеренный профиль как override для последующих операций
  process.env.PLAYWRIGHT_TIMEOUT_NAVIGATION = measurement.timeoutConfig.navigation.toString();
  process.env.PLAYWRIGHT_TIMEOUT_ELEMENT = measurement.timeoutConfig.element.toString();
  process.env.PLAYWRIGHT_TIMEOUT_INTERACTION = measurement.timeoutConfig.interaction.toString();
  process.env.PLAYWRIGHT_TIMEOUT_AI = measurement.timeoutConfig.aiProcessing.toString();
  process.env.PLAYWRIGHT_TIMEOUT_WAIT = measurement.timeoutConfig.wait.toString();
  
  console.log(`🎯 Auto-profile applied: ${measurement.recommendedProfile.toUpperCase()} (${measurement.actualTime}ms)`);
  
  return measurement.timeoutConfig;
}

// END OF: tests/helpers/dynamic-timeouts.ts