/**
 * @file lib/db/types.ts
 * @description Client-safe database types - types only, no server-only imports
 * @version 1.0.0
 * @date 2025-06-22
 * @updated Initial separation of types from server-only schema.ts
 */

/** HISTORY:
 * v1.0.0 (2025-06-22): Initial separation - extracted types from schema.ts for client-side usage
 */

import type { ArtifactKind, PublicationInfo } from '@/lib/types'

// Basic database entity types (client-safe)
export interface User {
  id: string
  email: string
  password: string | null
  name: string | null
  createdAt: Date
  updatedAt: Date
  worldId: string | null
}

export interface Chat {
  id: string
  createdAt: Date
  title: string
  userId: string
  path: string
  worldId: string | null
  publishedUntil: Date | null
}

export interface DBMessage {
  id: string
  chatId: string
  role: 'user' | 'assistant'
  content: any // JSON
  createdAt: Date
  worldId: string | null
}

export interface Artifact {
  id: string
  createdAt: Date
  title: string
  summary: string
  kind: ArtifactKind
  userId: string
  authorId: string | null
  deletedAt: Date | null
  worldId: string | null
  publicationState: PublicationInfo[]
}

export interface Suggestion {
  id: string
  documentId: string // actual DB field name
  documentCreatedAt: Date
  originalText: string
  suggestedText: string
  description: string | null
  isResolved: boolean
  isDismissed: boolean
  userId: string
  createdAt: Date
  worldId: string | null
}

// UC-10 Schema-Driven CMS types (client-safe)
export interface ArtifactText {
  artifactId: string
  createdAt: Date
  content: string
}

export interface ArtifactImage {
  artifactId: string
  createdAt: Date
  originalFilename: string
  mimeType: string
  size: number
  url: string
  altText: string | null
}

export interface ArtifactPerson {
  artifactId: string
  createdAt: Date
  fullName: string
  position: string | null
  department: string | null
  email: string | null
  phone: string | null
  bio: string | null
  profileImageUrl: string | null
}

export interface ArtifactAddress {
  artifactId: string
  createdAt: Date
  name: string
  street: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
}

export interface ArtifactFaqItem {
  artifactId: string
  createdAt: Date
  question: string
  answer: string
  category: string | null
  orderIndex: number | null
}

export interface ArtifactLink {
  artifactId: string
  createdAt: Date
  url: string
  title: string | null
  description: string | null
  category: string | null
  isInternal: boolean
}

export interface ArtifactSetDefinition {
  artifactId: string
  createdAt: Date
  name: string
  description: string | null
  itemSchema: any // JSON
}

export interface ArtifactSetItems {
  artifactId: string
  createdAt: Date
  setDefinitionId: string
  items: any // JSON array
}

export interface ArtifactSite {
  artifactId: string
  createdAt: Date
  definition: any // JSON - SiteDefinition
}

// END OF: lib/db/types.ts