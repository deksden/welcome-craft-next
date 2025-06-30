/**
 * @file scripts/phoenix-world-manager.ts
 * @description PHOENIX PROJECT - CLI для управления динамическими тестовыми мирами
 * @version 1.0.0
 * @date 2025-06-30
 * @updated Создан CLI интерфейс для world management с использованием существующих API
 */

/** HISTORY:
 * v1.0.0 (2025-06-30): Создан CLI интерфейс с командами list, create, cleanup, seed
 */

// Load environment variables for CLI context
import { config } from 'dotenv'
config({ path: '.env.local' })

// CLI-specific database connection (without server-only restriction)
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { worldMeta } from '@/lib/db/schema'
import { eq, and, desc, lt } from 'drizzle-orm'
import { writeFile, readFile } from 'node:fs/promises'
import { prompts } from '@/lib/utils/prompts'
import { PhoenixSeedManager } from '@/lib/phoenix/seed-manager'
import type { ConflictStrategy } from '@/lib/phoenix/seed-manager'

// Initialize CLI-specific database connection
const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('❌ Missing database URL. Please check POSTGRES_URL or DATABASE_URL in .env.local')
  process.exit(1)
}

const client = postgres(databaseUrl, {
  idle_timeout: 20,
  max_lifetime: 60 * 5,
})
const db = drizzle(client)

type Environment = 'LOCAL' | 'BETA' | 'PROD'
type Category = 'GENERAL' | 'UC' | 'REGRESSION' | 'PERFORMANCE' | 'DEMO' | 'ENTERPRISE'

interface WorldFormData {
  id: string
  name: string
  description: string
  category: Category
  tags: string[]
  environment: Environment
  autoCleanup: boolean
  cleanupAfterHours: number
}

/**
 * Phoenix World Manager CLI
 * 
 * Предоставляет командный интерфейс для управления тестовыми мирами:
 * - Список миров с фильтрацией
 * - Создание новых миров
 * - Очистка неактивных миров
 * - Заполнение миров тестовыми данными
 * - Копирование между окружениями
 * - Экспорт/импорт seed данных
 * - Управление orphaned blob файлами
 * 
 * @feature PHOENIX PROJECT - CLI World Management
 * @feature Environment-aware operations
 * @feature Interactive commands
 * @feature Seed data management
 */
class PhoenixWorldManager {
  private currentEnvironment: Environment
  private seedManager: PhoenixSeedManager

  constructor(environment: Environment = 'LOCAL') {
    this.currentEnvironment = environment
    this.seedManager = new PhoenixSeedManager(databaseUrl)
  }

  /**
   * Вывод списка всех миров с фильтрацией
   */
  async listWorlds(options: {
    environment?: Environment
    category?: Category
    active?: boolean
    template?: boolean
  } = {}): Promise<void> {
    console.log('🌍 PHOENIX: Loading worlds...')
    
    try {
      // Строим WHERE условия
      const conditions = []
      
      if (options.environment) {
        conditions.push(eq(worldMeta.environment, options.environment))
      }
      
      if (options.active !== undefined) {
        conditions.push(eq(worldMeta.isActive, options.active))
      }
      
      if (options.category) {
        conditions.push(eq(worldMeta.category, options.category))
      }
      
      if (options.template !== undefined) {
        conditions.push(eq(worldMeta.isTemplate, options.template))
      }

      // Выполняем запрос
      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined
      const worlds = await db
        .select()
        .from(worldMeta)
        .where(whereCondition)
        .orderBy(desc(worldMeta.updatedAt))

      // Выводим результаты
      console.log(`\n📊 Found ${worlds.length} worlds\n`)
      
      if (worlds.length === 0) {
        console.log('   No worlds found matching criteria')
        return
      }

      console.log(`${'ID'.padEnd(20) + 'NAME'.padEnd(25) + 'ENV'.padEnd(8) + 'CATEGORY'.padEnd(12) + 'STATUS'.padEnd(10)}USAGE`)
      console.log('─'.repeat(90))

      worlds.forEach(world => {
        const status = world.isActive ? '✅ Active' : '❌ Inactive'
        const usage = `${world.usageCount || 0} times`
        
        console.log(
          world.id.padEnd(20) + 
          world.name.padEnd(25) + 
          world.environment.padEnd(8) + 
          world.category.padEnd(12) + 
          status.padEnd(10) + 
          usage
        )
      })

      // Статистика
      console.log('─'.repeat(90))
      console.log(`Total: ${worlds.length} | Active: ${worlds.filter(w => w.isActive).length} | Templates: ${worlds.filter(w => w.isTemplate).length}`)
      
    } catch (error) {
      console.error('❌ Error loading worlds:', error)
      throw error
    }
  }

