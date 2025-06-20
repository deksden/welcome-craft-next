/**
 * @file scripts/quick-api-test.cjs
 * @description Быстрый тест API без полноценного E2E теста
 * @version 1.0.0
 * @date 2025-06-20
 */

const { spawn } = require('node:child_process')

async function quickTest() {
  console.log('🚀 Starting quick dev server for API test...')
  
  // Start dev server
  const server = spawn('pnpm', ['dev'], { 
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: '3003' }
  })
  
  let serverReady = false
  
  server.stdout.on('data', (data) => {
    const output = data.toString()
    if (output.includes('Ready in') || output.includes('✓ Ready')) {
      serverReady = true
      console.log('✅ Server ready, testing API...')
      testAPI()
    }
  })
  
  server.stderr.on('data', (data) => {
    // Ignore stderr for now
  })
  
  // Wait for server to start
  setTimeout(() => {
    if (!serverReady) {
      console.log('⏰ Server taking too long, testing anyway...')
      testAPI()
    }
  }, 10000)
  
  async function testAPI() {
    try {
      // Import fetch
      const fetch = (await import('node-fetch')).default
      
      // Test session cookie
      const testSession = JSON.stringify({
        user: { id: 'debug-user-123', email: 'debug@test.com' },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      
      console.log('📡 Testing /api/artifacts?groupByVersions=true')
      
      const response = await fetch('http://localhost:3003/api/artifacts?groupByVersions=true', {
        headers: {
          'Cookie': `test-session=${encodeURIComponent(testSession)}`
        }
      })
      
      console.log(`📊 Response Status: ${response.status}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ SUCCESS: ${data.artifacts?.length || 0} artifacts returned`)
        console.log(`📊 Total count: ${data.totalCount}`)
        
        if (data.artifacts && data.artifacts.length > 0) {
          const ids = data.artifacts.map(a => a.artifactId || a.id)
          const uniqueIds = [...new Set(ids)]
          
          console.log(`🔍 Unique IDs: ${uniqueIds.length}/${ids.length}`)
          
          if (ids.length === uniqueIds.length) {
            console.log('🎉 BUG-023 FIXED: No duplicate IDs found!')
          } else {
            console.log('🚨 BUG-023 PERSISTS: Duplicate IDs found')
            console.log(`   Duplicates: ${ids.filter((id, i) => ids.indexOf(id) !== i)}`)
          }
        }
      } else {
        const errorText = await response.text()
        console.log(`❌ API Error: ${errorText}`)
      }
      
    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`)
    } finally {
      console.log('🛑 Stopping server...')
      server.kill()
      process.exit(0)
    }
  }
}

quickTest()

// END OF: scripts/quick-api-test.cjs