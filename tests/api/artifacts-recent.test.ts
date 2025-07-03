import { expect, apiTest as test } from '../api-fixtures';
import { getMessageByErrorCode } from '@/lib/errors';

test.describe.serial('/api/artifacts/recent', () => {
  test('Ada can get recent artifacts', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/artifacts/recent');
    expect(response.status()).toBe(200);

    const artifacts = await response.json();
    expect(Array.isArray(artifacts)).toBe(true);
  });

  test('Ada can limit recent artifacts results', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/artifacts/recent?limit=3');
    expect(response.status()).toBe(200);

    const artifacts = await response.json();
    expect(Array.isArray(artifacts)).toBe(true);
    expect(artifacts.length).toBeLessThanOrEqual(3);
  });

  test('Ada cannot use invalid limit parameter', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/artifacts/recent?limit=0');
    expect(response.status()).toBe(400);

    const { code, message, cause } = await response.json();
    expect(code).toEqual('bad_request:api');
    expect(message).toEqual(getMessageByErrorCode('bad_request:api'));
    expect(cause).toContain('Invalid limit parameter');
  });

  test('Ada cannot use limit greater than 20', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/artifacts/recent?limit=25');
    expect(response.status()).toBe(400);

    const { code, message, cause } = await response.json();
    expect(code).toEqual('bad_request:api');
    expect(message).toEqual(getMessageByErrorCode('bad_request:api'));
    expect(cause).toContain('Invalid limit parameter');
  });

  test('Ada can filter recent artifacts by kind', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/artifacts/recent?kind=text');
    expect(response.status()).toBe(200);

    const artifacts = await response.json();
    expect(Array.isArray(artifacts)).toBe(true);
  });

  test('Ada can filter recent artifacts by site kind', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/artifacts/recent?kind=site');
    expect(response.status()).toBe(200);

    const artifacts = await response.json();
    expect(Array.isArray(artifacts)).toBe(true);
  });

  test('Ada can combine limit and kind filters', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/artifacts/recent?limit=10&kind=code');
    expect(response.status()).toBe(200);

    const artifacts = await response.json();
    expect(Array.isArray(artifacts)).toBe(true);
    expect(artifacts.length).toBeLessThanOrEqual(10);
  });

  test('Ada can filter for site artifacts specifically', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/artifacts/recent?limit=5&kind=site');
    expect(response.status()).toBe(200);

    const artifacts = await response.json();
    expect(Array.isArray(artifacts)).toBe(true);
    expect(artifacts.length).toBeLessThanOrEqual(5);
  });

  test('Default limit is applied when not specified', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/artifacts/recent');
    expect(response.status()).toBe(200);

    const artifacts = await response.json();
    expect(Array.isArray(artifacts)).toBe(true);
    // Default limit is 5, so should not exceed that
    expect(artifacts.length).toBeLessThanOrEqual(5);
  });

  test('Unauthenticated user cannot access recent artifacts', async ({ request }) => {
    const response = await request.get('/api/artifacts/recent');
    expect(response.status()).toBe(401);

    const { code, message } = await response.json();
    expect(code).toEqual('unauthorized:api');
    expect(message).toEqual(getMessageByErrorCode('unauthorized:api'));
  });

  test('Invalid limit string is handled gracefully', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/artifacts/recent?limit=invalid');
    expect(response.status()).toBe(400);

    const { code, message, cause } = await response.json();
    expect(code).toEqual('bad_request:api');
    expect(message).toEqual(getMessageByErrorCode('bad_request:api'));
    expect(cause).toContain('Invalid limit parameter');
  });
});