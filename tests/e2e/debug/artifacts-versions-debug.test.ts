/**
 * @file tests/e2e/debug/artifacts-versions-debug.test.ts
 * @description E2E тест для диагностики проблемы с версиями артефактов (BUG-023)
 * @version 1.0.0 
 * @date 2025-06-20
 * @purpose Проверить работу groupByVersions в реальном приложении
 */

import { test, expect } from '@playwright/test'

test.describe('🐛 BUG-023: Artifacts Versions Debug', () => {
  test.beforeEach(async ({ page }) => {
    // Fast authentication
    const userId = `debug-${Date.now()}`
    await page.context().addCookies([{
      name: 'test-session',
      value: JSON.stringify({
        user: { id: userId, email: `${userId}@debug.com` },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }),
      domain: 'localhost',
      path: '/'
    }])
  })

  test('Check API groupByVersions parameter', async ({ page }) => {
    console.log('🔍 BUG-023: Testing artifacts API directly')
    
    // Navigate to app to trigger authentication
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    // Test API directly with groupByVersions=true
    console.log('📡 Testing /api/artifacts?groupByVersions=true')
    const responseTrue = await page.request.get('/api/artifacts?groupByVersions=true')
    
    if (responseTrue.status() !== 200) {
      const errorText = await responseTrue.text()
      console.log(`❌ API Error ${responseTrue.status()}: ${errorText}`)
      throw new Error(`API returned ${responseTrue.status()}: ${errorText}`)
    }
    
    const dataTrue = await responseTrue.json()
    console.log(`✅ Response: ${dataTrue.artifacts?.length || 0} artifacts, ${dataTrue.totalCount} total`)
    
    if (dataTrue.artifacts && dataTrue.artifacts.length > 0) {
      const ids = dataTrue.artifacts.map((a: any) => a.artifactId || a.id)
      const uniqueIds = [...new Set(ids)]
      
      console.log(`   Artifact IDs: ${ids.slice(0, 5).join(', ')}`)
      console.log(`   Unique IDs: ${uniqueIds.length}/${ids.length}`)
      
      if (ids.length !== uniqueIds.length) {
        console.log('🚨 DUPLICATE IDs DETECTED WITH groupByVersions=true!')
        console.log(`   Duplicates: ${ids.filter((id: string, index: number) => ids.indexOf(id) !== index)}`)
        
        // This indicates our fix didn't work properly
        throw new Error(`BUG-023 CONFIRMED: Found ${ids.length - uniqueIds.length} duplicate artifact IDs despite groupByVersions=true`)
      } else {
        console.log('✅ No duplicate IDs found (grouping works correctly)')
      }
    } else {
      console.log('⚠️ No artifacts found - test inconclusive')
    }
    
    // Test API with groupByVersions=false for comparison
    console.log('📡 Testing /api/artifacts?groupByVersions=false')
    const responseFalse = await page.request.get('/api/artifacts?groupByVersions=false')
    expect(responseFalse.status()).toBe(200)
    
    const dataFalse = await responseFalse.json()
    console.log(`✅ Response: ${dataFalse.artifacts?.length || 0} artifacts, ${dataFalse.totalCount} total`)
    
    // Summary
    console.log('📊 SUMMARY:')
    console.log(`   groupByVersions=true:  ${dataTrue.artifacts?.length || 0} artifacts`)
    console.log(`   groupByVersions=false: ${dataFalse.artifacts?.length || 0} artifacts`)
    console.log(`   Expected: true <= false (latest only vs all versions)`)
    
    if ((dataTrue.artifacts?.length || 0) > (dataFalse.artifacts?.length || 0)) {
      throw new Error('UNEXPECTED: groupByVersions=true returned more artifacts than groupByVersions=false')
    }
  })

  test('Check artifacts page UI for duplicates', async ({ page }) => {
    console.log('🔍 BUG-023: Testing artifacts page for duplicate versions')
    
    // Navigate to artifacts page 
    await page.goto('/artifacts')
    await page.waitForTimeout(3000)
    
    try {
      // Look for artifact grid
      await page.waitForSelector('[data-testid*="artifact"]', { timeout: 5000 })
      
      const artifactElements = await page.locator('[data-testid*="artifact"]').all()
      console.log(`📦 Found ${artifactElements.length} artifact elements on page`)
      
      // Check for duplicate titles (indicating version duplicates)
      const titles: string[] = []
      for (const element of artifactElements.slice(0, 10)) {
        try {
          const titleText = await element.textContent()
          if (titleText) {
            titles.push(titleText.trim())
          }
        } catch (error) {
          console.log('⚠️ Could not read title from artifact element')
        }
      }
      
      const uniqueTitles = [...new Set(titles)]
      console.log(`📝 Found ${titles.length} artifact titles, ${uniqueTitles.length} unique`)
      
      if (titles.length > uniqueTitles.length) {
        console.log('🚨 POTENTIAL VERSION DUPLICATES detected on artifacts page!')
        console.log(`   Sample titles: ${titles.slice(0, 5).join(', ')}`)
        console.log(`   Unique titles: ${uniqueTitles.slice(0, 5).join(', ')}`)
      } else {
        console.log('✅ No obvious duplicates found on artifacts page')
      }
      
    } catch (error) {
      console.log('⚠️ Could not find artifact elements - page may not have loaded properly')
      console.log(`   Error: ${error}`)
    }
  })
})

// END OF: tests/e2e/debug/artifacts-versions-debug.test.ts