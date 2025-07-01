/**
 * @file tests/global-teardown.ts
 * @description Глобальная очистка для Playwright - останавливает эфемерную БД и очищает test worlds.
 * @version 2.0.0
 * @date 2025-07-01
 * @updated WORLD ISOLATION SUPPORT: Добавлена очистка test worlds после параллельного выполнения
 */

import { execSync } from 'node:child_process'
import { TestWorldAllocator } from './helpers/test-world-allocator'

async function globalTeardown() {
  console.log('🧹 E2E Global Teardown: Starting comprehensive cleanup...')
  
  const startTime = Date.now()
  
  // ШАГ 1: Очистка Test Worlds
  try {
    console.log('🌍 Step 1: Cleaning up test worlds...')
    
    const allocator = TestWorldAllocator.getInstance()
    const stats = allocator.getAllocationStats()
    
    if (stats.totalWorkers > 0) {
      console.log(`📊 World Stats: ${stats.totalWorkers} workers, ${stats.activeWorlds} active worlds, ${stats.totalTests} total tests`)
      await allocator.cleanupAllWorlds()
      console.log('✅ Test worlds cleaned up successfully')
    } else {
      console.log('📊 No test worlds to clean up')
    }
    
  } catch (error) {
    console.warn('⚠️ Warning: Test world cleanup failed:', error)
  }
  
  // ШАГ 2: Остановка эфемерной БД (существующая логика)
  try {
    console.log('📦 Step 2: Stopping PostgreSQL container...')
    
    execSync('docker-compose down', { stdio: 'inherit' })
    const teardownTime = Date.now() - startTime
    console.log(`✅ Global Teardown Complete: All resources cleaned up (${teardownTime}ms)`)
    console.log('   🌍 Test worlds cleaned up')
    console.log('   🗑️  Ephemeral data destroyed (tmpfs cleaned up)')
    console.log('   💾 No persistent data remains on disk')
  } catch (error) {
    console.error('⚠️ Warning: Failed to stop Docker containers (they may already be stopped)')
    console.error('   💡 Manual cleanup: docker-compose down')
  }
}

export default globalTeardown