import { auth } from '@/app/app/(auth)/auth';
import { getSuggestionsByDocumentId } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { getTestSession } from '@/lib/test-auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('documentId');

  if (!documentId) {
    return new ChatSDKError(
      'bad_request:api',
      'Parameter documentId is required.',
    ).toResponse();
  }

  // Попробуем получить обычную сессию или тестовую
  let session = await auth();
  
  // Если нет обычной сессии, проверяем тестовую
  if (!session?.user) {
    session = await getTestSession();
  }

  if (!session?.user) {
    return new ChatSDKError('unauthorized:suggestions').toResponse();
  }

  const suggestions = await getSuggestionsByDocumentId({
    documentId,
  });

  const [suggestion] = suggestions;

  if (!suggestion) {
    return Response.json([], { status: 200 });
  }

  if (suggestion.userId !== session.user.id) {
    return new ChatSDKError('forbidden:api').toResponse();
  }

  return Response.json(suggestions, { status: 200 });
}
