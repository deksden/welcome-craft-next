/**
 * @file scripts/setup-test-db.ts
 * @description Скрипт для настройки эфемерной тестовой БД: миграции + сидинг.
 * @version 2.1.0
 * @date 2025-06-27
 * @updated Добавлено детальное логирование по фазам для лучшего понимания процесса инициализации.
 */

import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
// import { seedEngine } from '../tests/helpers/seed-engine' // Временно отключен из-за server-only импортов
import { createLogger } from '@fab33/fab-logger'
import path from 'node:path'

const logger = createLogger('scripts:setup-test-db')

// ✅ Экспортируем функцию main для вызова из global-setup
export async function setupTestDatabase() {
  logger.info('🚀 Starting ephemeral test database setup...')
  logger.info('   📋 Phase 1: Environment configuration')
  const startTime = Date.now()

  // 1. Загружаем переменные из .env.test
  const envPath = path.resolve(process.cwd(), '.env.test')
  logger.info(`   📄 Loading environment from: ${envPath}`)
  config({ path: envPath })

  const postgresUrl = process.env.POSTGRES_URL
  if (!postgresUrl) {
    throw new Error('POSTGRES_URL is not defined in .env.test')
  }

  logger.info(`   🔗 Connecting to test database at: ${postgresUrl.split('@')[1]}`)
  logger.info('   📋 Phase 2: Database connection')

  const connection = postgres(postgresUrl, { max: 1 })
  const db = drizzle(connection)

  try {
    // 2. Выполняем миграции
    logger.info('   📋 Phase 3: Schema migrations')
    logger.info('   ⏳ Running Drizzle migrations...')
    logger.info('      - Checking migration files in ./lib/db/migrations/')
    const migrationStart = Date.now()
    await migrate(db, { migrationsFolder: './lib/db/migrations' })
    logger.info(`   ✅ Migrations completed in ${Date.now() - migrationStart}ms`)
    logger.info('      - All database tables created successfully')

    // 3. Выполняем сидинг (временно отключен)
    logger.info('   📋 Phase 4: Test data seeding')
    logger.info('   🌱 Preparing test worlds (DEFERRED)...')
    const seedStart = Date.now()
    // await seedEngine.seedWorld('SITE_READY_FOR_PUBLICATION')
    // await seedEngine.seedWorld('ENTERPRISE_ONBOARDING')
    // await seedEngine.seedWorld('CONTENT_LIBRARY_BASE')
    logger.info(`   ⏭️  Seeding deferred (${Date.now() - seedStart}ms) - will be handled by individual tests`)
    logger.info('      - World data will be created on-demand during test execution')

  } catch (error) {
    logger.error('❌ Database setup failed', { error })
    throw error
  } finally {
    logger.info('   📋 Phase 5: Connection cleanup')
    await connection.end()
    logger.info('   🔌 Database connection closed gracefully')
  }

  logger.info(`🎉 Ephemeral test database setup complete in ${Date.now() - startTime}ms`)
  logger.info('   💫 Ready for Playwright test execution')
}

// ✅ Позволяет запускать скрипт напрямую через `tsx`
if (import.meta.url === `file://${process.argv[1]}`) {
  setupTestDatabase().catch((err) => {
    console.error('Fatal error during test DB setup:', err)
    process.exit(1)
  })
}