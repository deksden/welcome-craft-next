/**
 * @file app/api/artifact/route.ts
 * @description API маршрут для работы с артефактами.
 * @version 1.3.0
 * @date 2025-06-12
 * @updated Added versionTimestamp support for single-version retrieval.
 */

/** HISTORY:
 * v1.3.0 (2025-06-12): GET endpoint accepts versionTimestamp.
 * v1.2.0 (2025-06-10): Импорт ArtifactKind из lib/types.
 * v1.1.0 (2025-06-09): Исправлены типы ошибок и логика для соответствия новой схеме.
 * v1.0.0 (2025-06-09): Переименован из document, адаптирован под новую схему и логику.
 */

import { getAuthSession } from '@/lib/test-auth'
import { deleteArtifactVersionsAfterTimestamp, getArtifactsById, getArtifactById, saveArtifact, } from '@/lib/db/queries'
import { ChatSDKError } from '@/lib/errors'
import type { ArtifactKind } from '@/lib/types' // <-- ИЗМЕНЕН ИМПОРТ

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
  console.log('🔍 [DEBUG] GET /api/artifact - Auth session:', { 
    authenticated: !!session?.user?.id, 
    userId: session?.user?.id 
  })
  
  if (!session?.user?.id) {
    return new ChatSDKError('unauthorized:api', 'User not authenticated.').toResponse()
  }

  if (versionParam || versionTimestampParam) {
    const version = versionParam ? Number.parseInt(versionParam, 10) : undefined
    const versionTimestamp = versionTimestampParam ? new Date(versionTimestampParam) : undefined
    console.log('🔍 [DEBUG] GET /api/artifact - Getting specific version:', { version, versionTimestamp })
    const result = await getArtifactById({ id, version, versionTimestamp })
    console.log('🔍 [DEBUG] GET /api/artifact - Specific version result:', { 
      found: !!result, 
      kind: result?.doc?.kind,
      title: result?.doc?.title,
      hasContentText: !!result?.doc?.content_text,
      hasContentUrl: !!result?.doc?.content_url,
      hasContentSiteDefinition: !!result?.doc?.content_site_definition
    })
    if (!result) {
      return new ChatSDKError('not_found:artifact').toResponse()
    }
    if (result.doc.userId !== session.user.id) {
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

  console.log('🔍 [DEBUG] GET /api/artifact - Getting all versions for id:', id)
  const artifacts = await getArtifactsById({ id })
  console.log('🔍 [DEBUG] GET /api/artifact - All versions result:', { 
    count: artifacts.length,
    firstArtifact: artifacts[0] ? {
      kind: artifacts[0].kind,
      title: artifacts[0].title,
      summary: artifacts[0].summary,
      hasContentText: !!artifacts[0].content_text,
      hasContentUrl: !!artifacts[0].content_url,
      hasContentSiteDefinition: !!artifacts[0].content_site_definition
    } : null
  })
  
  const [artifact] = artifacts

  if (!artifact) {
    console.log('🔍 [DEBUG] GET /api/artifact - Artifact not found')
    return new ChatSDKError('not_found:artifact').toResponse()
  }

  if (artifact.userId !== session.user.id) {
    console.log('🔍 [DEBUG] GET /api/artifact - Access denied, userId mismatch')
    return new ChatSDKError('forbidden:artifact').toResponse()
  }

  // Normalize artifacts for API response (add unified content field)
  const { normalizeArtifactForAPI } = await import('@/lib/artifact-content-utils')
  const normalizedArtifacts = artifacts.map(normalizeArtifactForAPI)
  
  console.log('🔍 [DEBUG] GET /api/artifact - Returning artifacts:', normalizedArtifacts.length)
  return Response.json(normalizedArtifacts, { status: 200 })
}

export async function POST (request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return new ChatSDKError('bad_request:api', 'Parameter id is required.').toResponse()
  }

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
