import { test, expect } from '@playwright/test';
import { universalAuthentication } from '../../helpers/auth.helper';
import { getTestWorldId } from '../../helpers/test-world-allocator';

test.describe('Phoenix User Management', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    console.log('🚀 Phoenix User Management: Starting admin authentication with world isolation')
    
    // Set up console log listener
    page.on('console', msg => {
      console.log(`🖥️ BROWSER LOG [${msg.type()}]:`, msg.text())
    })
    
    // World Isolation: получаем уникальный world для Phoenix admin
    const workerId = testInfo.parallelIndex.toString()
    const worldId = await getTestWorldId(workerId, 'phoenix-user-management.test.ts')
    
    console.log(`🌍 Phoenix: Using isolated admin world ${worldId} for worker ${workerId}`)
    
    // Authenticate admin user with world isolation
    await universalAuthentication(page, {
      email: `phoenix-admin-${Date.now()}@test.com`,
      id: crypto.randomUUID(),
      type: 'admin'  // КРИТИЧНО: Требуются admin права для Phoenix
    }, {
      targetPath: '/phoenix/users',
      skipNavigation: false,
      worldId,
      workerId
    })
    
    console.log('✅ Phoenix admin authentication completed')
  });

  test('should have a basic test with enhanced debugging', async ({ page }) => {
    console.log('🔍 Phoenix User Management: Starting basic test with enhanced debugging')
    
    // ДИАГНОСТИКА: Сначала проверим debug страницу на публичном домене
    console.log('🔍 Going to debug session page first...')
    await page.goto('http://localhost:3000/debug-session')
    await page.waitForTimeout(3000)
    
    // Создаем скриншот debug страницы
    await page.screenshot({ path: 'test-results/debug-session-screenshot.png', fullPage: true })
    console.log('📸 Debug session screenshot saved')
    
    // Переходим на Phoenix страницу
    console.log('🔍 Going to Phoenix users page...')
    await page.goto('/phoenix/users')
    await page.waitForTimeout(2000)
    
    // Enhanced debugging: проверяем текущую страницу
    const currentUrl = page.url()
    console.log(`📍 Current URL: ${currentUrl}`)
    
    // Проверяем наличие основных элементов с детальным логированием
    try {
      // Ожидаем заголовок страницы
      console.log('🔍 Looking for "User Management" heading...')
      await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible({ timeout: 10000 })
      console.log('✅ User Management heading found')
      
    } catch (error) {
      console.error('❌ User Management heading not found, debugging...')
      
      // Создаем скриншот для анализа
      await page.screenshot({ path: 'test-results/phoenix-debug-screenshot.png', fullPage: true })
      console.log('📸 Screenshot saved: test-results/phoenix-debug-screenshot.png')
      
      // Детальная диагностика
      const allHeadings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents()
      console.log('📋 All headings on page:', allHeadings)
      
      const pageText = await page.textContent('body')
      console.log(`📄 Page body text length: ${pageText?.length || 0} characters`)
      console.log(`📄 Page contains "User": ${pageText?.includes('User') || false}`)
      console.log(`📄 Page contains "Management": ${pageText?.includes('Management') || false}`)
      
      // Проверяем Phoenix навигацию
      const phoenixElements = await page.locator('[data-testid*="phoenix"], [class*="phoenix"]').count()
      console.log(`🔥 Phoenix elements found: ${phoenixElements}`)
      
      // Проверяем все доступные text elements для поиска паттернов
      const allText = await page.locator('*').filter({ hasText: /./ }).allTextContents()
      const uniqueTexts = [...new Set(allText)].filter(text => text.trim().length > 3).slice(0, 10)
      console.log('📝 Sample text elements:', uniqueTexts)
      
      throw error
    }
  });
});
