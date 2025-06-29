/**
 * @file app/api/artifacts/recent/route.ts
 * @description API маршрут для получения списка недавних артефактов пользователя.
 * @version 1.4.0
 * @date 2025-06-28
 * @updated BUG-043 FIX: Исправлен критический баг с async mapping - normalizeArtifactForAPI теперь правильно обрабатывается через Promise.all
 * 
 * 📚 **API Documentation:** See `.memory-bank/guides/api-documentation.md#get-apiartifactsrecent`
 * ⚠️ **ВАЖНО:** При изменении параметров или логики - обновить документацию И Use Cases!
 */

import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/app/(auth)/auth'
import { getTestSession } from '@/lib/test-auth'
import { getRecentArtifactsByUserId } from '@/lib/db/queries'
import { getWorldContextFromRequest } from '@/lib/db/world-context'
import { ChatSDKError } from '@/lib/errors'
import type { ArtifactKind } from '@/lib/types' // <-- ИЗМЕНЕН ИМПОРТ

export const dynamic = 'force-dynamic'

export async function GET (request: NextRequest) {
  try {
    let session = await auth()
    if (!session?.user) {
      session = await getTestSession()
    }
    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:api', 'User not authenticated.').toResponse()
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const kind = searchParams.get('kind') as ArtifactKind | undefined

    const limit = limitParam ? Number.parseInt(limitParam, 10) : 5

    if (Number.isNaN(limit) || limit <= 0 || limit > 20) {
      return new ChatSDKError('bad_request:api', 'Invalid limit parameter. Must be between 1 and 20.').toResponse()
    }

    // Get world context from request cookies
    const worldContext = getWorldContextFromRequest(request);
    
    console.log('🌍 API /artifacts/recent using world context:', {
      userId: session.user.id,
      worldContext,
      limit,
      kind
    });

    // Use enhanced getRecentArtifactsByUserId with automatic world isolation
    const recentArtifacts = await getRecentArtifactsByUserId({ 
      userId: session.user.id, 
      limit, 
      kind,
      worldContext
    });
    
    console.log('🌍 API /artifacts/recent returned artifacts:', {
      count: recentArtifacts.length,
      worldContext
    });

    // Normalize artifacts for API response (add unified content field)
    const { normalizeArtifactForAPI } = await import('@/lib/artifact-content-utils')
    const normalizedArtifacts = await Promise.all(recentArtifacts.map(normalizeArtifactForAPI))
    
    console.log('🔍 BUG-043 DEBUG: API /artifacts/recent returning:', {
      count: normalizedArtifacts.length,
      sample: normalizedArtifacts[0] ? {
        id: normalizedArtifacts[0].id,
        title: normalizedArtifacts[0].title,
        kind: normalizedArtifacts[0].kind,
        hasContent: !!normalizedArtifacts[0].content,
        allKeys: Object.keys(normalizedArtifacts[0])
      } : null
    })

    return NextResponse.json(normalizedArtifacts)

  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse()
    }
    console.error('SYS_API_ARTIFACTS_RECENT: Unexpected error', error)
    return new ChatSDKError('bad_request:api', 'An unexpected error occurred while fetching recent artifacts.').toResponse()
  }
}

// END OF: app/api/artifacts/recent/route.ts
