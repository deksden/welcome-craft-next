/**
 * @file tests/pages/phoenix-seed-export.page.ts
 * @description POM for Phoenix Seed Export Page - following WelcomeCraft coding standards
 * @version 1.0.0
 * @date 2025-07-01
 * @updated Created POM for Phoenix Seed Export page with fail-fast locators
 */

/** HISTORY:
 * v1.0.0 (2025-07-01): Created Phoenix Seed Export POM для E2E тестов с data-testid селекторами
 */

import { type Page, type Locator, expect } from '@playwright/test'

/**
 * Phoenix Seed Export Page Object Model
 * 
 * Инкапсулирует все взаимодействия с Phoenix Seed Export страницей
 * Следует принципам WelcomeCraft POM архитектуры
 * 
 * @feature PHOENIX PROJECT - Seed Data Management
 * @feature Fail-fast локаторы с коротким timeout
 * @feature Декларативный синтаксис операций
 */
export class PhoenixSeedExportPage {
  constructor(private page: Page) {}

  // === BASIC NAVIGATION ===
  
  /**
   * Навигация на Phoenix Seed Export страницу
   */
  async navigate(): Promise<void> {
    await this.page.goto('/phoenix/seed-export')
    await this.waitForPageLoad()
  }

  /**
   * Ожидание загрузки страницы Seed Export
   */
  async waitForPageLoad(): Promise<void> {
    // Ждем заголовок Seed Export или Access Denied
    await this.page.waitForSelector('h1:has-text("Seed Export"), h2:has-text("Access Denied")', { timeout: 10000 })
  }

  // === ACCESS CONTROL ===

  /**
   * Проверка отображения Access Denied сообщения
   */
  async verifyAccessDenied(): Promise<void> {
    await expect(this.page.locator('h2:has-text("Access Denied")')).toBeVisible({ timeout: 5000 })
    await expect(this.page.locator('text=This feature is only available for admins in the LOCAL environment')).toBeVisible({ timeout: 5000 })
  }

  /**
   * Проверка что форма экспорта доступна (админ права)
   */
  async verifyFormAvailable(): Promise<void> {
    await expect(this.page.locator('h1:has-text("Seed Export")')).toBeVisible({ timeout: 5000 })
    await expect(this.page.locator('text=Export World Seed')).toBeVisible({ timeout: 5000 })
  }

  // === FORM ELEMENTS ===

  get worldSelect(): Locator {
    return this.page.locator('#world-select')
  }

  get dataSourceSelect(): Locator {
    return this.page.locator('#source-db')
  }

  get includeBlobsCheckbox(): Locator {
    return this.page.locator('#include-blobs')
  }

  get directoryNameInput(): Locator {
    return this.page.locator('#seed-name')
  }

  get startExportButton(): Locator {
    return this.page.getByRole('button', { name: 'Start Export' })
  }

  get manualDbUrlInput(): Locator {
    return this.page.locator('#manual-db-url')
  }

  // === FORM INTERACTIONS ===

