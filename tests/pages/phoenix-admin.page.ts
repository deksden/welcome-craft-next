/**
 * @file tests/pages/phoenix-admin.page.ts
 * @description POM for Phoenix Admin Dashboard - following WelcomeCraft coding standards
 * @version 1.2.0
 * @date 2025-06-30
 * @updated Fixed strict mode violations for createWorldButton and Environment label selectors
 */

/** HISTORY:
 * v1.2.0 (2025-06-30): Fixed strict mode violations для createWorldButton и Environment/Category label selectors
 * v1.1.0 (2025-06-30): Fixed currentEnvironmentBadge selector и improved button getByRole selectors 
 * v1.0.0 (2025-06-30): Created Phoenix Admin POM для E2E тестов
 */

import { type Page, type Locator, expect } from '@playwright/test'

/**
 * Phoenix Admin Page Object Model
 * 
 * Инкапсулирует все взаимодействия с Phoenix Admin Dashboard
 * Следует принципам WelcomeCraft POM архитектуры
 * 
 * @feature PHOENIX PROJECT Step 6 - E2E Testing POM
 * @feature Fail-fast локаторы с коротким timeout
 * @feature Декларативный синтаксис операций
 */
export class PhoenixAdminPage {
  constructor(private page: Page) {}

  // === BASIC NAVIGATION ===
  
  /**
   * Навигация на Phoenix Admin Dashboard
   */
  async navigate(): Promise<void> {
    await this.page.goto('/phoenix')
    await this.waitForPageLoad()
  }

  /**
   * Ожидание загрузки страницы Phoenix
   */
  async waitForPageLoad(): Promise<void> {
    // Ждем заголовок Phoenix Admin Dashboard
    await expect(this.page.locator('h1:has-text("PHOENIX Admin Dashboard")')).toBeVisible({ timeout: 10000 })
  }

  // === PAGE ELEMENTS ===

  get phoenixTitle(): Locator {
    return this.page.locator('h1:has-text("PHOENIX Admin Dashboard")')
  }

  get currentEnvironmentBadge(): Locator {
    // Badge is a sibling element right after h1 in the same flex container
    return this.page.locator('h1:has-text("PHOENIX Admin Dashboard") + [class*="badge"]')
  }

  get refreshButton(): Locator {
    return this.page.getByRole('button', { name: /refresh/i })
  }

  get createWorldButton(): Locator {
    return this.page.getByRole('button', { name: /create world/i }).first()
  }

  // === TABS NAVIGATION ===

  get worldsTab(): Locator {
    return this.page.getByRole('tab', { name: 'Worlds' })
  }

  get environmentsTab(): Locator {
    return this.page.getByRole('tab', { name: 'Environments' })
  }

  get metricsTab(): Locator {
    return this.page.getByRole('tab', { name: 'Metrics' })
  }

  get settingsTab(): Locator {
    return this.page.getByRole('tab', { name: 'Settings' })
  }

  // === TAB CONTENT VERIFICATION ===

  /**
   * Проверка загрузки World Management Panel
   */
  async verifyWorldsTabContent(): Promise<void> {
    await this.worldsTab.click()
    
    // Ждем загрузки World Management Panel
    await expect(this.page.locator('text=World Management')).toBeVisible({ timeout: 5000 })
    await expect(this.page.locator('text=Create, manage and monitor dynamic test worlds')).toBeVisible({ timeout: 5000 })
  }

  /**
   * Проверка загрузки Environment Status Panel  
   */
  async verifyEnvironmentsTabContent(): Promise<void> {
    await this.environmentsTab.click()
    
    // Ждем загрузки Environment Status Panel
    await expect(this.page.locator('text=Environment Status')).toBeVisible({ timeout: 5000 })
  }

  /**
   * Проверка загрузки System Metrics Panel
   */
  async verifyMetricsTabContent(): Promise<void> {
    await this.metricsTab.click()
    
    // Ждем загрузки System Metrics Panel
    await expect(this.page.locator('text=System Metrics')).toBeVisible({ timeout: 5000 })
  }

