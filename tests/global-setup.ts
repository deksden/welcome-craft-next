/**
 * @file tests/global-setup.ts
 * @description Глобальная настройка для Playwright с программным управлением БД.
 * @version 2.1.0
 * @date 2025-06-27
 * @updated Добавлено подробное логирование для лучшего UX при инициализации
 */

import type { FullConfig } from '@playwright/test'
import { execSync } from 'node:child_process'
import { setupTestDatabase } from '../scripts/setup-test-db' // ✅ Программный импорт

async function globalSetup(config: FullConfig) {
  console.log('🚀 E2E Global Setup: Starting ephemeral test database...')
  console.log('   ⏱️  This may take 30-60 seconds for initial Docker image download...')
  
  // 1. Запускаем Docker контейнер
  console.log('   📦 Starting Docker container (PostgreSQL 16-alpine)...')
  console.log('       - Checking if image exists locally...')
  
  const startTime = Date.now()
  
  try {
    execSync('docker-compose up -d --wait', { stdio: 'inherit' })
    const dockerTime = Date.now() - startTime
    console.log(`   ✅ Docker container is up and healthy (${dockerTime}ms)`)
    console.log('       - PostgreSQL server ready on port 5433')
    console.log('       - Health checks passed')
  } catch (error) {
    console.error('❌ Failed to start Docker container. Ensure Docker is running.')
    console.error('   💡 Try: docker --version && docker-compose --version')
    throw error
  }
  
  // 2. Выполняем настройку БД программно
  console.log('   🗄️  Setting up test database (migrations & seeding)...')
  console.log('       - Connecting to postgresql://testuser:***@localhost:5433/testdb')
  
  const dbStartTime = Date.now()
  
  try {
    await setupTestDatabase() // ✅ Программный вызов
    const dbTime = Date.now() - dbStartTime
    console.log(`   ✅ Test database is ready (${dbTime}ms)`)
    console.log('       - Schema migrations applied')
    console.log('       - Ready for test execution')
  } catch (error) {
    console.error('❌ Failed to set up test database. Cleaning up Docker...')
    execSync('docker-compose down', { stdio: 'inherit' })
    throw error
  }
  
  const totalTime = Date.now() - startTime
  console.log(`✅ Global Setup Complete: Test environment ready in ${totalTime}ms`)
  console.log('   🎯 Ephemeral PostgreSQL database running in tmpfs (memory-only)')
}

export default globalSetup