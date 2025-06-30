import { type NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/test-auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';

export async function GET(req: NextRequest) {
  const session = await getAuthSession();

  if (!session || session.user?.type !== 'admin') {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  const allUsers = await db.select().from(user);
  return NextResponse.json(allUsers);
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();

  if (!session || session.user?.type !== 'admin') {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  const body = await req.json();
  const { email, name, password, type } = body;

  if (!email || !name || !password || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // In a real application, you would hash the password before storing it.
  const newUser = await db.insert(user).values({ email, name, password, type }).returning();

  return NextResponse.json(newUser[0]);
}
