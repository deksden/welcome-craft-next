import { type NextRequest, NextResponse } from 'next/server.js';
import { getAuthSession } from '@/lib/test-auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getAuthSession();

  if (!session || session.user?.type !== 'admin') {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  const body = await req.json();
  const { type } = body;

  if (!type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const updatedUser = await db.update(user).set({ type }).where(eq(user.id, resolvedParams.id)).returning();

  return NextResponse.json(updatedUser[0]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getAuthSession();

  if (!session || session.user?.type !== 'admin') {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  await db.delete(user).where(eq(user.id, resolvedParams.id));

  return NextResponse.json({ success: true });
}
