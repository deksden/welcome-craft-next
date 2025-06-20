/**
 * @file tests/unit/lib/ai/schemas/site-definition.test.ts
 * @description Unit tests for UC-09 SiteDefinitionSchema
 * @version 1.0.0
 * @date 2025-06-20
 * @updated Initial tests for Zod schema validation
 */

/** HISTORY:
 * v1.0.0 (2025-06-20): Initial tests for structured AI output schema
 */

import { describe, expect, it } from 'vitest'
import { SiteDefinitionSchema } from '@/lib/ai/schemas/site-definition'
import { z } from 'zod'

describe('UC-09 SiteDefinitionSchema', () => {
  it('should validate complete site definition', () => {
    const validSiteDefinition = {
      theme: 'technical',
      blocks: [
        {
          type: 'hero',
          slots: {
            content: { artifactId: 'welcome-123' },
            subtitle: { artifactId: 'subtitle-456' }
          }
        },
        {
          type: 'key-contacts',
          slots: {
            contacts: { artifactId: 'contacts-789' }
          }
        }
      ],
      reasoning: 'Selected technical content for developer onboarding experience'
    }

    const result = SiteDefinitionSchema.safeParse(validSiteDefinition)
    expect(result.success).toBe(true)
    
    if (result.success) {
      expect(result.data.theme).toBe('technical')
      expect(result.data.blocks).toHaveLength(2)
      expect(result.data.reasoning).toBe('Selected technical content for developer onboarding experience')
    }
  })

  it('should validate minimal site definition with defaults', () => {
    const minimalSiteDefinition = {
      blocks: [
        {
          type: 'hero',
          slots: {
            content: { artifactId: 'welcome-123' }
          }
        }
      ]
    }

    const result = SiteDefinitionSchema.safeParse(minimalSiteDefinition)
    expect(result.success).toBe(true)
    
    if (result.success) {
      expect(result.data.theme).toBe('default') // Default value
      expect(result.data.reasoning).toBeUndefined() // Optional field
      expect(result.data.blocks).toHaveLength(1)
    }
  })

  it('should reject invalid site definition', () => {
    const invalidSiteDefinition = {
      theme: 'technical',
      blocks: [
        {
          type: 'hero',
          slots: {
            content: { artifactId: '' } // Empty artifact ID should be valid but not ideal
          }
        }
      ],
      reasoning: 123 // Wrong type
    }

    const result = SiteDefinitionSchema.safeParse(invalidSiteDefinition)
    expect(result.success).toBe(false)
    
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ['reasoning'],
          code: z.ZodIssueCode.invalid_type
        })
      )
    }
  })

  it('should handle empty blocks array', () => {
    const emptySiteDefinition = {
      theme: 'default',
      blocks: []
    }

    const result = SiteDefinitionSchema.safeParse(emptySiteDefinition)
    expect(result.success).toBe(true)
    
    if (result.success) {
      expect(result.data.blocks).toEqual([])
    }
  })

  it('should validate complex nested slot structure', () => {
    const complexSiteDefinition = {
      theme: 'professional',
      blocks: [
        {
          type: 'hero',
          slots: {
            title: { artifactId: 'hero-title-1' },
            subtitle: { artifactId: 'hero-subtitle-2' },
            content: { artifactId: 'hero-content-3' },
            image: { artifactId: 'hero-image-4' }
          }
        },
        {
          type: 'key-contacts',
          slots: {
            contacts: { artifactId: 'team-contacts-5' },
            emergency: { artifactId: 'emergency-contacts-6' }
          }
        },
        {
          type: 'useful-links',
          slots: {
            internal: { artifactId: 'internal-links-7' },
            external: { artifactId: 'external-links-8' },
            documentation: { artifactId: 'docs-links-9' }
          }
        }
      ],
      reasoning: 'Comprehensive site with multiple content types for complete onboarding experience'
    }

    const result = SiteDefinitionSchema.safeParse(complexSiteDefinition)
    expect(result.success).toBe(true)
    
    if (result.success) {
      expect(result.data.blocks).toHaveLength(3)
      expect(result.data.blocks[0].slots).toHaveProperty('title')
      expect(result.data.blocks[0].slots).toHaveProperty('subtitle')
      expect(result.data.blocks[0].slots).toHaveProperty('content')
      expect(result.data.blocks[0].slots).toHaveProperty('image')
      
      // Verify all artifact IDs are preserved
      expect(result.data.blocks[0].slots.title.artifactId).toBe('hero-title-1')
      expect(result.data.blocks[2].slots.documentation.artifactId).toBe('docs-links-9')
    }
  })

  it('should demonstrate structured output for AI', () => {
    // This test shows how the schema enables structured AI output
    const aiGeneratedSite = {
      theme: 'onboarding',
      blocks: [
        {
          type: 'hero',
          slots: {
            content: { artifactId: 'ai-selected-welcome' }
          }
        }
      ],
      reasoning: 'AI selected the most appropriate welcome message based on user role and content quality analysis'
    }

    const result = SiteDefinitionSchema.safeParse(aiGeneratedSite)
    expect(result.success).toBe(true)
    
    // This validates that AI can generate valid structured output
    // that replaces the unstructured JSON strings from UC-08
    if (result.success) {
      expect(typeof result.data).toBe('object')
      expect(Array.isArray(result.data.blocks)).toBe(true)
      expect(typeof result.data.reasoning).toBe('string')
    }
  })

  it('should enforce required fields', () => {
    const incompleteSiteDefinition = {
      theme: 'technical'
      // Missing blocks array
    }

    const result = SiteDefinitionSchema.safeParse(incompleteSiteDefinition)
    expect(result.success).toBe(false)
    
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ['blocks'],
          code: z.ZodIssueCode.invalid_type
        })
      )
    }
  })
})

// END OF: tests/unit/lib/ai/schemas/site-definition.test.ts