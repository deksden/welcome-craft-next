import { expect, test } from '../fixtures';

test.describe.serial('/api/auth/[...nextauth]', () => {
  test('Auth providers endpoint responds', async ({ request }) => {
    const response = await request.get('/api/auth/providers');
    // NextAuth providers endpoint should respond with 200
    expect(response.status()).toBe(200);
    
    const providers = await response.json();
    expect(typeof providers).toBe('object');
  });

  test('Auth signin endpoint responds', async ({ request }) => {
    const response = await request.get('/api/auth/signin');
    // NextAuth signin page should respond (might redirect)
    expect([200, 302]).toContain(response.status());
  });

  test('Auth session endpoint handles GET', async ({ request }) => {
    const response = await request.get('/api/auth/session');
    // Should respond with session data (null for unauthenticated)
    expect(response.status()).toBe(200);
    
    const session = await response.json();
    // For unauthenticated user, session should be null or empty object
    expect(session === null || typeof session === 'object').toBe(true);
  });

  test('Auth CSRF token endpoint responds', async ({ request }) => {
    const response = await request.get('/api/auth/csrf');
    expect(response.status()).toBe(200);
    
    const csrf = await response.json();
    expect(csrf).toHaveProperty('csrfToken');
    expect(typeof csrf.csrfToken).toBe('string');
  });

  test('Invalid auth endpoint returns 404', async ({ request }) => {
    const response = await request.get('/api/auth/invalid-endpoint');
    expect(response.status()).toBe(404);
  });

  test('Auth callback endpoint handles basic request', async ({ request }) => {
    // Basic test for auth callback - this would normally handle OAuth callbacks
    const response = await request.get('/api/auth/callback/credentials');
    // Should respond appropriately (might be 400 for invalid request)
    expect([200, 400, 302]).toContain(response.status());
  });
});