  /**
   * Интерактивное создание нового мира
   */
  async createWorldInteractive(): Promise<void> {
    console.log('🌍 PHOENIX: Creating new world...\n')
    
    try {
      // Интерактивный ввод данных
      const answers = await prompts([
        {
          type: 'text',
          name: 'id',
          message: 'World ID (uppercase recommended):',
          validate: (value: string) => value.length > 0 ? true : 'World ID is required'
        },
        {
          type: 'text',
          name: 'name',
          message: 'World Name:',
          validate: (value: string) => value.length > 0 ? true : 'World name is required'
        },
        {
          type: 'text',
          name: 'description',
          message: 'Description:',
          validate: (value: string) => value.length > 0 ? true : 'Description is required'
        },
        {
          type: 'select',
          name: 'environment',
          message: 'Environment:',
          choices: [
            { title: 'LOCAL - Development', value: 'LOCAL' },
            { title: 'BETA - Staging', value: 'BETA' },
            { title: 'PROD - Production', value: 'PROD' }
          ],
          initial: 0
        },
        {
          type: 'select',
          name: 'category',
          message: 'Category:',
          choices: [
            { title: 'GENERAL - General purpose', value: 'GENERAL' },
            { title: 'UC - Use Cases', value: 'UC' },
            { title: 'REGRESSION - Regression tests', value: 'REGRESSION' },
            { title: 'PERFORMANCE - Performance tests', value: 'PERFORMANCE' },
            { title: 'DEMO - Demo/showcase', value: 'DEMO' },
            { title: 'ENTERPRISE - Enterprise features', value: 'ENTERPRISE' }
          ],
          initial: 0
        },
        {
          type: 'confirm',
          name: 'autoCleanup',
          message: 'Enable auto-cleanup?',
          initial: true
        },
        {
          type: (prev: boolean) => prev ? 'number' : null,
          name: 'cleanupAfterHours',
          message: 'Cleanup after hours:',
          initial: 24,
          min: 1,
          max: 168 // 1 week
        }
      ])

      if (Object.keys(answers).length === 0) {
        console.log('❌ Operation cancelled')
        return
      }

      // Проверяем что мир с таким ID не существует
      const existingWorld = await db
        .select()
        .from(worldMeta)
        .where(eq(worldMeta.id, answers.id.toUpperCase()))
        .limit(1)

      if (existingWorld.length > 0) {
        console.error(`❌ World with ID '${answers.id.toUpperCase()}' already exists`)
        return
      }

      // Создаем новый мир
      const newWorld = {
        id: answers.id.toUpperCase(),
        name: answers.name,
        description: answers.description,
        users: [],
        artifacts: [],
        chats: [],
        settings: {
          autoCleanup: answers.autoCleanup,
          cleanupAfterHours: answers.cleanupAfterHours || 24
        },
        dependencies: [],
        environment: answers.environment,
        category: answers.category,
        tags: [],
        isTemplate: false,
        autoCleanup: answers.autoCleanup,
        cleanupAfterHours: answers.cleanupAfterHours || 24,
      }

      const [createdWorld] = await db
        .insert(worldMeta)
        .values(newWorld)
        .returning()

      console.log(`\n✅ World '${createdWorld.id}' created successfully!`)
      console.log(`   Name: ${createdWorld.name}`)
      console.log(`   Environment: ${createdWorld.environment}`)
      console.log(`   Category: ${createdWorld.category}`)
      console.log(`   Auto-cleanup: ${createdWorld.autoCleanup ? 'Yes' : 'No'}`)
      
    } catch (error) {
      console.error('❌ Error creating world:', error)
      throw error
    }
  }

