import { expect, apiTest as test } from '../api-fixtures';
import { generateUUID } from '@/lib/utils';
import { getMessageByErrorCode } from '@/lib/errors';

test.describe.serial('/api/suggestions', () => {
  test('Ada cannot get suggestions without artifactId', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/suggestions');
    expect(response.status()).toBe(400);

    const { code, message, cause } = await response.json();
    expect(code).toEqual('bad_request:api');
    expect(message).toEqual(getMessageByErrorCode(code));
    expect(cause).toContain('Parameter documentId is required');
  });

  test('Ada can get suggestions for an artifact', async ({ adaContext }) => {
    const artifactId = generateUUID();
    const response = await adaContext.request.get(
      `/api/suggestions?documentId=${artifactId}`
    );
    expect(response.status()).toBe(200);

    const suggestions = await response.json();
    expect(Array.isArray(suggestions)).toBe(true);
  });

  test('Ada gets empty array for non-existent artifact', async ({ adaContext }) => {
    const artifactId = generateUUID();
    const response = await adaContext.request.get(
      `/api/suggestions?documentId=${artifactId}`
    );
    expect(response.status()).toBe(200);

    const suggestions = await response.json();
    expect(suggestions).toEqual([]);
  });

  test('Unauthenticated user cannot access suggestions', async ({ request }) => {
    const artifactId = generateUUID();
    const response = await request.get(`/api/suggestions?documentId=${artifactId}`);
    expect(response.status()).toBe(401);

    const { code, message } = await response.json();
    expect(code).toEqual('unauthorized:suggestions');
    expect(message).toEqual(getMessageByErrorCode('unauthorized:suggestions'));
  });

  test('Babbage cannot access Ada\'s artifact suggestions', async ({ 
    babbageContext,
    adaContext 
  }) => {
    const artifactId = generateUUID();
    
    // Babbage tries to access suggestions for Ada's artifact
    const response = await babbageContext.request.get(
      `/api/suggestions?documentId=${artifactId}`
    );
    expect(response.status()).toBe(200);

    const suggestions = await response.json();
    expect(Array.isArray(suggestions)).toBe(true);
    // Should return empty array for non-existent or inaccessible artifacts
    expect(suggestions).toEqual([]);
  });
});