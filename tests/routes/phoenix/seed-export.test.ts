import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, } from 'next/server';
import { POST } from '@/app/api/phoenix/seed/export/route';

// Mock the getAuthSession
const mockGetAuthSession = vi.fn();
vi.mock('@/lib/test-auth', () => ({
  getAuthSession: () => mockGetAuthSession(),
}));

// Mock PhoenixSeedManager
const mockExportWorld = vi.fn();
vi.mock('@/lib/phoenix/seed-manager', () => ({
  PhoenixSeedManager: vi.fn(() => ({
    exportWorld: mockExportWorld,
  })),
}));

describe('POST /api/phoenix/seed/export', () => {
  let originalAppStage: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthSession.mockResolvedValue(null); // Default to no session
    originalAppStage = process.env.APP_STAGE;
    process.env.APP_STAGE = 'LOCAL'; // Default to LOCAL for most tests
  });

  afterEach(() => {
    process.env.APP_STAGE = originalAppStage; // Restore original APP_STAGE
  });

  it('should return 403 if APP_STAGE is not LOCAL', async () => {
    process.env.APP_STAGE = 'BETA';
    const req = new NextRequest('http://localhost/api/phoenix/seed/export', { method: 'POST', body: JSON.stringify({}) });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'This feature is only available in the LOCAL environment.' });
  });

  it('should return 403 if not authenticated', async () => {
    const req = new NextRequest('http://localhost/api/phoenix/seed/export', { method: 'POST', body: JSON.stringify({}) });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Access Denied' });
  });

  it('should return 403 if authenticated but not admin', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { type: 'user' } });
    const req = new NextRequest('http://localhost/api/phoenix/seed/export', { method: 'POST', body: JSON.stringify({}) });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Access Denied' });
  });

  it('should return 400 if missing required fields', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { type: 'admin' } });
    const req = new NextRequest('http://localhost/api/phoenix/seed/export', { method: 'POST', body: JSON.stringify({ worldId: 'test' }) });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Missing required fields' });
  });

  it('should successfully export seed data', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { type: 'admin' } });
    mockExportWorld.mockResolvedValue('/path/to/exported/seed');

    const exportData = {
      worldId: 'test-world',
      sourceDbUrl: 'postgres://test',
      includeBlobs: true,
      seedName: 'my-seed',
    };
    const req = new NextRequest('http://localhost/api/phoenix/seed/export', { method: 'POST', body: JSON.stringify(exportData) });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, path: '/path/to/exported/seed' });
    expect(mockExportWorld).toHaveBeenCalledWith(exportData.worldId, exportData.seedName, exportData.includeBlobs);
  });

  it('should return 500 if exportWorld fails', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { type: 'admin' } });
    mockExportWorld.mockRejectedValue(new Error('Export failed'));

    const exportData = {
      worldId: 'test-world',
      sourceDbUrl: 'postgres://test',
      includeBlobs: false,
      seedName: 'my-seed',
    };
    const req = new NextRequest('http://localhost/api/phoenix/seed/export', { method: 'POST', body: JSON.stringify(exportData) });
    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Seed export failed.' });
  });
});
