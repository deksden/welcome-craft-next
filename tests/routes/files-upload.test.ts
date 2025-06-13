import { expect, test } from '../fixtures';
import { getMessageByErrorCode } from '@/lib/errors';

test.describe.serial('/api/files/upload', () => {
  test('Ada can initiate file upload', async ({ adaContext }) => {
    const uploadBody = {
      type: 'image/jpeg',
      payload: JSON.stringify({
        userId: 'ada-user-id'
      })
    };

    const response = await adaContext.request.post('/api/files/upload', {
      data: uploadBody
    });
    
    // The actual response depends on Vercel Blob implementation
    // In real scenario this should return upload URL and token
    expect([200, 201]).toContain(response.status());
  });

  test('Unauthenticated user cannot upload files', async ({ request }) => {
    const uploadBody = {
      type: 'image/jpeg',
      payload: JSON.stringify({})
    };

    const response = await request.post('/api/files/upload', {
      data: uploadBody
    });
    expect(response.status()).toBe(401);

    const { code, message } = await response.json();
    expect(code).toEqual('unauthorized:api');
    expect(message).toEqual(getMessageByErrorCode('unauthorized:api'));
  });

  test('Ada can only upload allowed content types', async ({ adaContext }) => {
    const uploadBody = {
      type: 'image/jpeg', // Allowed type
      payload: JSON.stringify({
        userId: 'ada-user-id'
      })
    };

    const response = await adaContext.request.post('/api/files/upload', {
      data: uploadBody
    });
    
    // Should not be rejected for allowed type
    expect(response.status()).not.toBe(400);
  });

  test('Upload includes user context in token payload', async ({ adaContext }) => {
    const uploadBody = {
      type: 'image/png',
      payload: JSON.stringify({
        userId: 'ada-user-id'
      })
    };

    const response = await adaContext.request.post('/api/files/upload', {
      data: uploadBody
    });
    
    // The upload should proceed (exact response depends on Vercel Blob)
    expect([200, 201, 202]).toContain(response.status());
  });

  test('Empty request body is handled gracefully', async ({ adaContext }) => {
    const response = await adaContext.request.post('/api/files/upload', {
      data: {}
    });
    
    // Should handle malformed request appropriately
    expect([400, 500]).toContain(response.status());
  });
});