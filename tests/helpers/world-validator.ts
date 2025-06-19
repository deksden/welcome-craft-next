/**
 * @file tests/helpers/world-validator.ts
 * @description Комплексная система валидации тестовых миров для обеспечения корректности и работоспособности
 * @version 1.0.0
 * @date 2025-06-18
 * @updated Создание для системной оптимизации E2E тестов
 */

/** HISTORY:
 * v1.0.0 (2025-06-18): Создание комплексной системы валидации миров с проверкой fixture файлов и зависимостей
 */

import { readFile, access } from 'node:fs/promises'
import { join } from 'node:path'
import { WORLDS, type WorldId, validateWorld } from './worlds.config'

/**
 * @description Результат валидации мира
 */
export interface WorldValidationResult {
  worldId: WorldId
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  fixtures: FixtureValidationResult[]
  performance: {
    totalTime: number
    fixtureChecks: number
  }
}

/**
 * @description Ошибка валидации
 */
export interface ValidationError {
  type: 'missing_fixture' | 'invalid_json' | 'missing_dependency' | 'invalid_user_ref'
  message: string
  details?: any
}

/**
 * @description Предупреждение валидации
 */
export interface ValidationWarning {
  type: 'large_fixture' | 'unused_fixture' | 'performance_concern'
  message: string
  details?: any
}

/**
 * @description Результат валидации fixture файла
 */
export interface FixtureValidationResult {
  path: string
  exists: boolean
  size?: number
  isValid: boolean
  contentType: 'text' | 'json' | 'csv' | 'unknown'
  errors: string[]
}

/**
 * @description Сводный отчет валидации всех миров
 */
export interface ValidationReport {
  timestamp: string
  totalWorlds: number
  validWorlds: number
  invalidWorlds: number
  totalErrors: number
  totalWarnings: number
  results: WorldValidationResult[]
  performance: {
    totalTime: number
    averageTimePerWorld: number
  }
}

/**
 * @description Валидатор тестовых миров
 */
export class WorldValidator {
  private fixturesPath: string
  
  constructor() {
    this.fixturesPath = join(process.cwd(), 'tests/fixtures/worlds')
  }

