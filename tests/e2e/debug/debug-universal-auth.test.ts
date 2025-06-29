/**
 * @file tests/e2e/debug/debug-universal-auth.test.ts
 * @description Debug test for universalAuthentication UI issue
 */

import { test, } from '@playwright/test'
import { universalAuthentication } from '../../helpers/auth.helper'
import { verifyUIAuthentication } from '../../helpers/ui-auth-verification'

test.describe('Universal Authentication Debug', () => {
  test('Debug universalAuthentication UI vs API', async ({ page }) => {
    console.log('🔍 Starting universalAuthentication debug...')
    
    const testUser = {
      email: `debug-universal-${Date.now()}@test.com`,
      id: crypto.randomUUID()
    }
    
    console.log('🚀 User data:', testUser)
    
    try {
      // Выполняем universalAuthentication
      await universalAuthentication(page, testUser)
      console.log('✅ universalAuthentication completed')
      
      // Проверяем URL
      const currentUrl = page.url()
      console.log(`📍 Current URL: ${currentUrl}`)
      
      // Проверяем cookies
      const cookies = await page.context().cookies()
      console.log(`🍪 Total cookies: ${cookies.length}`)
      cookies.forEach(cookie => {
        console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 50)}...`)
      })
      
      // Проверяем что header видим
      const headerVisible = await page.locator('[data-testid="header"]').isVisible({ timeout: 5000 }).catch(() => false)
      console.log(`📍 Header visible: ${headerVisible}`)
      
      // КРИТИЧЕСКАЯ ПРОВЕРКА: UI аутентификация
      console.log('🔍 Checking UI authentication signs...')
      const uiAuthResult = await verifyUIAuthentication(page, { timeout: 5000, verbose: true })
      
      console.log('📊 UI Authentication Result:', uiAuthResult)
      
      // Проверяем что API видит нас как аутентифицированных
      console.log('📡 Testing API authentication...')
      const apiResponse = await page.request.get('/api/artifacts', {
        headers: {
          'X-Test-Environment': 'playwright'
        }
      })
      
      console.log(`📡 API Response Status: ${apiResponse.status()}`)
      
      if (apiResponse.ok()) {
        const apiData = await apiResponse.json()
        console.log(`📡 API sees user as authenticated: ${!!apiData}`)
        console.log(`📡 API returned artifacts count: ${apiData.artifacts?.length || 0}`)
      }
      
      // Проверяем page content для отладки
      const bodyText = await page.textContent('body') || ''
      const hasLoginText = bodyText.includes('Login') || bodyText.includes('Sign')
      const hasUserText = bodyText.includes('@') || bodyText.includes('User')
      
      console.log(`📄 Page shows login UI: ${hasLoginText}`)
      console.log(`📄 Page shows user info: ${hasUserText}`)
      console.log(`📄 Page content length: ${bodyText.length}`)
      
      if (bodyText.includes('login') || bodyText.includes('sign')) {
        console.log('⚠️ Page appears to show authentication form - UI not authenticated!')
      }
      
    } catch (error) {
      console.error('❌ universalAuthentication debug failed:', error)
      
      // Показать текущее состояние при ошибке
      const currentUrl = page.url()
      const cookies = await page.context().cookies()
      
      console.log(`📍 Error URL: ${currentUrl}`)
      console.log(`🍪 Error cookies count: ${cookies.length}`)
    }
  })
})