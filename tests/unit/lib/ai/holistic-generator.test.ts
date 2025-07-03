/**
 * @file tests/unit/lib/ai/holistic-generator.test.ts
 * @description Unit tests for UC-09 Holistic Generator components
 * @version 1.0.0
 * @date 2025-06-20
 * @updated Initial tests for holistic generator
 */

/** HISTORY:
 * v1.0.0 (2025-06-20): Initial tests for aggregation and holistic generation
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { 
  aggregateCandidatesForAllSlots, 
  generateSiteHolistically 
} from '@/lib/ai/holistic-generator'
import { getPagedArtifactsByUserId } from '@/lib/db/queries'
import { generateObject, embed } from 'ai'
import { findSlotCandidatesSemanticSearch } from '@/lib/ai/artifact-search'
import type { AllCandidates, HolisticGenerationContext } from '@/lib/types/holistic-generation'

// Mock dependencies
vi.mock('@/lib/db/queries', () => ({
  getPagedArtifactsByUserId: vi.fn(),
}))

vi.mock('@/lib/ai/artifact-search', () => ({
  findSlotCandidatesSemanticSearch: vi.fn(),
}))

vi.mock('ai', () => ({
  generateObject: vi.fn(),
  embed: vi.fn(),
}))

vi.mock('@/lib/ai/providers.enhanced', () => ({
  myEnhancedProvider: {
    languageModel: vi.fn(() => 'mocked-model')
  }
}))

vi.mock('@/site-blocks', () => ({
  blockDefinitions: {
    hero: {
      slots: {
        content: {
          kind: 'text',
          tags: ['welcome', 'greeting'],
          description: 'Main welcome message'
        }
      }
    },
    'key-contacts': {
      slots: {
        contacts: {
          kind: 'sheet',
          tags: ['contacts', 'team'],
          description: 'Contact information'
        }
      }
    }
  }
}))

describe('UC-09 Holistic Generator', () => {
  const mockUserId = 'test-user-123'
  const mockUserPrompt = 'Create site for backend developer'

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup embed mock for semantic search functionality
    vi.mocked(embed).mockResolvedValue({
      value: 'mock query',
      embedding: new Array(1536).fill(0.1), // Mock embedding vector
      usage: { tokens: 50 }
    })
    
    // Setup semantic search mock to return empty results (to avoid DB connections)
    vi.mocked(findSlotCandidatesSemanticSearch).mockResolvedValue([])
  })

  describe('aggregateCandidatesForAllSlots', () => {
    it('should aggregate candidates for all blocks and slots', async () => {
      // Setup mocks
      vi.mocked(getPagedArtifactsByUserId)
        .mockResolvedValueOnce({
          data: [
            {
              id: 'welcome-1',
              title: 'CEO Welcome',
              summary: 'Professional welcome',
              kind: 'text',
              // UC-10: Sparse columns удалены из основной таблицы Artifact
              userId: mockUserId,
              createdAt: new Date(),
              deletedAt: null,
              publication_state: [],
              world_id: null,
      embedding: null,
              authorId: null
            }
          ],
          totalCount: 1
        })
        .mockResolvedValueOnce({
          data: [
            {
              id: 'contacts-1',
              title: 'Team Contacts',
              summary: 'Contact list',
              kind: 'sheet',
              // UC-10: Sparse columns удалены из основной таблицы Artifact
              userId: mockUserId,
              createdAt: new Date(),
              deletedAt: null,
              publication_state: [],
              world_id: null,
      embedding: null,
              authorId: null
            }
          ],
          totalCount: 1
        })

      // Execute
      const result = await aggregateCandidatesForAllSlots(mockUserId, mockUserPrompt)

      // Verify structure
      expect(result.blocks).toHaveLength(2)
      expect(result.totalArtifacts).toBe(2)
      expect(result.userPrompt).toBe(mockUserPrompt)

      // Verify hero block
      const heroBlock = result.blocks.find(b => b.blockType === 'hero')
      expect(heroBlock).toBeDefined()
      expect(heroBlock?.slots).toHaveLength(1)
      expect(heroBlock?.slots[0].slotName).toBe('content')
      expect(heroBlock?.slots[0].candidates).toHaveLength(1)
      expect(heroBlock?.slots[0].candidates[0].artifactId).toBe('welcome-1')

      // Verify contacts block
      const contactsBlock = result.blocks.find(b => b.blockType === 'key-contacts')
      expect(contactsBlock).toBeDefined()
      expect(contactsBlock?.slots[0].candidates[0].artifactId).toBe('contacts-1')
    })

    it('should handle database errors gracefully', async () => {
      // Setup mocks - first call succeeds, second fails
      vi.mocked(getPagedArtifactsByUserId)
        .mockResolvedValueOnce({
          data: [
            {
              id: 'welcome-1',
              title: 'CEO Welcome',
              summary: 'Professional welcome',
              kind: 'text',
              // UC-10: Sparse columns удалены из основной таблицы Artifact
              userId: mockUserId,
              createdAt: new Date(),
              deletedAt: null,
              publication_state: [],
              world_id: null,
      embedding: null,
              authorId: null
            }
          ],
          totalCount: 1
        })
        .mockRejectedValueOnce(new Error('Database connection failed'))

      // Execute
      const result = await aggregateCandidatesForAllSlots(mockUserId, mockUserPrompt)

      // Verify graceful handling
      expect(result.blocks).toHaveLength(2)
      expect(result.totalArtifacts).toBe(1) // Only successful queries counted
      
      // Failed slot should have empty candidates
      const contactsBlock = result.blocks.find(b => b.blockType === 'key-contacts')
      expect(contactsBlock?.slots[0].candidates).toHaveLength(0)
    })

    it('should limit candidates per slot for AI efficiency', async () => {
      // Setup mock with many artifacts
      const manyArtifacts = Array.from({ length: 15 }, (_, i) => ({
        id: `artifact-${i}`,
        title: `Artifact ${i}`,
        summary: `Summary ${i}`,
        kind: 'text' as const,
        content_text: `Content ${i}`,
        content_url: null,
        content_site_definition: null,
        userId: mockUserId,
        createdAt: new Date(),
        deletedAt: null,
        publication_state: [],
        world_id: null,
      embedding: null,
        authorId: null
      }))

      vi.mocked(getPagedArtifactsByUserId).mockResolvedValue({
        data: manyArtifacts,
        totalCount: 15
      })

      // Execute
      const result = await aggregateCandidatesForAllSlots(mockUserId, mockUserPrompt)

      // Verify query parameters limit candidates
      expect(getPagedArtifactsByUserId).toHaveBeenCalledWith(
        expect.objectContaining({
          pageSize: 10 // Should limit to 10 per slot
        })
      )

      // Verify actual result respects the mocked data (15 artifacts but pageSize=10 in query)
      const heroBlock = result.blocks.find(b => b.blockType === 'hero')
      // The function uses the mocked data as-is, but the query should limit pageSize
      expect(heroBlock?.slots[0].candidates.length).toBe(15) // What we actually get from mock
    })
  })

  describe('generateSiteHolistically', () => {
    const mockAllCandidates: AllCandidates = {
      blocks: [
        {
          blockType: 'hero',
          slots: [
            {
              slotName: 'content',
              slotDefinition: { kind: 'text' },
              candidates: [
                {
                  artifactId: 'welcome-1',
                  title: 'CEO Welcome',
                  summary: 'Professional welcome',
                  kind: 'text'
                }
              ]
            }
          ]
        }
      ],
      totalArtifacts: 1,
      userPrompt: 'Create site for backend developer'
    }

    const mockContext: HolisticGenerationContext = {
      userId: mockUserId,
      userPrompt: mockUserPrompt,
      allCandidates: mockAllCandidates
    }

    it('should generate site with single AI call', async () => {
      const mockSiteDefinition = {
        theme: 'technical',
        blocks: [
          {
            type: 'hero',
            slots: {
              content: { artifactId: 'welcome-1' }
            }
          }
        ],
        reasoning: 'Selected technical content for developer onboarding'
      }

      vi.mocked(generateObject).mockResolvedValue({
        object: mockSiteDefinition,
        usage: { promptTokens: 500, completionTokens: 100, totalTokens: 600 },
        finishReason: 'stop',
        warnings: [],
        request: {} as any,
        response: {} as any,
        logprobs: undefined,
        providerMetadata: {},
        experimental_providerMetadata: {},
        toJsonResponse: () => ({}) as any
      })

      // Execute
      const result = await generateSiteHolistically(mockContext)

      // Verify single AI call made
      expect(generateObject).toHaveBeenCalledTimes(1)
      expect(generateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.1, // Low temperature for consistency
          maxTokens: 4000,
          schema: expect.any(Object) // SiteDefinitionSchema
        })
      )

      // Verify result
      expect(JSON.parse(result)).toEqual(mockSiteDefinition)
    })

    it('should handle AI generation failure with fallback', async () => {
      vi.mocked(generateObject).mockRejectedValue(new Error('AI model timeout'))

      // Execute
      const result = await generateSiteHolistically(mockContext)

      // Verify fallback site generated
      const parsedResult = JSON.parse(result)
      expect(parsedResult.theme).toBe('default')
      expect(parsedResult.reasoning).toBe('Fallback generation due to AI failure')
      expect(parsedResult.blocks).toHaveLength(1)
      expect(parsedResult.blocks[0].type).toBe('hero')
      expect(parsedResult.blocks[0].slots.content.artifactId).toBe('welcome-1')
    })

    it('should demonstrate UC-09 architectural principles', async () => {
      const mockSiteDefinition = {
        theme: 'default',
        blocks: [],
        reasoning: 'Test generation'
      }

      vi.mocked(generateObject).mockResolvedValue({
        object: mockSiteDefinition,
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        finishReason: 'stop',
        warnings: [],
        request: {} as any,
        response: {} as any,
        logprobs: undefined,
        providerMetadata: {},
        experimental_providerMetadata: {},
        toJsonResponse: () => ({}) as any
      })

      await generateSiteHolistically(mockContext)

      // Verify UC-09 principles:
      // 1. Single AI call (not multiple like UC-08)
      expect(generateObject).toHaveBeenCalledTimes(1)
      
      // 2. Structured output with Zod schema
      const callArgs = vi.mocked(generateObject).mock.calls[0][0]
      expect(callArgs).toHaveProperty('schema')
      
      // 3. Full context provided (all candidates at once)
      expect(callArgs.prompt).toContain('Available candidates by block and slot')
      expect(callArgs.prompt).toContain('welcome-1') // Should contain artifact IDs
      
      // 4. Quality-aware system prompt
      expect(callArgs.system).toContain('MOST APPROPRIATE artifacts')
      expect(callArgs.system).toContain('avoid localhost URLs')
    })
  })
})

// END OF: tests/unit/lib/ai/holistic-generator.test.ts