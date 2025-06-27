/**
 * @file tests/global-setup.ts
 * @description Глобальная настройка для Playwright с программным управлением БД.
 * @version 2.0.0
 * @date 2025-06-27
 */

import type { FullConfig } from '@playwright/test'
import { execSync } from 'child_process'
import { setupTestDatabase } from '../scripts/setup-test-db' // ✅ Программный импорт

async function globalSetup(config: FullConfig) {
  console.log('🚀 E2E Global Setup: Starting ephemeral test database...')
  
  // 1. Запускаем Docker контейнер
  console.log('   - Starting Docker container...')
  try {
    execSync('docker-compose up -d --wait', { stdio: 'inherit' })
    console.log('   - Docker container is up and running.')
  } catch (error) {
    console.error('❌ Failed to start Docker container. Ensure Docker is running.')
    throw error
  }
  
  // 2. Выполняем настройку БД программно
  console.log('   - Setting up test database (migrations & seeding)...')
  try {
    await setupTestDatabase() // ✅ Программный вызов
    console.log('   - Test database is ready.')
  } catch (error) {
    console.error('❌ Failed to set up test database. Cleaning up Docker...')
    execSync('docker-compose down', { stdio: 'inherit' })
    throw error
  }
  
  console.log('✅ Global Setup Complete: Test environment is ready.')
}

export default globalSetup