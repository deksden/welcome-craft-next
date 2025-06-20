/**
 * @file scripts/test-groupby-versions.js  
 * @description Скрипт для тестирования groupByVersions функциональности в реальном API
 * @version 1.0.0
 * @date 2025-06-20
 * @purpose Диагностика BUG-023 - проверить реальное поведение API с группировкой версий
 */

const { execSync } = require('node:child_process')

async function testGroupByVersions() {
  try {
    console.log('🔍 Testing groupByVersions functionality...')
    
    // Test 1: groupByVersions=true (default)
    console.log('\n1️⃣ Testing groupByVersions=true (default):')
    const responseTrueBuffer = execSync(`curl -s "http://localhost:3000/api/artifacts?groupByVersions=true" -H "Cookie: test-session=%7B%22user%22%3A%7B%22id%22%3A%22test-user-debug%22%2C%22email%22%3A%22debug%40test.com%22%7D%2C%22expires%22%3A%222025-06-21T13%3A00%3A00.000Z%22%7D"`)
    const responseTrue = JSON.parse(responseTrueBuffer.toString())
    
    if (responseTrue.artifacts) {
      const ids = responseTrue.artifacts.map(a => a.artifactId || a.id)
      const uniqueIds = [...new Set(ids)]
      
      console.log(`   Total artifacts: ${responseTrue.artifacts.length}`)
      console.log(`   Unique IDs: ${uniqueIds.length}`)
      console.log(`   IDs: ${ids.slice(0, 5).join(', ')}${ids.length > 5 ? '...' : ''}`)
      
      if (ids.length !== uniqueIds.length) {
        console.log('   🚨 PROBLEM: Duplicate IDs found despite groupByVersions=true')
        console.log(`   🔍 Duplicates: ${JSON.stringify(ids.filter((id, index) => ids.indexOf(id) !== index))}`)
      } else {
        console.log('   ✅ SUCCESS: No duplicate IDs found')
      }
    } else {
      console.log(`   ❌ API Error: ${responseTrue.message || 'Unknown error'}`)
    }
    
    // Test 2: groupByVersions=false  
    console.log('\n2️⃣ Testing groupByVersions=false:')
    const responseFalseBuffer = execSync(`curl -s "http://localhost:3000/api/artifacts?groupByVersions=false" -H "Cookie: test-session=%7B%22user%22%3A%7B%22id%22%3A%22test-user-debug%22%2C%22email%22%3A%22debug%40test.com%22%7D%2C%22expires%22%3A%222025-06-21T13%3A00%3A00.000Z%22%7D"`)
    const responseFalse = JSON.parse(responseFalseBuffer.toString())
    
    if (responseFalse.artifacts) {
      const ids = responseFalse.artifacts.map(a => a.artifactId || a.id)
      const uniqueIds = [...new Set(ids)]
      
      console.log(`   Total artifacts: ${responseFalse.artifacts.length}`)
      console.log(`   Unique IDs: ${uniqueIds.length}`)
      console.log(`   IDs: ${ids.slice(0, 5).join(', ')}${ids.length > 5 ? '...' : ''}`)
      
      console.log('   📊 Expected: Should show more total artifacts than unique IDs (all versions)')
    } else {
      console.log(`   ❌ API Error: ${responseFalse.message || 'Unknown error'}`)
    }
    
    console.log('\n📋 Summary:')
    console.log(`   - groupByVersions=true should return only latest versions (unique IDs)`)
    console.log(`   - groupByVersions=false should return all versions (potentially duplicate IDs)`)
    
  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      console.log('❌ Error: Development server not running. Please start with "pnpm dev"')
    } else {
      console.log('❌ Error:', error.message)
    }
  }
}

testGroupByVersions()

// END OF: scripts/test-groupby-versions.js