  /**
   * Очистка неактивных миров
   */
  async cleanupWorlds(environment?: Environment): Promise<void> {
    console.log('🧹 PHOENIX: Cleaning up worlds...')
    
    try {
      // Находим миры для очистки
      const conditions = [
        eq(worldMeta.autoCleanup, true),
        lt(worldMeta.lastUsedAt, new Date(Date.now() - 24 * 60 * 60 * 1000)) // старше 24 часов
      ]

      if (environment) {
        conditions.push(eq(worldMeta.environment, environment))
      }

      const worldsToCleanup = await db
        .select()
        .from(worldMeta)
        .where(and(...conditions))

      if (worldsToCleanup.length === 0) {
        console.log('✅ No worlds eligible for cleanup')
        return
      }

      console.log(`\n📋 Found ${worldsToCleanup.length} worlds eligible for cleanup:`)
      worldsToCleanup.forEach(world => {
        console.log(`   - ${world.id} (${world.name}) - Last used: ${world.lastUsedAt || 'Never'}`)
      })

      // Подтверждение
      const confirm = await prompts({
        type: 'confirm',
        name: 'proceed',
        message: `Proceed with cleanup of ${worldsToCleanup.length} worlds?`,
        initial: false
      })

      if (!confirm.proceed) {
        console.log('❌ Cleanup cancelled')
        return
      }

      // Выполняем очистку (деактивация миров)
      let cleanedCount = 0
      for (const world of worldsToCleanup) {
        await db
          .update(worldMeta)
          .set({ 
            isActive: false,
            updatedAt: new Date()
          })
          .where(eq(worldMeta.id, world.id))
        cleanedCount++
      }

      console.log(`\n✅ Cleaned up ${cleanedCount} worlds`)
      console.log('   Worlds have been deactivated but not deleted')
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error)
      throw error
    }
  }

  /**
   * Заполнение мира тестовыми данными
   */
  async seedWorld(worldId: string): Promise<void> {
    console.log(`🌱 PHOENIX: Seeding world ${worldId}...`)
    
    try {
      // Проверяем что мир существует
      const world = await db
        .select()
        .from(worldMeta)
        .where(eq(worldMeta.id, worldId))
        .limit(1)

      if (world.length === 0) {
        console.error(`❌ World '${worldId}' not found`)
        return
      }

      // Создаем базовые тестовые данные
      const sampleUsers = [
        { id: 'test-user-1', email: 'user1@test.com', name: 'Test User 1', type: 'standard' },
        { id: 'test-user-2', email: 'user2@test.com', name: 'Test User 2', type: 'admin' }
      ]

      const sampleArtifacts = [
        { id: 'artifact-1', kind: 'text', title: 'Sample Text', content: 'This is sample content' },
        { id: 'artifact-2', kind: 'site', title: 'Sample Site', content: '{"blocks":[]}' }
      ]

      const sampleChats = [
        { id: 'chat-1', title: 'Sample Chat', messages: [] }
      ]

      // Обновляем мир с тестовыми данными
      await db
        .update(worldMeta)
        .set({
          users: sampleUsers,
          artifacts: sampleArtifacts,
          chats: sampleChats,
          usageCount: (world[0].usageCount || 0) + 1,
          lastUsedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(worldMeta.id, worldId))

      console.log(`✅ World '${worldId}' seeded successfully!`)
      console.log(`   Created: ${sampleUsers.length} users, ${sampleArtifacts.length} artifacts, ${sampleChats.length} chats`)
      
    } catch (error) {
      console.error('❌ Error seeding world:', error)
      throw error
    }
  }

  /**
   * Копирование мира между окружениями
   */
  async copyWorld(sourceWorldId: string, sourceEnv: Environment, targetEnv: Environment): Promise<void> {
    console.log(`📦 PHOENIX: Copying world ${sourceWorldId} from ${sourceEnv} to ${targetEnv}...`)
    
    try {
      // Получаем исходный мир
      const sourceWorld = await db
        .select()
        .from(worldMeta)
        .where(and(
          eq(worldMeta.id, sourceWorldId),
          eq(worldMeta.environment, sourceEnv)
        ))
        .limit(1)

      if (sourceWorld.length === 0) {
        console.error(`❌ Source world '${sourceWorldId}' not found in ${sourceEnv} environment`)
        return
      }

      // Создаем копию в целевом окружении
      const targetWorldId = `${sourceWorldId}_${targetEnv}`
      const worldCopy = {
        ...sourceWorld[0],
        id: targetWorldId,
        name: `${sourceWorld[0].name} (${targetEnv})`,
        environment: targetEnv,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Проверяем что мир с таким ID не существует в целевом окружении
      const existingTarget = await db
        .select()
        .from(worldMeta)
        .where(eq(worldMeta.id, targetWorldId))
        .limit(1)

      if (existingTarget.length > 0) {
        console.error(`❌ Target world '${targetWorldId}' already exists`)
        return
      }

      // Создаем копию
      const [createdWorld] = await db
        .insert(worldMeta)
        .values(worldCopy)
        .returning()

      console.log(`✅ World copied successfully as '${createdWorld.id}'`)
      console.log(`   Source: ${sourceWorldId} (${sourceEnv})`)
      console.log(`   Target: ${createdWorld.id} (${targetEnv})`)
      
    } catch (error) {
      console.error('❌ Error copying world:', error)
      throw error
    }
  }

  /**
   * Экспорт конфигурации миров
   */
  async exportWorlds(format: 'json' | 'csv' = 'json'): Promise<void> {
    console.log('📁 PHOENIX: Exporting worlds...')
    
    try {
      const worlds = await db
        .select()
        .from(worldMeta)
        .orderBy(desc(worldMeta.updatedAt))

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      
      if (format === 'json') {
        const filename = `worlds-export-${timestamp}.json`
        await writeFile(filename, JSON.stringify(worlds, null, 2))
        console.log(`✅ Worlds exported to ${filename}`)
      } else {
        // CSV export implementation would go here
        console.log('📄 CSV export not implemented yet')
      }
      
    } catch (error) {
      console.error('❌ Error exporting worlds:', error)
      throw error
    }
  }

  /**
   * Экспорт мира в seed формат
   */
  async exportWorldToSeed(worldId: string, options: {
    environment?: Environment
    includeBlobs?: boolean
    outputPath?: string
  } = {}): Promise<void> {
    console.log(`📦 PHOENIX: Exporting world ${worldId} to seed format...`)
    
    try {
      const seedPath = await this.seedManager.exportWorld(worldId, options)
      console.log(`✅ World exported to seed: ${seedPath}`)
      
    } catch (error) {
      console.error('❌ Error exporting world to seed:', error)
      throw error
    }
  }

  /**
   * Импорт seed данных
   */
  async importSeed(seedPath: string, strategy?: ConflictStrategy): Promise<void> {
    console.log(`📥 PHOENIX: Importing seed from ${seedPath}...`)
    
    try {
      // Анализируем конфликты
      const conflicts = await this.seedManager.analyzeConflicts(seedPath)
      
      console.log('📊 Conflict Analysis:')
      console.log(`   World exists: ${conflicts.worldExists}`)
      console.log(`   Conflicting users: ${conflicts.conflictingUsers.length}`)
      console.log(`   Missing blobs: ${conflicts.missingBlobs.length}`)

      // Если стратегия не задана, запрашиваем у пользователя
      let resolvedStrategy = strategy
      if (!resolvedStrategy) {
        resolvedStrategy = await this.promptConflictStrategy(conflicts)
      }

      // Выполняем импорт
      await this.seedManager.importSeed(seedPath, resolvedStrategy)
      console.log('✅ Seed imported successfully')
      
    } catch (error) {
      console.error('❌ Error importing seed:', error)
      throw error
    }
  }

  /**
   * Валидация seed структуры
   */
  async validateSeed(seedPath: string): Promise<void> {
    console.log(`🔍 PHOENIX: Validating seed ${seedPath}...`)
    
    try {
      const isValid = await this.seedManager.validateSeed(seedPath)
      
      if (isValid) {
        console.log('✅ Seed validation passed')
      } else {
        console.log('❌ Seed validation failed')
        process.exit(1)
      }
      
    } catch (error) {
      console.error('❌ Error validating seed:', error)
      throw error
    }
  }

  /**
   * Список всех seed директорий
   */
  async listSeeds(): Promise<void> {
    console.log('📋 PHOENIX: Available seeds...')
    
    try {
      const seeds = await this.seedManager.listSeeds()
      
      if (seeds.length === 0) {
        console.log('   No seeds found')
        return
      }

      console.log(`\n📊 Found ${seeds.length} seeds\n`)
      console.log(`${'SEED NAME'.padEnd(40) + 'WORLD ID'.padEnd(20)}STATUS`)
      console.log('─'.repeat(80))

      for (const seedName of seeds) {
        try {
          // Читаем метаданные seed
          const seedPath = `./seeds/${seedName}`
          const seedFile = `${seedPath}/seed.json`
          const seedData = JSON.parse(await readFile(seedFile, 'utf-8'))
          
          console.log(
            `${seedName.padEnd(40) + 
            seedData.world.metadata.id.padEnd(20)}✅ Valid`
          )
        } catch (error) {
          console.log(
            `${seedName.padEnd(40) + 
            'UNKNOWN'.padEnd(20)}❌ Invalid`
          )
        }
      }
      
    } catch (error) {
      console.error('❌ Error listing seeds:', error)
      throw error
    }
  }

  /**
   * Обнаружение orphaned blob файлов
   */
  async detectOrphanedBlobs(): Promise<void> {
    console.log('🔍 PHOENIX: Detecting orphaned blobs...')
    
    try {
      const orphanedBlobs = await this.seedManager.detectOrphanedBlobs()
      
      console.log(`\n📊 Found ${orphanedBlobs.length} orphaned blobs`)
      
      if (orphanedBlobs.length > 0) {
        console.log('\nOrphaned blobs:')
        orphanedBlobs.forEach(blobId => {
          console.log(`   - ${blobId}`)
        })

        const confirm = await prompts({
          type: 'confirm',
          name: 'cleanup',
          message: `Delete ${orphanedBlobs.length} orphaned blobs?`,
          initial: false
        })

        if (confirm.cleanup) {
          const cleanedCount = await this.seedManager.cleanupOrphanedBlobs(orphanedBlobs)
          console.log(`✅ Cleaned ${cleanedCount} orphaned blobs`)
        }
      } else {
        console.log('✅ No orphaned blobs found')
      }
      
    } catch (error) {
      console.error('❌ Error detecting orphaned blobs:', error)
      throw error
    }
  }

  /**
   * Закрытие подключений
   */
  async cleanup(): Promise<void> {
    await this.seedManager.close()
  }

  // Приватные методы

  private async promptConflictStrategy(conflicts: any): Promise<ConflictStrategy> {
    console.log('\n🤔 How to resolve conflicts?')

    const worldStrategy = await prompts({
      type: 'select',
      name: 'strategy',
      message: 'World conflict resolution:',
      choices: [
        { title: 'Replace - Overwrite existing world', value: 'replace' },
        { title: 'Merge - Combine with existing data', value: 'merge' },
        { title: 'Skip - Skip if world exists', value: 'skip' }
      ],
      initial: 0
    })

    const userStrategy = await prompts({
      type: 'select',
      name: 'strategy',
      message: 'User conflicts resolution:',
      choices: [
        { title: 'Replace - Overwrite conflicting users', value: 'replace' },
        { title: 'Merge - Combine user data', value: 'merge' },
        { title: 'Skip - Skip conflicting users', value: 'skip' },
        { title: 'Rename - Add suffix to conflicting users', value: 'rename' }
      ],
      initial: 1
    })

    return {
      world: worldStrategy.strategy,
      users: userStrategy.strategy,
      artifacts: userStrategy.strategy, // используем ту же стратегию
      chats: userStrategy.strategy,
      blobs: userStrategy.strategy
    }
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Closing database connection...')
  await client.end()
  process.exit(0)
})


// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2]
  const arg1 = process.argv[3]
  const arg2 = process.argv[4]
  const arg3 = process.argv[5]

  const manager = new PhoenixWorldManager()

  switch (command) {
    case 'list': {
      const environment = arg1 as Environment
      manager.listWorlds({ environment })
        .then(async () => {
          await client.end()
          process.exit(0)
        })
        .catch(async () => {
          await client.end()
          process.exit(1)
        })
      break
    }

    case 'create':
      manager.createWorldInteractive()
        .then(async () => {
          await client.end()
          process.exit(0)
        })
        .catch(async () => {
          await client.end()
          process.exit(1)
        })
      break

    case 'cleanup': {
      const cleanupEnv = arg1 as Environment
      manager.cleanupWorlds(cleanupEnv)
        .then(async () => {
          await client.end()
          process.exit(0)
        })
        .catch(async () => {
          await client.end()
          process.exit(1)
        })
      break
    }

    case 'seed':
      if (!arg1) {
        console.error('❌ Usage: seed <worldId>')
        await client.end()
        process.exit(1)
      }
      manager.seedWorld(arg1)
        .then(async () => {
          await client.end()
          process.exit(0)
        })
        .catch(async () => {
          await client.end()
          process.exit(1)
        })
      break

    case 'copy':
      if (!arg1 || !arg2 || !arg3) {
        console.error('❌ Usage: copy <worldId> <sourceEnv> <targetEnv>')
        await client.end()
        process.exit(1)
      }
      manager.copyWorld(arg1, arg2 as Environment, arg3 as Environment)
        .then(async () => {
          await client.end()
          process.exit(0)
        })
        .catch(async () => {
          await client.end()
          process.exit(1)
        })
      break

    case 'export': {
      const format = (arg1 as 'json' | 'csv') || 'json'
      manager.exportWorlds(format)
        .then(async () => {
          await manager.cleanup()
          await client.end()
          process.exit(0)
        })
        .catch(async () => {
          await manager.cleanup()
          await client.end()
          process.exit(1)
        })
      break
    }

    case 'export-seed': {
      if (!arg1) {
        console.error('❌ Usage: export-seed <worldId> [environment] [--include-blobs] [--output-path=path]')
        await client.end()
        process.exit(1)
      }
      const exportOptions = {
        environment: (arg2 as Environment) || 'LOCAL',
        includeBlobs: process.argv.includes('--include-blobs'),
        outputPath: process.argv.find(arg => arg.startsWith('--output-path='))?.split('=')[1]
      }
      manager.exportWorldToSeed(arg1, exportOptions)
        .then(async () => {
          await manager.cleanup()
          await client.end()
          process.exit(0)
        })
        .catch(async () => {
          await manager.cleanup()
          await client.end()
          process.exit(1)
        })
      break
    }

    case 'import-seed':
      if (!arg1) {
        console.error('❌ Usage: import-seed <seedPath>')
        await client.end()
        process.exit(1)
      }
      manager.importSeed(arg1)
        .then(async () => {
          await manager.cleanup()
          await client.end()
          process.exit(0)
        })
        .catch(async () => {
          await manager.cleanup()
          await client.end()
          process.exit(1)
        })
      break

    case 'validate-seed':
      if (!arg1) {
        console.error('❌ Usage: validate-seed <seedPath>')
        await client.end()
        process.exit(1)
      }
      manager.validateSeed(arg1)
        .then(async () => {
          await manager.cleanup()
          await client.end()
          process.exit(0)
        })
        .catch(async () => {
          await manager.cleanup()
          await client.end()
          process.exit(1)
        })
      break

    case 'list-seeds':
      manager.listSeeds()
        .then(async () => {
          await manager.cleanup()
          await client.end()
          process.exit(0)
        })
        .catch(async () => {
          await manager.cleanup()
          await client.end()
          process.exit(1)
        })
      break

    case 'cleanup-orphaned-blobs':
      manager.detectOrphanedBlobs()
        .then(async () => {
          await manager.cleanup()
          await client.end()
          process.exit(0)
        })
        .catch(async () => {
          await manager.cleanup()
          await client.end()
          process.exit(1)
        })
      break

    default:
      console.log('🌍 PHOENIX World Manager CLI')
      console.log('')
      console.log('Usage:')
      console.log('  list [environment]                    - List worlds (optionally filtered by environment)')
      console.log('  create                                - Create new world (interactive)')
      console.log('  cleanup [environment]                 - Cleanup inactive worlds')
      console.log('  seed <worldId>                       - Seed world with test data')
      console.log('  copy <worldId> <from> <to>           - Copy world between environments')
      console.log('  export [json|csv]                    - Export worlds configuration')
      console.log('')
      console.log('Seed Data Management:')
      console.log('  export-seed <worldId> [env] [opts]   - Export world to seed format')
      console.log('  import-seed <seedPath>               - Import seed data with conflict resolution')
      console.log('  validate-seed <seedPath>             - Validate seed structure')
      console.log('  list-seeds                           - List available seed directories')
      console.log('  cleanup-orphaned-blobs               - Detect and cleanup orphaned blob files')
      console.log('')
      console.log('Environments: LOCAL, BETA, PROD')
      console.log('')
      console.log('Examples:')
      console.log('  pnpm phoenix:worlds:list LOCAL')
      console.log('  pnpm phoenix:worlds:create')
      console.log('  pnpm phoenix:worlds:cleanup LOCAL')
      console.log('  pnpm phoenix:worlds:seed GENERAL_001')
      console.log('  pnpm phoenix:worlds:copy UC_TESTING LOCAL BETA')
      console.log('')
      console.log('Seed Data Examples:')
      console.log('  pnpm phoenix:worlds:export-seed UC_001 LOCAL --include-blobs')
      console.log('  pnpm phoenix:worlds:import-seed ./seeds/UC_001_LOCAL_2025-06-30')
      console.log('  pnpm phoenix:worlds:validate-seed ./seeds/UC_001_LOCAL_2025-06-30')
      console.log('  pnpm phoenix:worlds:list-seeds')
      console.log('  pnpm phoenix:worlds:cleanup-orphaned-blobs')
      await client.end()
      process.exit(0)
      break
  }
}

export { PhoenixWorldManager }

// END OF: scripts/phoenix-world-manager.ts