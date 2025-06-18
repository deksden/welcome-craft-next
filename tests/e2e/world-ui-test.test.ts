/**
 * @file tests/e2e/world-ui-test.test.ts
 * @description Простой тест для проверки GUI компонентов мира
 * @version 1.0.0
 * @date 2025-06-18
 * @updated Тест для world selector и world indicator компонентов
 */

/** HISTORY:
 * v1.0.0 (2025-06-18): Начальная версия для проверки GUI входа в миры.
 */

import { test, expect } from '@playwright/test'

test.describe('World UI Components', () => {
  test('Login page должен показывать world selector', async ({ page }) => {
    // Переходим на страницу логина
    await page.goto('/login')
    
    // Проверяем наличие селектора мира
    await expect(page.locator('label:has-text("🌍 Тестовый мир")')).toBeVisible()
    await expect(page.locator('#world-select')).toBeVisible()
    
    // Проверяем опции миров  
    const worldOptions = page.locator('#world-select option')
    await expect(worldOptions).toHaveCount(5)
    
    await expect(worldOptions.nth(0)).toHaveText('Чистое рабочее пространство')
    await expect(worldOptions.nth(1)).toHaveText('Сайт готов к публикации')
    await expect(worldOptions.nth(2)).toHaveText('Библиотека контента')
    await expect(worldOptions.nth(3)).toHaveText('Демонстрационная среда')
    await expect(worldOptions.nth(4)).toHaveText('Корпоративный онбординг')
    
    console.log('✅ World selector отображается корректно')
  })
  
  test('Можно выбрать разные миры', async ({ page }) => {
    await page.goto('/login')
    
    const worldSelect = page.locator('#world-select')
    
    // Проверяем значение по умолчанию
    await expect(worldSelect).toHaveValue('CLEAN_USER_WORKSPACE')
    
    // Меняем на другой мир
    await worldSelect.selectOption('SITE_READY_FOR_PUBLICATION')
    await expect(worldSelect).toHaveValue('SITE_READY_FOR_PUBLICATION')
    
    // Проверяем текст выбранной опции
    const selectedOption = page.locator('#world-select option:checked')
    await expect(selectedOption).toHaveText('Сайт готов к публикации')
    
    console.log('✅ Переключение между мирами работает')
  })
})

// END OF: tests/e2e/world-ui-test.test.ts