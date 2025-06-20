/**
 * @file scripts/curl-api-test.cjs
 * @description Тест API через curl
 * @version 1.0.0
 * @date 2025-06-20
 */

const { spawn, execSync } = require('node:child_process')

async function curlTest() {
  console.log('🚀 Starting dev server for curl test...')
  
  const server = spawn('pnpm', ['dev'], { 
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: '3004' }
  })
  
  let tested = false
  
  server.stdout.on('data', (data) => {
    const output = data.toString()
    if ((output.includes('Ready in') || output.includes('✓ Ready')) && !tested) {
      tested = true
      console.log('✅ Server ready, testing API with curl...')
      
      setTimeout(() => {
        try {
          testWithCurl()
        } catch (error) {
          console.log(`❌ Curl test failed: ${error.message}`)
        } finally {
          server.kill()
          process.exit(0)
        }
      }, 2000)
    }
  })
  
  // Timeout fallback
  setTimeout(() => {
    if (!tested) {
      tested = true
      console.log('⏰ Timeout reached, testing anyway...')
      try {
        testWithCurl()
      } catch (error) {
        console.log(`❌ Curl test failed: ${error.message}`)
      } finally {
        server.kill()
        process.exit(0)
      }
    }
  }, 15000)
  
  function testWithCurl() {
    const testSession = JSON.stringify({
      user: { id: 'debug-user-123', email: 'debug@test.com' },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
    
    const cookie = `test-session=${encodeURIComponent(testSession)}`
    
    console.log('📡 Testing /api/artifacts?groupByVersions=true')
    
    try {
      const result = execSync(`curl -s "http://localhost:3004/api/artifacts?groupByVersions=true" -H "Cookie: ${cookie}"`, {
        encoding: 'utf8',
        timeout: 10000
      })
      
      console.log('📊 Raw Response:')
      console.log(result.substring(0, 200) + (result.length > 200 ? '...' : ''))
      
      try {
        const data = JSON.parse(result)
        
        if (data.artifacts) {
          console.log(`✅ SUCCESS: ${data.artifacts.length} artifacts returned`)
          console.log(`📊 Total count: ${data.totalCount}`)
          
          if (data.artifacts.length > 0) {
            const ids = data.artifacts.map(a => a.artifactId || a.id)
            const uniqueIds = [...new Set(ids)]
            
            console.log(`🔍 Unique IDs: ${uniqueIds.length}/${ids.length}`)
            console.log(`📝 Sample IDs: ${ids.slice(0, 3).join(', ')}`)
            
            if (ids.length === uniqueIds.length) {
              console.log('🎉 BUG-023 FIXED: No duplicate IDs found!')
            } else {
              console.log('🚨 BUG-023 PERSISTS: Duplicate IDs found')
              console.log(`   Duplicates: ${ids.filter((id, i) => ids.indexOf(id) !== i)}`)
            }
          }
        } else if (data.code) {
          console.log(`❌ API Error: ${data.message} (${data.code})`)
        }
      } catch (parseError) {
        console.log('❌ Failed to parse JSON response')
      }
      
    } catch (error) {
      console.log(`❌ Curl failed: ${error.message}`)
    }
  }
}

curlTest()

// END OF: scripts/curl-api-test.cjs