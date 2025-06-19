/**
 * @file tests/unit/lib/artifact-content-utils.test.ts
 * @description Юнит-тесты для утилит работы с контентом артефактов
 * @version 1.0.0
 * @date 2025-06-18
 * @updated Начальная реализация полного покрытия artifact-content-utils
 */

/** HISTORY:
 * v1.0.0 (2025-06-18): Начальная реализация тестов для getDisplayContent, prepareContentForSave, normalizeArtifactForAPI
 */

import { describe, it, expect } from 'vitest'
import {
  getDisplayContent,
  prepareContentForSave,
  normalizeArtifactForAPI
} from '@/lib/artifact-content-utils'
import type { Artifact } from '@/lib/db/schema'
import type { ArtifactKind } from '@/lib/types'

describe('Artifact Content Utils', () => {
  // Базовые моки артефактов для тестирования
  const baseArtifact: Partial<Artifact> = {
    id: 'test-artifact',
    createdAt: new Date('2025-06-18T10:00:00Z'),
    title: 'Test Artifact',
    userId: 'test-user',
    authorId: 'test-user',
    deletedAt: null,
    summary: 'Test summary',
    publication_state: [],
    world_id: null
  }

  describe('getDisplayContent', () => {
    it('should return text content for text artifacts', () => {
      const artifact: Artifact = {
        ...baseArtifact,
        kind: 'text',
        content_text: 'This is text content',
        content_url: null,
        content_site_definition: null
      } as Artifact

      const result = getDisplayContent(artifact)
      expect(result).toBe('This is text content')
    })

    it('should return text content for code artifacts', () => {
      const artifact: Artifact = {
        ...baseArtifact,
        kind: 'code',
        content_text: 'function hello() { return "world"; }',
        content_url: null,
        content_site_definition: null
      } as Artifact

      const result = getDisplayContent(artifact)
      expect(result).toBe('function hello() { return "world"; }')
    })

    it('should return text content for sheet artifacts', () => {
      const artifact: Artifact = {
        ...baseArtifact,
        kind: 'sheet',
        content_text: 'Name,Age,City\nJohn,25,NYC\nJane,30,LA',
        content_url: null,
        content_site_definition: null
      } as Artifact

      const result = getDisplayContent(artifact)
      expect(result).toBe('Name,Age,City\nJohn,25,NYC\nJane,30,LA')
    })

    it('should return URL for image artifacts', () => {
      const artifact: Artifact = {
        ...baseArtifact,
        kind: 'image',
        content_text: null,
        content_url: 'https://example.com/image.jpg',
        content_site_definition: null
      } as Artifact

      const result = getDisplayContent(artifact)
      expect(result).toBe('https://example.com/image.jpg')
    })

    it('should return JSON string for site artifacts', () => {
      const siteDefinition = {
        theme: 'modern',
        blocks: [
          { type: 'hero', title: 'Welcome' },
          { type: 'content', text: 'About us' }
        ]
      }

      const artifact: Artifact = {
        ...baseArtifact,
        kind: 'site',
        content_text: null,
        content_url: null,
        content_site_definition: siteDefinition
      } as Artifact

      const result = getDisplayContent(artifact)
      const expectedJson = JSON.stringify(siteDefinition, null, 2)
      expect(result).toBe(expectedJson)
    })

    it('should return empty string for null content_text', () => {
      const artifact: Artifact = {
        ...baseArtifact,
        kind: 'text',
        content_text: null,
        content_url: null,
        content_site_definition: null
      } as Artifact

      const result = getDisplayContent(artifact)
      expect(result).toBe('')
    })

    it('should return empty string for null content_url', () => {
      const artifact: Artifact = {
        ...baseArtifact,
        kind: 'image',
        content_text: null,
        content_url: null,
        content_site_definition: null
      } as Artifact

      const result = getDisplayContent(artifact)
      expect(result).toBe('')
    })

    it('should return empty string for null site definition', () => {
      const artifact: Artifact = {
        ...baseArtifact,
        kind: 'site',
        content_text: null,
        content_url: null,
        content_site_definition: null
      } as Artifact

      const result = getDisplayContent(artifact)
      expect(result).toBe('')
    })

    it('should return empty string for unknown kind', () => {
      const artifact: Artifact = {
        ...baseArtifact,
        kind: 'unknown' as ArtifactKind,
        content_text: 'some content',
        content_url: null,
        content_site_definition: null
      } as Artifact

      const result = getDisplayContent(artifact)
      expect(result).toBe('')
    })
  })

  describe('prepareContentForSave', () => {
    it('should prepare text content correctly', () => {
      const content = 'This is text content'
      const kind: ArtifactKind = 'text'

      const result = prepareContentForSave(content, kind)

      expect(result).toEqual({
        content_text: 'This is text content',
        content_url: null,
        content_site_definition: null
      })
    })

    it('should prepare code content correctly', () => {
      const content = 'function hello() { return "world"; }'
      const kind: ArtifactKind = 'code'

      const result = prepareContentForSave(content, kind)

      expect(result).toEqual({
        content_text: 'function hello() { return "world"; }',
        content_url: null,
        content_site_definition: null
      })
    })

    it('should prepare sheet content correctly', () => {
      const content = 'Name,Age\nJohn,25\nJane,30'
      const kind: ArtifactKind = 'sheet'

      const result = prepareContentForSave(content, kind)

      expect(result).toEqual({
        content_text: 'Name,Age\nJohn,25\nJane,30',
        content_url: null,
        content_site_definition: null
      })
    })

    it('should prepare image URL correctly', () => {
      const content = 'https://example.com/image.jpg'
      const kind: ArtifactKind = 'image'

      const result = prepareContentForSave(content, kind)

      expect(result).toEqual({
        content_text: null,
        content_url: 'https://example.com/image.jpg',
        content_site_definition: null
      })
    })

    it('should prepare site definition correctly with valid JSON', () => {
      const siteDefinition = {
        theme: 'modern',
        blocks: [{ type: 'hero', title: 'Welcome' }]
      }
      const content = JSON.stringify(siteDefinition)
      const kind: ArtifactKind = 'site'

      const result = prepareContentForSave(content, kind)

      expect(result).toEqual({
        content_text: null,
        content_url: null,
        content_site_definition: siteDefinition
      })
    })

    it('should handle invalid JSON for site content gracefully', () => {
      const content = '{ invalid json: }'
      const kind: ArtifactKind = 'site'

      const result = prepareContentForSave(content, kind)

      expect(result).toEqual({
        content_text: null,
        content_url: null,
        content_site_definition: null
      })
    })

    it('should return null values for unknown kind', () => {
      const content = 'some content'
      const kind = 'unknown' as ArtifactKind

      const result = prepareContentForSave(content, kind)

      expect(result).toEqual({
        content_text: null,
        content_url: null,
        content_site_definition: null
      })
    })
  })

  describe('normalizeArtifactForAPI', () => {
    it('should normalize artifact with text content', () => {
      const artifact: Artifact = {
        ...baseArtifact,
        kind: 'text',
        content_text: 'This is text content',
        content_url: null,
        content_site_definition: null
      } as Artifact

      const result = normalizeArtifactForAPI(artifact)

      expect(result).toEqual({
        id: 'test-artifact',
        createdAt: artifact.createdAt,
        title: 'Test Artifact',
        kind: 'text',
        content: 'This is text content',
        summary: 'Test summary',
        userId: 'test-user',
        authorId: 'test-user',
        deletedAt: null,
        publication_state: [],
        world_id: null
      })
    })

    it('should normalize artifact with image content', () => {
      const artifact: Artifact = {
        ...baseArtifact,
        kind: 'image',
        content_text: null,
        content_url: 'https://example.com/image.jpg',
        content_site_definition: null
      } as Artifact

      const result = normalizeArtifactForAPI(artifact)

      expect(result).toEqual({
        id: 'test-artifact',
        createdAt: artifact.createdAt,
        title: 'Test Artifact',
        kind: 'image',
        content: 'https://example.com/image.jpg',
        summary: 'Test summary',
        userId: 'test-user',
        authorId: 'test-user',
        deletedAt: null,
        publication_state: [],
        world_id: null
      })
    })

    it('should normalize artifact with site content', () => {
      const siteDefinition = { theme: 'modern', blocks: [] }
      const artifact: Artifact = {
        ...baseArtifact,
        kind: 'site',
        content_text: null,
        content_url: null,
        content_site_definition: siteDefinition
      } as Artifact

      const result = normalizeArtifactForAPI(artifact)

      expect(result).toEqual({
        id: 'test-artifact',
        createdAt: artifact.createdAt,
        title: 'Test Artifact',
        kind: 'site',
        content: JSON.stringify(siteDefinition, null, 2),
        summary: 'Test summary',
        userId: 'test-user',
        authorId: 'test-user',
        deletedAt: null,
        publication_state: [],
        world_id: null
      })
    })

    it('should handle missing content fields gracefully', () => {
      const artifact: Artifact = {
        ...baseArtifact,
        kind: 'text',
        content_text: null,
        content_url: null,
        content_site_definition: null
      } as Artifact

      const result = normalizeArtifactForAPI(artifact)

      expect(result.content).toBe('')
    })

    it('should normalize artifact with publication state', () => {
      const publicationState = [
        {
          source: 'direct' as const,
          sourceId: 'test-source',
          publishedAt: '2025-06-18T10:00:00Z',
          expiresAt: null
        }
      ]

      const artifact: Artifact = {
        ...baseArtifact,
        kind: 'text',
        content_text: 'Published content',
        content_url: null,
        content_site_definition: null,
        publication_state: publicationState
      } as Artifact

      const result = normalizeArtifactForAPI(artifact)

      expect(result.publication_state).toEqual(publicationState)
    })
  })
})

// END OF: tests/unit/lib/artifact-content-utils.test.ts