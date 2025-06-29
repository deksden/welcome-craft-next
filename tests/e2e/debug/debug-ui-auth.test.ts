/**
 * @file tests/e2e/debug/debug-ui-auth.test.ts
 * @description Debug тест для проверки UI аутентификации
 */

import { test, expect } from '@playwright/test'
import { universalAuthentication } from '../../helpers/auth.helper'
import { verifyUIAuthentication } from '../../helpers/ui-auth-verification'

test.describe('UI Authentication Debug', () => {
  test('Debug UI authentication detection', async ({ page }) => {
    console.log('🔍 Starting UI authentication debug...')
    
    const testUser = {
      email: `debug-ui-${Date.now()}@test.com`,
      id: crypto.randomUUID()
    }
    
    console.log('🚀 User data:', testUser)
    
    // Выполняем universalAuthentication
    await universalAuthentication(page, testUser)
    console.log('✅ universalAuthentication completed')
    
    // Проверяем URL
    const currentUrl = page.url()
    console.log(`📍 Current URL: ${currentUrl}`)
    
    // Проверяем что header видим
    await expect(page.locator('[data-testid="header"]')).toBeVisible({ timeout: 10000 })
    console.log('✅ Header is visible')
    
    // ДЕТАЛЬНАЯ ПРОВЕРКА: UI аутентификация
    console.log('🔍 Running detailed UI authentication check...')
    const uiAuthResult = await verifyUIAuthentication(page, { timeout: 5000, verbose: true })
    
    console.log('📊 UI Authentication Result:', uiAuthResult)
    
    // Дополнительные проверки для отладки
    console.log('🔍 Additional debug checks...')
    
    // Проверим FastSessionProvider состояние
    const sessionProviderLogs = await page.evaluate(() => {
      // Получим все console логи связанные с FastSessionProvider
      return {
        cookies: document.cookie,
        cookieCount: document.cookie.split(';').filter(c => c.trim().length > 0).length,
        hasTestSession: document.cookie.includes('test-session'),
        windowDefined: typeof window !== 'undefined',
        documentDefined: typeof document !== 'undefined'
      }
    })
    
    console.log('🔍 Session provider state:', sessionProviderLogs)
    
    // Проверим количество элементов в sidebar
    const sidebarElementCount = await page.locator('[data-sidebar] button').count()
    console.log(`🔍 Sidebar button count: ${sidebarElementCount}`)
    
    // Проверим все testid элементы в sidebar
    const sidebarTestIds = await page.locator('[data-sidebar] [data-testid]').allTextContents()
    console.log('🔍 Sidebar testid elements:', sidebarTestIds)
    
    console.log('✅ UI authentication debug completed')
  })
})