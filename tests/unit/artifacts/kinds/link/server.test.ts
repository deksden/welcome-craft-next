/**
 * @file tests/unit/artifacts/kinds/link/server.test.ts
 * @description Unit tests для UC-10 Link Artifact Saver
 * @version 1.0.0
 * @date 2025-06-21
 * @updated Создан полный набор тестов для link/server.ts функций с проверкой URL validation, isInternal logic и iconUrl handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveLinkArtifact, loadLinkArtifact, deleteLinkArtifact } from '@/artifacts/kinds/link/server'
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
    artifactLink: {
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

describe('Link Artifact Saver', () => {
  const mockArtifact: Artifact = {
    id: 'test-link-101',
    createdAt: new Date('2025-01-01T10:00:00Z'),
    title: 'Company Wiki',
    summary: '',
    kind: 'link',
    userId: 'user-123',
    authorId: 'user-123',
    deletedAt: null,
    publication_state: [],
    world_id: null
  }

  const mockLinkData = {
    url: 'https://wiki.company.com',
    title: 'Internal Company Wiki',
    description: 'Comprehensive knowledge base for all company processes and documentation',
    category: 'Documentation',
    iconUrl: 'https://wiki.company.com/favicon.ico',
    isInternal: true
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

  describe('saveLinkArtifact', () => {

    it('should save link artifact with complete JSON content', async () => {
      // Arrange
      const jsonContent = JSON.stringify(mockLinkData)

      // Act
      await saveLinkArtifact(mockArtifact, jsonContent)

      // Assert
      expect(mockInsert).toHaveBeenCalledTimes(1)
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall).toEqual({
        artifactId: mockArtifact.id,
        createdAt: mockArtifact.createdAt,
        url: mockLinkData.url,
        title: mockLinkData.title,
        description: mockLinkData.description,
        category: mockLinkData.category,
        iconUrl: mockLinkData.iconUrl,
        isInternal: mockLinkData.isInternal
      })
    })

    it('should parse plain text as URL with title fallback', async () => {
      // Arrange
      const plainTextContent = 'https://github.com/company/project'

      // Act
      await saveLinkArtifact(mockArtifact, plainTextContent)

      // Assert
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall.url).toBe('https://github.com/company/project')
      expect(valuesCall.title).toBe(mockArtifact.title) // Fallback to artifact title
      expect(valuesCall.isInternal).toBe(false) // Default value
    })

    it('should save link with minimal required fields only', async () => {
      // Arrange
      const minimalLink = {
        url: 'https://example.com',
        title: 'Example Website'
      }
      const jsonContent = JSON.stringify(minimalLink)

      // Act
      await saveLinkArtifact(mockArtifact, jsonContent)

      // Assert
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall.url).toBe('https://example.com')
      expect(valuesCall.title).toBe('Example Website')
      expect(valuesCall.description).toBeUndefined()
      expect(valuesCall.category).toBeUndefined()
      expect(valuesCall.iconUrl).toBeUndefined()
      expect(valuesCall.isInternal).toBe(false)
    })

    it('should merge metadata with parsed content', async () => {
      // Arrange
      const partialContent = JSON.stringify({
        url: 'https://docs.company.com',
        title: 'Technical Documentation'
      })
      const metadata = {
        description: 'API documentation and technical guides',
        category: 'Development',
        isInternal: true,
        iconUrl: 'https://docs.company.com/icon.png'
      }

      // Act
      await saveLinkArtifact(mockArtifact, partialContent, metadata)

      // Assert
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall.url).toBe('https://docs.company.com')
      expect(valuesCall.title).toBe('Technical Documentation')
      expect(valuesCall.description).toBe('API documentation and technical guides')
      expect(valuesCall.category).toBe('Development')
      expect(valuesCall.isInternal).toBe(true)
      expect(valuesCall.iconUrl).toBe('https://docs.company.com/icon.png')
    })

    it('should throw error when required fields are missing', async () => {
      // Arrange
      const invalidContent = JSON.stringify({ description: 'Some description' }) // Missing url and title
      const artifactWithoutTitle = { ...mockArtifact, title: '' }

      // Act & Assert
      await expect(
        saveLinkArtifact(artifactWithoutTitle, invalidContent)
      ).rejects.toThrow('Link URL and title are required')
    })

    it('should handle various URL formats correctly', async () => {
      // Arrange
      const urlVariations = [
        'https://secure.company.com/portal',
        'http://internal.company.local:8080/app',
        'ftp://files.company.com/documents',
        'mailto:support@company.com'
      ]

      for (const url of urlVariations) {
        const linkData = {
          url,
          title: `Link to ${url}`
        }
        const jsonContent = JSON.stringify(linkData)

        // Act
        await saveLinkArtifact(mockArtifact, jsonContent)

        // Assert
        const valuesCall = mockInsert().values.mock.calls[mockInsert().values.mock.calls.length - 1][0]
        expect(valuesCall.url).toBe(url)
      }
    })

    it('should handle isInternal boolean flag correctly', async () => {
      // Arrange
      const internalLink = {
        url: 'https://intranet.company.com',
        title: 'Company Intranet',
        isInternal: true
      }
      const externalLink = {
        url: 'https://google.com',
        title: 'Google Search',
        isInternal: false
      }

      // Act & Assert for internal link
      await saveLinkArtifact(mockArtifact, JSON.stringify(internalLink))
      let valuesCall = mockInsert().values.mock.calls[mockInsert().values.mock.calls.length - 1][0]
      expect(valuesCall.isInternal).toBe(true)

      // Act & Assert for external link
      await saveLinkArtifact(mockArtifact, JSON.stringify(externalLink))
      valuesCall = mockInsert().values.mock.calls[mockInsert().values.mock.calls.length - 1][0]
      expect(valuesCall.isInternal).toBe(false)
    })

    it('should use onConflictDoUpdate for upsert behavior', async () => {
      // Arrange
      const content = JSON.stringify(mockLinkData)

      // Act
      await saveLinkArtifact(mockArtifact, content)

      // Assert
      const onConflictCall = mockInsert().values().onConflictDoUpdate.mock.calls[0][0]
      expect(onConflictCall.target).toEqual(['artifactId', 'createdAt'])
      expect(onConflictCall.set).toEqual(expect.objectContaining({
        url: mockLinkData.url,
        title: mockLinkData.title,
        description: mockLinkData.description,
        category: mockLinkData.category,
        iconUrl: mockLinkData.iconUrl,
        isInternal: mockLinkData.isInternal
      }))
    })

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('URL constraint violation')
      mockInsert().values().onConflictDoUpdate.mockRejectedValue(dbError)

      // Act & Assert
      await expect(
        saveLinkArtifact(mockArtifact, JSON.stringify(mockLinkData))
      ).rejects.toThrow('URL constraint violation')
    })
  })

  describe('loadLinkArtifact', () => {

    it('should load link artifact successfully', async () => {
      // Arrange
      const mockLinkRecord = {
        artifactId: mockArtifact.id,
        createdAt: mockArtifact.createdAt,
        ...mockLinkData,
        createdAtInternal: new Date(),
        updatedAt: new Date()
      }
      
      mockSelect().from().where().limit.mockResolvedValue([mockLinkRecord])

      // Act
      const result = await loadLinkArtifact(mockArtifact.id, mockArtifact.createdAt)

      // Assert
      expect(result).toEqual(mockLinkRecord)
      expect(mockSelect).toHaveBeenCalled()
    })

    it('should return null when link not found', async () => {
      // Arrange
      mockSelect().from().where().limit.mockResolvedValue([])

      // Act
      const result = await loadLinkArtifact('non-existent-id', new Date())

      // Assert
      expect(result).toBeNull()
    })

    it('should use correct where conditions with composite key', async () => {
      // Arrange
      const testCreatedAt = new Date('2025-01-15T12:00:00Z')

      // Act
      await loadLinkArtifact('test-link-id', testCreatedAt)

      // Assert
      const whereCall = mockSelect().from().where.mock.calls[0][0]
      expect(whereCall).toEqual({
        conditions: [
          { field: 'artifactId', value: 'test-link-id', type: 'eq' },
          { field: 'createdAt', value: testCreatedAt, type: 'eq' }
        ],
        type: 'and'
      })
    })

    it('should handle database errors in load operation', async () => {
      // Arrange
      const dbError = new Error('Connection refused')
      mockSelect().from().where().limit.mockRejectedValue(dbError)

      // Act & Assert
      await expect(
        loadLinkArtifact(mockArtifact.id, mockArtifact.createdAt)
      ).rejects.toThrow('Connection refused')
    })
  })

  describe('deleteLinkArtifact', () => {

    it('should delete link artifact successfully', async () => {
      // Act
      await deleteLinkArtifact(mockArtifact.id, mockArtifact.createdAt)

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
      const dbError = new Error('Cannot delete referenced link')
      mockDelete().where.mockRejectedValue(dbError)

      // Act & Assert
      await expect(
        deleteLinkArtifact(mockArtifact.id, mockArtifact.createdAt)
      ).rejects.toThrow('Cannot delete referenced link')
    })

    it('should use correct where conditions for deletion', async () => {
      // Arrange
      const testId = 'link-to-delete'
      const testCreatedAt = new Date('2025-02-25T18:30:00Z')

      // Act
      await deleteLinkArtifact(testId, testCreatedAt)

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

  describe('URL and category scenarios', () => {

    it('should handle internal company links with specific categories', async () => {
      // Arrange
      const internalLinks = [
        {
          url: 'https://hr.company.com/benefits',
          title: 'Employee Benefits Portal',
          category: 'HR',
          isInternal: true
        },
        {
          url: 'https://git.company.com/repos',
          title: 'Code Repository',
          category: 'Development',
          isInternal: true
        },
        {
          url: 'https://jira.company.com/projects',
          title: 'Project Management',
          category: 'Project Management',
          isInternal: true
        }
      ]

      for (const linkData of internalLinks) {
        // Act
        await saveLinkArtifact(mockArtifact, JSON.stringify(linkData))

        // Assert
        const valuesCall = mockInsert().values.mock.calls[mockInsert().values.mock.calls.length - 1][0]
        expect(valuesCall.isInternal).toBe(true)
        expect(valuesCall.category).toBe(linkData.category)
        expect(valuesCall.url).toBe(linkData.url)
      }
    })

    it('should handle external links with proper categorization', async () => {
      // Arrange
      const externalLinks = [
        {
          url: 'https://stackoverflow.com',
          title: 'Stack Overflow',
          description: 'Programming Q&A community',
          category: 'Development Resources',
          isInternal: false
        },
        {
          url: 'https://aws.amazon.com/console',
          title: 'AWS Console',
          description: 'Cloud infrastructure management',
          category: 'Cloud Services',
          isInternal: false
        }
      ]

      for (const linkData of externalLinks) {
        // Act
        await saveLinkArtifact(mockArtifact, JSON.stringify(linkData))

        // Assert
        const valuesCall = mockInsert().values.mock.calls[mockInsert().values.mock.calls.length - 1][0]
        expect(valuesCall.isInternal).toBe(false)
        expect(valuesCall.category).toBe(linkData.category)
        expect(valuesCall.description).toBe(linkData.description)
      }
    })

    it('should handle links with custom icons correctly', async () => {
      // Arrange
      const linkWithIcon = {
        url: 'https://confluence.company.com',
        title: 'Confluence Wiki',
        description: 'Team collaboration and documentation',
        iconUrl: 'https://confluence.company.com/s/7a7f0/94b9ac/images/logos/confluence-logo.png',
        isInternal: true,
        category: 'Documentation'
      }
      const jsonContent = JSON.stringify(linkWithIcon)

      // Act
      await saveLinkArtifact(mockArtifact, jsonContent)

      // Assert
      const valuesCall = mockInsert().values.mock.calls[0][0]
      expect(valuesCall.iconUrl).toBe(linkWithIcon.iconUrl)
      expect(valuesCall.category).toBe('Documentation')
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
      const mockLinkRecord = {
        artifactId: mockArtifact.id,
        createdAt: mockArtifact.createdAt,
        ...mockLinkData,
        createdAtInternal: new Date(),
        updatedAt: new Date()
      }
      const mockLimit = vi.fn().mockResolvedValue([mockLinkRecord])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockSelect.mockReturnValue({ from: mockFrom })

      // Setup delete
      const mockDeleteWhere = vi.fn().mockResolvedValue(undefined)
      mockDelete.mockReturnValue({ where: mockDeleteWhere })

      // Act
      await saveLinkArtifact(mockArtifact, JSON.stringify(mockLinkData))
      const loaded = await loadLinkArtifact(mockArtifact.id, mockArtifact.createdAt)
      await deleteLinkArtifact(mockArtifact.id, mockArtifact.createdAt)

      // Assert
      expect(loaded).toEqual(mockLinkRecord)
      expect(loaded?.isInternal).toBe(true)
      expect(loaded?.url).toBe(mockLinkData.url)
      expect(mockInsert).toHaveBeenCalledTimes(1)
      expect(mockSelect).toHaveBeenCalled()
      expect(mockDelete).toHaveBeenCalledTimes(1)
    })

    it('should preserve URL integrity and metadata through full cycle', async () => {
      // Arrange
      const complexLink = {
        url: 'https://api.company.com/v2/docs?format=interactive&auth=required',
        title: 'API Documentation v2',
        description: 'Interactive API documentation with authentication requirements and code examples',
        category: 'API Documentation',
        iconUrl: 'https://api.company.com/favicon-32x32.png',
        isInternal: true
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
        ...complexLink,
        createdAtInternal: new Date(),
        updatedAt: new Date()
      }
      const mockLimit = vi.fn().mockResolvedValue([savedRecord])
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      mockSelect.mockReturnValue({ from: mockFrom })

      // Act
      await saveLinkArtifact(mockArtifact, JSON.stringify(complexLink))
      const loaded = await loadLinkArtifact(mockArtifact.id, mockArtifact.createdAt)

      // Assert
      expect(loaded?.url).toBe(complexLink.url)
      expect(loaded?.description).toBe(complexLink.description)
      expect(loaded?.iconUrl).toBe(complexLink.iconUrl)
      expect(loaded?.isInternal).toBe(true)
      expect(loaded?.category).toBe('API Documentation')
    })
  })
})

// END OF: tests/unit/artifacts/kinds/link/server.test.ts