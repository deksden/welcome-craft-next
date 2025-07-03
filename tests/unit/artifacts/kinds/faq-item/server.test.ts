/**
 * @file tests/unit/artifacts/kinds/faq-item/server.test.ts
 * @description Unit tests для UC-10 FAQ Item Artifact Saver
 * @version 1.0.0
 * @date 2025-06-21
 * @updated Создан полный набор тестов для faq-item/server.ts функций с проверкой categories, priority и tags
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveFaqItemArtifact, loadFaqItemArtifact, deleteFaqItemArtifact } from '@/artifacts/kinds/faq-item/server'
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
    ...(actual || {}),
    artifactFaqItem: {
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

describe('FAQ Item Artifact Saver', () => {
  const mockArtifact: Artifact = {
    id: 'test-faq-789',
    createdAt: new Date('2025-01-01T10:00:00Z'),
    title: 'How to reset password',
    summary: '',
    kind: 'faq-item',
    userId: 'user-123',
    authorId: 'user-123',
    deletedAt: null,
    publication_state: [],
    world_id: null,
      embedding: null
  }

  const mockFaqData = {
    question: 'How do I reset my password?',
    answer: 'Click on "Forgot Password" on the login page and follow the instructions sent to your email.',
    category: 'Authentication',
    priority: 5,
    tags: ['password', 'login', 'security', 'reset']
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Сбрасываем цепочки вызовов для insert
    mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate })
    mockOnConflictDoUpdate.mockResolvedValue(undefined)
    
    // Сбрасываем цепочки вызовов для select
    mockFrom.mockReturnValue({ where: mockWhere })
    mockWhere.mockReturnValue({ limit: mockLimit })
    mockLimit.mockResolvedValue([])
  })

  describe('saveFaqItemArtifact', () => {

    it('should save FAQ item with complete JSON content', async () => {
      // Arrange
      const jsonContent = JSON.stringify(mockFaqData)

      // Act
      await saveFaqItemArtifact(mockArtifact, jsonContent)

      // Assert
      expect(mockInsert).toHaveBeenCalledTimes(1)
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall).toEqual({
        artifactId: mockArtifact.id,
        createdAt: mockArtifact.createdAt,
        question: mockFaqData.question,
        answer: mockFaqData.answer,
        category: mockFaqData.category,
        priority: mockFaqData.priority,
        tags: mockFaqData.tags
      })
    })

    it('should parse plain text as question with title fallback for answer', async () => {
      // Arrange
      const plainTextContent = 'What are the office hours?'

      // Act
      await saveFaqItemArtifact(mockArtifact, plainTextContent)

      // Assert
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall.question).toBe('What are the office hours?')
      expect(valuesCall.answer).toBe(mockArtifact.title) // Fallback to title
      expect(valuesCall.category).toBeUndefined()
      expect(valuesCall.priority).toBe(0) // Default value
      expect(valuesCall.tags).toEqual([]) // Default empty array
    })

    it('should save FAQ with minimal required fields only', async () => {
      // Arrange
      const minimalFaq = {
        question: 'Is there parking available?',
        answer: 'Yes, free parking is available in the underground garage.'
      }
      const jsonContent = JSON.stringify(minimalFaq)

      // Act
      await saveFaqItemArtifact(mockArtifact, jsonContent)

      // Assert
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall.question).toBe(minimalFaq.question)
      expect(valuesCall.answer).toBe(minimalFaq.answer)
      expect(valuesCall.category).toBeUndefined()
      expect(valuesCall.priority).toBe(0)
      expect(valuesCall.tags).toEqual([])
    })

    it('should merge metadata with parsed content', async () => {
      // Arrange
      const partialContent = JSON.stringify({
        question: 'Can I work remotely?',
        answer: 'Yes, we support hybrid work arrangements.'
      })
      const metadata = {
        category: 'Remote Work',
        priority: 3,
        tags: ['remote', 'hybrid', 'policy']
      }

      // Act
      await saveFaqItemArtifact(mockArtifact, partialContent, metadata)

      // Assert
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall.question).toBe('Can I work remotely?')
      expect(valuesCall.answer).toBe('Yes, we support hybrid work arrangements.')
      expect(valuesCall.category).toBe('Remote Work')
      expect(valuesCall.priority).toBe(3)
      expect(valuesCall.tags).toEqual(['remote', 'hybrid', 'policy'])
    })

    it('should throw error when required fields are missing', async () => {
      // Arrange
      const invalidContent = JSON.stringify({ category: 'General' }) // Missing question and answer
      const artifactWithoutTitle = { ...mockArtifact, title: '' }

      // Act & Assert
      await expect(
        saveFaqItemArtifact(artifactWithoutTitle, invalidContent)
      ).rejects.toThrow('FAQ question and answer are required')
    })

    it('should handle priority as number and default to 0', async () => {
      // Arrange
      const faqWithPriority = {
        question: 'Priority test question',
        answer: 'Priority test answer',
        priority: 10
      }
      const jsonContent = JSON.stringify(faqWithPriority)

      // Act
      await saveFaqItemArtifact(mockArtifact, jsonContent)

      // Assert
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall.priority).toBe(10)
    })

    it('should handle tags as array and default to empty array', async () => {
      // Arrange
      const faqWithTags = {
        question: 'Tags test question',
        answer: 'Tags test answer',
        tags: ['tag1', 'tag2', 'important']
      }
      const jsonContent = JSON.stringify(faqWithTags)

      // Act
      await saveFaqItemArtifact(mockArtifact, jsonContent)

      // Assert
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall.tags).toEqual(['tag1', 'tag2', 'important'])
    })

    it('should use onConflictDoUpdate for upsert behavior', async () => {
      // Arrange
      const content = JSON.stringify(mockFaqData)

      // Act
      await saveFaqItemArtifact(mockArtifact, content)

      // Assert
      const onConflictCall = mockInsert().values().onConflictDoUpdate.mock.calls[0][0]
      expect(onConflictCall.target).toEqual(['artifactId', 'createdAt'])
      expect(onConflictCall.set).toEqual(expect.objectContaining({
        question: mockFaqData.question,
        answer: mockFaqData.answer,
        category: mockFaqData.category,
        priority: mockFaqData.priority,
        tags: mockFaqData.tags
      }))
    })

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('JSON constraint violation')
      mockInsert().values().onConflictDoUpdate.mockRejectedValue(dbError)

      // Act & Assert
      await expect(
        saveFaqItemArtifact(mockArtifact, JSON.stringify(mockFaqData))
      ).rejects.toThrow('JSON constraint violation')
    })
  })

  describe('loadFaqItemArtifact', () => {

    it('should load FAQ item artifact successfully', async () => {
      // Arrange
      const mockFaqRecord = {
        artifactId: mockArtifact.id,
        createdAt: mockArtifact.createdAt,
        ...mockFaqData,
        createdAtInternal: new Date(),
        updatedAt: new Date()
      }
      
      mockSelect().from().where().limit.mockResolvedValue([mockFaqRecord])

      // Act
      const result = await loadFaqItemArtifact(mockArtifact.id, mockArtifact.createdAt)

      // Assert
      expect(result).toEqual(mockFaqRecord)
      expect(mockSelect).toHaveBeenCalled()
    })

    it('should return null when FAQ item not found', async () => {
      // Arrange
      mockSelect().from().where().limit.mockResolvedValue([])

      // Act
      const result = await loadFaqItemArtifact('non-existent-id', new Date())

      // Assert
      expect(result).toBeNull()
    })

    it('should use correct where conditions with composite key', async () => {
      // Arrange
      const testCreatedAt = new Date('2025-01-15T12:00:00Z')

      // Act
      await loadFaqItemArtifact('test-faq-id', testCreatedAt)

      // Assert
      const whereCall = mockSelect().from().where.mock.calls[0][0]
      expect(whereCall).toEqual({
        conditions: [
          { field: 'artifactId', value: 'test-faq-id', type: 'eq' },
          { field: 'createdAt', value: testCreatedAt, type: 'eq' }
        ],
        type: 'and'
      })
    })

    it('should handle database errors in load operation', async () => {
      // Arrange
      const dbError = new Error('Query timeout')
      mockSelect().from().where().limit.mockRejectedValue(dbError)

      // Act & Assert
      await expect(
        loadFaqItemArtifact(mockArtifact.id, mockArtifact.createdAt)
      ).rejects.toThrow('Query timeout')
    })
  })

  describe('deleteFaqItemArtifact', () => {

    it('should delete FAQ item artifact successfully', async () => {
      // Act
      await deleteFaqItemArtifact(mockArtifact.id, mockArtifact.createdAt)

      // Assert
      expect(mockDelete).toHaveBeenCalledTimes(1)
      expect(mockDelete().where).toHaveBeenCalledWith({
        conditions: [
          { field: 'artifactId', value: mockArtifact.id, type: 'eq' },
          { field: 'createdAt', value: mockArtifact.createdAt, type: 'eq' }
        ],
        type: 'and'
      })
    })

    it('should handle database errors in delete operation', async () => {
      // Arrange
      const dbError = new Error('Referential integrity violation')
      mockDelete().where.mockRejectedValue(dbError)

      // Act & Assert
      await expect(
        deleteFaqItemArtifact(mockArtifact.id, mockArtifact.createdAt)
      ).rejects.toThrow('Referential integrity violation')
    })

    it('should use correct where conditions for deletion', async () => {
      // Arrange
      const testId = 'faq-to-delete'
      const testCreatedAt = new Date('2025-02-20T16:45:00Z')

      // Act
      await deleteFaqItemArtifact(testId, testCreatedAt)

      // Assert
      const whereCall = mockDelete().where.mock.calls[0][0]
      expect(whereCall.conditions).toHaveLength(2)
      expect(whereCall.conditions[0]).toEqual({
        field: 'artifactId',
        value: testId,
        type: 'eq'
      })
      expect(whereCall.conditions[1]).toEqual({
        field: 'createdAt',
        value: testCreatedAt,
        type: 'eq'
      })
    })
  })

  describe('Category and priority scenarios', () => {
    beforeEach(() => {
      const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined)
      const mockValues = vi.fn().mockReturnValue({
        onConflictDoUpdate: mockOnConflictDoUpdate
      })
      mockInsert.mockReturnValue({ values: mockValues })
    })

    it('should handle FAQ items with high priority values', async () => {
      // Arrange
      const highPriorityFaq = {
        question: 'Emergency contact procedures?',
        answer: 'In case of emergency, call 911 or use the emergency buttons located throughout the building.',
        category: 'Emergency',
        priority: 100,
        tags: ['emergency', 'safety', 'urgent']
      }
      const jsonContent = JSON.stringify(highPriorityFaq)

      // Act
      await saveFaqItemArtifact(mockArtifact, jsonContent)

      // Assert
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall.priority).toBe(100)
      expect(valuesCall.category).toBe('Emergency')
      expect(valuesCall.tags).toContain('urgent')
    })

    it('should handle FAQ items with multiple categories through tags', async () => {
      // Arrange
      const multiCategoryFaq = {
        question: 'How to access both internal tools and VPN?',
        answer: 'Use your SSO credentials for internal tools, and download the VPN client from IT portal.',
        category: 'IT Support',
        priority: 7,
        tags: ['IT', 'VPN', 'SSO', 'access', 'tools', 'security']
      }
      const jsonContent = JSON.stringify(multiCategoryFaq)

      // Act
      await saveFaqItemArtifact(mockArtifact, jsonContent)

      // Assert
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall.category).toBe('IT Support')
      expect(valuesCall.tags).toHaveLength(6)
      expect(valuesCall.tags).toEqual(['IT', 'VPN', 'SSO', 'access', 'tools', 'security'])
    })

    it('should handle empty tags array correctly', async () => {
      // Arrange
      const faqWithEmptyTags = {
        question: 'Basic question?',
        answer: 'Basic answer.',
        tags: []
      }
      const jsonContent = JSON.stringify(faqWithEmptyTags)

      // Act
      await saveFaqItemArtifact(mockArtifact, jsonContent)

      // Assert
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall.tags).toEqual([])
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete lifecycle: save -> load -> delete', async () => {
      // Setup save
      const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined)
      const mockValues = vi.fn().mockReturnValue({
        onConflictDoUpdate: mockOnConflictDoUpdate
      })
      mockInsert.mockReturnValue({ values: mockValues })

      // Setup load
      const mockFaqRecord = {
        artifactId: mockArtifact.id,
        createdAt: mockArtifact.createdAt,
        ...mockFaqData,
        createdAtInternal: new Date(),
        updatedAt: new Date()
      }
      const mockLimit = vi.fn().mockResolvedValue([mockFaqRecord])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockSelect.mockReturnValue({ from: mockFrom })

      // Setup delete
      const mockDeleteWhere = vi.fn().mockResolvedValue(undefined)
      mockDelete.mockReturnValue({ where: mockDeleteWhere })

      // Act
      await saveFaqItemArtifact(mockArtifact, JSON.stringify(mockFaqData))
      const loaded = await loadFaqItemArtifact(mockArtifact.id, mockArtifact.createdAt)
      await deleteFaqItemArtifact(mockArtifact.id, mockArtifact.createdAt)

      // Assert
      expect(loaded).toEqual(mockFaqRecord)
      expect(mockInsert).toHaveBeenCalledTimes(1)
      expect(mockSelect).toHaveBeenCalled()
      expect(mockDelete).toHaveBeenCalledTimes(1)
    })

    it('should preserve data integrity with complex tag structures', async () => {
      // Arrange
      const complexFaq = {
        question: 'How to handle complex project workflows?',
        answer: 'Follow the standard SDLC process with additional approvals for security-sensitive changes.',
        category: 'Project Management',
        priority: 8,
        tags: ['SDLC', 'workflow', 'security', 'approvals', 'process', 'project-management']
      }

      // Setup save
      const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined)
      const mockValues = vi.fn().mockReturnValue({
        onConflictDoUpdate: mockOnConflictDoUpdate
      })
      mockInsert.mockReturnValue({ values: mockValues })

      // Setup load
      const savedRecord = {
        artifactId: mockArtifact.id,
        createdAt: mockArtifact.createdAt,
        ...complexFaq,
        createdAtInternal: new Date(),
        updatedAt: new Date()
      }
      const mockLimit = vi.fn().mockResolvedValue([savedRecord])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockSelect.mockReturnValue({ from: mockFrom })

      // Act
      await saveFaqItemArtifact(mockArtifact, JSON.stringify(complexFaq))
      const loaded = await loadFaqItemArtifact(mockArtifact.id, mockArtifact.createdAt)

      // Assert
      expect(loaded?.tags).toEqual(complexFaq.tags)
      expect(loaded?.priority).toBe(8)
      expect(loaded?.category).toBe('Project Management')
    })
  })
})

// END OF: tests/unit/artifacts/kinds/faq-item/server.test.ts