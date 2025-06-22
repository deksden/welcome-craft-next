/**
 * @file tests/unit/artifacts/kinds/address/server.test.ts
 * @description Unit tests для UC-10 Address Artifact Saver
 * @version 1.0.0
 * @date 2025-06-21
 * @updated Полностью исправленные тесты с правильным мокированием database операций
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveAddressArtifact, loadAddressArtifact, deleteAddressArtifact } from '@/artifacts/kinds/address/server'
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
    artifactAddress: {
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

describe('Address Artifact Saver', () => {
  const mockArtifact: Artifact = {
    id: 'test-address-456',
    createdAt: new Date('2025-01-01T10:00:00Z'),
    title: 'Company HQ Address',
    summary: '',
    kind: 'address',
    userId: 'user-123',
    authorId: 'user-123',
    deletedAt: null,
    publication_state: [],
    world_id: null
  }

  const mockAddressData = {
    streetAddress: '1600 Amphitheatre Parkway',
    city: 'Mountain View',
    state: 'California',
    postalCode: '94043',
    country: 'United States',
    latitude: '37.4221',
    longitude: '-122.0844',
    timezone: 'America/Los_Angeles'
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

  describe('saveAddressArtifact', () => {
    it('should save address artifact with complete JSON content', async () => {
      // Arrange
      const jsonContent = JSON.stringify(mockAddressData)

      // Act
      await saveAddressArtifact(mockArtifact, jsonContent)

      // Assert
      expect(mockInsert).toHaveBeenCalledTimes(1)
      expect(mockValues).toHaveBeenCalledWith({
        artifactId: mockArtifact.id,
        createdAt: mockArtifact.createdAt,
        streetAddress: mockAddressData.streetAddress,
        city: mockAddressData.city,
        state: mockAddressData.state,
        postalCode: mockAddressData.postalCode,
        country: mockAddressData.country,
        latitude: mockAddressData.latitude,
        longitude: mockAddressData.longitude,
        timezone: mockAddressData.timezone
      })
    })

    it('should save address with minimal required fields only', async () => {
      // Arrange
      const minimalAddress = {
        streetAddress: '123 Main St',
        city: 'Anytown',
        country: 'USA'
      }
      const jsonContent = JSON.stringify(minimalAddress)

      // Act
      await saveAddressArtifact(mockArtifact, jsonContent)

      // Assert
      expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
        streetAddress: '123 Main St',
        city: 'Anytown',
        country: 'USA'
      }))
    })

    it('should parse plain text as streetAddress with title fallback', async () => {
      // Arrange
      const plainTextContent = '456 Oak Avenue, Springfield'

      // Act
      await saveAddressArtifact(mockArtifact, plainTextContent)

      // Assert
      expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
        streetAddress: '456 Oak Avenue, Springfield',
        city: 'Unknown City',
        country: 'Unknown Country'
      }))
    })

    it('should merge metadata with parsed content', async () => {
      // Arrange
      const partialContent = JSON.stringify({
        streetAddress: '789 Pine St',
        city: 'Seattle',
        country: 'US'
      })
      const metadata = {
        state: 'Washington',
        postalCode: '98101',
        country: 'United States'
      }

      // Act
      await saveAddressArtifact(mockArtifact, partialContent, metadata)

      // Assert
      expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
        streetAddress: '789 Pine St',
        city: 'Seattle',
        state: 'Washington',
        postalCode: '98101',
        country: 'United States'
      }))
    })

    it('should throw error when required fields are missing', async () => {
      // Arrange
      const invalidContent = JSON.stringify({ state: 'California' }) // Missing streetAddress, city, country
      const artifactWithoutTitle = { ...mockArtifact, title: '' }

      // Act & Assert
      await expect(
        saveAddressArtifact(artifactWithoutTitle, invalidContent)
      ).rejects.toThrow('Address requires streetAddress, city, and country')
    })

    it('should handle coordinate data as strings', async () => {
      // Arrange
      const addressWithCoords = {
        ...mockAddressData,
        latitude: '40.7128',
        longitude: '-74.0060'
      }
      const jsonContent = JSON.stringify(addressWithCoords)

      // Act
      await saveAddressArtifact(mockArtifact, jsonContent)

      // Assert
      expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
        latitude: '40.7128',
        longitude: '-74.0060'
      }))
    })

    it('should use onConflictDoUpdate for upsert behavior', async () => {
      // Arrange
      const content = JSON.stringify(mockAddressData)

      // Act
      await saveAddressArtifact(mockArtifact, content)

      // Assert
      expect(mockOnConflictDoUpdate).toHaveBeenCalledWith({
        target: ['artifactId', 'createdAt'],
        set: {
          streetAddress: mockAddressData.streetAddress,
          city: mockAddressData.city,
          state: mockAddressData.state,
          postalCode: mockAddressData.postalCode,
          country: mockAddressData.country,
          latitude: mockAddressData.latitude,
          longitude: mockAddressData.longitude,
          timezone: mockAddressData.timezone
        }
      })
    })

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database constraint violation')
      mockOnConflictDoUpdate.mockRejectedValue(dbError)

      // Act & Assert
      await expect(
        saveAddressArtifact(mockArtifact, JSON.stringify(mockAddressData))
      ).rejects.toThrow('Database constraint violation')
    })
  })

  describe('loadAddressArtifact', () => {
    it('should load address artifact successfully', async () => {
      // Arrange
      const mockAddressRecord = {
        artifactId: mockArtifact.id,
        createdAt: mockArtifact.createdAt,
        ...mockAddressData,
        createdAtInternal: new Date(),
        updatedAt: new Date()
      }
      
      mockLimit.mockResolvedValue([mockAddressRecord])

      // Act
      const result = await loadAddressArtifact(mockArtifact.id, mockArtifact.createdAt)

      // Assert
      expect(result).toEqual(mockAddressRecord)
      expect(mockSelect).toHaveBeenCalledTimes(1)
    })

    it('should return null when address not found', async () => {
      // Arrange
      mockLimit.mockResolvedValue([])

      // Act
      const result = await loadAddressArtifact('non-existent-id', new Date())

      // Assert
      expect(result).toBeNull()
    })

    it('should use correct where conditions with composite key', async () => {
      // Arrange
      const testCreatedAt = new Date('2025-01-15T12:00:00Z')

      // Act
      await loadAddressArtifact('test-address-id', testCreatedAt)

      // Assert
      expect(mockWhere).toHaveBeenCalledWith({
        conditions: [
          { field: 'artifactId', value: 'test-address-id', type: 'eq' },
          { field: 'createdAt', value: testCreatedAt, type: 'eq' }
        ],
        type: 'and'
      })
    })

    it('should handle database errors in load operation', async () => {
      // Arrange
      const dbError = new Error('Connection timeout')
      mockLimit.mockRejectedValue(dbError)

      // Act & Assert
      await expect(
        loadAddressArtifact(mockArtifact.id, mockArtifact.createdAt)
      ).rejects.toThrow('Connection timeout')
    })
  })

  describe('deleteAddressArtifact', () => {
    it('should delete address artifact successfully', async () => {
      // Arrange
      mockWhere.mockResolvedValue(undefined)

      // Act
      await deleteAddressArtifact(mockArtifact.id, mockArtifact.createdAt)

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
      const dbError = new Error('Foreign key constraint violation')
      mockWhere.mockRejectedValue(dbError)

      // Act & Assert
      await expect(
        deleteAddressArtifact(mockArtifact.id, mockArtifact.createdAt)
      ).rejects.toThrow('Foreign key constraint violation')
    })

    it('should use correct where conditions for deletion', async () => {
      // Arrange
      const testId = 'address-to-delete'
      const testCreatedAt = new Date('2025-02-15T14:30:00Z')
      mockWhere.mockResolvedValue(undefined)

      // Act
      await deleteAddressArtifact(testId, testCreatedAt)

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

  describe('Geolocation and timezone scenarios', () => {
    it('should handle international addresses with different timezone formats', async () => {
      // Arrange
      const internationalAddress = {
        streetAddress: '1-1 Ōtemachi, Chiyoda City',
        city: 'Tokyo',
        state: 'Tokyo Metropolis',
        postalCode: '100-0004',
        country: 'Japan',
        latitude: '35.6762',
        longitude: '139.6503',
        timezone: 'Asia/Tokyo'
      }
      const jsonContent = JSON.stringify(internationalAddress)

      // Act
      await saveAddressArtifact(mockArtifact, jsonContent)

      // Assert
      expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
        country: 'Japan',
        timezone: 'Asia/Tokyo',
        latitude: '35.6762',
        longitude: '139.6503'
      }))
    })

    it('should handle addresses without coordinates gracefully', async () => {
      // Arrange
      const addressWithoutCoords = {
        streetAddress: '10 Downing Street',
        city: 'London',
        postalCode: 'SW1A 2AA',
        country: 'United Kingdom'
        // No latitude, longitude, timezone
      }
      const jsonContent = JSON.stringify(addressWithoutCoords)

      // Act
      await saveAddressArtifact(mockArtifact, jsonContent)

      // Assert
      expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
        streetAddress: '10 Downing Street',
        country: 'United Kingdom'
      }))
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete lifecycle: save -> load -> delete', async () => {
      // Arrange
      const mockAddressRecord = {
        artifactId: mockArtifact.id,
        createdAt: mockArtifact.createdAt,
        ...mockAddressData,
        createdAtInternal: new Date(),
        updatedAt: new Date()
      }
      
      // Setup для load операции - переопределяем цепочку
      const mockLoadWhere = vi.fn().mockReturnValue({ limit: mockLimit })
      mockFrom.mockReturnValue({ where: mockLoadWhere })
      mockLimit.mockResolvedValueOnce([mockAddressRecord])
      
      // Setup для delete операции - отдельный мок
      const mockDeleteWhere = vi.fn().mockResolvedValueOnce(undefined)
      mockDelete.mockReturnValue({ where: mockDeleteWhere })

      // Act
      await saveAddressArtifact(mockArtifact, JSON.stringify(mockAddressData))
      const loaded = await loadAddressArtifact(mockArtifact.id, mockArtifact.createdAt)
      await deleteAddressArtifact(mockArtifact.id, mockArtifact.createdAt)

      // Assert
      expect(loaded).toEqual(mockAddressRecord)
      expect(mockInsert).toHaveBeenCalledTimes(1)
      expect(mockSelect).toHaveBeenCalledTimes(1)
      expect(mockDelete).toHaveBeenCalledTimes(1)
    })
  })
})

// END OF: tests/unit/artifacts/kinds/address/server.test.ts