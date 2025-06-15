import { expect, apiTest as test } from '../api-fixtures';
import { getMessageByErrorCode } from '@/lib/errors';

// МУЛЬТИДОМЕННАЯ АРХИТЕКТУРА:
// - Аутентификация: app.localhost:3000/login
// - API calls: localhost:3000/api/* (глобальные)
// - Cookies должны передаваться между доменами

test.describe.serial('/api/history', () => {
  test('Ada can get her chat history', async ({ adaContext }) => {
    // Debug: Check if we have authentication cookies
    console.log('Ada email:', adaContext.email);
    
    const response = await adaContext.request.get('/api/history');
    
    // Debug: Log response details if auth fails
    if (response.status() !== 200) {
      const responseBody = await response.text();
      console.log('History API failed:', response.status(), responseBody);
    }
    
    expect(response.status()).toBe(200);

    const { chats } = await response.json();
    expect(Array.isArray(chats)).toBe(true);
  });

  test('Ada can limit chat history results', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/history?limit=5');
    expect(response.status()).toBe(200);

    const { chats } = await response.json();
    expect(Array.isArray(chats)).toBe(true);
    expect(chats.length).toBeLessThanOrEqual(5);
  });

  test('Ada cannot use both starting_after and ending_before', async ({ adaContext }) => {
    const response = await adaContext.request.get(
      '/api/history?starting_after=id1&ending_before=id2'
    );
    expect(response.status()).toBe(400);

    const { code, message, cause } = await response.json();
    expect(code).toEqual('bad_request:api');
    expect(message).toEqual(getMessageByErrorCode(code));
    expect(cause).toContain('Only one of starting_after or ending_before');
  });

  test('Unauthenticated user cannot access history', async ({ request }) => {
    const response = await request.get('/api/history');
    expect(response.status()).toBe(401);

    const { code, message } = await response.json();
    expect(code).toEqual('unauthorized:api');
    expect(message).toEqual(getMessageByErrorCode('unauthorized:api'));
  });

  test('Ada can paginate through history with starting_after', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/history?starting_after=some-id');
    expect(response.status()).toBe(200);

    const { chats } = await response.json();
    expect(Array.isArray(chats)).toBe(true);
  });

  test('Ada can paginate through history with ending_before', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/history?ending_before=some-id');
    expect(response.status()).toBe(200);

    const { chats } = await response.json();
    expect(Array.isArray(chats)).toBe(true);
  });
});