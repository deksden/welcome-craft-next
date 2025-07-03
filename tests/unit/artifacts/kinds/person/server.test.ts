/**
 * @file tests/unit/artifacts/kinds/person/server.test.ts
 * @description Unit tests для UC-10 Person Artifact Saver
 * @version 1.0.0
 * @date 2025-06-21
 * @updated Полностью исправленные тесты с vi.hoisted мокированием database операций
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { savePersonArtifact, loadPersonArtifact, deletePersonArtifact } from '@/artifacts/kinds/person/server'
import type { Artifact } from '@/lib/db/schema'

// Мокируем fab-logger
vi.mock('@fab33/fab-logger', () => ({
  createLogger: () => ({
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    }),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })
}))

// Создаем hoisted моки для database операций
const { mockValues, mockOnConflictDoUpdate, mockInsert, mockFrom, mockWhere, mockLimit, mockSelect, mockDelete } = vi.hoisted(() => {
  const mockValues = vi.fn()
  const mockOnConflictDoUpdate = vi.fn()
  const mockInsert = vi.fn(() => ({ values: mockValues }))
  const mockFrom = vi.fn()
  const mockWhere = vi.fn()
  const mockLimit = vi.fn()
  const mockSelect = vi.fn(() => ({ from: mockFrom }))
  const mockDelete = vi.fn(() => ({ where: mockWhere }))
  
  return {
    mockValues,
    mockOnConflictDoUpdate,
    mockInsert,
    mockFrom,
    mockWhere,
    mockLimit,
    mockSelect,
    mockDelete
  }
})

// Мокируем database
vi.mock('@/lib/db', () => ({
  db: {
    insert: mockInsert,
    select: mockSelect,
    delete: mockDelete
  }
}))

// Мокируем schema
vi.mock('@/lib/db/schema', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    artifactPerson: {
      artifactId: 'artifactId',
      createdAt: 'createdAt'
    }
  }
})

// Мокируем drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ field, value, type: 'eq' })),
  and: vi.fn((...conditions) => ({ conditions, type: 'and' }))
}))

describe('Person Artifact Saver', () => {
  const mockArtifact: Artifact = {
    id: 'test-artifact-123',
    createdAt: new Date('2025-01-01T10:00:00Z'),
    title: 'John Doe Employee Profile',
    summary: '',
    kind: 'person',
    userId: 'user-123',
    authorId: 'user-123',
    deletedAt: null,
    publication_state: [],
    world_id: null,
      embedding: null
  }

  const mockPersonData = {
    fullName: 'John Doe',
    position: 'Senior Software Engineer',
    photoUrl: 'https://example.com/john-doe.jpg',
    quote: 'Building amazing software!',
    email: 'john.doe@company.com',
    phone: '+1-555-0123',
    department: 'Engineering',
    location: 'San Francisco, CA'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Сбрасываем цепочки вызовов для insert
    mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate })
    mockOnConflictDoUpdate.mockResolvedValue(undefined)
    
    // Сбрасываем цепочки вызовов для select (по умолчанию)
    mockFrom.mockReturnValue({ where: mockWhere })
    mockWhere.mockReturnValue({ limit: mockLimit })
    mockLimit.mockResolvedValue([])
  })

  describe('savePersonArtifact', () => {
    it('should save person artifact with JSON content', async () => {
      // Arrange
      const jsonContent = JSON.stringify(mockPersonData)

      // Act
      await savePersonArtifact(mockArtifact, jsonContent)

      // Assert
      expect(mockInsert).toHaveBeenCalledTimes(1)
      expect(mockValues).toHaveBeenCalledWith({
        artifactId: mockArtifact.id,
        createdAt: mockArtifact.createdAt,
        fullName: mockPersonData.fullName,
        position: mockPersonData.position,
        photoUrl: mockPersonData.photoUrl,
        quote: mockPersonData.quote,
        email: mockPersonData.email,
        phone: mockPersonData.phone,
        department: mockPersonData.department,
        location: mockPersonData.location
      })
    })

    it('should save person artifact with plain text content as fullName', async () => {
      // Arrange
      const plainTextContent = 'Jane Smith'

      // Act
      await savePersonArtifact(mockArtifact, plainTextContent)

      // Assert
      expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
        fullName: 'Jane Smith',
        artifactId: mockArtifact.id,
        createdAt: mockArtifact.createdAt
      }))
    })

    it('should use artifact title as fallback when content is empty', async () => {
      // Arrange
      const emptyContent = ''

      // Act
      await savePersonArtifact(mockArtifact, emptyContent)

      // Assert
      expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
        fullName: mockArtifact.title
      }))
    })

    it('should merge metadata with parsed content', async () => {
      // Arrange
      const partialContent = JSON.stringify({ fullName: 'Bob Johnson' })
      const metadata = {
        position: 'Team Lead',
        department: 'Product'
      }

      // Act
      await savePersonArtifact(mockArtifact, partialContent, metadata)

      // Assert
      expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
        fullName: 'Bob Johnson',
        position: 'Team Lead',
        department: 'Product'
      }))
    })

    it('should throw error when fullName is missing', async () => {
      // Arrange
      const invalidContent = JSON.stringify({ position: 'Engineer' }) // No fullName
      const artifactWithoutTitle = { ...mockArtifact, title: '' }

      // Act & Assert
      await expect(
        savePersonArtifact(artifactWithoutTitle, invalidContent)
      ).rejects.toThrow('Person fullName is required')
    })

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed')
      mockOnConflictDoUpdate.mockRejectedValue(dbError)

      // Act & Assert
      await expect(
        savePersonArtifact(mockArtifact, JSON.stringify(mockPersonData))
      ).rejects.toThrow('Database connection failed')
    })

    it('should use onConflictDoUpdate for upsert behavior', async () => {
      // Arrange
      const content = JSON.stringify(mockPersonData)

      // Act
      await savePersonArtifact(mockArtifact, content)

      // Assert
      expect(mockOnConflictDoUpdate).toHaveBeenCalledWith({
        target: ['artifactId', 'createdAt'],
        set: {
          fullName: mockPersonData.fullName,
          position: mockPersonData.position,
          photoUrl: mockPersonData.photoUrl,
          quote: mockPersonData.quote,
          email: mockPersonData.email,
          phone: mockPersonData.phone,
          department: mockPersonData.department,
          location: mockPersonData.location
        }
      })
    })
  })

  describe('loadPersonArtifact', () => {
    it('should load person artifact successfully', async () => {
      // Arrange
      const mockPersonRecord = {
        artifactId: mockArtifact.id,
        createdAt: mockArtifact.createdAt,
        ...mockPersonData
      }
      
      mockLimit.mockResolvedValue([mockPersonRecord])

      // Act
      const result = await loadPersonArtifact(mockArtifact.id, mockArtifact.createdAt)

      // Assert
      expect(result).toEqual(mockPersonRecord)
      expect(mockSelect).toHaveBeenCalledTimes(1)
    })

    it('should return null when person not found', async () => {
      // Arrange
      mockLimit.mockResolvedValue([])

      // Act
      const result = await loadPersonArtifact('non-existent-id', new Date())

      // Assert
      expect(result).toBeNull()
    })

    it('should use correct where conditions', async () => {
      // Arrange
      const testCreatedAt = new Date('2025-01-15T12:00:00Z')

      // Act
      await loadPersonArtifact('test-id', testCreatedAt)

      // Assert
      expect(mockWhere).toHaveBeenCalledWith({
        conditions: [
          { field: 'artifactId', value: 'test-id', type: 'eq' },
          { field: 'createdAt', value: testCreatedAt, type: 'eq' }
        ],
        type: 'and'
      })
    })

    it('should handle database errors in load operation', async () => {
      // Arrange
      const dbError = new Error('Query execution failed')
      mockLimit.mockRejectedValue(dbError)

      // Act & Assert
      await expect(
        loadPersonArtifact(mockArtifact.id, mockArtifact.createdAt)
      ).rejects.toThrow('Query execution failed')
    })
  })

  describe('deletePersonArtifact', () => {
    it('should delete person artifact successfully', async () => {
      // Arrange
      mockWhere.mockResolvedValue(undefined)

      // Act
      await deletePersonArtifact(mockArtifact.id, mockArtifact.createdAt)

      // Assert
      expect(mockDelete).toHaveBeenCalledTimes(1)
      expect(mockWhere).toHaveBeenCalledWith({
        conditions: [
          { field: 'artifactId', value: mockArtifact.id, type: 'eq' },
          { field: 'createdAt', value: mockArtifact.createdAt, type: 'eq' }
        ],
        type: 'and'
      })
    })

    it('should handle database errors in delete operation', async () => {
      // Arrange
      const dbError = new Error('Delete operation failed')
      mockWhere.mockRejectedValue(dbError)

      // Act & Assert
      await expect(
        deletePersonArtifact(mockArtifact.id, mockArtifact.createdAt)
      ).rejects.toThrow('Delete operation failed')
    })

    it('should use correct where conditions for deletion', async () => {
      // Arrange
      const testId = 'delete-test-id'
      const testCreatedAt = new Date('2025-02-01T08:30:00Z')
      mockWhere.mockResolvedValue(undefined)

      // Act
      await deletePersonArtifact(testId, testCreatedAt)

      // Assert
      expect(mockWhere).toHaveBeenCalledWith({
        conditions: [
          { field: 'artifactId', value: testId, type: 'eq' },
          { field: 'createdAt', value: testCreatedAt, type: 'eq' }
        ],
        type: 'and'
      })
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete lifecycle: save -> load -> delete', async () => {
      // Arrange
      const mockPersonRecord = {
        artifactId: mockArtifact.id,
        createdAt: mockArtifact.createdAt,
        ...mockPersonData
      }
      
      // Setup для load операции - переопределяем цепочку
      const mockLoadWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      mockFrom.mockReturnValue({ where: mockLoadWhere })
      mockLimit.mockResolvedValueOnce([mockPersonRecord])
      
      // Setup для delete операции - отдельный мок
      const mockDeleteWhere = vi.fn().mockResolvedValueOnce(undefined)
      mockDelete.mockReturnValue({ where: mockDeleteWhere })

      // Act
      await savePersonArtifact(mockArtifact, JSON.stringify(mockPersonData))
      const loaded = await loadPersonArtifact(mockArtifact.id, mockArtifact.createdAt)
      await deletePersonArtifact(mockArtifact.id, mockArtifact.createdAt)

      // Assert
      expect(loaded).toEqual(mockPersonRecord)
      expect(mockInsert).toHaveBeenCalledTimes(1)
      expect(mockSelect).toHaveBeenCalledTimes(1)
      expect(mockDelete).toHaveBeenCalledTimes(1)
    })
  })
})

// END OF: tests/unit/artifacts/kinds/person/server.test.ts