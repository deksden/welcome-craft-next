/**
 * @file tests/unit/artifacts/kinds/set/server.test.ts
 * @description Unit tests для UC-10 Set Artifact Saver (A_SetItems table)
 * @version 1.0.0
 * @date 2025-06-21
 * @updated Создан полный набор тестов для set/server.ts функций с проверкой A_SetItems управления и validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveSetArtifact, loadSetArtifact, deleteSetArtifact } from '@/artifacts/kinds/set/server'
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
const { mockValues, mockInsert, mockFrom, mockWhere, mockLimit, mockOrderBy, mockSelect, mockDelete } = vi.hoisted(() => {
  const mockValues = vi.fn()
  const mockInsert = vi.fn(() => ({ values: mockValues }))
  const mockFrom = vi.fn()
  const mockWhere = vi.fn()
  const mockLimit = vi.fn()
  const mockOrderBy = vi.fn()
  const mockSelect = vi.fn(() => ({ from: mockFrom }))
  const mockDelete = vi.fn(() => ({ where: mockWhere }))
  
  return {
    mockValues,
    mockInsert,
    mockFrom,
    mockWhere,
    mockLimit,
    mockOrderBy,
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
    artifactSetItems: {
      setId: 'setId',
      setCreatedAt: 'setCreatedAt',
      itemId: 'itemId',
      itemCreatedAt: 'itemCreatedAt',
      order: 'order'
    }
  }
})

// Мокируем drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ field, value, type: 'eq' })),
  and: vi.fn((...conditions) => ({ conditions, type: 'and' }))
}))

describe('Set Artifact Saver', () => {
  const mockArtifact: Artifact = {
    id: 'test-set-303',
    createdAt: new Date('2025-01-01T10:00:00Z'),
    title: 'Employee Directory Set',
    summary: '',
    kind: 'set',
    userId: 'user-123',
    authorId: 'user-123',
    deletedAt: null,
    publication_state: [],
    world_id: null
  }

  const mockSetData = {
    items: [
      {
        itemId: 'person-001',
        itemCreatedAt: '2025-01-01T09:00:00Z',
        order: 0,
        metadata: { featured: true, department: 'Engineering' }
      },
      {
        itemId: 'person-002', 
        itemCreatedAt: '2025-01-01T09:30:00Z',
        order: 1,
        metadata: { featured: false, department: 'Product' }
      },
      {
        itemId: 'address-001',
        itemCreatedAt: '2025-01-01T08:00:00Z',
        order: 2,
        metadata: { type: 'headquarters' }
      }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Сбрасываем цепочки вызовов для insert (batch insert)
    mockValues.mockResolvedValue(undefined)
    
    // Сбрасываем цепочки вызовов для select с orderBy
    mockFrom.mockReturnValue({ where: mockWhere })
    mockWhere.mockReturnValue({ orderBy: mockOrderBy })
    mockOrderBy.mockResolvedValue([])
    
    // Сбрасываем цепочки вызовов для delete
    mockDelete.mockReturnValue({ where: mockWhere })
  })

  describe('saveSetArtifact', () => {
    it('should save set artifact with multiple items', async () => {
      // Arrange
      const jsonContent = JSON.stringify(mockSetData)

      // Act
      await saveSetArtifact(mockArtifact, jsonContent)

      // Assert
      // Должен быть delete + insert (2 вызова total)
      expect(mockDelete).toHaveBeenCalledTimes(1)
      expect(mockInsert).toHaveBeenCalledTimes(1) // Один batch insert
      
      // Проверяем batch insert с массивом из 3 items
      const valuesCall = mockValues.mock.calls[0][0]
      expect(Array.isArray(valuesCall)).toBe(true)
      expect(valuesCall).toHaveLength(3)
      
      // Проверяем первый item (но учитываем, что itemCreatedAt = new Date())
      expect(valuesCall[0]).toEqual(expect.objectContaining({
        setId: mockArtifact.id,
        setCreatedAt: mockArtifact.createdAt,
        itemId: 'person-001',
        order: 0,
        metadata: { featured: true, department: 'Engineering' }
      }))
      expect(valuesCall[0].itemCreatedAt).toBeInstanceOf(Date)
      
      // Проверяем второй item
      expect(valuesCall[1]).toEqual(expect.objectContaining({
        setId: mockArtifact.id,
        setCreatedAt: mockArtifact.createdAt,
        itemId: 'person-002',
        order: 1,
        metadata: { featured: false, department: 'Product' }
      }))
      
      // Проверяем третий item
      expect(valuesCall[2]).toEqual(expect.objectContaining({
        setId: mockArtifact.id,
        setCreatedAt: mockArtifact.createdAt,
        itemId: 'address-001',
        order: 2,
        metadata: { type: 'headquarters' }
      }))
    })

    it('should save set with empty items list', async () => {
      // Arrange
      const emptySetData = { items: [] }
      const jsonContent = JSON.stringify(emptySetData)

      // Act
      await saveSetArtifact(mockArtifact, jsonContent)

      // Assert
      // Должен удалить старые связи, но не добавлять новые
      expect(mockDelete).toHaveBeenCalledTimes(1)
      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('should parse plain text as empty set (no parsing support)', async () => {
      // Arrange
      const plainTextContent = 'person-123,2025-01-01T10:00:00Z'

      // Act
      await saveSetArtifact(mockArtifact, plainTextContent)

      // Assert
      // Plain text не поддерживается, создается пустой набор
      expect(mockDelete).toHaveBeenCalledTimes(1)
      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('should handle items with metadata and custom ordering', async () => {
      // Arrange
      const customSetData = {
        items: [
          {
            itemId: 'faq-100',
            order: 5,
            metadata: { 
              priority: 'high',
              category: 'urgent',
              tags: ['security', 'access']
            }
          }
        ]
      }
      const jsonContent = JSON.stringify(customSetData)

      // Act
      await saveSetArtifact(mockArtifact, jsonContent)

      // Assert
      const valuesCall = mockValues.mock.calls[0][0]
      expect(Array.isArray(valuesCall)).toBe(true)
      expect(valuesCall[0]).toEqual(expect.objectContaining({
        setId: mockArtifact.id,
        setCreatedAt: mockArtifact.createdAt,
        itemId: 'faq-100',
        order: 5,
        metadata: {
          priority: 'high',
          category: 'urgent',
          tags: ['security', 'access']
        }
      }))
      expect(valuesCall[0].itemCreatedAt).toBeInstanceOf(Date)
    })

    it('should handle missing items field as empty set', async () => {
      // Arrange
      const invalidContent = JSON.stringify({ wrongField: 'value' }) // No items

      // Act
      await saveSetArtifact(mockArtifact, invalidContent)

      // Assert
      // Отсутствующее поле items трактуется как пустой массив
      expect(mockDelete).toHaveBeenCalledTimes(1)
      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Foreign key constraint violation')
      mockValues.mockRejectedValue(dbError)

      // Act & Assert
      await expect(
        saveSetArtifact(mockArtifact, JSON.stringify(mockSetData))
      ).rejects.toThrow('Foreign key constraint violation')
    })

    it('should clear existing items before inserting new ones', async () => {
      // Arrange
      const newSetData = {
        items: [
          {
            itemId: 'new-item-001',
            itemCreatedAt: '2025-01-02T10:00:00Z',
            order: 0,
            metadata: { status: 'active' }
          }
        ]
      }
      const jsonContent = JSON.stringify(newSetData)
      mockWhere.mockResolvedValueOnce(undefined) // для delete операции

      // Act
      await saveSetArtifact(mockArtifact, jsonContent)

      // Assert
      expect(mockDelete).toHaveBeenCalledTimes(1) // Сначала удаляем старые
      expect(mockInsert).toHaveBeenCalledTimes(1) // Затем вставляем новые
    })
  })

  describe('loadSetArtifact', () => {
    it('should load set items successfully', async () => {
      // Arrange
      const mockSetItemsRecords = [
        {
          setId: mockArtifact.id,
          setCreatedAt: mockArtifact.createdAt,
          itemId: 'person-001',
          itemCreatedAt: new Date('2025-01-01T09:00:00Z'),
          order: 0,
          metadata: { featured: true },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          setId: mockArtifact.id,
          setCreatedAt: mockArtifact.createdAt,
          itemId: 'person-002',
          itemCreatedAt: new Date('2025-01-01T09:30:00Z'),
          order: 1,
          metadata: { featured: false },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      mockOrderBy.mockResolvedValue(mockSetItemsRecords)

      // Act
      const result = await loadSetArtifact(mockArtifact.id, mockArtifact.createdAt)

      // Assert
      expect(result).toEqual(mockSetItemsRecords)
      expect(mockSelect).toHaveBeenCalled()
    })

    it('should return null when no set items found', async () => {
      // Arrange
      mockOrderBy.mockResolvedValue([])

      // Act
      const result = await loadSetArtifact('non-existent-id', new Date())

      // Assert
      expect(result).toBeNull()
    })

    it('should use correct where conditions with composite key', async () => {
      // Arrange
      const testCreatedAt = new Date('2025-01-15T12:00:00Z')

      // Act
      await loadSetArtifact('test-set-id', testCreatedAt)

      // Assert
      expect(mockWhere).toHaveBeenCalledWith({
        conditions: [
          { field: 'setId', value: 'test-set-id', type: 'eq' },
          { field: 'setCreatedAt', value: testCreatedAt, type: 'eq' }
        ],
        type: 'and'
      })
    })

    it('should handle database errors in load operation', async () => {
      // Arrange
      const dbError = new Error('Query timeout error')
      mockOrderBy.mockRejectedValue(dbError)

      // Act & Assert
      await expect(
        loadSetArtifact(mockArtifact.id, mockArtifact.createdAt)
      ).rejects.toThrow('Query timeout error')
    })
  })

  describe('deleteSetArtifact', () => {
    it('should delete all set items successfully', async () => {
      // Arrange
      mockWhere.mockResolvedValue(undefined)

      // Act
      await deleteSetArtifact(mockArtifact.id, mockArtifact.createdAt)

      // Assert
      expect(mockDelete).toHaveBeenCalledTimes(1)
      const whereCall = mockWhere.mock.calls[mockWhere.mock.calls.length - 1][0]
      expect(whereCall.conditions).toHaveLength(2)
      expect(whereCall.conditions[0]).toEqual({
        field: 'setId',
        value: mockArtifact.id,
        type: 'eq'
      })
      expect(whereCall.conditions[1]).toEqual({
        field: 'setCreatedAt',
        value: mockArtifact.createdAt,
        type: 'eq'
      })
    })

    it('should handle database errors in delete operation', async () => {
      // Arrange
      const dbError = new Error('Cannot delete referenced set items')
      mockWhere.mockRejectedValue(dbError)

      // Act & Assert
      await expect(
        deleteSetArtifact(mockArtifact.id, mockArtifact.createdAt)
      ).rejects.toThrow('Cannot delete referenced set items')
    })

    it('should use correct where conditions for deletion', async () => {
      // Arrange
      const testId = 'set-to-delete'
      const testCreatedAt = new Date('2025-03-05T21:45:00Z')
      mockWhere.mockResolvedValue(undefined)

      // Act
      await deleteSetArtifact(testId, testCreatedAt)

      // Assert
      const whereCall = mockWhere.mock.calls[mockWhere.mock.calls.length - 1][0]
      expect(whereCall.conditions).toHaveLength(2)
      expect(whereCall.conditions[0]).toEqual({
        field: 'setId',
        value: testId,
        type: 'eq'
      })
      expect(whereCall.conditions[1]).toEqual({
        field: 'setCreatedAt',
        value: testCreatedAt,
        type: 'eq'
      })
    })
  })

  describe('Set ordering and metadata scenarios', () => {
    it('should handle sets with complex metadata structures', async () => {
      // Arrange
      const complexSetData = {
        items: [
          {
            itemId: 'person-team-lead',
            itemCreatedAt: '2025-01-01T08:00:00Z',
            order: 0,
            metadata: {
              role: 'team-lead',
              permissions: ['read', 'write', 'admin'],
              profile: {
                isPublic: true,
                showContact: true,
                featured: true
              },
              tags: ['leadership', 'engineering'],
              lastUpdated: '2025-01-01T08:00:00Z'
            }
          },
          {
            itemId: 'link-team-slack',
            itemCreatedAt: '2025-01-01T08:30:00Z',
            order: 1,
            metadata: {
              category: 'communication',
              isInternal: true,
              accessLevel: 'team-members-only',
              description: 'Team Slack channel for daily coordination'
            }
          }
        ]
      }
      const jsonContent = JSON.stringify(complexSetData)

      // Act
      await saveSetArtifact(mockArtifact, jsonContent)

      // Assert
      expect(mockInsert).toHaveBeenCalledTimes(1) // Один batch insert
      
      const valuesCall = mockValues.mock.calls[0][0]
      expect(Array.isArray(valuesCall)).toBe(true)
      expect(valuesCall).toHaveLength(2)
      
      // Проверяем сложный metadata первого item
      expect(valuesCall[0]).toEqual(expect.objectContaining({
        metadata: {
          role: 'team-lead',
          permissions: ['read', 'write', 'admin'],
          profile: {
            isPublic: true,
            showContact: true,
            featured: true
          },
          tags: ['leadership', 'engineering'],
          lastUpdated: '2025-01-01T08:00:00Z'
        }
      }))
    })

    it('should preserve ordering when saving set items', async () => {
      // Arrange
      const orderedSetData = {
        items: [
          { itemId: 'item-c', itemCreatedAt: '2025-01-01T10:00:00Z', order: 10, metadata: {} },
          { itemId: 'item-a', itemCreatedAt: '2025-01-01T10:10:00Z', order: 5, metadata: {} },
          { itemId: 'item-b', itemCreatedAt: '2025-01-01T10:20:00Z', order: 1, metadata: {} }
        ]
      }
      const jsonContent = JSON.stringify(orderedSetData)

      // Act
      await saveSetArtifact(mockArtifact, jsonContent)

      // Assert
      const valuesCall = mockValues.mock.calls[0][0]
      expect(Array.isArray(valuesCall)).toBe(true)
      expect(valuesCall).toHaveLength(3)
      
      // Проверяем что порядок сохраняется как передан (сортировка на уровне БД)
      expect(valuesCall[0]).toEqual(expect.objectContaining({ order: 10, itemId: 'item-c' }))
      expect(valuesCall[1]).toEqual(expect.objectContaining({ order: 5, itemId: 'item-a' }))
      expect(valuesCall[2]).toEqual(expect.objectContaining({ order: 1, itemId: 'item-b' }))
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete lifecycle: save -> load -> delete', async () => {
      // Arrange
      const mockSetItemsRecords = [
        {
          setId: mockArtifact.id,
          setCreatedAt: mockArtifact.createdAt,
          itemId: 'person-001',
          itemCreatedAt: new Date('2025-01-01T09:00:00Z'),
          order: 0,
          metadata: { featured: true },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      // Setup для load операции с orderBy
      mockFrom.mockReturnValue({ where: mockWhere })
      mockWhere.mockReturnValue({ orderBy: mockOrderBy })
      mockOrderBy.mockResolvedValueOnce(mockSetItemsRecords)
      
      // Setup для delete операций
      const mockDeleteWhere = vi.fn().mockResolvedValue(undefined)
      mockDelete.mockReturnValue({ where: mockDeleteWhere })

      // Act
      await saveSetArtifact(mockArtifact, JSON.stringify({ items: mockSetData.items.slice(0, 1) }))
      const loaded = await loadSetArtifact(mockArtifact.id, mockArtifact.createdAt)
      await deleteSetArtifact(mockArtifact.id, mockArtifact.createdAt)

      // Assert
      expect(loaded).toEqual(mockSetItemsRecords)
      expect(mockInsert).toHaveBeenCalledTimes(1) // save
      expect(mockSelect).toHaveBeenCalled() // load
      expect(mockDelete).toHaveBeenCalledTimes(2) // clear + delete
    })

    it('should preserve referential integrity through full cycle', async () => {
      // Arrange
      const setWithReferences = {
        items: [
          {
            itemId: 'person-ceo',
            itemCreatedAt: '2025-01-01T08:00:00Z',
            order: 0,
            metadata: { 
              position: 'CEO',
              reportsTo: null,
              manages: ['person-cto', 'person-cmo'],
              isExecutive: true
            }
          },
          {
            itemId: 'person-cto',
            itemCreatedAt: '2025-01-01T08:30:00Z',
            order: 1,
            metadata: { 
              position: 'CTO',
              reportsTo: 'person-ceo',
              manages: ['person-eng-lead'],
              isExecutive: true
            }
          }
        ]
      }

      // Setup
      const savedRecords = setWithReferences.items.map((item, index) => ({
        setId: mockArtifact.id,
        setCreatedAt: mockArtifact.createdAt,
        itemId: item.itemId,
        itemCreatedAt: new Date(item.itemCreatedAt),
        order: item.order,
        metadata: item.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
      
      // Setup load chain
      mockFrom.mockReturnValue({ where: mockWhere })
      mockWhere.mockReturnValue({ orderBy: mockOrderBy })
      mockOrderBy.mockResolvedValueOnce(savedRecords)

      // Act
      await saveSetArtifact(mockArtifact, JSON.stringify(setWithReferences))
      const loaded = await loadSetArtifact(mockArtifact.id, mockArtifact.createdAt)

      // Assert
      expect(loaded).toHaveLength(2)
      expect((loaded as any)?.[0]?.metadata?.manages).toEqual(['person-cto', 'person-cmo'])
      expect((loaded as any)?.[1]?.metadata?.reportsTo).toBe('person-ceo')
      expect(mockInsert).toHaveBeenCalledTimes(1) // Batch insert
    })
  })
})

// END OF: tests/unit/artifacts/kinds/set/server.test.ts