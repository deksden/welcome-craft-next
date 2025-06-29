/**
 * @file tests/e2e/debug/debug-cookies.test.ts
 * @description Debug тест для проверки cookie установки и чтения
 */

import { test, expect } from '@playwright/test'

test.describe('Cookie Debug', () => {
  test('Debug cookie setup and reading', async ({ page }) => {
    console.log('🍪 Starting cookie debug...')
    
    // Навигация на admin домен
    await page.goto('http://app.localhost:3000/artifacts')
    console.log('📍 Navigated to app.localhost:3000/artifacts')
    
    // Проверяем начальные cookies
    const initialCookies = await page.context().cookies()
    console.log(`🍪 Initial cookies: ${initialCookies.length}`)
    initialCookies.forEach(cookie => {
      console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 50)}...`)
    })
    
    // Выполняем auth запрос через browser fetch
    const authResult = await page.evaluate(async () => {
      console.log('🔄 Making auth request...')
      
      try {
        const response = await fetch('/api/test/auth-signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Test-Environment': 'playwright'
          },
          body: JSON.stringify({
            email: 'debug-cookies@test.com',
            userId: crypto.randomUUID(),
            userType: 'regular'
          }),
          credentials: 'same-origin'
        })
        
        const data = await response.json()
        console.log('📡 Auth response status:', response.status)
        console.log('📡 Auth response data:', data)
        
        // Проверяем cookies после auth
        console.log('🍪 Cookies after auth:', document.cookie)
        const cookiesArray = document.cookie.split('; ').filter(c => c.length > 0)
        console.log('🍪 Parsed cookies:', cookiesArray)
        
        return {
          status: response.status,
          success: response.ok,
          cookies: cookiesArray
        }
      } catch (error) {
        console.error('❌ Auth error:', error)
        return {
          status: 0,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }
      }
    })
    
    console.log('🔍 Auth result:', authResult)
    
    // Проверяем cookies через Playwright API
    const finalCookies = await page.context().cookies()
    console.log(`🍪 Final cookies via Playwright: ${finalCookies.length}`)
    finalCookies.forEach(cookie => {
      console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 50)}... (domain: ${cookie.domain})`)
    })
    
    // Проверяем что auth прошел успешно
    expect(authResult.success).toBe(true)
    
    // Проверяем что test-session cookie установлен
    const testSessionCookie = finalCookies.find(c => c.name === 'test-session')
    expect(testSessionCookie).toBeDefined()
    
    console.log('✅ Cookie debug completed successfully')
  })
})