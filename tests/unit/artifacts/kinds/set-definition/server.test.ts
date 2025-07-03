/**
 * @file tests/unit/artifacts/kinds/set-definition/server.test.ts
 * @description Unit tests для UC-10 Set Definition Artifact Saver
 * @version 1.0.0
 * @date 2025-06-21
 * @updated Создан полный набор тестов для set-definition/server.ts функций с проверкой validation rules и allowedKinds
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveSetDefinitionArtifact, loadSetDefinitionArtifact, deleteSetDefinitionArtifact } from '@/artifacts/kinds/set-definition/server'
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
    artifactSetDefinition: {
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

describe('Set Definition Artifact Saver', () => {
  const mockArtifact: Artifact = {
    id: 'test-set-def-202',
    createdAt: new Date('2025-01-01T10:00:00Z'),
    title: 'Employee Contact Set',
    summary: '',
    kind: 'set-definition',
    userId: 'user-123',
    authorId: 'user-123',
    deletedAt: null,
    publication_state: [],
    world_id: null,
      embedding: null
  }

  const mockSetDefinitionData = {
    definition: {
      allowedKinds: ['person', 'address'],
      maxItems: 50,
      requiredFields: ['fullName', 'email']
    },
    validationRules: {
      uniqueEmails: true,
      requiredDepartments: ['Engineering', 'Product', 'Design'],
      maxDuplicateNames: 2
    },
    defaultSorting: 'fullName',
    allowDuplicates: false
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

  describe('saveSetDefinitionArtifact', () => {

    it('should save set definition artifact with complete JSON content', async () => {
      // Arrange
      const jsonContent = JSON.stringify(mockSetDefinitionData)

      // Act
      await saveSetDefinitionArtifact(mockArtifact, jsonContent)

      // Assert
      expect(mockInsert).toHaveBeenCalled()
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall).toEqual({
        artifactId: mockArtifact.id,
        createdAt: mockArtifact.createdAt,
        definition: mockSetDefinitionData.definition,
        validationRules: mockSetDefinitionData.validationRules,
        defaultSorting: mockSetDefinitionData.defaultSorting,
        allowDuplicates: mockSetDefinitionData.allowDuplicates
      })
    })

    it('should parse plain text as basic definition with title fallback', async () => {
      // Arrange
      const plainTextContent = 'person,address,faq-item'

      // Act
      await saveSetDefinitionArtifact(mockArtifact, plainTextContent)

      // Assert
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall.definition).toEqual({
        allowedKinds: ['person', 'address', 'faq-item']
      })
      expect(valuesCall.validationRules).toEqual({})
      expect(valuesCall.defaultSorting).toBe('createdAt')
      expect(valuesCall.allowDuplicates).toBe(false)
    })

    it('should save set definition with minimal required fields only', async () => {
      // Arrange
      const minimalDefinition = {
        definition: {
          allowedKinds: ['text']
        }
      }
      const jsonContent = JSON.stringify(minimalDefinition)

      // Act
      await saveSetDefinitionArtifact(mockArtifact, jsonContent)

      // Assert
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall.definition).toEqual({
        allowedKinds: ['text']
      })
      expect(valuesCall.validationRules).toEqual({})
      expect(valuesCall.defaultSorting).toBe('createdAt')
      expect(valuesCall.allowDuplicates).toBe(false)
    })

    it('should merge metadata with parsed content', async () => {
      // Arrange
      const partialContent = JSON.stringify({
        definition: {
          allowedKinds: ['link', 'faq-item']
        }
      })
      const metadata = {
        validationRules: {
          maxItemsPerCategory: 10,
          requiredTags: ['important']
        },
        defaultSorting: 'priority',
        allowDuplicates: true
      }

      // Act
      await saveSetDefinitionArtifact(mockArtifact, partialContent, metadata)

      // Assert
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall.definition).toEqual({
        allowedKinds: ['link', 'faq-item']
      })
      expect(valuesCall.validationRules).toEqual({
        maxItemsPerCategory: 10,
        requiredTags: ['important']
      })
      expect(valuesCall.defaultSorting).toBe('priority')
      expect(valuesCall.allowDuplicates).toBe(true)
    })

    it('should throw error when definition is missing or invalid', async () => {
      // Arrange
      const invalidContent = JSON.stringify({ validationRules: {} }) // Missing definition

      // Act & Assert
      await expect(
        saveSetDefinitionArtifact(mockArtifact, invalidContent)
      ).rejects.toThrow('Set definition with allowedKinds is required')
    })

    it('should handle complex validation rules correctly', async () => {
      // Arrange
      const complexDefinition = {
        definition: {
          allowedKinds: ['person', 'address', 'link'],
          maxItems: 100,
          requiredFields: ['title', 'category'],
          optionalFields: ['description', 'tags']
        },
        validationRules: {
          uniqueFields: ['email', 'url'],
          categoriesEnum: ['HR', 'Engineering', 'Sales', 'Marketing'],
          maxDuplicatesByField: {
            name: 3,
            department: 10
          },
          customValidator: 'email-domain-check'
        },
        defaultSorting: 'category',
        allowDuplicates: false
      }
      const jsonContent = JSON.stringify(complexDefinition)

      // Act
      await saveSetDefinitionArtifact(mockArtifact, jsonContent)

      // Assert
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall.definition).toEqual(complexDefinition.definition)
      expect(valuesCall.validationRules).toEqual(complexDefinition.validationRules)
      expect(valuesCall.defaultSorting).toBe('category')
      expect(valuesCall.allowDuplicates).toBe(false)
    })

    it('should handle all artifact kinds in allowedKinds array', async () => {
      // Arrange
      const allKindsDefinition = {
        definition: {
          allowedKinds: ['text', 'code', 'image', 'sheet', 'site', 'person', 'address', 'faq-item', 'link'],
          maxItems: 1000
        },
        validationRules: {},
        defaultSorting: 'createdAt',
        allowDuplicates: true
      }
      const jsonContent = JSON.stringify(allKindsDefinition)

      // Act
      await saveSetDefinitionArtifact(mockArtifact, jsonContent)

      // Assert
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall.definition.allowedKinds).toHaveLength(9)
      expect(valuesCall.definition.allowedKinds).toContain('person')
      expect(valuesCall.definition.allowedKinds).toContain('link')
      expect(valuesCall.definition.allowedKinds).toContain('site')
    })

    it('should use onConflictDoUpdate for upsert behavior', async () => {
      // Arrange
      const content = JSON.stringify(mockSetDefinitionData)

      // Act
      await saveSetDefinitionArtifact(mockArtifact, content)

      // Assert
      const onConflictCall = mockInsert().values().onConflictDoUpdate.mock.calls[0][0]
      expect(onConflictCall.target).toEqual(['artifactId', 'createdAt'])
      expect(onConflictCall.set).toEqual({
        definition: mockSetDefinitionData.definition,
        validationRules: mockSetDefinitionData.validationRules,
        defaultSorting: mockSetDefinitionData.defaultSorting,
        allowDuplicates: mockSetDefinitionData.allowDuplicates
      })
    })

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('JSONB validation failed')
      mockInsert().values().onConflictDoUpdate.mockRejectedValue(dbError)

      // Act & Assert
      await expect(
        saveSetDefinitionArtifact(mockArtifact, JSON.stringify(mockSetDefinitionData))
      ).rejects.toThrow('JSONB validation failed')
    })
  })

  describe('loadSetDefinitionArtifact', () => {

    it('should load set definition artifact successfully', async () => {
      // Arrange
      const mockSetDefinitionRecord = {
        artifactId: mockArtifact.id,
        createdAt: mockArtifact.createdAt,
        ...mockSetDefinitionData,
        createdAtInternal: new Date(),
        updatedAt: new Date()
      }
      
      mockSelect().from().where().limit.mockResolvedValue([mockSetDefinitionRecord])

      // Act
      const result = await loadSetDefinitionArtifact(mockArtifact.id, mockArtifact.createdAt)

      // Assert
      expect(result).toEqual(mockSetDefinitionRecord)
      expect(mockSelect).toHaveBeenCalled()
    })

    it('should return null when set definition not found', async () => {
      // Arrange
      mockSelect().from().where().limit.mockResolvedValue([])

      // Act
      const result = await loadSetDefinitionArtifact('non-existent-id', new Date())

      // Assert
      expect(result).toBeNull()
    })

    it('should use correct where conditions with composite key', async () => {
      // Arrange
      const testCreatedAt = new Date('2025-01-15T12:00:00Z')

      // Act
      await loadSetDefinitionArtifact('test-set-def-id', testCreatedAt)

      // Assert
      const whereCall = mockSelect().from().where.mock.calls[0][0]
      expect(whereCall).toEqual({
        conditions: [
          { field: 'artifactId', value: 'test-set-def-id', type: 'eq' },
          { field: 'createdAt', value: testCreatedAt, type: 'eq' }
        ],
        type: 'and'
      })
    })

    it('should handle database errors in load operation', async () => {
      // Arrange
      const dbError = new Error('JSONB parsing error')
      mockSelect().from().where().limit.mockRejectedValue(dbError)

      // Act & Assert
      await expect(
        loadSetDefinitionArtifact(mockArtifact.id, mockArtifact.createdAt)
      ).rejects.toThrow('JSONB parsing error')
    })
  })

  describe('deleteSetDefinitionArtifact', () => {

    it('should delete set definition artifact successfully', async () => {
      // Act
      await deleteSetDefinitionArtifact(mockArtifact.id, mockArtifact.createdAt)

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
      const dbError = new Error('Cannot delete set definition with active sets')
      mockDelete().where.mockRejectedValue(dbError)

      // Act & Assert
      await expect(
        deleteSetDefinitionArtifact(mockArtifact.id, mockArtifact.createdAt)
      ).rejects.toThrow('Cannot delete set definition with active sets')
    })

    it('should use correct where conditions for deletion', async () => {
      // Arrange
      const testId = 'set-def-to-delete'
      const testCreatedAt = new Date('2025-03-01T20:15:00Z')

      // Act
      await deleteSetDefinitionArtifact(testId, testCreatedAt)

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

  describe('Complex validation rules scenarios', () => {

    it('should handle department-specific validation rules', async () => {
      // Arrange
      const departmentDefinition = {
        definition: {
          allowedKinds: ['person'],
          maxItems: 200,
          requiredFields: ['fullName', 'email', 'department']
        },
        validationRules: {
          departmentLimits: {
            'Engineering': 80,
            'Product': 30,
            'Design': 20,
            'Sales': 40,
            'HR': 10
          },
          uniqueFieldsByDepartment: {
            'Engineering': ['email', 'githubUsername'],
            'Sales': ['email', 'salesforceId']
          },
          requiredSkillsByDepartment: {
            'Engineering': ['JavaScript', 'TypeScript'],
            'Design': ['Figma', 'Sketch']
          }
        },
        defaultSorting: 'department',
        allowDuplicates: false
      }
      const jsonContent = JSON.stringify(departmentDefinition)

      // Act
      await saveSetDefinitionArtifact(mockArtifact, jsonContent)

      // Assert
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall.validationRules.departmentLimits).toBeDefined()
      expect(valuesCall.validationRules.departmentLimits.Engineering).toBe(80)
      expect(valuesCall.validationRules.uniqueFieldsByDepartment).toBeDefined()
      expect(valuesCall.defaultSorting).toBe('department')
    })

    it('should handle mixed artifact type definitions', async () => {
      // Arrange
      const mixedDefinition = {
        definition: {
          allowedKinds: ['person', 'link', 'faq-item'],
          maxItems: 150,
          requiredFields: ['title'],
          optionalFields: ['category', 'tags']
        },
        validationRules: {
          personRequiredFields: ['fullName', 'email'],
          linkRequiredFields: ['url', 'title'],
          faqRequiredFields: ['question', 'answer'],
          categoryEnum: ['HR', 'IT', 'General', 'Emergency'],
          maxItemsByKind: {
            'person': 50,
            'link': 75,
            'faq-item': 25
          }
        },
        defaultSorting: 'category',
        allowDuplicates: true
      }
      const jsonContent = JSON.stringify(mixedDefinition)

      // Act
      await saveSetDefinitionArtifact(mockArtifact, jsonContent)

      // Assert
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall.definition.allowedKinds).toEqual(['person', 'link', 'faq-item'])
      expect(valuesCall.validationRules.maxItemsByKind).toBeDefined()
      expect(valuesCall.validationRules.personRequiredFields).toEqual(['fullName', 'email'])
      expect(valuesCall.allowDuplicates).toBe(true)
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
      const mockSetDefinitionRecord = {
        artifactId: mockArtifact.id,
        createdAt: mockArtifact.createdAt,
        ...mockSetDefinitionData,
        createdAtInternal: new Date(),
        updatedAt: new Date()
      }
      const mockLimit = vi.fn().mockResolvedValue([mockSetDefinitionRecord])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockSelect.mockReturnValue({ from: mockFrom })

      // Setup delete
      const mockDeleteWhere = vi.fn().mockResolvedValue(undefined)
      mockDelete.mockReturnValue({ where: mockDeleteWhere })

      // Act
      await saveSetDefinitionArtifact(mockArtifact, JSON.stringify(mockSetDefinitionData))
      const loaded = await loadSetDefinitionArtifact(mockArtifact.id, mockArtifact.createdAt)
      await deleteSetDefinitionArtifact(mockArtifact.id, mockArtifact.createdAt)

      // Assert
      expect(loaded).toEqual(mockSetDefinitionRecord)
      expect((loaded as any)?.definition.allowedKinds).toEqual(['person', 'address'])
      expect((loaded as any)?.validationRules.uniqueEmails).toBe(true)
      expect(mockInsert).toHaveBeenCalled()
      expect(mockSelect).toHaveBeenCalled()
      expect(mockDelete).toHaveBeenCalledTimes(1)
    })

    it('should preserve complex JSONB structures through full cycle', async () => {
      // Arrange
      const complexDefinition = {
        definition: {
          allowedKinds: ['person', 'address', 'link', 'faq-item'],
          maxItems: 500,
          requiredFields: ['title', 'category'],
          optionalFields: ['description', 'tags', 'priority'],
          validation: {
            titleMinLength: 3,
            titleMaxLength: 100,
            categoryEnum: ['Critical', 'Important', 'Normal', 'Low']
          }
        },
        validationRules: {
          uniqueConstraints: ['title', 'url'],
          fieldValidation: {
            email: '^[\\w\\.-]+@[\\w\\.-]+\\.\\w+$',
            phone: '^\\+?[1-9]\\d{1,14}$',
            url: '^https?:\\/\\/.+'
          },
          businessRules: {
            maxManagersPerDepartment: 5,
            requiredApprovalForSeniorRoles: true,
            autoAssignCategories: {
              'person': 'HR',
              'link': 'Resources',
              'faq-item': 'Support'
            }
          }
        },
        defaultSorting: 'priority',
        allowDuplicates: false
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
        ...complexDefinition,
        createdAtInternal: new Date(),
        updatedAt: new Date()
      }
      const mockLimit = vi.fn().mockResolvedValue([savedRecord])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockSelect.mockReturnValue({ from: mockFrom })

      // Act
      await saveSetDefinitionArtifact(mockArtifact, JSON.stringify(complexDefinition))
      const loaded = await loadSetDefinitionArtifact(mockArtifact.id, mockArtifact.createdAt)

      // Assert
      expect((loaded as any)?.definition.validation).toEqual(complexDefinition.definition.validation)
      expect((loaded as any)?.validationRules.businessRules).toEqual(complexDefinition.validationRules.businessRules)
      expect((loaded as any)?.validationRules.fieldValidation).toEqual(complexDefinition.validationRules.fieldValidation)
      expect(loaded?.defaultSorting).toBe('priority')
    })
  })
})

// END OF: tests/unit/artifacts/kinds/set-definition/server.test.ts