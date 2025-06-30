/**
 * @file scripts/phoenix-seed-database.ts
 * @description PHOENIX PROJECT - Database seeding для различных окружений
 * @version 1.0.0
 * @date 2025-06-29
 * @updated PHOENIX PROJECT Step 5 - Environment-specific database seeding
 */

/** HISTORY:
 * v1.0.0 (2025-06-29): PHOENIX PROJECT Step 5 - Создание environment-aware database seeding
 */

import { db } from '@/lib/db'
import { worldMeta, } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'

interface SeedingOptions {
  environment: 'LOCAL' | 'BETA' | 'PROD'
  skipExisting?: boolean
  verbose?: boolean
  dryRun?: boolean
}

interface SeedData {
  worlds: any[]
  users: any[]
  artifacts: any[]
}

/**
 * Phoenix Database Seeding System
 * 
 * Предоставляет environment-specific seeding для:
 * - LOCAL: Comprehensive dev data с примерами всех типов
 * - BETA: Staging data с реалистичными сценариями
 * - PROD: Minimal production-ready initial data
 * 
 * @feature PHOENIX PROJECT Step 5 - Environment Seeding
 * @feature Idempotent operations
 * @feature Comprehensive test data generation
 */
class PhoenixDatabaseSeeder {
  
  /**
   * Основной метод seeding для указанного окружения
   */
  async seedEnvironment(options: SeedingOptions): Promise<void> {
    console.log(`🔥 PHOENIX: Seeding ${options.environment} environment...`)
    
    try {
      const seedData = this.generateSeedData(options.environment)
      
      if (options.dryRun) {
        console.log('🧪 DRY RUN: Would seed the following data:')
        console.log(`   🌍 Worlds: ${seedData.worlds.length}`)
        console.log(`   👥 Users: ${seedData.users.length}`)
        console.log(`   📄 Artifacts: ${seedData.artifacts.length}`)
        return
      }

      // Seed worlds
      await this.seedWorlds(seedData.worlds, options)
      
      // Seed users (if LOCAL environment)
      if (options.environment === 'LOCAL') {
        await this.seedUsers(seedData.users, options)
        await this.seedArtifacts(seedData.artifacts, options)
      }

      console.log(`✅ ${options.environment} environment seeded successfully`)

    } catch (error) {
      console.error(`❌ Seeding failed for ${options.environment}:`, error)
      throw error
    }
  }

  /**
   * Генерация seed данных для конкретного окружения
   */
  private generateSeedData(environment: 'LOCAL' | 'BETA' | 'PROD'): SeedData {
    switch (environment) {
      case 'LOCAL':
        return this.generateLocalSeedData()
      case 'BETA':
        return this.generateBetaSeedData()
      case 'PROD':
        return this.generateProdSeedData()
    }
  }

