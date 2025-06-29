#!/usr/bin/env tsx

/**
 * @file scripts/load-world.ts
 * @description Консольная утилита для загрузки тестовых миров в dev базу данных
 * @version 1.0.0
 * @date 2025-06-28
 * @updated Создание консольной утилиты для быстрой загрузки миров в dev окружение
 */

/** HISTORY:
 * v1.0.0 (2025-06-28): Создание консольной утилиты для загрузки миров в dev базу с поддержкой всех опций
 */

import { config } from 'dotenv'
import postgres from 'postgres'
import { getWorldDefinition, validateWorld, WORLDS } from '../tests/helpers/worlds.config'
import type { WorldId } from '../tests/helpers/worlds.config'

// Load environment
config({ path: '.env.local' })

interface LoadWorldOptions {
  worldId?: WorldId
  list?: boolean
  clean?: boolean
  force?: boolean
  dryRun?: boolean
  verbose?: boolean
  help?: boolean
}

const USAGE = `
🌍 WelcomeCraft World Loader - Загрузка тестовых миров в dev базу

ИСПОЛЬЗОВАНИЕ:
  npx tsx scripts/load-world.ts [WORLD_ID] [OPTIONS]

МИРЫ:
  CLEAN_USER_WORKSPACE      - Чистое рабочее пространство (Sarah Wilson)
  SITE_READY_FOR_PUBLICATION - Готовый сайт (Ada Thompson)  
  CONTENT_LIBRARY_BASE      - Библиотека контента (Maria Garcia)
  DEMO_PREPARATION          - Демо-среда (David Chen)
  ENTERPRISE_ONBOARDING     - Корпоративный онбординг (Elena Rodriguez)

ОПЦИИ:
  --list, -l               Показать все доступные миры
  --clean, -c              Очистить существующие данные перед загрузкой
  --force, -f              Перезаписать конфликтующие данные
  --dry-run, -d            Показать что будет создано без реальных изменений
  --verbose, -v            Подробный лог операций
  --help, -h               Показать эту справку

ПРИМЕРЫ:
  npx tsx scripts/load-world.ts --list
  npx tsx scripts/load-world.ts CONTENT_LIBRARY_BASE
  npx tsx scripts/load-world.ts CLEAN_USER_WORKSPACE --clean --verbose
  npx tsx scripts/load-world.ts ENTERPRISE_ONBOARDING --dry-run
`

function parseArgs(): LoadWorldOptions {
  const args = process.argv.slice(2)
  const options: LoadWorldOptions = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    switch (arg) {
      case '--list':
      case '-l':
        options.list = true
        break
      case '--clean':
      case '-c':
        options.clean = true
        break
      case '--force':
      case '-f':
        options.force = true
        break
      case '--dry-run':
      case '-d':
        options.dryRun = true
        break
      case '--verbose':
      case '-v':
        options.verbose = true
        break
      case '--help':
      case '-h':
        options.help = true
        break
      default:
        if (!arg.startsWith('-') && !options.worldId) {
          options.worldId = arg as WorldId
        }
        break
    }
  }

  return options
}

function listWorlds() {
  console.log('\n🌍 Доступные тестовые миры:\n')
  
  Object.entries(WORLDS).forEach(([id, world]) => {
    const user = world.users[0]
    console.log(`📋 ${id}`)
    console.log(`   Название: ${world.name}`)
    console.log(`   Описание: ${world.description}`)
    console.log(`   Пользователь: ${user.name} (${user.email})`)
    console.log(`   Артефакты: ${world.artifacts.length}`)
    console.log(`   Чаты: ${world.chats.length}`)
    console.log('')
  })
  
  console.log('💡 Используйте: npx tsx scripts/load-world.ts [WORLD_ID] для загрузки')
}

