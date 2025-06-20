/**
 * @file app/api/history/route.ts
 * @description API маршрут для получения истории чатов пользователя.
 * @version 1.0.0
 * @date 2025-06-20
 * @updated Добавлена ссылка на документацию API.
 * 
 * 📚 **API Documentation:** See `.memory-bank/guides/api-documentation.md#get-apihistory`
 * ⚠️ **ВАЖНО:** При изменении параметров или логики - обновить документацию И Use Cases!
 */

import { auth } from '@/app/app/(auth)/auth';
import { getTestSession } from '@/lib/test-auth';
import type { NextRequest } from 'next/server';
import { getChatsByUserId } from '@/lib/db/queries';
import { getWorldContextFromRequest } from '@/lib/db/world-context';
import { ChatSDKError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Number.parseInt(searchParams.get('limit') || '10');
  const startingAfter = searchParams.get('starting_after');
  const endingBefore = searchParams.get('ending_before');

  if (startingAfter && endingBefore) {
    return new ChatSDKError(
      'bad_request:api',
      'Only one of starting_after or ending_before can be provided.',
    ).toResponse();
  }

  let session = await auth();
  if (!session?.user) {
    session = await getTestSession();
  }
  if (!session?.user?.id) {
    return new ChatSDKError('unauthorized:api', 'User not authenticated.').toResponse();
  }

  // Get world context from request cookies
  const worldContext = getWorldContextFromRequest(request);
  
  console.log('🌍 API /history using world context:', {
    userId: session.user.id,
    worldContext,
    limit
  });

  // Use enhanced getChatsByUserId with automatic world isolation
  const result = await getChatsByUserId({
    id: session.user.id,
    limit,
    startingAfter,
    endingBefore,
    worldContext
  });
  
  console.log('🌍 API /history returned chats:', {
    count: result.chats.length,
    hasMore: result.hasMore,
    worldContext
  });

  return Response.json(result);
}
