/**
 * @file tests/unit/helpers/world-validator.test.ts
 * @description Unit тесты для валидации тестовых миров
 * @version 1.0.0
 * @date 2025-06-18
 * @updated Создание быстрых unit тестов для валидации миров
 */

/** HISTORY:
 * v1.0.0 (2025-06-18): Создание unit тестов для быстрой валидации миров в CI/CD
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { validateAllWorlds, validateSingleWorld } from '../../helpers/world-validator'
import type { ValidationReport, } from '../../helpers/world-validator'

describe('World Validator', () => {
  let validationReport: ValidationReport

  beforeAll(async () => {
    // Запускаем валидацию один раз для всех тестов
    validationReport = await validateAllWorlds()
  })

  describe('Comprehensive World Validation', () => {
    it('should validate all worlds successfully', () => {
      expect(validationReport.totalWorlds).toBe(5)
      expect(validationReport.totalErrors).toBe(0)
      expect(validationReport.validWorlds).toBe(5)
      expect(validationReport.invalidWorlds).toBe(0)
    })

    it('should complete validation within reasonable time', () => {
      // Валидация должна быть быстрой (менее 500ms для всех миров)
      expect(validationReport.performance.totalTime).toBeLessThan(500)
      expect(validationReport.performance.averageTimePerWorld).toBeLessThan(100)
    })

    it('should validate all expected worlds', () => {
      const expectedWorlds = [
        'CLEAN_USER_WORKSPACE',
        'SITE_READY_FOR_PUBLICATION', 
        'CONTENT_LIBRARY_BASE',
        'DEMO_PREPARATION',
        'ENTERPRISE_ONBOARDING'
      ]

      const worldIds = validationReport.results.map(r => r.worldId)
      expectedWorlds.forEach(worldId => {
        expect(worldIds).toContain(worldId)
      })
    })
  })

  describe('Individual World Validation', () => {
    it('should validate CLEAN_USER_WORKSPACE correctly', () => {
      const world = validationReport.results.find(r => r.worldId === 'CLEAN_USER_WORKSPACE')
      expect(world).toBeDefined()
      expect(world?.isValid).toBe(true)
      expect(world?.errors).toHaveLength(0)
      expect(world?.fixtures.length).toBeGreaterThan(0)
    })

    it('should validate SITE_READY_FOR_PUBLICATION correctly', () => {
      const world = validationReport.results.find(r => r.worldId === 'SITE_READY_FOR_PUBLICATION')
      expect(world).toBeDefined()
      expect(world?.isValid).toBe(true)
      expect(world?.errors).toHaveLength(0)
      expect(world?.fixtures.length).toBeGreaterThan(0)
    })

    it('should validate CONTENT_LIBRARY_BASE correctly', () => {
      const world = validationReport.results.find(r => r.worldId === 'CONTENT_LIBRARY_BASE')
      expect(world).toBeDefined()
      expect(world?.isValid).toBe(true)
      expect(world?.errors).toHaveLength(0)
      expect(world?.fixtures.length).toBeGreaterThan(0)
    })

    it('should validate DEMO_PREPARATION correctly', () => {
      const world = validationReport.results.find(r => r.worldId === 'DEMO_PREPARATION')
      expect(world).toBeDefined()
      expect(world?.isValid).toBe(true)
      expect(world?.errors).toHaveLength(0)
      expect(world?.fixtures.length).toBeGreaterThan(0)
    })

    it('should validate ENTERPRISE_ONBOARDING correctly', () => {
      const world = validationReport.results.find(r => r.worldId === 'ENTERPRISE_ONBOARDING')
      expect(world).toBeDefined()
      expect(world?.isValid).toBe(true)
      expect(world?.errors).toHaveLength(0)
      expect(world?.fixtures.length).toBeGreaterThan(0)
    })
  })

  describe('Fixture File Validation', () => {
    it('should validate all fixture files exist and are readable', () => {
      validationReport.results.forEach(world => {
        world.fixtures.forEach(fixture => {
          expect(fixture.exists).toBe(true)
          expect(fixture.isValid).toBe(true)
          expect(fixture.errors).toHaveLength(0)
          expect(fixture.size).toBeGreaterThan(0)
        })
      })
    })

    it('should properly detect content types', () => {
      validationReport.results.forEach(world => {
        world.fixtures.forEach(fixture => {
          expect(['text', 'json', 'csv', 'unknown']).toContain(fixture.contentType)
        })
      })
    })

    it('should validate JSON files correctly', () => {
      const jsonFixtures = validationReport.results
        .flatMap(w => w.fixtures)
        .filter(f => f.contentType === 'json')

      expect(jsonFixtures.length).toBeGreaterThan(0)
      jsonFixtures.forEach(fixture => {
        expect(fixture.isValid).toBe(true)
        expect(fixture.errors).toHaveLength(0)
      })
    })

    it('should validate CSV files correctly', () => {
      const csvFixtures = validationReport.results
        .flatMap(w => w.fixtures)
        .filter(f => f.contentType === 'csv')

      expect(csvFixtures.length).toBeGreaterThan(0)
      csvFixtures.forEach(fixture => {
        expect(fixture.isValid).toBe(true)
        expect(fixture.errors).toHaveLength(0)
      })
    })

    it('should validate text/markdown files correctly', () => {
      const textFixtures = validationReport.results
        .flatMap(w => w.fixtures)
        .filter(f => f.contentType === 'text')

      expect(textFixtures.length).toBeGreaterThan(0)
      textFixtures.forEach(fixture => {
        expect(fixture.isValid).toBe(true)
        expect(fixture.errors).toHaveLength(0)
      })
    })
  })

  describe('Performance Validation', () => {
    it('should have reasonable fixture check counts', () => {
      validationReport.results.forEach(world => {
        expect(world.performance.fixtureChecks).toBeGreaterThan(0)
        expect(world.performance.fixtureChecks).toBeLessThan(20) // reasonable upper limit
      })
    })

    it('should complete individual world validation quickly', () => {
      validationReport.results.forEach(world => {
        expect(world.performance.totalTime).toBeLessThan(100) // < 100ms per world
      })
    })
  })

  describe('Single World Validation', async () => {
    it('should validate a single world correctly', async () => {
      const result = await validateSingleWorld('CLEAN_USER_WORKSPACE')
      
      expect(result.worldId).toBe('CLEAN_USER_WORKSPACE')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.fixtures.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should not have any validation errors across all worlds', () => {
      expect(validationReport.totalErrors).toBe(0)
      
      validationReport.results.forEach(world => {
        if (world.errors.length > 0) {
          console.error(`❌ World ${world.worldId} has errors:`, world.errors)
        }
        expect(world.errors).toHaveLength(0)
      })
    })

    it('should not have critical warnings', () => {
      const criticalWarnings = validationReport.results
        .flatMap(w => w.warnings)
        .filter(w => w.type !== 'performance_concern')

      expect(criticalWarnings).toHaveLength(0)
    })
  })
})

// END OF: tests/unit/helpers/world-validator.test.ts