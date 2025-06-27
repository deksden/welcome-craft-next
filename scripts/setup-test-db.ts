/**
 * @file scripts/setup-test-db.ts
 * @description Скрипт для настройки эфемерной тестовой БД: миграции + сидинг.
 * @version 2.0.0
 * @date 2025-06-27
 * @updated Рефакторинг: экспорт функции main, удаление process.exit() для модульного использования.
 */

import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { seedEngine } from '../tests/helpers/seed-engine'
import { createLogger } from '@fab33/fab-logger'
import path from 'path'

const logger = createLogger('scripts:setup-test-db')

// ✅ Экспортируем функцию main для вызова из global-setup
export async function setupTestDatabase() {
  logger.info('🚀 Starting ephemeral test database setup...')
  const startTime = Date.now()

  // 1. Загружаем переменные из .env.test
  const envPath = path.resolve(process.cwd(), '.env.test')
  config({ path: envPath })

  const postgresUrl = process.env.POSTGRES_URL
  if (!postgresUrl) {
    throw new Error('POSTGRES_URL is not defined in .env.test')
  }

  logger.info(`Connecting to test database at: ${postgresUrl.split('@')[1]}`)

  const connection = postgres(postgresUrl, { max: 1 })
  const db = drizzle(connection)

  try {
    // 2. Выполняем миграции
    logger.info('⏳ Running migrations...')
    const migrationStart = Date.now()
    await migrate(db, { migrationsFolder: './lib/db/migrations' })
    logger.info(`✅ Migrations completed in ${Date.now() - migrationStart}ms`)

    // 3. Выполняем сидинг
    logger.info('🌱 Seeding database with test worlds...')
    const seedStart = Date.now()
    await seedEngine.seedWorld('SITE_READY_FOR_PUBLICATION')
    await seedEngine.seedWorld('ENTERPRISE_ONBOARDING')
    await seedEngine.seedWorld('CONTENT_LIBRARY_BASE')
    logger.info(`✅ Seeding completed in ${Date.now() - seedStart}ms`)

  } catch (error) {
    logger.error('❌ Database setup failed', { error })
    throw error
  } finally {
    await connection.end()
    logger.info('Database connection closed.')
  }

  logger.info(`🎉 Ephemeral test database setup complete in ${Date.now() - startTime}ms`)
}

// ✅ Позволяет запускать скрипт напрямую через `tsx`
if (require.main === module) {
  setupTestDatabase().catch((err) => {
    logger.fatal('Fatal error during test DB setup:', err)
    process.exit(1)
  })
}