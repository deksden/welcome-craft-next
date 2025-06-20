#!/usr/bin/env node

/**
 * @file scripts/debug-artifacts-versions.js
 * @description Диагностический скрипт для проверки проблемы с дублированием версий в списке артефактов
 * @version 1.0.0
 * @date 2025-06-20
 */

/** HISTORY:
 * v1.0.0 (2025-06-20): Создан для диагностики BUG-022 - версии все еще показываются в списке артефактов
 */

console.log('🔍 Debugging artifacts versions...')

// Простой HTTP запрос к API для тестирования группировки версий
async function testArtifactsAPI() {
  try {
    // Тестируем без группировки
    console.log('\n📤 Testing API without grouping (groupByVersions=false):')
    const responseAll = await fetch('http://localhost:3000/api/artifacts?page=1&pageSize=5&groupByVersions=false')
    if (responseAll.ok) {
      const dataAll = await responseAll.json()
      console.log('Total artifacts (all versions):', dataAll.totalCount)
      console.log('Artifacts returned:', dataAll.data?.length || 0)
      console.log('Sample IDs:', dataAll.data?.slice(0, 3).map(a => ({ id: a.id, title: a.title })) || [])
    } else {
      console.log('❌ Request failed:', responseAll.status, responseAll.statusText)
    }

    // Тестируем с группировкой  
    console.log('\n📤 Testing API with grouping (groupByVersions=true):')
    const responseGrouped = await fetch('http://localhost:3000/api/artifacts?page=1&pageSize=5&groupByVersions=true')
    if (responseGrouped.ok) {
      const dataGrouped = await responseGrouped.json()
      console.log('Total artifacts (grouped):', dataGrouped.totalCount)
      console.log('Artifacts returned:', dataGrouped.data?.length || 0)
      console.log('Sample IDs:', dataGrouped.data?.slice(0, 3).map(a => ({ id: a.id, title: a.title })) || [])
    } else {
      console.log('❌ Request failed:', responseGrouped.status, responseGrouped.statusText)
    }

    console.log('\n✅ Diagnosis complete. Check if totalCount differs between grouped/ungrouped requests.')

  } catch (error) {
    console.error('❌ Network error:', error.message)
    console.log('💡 Make sure dev server is running: pnpm dev')
  }
}

testArtifactsAPI()

// END OF: scripts/debug-artifacts-versions.js