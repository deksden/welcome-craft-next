/**
 * @file lib/ai/schemas/site-definition.ts
 * @description Zod schema for structured AI output in UC-09 Holistic Site Generation
 * @version 1.0.0
 * @date 2025-06-20
 * @updated Initial version for UC-09 holistic approach
 */

/** HISTORY:
 * v1.0.0 (2025-06-20): Initial schema for holistic AI site generation with structured output
 */

import { z } from 'zod'

/**
 * Schema for a single slot in a site block
 * AI will select the most appropriate artifact ID for each slot
 */
const SiteSlotSchema = z.object({
  artifactId: z.string().describe('ID of the selected artifact for this slot')
})

/**
 * Schema for a site block with its slots filled by AI
 */
const SiteBlockSchema = z.object({
  type: z.string().describe('Type of the block (hero, key-contacts, useful-links, etc.)'),
  slots: z.record(z.string(), SiteSlotSchema).describe('Mapping of slot names to selected artifacts')
})

/**
 * Complete site definition schema for AI structured output
 * This replaces the iterative UC-08 approach with a single holistic AI call
 */
export const SiteDefinitionSchema = z.object({
  theme: z.string().default('default').describe('Visual theme for the site'),
  blocks: z.array(SiteBlockSchema).describe('Array of site blocks with AI-selected content'),
  reasoning: z.string().optional().describe('AI explanation of selection choices (for debugging)')
})

export type SiteDefinition = z.infer<typeof SiteDefinitionSchema>
export type SiteBlock = z.infer<typeof SiteBlockSchema>
export type SiteSlot = z.infer<typeof SiteSlotSchema>

// END OF: lib/ai/schemas/site-definition.ts