/**
 * @file scripts/migrate-worlds-to-db.ts
 * @description PHOENIX PROJECT - Миграция статических миров в WorldMeta БД
 * @version 1.0.0
 * @date 2025-06-29
 * @updated PHOENIX PROJECT Step 3 - Migration script для перехода на database-driven worlds
 */

/** HISTORY:
 * v1.0.0 (2025-06-29): PHOENIX PROJECT Step 3 - Миграция worlds.config.ts в WorldMeta таблицу
 */

import { db } from '@/lib/db'
import { worldMeta } from '@/lib/db/schema'
import { WORLDS } from '@/tests/helpers/worlds.config'
import type { WorldDefinition } from '@/tests/helpers/worlds.config'
import { eq } from 'drizzle-orm'

/**
 * @description Миграция всех статических миров в базу данных
 * 
 * Читает конфигурацию из tests/helpers/worlds.config.ts
 * и создает соответствующие записи в WorldMeta таблице
 * 
 * @feature PHOENIX PROJECT - Static to Dynamic Migration
 */
async function migrateWorldsToDatabase() {
  console.log('🔥 PHOENIX PROJECT: Starting worlds migration to database...')
  
  try {
    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const [worldId, worldDef] of Object.entries(WORLDS)) {
      try {
        console.log(`\n🌍 Processing world: ${worldId}`)
        
        // Проверяем существует ли уже в БД
        const existing = await db
          .select()
          .from(worldMeta)
          .where(eq(worldMeta.id, worldId))
          .limit(1)

        if (existing.length > 0) {
          console.log(`   ⚠️  Already exists in database, skipping`)
          skipped++
          continue
        }

        // Преобразуем WorldDefinition в WorldMeta формат
        const worldMetaData = {
          id: worldId,
          name: worldDef.name,
          description: worldDef.description,
          users: worldDef.users,
          artifacts: worldDef.artifacts,
          chats: worldDef.chats,
          settings: worldDef.settings,
          dependencies: worldDef.dependencies || [],
          environment: 'LOCAL' as const, // Статические миры для LOCAL development
          category: getWorldCategory(worldId),
          tags: getWorldTags(worldDef),
          isActive: true,
          isTemplate: false,
          autoCleanup: true,
          cleanupAfterHours: 24,
          version: '1.0.0',
          isolationLevel: 'FULL' as const,
        }

        // Вставляем в БД
        const [created] = await db
          .insert(worldMeta)
          .values(worldMetaData)
          .returning()

        console.log(`   ✅ Migrated successfully`)
        console.log(`      - Name: ${created.name}`)
        console.log(`      - Users: ${Array.isArray(created.users) ? created.users.length : 0}`)
        console.log(`      - Artifacts: ${Array.isArray(created.artifacts) ? created.artifacts.length : 0}`)
        console.log(`      - Chats: ${Array.isArray(created.chats) ? created.chats.length : 0}`)
        
        migrated++

      } catch (error) {
        console.error(`   ❌ Error migrating world ${worldId}:`, error)
        errors++
      }
    }

    // Финальный отчет
    console.log('\n🔥 PHOENIX PROJECT: Migration completed!')
    console.log(`   ✅ Migrated: ${migrated} worlds`)
    console.log(`   ⚠️  Skipped: ${skipped} worlds (already exist)`)
    console.log(`   ❌ Errors: ${errors} worlds`)
    
    if (errors === 0) {
      console.log('\n🎉 All worlds successfully migrated to database!')
      console.log('   You can now use dynamic world management APIs')
    } else {
      console.log('\n⚠️  Some errors occurred during migration')
      console.log('   Please check the logs above and retry failed migrations')
    }

  } catch (error) {
    console.error('❌ PHOENIX PROJECT: Fatal error during migration:', error)
    process.exit(1)
  }
}

/**
 * @description Определяет категорию мира на основе его ID
 */
function getWorldCategory(worldId: string): string {
  if (worldId.includes('UC_') || worldId.includes('USE_CASE')) {
    return 'UC'
  }
  if (worldId.includes('REGRESSION')) {
    return 'REGRESSION'
  }
  if (worldId.includes('PERFORMANCE')) {
    return 'PERFORMANCE'
  }
  if (worldId.includes('DEMO')) {
    return 'DEMO'
  }
  if (worldId.includes('ENTERPRISE')) {
    return 'ENTERPRISE'
  }
  return 'GENERAL'
}

/**
 * @description Генерирует теги для мира на основе его конфигурации
 */
function getWorldTags(worldDef: WorldDefinition): string[] {
  const tags: string[] = []
  
  // Теги на основе количества данных
  if (worldDef.users.length > 0) tags.push('has-users')
  if (worldDef.artifacts.length > 0) tags.push('has-artifacts')
  if (worldDef.chats.length > 0) tags.push('has-chats')
  
  // Теги на основе настроек
  if (worldDef.settings.autoCleanup) tags.push('auto-cleanup')
  if (worldDef.dependencies && worldDef.dependencies.length > 0) tags.push('has-dependencies')
  
  // Теги на основе названия/описания
  if (worldDef.name.toLowerCase().includes('clean')) tags.push('clean')
  if (worldDef.name.toLowerCase().includes('ready')) tags.push('ready')
  if (worldDef.description.toLowerCase().includes('test')) tags.push('testing')
  
  return tags
}

// Запуск миграции если скрипт вызван напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateWorldsToDatabase()
    .then(() => {
      console.log('\n🔥 PHOENIX PROJECT: Migration script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ PHOENIX PROJECT: Migration failed:', error)
      process.exit(1)
    })
}

export { migrateWorldsToDatabase }

// END OF: scripts/migrate-worlds-to-db.ts