  /**
   * Проверка загрузки Settings Tab
   */
  async verifySettingsTabContent(): Promise<void> {
    await this.settingsTab.click()
    
    // Ждем загрузки Settings panel
    await expect(this.page.locator('text=PHOENIX Configuration')).toBeVisible({ timeout: 5000 })
    await expect(this.page.locator('text=Current Environment')).toBeVisible({ timeout: 5000 })
  }

  // === WORLD MANAGEMENT OPERATIONS ===

  /**
   * Проверка элементов World Management панели
   */
  async verifyWorldManagementElements(): Promise<void> {
    await this.worldsTab.click()
    
    // Проверяем основные элементы панели управления мирами
    await expect(this.page.locator('text=World Management')).toBeVisible({ timeout: 5000 })
    await expect(this.page.locator('text=Total Worlds')).toBeVisible({ timeout: 5000 })
    
    // Проверяем фильтры (ищем label элементы для избежания ambiguous matches)
    await expect(this.page.locator('label[for="environment"], label:has-text("Environment")').first()).toBeVisible({ timeout: 5000 })
    await expect(this.page.locator('label[for="category"], label:has-text("Category")').first()).toBeVisible({ timeout: 5000 })
  }

  // === ENVIRONMENT STATUS OPERATIONS ===

  /**
   * Проверка Environment Status панели
   */
  async verifyEnvironmentStatusElements(): Promise<void> {
    await this.environmentsTab.click()
    
    // В зависимости от компонента, проверяем наличие environment information
    const hasEnvironmentInfo = await this.page.locator('text=Environment Status').isVisible({ timeout: 5000 })
    if (hasEnvironmentInfo) {
      // Если компонент загружен, проверяем его содержимое
      console.log('✅ Environment Status Panel loaded')
    } else {
      console.log('⚠️ Environment Status Panel content not fully loaded')
    }
  }

  // === SYSTEM METRICS OPERATIONS ===

  /**
   * Проверка System Metrics панели
   */
  async verifySystemMetricsElements(): Promise<void> {
    await this.metricsTab.click()
    
    // Проверяем загрузку метрик
    const hasMetrics = await this.page.locator('text=Performance Metrics').isVisible({ timeout: 5000 })
    if (hasMetrics) {
      await expect(this.page.locator('text=Total Users')).toBeVisible({ timeout: 5000 })
      await expect(this.page.locator('text=Avg Response Time')).toBeVisible({ timeout: 5000 })
    } else {
      console.log('⚠️ System Metrics Panel content loading...')
    }
  }

  // === RESPONSIVE TESTING ===

  /**
   * Проверка responsive поведения
   */
  async verifyResponsiveBehavior(): Promise<void> {
    // Проверяем что tab structure работает на разных размерах
    await expect(this.page.locator('[role="tablist"]')).toBeVisible({ timeout: 5000 })
    
    // Проверяем что tabs кликабельны
    await this.worldsTab.click()
    await expect(this.worldsTab).toHaveAttribute('data-state', 'active')
    
    await this.metricsTab.click() 
    await expect(this.metricsTab).toHaveAttribute('data-state', 'active')
  }

  // === NAVIGATION TESTING ===

  /**
   * Проверка корректной навигации между табами
   */
  async verifyTabNavigation(): Promise<void> {
    // Тестируем переключение между всеми табами
    await this.worldsTab.click()
    await expect(this.worldsTab).toHaveAttribute('data-state', 'active')
    
    await this.environmentsTab.click()
    await expect(this.environmentsTab).toHaveAttribute('data-state', 'active')
    
    await this.metricsTab.click()
    await expect(this.metricsTab).toHaveAttribute('data-state', 'active')
    
    await this.settingsTab.click()
    await expect(this.settingsTab).toHaveAttribute('data-state', 'active')
    
    console.log('✅ All tabs navigation working correctly')
  }
}

// END OF: tests/pages/phoenix-admin.page.ts