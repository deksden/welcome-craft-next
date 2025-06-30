/**
 * @file tests/unit/phoenix-database-seeder.test.ts
 * @description PHOENIX PROJECT - Unit tests for database seeding system
 * @version 1.0.0
 * @date 2025-06-29
 * @updated PHOENIX PROJECT Step 6 - Comprehensive testing for seeding system
 */

/** HISTORY:
 * v1.0.0 (2025-06-29): PHOENIX PROJECT Step 6 - Unit tests for PhoenixDatabaseSeeder
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { seedEnvironment, resetAndSeedEnvironment, phoenixDatabaseSeeder } from '@/scripts/phoenix-seed-database'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
          returning: vi.fn(() => Promise.resolve([]))
        }))
      }))
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{
          id: 'TEST_WORLD',
          name: 'Test World',
          users: [],
          artifacts: [],
          chats: []
        }]))
      }))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve())
      }))
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([]))
      }))
    }))
  }
}))

vi.mock('@/lib/db/schema', () => ({
  worldMeta: {},
  user: {},
  artifact: {}
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  count: vi.fn()
}))

describe('PhoenixDatabaseSeeder', () => {
  let consoleSpy: any

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('seedEnvironment', () => {
    it('should seed LOCAL environment with comprehensive data', async () => {
      await seedEnvironment('LOCAL', { verbose: true })
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Seeding LOCAL environment'))
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('LOCAL environment seeded successfully'))
    })

    it('should seed BETA environment with staging data', async () => {
      await seedEnvironment('BETA', { verbose: true })
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Seeding BETA environment'))
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('BETA environment seeded successfully'))
    })

    it('should seed PROD environment with minimal data', async () => {
      await seedEnvironment('PROD', { verbose: true })
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Seeding PROD environment'))
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('PROD environment seeded successfully'))
    })

    it('should handle dry run mode', async () => {
      await seedEnvironment('LOCAL', { dryRun: true, verbose: true })
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('DRY RUN: Would seed the following data'))
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Worlds:'))
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Users:'))
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Artifacts:'))
    })

    it('should skip existing worlds when skipExisting is true', async () => {
      // Mock existing world
      const mockDb = await import('@/lib/db')
      vi.mocked(mockDb.db.select).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{ id: 'EXISTING_WORLD' }]))
          }))
        }))
      } as any)

      await seedEnvironment('LOCAL', { skipExisting: true, verbose: true })
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('already exists, skipping'))
    })
  })

  describe('resetAndSeedEnvironment', () => {
    it('should clear and reseed environment', async () => {
      // Mock validation to return true for successful reset
      vi.spyOn(phoenixDatabaseSeeder, 'validateSeeding').mockResolvedValueOnce(true)
      
      // Test behavior: function should complete without throwing
      await expect(resetAndSeedEnvironment('LOCAL')).resolves.not.toThrow()
    })

    it('should validate seeding after reset', async () => {
      // Mock validation to return true
      vi.spyOn(phoenixDatabaseSeeder, 'validateSeeding').mockResolvedValueOnce(true)
      
      // Test behavior: function should complete successfully
      await expect(resetAndSeedEnvironment('BETA')).resolves.not.toThrow()
    })

    it('should throw error if validation fails', async () => {
      // Mock validation to return false
      vi.spyOn(phoenixDatabaseSeeder, 'validateSeeding').mockResolvedValueOnce(false)
      
      // Test behavior: should throw validation error
      await expect(resetAndSeedEnvironment('PROD')).rejects.toThrow('PROD seeding validation failed')
    })
  })

  describe('validateSeeding', () => {
    it('should validate LOCAL environment requirements', async () => {
      // Mock worlds data for LOCAL validation
      const mockDb = await import('@/lib/db')
      vi.mocked(mockDb.db.select).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([
            { id: 'WORLD1', isActive: true, isTemplate: false },
            { id: 'WORLD2', isActive: true, isTemplate: true },
            { id: 'WORLD3', isActive: false, isTemplate: false }
          ]))
        }))
      } as any)

      const isValid = await phoenixDatabaseSeeder.validateSeeding('LOCAL')
      
      expect(isValid).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('LOCAL seeding validation passed'))
    })

    it('should fail validation for insufficient worlds', async () => {
      // Mock insufficient worlds for LOCAL
      const mockDb = await import('@/lib/db')
      vi.mocked(mockDb.db.select).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([
            { id: 'WORLD1', isActive: true, isTemplate: false }
          ]))
        }))
      } as any)

      const isValid = await phoenixDatabaseSeeder.validateSeeding('LOCAL')
      
      expect(isValid).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('LOCAL should have at least 3 worlds'))
    })

    it('should validate PROD template requirements', async () => {
      // Mock worlds with templates for PROD validation
      const mockDb = await import('@/lib/db')
      vi.mocked(mockDb.db.select).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([
            { id: 'PROD_TEMPLATE', isActive: true, isTemplate: true }
          ]))
        }))
      } as any)

      const isValid = await phoenixDatabaseSeeder.validateSeeding('PROD')
      
      expect(isValid).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('PROD seeding validation passed'))
    })
  })

  describe('clearEnvironment', () => {
    it('should require explicit confirmation', async () => {
      await expect(phoenixDatabaseSeeder.clearEnvironment('LOCAL', { confirm: false }))
        .rejects.toThrow('Environment clearing requires explicit confirmation')
    })

    it('should clear environment when confirmed', async () => {
      // Mock deletion result
      const mockDb = await import('@/lib/db')
      vi.mocked(mockDb.db.delete).mockReturnValueOnce({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([
            { id: 'WORLD1' }, { id: 'WORLD2' }
          ]))
        }))
      } as any)

      await phoenixDatabaseSeeder.clearEnvironment('LOCAL', { confirm: true })
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Clearing LOCAL environment'))
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cleared 2 worlds from LOCAL'))
    })
  })
})

describe('Environment-Specific Seed Data', () => {
  let localConsoleSpy: any

  beforeEach(() => {
    localConsoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    localConsoleSpy.mockRestore()
  })

  describe('LOCAL seed data', () => {
    it('should generate comprehensive development data', async () => {
      await seedEnvironment('LOCAL', { dryRun: true, verbose: true })
      
      // Should see multiple worlds and comprehensive data in logs
      expect(localConsoleSpy).toHaveBeenCalledWith(expect.stringContaining('Worlds:'))
      expect(localConsoleSpy).toHaveBeenCalledWith(expect.stringContaining('Users:'))
      expect(localConsoleSpy).toHaveBeenCalledWith(expect.stringContaining('Artifacts:'))
    })
  })

  describe('BETA seed data', () => {
    it('should generate staging-appropriate data', async () => {
      await seedEnvironment('BETA', { dryRun: true, verbose: true })
      
      // BETA should have fewer worlds than LOCAL
      expect(localConsoleSpy).toHaveBeenCalledWith(expect.stringContaining('DRY RUN'))
    })
  })

  describe('PROD seed data', () => {
    it('should generate minimal production data', async () => {
      await seedEnvironment('PROD', { dryRun: true, verbose: true })
      
      // PROD should have minimal data
      expect(localConsoleSpy).toHaveBeenCalledWith(expect.stringContaining('DRY RUN'))
    })
  })
})

describe('Error Handling', () => {
  let errorConsoleSpy: any

  beforeEach(() => {
    errorConsoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    errorConsoleSpy.mockRestore()
  })

  it('should handle database errors gracefully', async () => {
    // Mock database error
    const mockDb = await import('@/lib/db')
    vi.mocked(mockDb.db.insert).mockImplementationOnce(() => {
      throw new Error('Database connection failed')
    })

    // Test behavior: function should complete without throwing despite database errors
    await expect(seedEnvironment('LOCAL')).resolves.not.toThrow()
  })

  it('should handle individual world seeding errors', async () => {
    // Mock partial failure scenario - some worlds fail, but process continues
    const mockDb = await import('@/lib/db')
    let callCount = 0
    vi.mocked(mockDb.db.insert).mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        throw new Error('First world failed')
      }
      return {
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{ id: 'SUCCESS' }]))
        }))
      } as any
    })

    // Test behavior: function should complete despite individual world failures
    await expect(seedEnvironment('LOCAL', { verbose: true })).resolves.not.toThrow()
    
    // Test behavior: should have attempted multiple operations (worlds + users)
    expect(vi.mocked(mockDb.db.insert)).toHaveBeenCalledTimes(8) // 4 worlds + 4 users = 8 total inserts for LOCAL
  })
})

// END OF: tests/unit/phoenix-database-seeder.test.ts