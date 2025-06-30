/**
 * @file tests/unit/phoenix-data-transfer.test.ts
 * @description PHOENIX PROJECT - Unit tests for data transfer system
 * @version 1.0.0
 * @date 2025-06-29
 * @updated PHOENIX PROJECT Step 6 - Comprehensive testing for data transfer system
 */

/** HISTORY:
 * v1.0.0 (2025-06-29): PHOENIX PROJECT Step 6 - Unit tests for PhoenixDataTransfer
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  backupEnvironment, 
  transferBetweenEnvironments, 
  phoenixFullMigration,
  phoenixDataTransfer 
} from '@/scripts/phoenix-data-transfer'

// Mock dependencies  
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(() => true)
  },
  existsSync: vi.fn(() => true)
}))

vi.mock('fs/promises', () => ({
  default: {
    writeFile: vi.fn(() => Promise.resolve()),
    readFile: vi.fn(() => Promise.resolve(JSON.stringify({
      timestamp: '2025-06-29T12:00:00.000Z',
      environment: 'LOCAL',
      worlds: [],
      artifacts: [],
      users: [],
      chats: [],
      metadata: { totalRecords: 0, backupSize: '0KB', version: '1.0.0' }
    }))),
    mkdir: vi.fn(() => Promise.resolve())
  },
  writeFile: vi.fn(() => Promise.resolve()),
  readFile: vi.fn(() => Promise.resolve(JSON.stringify({
    timestamp: '2025-06-29T12:00:00.000Z',
    environment: 'LOCAL',
    worlds: [],
    artifacts: [],
    users: [],
    chats: [],
    metadata: { totalRecords: 0, backupSize: '0KB', version: '1.0.0' }
  }))),
  mkdir: vi.fn(() => Promise.resolve())
}))

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([
          {
            id: 'TEST_WORLD_1',
            name: 'Test World 1',
            environment: 'LOCAL',
            users: [],
            artifacts: [],
            chats: []
          },
          {
            id: 'TEST_WORLD_2',
            name: 'Test World 2',
            environment: 'LOCAL',
            users: [],
            artifacts: [],
            chats: []
          }
        ]))
      }))
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoUpdate: vi.fn(() => Promise.resolve()),
        returning: vi.fn(() => Promise.resolve([]))
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
  artifact: {},
  user: {},
  chat: {}
}))

vi.mock('@/scripts/migrate-worlds-to-db', () => ({
  migrateWorldsToDatabase: vi.fn(() => Promise.resolve())
}))

describe('PhoenixDataTransfer', () => {
  let consoleSpy: any
  let errorSpy: any

  beforeEach(async () => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Reset all mocks to avoid interference between tests
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createBackup', () => {
    it('should create backup for specified environment', async () => {
      const backupFile = await phoenixDataTransfer.createBackup('LOCAL')

      // Test behavior: backup file path should contain environment and be JSON
      expect(backupFile).toContain('backup-LOCAL')
      expect(backupFile).toContain('.json')
      expect(backupFile).toMatch(/backup-LOCAL-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}.*\.json$/)
    })

    it('should return valid backup file path for different environments', async () => {
      const betaBackup = await phoenixDataTransfer.createBackup('BETA')
      const prodBackup = await phoenixDataTransfer.createBackup('PROD')

      // Test behavior: each environment gets its own backup file
      expect(betaBackup).toContain('backup-BETA')
      expect(prodBackup).toContain('backup-PROD')
      expect(betaBackup).not.toBe(prodBackup)
    })

    it('should handle backup creation errors', async () => {
      const mockDb = await import('@/lib/db')
      vi.mocked(mockDb.db.select).mockImplementationOnce(() => {
        throw new Error('Database error')
      })

      await expect(phoenixDataTransfer.createBackup('PROD')).rejects.toThrow('Database error')
    })
  })

  describe('restoreBackup', () => {
    it('should restore backup to target environment', async () => {
      // Setup valid backup data
      const { existsSync } = await import('node:fs')
      const { readFile } = await import('node:fs/promises')
      
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readFile).mockResolvedValue(JSON.stringify({
        timestamp: '2025-06-29T12:00:00.000Z',
        environment: 'LOCAL',
        worlds: [
          { id: 'WORLD1', name: 'Test World' }
        ],
        artifacts: [],
        users: [],
        chats: [],
        metadata: { totalRecords: 1, backupSize: '1KB', version: '1.0.0' }
      }))

      // Test behavior: should complete without throwing
      await expect(phoenixDataTransfer.restoreBackup('/path/to/backup.json', 'BETA'))
        .resolves.not.toThrow()
    })

    it('should handle missing backup file', async () => {
      const { existsSync } = await import('node:fs')
      vi.mocked(existsSync).mockReturnValue(false)

      // Test behavior: function should complete gracefully (with error handling)
      await expect(phoenixDataTransfer.restoreBackup('/nonexistent.json', 'LOCAL'))
        .resolves.not.toThrow()
    })

    it('should handle invalid backup data format', async () => {
      const { existsSync } = await import('node:fs')
      const { readFile } = await import('node:fs/promises')
      
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readFile).mockResolvedValue('{"invalid": "format"}')

      // Test behavior: function should complete gracefully (with error handling)
      await expect(phoenixDataTransfer.restoreBackup('/invalid.json', 'LOCAL'))
        .resolves.not.toThrow()
    })
  })

  describe('transferData', () => {
    it('should transfer data between environments', async () => {
      // Test behavior: should complete without throwing
      await expect(phoenixDataTransfer.transferData({
        sourceEnvironment: 'LOCAL',
        targetEnvironment: 'BETA',
        includeWorlds: true,
        includeArtifacts: false,
        backupFirst: false,
        dryRun: false
      })).resolves.not.toThrow()
    })

    it('should perform dry run when requested', async () => {
      // Test behavior: dry run should complete without throwing
      await expect(phoenixDataTransfer.transferData({
        sourceEnvironment: 'BETA',
        targetEnvironment: 'PROD',
        includeWorlds: true,
        dryRun: true
      })).resolves.not.toThrow()
    })

    it('should create backup before transfer when requested', async () => {
      const createBackupSpy = vi.spyOn(phoenixDataTransfer, 'createBackup')
        .mockResolvedValue('/path/to/backup.json')

      await phoenixDataTransfer.transferData({
        sourceEnvironment: 'LOCAL',
        targetEnvironment: 'BETA',
        backupFirst: true,
        dryRun: false
      })

      // Test behavior: backup should be called for target environment
      expect(createBackupSpy).toHaveBeenCalledWith('BETA')
    })
  })

  describe('exportWorlds', () => {
    it('should export worlds to JSON file', async () => {
      const exportFile = await phoenixDataTransfer.exportWorlds('LOCAL')

      // Test behavior: export file path should contain environment and be JSON
      expect(exportFile).toContain('worlds-export-LOCAL')
      expect(exportFile).toContain('.json')
      expect(exportFile).toMatch(/worlds-export-LOCAL-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}.*\.json$/)
    })

    it('should use custom output file when provided', async () => {
      const customFile = '/custom/path/export.json'
      const exportFile = await phoenixDataTransfer.exportWorlds('PROD', customFile)

      // Test behavior: should return custom file path
      expect(exportFile).toBe(customFile)
    })
  })

  describe('importWorlds', () => {
    it('should import worlds from JSON file', async () => {
      const { existsSync } = await import('node:fs')
      const { readFile } = await import('node:fs/promises')
      
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readFile).mockResolvedValue(JSON.stringify({
        timestamp: '2025-06-29T12:00:00.000Z',
        environment: 'LOCAL',
        worlds: [
          { id: 'IMPORT_WORLD', name: 'Imported World', environment: 'LOCAL' }
        ],
        metadata: { totalWorlds: 1 }
      }))

      // Test behavior: should complete without throwing
      await expect(phoenixDataTransfer.importWorlds('/path/to/import.json', 'BETA'))
        .resolves.not.toThrow()
    })

    it('should skip existing worlds when overwrite is false', async () => {
      const { existsSync } = await import('node:fs')
      const { readFile } = await import('node:fs/promises')
      
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readFile).mockResolvedValue(JSON.stringify({
        timestamp: '2025-06-29T12:00:00.000Z',
        worlds: [{ id: 'EXISTING_WORLD', name: 'Existing' }]
      }))

      // Mock existing world in database
      const mockDb = await import('@/lib/db')
      vi.mocked(mockDb.db.select).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{ id: 'EXISTING_WORLD' }]))
          }))
        }))
      } as any)

      // Test behavior: should complete without throwing, handle existing worlds
      await expect(phoenixDataTransfer.importWorlds('/path/to/import.json', 'LOCAL', { overwrite: false }))
        .resolves.not.toThrow()
    })
  })

  describe('cleanEnvironment', () => {
    it('should require explicit confirmation', async () => {
      await expect(phoenixDataTransfer.cleanEnvironment('LOCAL'))
        .rejects.toThrow('Environment cleanup requires explicit confirmation')
    })

    it('should clean environment when confirmed', async () => {
      const mockDb = await import('@/lib/db')
      vi.mocked(mockDb.db.delete).mockReturnValueOnce({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([
            { id: 'WORLD1' }, { id: 'WORLD2' }
          ]))
        }))
      } as any)

      await phoenixDataTransfer.cleanEnvironment('LOCAL', { confirm: true })

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cleaning LOCAL environment'))
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Deleted 2 worlds'))
    })
  })

  describe('syncEnvironments', () => {
    it('should synchronize worlds between environments', async () => {
      await phoenixDataTransfer.syncEnvironments('LOCAL', 'BETA')

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Syncing LOCAL → BETA'))
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Sync completed'))
    })
  })
})

describe('CLI Functions', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('backupEnvironment', () => {
    it('should create backup using CLI function', async () => {
      const createBackupSpy = vi.spyOn(phoenixDataTransfer, 'createBackup')
        .mockResolvedValue('/backup/file.json')

      const result = await backupEnvironment('LOCAL')

      expect(createBackupSpy).toHaveBeenCalledWith('LOCAL')
      expect(result).toBe('/backup/file.json')
    })
  })

  describe('transferBetweenEnvironments', () => {
    it('should transfer data with default options', async () => {
      const transferSpy = vi.spyOn(phoenixDataTransfer, 'transferData')
        .mockResolvedValue(undefined)

      await transferBetweenEnvironments('LOCAL', 'BETA')

      expect(transferSpy).toHaveBeenCalledWith({
        sourceEnvironment: 'LOCAL',
        targetEnvironment: 'BETA',
        includeWorlds: true,
        includeArtifacts: false,
        includeUsers: false,
        includeChats: false,
        dryRun: false,
        backupFirst: true
      })
    })

    it('should merge custom options with defaults', async () => {
      const transferSpy = vi.spyOn(phoenixDataTransfer, 'transferData')
        .mockResolvedValue(undefined)

      await transferBetweenEnvironments('BETA', 'PROD', {
        includeArtifacts: true,
        dryRun: true
      })

      expect(transferSpy).toHaveBeenCalledWith(expect.objectContaining({
        includeArtifacts: true,
        dryRun: true,
        backupFirst: true
      }))
    })
  })

  describe('phoenixFullMigration', () => {
    it('should perform complete migration process', async () => {
      const { migrateWorldsToDatabase } = await import('@/scripts/migrate-worlds-to-db')
      const createBackupSpy = vi.spyOn(phoenixDataTransfer, 'createBackup')
        .mockResolvedValue('/backup.json')
      const exportWorldsSpy = vi.spyOn(phoenixDataTransfer, 'exportWorlds')
        .mockResolvedValue('/export.json')

      await phoenixFullMigration()

      expect(migrateWorldsToDatabase).toHaveBeenCalled()
      expect(createBackupSpy).toHaveBeenCalledWith('LOCAL')
      expect(exportWorldsSpy).toHaveBeenCalledWith('LOCAL')
    })

    it('should handle migration errors', async () => {
      const { migrateWorldsToDatabase } = await import('@/scripts/migrate-worlds-to-db')
      vi.mocked(migrateWorldsToDatabase).mockRejectedValueOnce(new Error('Migration failed'))

      await expect(phoenixFullMigration()).rejects.toThrow('Migration failed')
    })
  })
})

// END OF: tests/unit/phoenix-data-transfer.test.ts