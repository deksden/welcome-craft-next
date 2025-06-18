/**
 * @file app/api/artifact/route.ts
 * @description API маршрут для работы с артефактами с поддержкой публичного доступа.
 * @version 2.0.0
 * @date 2025-06-17
 * @updated Added publication system support for public access.
 */

/** HISTORY:
 * v2.0.0 (2025-06-17): Added publication system support for public access.
 * v1.3.0 (2025-06-12): GET endpoint accepts versionTimestamp.
 * v1.2.0 (2025-06-10): Импорт ArtifactKind из lib/types.
 * v1.1.0 (2025-06-09): Исправлены типы ошибок и логика для соответствия новой схеме.
 * v1.0.0 (2025-06-09): Переименован из document, адаптирован под новую схему и логику.
 */

import { getAuthSession } from '@/lib/test-auth'
import { deleteArtifactVersionsAfterTimestamp, getArtifactsById, getArtifactById, saveArtifact, } from '@/lib/db/queries'
import { ChatSDKError } from '@/lib/errors'
import type { ArtifactKind } from '@/lib/types' // <-- ИЗМЕНЕН ИМПОРТ
import { isArtifactPublished } from '@/lib/publication-utils'

export async function GET (request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const versionParam = searchParams.get('version')
  const versionTimestampParam = searchParams.get('versionTimestamp')

  console.log('🔍 [DEBUG] GET /api/artifact - Request params:', { id, versionParam, versionTimestampParam })

  if (!id) {
    return new ChatSDKError('bad_request:api', 'Parameter id is missing').toResponse()
  }

  const session = await getAuthSession()
  const isAuthenticated = !!session?.user?.id

  if (versionParam || versionTimestampParam) {
    const version = versionParam ? Number.parseInt(versionParam, 10) : undefined
    const versionTimestamp = versionTimestampParam ? new Date(versionTimestampParam) : undefined
    const result = await getArtifactById({ id, version, versionTimestamp })
    if (!result) {
      return new ChatSDKError('not_found:artifact').toResponse()
    }
    
    // Permission logic: owner + any status / non-owner + published only
    const isOwner = isAuthenticated && result.doc.userId === session.user.id
    const isPublished = isArtifactPublished(result.doc)
    
    if (!isOwner && !isPublished) {
      return new ChatSDKError('forbidden:artifact').toResponse()
    }
    
    // Normalize specific version for API response
    const { normalizeArtifactForAPI } = await import('@/lib/artifact-content-utils')
    const normalizedResult = {
      ...result,
      doc: normalizeArtifactForAPI(result.doc)
    }
    
    return Response.json(normalizedResult, { status: 200 })
  }

  const artifacts = await getArtifactsById({ id })
  
  const [artifact] = artifacts

  if (!artifact) {
    return new ChatSDKError('not_found:artifact').toResponse()
  }

  // Permission logic: owner + any status / non-owner + published only
  const isOwner = isAuthenticated && artifact.userId === session.user.id
  const isPublished = isArtifactPublished(artifact)
  
  if (!isOwner && !isPublished) {
    return new ChatSDKError('forbidden:artifact').toResponse()
  }

  // Normalize artifacts for API response (add unified content field)
  const { normalizeArtifactForAPI } = await import('@/lib/artifact-content-utils')
  const normalizedArtifacts = artifacts.map(normalizeArtifactForAPI)
  
  return Response.json(normalizedArtifacts, { status: 200 })
}

export async function POST (request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return new ChatSDKError('bad_request:api', 'Parameter id is required.').toResponse()
  }

  // POST operations require authentication
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return new ChatSDKError('unauthorized:api', 'User not authenticated.').toResponse()
  }

  const { content, title, kind, }: { content: string; title: string; kind: ArtifactKind } = await request.json()

  const artifacts = await getArtifactsById({ id })
  if (artifacts.length > 0) {
    const [artifact] = artifacts
    if (artifact.userId !== session.user.id) {
      return new ChatSDKError('forbidden:artifact').toResponse()
    }
  }

  const artifact = await saveArtifact({
    id,
    content,
    title,
    kind,
    userId: session.user.id,
    authorId: session.user.id,
  })

  return Response.json(artifact, { status: 200 })
}

export async function DELETE (request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const timestamp = searchParams.get('timestamp')

  if (!id) {
    return new ChatSDKError('bad_request:api', 'Parameter id is required.').toResponse()
  }
  if (!timestamp) {
    return new ChatSDKError('bad_request:api', 'Parameter timestamp is required.').toResponse()
  }

  // DELETE operations require authentication
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return new ChatSDKError('unauthorized:api', 'User not authenticated.').toResponse()
  }

  const artifacts = await getArtifactsById({ id })
  const [artifact] = artifacts

  if (artifact.userId !== session.user.id) {
    return new ChatSDKError('forbidden:artifact').toResponse()
  }

  const deletedArtifacts = await deleteArtifactVersionsAfterTimestamp({
    id,
    timestamp: new Date(timestamp),
  })

  return Response.json(deletedArtifacts, { status: 200 })
}

// END OF: app/api/artifact/route.ts