async function checkEnvironment(): Promise<boolean> {
  // Проверяем что это dev окружение
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ОШИБКА: Этот скрипт нельзя запускать в production окружении!')
    return false
  }

  if (!process.env.POSTGRES_URL) {
    console.error('❌ ОШИБКА: POSTGRES_URL не настроен в .env.local')
    return false
  }

  // Проверяем что БД доступна
  try {
    const connection = postgres(process.env.POSTGRES_URL, { max: 1 })
    await connection`SELECT 1`
    await connection.end()
    return true
  } catch (error) {
    console.error('❌ ОШИБКА: Не удается подключиться к базе данных:', error)
    return false
  }
}

async function loadWorld(worldId: WorldId, options: LoadWorldOptions) {
  console.log(`🚀 Загрузка мира: ${worldId}`)
  
  // Валидация мира
  try {
    validateWorld(worldId)
  } catch (error) {
    console.error(`❌ Ошибка валидации мира ${worldId}:`, error)
    return false
  }

  const worldDef = getWorldDefinition(worldId)
  
  if (options.dryRun) {
    console.log('\n🔍 РЕЖИМ ПРЕДВАРИТЕЛЬНОГО ПРОСМОТРА (--dry-run)')
    console.log('Будет создано:')
    console.log(`  👥 Пользователи: ${worldDef.users.length}`)
    worldDef.users.forEach(user => {
      console.log(`    - ${user.name} (${user.email})`)
    })
    console.log(`  📄 Артефакты: ${worldDef.artifacts.length}`)
    worldDef.artifacts.forEach(artifact => {
      console.log(`    - ${artifact.title} (${artifact.kind})`)
    })
    console.log(`  💬 Чаты: ${worldDef.chats.length}`)
    worldDef.chats.forEach(chat => {
      console.log(`    - ${chat.title}`)
    })
    console.log('\n💡 Для реальной загрузки уберите флаг --dry-run')
    return true
  }

  try {
    console.log('\n⚠️  ПОКА В РАЗРАБОТКЕ: Полная загрузка данных мира')
    console.log('📋 Доступная информация о мире:')
    console.log(`  👥 Пользователи: ${worldDef.users.length}`)
    worldDef.users.forEach(user => {
      console.log(`    - ${user.name} (${user.email}) - роль: ${user.role}`)
    })
    console.log(`  📄 Артефакты: ${worldDef.artifacts.length}`)
    worldDef.artifacts.forEach(artifact => {
      console.log(`    - ${artifact.title} (${artifact.kind})`)
    })
    
    console.log('\n🌐 Для входа в приложение используйте DevWorldSelector:')
    console.log(`   1. Откройте приложение в браузере`)
    console.log(`   2. Найдите кнопку "Выбрать мир" в header (только в dev режиме)`)
    console.log(`   3. Выберите "${worldDef.name}" и нажмите "Войти"`)
    console.log(`   4. Автоматический вход как ${worldDef.users[0].name}`)
    
    console.log('\n💡 Полная реализация загрузки данных в БД будет добавлена в следующих версиях')
    
    return true
  } catch (error) {
    console.error('❌ Ошибка загрузки мира:', error)
    return false
  }
}

async function main() {
  const options = parseArgs()

  if (options.help) {
    console.log(USAGE)
    return
  }

  if (options.list) {
    listWorlds()
    return
  }

  if (!options.worldId) {
    console.error('❌ ОШИБКА: Не указан ID мира')
    console.log('\n💡 Используйте --list для просмотра доступных миров')
    console.log('💡 Или --help для справки')
    process.exit(1)
  }

  // Проверяем окружение
  const envOk = await checkEnvironment()
  if (!envOk) {
    process.exit(1)
  }

  // Проверяем что мир существует
  if (!WORLDS[options.worldId]) {
    console.error(`❌ ОШИБКА: Мир "${options.worldId}" не найден`)
    console.log('\n💡 Доступные миры:')
    Object.keys(WORLDS).forEach(id => console.log(`  - ${id}`))
    process.exit(1)
  }

  console.log('🌍 WelcomeCraft World Loader')
  console.log('================================')
  
  const success = await loadWorld(options.worldId, options)
  
  if (!success) {
    process.exit(1)
  }
}

main().catch(console.error)

// END OF: scripts/load-world.ts