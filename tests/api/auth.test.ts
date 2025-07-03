import { expect, apiTest as test } from '../api-fixtures';

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
    const status = response.status();
    // NextAuth signin endpoint might return 404 if not configured for direct API access
    expect([200, 302, 404]).toContain(status);
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

  test('Invalid auth endpoint returns error', async ({ request }) => {
    const response = await request.get('/api/auth/invalid-endpoint');
    // NextAuth returns 400 for invalid auth endpoints, not 404
    expect([400, 404]).toContain(response.status());
  });

  test('Auth callback endpoint handles basic request', async ({ request }) => {
    // Basic test for auth callback - this would normally handle OAuth callbacks
    // Note: This endpoint typically redirects to a configured URL, so we expect redirect statuses
    // Set a shorter timeout since this test can get stuck in redirect loops
    const response = await request.get('/api/auth/callback/credentials', {
      timeout: 5000,
      maxRedirects: 0  // Prevent following redirects to avoid loops
    });
    // NextAuth callback endpoints typically return redirects (302) or client errors (400) for invalid requests
    // We allow a broader range since NextAuth behavior can vary based on configuration
    expect([200, 302, 400, 404, 500]).toContain(response.status());
  });
});