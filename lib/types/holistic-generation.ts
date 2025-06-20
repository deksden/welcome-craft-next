/**
 * @file lib/types/holistic-generation.ts
 * @description TypeScript types for UC-09 Holistic Site Generation
 * @version 1.0.0
 * @date 2025-06-20
 * @updated Initial types for holistic AI approach
 */

/** HISTORY:
 * v1.0.0 (2025-06-20): Initial types for candidate aggregation and holistic AI generation
 */

import type { ArtifactKind } from '@/lib/types'

/**
 * Artifact candidate information for AI selection
 * Contains minimal necessary data for AI to make informed choices
 */
export interface ArtifactCandidate {
  artifactId: string
  title: string
  summary: string | null
  kind: ArtifactKind
}

/**
 * Slot definition from block configuration
 */
export interface SlotDefinition {
  kind: ArtifactKind | ArtifactKind[]
  tags?: string[]
  description?: string
}

/**
 * All candidates aggregated for a specific slot
 */
export interface SlotCandidates {
  slotName: string
  slotDefinition: SlotDefinition
  candidates: ArtifactCandidate[]
}

/**
 * All candidates for a specific block type
 */
export interface BlockCandidates {
  blockType: string
  slots: SlotCandidates[]
}

/**
 * Complete aggregated candidates structure for holistic AI analysis
 */
export interface AllCandidates {
  blocks: BlockCandidates[]
  totalArtifacts: number
  userPrompt: string
}

/**
 * Context for holistic AI generation
 */
export interface HolisticGenerationContext {
  userId: string
  userPrompt: string
  allCandidates: AllCandidates
}

// END OF: lib/types/holistic-generation.ts