  /**
   * Выбор мира из списка (Radix UI Compatible)
   * @param worldName Название мира для выбора
   */
  async selectWorld(worldName: string): Promise<void> {
    console.log(`🔍 Selecting world: "${worldName}"`)
    
    try {
      // Стратегия 1: Keyboard Navigation (рекомендовано для Radix UI)
      // Фокусируемся на select trigger
      await this.worldSelect.focus()
      
      // Открываем dropdown с помощью Enter или Space
      await this.page.keyboard.press('Enter')
      
      // Ждем появления опций
      await this.page.waitForTimeout(300)
      
      // Навигируем по опциям с помощью стрелок и ищем нужную
      let attempts = 0
      const maxAttempts = 5
      
      while (attempts < maxAttempts) {
        // Проверяем текущую highlighted опцию
        const highlightedOption = this.page.locator('[role="option"][data-highlighted="true"], [role="option"][aria-selected="true"]')
        const optionText = await highlightedOption.textContent().catch(() => '')
        
        if (optionText.includes(worldName)) {
          // Нашли нужную опцию - выбираем её
          await this.page.keyboard.press('Enter')
          console.log(`✅ World "${worldName}" selected via keyboard navigation`)
          return
        }
        
        // Переходим к следующей опции
        await this.page.keyboard.press('ArrowDown')
        await this.page.waitForTimeout(100)
        attempts++
      }
      
      // Если не нашли через навигацию, пробуем escape и fallback
      await this.page.keyboard.press('Escape')
      throw new Error('Could not find option via keyboard navigation')
      
    } catch (error) {
      console.log(`⚠️ Keyboard strategy failed, trying dispatchEvent approach...`)
      
      // Стратегия 2: DispatchEvent подход (для Radix UI)
      try {
        await this.page.evaluate((targetWorldName) => {
          const trigger = document.querySelector('#world-select') as HTMLElement
          if (!trigger) throw new Error('World select trigger not found')
          
          // Используем pointerdown событие (как рекомендовано для Radix UI)
          const pointerEvent = new Event('pointerdown', { bubbles: true })
          trigger.dispatchEvent(pointerEvent)
          
          // Небольшая задержка для открытия dropdown
          setTimeout(() => {
            // Ищем опцию по тексту
            const options = document.querySelectorAll('[role="option"]')
            for (const option of options) {
              if (option.textContent?.includes(targetWorldName)) {
                // Кликаем по найденной опции
                const clickEvent = new Event('pointerdown', { bubbles: true })
                option.dispatchEvent(clickEvent)
                break
              }
            }
          }, 100)
        }, worldName)
        
        await this.page.waitForTimeout(500)
        console.log(`✅ World "${worldName}" selected via dispatchEvent`)
        
      } catch (dispatchError) {
        console.log(`⚠️ DispatchEvent failed, trying final fallback...`)
        
        // Стратегия 3: Force click fallback
        try {
          await this.worldSelect.click({ force: true })
          await this.page.waitForTimeout(300)
          
          const option = this.page.locator('[role="option"]').filter({ hasText: worldName })
          await option.click({ force: true, timeout: 3000 })
          
          console.log(`✅ World "${worldName}" selected via force click`)
        } catch (fallbackError) {
          throw new Error(`Failed to select world "${worldName}" with all strategies: ${fallbackError}`)
        }
      }
    }
  }

