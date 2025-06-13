import { expect, test } from '../fixtures';
import { getMessageByErrorCode } from '@/lib/errors';

test.describe.serial('/api/history', () => {
  test('Ada can get her chat history', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/history');
    expect(response.status()).toBe(200);

    const chats = await response.json();
    expect(Array.isArray(chats)).toBe(true);
  });

  test('Ada can limit chat history results', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/history?limit=5');
    expect(response.status()).toBe(200);

    const chats = await response.json();
    expect(Array.isArray(chats)).toBe(true);
    expect(chats.length).toBeLessThanOrEqual(5);
  });

  test('Ada cannot use both starting_after and ending_before', async ({ adaContext }) => {
    const response = await adaContext.request.get(
      '/api/history?starting_after=id1&ending_before=id2'
    );
    expect(response.status()).toBe(400);

    const { code, message } = await response.json();
    expect(code).toEqual('bad_request:api');
    expect(message).toContain('Only one of starting_after or ending_before');
  });

  test('Unauthenticated user cannot access history', async ({ request }) => {
    const response = await request.get('/api/history');
    expect(response.status()).toBe(401);

    const { code, message } = await response.json();
    expect(code).toEqual('unauthorized:chat');
    expect(message).toEqual(getMessageByErrorCode('unauthorized:chat'));
  });

  test('Ada can paginate through history with starting_after', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/history?starting_after=some-id');
    expect(response.status()).toBe(200);

    const chats = await response.json();
    expect(Array.isArray(chats)).toBe(true);
  });

  test('Ada can paginate through history with ending_before', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/history?ending_before=some-id');
    expect(response.status()).toBe(200);

    const chats = await response.json();
    expect(Array.isArray(chats)).toBe(true);
  });
});