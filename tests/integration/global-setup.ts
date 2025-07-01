/**
 * @file tests/integration/global-setup.ts
 * @description Global setup для integration тестов - запуск эфемерной БД
 * @version 1.0.0
 * @date 2025-06-30
 * @updated Created integration global setup with unified ephemeral DB
 */

/** HISTORY:
 * v1.0.0 (2025-06-30): Created global setup для integration тестов через test:db:start
 */

import { execSync } from 'node:child_process'

export default async function globalSetup() {
  console.log('🚀 Integration Tests Global Setup: Starting ephemeral database...')
  
  try {
    // Используем унифицированную команду для эфемерной БД
    execSync('pnpm test:db:start', { 
      stdio: 'inherit',
      cwd: process.cwd()
    })
    
    console.log('✅ Integration Tests: Ephemeral database ready')
    
    // Устанавливаем переменную для integration тестов
    process.env.INTEGRATION_DB_READY = 'true'
    
    // Возвращаем teardown функцию
    return async () => {
      console.log('🧹 Integration Tests Global Teardown: Stopping ephemeral database...')
      
      try {
        execSync('pnpm test:db:down', { 
          stdio: 'inherit',
          cwd: process.cwd()
        })
        
        console.log('✅ Integration Tests: Ephemeral database stopped')
        
      } catch (error) {
        console.error('❌ Integration Tests: Failed to stop ephemeral database:', error)
        // Не бросаем ошибку в teardown, чтобы не блокировать завершение
      }
    }
    
  } catch (error) {
    console.error('❌ Integration Tests: Failed to start ephemeral database:', error)
    throw error
  }
}

// END OF: tests/integration/global-setup.ts