  /**
   * @description Валидация всех миров
   */
  async validateAllWorlds(): Promise<ValidationReport> {
    const startTime = Date.now()
    console.log('🔍 WORLD VALIDATOR: Starting comprehensive validation of all worlds...')
    
    const worldIds = Object.keys(WORLDS) as WorldId[]
    const results: WorldValidationResult[] = []
    
    // Валидируем каждый мир параллельно для скорости
    const validationPromises = worldIds.map(worldId => this.validateWorld(worldId))
    const worldResults = await Promise.all(validationPromises)
    results.push(...worldResults)
    
    const totalTime = Date.now() - startTime
    const validWorlds = results.filter(r => r.isValid).length
    const invalidWorlds = results.length - validWorlds
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0)
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0)
    
    const report: ValidationReport = {
      timestamp: new Date().toISOString(),
      totalWorlds: results.length,
      validWorlds,
      invalidWorlds,
      totalErrors,
      totalWarnings,
      results,
      performance: {
        totalTime,
        averageTimePerWorld: Math.round(totalTime / results.length)
      }
    }
    
    console.log(`✅ WORLD VALIDATOR: Validation complete in ${totalTime}ms`)
    console.log(`📊 Results: ${validWorlds}/${results.length} worlds valid, ${totalErrors} errors, ${totalWarnings} warnings`)
    
    return report
  }

  /**
   * @description Валидация конкретного мира
   */
  async validateWorld(worldId: WorldId): Promise<WorldValidationResult> {
    const startTime = Date.now()
    console.log(`🔍 Validating world: ${worldId}`)
    
    const result: WorldValidationResult = {
      worldId,
      isValid: true,
      errors: [],
      warnings: [],
      fixtures: [],
      performance: {
        totalTime: 0,
        fixtureChecks: 0
      }
    }
    
    try {
      // ЭТАП 1: Базовая валидация структуры мира
      try {
        validateWorld(worldId)
      } catch (error) {
        result.errors.push({
          type: 'invalid_user_ref',
          message: `World structure validation failed: ${error instanceof Error ? error.message : String(error)}`
        })
        result.isValid = false
      }
      
      const worldDef = WORLDS[worldId]
      
      // ЭТАП 2: Валидация fixture файлов для артефактов
      for (const artifact of worldDef.artifacts) {
        if (artifact.contentPath) {
          const fixtureResult = await this.validateFixture(worldId, artifact.contentPath, artifact.kind)
          result.fixtures.push(fixtureResult)
          result.performance.fixtureChecks++
          
          if (!fixtureResult.isValid) {
            result.errors.push({
              type: 'missing_fixture',
              message: `Artifact ${artifact.testId} has invalid fixture: ${artifact.contentPath}`,
              details: fixtureResult.errors
            })
            result.isValid = false
          }
        }
      }
      
      // ЭТАП 3: Валидация fixture файлов для чатов
      for (const chat of worldDef.chats) {
        if (chat.messagesPath) {
          const fixtureResult = await this.validateFixture(worldId, chat.messagesPath, 'json')
          result.fixtures.push(fixtureResult)
          result.performance.fixtureChecks++
          
          if (!fixtureResult.isValid) {
            result.errors.push({
              type: 'missing_fixture',
              message: `Chat ${chat.testId} has invalid messages fixture: ${chat.messagesPath}`,
              details: fixtureResult.errors
            })
            result.isValid = false
          }
        }
      }
      
      // ЭТАП 4: Проверка зависимостей между мирами
      if (worldDef.dependencies) {
        for (const depId of worldDef.dependencies) {
          if (!WORLDS[depId]) {
            result.errors.push({
              type: 'missing_dependency',
              message: `World ${worldId} depends on non-existent world: ${depId}`
            })
            result.isValid = false
          }
        }
      }
      
      // ЭТАП 5: Performance warnings
      if (result.fixtures.length > 10) {
        result.warnings.push({
          type: 'performance_concern',
          message: `World ${worldId} has ${result.fixtures.length} fixtures, which may slow down setup`
        })
      }
      
      result.performance.totalTime = Date.now() - startTime
      
      if (result.isValid) {
        console.log(`✅ World ${worldId} validation passed (${result.performance.totalTime}ms)`)
      } else {
        console.log(`❌ World ${worldId} validation failed with ${result.errors.length} errors`)
      }
      
    } catch (error) {
      result.errors.push({
        type: 'missing_fixture',
        message: `Unexpected validation error: ${error instanceof Error ? error.message : String(error)}`
      })
      result.isValid = false
    }
    
    return result
  }

  /**
   * @description Валидация конкретного fixture файла
   */
  private async validateFixture(worldId: WorldId, fixturePath: string, expectedKind: string): Promise<FixtureValidationResult> {
    const worldDir = this.getWorldDirectory(worldId)
    const fullPath = join(this.fixturesPath, worldDir, fixturePath)
    
    const result: FixtureValidationResult = {
      path: fixturePath,
      exists: false,
      isValid: false,
      contentType: 'unknown',
      errors: []
    }
    
    try {
      // Проверка существования файла
      await access(fullPath)
      result.exists = true
      
      // Получение размера файла
      const content = await readFile(fullPath, 'utf-8')
      result.size = content.length
      
      // Определение типа контента
      result.contentType = this.detectContentType(fixturePath, content)
      
      // Валидация содержимого в зависимости от типа
      const validationErrors = this.validateContent(content, result.contentType, expectedKind)
      result.errors = validationErrors
      result.isValid = validationErrors.length === 0
      
      // Предупреждения о размере
      if (result.size > 100000) { // 100KB
        result.errors.push(`Large fixture file: ${Math.round(result.size / 1024)}KB`)
      }
      
    } catch (error) {
      result.errors.push(`File not accessible: ${error instanceof Error ? error.message : String(error)}`)
    }
    
    return result
  }

  /**
   * @description Определение директории мира
   */
  private getWorldDirectory(worldId: WorldId): string {
    const dirMap: Record<WorldId, string> = {
      'CLEAN_USER_WORKSPACE': 'base',
      'SITE_READY_FOR_PUBLICATION': 'publication',
      'CONTENT_LIBRARY_BASE': 'library',
      'DEMO_PREPARATION': 'demo',
      'ENTERPRISE_ONBOARDING': 'enterprise'
    }
    
    return dirMap[worldId] || worldId.toLowerCase()
  }

  /**
   * @description Определение типа контента
   */
  private detectContentType(filePath: string, content: string): 'text' | 'json' | 'csv' | 'unknown' {
    if (filePath.endsWith('.json')) {
      return 'json'
    }
    if (filePath.endsWith('.csv')) {
      return 'csv'
    }
    if (filePath.endsWith('.md') || filePath.endsWith('.txt')) {
      return 'text'
    }
    
    // Попытка определения по содержимому
    const trimmed = content.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return 'json'
    }
    if (trimmed.includes(',') && trimmed.split('\n').length > 1) {
      return 'csv'
    }
    
    return 'text'
  }

  /**
   * @description Валидация содержимого файла
   */
  private validateContent(content: string, contentType: string, expectedKind: string): string[] {
    const errors: string[] = []
    
    if (!content || content.trim().length === 0) {
      errors.push('Empty file')
      return errors
    }
    
    switch (contentType) {
      case 'json':
        try {
          const parsed = JSON.parse(content)
          if (expectedKind === 'site') {
            // Валидация структуры сайта
            if (!parsed.blocks || !Array.isArray(parsed.blocks)) {
              errors.push('Site JSON missing blocks array')
            }
            if (!parsed.metadata) {
              errors.push('Site JSON missing metadata')
            }
          }
        } catch (error) {
          errors.push(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
        }
        break
        
      case 'csv': {
        const lines = content.split('\n').filter(line => line.trim())
        if (lines.length < 2) {
          errors.push('CSV file should have header and at least one data row')
        }
        break
      }
        
      case 'text':
        if (content.length < 10) {
          errors.push('Text content seems too short')
        }
        break
    }
    
    return errors
  }

  /**
   * @description Создание детального отчета валидации
   */
  generateDetailedReport(report: ValidationReport): string {
    const lines: string[] = []
    
    lines.push('🔍 WORLD VALIDATION REPORT')
    lines.push('=' .repeat(50))
    lines.push(`📅 Timestamp: ${report.timestamp}`)
    lines.push(`⏱️  Total Time: ${report.performance.totalTime}ms`)
    lines.push(`📊 Summary: ${report.validWorlds}/${report.totalWorlds} worlds valid`)
    lines.push(`❌ Errors: ${report.totalErrors}`)
    lines.push(`⚠️  Warnings: ${report.totalWarnings}`)
    lines.push('')
    
    // Детали по каждому миру
    for (const result of report.results) {
      lines.push(`🌍 World: ${result.worldId}`)
      lines.push(`   Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`)
      lines.push(`   Fixtures: ${result.fixtures.length} checked`)
      lines.push(`   Time: ${result.performance.totalTime}ms`)
      
      if (result.errors.length > 0) {
        lines.push('   Errors:')
        result.errors.forEach(error => {
          lines.push(`     - ${error.message}`)
        })
      }
      
      if (result.warnings.length > 0) {
        lines.push('   Warnings:')
        result.warnings.forEach(warning => {
          lines.push(`     - ${warning.message}`)
        })
      }
      
      lines.push('')
    }
    
    return lines.join('\n')
  }
}

/**
 * @description Основной экспортируемый экземпляр валидатора
 */
export const worldValidator = new WorldValidator()

/**
 * @description Быстрая валидация всех миров
 */
export async function validateAllWorlds(): Promise<ValidationReport> {
  return await worldValidator.validateAllWorlds()
}

/**
 * @description Быстрая валидация конкретного мира
 */
export async function validateSingleWorld(worldId: WorldId): Promise<WorldValidationResult> {
  return await worldValidator.validateWorld(worldId)
}

// END OF: tests/helpers/world-validator.ts