/**
 * @file app/api/files/upload/route.ts
 * @description API-маршрут для client-side загрузки файлов в Vercel Blob.
 * @version 1.0.0
 * @date 2025-06-07
 * @updated Переход от проксирования файла к генерации токена для прямой загрузки клиентом.
 */

/** HISTORY:
 * v1.0.0 (2025-06-07): Начальная версия с использованием handleUpload для генерации токена.
 */

import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth } from '@/app/app/(auth)/auth';
import { getTestSession } from '@/lib/test-auth';
import { ChatSDKError } from '@/lib/errors';
 
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
 
  try {
    let session = await auth();
    if (!session?.user) {
      session = await getTestSession();
    }
    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:api', 'User not authenticated.').toResponse();
    }

    // Stub upload for Playwright tests to avoid external Blob dependencies
    if (request.headers.get('X-Test-Environment') === 'playwright') {
      // Return a dummy upload URL and token
      return NextResponse.json({
        uploadUrl: `${request.url}/test-upload`,
        token: JSON.stringify({ userId: session.user.id }),
      });
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif'],
          tokenPayload: JSON.stringify({
            userId: session.user.id,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('SYS_BLOB_UPLOAD: blob upload completed', blob, tokenPayload);
      },
    });
 
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('SYS_API_UPLOAD: Error handling file upload', error);
    return new ChatSDKError('bad_request:api', 'Failed to handle file upload.').toResponse()
  }
}

// END OF: app/api/files/upload/route.ts
