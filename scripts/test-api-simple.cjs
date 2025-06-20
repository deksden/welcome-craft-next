/**
 * @file scripts/test-api-simple.cjs
 * @description Простой тест API с использованием test-session cookie  
 * @version 1.0.0
 * @date 2025-06-20
 */

const { execSync } = require('node:child_process')

// Test session cookie (URL encoded JSON)
const testSession = encodeURIComponent(JSON.stringify({
  user: { id: 'debug-user-123', email: 'debug@test.com' },
  expires: '2025-06-21T15:00:00.000Z'
}))

console.log('🧪 Testing artifacts API with authentication...')

try {
  // Test with groupByVersions=true (default)
  console.log('\n📡 API Request: /api/artifacts?groupByVersions=true')
  const response = execSync(`curl -s "http://localhost:3000/api/artifacts?groupByVersions=true" -H "Cookie: test-session=${testSession}"`)
  const data = JSON.parse(response.toString())
  
  console.log('📊 Response:')
  console.log(`   Status: ${data.code ? 'ERROR' : 'SUCCESS'}`)
  
  if (data.code) {
    console.log(`   Error: ${data.message}`)
    console.log(`   Code: ${data.code}`)
  } else {
    console.log(`   Total artifacts: ${data.artifacts?.length || 0}`)
    console.log(`   Total count: ${data.totalCount || 0}`)
    console.log(`   Has more: ${data.hasMore}`)
    
    if (data.artifacts && data.artifacts.length > 0) {
      const ids = data.artifacts.map(a => a.artifactId || a.id)
      const uniqueIds = [...new Set(ids)]
      
      console.log(`   Unique artifact IDs: ${uniqueIds.length}`)
      console.log(`   Sample IDs: ${ids.slice(0, 3).join(', ')}`)
      
      if (ids.length !== uniqueIds.length) {
        console.log('   🚨 DUPLICATE IDs DETECTED!')
        console.log(`   🔍 Duplicates: ${ids.filter((id, index) => ids.indexOf(id) !== index)}`)
      } else {
        console.log('   ✅ No duplicate IDs (grouping works correctly)')
      }
    }
  }
  
} catch (error) {
  console.log('❌ Error:', error.message)
}

// END OF: scripts/test-api-simple.cjs