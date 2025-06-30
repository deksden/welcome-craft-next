import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, } from 'next/server';
import { GET, POST } from '@/app/api/phoenix/users/route';
import { PUT as PUT_ID, DELETE as DELETE_ID } from '@/app/api/phoenix/users/[id]/route';
import { user } from '@/lib/db/schema';

// Mock the getAuthSession
const mockGetAuthSession = vi.fn();
vi.mock('@/lib/test-auth', () => ({
  getAuthSession: () => mockGetAuthSession(),
}));

// Mock the database
const mockUsers = [
  { id: 'user1', email: 'user1@example.com', name: 'User One', password: 'pass1', type: 'user' },
  { id: 'admin1', email: 'admin1@example.com', name: 'Admin One', password: 'pass2', type: 'admin' },
];

const mockDb = {
  select: vi.fn(() => ({ from: vi.fn(() => mockUsers) })),
  insert: vi.fn(() => ({ values: vi.fn((data) => ({ returning: vi.fn(() => [data[0]]) })) })),
  update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn((data) => [data]) })) })) })),
  delete: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(() => []) })) })),
  query: {
    user: {
      findFirst: vi.fn(({ where }: { where: any }) => {
        const userId = where.value;
        return mockUsers.find(u => u.id === userId);
      }),
    },
  },
};

vi.mock('@/lib/db', () => ({
  db: mockDb,
}));

describe('Phoenix User Management API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthSession.mockResolvedValue(null); // Default to no session
  });

  // GET /api/phoenix/users
  describe('GET /api/phoenix/users', () => {
    it('should return 403 if not authenticated', async () => {
      const req = new NextRequest('http://localhost/api/phoenix/users');
      const res = await GET(req);
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: 'Access Denied' });
    });

    it('should return 403 if authenticated but not admin', async () => {
      mockGetAuthSession.mockResolvedValue({ user: { type: 'user' } });
      const req = new NextRequest('http://localhost/api/phoenix/users');
      const res = await GET(req);
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: 'Access Denied' });
    });

    it('should return all users if authenticated as admin', async () => {
      mockGetAuthSession.mockResolvedValue({ user: { type: 'admin' } });
      const req = new NextRequest('http://localhost/api/phoenix/users');
      const res = await GET(req);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(mockUsers);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  // POST /api/phoenix/users
  describe('POST /api/phoenix/users', () => {
    it('should return 403 if not authenticated', async () => {
      const req = new NextRequest('http://localhost/api/phoenix/users', { method: 'POST', body: JSON.stringify({}) });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it('should return 403 if authenticated but not admin', async () => {
      mockGetAuthSession.mockResolvedValue({ user: { type: 'user' } });
      const req = new NextRequest('http://localhost/api/phoenix/users', { method: 'POST', body: JSON.stringify({}) });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it('should return 400 if missing fields', async () => {
      mockGetAuthSession.mockResolvedValue({ user: { type: 'admin' } });
      const req = new NextRequest('http://localhost/api/phoenix/users', { method: 'POST', body: JSON.stringify({ email: 'test@example.com' }) });
      const res = await POST(req);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'Missing required fields' });
    });

    it('should create a new user if authenticated as admin and valid data', async () => {
      mockGetAuthSession.mockResolvedValue({ user: { type: 'admin' } });
      const newUser = { email: 'new@example.com', name: 'New User', password: 'newpass', type: 'user' };
      const req = new NextRequest('http://localhost/api/phoenix/users', { method: 'POST', body: JSON.stringify(newUser) });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(newUser);
      expect(mockDb.insert).toHaveBeenCalledWith(user);
    });
  });

  // PUT /api/phoenix/users/[id]
  describe('PUT /api/phoenix/users/[id]', () => {
    it('should return 403 if not authenticated', async () => {
      const req = new NextRequest('http://localhost/api/phoenix/users/user1', { method: 'PUT', body: JSON.stringify({}) });
      const res = await PUT_ID(req, { params: Promise.resolve({ id: 'user1' }) });
      expect(res.status).toBe(403);
    });

    it('should return 403 if authenticated but not admin', async () => {
      mockGetAuthSession.mockResolvedValue({ user: { type: 'user' } });
      const req = new NextRequest('http://localhost/api/phoenix/users/user1', { method: 'PUT', body: JSON.stringify({}) });
      const res = await PUT_ID(req, { params: Promise.resolve({ id: 'user1' }) });
      expect(res.status).toBe(403);
    });

    it('should return 400 if missing type field', async () => {
      mockGetAuthSession.mockResolvedValue({ user: { type: 'admin' } });
      const req = new NextRequest('http://localhost/api/phoenix/users/user1', { method: 'PUT', body: JSON.stringify({}) });
      const res = await PUT_ID(req, { params: Promise.resolve({ id: 'user1' }) });
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'Missing required fields' });
    });

    it('should update user type if authenticated as admin and valid data', async () => {
      mockGetAuthSession.mockResolvedValue({ user: { type: 'admin' } });
      const req = new NextRequest('http://localhost/api/phoenix/users/user1', { method: 'PUT', body: JSON.stringify({ type: 'admin' }) });
      const res = await PUT_ID(req, { params: Promise.resolve({ id: 'user1' }) });
      expect(res.status).toBe(200);
      expect(mockDb.update).toHaveBeenCalledWith(user);
    });
  });

  // DELETE /api/phoenix/users/[id]
  describe('DELETE /api/phoenix/users/[id]', () => {
    it('should return 403 if not authenticated', async () => {
      const req = new NextRequest('http://localhost/api/phoenix/users/user1', { method: 'DELETE' });
      const res = await DELETE_ID(req, { params: Promise.resolve({ id: 'user1' }) });
      expect(res.status).toBe(403);
    });

    it('should return 403 if authenticated but not admin', async () => {
      mockGetAuthSession.mockResolvedValue({ user: { type: 'user' } });
      const req = new NextRequest('http://localhost/api/phoenix/users/user1', { method: 'DELETE' });
      const res = await DELETE_ID(req, { params: Promise.resolve({ id: 'user1' }) });
      expect(res.status).toBe(403);
    });

    it('should delete user if authenticated as admin', async () => {
      mockGetAuthSession.mockResolvedValue({ user: { type: 'admin' } });
      const req = new NextRequest('http://localhost/api/phoenix/users/user1', { method: 'DELETE' });
      const res = await DELETE_ID(req, { params: Promise.resolve({ id: 'user1' }) });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: true });
      expect(mockDb.delete).toHaveBeenCalledWith(user);
    });
  });
});