  /**
   * Выбор источника данных (Radix UI Compatible)
   * @param source LOCAL | BETA | PRODUCTION | Specify Manually
   */
  async selectDataSource(source: 'LOCAL' | 'BETA' | 'PRODUCTION' | 'Specify Manually'): Promise<void> {
    const sourceDisplayText = source === 'LOCAL' ? 'Current (LOCAL)' : source
    console.log(`🔍 Selecting data source: "${source}" -> display: "${sourceDisplayText}"`)
    
    try {
      // Стратегия 1: Keyboard Navigation (рекомендовано для Radix UI)
      await this.dataSourceSelect.focus()
      await this.page.keyboard.press('Enter')
      await this.page.waitForTimeout(300)
      
      let attempts = 0
      const maxAttempts = 6 // Больше попыток, так как опций больше
      
      while (attempts < maxAttempts) {
        const highlightedOption = this.page.locator('[role="option"][data-highlighted="true"], [role="option"][aria-selected="true"]')
        const optionText = await highlightedOption.textContent().catch(() => '')
        
        if (optionText.includes(sourceDisplayText) || optionText === sourceDisplayText) {
          await this.page.keyboard.press('Enter')
          console.log(`✅ Data source "${source}" selected via keyboard navigation`)
          return
        }
        
        await this.page.keyboard.press('ArrowDown')
        await this.page.waitForTimeout(100)
        attempts++
      }
      
      await this.page.keyboard.press('Escape')
      throw new Error('Could not find data source option via keyboard navigation')
      
    } catch (error) {
      console.log(`⚠️ Keyboard strategy failed, trying dispatchEvent approach...`)
      
      // Стратегия 2: DispatchEvent подход
      try {
        await this.page.evaluate((targetSource, targetDisplay) => {
          const trigger = document.querySelector('#source-db') as HTMLElement
          if (!trigger) throw new Error('Data source select trigger not found')
          
          const pointerEvent = new Event('pointerdown', { bubbles: true })
          trigger.dispatchEvent(pointerEvent)
          
          setTimeout(() => {
            const options = document.querySelectorAll('[role="option"]')
            for (const option of options) {
              const text = option.textContent || ''
              if (text.includes(targetDisplay) || 
                  text.includes(targetSource) ||
                  (targetSource === 'LOCAL' && text.includes('Current (LOCAL)')) ||
                  (targetSource === 'Specify Manually' && text.includes('Specify Manually'))) {
                const clickEvent = new Event('pointerdown', { bubbles: true })
                option.dispatchEvent(clickEvent)
                break
              }
            }
          }, 100)
        }, source, sourceDisplayText)
        
        await this.page.waitForTimeout(500)
        console.log(`✅ Data source "${source}" selected via dispatchEvent`)
        
      } catch (dispatchError) {
        console.log(`⚠️ DispatchEvent failed, trying final fallback...`)
        
        // Стратегия 3: Force click fallback
        try {
          await this.dataSourceSelect.click({ force: true })
          await this.page.waitForTimeout(300)
          
          const option = this.page.locator('[role="option"]').filter({ hasText: sourceDisplayText })
          await option.click({ force: true, timeout: 3000 })
          
          console.log(`✅ Data source "${source}" selected via force click`)
        } catch (fallbackError) {
          throw new Error(`Failed to select data source "${source}" with all strategies: ${fallbackError}`)
        }
      }
    }
  }

  /**
   * Установка/снятие галочки включения blob файлов
   * @param include true для включения, false для выключения
   */
  async setIncludeBlobs(include: boolean): Promise<void> {
    const isChecked = await this.includeBlobsCheckbox.isChecked()
    if (isChecked !== include) {
      await this.includeBlobsCheckbox.click()
    }
  }

  /**
   * Ввод имени директории для экспорта
   * @param name Имя директории
   */
  async setDirectoryName(name: string): Promise<void> {
    console.log(`🔍 Setting directory name: "${name}"`)
    await this.directoryNameInput.fill(name)
    
    // Verify the value was set
    const actualValue = await this.directoryNameInput.inputValue()
    console.log(`✅ Directory name set to: "${actualValue}"`)
  }

  /**
   * Проверка что мир выбран правильно
   * @param expectedWorldName Ожидаемое название мира
   */
  async verifyWorldSelected(expectedWorldName: string): Promise<void> {
    const triggerText = await this.worldSelect.textContent()
    if (!triggerText?.includes(expectedWorldName)) {
      throw new Error(`World selection failed. Expected: "${expectedWorldName}", Got: "${triggerText}"`)
    }
    console.log(`✅ World selection verified: "${triggerText}"`)
  }

  /**
   * Проверка что источник данных выбран правильно
   * @param expectedSource Ожидаемый источник данных
   */
  async verifyDataSourceSelected(expectedSource: string): Promise<void> {
    const triggerText = await this.dataSourceSelect.textContent()
    const expectedText = expectedSource === 'LOCAL' ? 'Current (LOCAL)' : 
                        expectedSource === 'Specify Manually' ? 'Specify Manually' : expectedSource
    
    if (!triggerText?.includes(expectedText)) {
      throw new Error(`Data source selection failed. Expected: "${expectedText}", Got: "${triggerText}"`)
    }
    console.log(`✅ Data source selection verified: "${triggerText}"`)
  }

  /**
   * Ввод manual DB URL (только если выбран Specify Manually)
   * @param url Database URL
   */
  async setManualDbUrl(url: string): Promise<void> {
    await this.manualDbUrlInput.fill(url)
  }

