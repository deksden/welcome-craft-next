/**
 * @file tests/unit/lib/publication-utils.test.ts
 * @description Юнит-тесты для publication utilities
 * @version 1.0.0
 * @date 2025-06-17
 * @purpose Тестирование helper functions системы публикации
 */

import { describe, expect, it, } from 'vitest'
import { 
  isArtifactPublished, 
  isSitePublished, 
  isChatPublished,
  getActivePublications,
  isArtifactPublishedFromSource
} from '@/lib/publication-utils'
import type { Artifact, Chat } from '@/lib/db/schema'

describe('Publication Utils', () => {
  const baseArtifact: Artifact = {
    id: 'test-artifact',
    createdAt: new Date(),
    title: 'Test Artifact',
    content_text: 'Test content',
    content_url: null,
    content_site_definition: null,
    summary: 'Test summary',
    kind: 'text',
    userId: 'test-user',
    authorId: 'test-user',
    deletedAt: null,
    publication_state: [],
    world_id: null // Production артефакт
  }

  const baseChat: Chat = {
    id: 'test-chat',
    createdAt: new Date(),
    title: 'Test Chat',
    userId: 'test-user',
    published_until: null,
    deletedAt: null,
    world_id: null // Production чат
  }

  describe('isArtifactPublished', () => {
    it('должен возвращать false для артефакта без публикаций', () => {
      expect(isArtifactPublished(baseArtifact)).toBe(false)
    })

    it('должен возвращать true для артефакта с бессрочной публикацией', () => {
      const artifact: Artifact = {
        ...baseArtifact,
        publication_state: [{
          source: 'direct',
          sourceId: 'test-source',
          publishedAt: new Date().toISOString(),
          expiresAt: null
        }]
      }
      expect(isArtifactPublished(artifact)).toBe(true)
    })

    it('должен возвращать true для артефакта с активной TTL публикацией', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)
      
      const artifact: Artifact = {
        ...baseArtifact,
        publication_state: [{
          source: 'chat',
          sourceId: 'test-chat',
          publishedAt: new Date().toISOString(),
          expiresAt: futureDate.toISOString()
        }]
      }
      expect(isArtifactPublished(artifact)).toBe(true)
    })

    it('должен возвращать false для артефакта с истекшей TTL публикацией', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      
      const artifact: Artifact = {
        ...baseArtifact,
        publication_state: [{
          source: 'chat',
          sourceId: 'test-chat',
          publishedAt: new Date().toISOString(),
          expiresAt: pastDate.toISOString()
        }]
      }
      expect(isArtifactPublished(artifact)).toBe(false)
    })
  })

  describe('isSitePublished', () => {
    it('должен возвращать false для не-сайта', () => {
      expect(isSitePublished(baseArtifact)).toBe(false)
    })

    it('должен возвращать false для сайта без публикаций', () => {
      const siteArtifact: Artifact = {
        ...baseArtifact,
        kind: 'site'
      }
      expect(isSitePublished(siteArtifact)).toBe(false)
    })

    it('должен возвращать true для сайта с site публикацией', () => {
      const siteArtifact: Artifact = {
        ...baseArtifact,
        kind: 'site',
        publication_state: [{
          source: 'site',
          sourceId: 'test-site',
          publishedAt: new Date().toISOString(),
          expiresAt: null
        }]
      }
      expect(isSitePublished(siteArtifact)).toBe(true)
    })

    it('должен возвращать false для сайта только с chat публикацией', () => {
      const siteArtifact: Artifact = {
        ...baseArtifact,
        kind: 'site',
        publication_state: [{
          source: 'chat',
          sourceId: 'test-chat',
          publishedAt: new Date().toISOString(),
          expiresAt: null
        }]
      }
      expect(isSitePublished(siteArtifact)).toBe(false)
    })
  })

  describe('isChatPublished', () => {
    it('должен возвращать false для чата без published_until', () => {
      expect(isChatPublished(baseChat)).toBe(false)
    })

    it('должен возвращать true для чата с активным published_until', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)
      
      const chat: Chat = {
        ...baseChat,
        published_until: futureDate
      }
      expect(isChatPublished(chat)).toBe(true)
    })

    it('должен возвращать false для чата с истекшим published_until', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      
      const chat: Chat = {
        ...baseChat,
        published_until: pastDate
      }
      expect(isChatPublished(chat)).toBe(false)
    })
  })

  describe('getActivePublications', () => {
    it('должен возвращать пустой массив для артефакта без публикаций', () => {
      const active = getActivePublications(baseArtifact)
      expect(active).toEqual([])
    })

    it('должен возвращать только активные публикации', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)
      
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      
      const artifact: Artifact = {
        ...baseArtifact,
        publication_state: [
          {
            source: 'direct',
            sourceId: 'active',
            publishedAt: new Date().toISOString(),
            expiresAt: null
          },
          {
            source: 'chat',
            sourceId: 'expired',
            publishedAt: new Date().toISOString(),
            expiresAt: pastDate.toISOString()
          },
          {
            source: 'site',
            sourceId: 'active-ttl',
            publishedAt: new Date().toISOString(),
            expiresAt: futureDate.toISOString()
          }
        ]
      }
      
      const active = getActivePublications(artifact)
      expect(active).toHaveLength(2)
      expect(active[0].sourceId).toBe('active')
      expect(active[1].sourceId).toBe('active-ttl')
    })
  })

  describe('isArtifactPublishedFromSource', () => {
    it('должен правильно определять публикацию из конкретного источника', () => {
      const artifact: Artifact = {
        ...baseArtifact,
        publication_state: [{
          source: 'chat',
          sourceId: 'specific-chat',
          publishedAt: new Date().toISOString(),
          expiresAt: null
        }]
      }
      
      expect(isArtifactPublishedFromSource(artifact, 'chat')).toBe(true)
      expect(isArtifactPublishedFromSource(artifact, 'chat', 'specific-chat')).toBe(true)
      expect(isArtifactPublishedFromSource(artifact, 'chat', 'other-chat')).toBe(false)
      expect(isArtifactPublishedFromSource(artifact, 'site')).toBe(false)
    })
  })
})

// END OF: tests/unit/lib/publication-utils.test.ts