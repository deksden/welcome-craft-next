/**
 * @file app/api/artifacts/route.ts
 * @description API маршрут для получения артефактов пользователя с пагинацией и поиском.
 * @version 1.3.0
 * @date 2025-06-28
 * @updated УНИФИКАЦИЯ МИРНОЙ СИСТЕМЫ - добавлена поддержка world context для изоляции данных
 * 
 * 📚 **API Documentation:** See `.memory-bank/guides/api-documentation.md#get-apiartifacts`
 * ⚠️ **ВАЖНО:** При изменении параметров или логики - обновить документацию И Use Cases!
 * 
 * URL Parameters:
 * - page: номер страницы (по умолчанию 1)
 * - pageSize: размер страницы (по умолчанию 20, максимум 50)
 * - search/searchQuery: поисковый запрос по заголовку, summary и содержимому
 * - kind: фильтр по типу артефакта (text, code, image, sheet, site)
 * - groupByVersions: группировка по версиям (true по умолчанию - только последние версии, false - все версии)
 */

import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/app/(auth)/auth'
import { getTestSession } from '@/lib/test-auth'
import { getPagedArtifactsByUserId } from '@/lib/db/queries'
import { ChatSDKError } from '@/lib/errors'
import type { ArtifactKind } from '@/lib/types' // <-- ИЗМЕНЕН ИМПОРТ
import { getWorldContextFromRequest } from '@/lib/db/world-context'

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
    const pageParam = searchParams.get('page')
    const pageSizeParam = searchParams.get('pageSize')
    const searchQuery = searchParams.get('search') || searchParams.get('searchQuery') || undefined // ✅ Support both parameter names
    const kind = searchParams.get('kind') as ArtifactKind | undefined
    const tagsParam = searchParams.get('tags')
    const cursor = searchParams.get('cursor')
    const groupByVersions = searchParams.get('groupByVersions') !== 'false' // ✅ Default to true for backward compatibility

    const page = pageParam ? Number.parseInt(pageParam, 10) : 1
    const pageSize = pageSizeParam ? Number.parseInt(pageSizeParam, 10) : 20 // ✅ Default 20 for better UX

    if (Number.isNaN(page) || page <= 0) {
      return new ChatSDKError('bad_request:api', 'Invalid page parameter.').toResponse()
    }
    if (Number.isNaN(pageSize) || pageSize <= 0 || pageSize > 50) {
      return new ChatSDKError('bad_request:api', 'Invalid pageSize parameter. Must be between 1 and 50.').toResponse()
    }

    // TODO: Add tags filtering support to getPagedArtifactsByUserId
    // const tags = tagsParam ? tagsParam.split(',').map(t => t.trim()) : undefined

    // Get world context for database isolation
    const worldContext = getWorldContextFromRequest(request)
    
    const queryParams = { userId: session.user.id, page, pageSize, searchQuery, kind, groupByVersions, worldContext }

    const result = await getPagedArtifactsByUserId(queryParams)

    // Normalize artifacts for API response (add unified content field)
    const { normalizeArtifactForAPI } = await import('@/lib/artifact-content-utils')
    const normalizedArtifacts = await Promise.all(result.data.map(async artifact => await normalizeArtifactForAPI(artifact)))
    
    // ✅ Format response for infinite scroll compatibility
    const totalPages = Math.ceil(result.totalCount / pageSize)
    const hasMore = page < totalPages
    const nextCursor = hasMore ? `page-${page + 1}` : undefined

    const response = {
      artifacts: normalizedArtifacts,
      hasMore,
      nextCursor,
      totalCount: result.totalCount,
      currentPage: page,
      pageSize,
      // Legacy format for backward compatibility
      data: normalizedArtifacts,
    }

    return NextResponse.json(response)

  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse()
    }
    console.error('SYS_API_ARTIFACTS_LIST: Unexpected error', error)
    return new ChatSDKError('bad_request:api', 'An unexpected error occurred while fetching artifacts.').toResponse()
  }
}

// END OF: app/api/artifacts/route.ts