  /**
   * Клик по кнопке Start Export
   */
  async clickStartExport(): Promise<void> {
    // Финальная диагностика состояния полей перед отправкой
    const worldDisplayText = await this.worldSelect.textContent()
    const dataSourceDisplayText = await this.dataSourceSelect.textContent()
    const directoryValue = await this.directoryNameInput.inputValue()
    
    console.log('🔍 Final form state before export:')
    console.log('  World Selection:', worldDisplayText)
    console.log('  Data Source:', dataSourceDisplayText)
    console.log('  Directory Name:', directoryValue)
    
    await this.startExportButton.click()
  }

  // === FORM VALIDATION ===

  /**
   * Проверка всех элементов формы на видимость
   */
  async verifyAllFormElements(): Promise<void> {
    await expect(this.worldSelect).toBeVisible({ timeout: 5000 })
    await expect(this.dataSourceSelect).toBeVisible({ timeout: 5000 })
    await expect(this.includeBlobsCheckbox).toBeVisible({ timeout: 5000 })
    await expect(this.directoryNameInput).toBeVisible({ timeout: 5000 })
    await expect(this.startExportButton).toBeVisible({ timeout: 5000 })
  }

  /**
   * Проверка отображения Manual DB URL поля при выборе Specify Manually
   */
  async verifyManualDbUrlVisibility(): Promise<void> {
    // Проверяем начальное состояние - поле должно быть скрыто
    // Используем count вместо visibility check чтобы избежать ложного срабатывания
    const initialCount = await this.manualDbUrlInput.count()
    console.log('🔍 Initial manual DB URL field count:', initialCount)
    
    if (initialCount > 0) {
      // Если поле есть, проверяем что оно не видимо
      await expect(this.manualDbUrlInput).not.toBeVisible()
    }
    
    // Выбираем Specify Manually
    console.log('🔍 Selecting "Specify Manually" data source...')
    await this.selectDataSource('Specify Manually')
    
    // Теперь Manual DB URL должно быть видно
    console.log('🔍 Waiting for manual DB URL field to become visible...')
    await expect(this.manualDbUrlInput).toBeVisible({ timeout: 5000 })
    
    console.log('✅ Manual DB URL field visibility test passed')
  }

  // === EXPORT OPERATIONS ===

  /**
   * Полный цикл экспорта с заполнением всех полей (Enhanced с проверками)
   * @param options Параметры экспорта
   */
  async performFullExport(options: {
    worldName: string
    dataSource: 'LOCAL' | 'BETA' | 'PRODUCTION'
    includeBlobs: boolean
    directoryName: string
  }): Promise<void> {
    console.log('🚀 Starting full export with options:', options)
    
    // Выбираем мир с проверкой
    await this.selectWorld(options.worldName)
    await this.verifyWorldSelected(options.worldName)
    
    // Выбираем источник данных с проверкой
    await this.selectDataSource(options.dataSource)
    await this.verifyDataSourceSelected(options.dataSource)
    
    // Устанавливаем остальные поля
    await this.setIncludeBlobs(options.includeBlobs)
    await this.setDirectoryName(options.directoryName)
    
    console.log('🔄 All fields filled and verified, clicking export button...')
    await this.clickStartExport()
  }

  /**
   * Тест на отображение ошибки при незаполненных полях через toast
   */
  async testMissingFieldsError(): Promise<void> {
    // Кликаем экспорт без заполнения полей
    await this.clickStartExport()
    
    // Ждем toast сообщение об ошибке - используем более гибкий селектор
    // Toast система использует Sonner с custom компонентом
    const toastContainer = this.page.locator('[data-testid="toast"]')
    await toastContainer.waitFor({ state: 'visible', timeout: 5000 })
    
    // Проверяем содержимое toast сообщения
    const toastMessage = this.page.locator('[data-testid="toast-message"]')
    await expect(toastMessage).toContainText('Please fill all required fields')
    
    // Проверяем что это error toast (красная иконка)
    const toastIcon = this.page.locator('[data-testid="toast-icon"][data-type="error"]')
    await expect(toastIcon).toBeVisible({ timeout: 2000 })
  }

  // === SUCCESS/ERROR HANDLING ===