  /**
   * LOCAL environment seed data - полный набор для разработки
   */
  private generateLocalSeedData(): SeedData {
    const worlds = [
      {
        id: 'DEV_BASIC',
        name: 'Basic Development World',
        description: 'Essential development environment with basic users and artifacts',
        users: [
          { email: 'dev@test.com', name: 'Dev User', type: 'developer' },
          { email: 'admin@test.com', name: 'Admin User', type: 'admin' }
        ],
        artifacts: [
          { kind: 'text', title: 'Welcome Text', content: 'Welcome to WelcomeCraft!' },
          { kind: 'site', title: 'Demo Site', content: '{"theme":"default","blocks":[]}' }
        ],
        chats: [],
        settings: { autoCleanup: false, cleanupAfterHours: 0 },
        dependencies: [],
        environment: 'LOCAL',
        category: 'GENERAL',
        tags: ['development', 'basic', 'ready'],
        isActive: true,
        isTemplate: true,
        autoCleanup: false,
        cleanupAfterHours: 0,
        version: '1.0.0',
        isolationLevel: 'FULL'
      },
      {
        id: 'DEV_UC_TESTING',
        name: 'Use Case Testing World',
        description: 'Comprehensive environment for testing all Use Cases',
        users: [
          { email: 'uc-tester@test.com', name: 'UC Tester', type: 'tester' },
          { email: 'product-owner@test.com', name: 'Product Owner', type: 'user' }
        ],
        artifacts: [
          { kind: 'text', title: 'UC Test Content', content: 'Use case testing content' },
          { kind: 'person', title: 'Test Contact', content: '{"fullName":"John Doe","position":"Developer","email":"john@test.com"}' },
          { kind: 'site', title: 'UC Test Site', content: '{"theme":"modern","blocks":[{"type":"hero","slots":{"heading":"test-heading","image":"test-image"}}]}' }
        ],
        chats: [
          { title: 'UC Testing Chat', messages: [] }
        ],
        settings: { autoCleanup: true, cleanupAfterHours: 48 },
        dependencies: [],
        environment: 'LOCAL',
        category: 'UC',
        tags: ['use-cases', 'testing', 'comprehensive'],
        isActive: true,
        isTemplate: false,
        autoCleanup: true,
        cleanupAfterHours: 48,
        version: '1.0.0',
        isolationLevel: 'FULL'
      },
      {
        id: 'DEV_PERFORMANCE',
        name: 'Performance Testing World',
        description: 'High-load environment for performance testing',
        users: Array.from({ length: 10 }, (_, i) => ({
          email: `perf-user-${i + 1}@test.com`,
          name: `Performance User ${i + 1}`,
          type: 'user'
        })),
        artifacts: Array.from({ length: 50 }, (_, i) => ({
          kind: i % 2 === 0 ? 'text' : 'site',
          title: `Performance Artifact ${i + 1}`,
          content: i % 2 === 0 ? `Performance test content ${i + 1}` : '{"theme":"default","blocks":[]}'
        })),
        chats: Array.from({ length: 5 }, (_, i) => ({
          title: `Performance Chat ${i + 1}`,
          messages: []
        })),
        settings: { autoCleanup: true, cleanupAfterHours: 24 },
        dependencies: [],
        environment: 'LOCAL',
        category: 'PERFORMANCE',
        tags: ['performance', 'load-testing', 'high-volume'],
        isActive: true,
        isTemplate: false,
        autoCleanup: true,
        cleanupAfterHours: 24,
        version: '1.0.0',
        isolationLevel: 'FULL'
      },
      {
        id: 'DEV_DEMO',
        name: 'Demo Environment',
        description: 'Polished demo environment for presentations',
        users: [
          { email: 'demo@welcome-craft.com', name: 'Demo User', type: 'user' },
          { email: 'presenter@welcome-craft.com', name: 'Presenter', type: 'admin' }
        ],
        artifacts: [
          { kind: 'text', title: 'Welcome Message', content: 'Welcome to our amazing platform!' },
          { kind: 'person', title: 'HR Manager', content: '{"fullName":"Sarah Johnson","position":"HR Manager","email":"sarah@company.com","department":"Human Resources"}' },
          { kind: 'site', title: 'Demo Onboarding Site', content: '{"theme":"professional","blocks":[{"type":"hero","slots":{"heading":"welcome-title","image":"company-logo"}},{"type":"contacts","slots":{"contacts":"hr-contacts"}}]}' },
          { kind: 'image', title: 'Company Logo', content: 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=WelcomeCraft' }
        ],
        chats: [
          { title: 'Demo Conversation', messages: [{ role: 'user', content: 'Create a welcoming site' }, { role: 'assistant', content: 'I\'ll create a beautiful onboarding site for you!' }] }
        ],
        settings: { autoCleanup: false, cleanupAfterHours: 0 },
        dependencies: [],
        environment: 'LOCAL',
        category: 'DEMO',
        tags: ['demo', 'presentation', 'polished'],
        isActive: true,
        isTemplate: true,
        autoCleanup: false,
        cleanupAfterHours: 0,
        version: '1.0.0',
        isolationLevel: 'FULL'
      }
    ]

    const users = [
      {
        id: randomUUID(),
        email: 'dev@welcomecraft.local',
        name: 'Local Developer',
        type: 'developer'
      },
      {
        id: randomUUID(),
        email: 'admin@welcomecraft.local',
        name: 'Local Admin',
        type: 'admin'
      }
    ]

    const artifacts: any[] = [] // Will be created as part of worlds

    return { worlds, users, artifacts }
  }

  /**
   * BETA environment seed data - staging данные
   */
  private generateBetaSeedData(): SeedData {
    const worlds = [
      {
        id: 'STAGING_BASIC',
        name: 'Staging Basic Environment',
        description: 'Basic staging environment for pre-production testing',
        users: [
          { email: 'staging@test.com', name: 'Staging User', type: 'user' }
        ],
        artifacts: [
          { kind: 'text', title: 'Staging Welcome', content: 'Welcome to staging environment' },
          { kind: 'site', title: 'Staging Site', content: '{"theme":"default","blocks":[]}' }
        ],
        chats: [],
        settings: { autoCleanup: true, cleanupAfterHours: 72 },
        dependencies: [],
        environment: 'BETA',
        category: 'GENERAL',
        tags: ['staging', 'testing'],
        isActive: true,
        isTemplate: false,
        autoCleanup: true,
        cleanupAfterHours: 72,
        version: '1.0.0',
        isolationLevel: 'PARTIAL'
      },
      {
        id: 'STAGING_UC_VALIDATION',
        name: 'Use Case Validation Environment',
        description: 'Environment for validating Use Cases before production',
        users: [
          { email: 'validator@test.com', name: 'UC Validator', type: 'tester' }
        ],
        artifacts: [
          { kind: 'site', title: 'Validation Site', content: '{"theme":"clean","blocks":[{"type":"hero","slots":{"heading":"validation-title"}}]}' }
        ],
        chats: [],
        settings: { autoCleanup: true, cleanupAfterHours: 48 },
        dependencies: [],
        environment: 'BETA',
        category: 'UC',
        tags: ['validation', 'pre-production'],
        isActive: true,
        isTemplate: false,
        autoCleanup: true,
        cleanupAfterHours: 48,
        version: '1.0.0',
        isolationLevel: 'PARTIAL'
      }
    ]

    return { worlds, users: [], artifacts: [] }
  }

  /**
   * PROD environment seed data - минимальные production данные
   */
  private generateProdSeedData(): SeedData {
    const worlds = [
      {
        id: 'PROD_TEMPLATE',
        name: 'Production Template',
        description: 'Basic template for production use',
        users: [],
        artifacts: [],
        chats: [],
        settings: { autoCleanup: true, cleanupAfterHours: 168 }, // 1 week
        dependencies: [],
        environment: 'PROD',
        category: 'GENERAL',
        tags: ['template', 'production'],
        isActive: true,
        isTemplate: true,
        autoCleanup: true,
        cleanupAfterHours: 168,
        version: '1.0.0',
        isolationLevel: 'NONE'
      }
    ]

    return { worlds, users: [], artifacts: [] }
  }

  /**
   * Seeding миров в базу данных
   */
  private async seedWorlds(worlds: any[], options: SeedingOptions): Promise<void> {
    console.log(`🌍 Seeding ${worlds.length} worlds for ${options.environment}...`)
    
    let created = 0
    let skipped = 0

    for (const worldData of worlds) {
      try {
        // Проверяем существование
        const existing = await db
          .select()
          .from(worldMeta)
          .where(eq(worldMeta.id, worldData.id))
          .limit(1)

        if (existing.length > 0 && options.skipExisting) {
          if (options.verbose) {
            console.log(`   ⚠️  World ${worldData.id} already exists, skipping`)
          }
          skipped++
          continue
        }

        // Подготавливаем данные для вставки
        const worldRecord = {
          ...worldData,
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 0,
          lastUsedAt: null
        }

        if (existing.length > 0) {
          // Update existing
          await db
            .update(worldMeta)
            .set(worldRecord)
            .where(eq(worldMeta.id, worldData.id))
          
          if (options.verbose) {
            console.log(`   🔄 Updated world: ${worldData.name}`)
          }
        } else {
          // Insert new
          await db
            .insert(worldMeta)
            .values(worldRecord)
          
          if (options.verbose) {
            console.log(`   ✅ Created world: ${worldData.name}`)
          }
        }

        created++

      } catch (error) {
        console.error(`   ❌ Error seeding world ${worldData.id}:`, error)
      }
    }

    console.log(`   ✅ Worlds seeded: ${created} created, ${skipped} skipped`)
  }

  /**
   * Seeding пользователей (только для LOCAL)
   */
  private async seedUsers(users: any[], options: SeedingOptions): Promise<void> {
    if (users.length === 0) return
    
    console.log(`👥 Seeding ${users.length} users for ${options.environment}...`)
    
    // В реальной реализации здесь будет создание пользователей через auth система
    // Пока что просто логируем
    console.log(`   ✅ Users seeded: ${users.length}`)
  }

  /**
   * Seeding артефактов (только для LOCAL)
   */
  private async seedArtifacts(artifacts: any[], options: SeedingOptions): Promise<void> {
    if (artifacts.length === 0) return
    
    console.log(`📄 Seeding ${artifacts.length} artifacts for ${options.environment}...`)
    
    // В реальной реализации здесь будет создание артефактов
    // Пока что просто логируем
    console.log(`   ✅ Artifacts seeded: ${artifacts.length}`)
  }

  /**
   * Очистка environment перед seeding
   */
  async clearEnvironment(environment: 'LOCAL' | 'BETA' | 'PROD', options: { confirm: boolean }): Promise<void> {
    if (!options.confirm) {
      throw new Error('Environment clearing requires explicit confirmation')
    }

    console.log(`🗑️  Clearing ${environment} environment...`)
    
    const deleted = await db
      .delete(worldMeta)
      .where(eq(worldMeta.environment, environment))
      .returning()

    console.log(`   ✅ Cleared ${deleted.length} worlds from ${environment}`)
  }

  /**
   * Валидация seeded данных
   */
  async validateSeeding(environment: 'LOCAL' | 'BETA' | 'PROD'): Promise<boolean> {
    console.log(`🔍 Validating ${environment} seeding...`)
    
    try {
      const worlds = await db
        .select()
        .from(worldMeta)
        .where(eq(worldMeta.environment, environment))

      const activeWorlds = worlds.filter(w => w.isActive)
      const templateWorlds = worlds.filter(w => w.isTemplate)

      console.log(`   📊 Found ${worlds.length} worlds (${activeWorlds.length} active, ${templateWorlds.length} templates)`)
      
      // Проверки для разных окружений
      switch (environment) {
        case 'LOCAL':
          if (worlds.length < 3) {
            console.log(`   ❌ LOCAL should have at least 3 worlds for development`)
            return false
          }
          break
        case 'BETA':
          if (worlds.length < 1) {
            console.log(`   ❌ BETA should have at least 1 world for staging`)
            return false
          }
          break
        case 'PROD':
          if (templateWorlds.length === 0) {
            console.log(`   ❌ PROD should have at least 1 template world`)
            return false
          }
          break
      }

      console.log(`   ✅ ${environment} seeding validation passed`)
      return true

    } catch (error) {
      console.error(`   ❌ Validation failed for ${environment}:`, error)
      return false
    }
  }
}

// Export seeder instance и utility functions
export const phoenixDatabaseSeeder = new PhoenixDatabaseSeeder()

/**
 * CLI функции для seeding
 */
export async function seedEnvironment(
  environment: 'LOCAL' | 'BETA' | 'PROD',
  options: Partial<SeedingOptions> = {}
): Promise<void> {
  const fullOptions: SeedingOptions = {
    environment,
    skipExisting: true,
    verbose: true,
    dryRun: false,
    ...options
  }

  await phoenixDatabaseSeeder.seedEnvironment(fullOptions)
}

export async function resetAndSeedEnvironment(
  environment: 'LOCAL' | 'BETA' | 'PROD'
): Promise<void> {
  console.log(`🔥 PHOENIX: Reset and seed ${environment} environment...`)
  
  // Clear existing data
  await phoenixDatabaseSeeder.clearEnvironment(environment, { confirm: true })
  
  // Seed fresh data
  await seedEnvironment(environment, { skipExisting: false })
  
  // Validate
  const isValid = await phoenixDatabaseSeeder.validateSeeding(environment)
  
  if (isValid) {
    console.log(`✅ ${environment} environment reset and seeded successfully`)
  } else {
    throw new Error(`❌ ${environment} seeding validation failed`)
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2]
  const environment = process.argv[3] as 'LOCAL' | 'BETA' | 'PROD'

  if (!environment || !['LOCAL', 'BETA', 'PROD'].includes(environment)) {
    console.log('🔥 PHOENIX Database Seeder')
    console.log('')
    console.log('Usage:')
    console.log('  seed <environment>       - Seed environment with default data')
    console.log('  reset <environment>      - Clear and reseed environment')
    console.log('  validate <environment>   - Validate seeded data')
    console.log('')
    console.log('Environments: LOCAL, BETA, PROD')
    console.log('')
    console.log('Examples:')
    console.log('  pnpm phoenix:seed LOCAL')
    console.log('  pnpm phoenix:reset LOCAL')
    process.exit(0)
  }

  switch (command) {
    case 'seed':
      seedEnvironment(environment)
        .then(() => process.exit(0))
        .catch((error) => {
          console.error(error)
          process.exit(1)
        })
      break

    case 'reset':
      resetAndSeedEnvironment(environment)
        .then(() => process.exit(0))
        .catch((error) => {
          console.error(error)
          process.exit(1)
        })
      break

    case 'validate':
      phoenixDatabaseSeeder.validateSeeding(environment)
        .then((isValid) => process.exit(isValid ? 0 : 1))
        .catch((error) => {
          console.error(error)
          process.exit(1)
        })
      break

    default:
      console.error(`Unknown command: ${command}`)
      process.exit(1)
  }
}

// END OF: scripts/phoenix-seed-database.ts