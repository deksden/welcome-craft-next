/**
 * @file tests/unit/artifacts/kinds/site/server-holistic.test.ts
 * @description Unit tests for UC-09 Holistic Site Generation
 * @version 1.0.0
 * @date 2025-06-20
 * @updated Initial tests for holistic approach
 */

/** HISTORY:
 * v1.0.0 (2025-06-20): Initial tests for UC-09 holistic site generation
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { siteTool } from '@/artifacts/kinds/site/server'
import * as holisticGenerator from '@/lib/ai/holistic-generator'
import type { AllCandidates } from '@/lib/types/holistic-generation'

// Mock the holistic generator
vi.mock('@/lib/ai/holistic-generator', () => ({
  aggregateCandidatesForAllSlots: vi.fn(),
  generateSiteHolistically: vi.fn(),
}))

describe('UC-09 Holistic Site Generation', () => {
  const mockSession = {
    user: { id: 'test-user-123', email: 'test@example.com', type: 'regular' as const },
    expires: '2025-12-31'
  }

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
                artifactId: 'hero-artifact-1',
                title: 'Welcome Message',
                summary: 'CEO welcome message',
                kind: 'text'
              }
            ]
          }
        ]
      }
    ],
    totalArtifacts: 1,
    userPrompt: 'Create onboarding site for developer'
  }

  const mockSiteDefinition = {
    theme: 'default',
    blocks: [
      {
        type: 'hero',
        slots: {
          content: { artifactId: 'hero-artifact-1' }
        }
      }
    ],
    reasoning: 'Selected CEO welcome for professional onboarding'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully generate site using holistic approach', async () => {
    // Setup mocks
    vi.mocked(holisticGenerator.aggregateCandidatesForAllSlots)
      .mockResolvedValue(mockAllCandidates)
    vi.mocked(holisticGenerator.generateSiteHolistically)
      .mockResolvedValue(JSON.stringify(mockSiteDefinition))

    // Execute
    const result = await siteTool.create?.({
      id: 'test-site-id',
      title: 'Test Site',
      prompt: 'Create onboarding site for developer',
      session: mockSession
    })

    // Verify aggregation called correctly
    expect(holisticGenerator.aggregateCandidatesForAllSlots)
      .toHaveBeenCalledWith('test-user-123', 'Create onboarding site for developer')

    // Verify holistic generation called correctly  
    expect(holisticGenerator.generateSiteHolistically)
      .toHaveBeenCalledWith({
        userId: 'test-user-123',
        userPrompt: 'Create onboarding site for developer',
        allCandidates: mockAllCandidates
      })

    // Verify result
    expect(result).toBe(JSON.stringify(mockSiteDefinition))
  })

  it('should handle aggregation failure gracefully', async () => {
    // Setup mocks
    vi.mocked(holisticGenerator.aggregateCandidatesForAllSlots)
      .mockRejectedValue(new Error('Database connection failed'))

    // Execute
    const result = await siteTool.create?.({
      id: 'test-site-id',
      title: 'Test Site',
      prompt: 'Create onboarding site for developer',
      session: mockSession
    })

    // Verify fallback
    expect(result).toBeDefined()
    const parsedResult = JSON.parse(result as string)
    expect(parsedResult.theme).toBe('default')
    expect(parsedResult.blocks).toEqual([])
    expect(parsedResult.reasoning).toBe('Generation failed, returning empty site')
  })

  it('should handle AI generation failure gracefully', async () => {
    // Setup mocks
    vi.mocked(holisticGenerator.aggregateCandidatesForAllSlots)
      .mockResolvedValue(mockAllCandidates)
    vi.mocked(holisticGenerator.generateSiteHolistically)
      .mockRejectedValue(new Error('AI model timeout'))

    // Execute
    const result = await siteTool.create?.({
      id: 'test-site-id',
      title: 'Test Site',
      prompt: 'Create onboarding site for developer',
      session: mockSession
    })

    // Verify fallback
    expect(result).toBeDefined()
    const parsedResult = JSON.parse(result as string)
    expect(parsedResult.theme).toBe('default')
    expect(parsedResult.blocks).toEqual([])
    expect(parsedResult.reasoning).toBe('Generation failed, returning empty site')
  })

  it('should demonstrate UC-09 architecture principles', async () => {
    // This test verifies the core UC-09 principles are implemented
    vi.mocked(holisticGenerator.aggregateCandidatesForAllSlots)
      .mockResolvedValue(mockAllCandidates)
    vi.mocked(holisticGenerator.generateSiteHolistically)
      .mockResolvedValue(JSON.stringify(mockSiteDefinition))

    await siteTool.create?.({
      id: 'test-site-id',
      title: 'Test Site',
      prompt: 'Create onboarding site for developer',
      session: mockSession
    })

    // Verify UC-09 principles:
    // 1. Single aggregation call (not per-slot)
    expect(holisticGenerator.aggregateCandidatesForAllSlots).toHaveBeenCalledTimes(1)
    
    // 2. Single AI generation call (not ~20 like UC-08)
    expect(holisticGenerator.generateSiteHolistically).toHaveBeenCalledTimes(1)
    
    // 3. Holistic context provided to AI (all candidates at once)
    const generationCall = vi.mocked(holisticGenerator.generateSiteHolistically).mock.calls[0][0]
    expect(generationCall.allCandidates).toBeDefined()
    expect(generationCall.allCandidates.totalArtifacts).toBeGreaterThan(0)
  })
})

// END OF: tests/unit/artifacts/kinds/site/server-holistic.test.ts