  /**
   * Проверка успешного экспорта через toast уведомления
   * @param expectedPath Ожидаемый путь экспорта
   */
  async verifyExportSuccess(expectedPath: string): Promise<void> {
    // Ждем появления toast контейнера
    const toastContainer = this.page.locator('[data-testid="toast"]')
    await toastContainer.waitFor({ state: 'visible', timeout: 10000 })
    
    // Получаем содержимое toast сообщения
    const toastMessage = this.page.locator('[data-testid="toast-message"]')
    const toastText = await toastMessage.textContent()
    console.log('🔍 Toast message content:', toastText)
    
    // Проверяем тип toast уведомления
    const toastIcon = this.page.locator('[data-testid="toast-icon"]')
    const toastType = await toastIcon.getAttribute('data-type')
    console.log('🔍 Toast type:', toastType)
    
    // Если это ошибка, выводим подробности
    if (toastType === 'error') {
      throw new Error(`Expected success toast, but got error: "${toastText}"`)
    }
    
    // Ожидаем конкретное сообщение об успехе в toast
    await expect(toastMessage).toContainText('Seed export initiated successfully')
    
    // Проверяем что это success toast (зеленая иконка)
    const successIcon = this.page.locator('[data-testid="toast-icon"][data-type="success"]')
    await expect(successIcon).toBeVisible({ timeout: 2000 })
    
    // Проверяем что результат экспорта отображается в зеленой области на странице
    await expect(this.page.getByText(`Export successful! Path: ${expectedPath}`)).toBeVisible({ timeout: 5000 })
  }

  /**
   * Проверка отображения ошибки экспорта через toast уведомления
   * @param errorMessage Ожидаемое сообщение об ошибке
   */
  async verifyExportError(errorMessage: string): Promise<void> {
    // Ждем появления toast контейнера
    const toastContainer = this.page.locator('[data-testid="toast"]')
    await toastContainer.waitFor({ state: 'visible', timeout: 5000 })
    
    // Проверяем что это error toast
    const errorIcon = this.page.locator('[data-testid="toast-icon"][data-type="error"]')
    await expect(errorIcon).toBeVisible({ timeout: 2000 })
    
    // Проверяем содержимое сообщения
    const toastMessage = this.page.locator('[data-testid="toast-message"]')
    await expect(toastMessage).toContainText(errorMessage)
  }

  // === PAGE STATE VERIFICATION ===

  /**
   * Проверка что страница загружена и готова к использованию
   */
  async verifyPageReady(): Promise<void> {
    // Проверяем что мы не на странице Access Denied
    const accessDenied = await this.page.locator('h2:has-text("Access Denied")').isVisible({ timeout: 2000 }).catch(() => false)
    
    if (accessDenied) {
      throw new Error('Page shows Access Denied - admin privileges required')
    }
    
    // Проверяем что форма полностью загружена
    await this.verifyAllFormElements()
  }

  /**
   * Debug информация о состоянии страницы
   */
  async debugPageState(): Promise<void> {
    const url = this.page.url()
    const title = await this.page.title()
    const bodyText = await this.page.textContent('body')
    
    console.log('🔍 Page Debug Info:')
    console.log('  URL:', url)
    console.log('  Title:', title)
    console.log('  Contains "Access Denied":', bodyText?.includes('Access Denied'))
    console.log('  Contains "Seed Export":', bodyText?.includes('Seed Export'))
    console.log('  Contains "Select World":', bodyText?.includes('Select World'))
    
    // Проверяем количество элементов формы
    const worldSelectCount = await this.worldSelect.count()
    const dataSourceCount = await this.dataSourceSelect.count()
    const startButtonCount = await this.startExportButton.count()
    
    console.log('  Form Elements (by ID/role):')
    console.log('    World Select (#world-select):', worldSelectCount)
    console.log('    Data Source (#source-db):', dataSourceCount) 
    console.log('    Start Button (by role):', startButtonCount)
  }
}

// END OF: tests/pages/phoenix-seed-export.page.ts