/**
 * @file tests/unit/phoenix-seed-manager.test.ts
 * @description Unit tests for Phoenix Seed Manager
 * @version 1.0.0
 * @date 2025-06-30
 * @updated Созданы unit тесты для Phoenix Seed Data Management
 */

/** HISTORY:
 * v1.0.0 (2025-06-30): Созданы unit тесты для PhoenixSeedManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PhoenixSeedManager } from '@/lib/phoenix/seed-manager'
import type { SeedData, } from '@/lib/phoenix/seed-manager'
import { existsSync } from 'node:fs'
import { readFile, } from 'node:fs/promises'

// Мокаем file system operations
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    existsSync: vi.fn()
  }
})

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    readFile: vi.fn(),
    writeFile: vi.fn(), 
    mkdir: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn()
  }
})

// Мокаем database connection
vi.mock('drizzle-orm/postgres-js', () => ({
  drizzle: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([]))
        })),
        orderBy: vi.fn(() => Promise.resolve([]))
      }))
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{}]))
      }))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{}]))
      }))
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve([{}]))
    }))
  }))
}))

vi.mock('postgres', () => ({
  default: vi.fn(() => ({
    options: { host: 'localhost' },
    end: vi.fn()
  }))
}))

describe('PhoenixSeedManager', () => {
  let seedManager: PhoenixSeedManager
  const mockDatabaseUrl = 'postgresql://test:test@localhost:5432/test'

  beforeEach(() => {
    vi.clearAllMocks()
    seedManager = new PhoenixSeedManager(mockDatabaseUrl, './test-seeds')
  })

  afterEach(async () => {
    await seedManager.close()
  })

  describe('constructor', () => {
    it('should initialize with database URL and seeds directory', () => {
      expect(seedManager).toBeInstanceOf(PhoenixSeedManager)
    })

    it('should throw error without database URL', () => {
      expect(() => new PhoenixSeedManager()).toThrow('Database URL is required')
    })
  })

  describe('extractBlobIdsFromContent', () => {
    it('should extract blob IDs from various content formats', () => {
      const seedManager = new PhoenixSeedManager(mockDatabaseUrl)
      const content = `
        Test content with blob://example.com/abc123 and
        vercel.blob.url/def456 and
        {"blobId": "ghi789", "other": "data"} and
        <div data-blob-id="jkl012">content</div>
      `
      
      // Используем приватный метод через any cast для тестирования
      const extractMethod = (seedManager as any).extractBlobIdsFromContent.bind(seedManager)
      const blobIds = extractMethod(content)
      
      expect(blobIds).toContain('abc123')
      expect(blobIds).toContain('def456') 
      expect(blobIds).toContain('ghi789')
      expect(blobIds).toContain('jkl012')
    })

    it('should handle JSON content with blob references', () => {
      const seedManager = new PhoenixSeedManager(mockDatabaseUrl)
      const jsonContent = JSON.stringify({
        blocks: [
          { type: 'image', blobId: 'img123' },
          { type: 'file', fileReference: 'file456' }
        ]
      })
      
      const extractMethod = (seedManager as any).extractBlobIdsFromContent.bind(seedManager)
      const blobIds = extractMethod(jsonContent)
      
      expect(blobIds).toContain('img123')
      expect(blobIds).toContain('file456')
    })
  })

  describe('mergeArrayData', () => {
    it('should merge arrays with replace strategy', () => {
      const seedManager = new PhoenixSeedManager(mockDatabaseUrl)
      const existing = [
        { id: 'user1', name: 'User 1', email: 'old@test.com' },
        { id: 'user2', name: 'User 2', email: 'user2@test.com' }
      ]
      const incoming = [
        { id: 'user1', name: 'User 1 Updated', email: 'new@test.com' },
        { id: 'user3', name: 'User 3', email: 'user3@test.com' }
      ]

      const mergeMethod = (seedManager as any).mergeArrayData.bind(seedManager)
      const result = mergeMethod(existing, incoming, 'replace', 'id')

      expect(result).toHaveLength(3)
      expect(result.find((u: any) => u.id === 'user1')?.email).toBe('new@test.com')
      expect(result.find((u: any) => u.id === 'user3')).toBeDefined()
    })

    it('should merge arrays with merge strategy', () => {
      const seedManager = new PhoenixSeedManager(mockDatabaseUrl)
      const existing = [
        { id: 'user1', name: 'User 1', email: 'old@test.com', role: 'admin' }
      ]
      const incoming = [
        { id: 'user1', email: 'new@test.com', lastLogin: '2025-06-30' }
      ]

      const mergeMethod = (seedManager as any).mergeArrayData.bind(seedManager)
      const result = mergeMethod(existing, incoming, 'merge', 'id')

      const user1 = result.find((u: any) => u.id === 'user1')
      expect(user1?.name).toBe('User 1') // сохраняется
      expect(user1?.email).toBe('new@test.com') // обновляется
      expect(user1?.role).toBe('admin') // сохраняется
      expect(user1?.lastLogin).toBe('2025-06-30') // добавляется
    })

    it('should merge arrays with rename strategy', () => {
      const seedManager = new PhoenixSeedManager(mockDatabaseUrl)
      const existing = [
        { id: 'user1', name: 'Existing User 1' }
      ]
      const incoming = [
        { id: 'user1', name: 'Incoming User 1' }
      ]

      const mergeMethod = (seedManager as any).mergeArrayData.bind(seedManager)
      const result = mergeMethod(existing, incoming, 'rename', 'id')

      expect(result).toHaveLength(2)
      expect(result.find((u: any) => u.id === 'user1')?.name).toBe('Existing User 1')
      expect(result.find((u: any) => u.id === 'user1_imported_1')?.name).toBe('Incoming User 1')
    })

    it('should merge arrays with skip strategy', () => {
      const seedManager = new PhoenixSeedManager(mockDatabaseUrl)
      const existing = [
        { id: 'user1', name: 'Existing User 1' }
      ]
      const incoming = [
        { id: 'user1', name: 'Incoming User 1' },
        { id: 'user2', name: 'New User 2' }
      ]

      const mergeMethod = (seedManager as any).mergeArrayData.bind(seedManager)
      const result = mergeMethod(existing, incoming, 'skip', 'id')

      expect(result).toHaveLength(2)
      expect(result.find((u: any) => u.id === 'user1')?.name).toBe('Existing User 1')
      expect(result.find((u: any) => u.id === 'user2')?.name).toBe('New User 2')
    })
  })

  describe('generateUniqueId', () => {
    it('should generate unique ID with counter', () => {
      const seedManager = new PhoenixSeedManager(mockDatabaseUrl)
      const existingIds = new Set(['user1', 'user1_imported_1', 'user1_imported_2'])
      
      const generateMethod = (seedManager as any).generateUniqueId.bind(seedManager)
      const uniqueId = generateMethod('user1', existingIds)
      
      expect(uniqueId).toBe('user1_imported_3')
    })
  })

  describe('validateSeed', () => {
    it('should validate correct seed structure', async () => {
      const mockSeedData: SeedData = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        source: {
          worldId: 'TEST_001',
          environment: 'LOCAL'
        },
        world: {
          metadata: {
            id: 'TEST_001',
            name: 'Test World',
            description: 'Test world for unit tests',
            users: [],
            artifacts: [],
            chats: [],
            settings: {},
            dependencies: [],
            environment: 'LOCAL',
            category: 'GENERAL',
            tags: [],
            isTemplate: false,
            isActive: true,
            autoCleanup: false,
            cleanupAfterHours: 24,
            isolationLevel: 'FULL',
            usageCount: 0,
            lastUsedAt: null
          },
          users: [],
          artifacts: [],
          chats: [],
          blobs: []
        }
      }

      // Mock existsSync для основного seed файла и blob директории
      vi.mocked(existsSync).mockImplementation((path: any) => {
        const pathStr = path.toString()
        return pathStr.includes('seed.json') || pathStr.includes('test-seeds/TEST_001')
      })
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockSeedData))

      const isValid = await seedManager.validateSeed('./test-seeds/TEST_001')
      expect(isValid).toBe(true)
    })

    it('should fail validation for missing seed file', async () => {
      vi.mocked(existsSync).mockReturnValue(false)

      const isValid = await seedManager.validateSeed('./test-seeds/MISSING')
      expect(isValid).toBe(false)
    })

    it('should fail validation for invalid seed structure', async () => {
      const invalidSeed = { invalid: 'structure' }

      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(invalidSeed))

      const isValid = await seedManager.validateSeed('./test-seeds/INVALID')
      expect(isValid).toBe(false)
    })
  })

  describe('generateSeedReadme', () => {
    it('should generate proper README content', () => {
      const seedManager = new PhoenixSeedManager(mockDatabaseUrl)
      const mockSeedData: SeedData = {
        version: '1.0.0',
        createdAt: '2025-06-30T12:00:00.000Z',
        source: {
          worldId: 'TEST_001',
          environment: 'LOCAL'
        },
        world: {
          metadata: {
            id: 'TEST_001',
            name: 'Test World',
            description: 'Test world description',
            users: [],
            artifacts: [],
            chats: [],
            settings: {},
            dependencies: [],
            environment: 'LOCAL',
            category: 'GENERAL',
            tags: [],
            isTemplate: false,
            isActive: true,
            autoCleanup: false,
            cleanupAfterHours: 24,
            isolationLevel: 'FULL',
            usageCount: 0,
            lastUsedAt: null
          },
          users: [{ id: 'user1' }],
          artifacts: [{ id: 'artifact1' }, { id: 'artifact2' }],
          chats: [],
          blobs: [{ id: 'blob1', filename: 'test.jpg', contentType: 'image/jpeg', size: 1024, path: 'test.jpg' }]
        }
      }

      const readmeMethod = (seedManager as any).generateSeedReadme.bind(seedManager)
      const readme = readmeMethod(mockSeedData)

      expect(readme).toContain('# Seed Data: Test World')
      expect(readme).toContain('**Generated:** 2025-06-30T12:00:00.000Z')
      expect(readme).toContain('**Source World:** TEST_001 (LOCAL)')
      expect(readme).toContain('- **Users:** 1')
      expect(readme).toContain('- **Artifacts:** 2')
      expect(readme).toContain('- **Chats:** 0')
      expect(readme).toContain('- **Blob Files:** 1')
    })
  })
})

// END OF: tests/unit/phoenix-seed-manager.test.ts