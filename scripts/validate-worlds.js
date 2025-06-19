#!/usr/bin/env node

/**
 * @file scripts/validate-worlds.js
 * @description Утилита для запуска комплексной валидации всех тестовых миров
 * @version 1.0.0
 * @date 2025-06-18
 * @updated Создание для системной оптимизации E2E тестов
 */

/** HISTORY:
 * v1.0.0 (2025-06-18): Создание CLI утилиты для валидации миров
 */

import { validateAllWorlds } from '../tests/helpers/world-validator.ts'

/**
 * @description Основная функция запуска валидации
 */
async function main() {
  try {
    console.log('🚀 WORLD VALIDATION: Starting comprehensive check of all testing worlds...\n')
    
    const report = await validateAllWorlds()
    
    // Показываем краткий отчет
    console.log('\n📊 VALIDATION SUMMARY:')
    console.log(`   Total worlds: ${report.totalWorlds}`)
    console.log(`   Valid worlds: ${report.validWorlds}`)
    console.log(`   Invalid worlds: ${report.invalidWorlds}`)
    console.log(`   Total errors: ${report.totalErrors}`)
    console.log(`   Total warnings: ${report.totalWarnings}`)
    console.log(`   Validation time: ${report.performance.totalTime}ms`)
    
    // Если запрошен детальный отчет
    if (process.argv.includes('--detailed') || process.argv.includes('--report')) {
      const { worldValidator } = await import('../tests/helpers/world-validator.ts')
      console.log(`\n${worldValidator.generateDetailedReport(report)}`)
    }
    
    // Показываем проблемы если есть
    if (report.totalErrors > 0) {
      console.log('\n❌ VALIDATION FAILED:')
      report.results.forEach(result => {
        if (result.errors.length > 0) {
          console.log(`   World ${result.worldId}:`)
          result.errors.forEach(error => {
            console.log(`     - ${error.message}`)
          })
        }
      })
      process.exit(1)
    }
    
    if (report.totalWarnings > 0) {
      console.log('\n⚠️  WARNINGS FOUND:')
      report.results.forEach(result => {
        if (result.warnings.length > 0) {
          console.log(`   World ${result.worldId}:`)
          result.warnings.forEach(warning => {
            console.log(`     - ${warning.message}`)
          })
        }
      })
    }
    
    console.log('\n✅ WORLD VALIDATION COMPLETE: All worlds are ready for testing!')
    
  } catch (error) {
    console.error('❌ VALIDATION ERROR:', error.message)
    if (process.argv.includes('--debug')) {
      console.error('Stack trace:', error.stack)
    }
    process.exit(1)
  }
}

/**
 * @description Показывает справку по использованию
 */
function showHelp() {
  console.log(`
🔍 WORLD VALIDATION UTILITY

Проверяет все тестовые миры на корректность и готовность к выполнению E2E тестов.

ИСПОЛЬЗОВАНИЕ:
  node scripts/validate-worlds.js [options]

ОПЦИИ:
  --detailed, --report   Показать детальный отчет валидации
  --debug                Показать stack trace при ошибках
  --help                 Показать эту справку

ПРИМЕРЫ:
  node scripts/validate-worlds.js
  node scripts/validate-worlds.js --detailed
  pnpm test:validate-worlds
  pnpm test:validate-worlds:report

ПРОВЕРЯЕМЫЕ АСПЕКТЫ:
  • Структура миров и пользователей
  • Существование fixture файлов
  • Валидность JSON и CSV файлов
  • Зависимости между мирами
  • Производительность и размеры файлов

EXIT CODES:
  0  - Все миры валидны
  1  - Найдены ошибки валидации
  `)
}

// Основная логика
if (process.argv.includes('--help')) {
  showHelp()
} else {
  main().catch(error => {
    console.error('❌ SCRIPT ERROR:', error)
    process.exit(1)
  })
}

// END OF: scripts/validate-worlds.js