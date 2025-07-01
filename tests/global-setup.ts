/**
 * @file tests/global-setup.ts
 * @description Глобальная настройка для Playwright с программным управлением БД.
 * @version 3.0.0
 * @date 2025-06-30
 * @updated Убран teardown - БД остается работать, пользователь гасит вручную
 */

import type { FullConfig } from '@playwright/test'
import { execSync } from 'node:child_process'
import { setupTestDatabase } from '../scripts/setup-test-db' // ✅ Программный импорт

async function globalSetup(config: FullConfig) {
  console.log('🚀 E2E Global Setup: Preparing ephemeral test database...')
  console.log('   ℹ️  БД остается работать после тестов - ручная остановка: pnpm test:db:down')
  
  const startTime = Date.now()
  
  // 1. Проверяем и запускаем Docker контейнер (если нужно)
  console.log('   📦 Checking Docker container status...')
  
  let isContainerRunning = false
  try {
    // Проверяем, работает ли уже контейнер
    const output = execSync('docker ps --filter "name=welcomecraft_postgres_test" --format "table {{.Names}}"', { encoding: 'utf8' })
    isContainerRunning = output.includes('welcomecraft_postgres_test')
  } catch (error) {
    // Игнорируем ошибки проверки
  }
  
  if (isContainerRunning) {
    console.log('   ✅ Docker container already running - using existing')
  } else {
    console.log('   📦 Starting Docker container (PostgreSQL 16-alpine)...')
    try {
      execSync('docker-compose up -d --wait', { stdio: 'inherit' })
      const dockerTime = Date.now() - startTime
      console.log(`   ✅ Docker container started and healthy (${dockerTime}ms)`)
    } catch (error) {
      console.error('❌ Failed to start Docker container. Ensure Docker is running.')
      console.error('   💡 Try: docker --version && docker-compose --version')
      throw error
    }
  }
  
  // 2. Выполняем настройку БД программно (всегда, даже если контейнер уже был запущен)
  console.log('   🗄️  Setting up test database (migrations & fresh schema)...')
  console.log('       - Connecting to postgresql://testuser:***@localhost:5433/testdb')
  
  const dbStartTime = Date.now()
  
  try {
    await setupTestDatabase() // ✅ Программный вызов - всегда подготавливает свежую схему
    const dbTime = Date.now() - dbStartTime
    console.log(`   ✅ Test database is ready (${dbTime}ms)`)
    console.log('       - Schema migrations applied')
    console.log('       - Ready for test execution')
  } catch (error) {
    console.error('❌ Failed to set up test database.')
    console.error('   💡 Manual cleanup: pnpm test:db:down')
    throw error
  }
  
  const totalTime = Date.now() - startTime
  console.log(`✅ Global Setup Complete: Test environment ready in ${totalTime}ms`)
  console.log('   🎯 Ephemeral PostgreSQL database running in tmpfs (memory-only)')
  console.log('   ℹ️  To stop manually: pnpm test:db:down')
}

export default globalSetup