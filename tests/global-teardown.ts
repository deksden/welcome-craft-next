/**
 * @file tests/global-teardown.ts
 * @description Глобальная очистка для Playwright - останавливает эфемерную БД.
 * @version 1.1.0
 * @date 2025-06-27
 * @updated Добавлено подробное логирование и измерение времени очистки
 */

import { execSync } from 'node:child_process'

async function globalTeardown() {
  console.log('🧹 E2E Global Teardown: Cleaning up ephemeral test database...')
  console.log('   📦 Stopping PostgreSQL container...')
  
  const startTime = Date.now()
  
  try {
    execSync('docker-compose down', { stdio: 'inherit' })
    const teardownTime = Date.now() - startTime
    console.log(`✅ Global Teardown Complete: Docker containers stopped and removed (${teardownTime}ms)`)
    console.log('   🗑️  Ephemeral data destroyed (tmpfs cleaned up)')
    console.log('   💾 No persistent data remains on disk')
  } catch (error) {
    console.error('⚠️ Warning: Failed to stop Docker containers (they may already be stopped)')
    console.error('   💡 Manual cleanup: docker-compose down')
  }
}

export default globalTeardown