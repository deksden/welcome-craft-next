'use server';

import { getSuggestionsByDocumentId } from '@/lib/db/queries';

export async function getSuggestions({ documentId }: { documentId: string }) {
  const suggestions = await getSuggestionsByDocumentId({ documentId });
  // Map database snake_case fields to camelCase for client types
  return suggestions?.map(s => ({
    ...s,
    worldId: s.world_id,
  })) ?? [];
}
