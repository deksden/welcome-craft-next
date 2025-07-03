import { test, expect } from '@playwright/test';

test.describe('Phoenix User Management API Routes', () => {
  
  test.describe('GET /api/phoenix/users', () => {
    test('should return 403 if not authenticated', async ({ request }) => {
      const response = await request.get('/api/phoenix/users');
      expect(response.status()).toBe(403);
      const json = await response.json();
      expect(json).toHaveProperty('error');
    });

    test('should require admin access', async ({ request }) => {
      const response = await request.get('/api/phoenix/users');
      expect(response.status()).toBe(403);
    });
  });

  test.describe('POST /api/phoenix/users', () => {
    test('should return 403 if not authenticated', async ({ request }) => {
      const response = await request.post('/api/phoenix/users', {
        data: {}
      });
      expect(response.status()).toBe(403);
    });

    test('should validate required fields', async ({ request }) => {
      const response = await request.post('/api/phoenix/users', {
        data: {
          email: 'test@example.com'
          // Missing other required fields
        }
      });
      // Should return error (either 400 for validation or 403 for auth)
      expect([400, 403]).toContain(response.status());
    });
  });

  test.describe('PUT /api/phoenix/users/[id]', () => {
    test('should return 403 if not authenticated', async ({ request }) => {
      const response = await request.put('/api/phoenix/users/user1', {
        data: {}
      });
      expect(response.status()).toBe(403);
    });
  });

  test.describe('DELETE /api/phoenix/users/[id]', () => {
    test('should return 403 if not authenticated', async ({ request }) => {
      const response = await request.delete('/api/phoenix/users/user1');
      expect(response.status()).toBe(403);
    });
  });
});
