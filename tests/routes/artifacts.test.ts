import { expect, apiTest as test } from '../api-fixtures';
import { getMessageByErrorCode } from '@/lib/errors';

test.describe.serial('/api/artifacts', () => {
  test('Ada can get her artifacts list', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/artifacts');
    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result).toHaveProperty('artifacts');
    expect(result).toHaveProperty('totalCount');
    expect(Array.isArray(result.artifacts)).toBe(true);
  });

  test('Ada can paginate artifacts', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/artifacts?page=1&pageSize=5');
    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.artifacts.length).toBeLessThanOrEqual(5);
  });

  test('Ada cannot use invalid page parameter', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/artifacts?page=0');
    expect(response.status()).toBe(400);

    const { code, message } = await response.json();
    expect(code).toEqual('bad_request:api');
    expect(message).toContain('Invalid page parameter');
  });

  test('Ada cannot use invalid pageSize parameter', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/artifacts?pageSize=100');
    expect(response.status()).toBe(400);

    const { code, message } = await response.json();
    expect(code).toEqual('bad_request:api');
    expect(message).toContain('Invalid pageSize parameter');
  });

  test('Ada cannot use pageSize less than 1', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/artifacts?pageSize=0');
    expect(response.status()).toBe(400);

    const { code, message } = await response.json();
    expect(code).toEqual('bad_request:api');
    expect(message).toContain('Invalid pageSize parameter');
  });

  test('Ada can search artifacts by query', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/artifacts?searchQuery=test');
    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result).toHaveProperty('artifacts');
    expect(Array.isArray(result.artifacts)).toBe(true);
  });

  test('Ada can filter artifacts by kind', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/artifacts?kind=text');
    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result).toHaveProperty('artifacts');
    expect(Array.isArray(result.artifacts)).toBe(true);
  });

  test('Unauthenticated user cannot access artifacts', async ({ request }) => {
    const response = await request.get('/api/artifacts');
    expect(response.status()).toBe(401);

    const { code, message } = await response.json();
    expect(code).toEqual('unauthorized:api');
    expect(message).toEqual(getMessageByErrorCode('unauthorized:api'));
  });

  test('Ada can use complex pagination and filtering', async ({ adaContext }) => {
    const response = await adaContext.request.get(
      '/api/artifacts?page=2&pageSize=3&searchQuery=document&kind=text'
    );
    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result).toHaveProperty('artifacts');
    expect(result.artifacts.length).toBeLessThanOrEqual(3);
  });
});