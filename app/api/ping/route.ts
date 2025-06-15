/**
 * @file app/api/ping/route.ts
 * @description Simplified ping endpoint for Playwright tests to avoid middleware
 * @version 1.0.0
 * @date 2025-06-14
 */

export async function GET() {
  return new Response('OK', { 
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache'
    }
  });
}