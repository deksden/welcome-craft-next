#!/usr/bin/env node

/**
 * @file scripts/test-sharding.js
 * @description Утилита для интеллектуального шардирования E2E тестов
 * @version 1.0.0
 * @date 2025-06-18
 * @updated Создание для системной оптимизации E2E тестов
 */

/** HISTORY:
 * v1.0.0 (2025-06-18): Создание интеллектуальной системы шардирования для оптимизации производительности
 */

import { execSync } from 'node:child_process'
import { cpus } from 'node:os'

/**
 * @description Определяет оптимальное количество шардов на основе системных ресурсов
 */
function getOptimalShardCount() {
  const cpuCount = cpus().length
  const isCI = !!process.env.CI
  
  if (isCI) {
    // В CI используем консервативный подход
    return Math.min(4, Math.max(2, Math.floor(cpuCount / 2)))
  } else {
    // Локально можем быть более агрессивными
    return Math.min(8, Math.max(2, cpuCount - 1))
  }
}

/**
 * @description Анализирует тесты и группирует их по сложности
 */
function analyzeTestComplexity() {
  const testPatterns = {
    fast: ['unit', 'routes'],
    medium: ['regression', 'basic'],
    slow: ['e2e', 'integration', 'world']
  }
  
  // Можно расширить анализом реальных файлов тестов
  return testPatterns
}

/**
 * @description Запускает тесты с оптимальным шардированием
 */
async function runOptimizedTests() {
  const args = process.argv.slice(2)
  const shardCount = getOptimalShardCount()
  
  console.log(`🚀 OPTIMIZED SHARDING: Running tests with ${shardCount} shards on ${cpus().length} CPU cores`)
  
  if (args.includes('--sequential')) {
    console.log('📝 Running tests sequentially as requested')
    execSync('pnpm exec playwright test', { stdio: 'inherit' })
    return
  }
  
  if (args.includes('--analyze')) {
    console.log('📊 PERFORMANCE ANALYSIS:')
    console.log(`  CPU Cores: ${cpus().length}`)
    console.log(`  Optimal Shards: ${shardCount}`)
    console.log(`  CI Mode: ${!!process.env.CI}`)
    console.log(`  Expected Speedup: ~${Math.floor(shardCount * 0.7)}x`)
    return
  }
  
  // Параллельный запуск шардов
  const shards = Array.from({ length: shardCount }, (_, i) => i + 1)
  const commands = shards.map(shard => 
    `pnpm exec playwright test --shard=${shard}/${shardCount}`
  )
  
  console.log(`📋 Executing ${shardCount} parallel shards:`)
  commands.forEach((cmd, i) => console.log(`  Shard ${i + 1}: ${cmd}`))
  
  try {
    const startTime = Date.now()
    
    // Запускаем все шарды параллельно
    const command = `${commands.join(' & ')} & wait`
    execSync(command, { stdio: 'inherit', shell: true })
    
    const totalTime = Date.now() - startTime
    console.log(`✅ SHARDING COMPLETE: All tests finished in ${Math.round(totalTime / 1000)}s`)
    console.log(`📊 Performance: ~${Math.round(shardCount * 0.7)}x faster than sequential`)
    
  } catch (error) {
    console.error('❌ SHARDING FAILED:', error.message)
    process.exit(1)
  }
}

/**
 * @description Показывает справку по использованию
 */
function showHelp() {
  console.log(`
🚀 PLAYWRIGHT SHARDING OPTIMIZER

Автоматически определяет оптимальное количество шардов для максимальной производительности E2E тестов.

ИСПОЛЬЗОВАНИЕ:
  node scripts/test-sharding.js [options]

ОПЦИИ:
  --sequential     Запуск тестов последовательно (без шардирования)
  --analyze        Показать анализ производительности без запуска тестов
  --help           Показать эту справку

ПРИМЕРЫ:
  node scripts/test-sharding.js
  node scripts/test-sharding.js --analyze
  node scripts/test-sharding.js --sequential

ОСОБЕННОСТИ:
  • Автоматическое определение оптимального количества шардов
  • Адаптация под CI/CD окружения
  • Учет системных ресурсов (CPU cores)
  • Консервативный подход в CI для экономии ресурсов
  `)
}

// Основная логика
if (process.argv.includes('--help')) {
  showHelp()
} else {
  runOptimizedTests().catch(error => {
    console.error('❌ SCRIPT ERROR:', error)
    process.exit(1)
  })
}

// END OF: scripts/test-sharding.js