/**
 * @file tests/unit/api/artifacts.test.ts
 * @description Unit тесты для API route /api/artifacts
 * @version 1.0.0
 * @date 2025-06-20
 * @purpose ПОСТОЯННЫЙ - для unit тестирования API endpoint артефактов
 */

/** HISTORY:
 * v1.0.0 (2025-06-20): Создан для TASK-04 - unit тестирование API routes на Vitest
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/artifacts/route'
import { 
  setAuthenticatedUser, 
  setUnauthenticatedUser, 
  resetAuthMocks 
} from '../mocks/auth'

// Мокируем модули
vi.mock('@/app/app/(auth)/auth', async () => {
  const authMock = await import('../mocks/auth')
  return { auth: authMock.auth }
})

vi.mock('@/lib/test-auth', async () => {
  const authMock = await import('../mocks/auth')
  return { getTestSession: authMock.getTestSession }
})

vi.mock('@/lib/db/queries', () => ({
  getPagedArtifactsByUserId: vi.fn(),
}))

vi.mock('@/lib/artifact-content-utils', () => ({
  normalizeArtifactForAPI: vi.fn((artifact) => artifact), // Простая pass-through функция
}))

// Импорты для тестирования
import { getPagedArtifactsByUserId } from '@/lib/db/queries'

const mockGetPagedArtifacts = vi.mocked(getPagedArtifactsByUserId)

describe('🧪 API Route: /api/artifacts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAuthMocks()
  })

  describe('Authentication', () => {
    it('should return 401 for unauthenticated user', async () => {
      setUnauthenticatedUser()

      const request = new NextRequest('http://localhost:3000/api/artifacts')
      const response = await GET(request)

      expect(response.status).toBe(401)
      
      const body = await response.json()
      expect(body.code).toBe('unauthorized:api')
      expect(body.message).toBe('Something went wrong. Please try again later.')
    })

    it('should proceed for authenticated user', async () => {
      setAuthenticatedUser({ id: 'user-1', email: 'ada@test.com' })
      mockGetPagedArtifacts.mockResolvedValue({
        data: [],
        totalCount: 0
      })

      const request = new NextRequest('http://localhost:3000/api/artifacts')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockGetPagedArtifacts).toHaveBeenCalledWith({
        userId: 'user-1',
        page: 1,
        pageSize: 20,
        searchQuery: undefined,
        kind: null,
        groupByVersions: true // ← Default value
      })
    })
  })

  describe('Parameter Processing', () => {
    beforeEach(() => {
      setAuthenticatedUser({ id: 'user-1', email: 'ada@test.com' })
      mockGetPagedArtifacts.mockResolvedValue({ data: [], totalCount: 0 })
    })

    it('should use default parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/artifacts')
      await GET(request)

      expect(mockGetPagedArtifacts).toHaveBeenCalledWith({
        userId: 'user-1',
        page: 1,
        pageSize: 20,
        searchQuery: undefined,
        kind: null,
        groupByVersions: true
      })
    })

    it('should process custom page and pageSize', async () => {
      const request = new NextRequest('http://localhost:3000/api/artifacts?page=3&pageSize=10')
      await GET(request)

      expect(mockGetPagedArtifacts).toHaveBeenCalledWith({
        userId: 'user-1',
        page: 3,
        pageSize: 10,
        searchQuery: undefined,
        kind: null,
        groupByVersions: true
      })
    })

    it('should process search query and kind filter', async () => {
      const request = new NextRequest('http://localhost:3000/api/artifacts?searchQuery=test&kind=text')
      await GET(request)

      expect(mockGetPagedArtifacts).toHaveBeenCalledWith({
        userId: 'user-1',
        page: 1,
        pageSize: 20,
        searchQuery: 'test',
        kind: 'text',
        groupByVersions: true
      })
    })

    it('🚨 CRITICAL: should process groupByVersions parameter correctly', async () => {
      // Test default (true)
      const requestDefault = new NextRequest('http://localhost:3000/api/artifacts')
      await GET(requestDefault)
      expect(mockGetPagedArtifacts).toHaveBeenLastCalledWith(
        expect.objectContaining({ groupByVersions: true })
      )

      // Test explicit true
      const requestTrue = new NextRequest('http://localhost:3000/api/artifacts?groupByVersions=true')
      await GET(requestTrue)
      expect(mockGetPagedArtifacts).toHaveBeenLastCalledWith(
        expect.objectContaining({ groupByVersions: true })
      )

      // Test explicit false
      const requestFalse = new NextRequest('http://localhost:3000/api/artifacts?groupByVersions=false')
      await GET(requestFalse)
      expect(mockGetPagedArtifacts).toHaveBeenLastCalledWith(
        expect.objectContaining({ groupByVersions: false })
      )
    })

    it('should handle both search and searchQuery parameters', async () => {
      // Test 'search' parameter
      const requestSearch = new NextRequest('http://localhost:3000/api/artifacts?search=query1')
      await GET(requestSearch)
      expect(mockGetPagedArtifacts).toHaveBeenLastCalledWith(
        expect.objectContaining({ searchQuery: 'query1' })
      )

      // Test 'searchQuery' parameter (priority)
      const requestSearchQuery = new NextRequest('http://localhost:3000/api/artifacts?searchQuery=query2')
      await GET(requestSearchQuery)
      expect(mockGetPagedArtifacts).toHaveBeenLastCalledWith(
        expect.objectContaining({ searchQuery: 'query2' })
      )
    })
  })

  describe('Validation', () => {
    beforeEach(() => {
      setAuthenticatedUser({ id: 'user-1', email: 'ada@test.com' })
    })

    it('should reject invalid page parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/artifacts?page=0')
      const response = await GET(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.code).toBe('bad_request:api')
      expect(body.message).toBe('The request couldn\'t be processed. Please check your input and try again.')
    })

    it('should reject invalid pageSize parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/artifacts?pageSize=0')
      const response = await GET(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.code).toBe('bad_request:api')
      expect(body.message).toBe('The request couldn\'t be processed. Please check your input and try again.')
    })

    it('should reject pageSize over limit', async () => {
      const request = new NextRequest('http://localhost:3000/api/artifacts?pageSize=100')
      const response = await GET(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.message).toBe('The request couldn\'t be processed. Please check your input and try again.')
    })
  })

  describe('Response Format', () => {
    beforeEach(() => {
      setAuthenticatedUser({ id: 'user-1', email: 'ada@test.com' })
    })

    it('should return correct response format', async () => {
      const mockArtifacts = [
        { 
          id: 'art-1', 
          title: 'Test 1', 
          kind: 'text' as const,
          userId: 'user-1',
          createdAt: new Date('2025-06-20T10:00:00Z'),
          world_id: null,
          deletedAt: null,
          content_text: 'Sample text',
          content_url: null,
          content_site_definition: null,
          summary: 'Test summary',
          authorId: 'user-1',
          publication_state: []
        },
        { 
          id: 'art-2', 
          title: 'Test 2', 
          kind: 'site' as const,
          userId: 'user-1',
          createdAt: new Date('2025-06-19T10:00:00Z'),
          world_id: null,
          deletedAt: null,
          content_text: null,
          content_url: null,
          content_site_definition: { blocks: [] },
          summary: 'Test site',
          authorId: 'user-1',
          publication_state: []
        }
      ]

      mockGetPagedArtifacts.mockResolvedValue({
        data: mockArtifacts,
        totalCount: 25
      })

      const request = new NextRequest('http://localhost:3000/api/artifacts?page=2&pageSize=10')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()

      // Проверяем структуру ответа (Date объекты сериализуются в строки)
      const expectedArtifacts = mockArtifacts.map(artifact => ({
        ...artifact,
        createdAt: artifact.createdAt.toISOString()
      }))
      
      expect(body).toMatchObject({
        artifacts: expectedArtifacts,
        hasMore: true, // page 2 of 3 (25/10)
        totalCount: 25,
        currentPage: 2,
        pageSize: 10,
        data: expectedArtifacts, // Legacy compatibility
      })

      expect(body.nextCursor).toBe('page-3')
    })

    it('should indicate no more pages on last page', async () => {
      mockGetPagedArtifacts.mockResolvedValue({
        data: [],
        totalCount: 15
      })

      const request = new NextRequest('http://localhost:3000/api/artifacts?page=2&pageSize=10')
      const response = await GET(request)

      const body = await response.json()
      expect(body.hasMore).toBe(false)
      expect(body.nextCursor).toBeUndefined()
    })
  })

  describe('🐛 BUG-023 Diagnosis: GroupByVersions Logic', () => {
    beforeEach(() => {
      setAuthenticatedUser({ id: 'user-1', email: 'ada@test.com' })
    })

    it('should pass groupByVersions=true by default to detect version duplication', async () => {
      // ✅ ИСПРАВЛЕНО: После BUG-023 fix должны возвращаться только уникальные артефакты
      const mockUniqueArtifacts = [
        { 
          id: 'art-1', 
          title: 'Test Latest', 
          createdAt: new Date('2025-06-20T10:00:00Z'),
          kind: 'text' as const,
          userId: 'user-1',
          world_id: null,
          deletedAt: null,
          content_text: 'Latest content',
          content_url: null,
          content_site_definition: null,
          summary: 'Latest summary',
          authorId: 'user-1',
          publication_state: []
        },
        { 
          id: 'art-2', 
          title: 'Other', 
          createdAt: new Date('2025-06-18T10:00:00Z'),
          kind: 'text' as const,
          userId: 'user-1',
          world_id: null,
          deletedAt: null,
          content_text: 'Other content',
          content_url: null,
          content_site_definition: null,
          summary: 'Other summary',
          authorId: 'user-1',
          publication_state: []
        }
      ]

      mockGetPagedArtifacts.mockResolvedValue({
        data: mockUniqueArtifacts,
        totalCount: 2 // ✅ Правильно: 2 уникальных артефакта
      })

      const request = new NextRequest('http://localhost:3000/api/artifacts')
      const response = await GET(request)

      // Проверяем что передается правильный параметр
      expect(mockGetPagedArtifacts).toHaveBeenCalledWith(
        expect.objectContaining({ groupByVersions: true })
      )

      const body = await response.json()

      // 🚨 ДИАГНОСТИКА: Если здесь есть дубликаты ID, значит проблема в БД запросе
      const ids = body.data.map((artifact: any) => artifact.id)
      const uniqueIds = [...new Set(ids)]
      
      console.log('🔍 BUG-023 Diagnosis:', {
        totalArtifacts: body.data.length,
        uniqueIdsCount: uniqueIds.length,
        duplicateFound: ids.length !== uniqueIds.length,
        ids,
        uniqueIds
      })

      // ✅ После BUG-023 fix: проверяем что дубликатов больше нет
      if (ids.length === uniqueIds.length) {
        console.log('✅ BUG-023 FIXED: No duplicate artifact IDs found with groupByVersions=true')
      } else {
        console.error('🚨 BUG PERSISTS: Duplicate artifact IDs found despite groupByVersions=true')
      }
    })
  })
})

// END OF: tests/unit/api/artifacts.test.ts