/**
 * @file app/api/artifacts/create-from-upload/route.ts
 * @description API маршрут для создания артефакта из загруженного файла.
 * @version 1.1.0
 * @date 2025-06-20
 * @updated Добавлена ссылка на документацию API.
 * 
 * 📚 **API Documentation:** See `.memory-bank/guides/api-documentation.md#post-apiartifactscreate-from-upload`
 * ⚠️ **ВАЖНО:** При изменении параметров или логики - обновить документацию И Use Cases!
 */

/** HISTORY:
 * v1.0.0 (2025-06-20): Создан для исправления BUG-020 - missing API endpoint для chat-input.tsx.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/app/(auth)/auth'
import { getTestSession } from '@/lib/test-auth'
import { saveArtifact } from '@/lib/db/queries'
import { ChatSDKError } from '@/lib/errors'
import { generateUUID } from '@/lib/utils'
import type { ArtifactKind } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    let session = await auth()
    if (!session?.user) {
      session = await getTestSession()
    }
    
    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:api', 'User not authenticated.').toResponse()
    }

    const { url, title, kind }: { url: string; title: string; kind: ArtifactKind } = await request.json()

    if (!url || !title || !kind) {
      return new ChatSDKError('bad_request:api', 'Missing required parameters: url, title, kind.').toResponse()
    }

    // Validate artifact kind
    const validKinds: ArtifactKind[] = ['text', 'code', 'image', 'sheet', 'site']
    if (!validKinds.includes(kind)) {
      return new ChatSDKError('bad_request:api', `Invalid kind. Must be one of: ${validKinds.join(', ')}.`).toResponse()
    }

    // Generate unique ID for the artifact
    const artifactId = generateUUID()

    // For image artifacts, use the URL as content
    // For other types, we might need to fetch and process the content
    let content: string
    if (kind === 'image') {
      content = url
    } else {
      // For non-image files, we could fetch the content
      // For now, just store the URL and let the user process it
      content = `Загружен файл: ${title}\nURL: ${url}`
    }

    // Save the artifact
    const artifact = await saveArtifact({
      id: artifactId,
      content,
      title,
      kind,
      userId: session.user.id,
      authorId: session.user.id,
    })

    // Return artifact metadata in the same format as other AI tools
    const createdArtifact = artifact[0] // createArtifact returns array
    const response = {
      artifactId: createdArtifact.id,
      artifactKind: createdArtifact.kind,
      artifactTitle: createdArtifact.title,
      description: `Файл "${title}" успешно загружен как артефакт.`,
      version: 1,
      totalVersions: 1,
      updatedAt: createdArtifact.createdAt.toISOString(),
      summary: `Загруженный файл: ${title}`,
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse()
    }
    console.error('SYS_API_ARTIFACTS_CREATE_FROM_UPLOAD: Unexpected error', error)
    return new ChatSDKError('bad_request:api', 'An unexpected error occurred while creating artifact from upload.').toResponse()
  }
}

// END OF: app/api/artifacts/create-from-upload/route.ts