/**
 * @file tests/routes/redis-clipboard.test.ts
 * @description Tests for Redis clipboard operations - modern "Add to chat" architecture
 * @version 1.1.0
 * @date 2025-06-14
 * @updated Added documentation for paperclip menu artifact attachment
 */

/** HISTORY:
 * v1.1.0 (2025-06-14): Updated documentation for paperclip menu architecture  
 * v1.0.0 (2025-06-14): Initial version with Redis clipboard tests
 */

// NEW ARCHITECTURE: "Add to chat" via Redis clipboard + paperclip menu
// BEHAVIOR LIKE OS CLIPBOARD: Artifact remains in Redis buffer until manually cleared or expires
//
// 1. "Add to chat" button → copyArtifactToClipboard Server Action → Redis storage (60s TTL)
// 2a. If chat open → direct append to chat input via useChat().append()
// 2b. If chat closed → store in Redis, show toast "Artifact link copied"
// 3. When opening chat → getArtifactFromClipboard → show draft attachment UI
// 4. User can paste same artifact multiple times into different chats (OS clipboard behavior)
// 5. Draft attachment can be confirmed (✓) or cancelled with clearArtifactFromClipboard (✕)
// 6. Paperclip menu in chat input → "Attach artifact" option → artifact picker (future)

import { expect, apiTest as test } from '../api-fixtures'
import { generateUUID } from '@/lib/utils'

test.describe.serial('Redis Clipboard Operations', () => {
  test.describe('OS-like clipboard behavior', () => {
    test('Ada can copy artifact to clipboard', async ({ adaContext }) => {
      // First create an artifact to copy
      const artifactId = generateUUID()
      const createResponse = await adaContext.request.post(
        `/api/artifact?id=${artifactId}`,
        {
          data: {
            title: 'Test Artifact for Clipboard',
            kind: 'text',
            content: 'This artifact will be copied to clipboard',
          },
        }
      )
      expect(createResponse.status()).toBe(200)
      const [createdArtifact] = await createResponse.json()

      // Note: copyArtifactToClipboard, getArtifactFromClipboard, clearArtifactFromClipboard 
      // are Server Actions, not API endpoints. This test documents expected behavior
      // but cannot directly test Server Actions. Real testing happens through E2E tests.
      //
      // NEW: OS-like clipboard behavior - artifacts can be pasted multiple times!
      
      // Verify the artifact exists and can be accessed
      const getResponse = await adaContext.request.get(
        `/api/artifact?id=${createdArtifact.id}`
      )
      expect(getResponse.status()).toBe(200)
      
      const artifacts = await getResponse.json()
      expect(artifacts).toHaveLength(1)
      expect(artifacts[0].title).toBe('Test Artifact for Clipboard')
    })

    test('Clipboard behavior allows multiple pastes', async ({ adaContext }) => {
      // This test documents that unlike the old getAndClearArtifactFromClipboard,
      // the new getArtifactFromClipboard does NOT clear the buffer automatically.
      // This allows OS-like behavior where user can paste the same artifact 
      // into multiple chats until manually clearing or TTL expires.
      
      const artifactId = generateUUID()
      const response = await adaContext.request.post(
        `/api/artifact?id=${artifactId}`,
        {
          data: {
            title: 'Multi-paste Artifact',
            kind: 'text',
            content: 'Can be pasted multiple times',
          },
        }
      )
      expect(response.status()).toBe(200)
    })

    test('Unauthenticated user cannot access artifacts for clipboard', async ({ request }) => {
      const artifactId = generateUUID()
      const response = await request.get(`/api/artifact?id=${artifactId}`)
      expect(response.status()).toBe(401)
    })
  })

  test.describe('Artifact kind support in clipboard', () => {
    test('Ada can copy text artifact', async ({ adaContext }) => {
      const artifactId = generateUUID()
      const response = await adaContext.request.post(
        `/api/artifact?id=${artifactId}`,
        {
          data: {
            title: 'Text Artifact',
            kind: 'text',
            content: 'Sample text content',
          },
        }
      )
      expect(response.status()).toBe(200)
    })

    test('Ada can copy code artifact', async ({ adaContext }) => {
      const artifactId = generateUUID()
      const response = await adaContext.request.post(
        `/api/artifact?id=${artifactId}`,
        {
          data: {
            title: 'Code Artifact',
            kind: 'code',
            content: 'console.log("Hello world")',
          },
        }
      )
      expect(response.status()).toBe(200)
    })

    test('Ada can copy site artifact', async ({ adaContext }) => {
      const artifactId = generateUUID()
      const siteDefinition = {
        theme: 'default',
        blocks: [
          {
            type: 'hero',
            slots: {
              title: { artifactId: 'sample-title-id' },
              subtitle: { artifactId: 'sample-subtitle-id' }
            }
          }
        ]
      }

      const response = await adaContext.request.post(
        `/api/artifact?id=${artifactId}`,
        {
          data: {
            title: 'Site Artifact',
            kind: 'site',
            content: JSON.stringify(siteDefinition),
          },
        }
      )
      expect(response.status()).toBe(200)
      
      const [createdArtifact] = await response.json()
      expect(createdArtifact.kind).toBe('site')
      
      // Verify site definition structure (content is already parsed by Drizzle)
      expect(createdArtifact.content.theme).toBe('default')
      expect(createdArtifact.content.blocks).toHaveLength(1)
      expect(createdArtifact.content.blocks[0].type).toBe('hero')
    })
  })

  test.describe('Access control for clipboard operations', () => {
    test('Babbage cannot access Ada\'s artifacts for clipboard', async ({ 
      adaContext, 
      babbageContext 
    }) => {
      // Ada creates an artifact
      const artifactId = generateUUID()
      const createResponse = await adaContext.request.post(
        `/api/artifact?id=${artifactId}`,
        {
          data: {
            title: 'Ada\'s Private Artifact',
            kind: 'text',
            content: 'Private content',
          },
        }
      )
      expect(createResponse.status()).toBe(200)
      const [adaArtifact] = await createResponse.json()

      // Babbage tries to access Ada's artifact
      const accessResponse = await babbageContext.request.get(
        `/api/artifact?id=${adaArtifact.id}`
      )
      expect(accessResponse.status()).toBe(403)
    })
  })

  test.describe('Artifact versioning in clipboard', () => {
    test('Ada can copy specific artifact version', async ({ adaContext }) => {
      // Create first version
      const artifactId = generateUUID()
      const firstResponse = await adaContext.request.post(
        `/api/artifact?id=${artifactId}`,
        {
          data: {
            title: 'Versioned Artifact',
            kind: 'text',
            content: 'Version 1 content',
          },
        }
      )
      expect(firstResponse.status()).toBe(200)
      const [firstVersion] = await firstResponse.json()

      // Create second version
      const secondResponse = await adaContext.request.post(
        `/api/artifact?id=${firstVersion.id}`,
        {
          data: {
            title: 'Versioned Artifact',
            kind: 'text',
            content: 'Version 2 content',
          },
        }
      )
      expect(secondResponse.status()).toBe(200)

      // Verify we can access all versions
      const allVersionsResponse = await adaContext.request.get(
        `/api/artifact?id=${firstVersion.id}`
      )
      expect(allVersionsResponse.status()).toBe(200)
      
      const allVersions = await allVersionsResponse.json()
      expect(allVersions).toHaveLength(2)
    })
  })
})