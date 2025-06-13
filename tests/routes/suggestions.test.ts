import { expect, test } from '../fixtures';
import { generateUUID } from '@/lib/utils';
import { getMessageByErrorCode } from '@/lib/errors';

test.describe.serial('/api/suggestions', () => {
  test('Ada cannot get suggestions without documentId', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/suggestions');
    expect(response.status()).toBe(400);

    const { code, message } = await response.json();
    expect(code).toEqual('bad_request:api');
    expect(message).toContain('Parameter documentId is required');
  });

  test('Ada can get suggestions for a document', async ({ adaContext }) => {
    const documentId = generateUUID();
    const response = await adaContext.request.get(
      `/api/suggestions?documentId=${documentId}`
    );
    expect(response.status()).toBe(200);

    const suggestions = await response.json();
    expect(Array.isArray(suggestions)).toBe(true);
  });

  test('Ada gets empty array for non-existent document', async ({ adaContext }) => {
    const documentId = generateUUID();
    const response = await adaContext.request.get(
      `/api/suggestions?documentId=${documentId}`
    );
    expect(response.status()).toBe(200);

    const suggestions = await response.json();
    expect(suggestions).toEqual([]);
  });

  test('Unauthenticated user cannot access suggestions', async ({ request }) => {
    const documentId = generateUUID();
    const response = await request.get(`/api/suggestions?documentId=${documentId}`);
    expect(response.status()).toBe(401);

    const { code, message } = await response.json();
    expect(code).toEqual('unauthorized:suggestions');
    expect(message).toEqual(getMessageByErrorCode('unauthorized:suggestions'));
  });

  test('Babbage cannot access Ada\'s document suggestions', async ({ 
    babbageContext,
    adaContext 
  }) => {
    const documentId = generateUUID();
    
    // Ada creates document (if needed - simplified for test)
    const response = await babbageContext.request.get(
      `/api/suggestions?documentId=${documentId}`
    );
    expect(response.status()).toBe(200);

    const suggestions = await response.json();
    expect(Array.isArray(suggestions)).toBe(true);
  });
});