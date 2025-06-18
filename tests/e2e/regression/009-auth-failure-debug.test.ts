/**
 * @file tests/e2e/regression/009-auth-failure-debug.test.ts
 * @description Регрессионный тест для диагностики проблемы с аутентификацией (BUG-009)
 * @version 1.0.0
 * @date 2025-06-18
 */

import { test, expect } from '@playwright/test'

test.describe('BUG-009: Auth Failure Debug', () => {
  test('should diagnose login form behavior', async ({ page }) => {
    // Перехватываем все сетевые запросы для анализа
    const requests: any[] = []
    const responses: any[] = []
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      })
    })
    
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      })
    })
    
    // Перехватываем ошибки консоли
    const consoleMessages: string[] = []
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`)
    })
    
    // Идем на страницу логина
    await page.goto('http://app.localhost:3001/login')
    await expect(page.getByText('Sign In')).toBeVisible()
    
    // Заполняем форму
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('test123')
    
    // Убеждаемся что world selector видим и установлен в PRODUCTION
    await expect(page.getByLabel('🌍 Режим работы')).toBeVisible()
    const selectedWorld = await page.locator('select[id="world-select"]').inputValue()
    console.log('🌍 Selected world:', selectedWorld)
    
    // Пробуем войти
    console.log('🔐 Attempting login...')
    await page.getByRole('button', { name: 'Sign in' }).click()
    
    // Ждем некоторое время чтобы увидеть что происходит
    await page.waitForTimeout(3000)
    
    // Проверяем, остались ли мы на странице логина
    const currentUrl = page.url()
    console.log('📍 Current URL after login attempt:', currentUrl)
    
    // Проверяем состояние полей формы
    const emailValue = await page.getByLabel('Email').inputValue()
    const passwordValue = await page.getByLabel('Password').inputValue()
    
    console.log('📝 Form state after login:')
    console.log('  Email:', emailValue)
    console.log('  Password:', passwordValue ? '***' : 'EMPTY')
    
    // Логируем сетевые запросы
    console.log('🌐 Network requests:')
    requests.forEach(req => {
      if (req.url.includes('/login') || req.url.includes('/api/auth')) {
        console.log(`  ${req.method} ${req.url}`)
        if (req.postData) {
          console.log(`    Data: ${req.postData}`)
        }
      }
    })
    
    // Логируем ответы
    console.log('📡 Network responses:')
    responses.forEach(res => {
      if (res.url.includes('/login') || res.url.includes('/api/auth')) {
        console.log(`  ${res.status} ${res.url}`)
      }
    })
    
    // Логируем ошибки консоли
    if (consoleMessages.length > 0) {
      console.log('🚨 Console messages:')
      consoleMessages.forEach(msg => console.log(`  ${msg}`))
    }
    
    // Проверяем основную проблему - сброс пароля
    if (passwordValue === '') {
      console.log('❌ CONFIRMED: Password field was reset after login attempt')
    } else {
      console.log('✅ Password field retained value')
    }
    
    // Проверяем, произошел ли redirect
    if (currentUrl.includes('/login')) {
      console.log('❌ CONFIRMED: Still on login page - login failed')
    } else {
      console.log('✅ Redirected away from login page - login may have succeeded')
    }
  })
  
  test('should test with test credentials', async ({ page }) => {
    await page.goto('http://app.localhost:3001/login')
    
    // Пробуем с тестовыми учетными данными
    await page.getByLabel('Email').fill('test@test.com')
    await page.getByLabel('Password').fill('test-password')
    
    console.log('🧪 Attempting login with test credentials...')
    await page.getByRole('button', { name: 'Sign in' }).click()
    
    await page.waitForTimeout(3000)
    
    const currentUrl = page.url()
    const passwordValue = await page.getByLabel('Password').inputValue()
    
    console.log('📍 Test credentials result URL:', currentUrl)
    console.log('📝 Test credentials password field:', passwordValue ? '***' : 'EMPTY')
  })
})