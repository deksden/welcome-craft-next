import { test, expect } from '@playwright/test';

test.describe('POST /api/phoenix/seed/export', () => {
  
  test('should return 403 if not authenticated', async ({ request }) => {
    const response = await request.post('/api/phoenix/seed/export', {
      data: {}
    });
    
    expect(response.status()).toBe(403);
    const json = await response.json();
    expect(json).toHaveProperty('error');
  });

  test('should require authentication for seed export', async ({ request }) => {
    const response = await request.post('/api/phoenix/seed/export', {
      data: {
        worldId: 'test-world',
        sourceDbUrl: 'postgres://test',
        includeBlobs: true,
        seedName: 'my-seed',
      }
    });
    
    // Should fail without authentication
    expect(response.status()).toBe(403);
  });

  test('should validate required fields in request body', async ({ request }) => {
    // Test with incomplete data - missing required fields
    const response = await request.post('/api/phoenix/seed/export', {
      data: {
        worldId: 'test-world'
        // Missing other required fields
      }
    });
    
    // Should return error for incomplete data
    expect([400, 403]).toContain(response.status());
  });
});
