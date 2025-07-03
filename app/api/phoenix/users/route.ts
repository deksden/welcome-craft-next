import { type NextRequest, NextResponse } from 'next/server.js';
import { getAuthSession } from '@/lib/test-auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { getWorldContextFromRequest, createWorldFilter, debugWorldContext } from '@/lib/db/world-context';

export async function GET(req: NextRequest) {
  const session = await getAuthSession();

  if (!session || session.user?.type !== 'admin') {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  // Get world context from request
  const worldContext = getWorldContextFromRequest(req);
  debugWorldContext(worldContext);

  // Apply world-based filtering
  const worldFilter = createWorldFilter(worldContext);
  console.log('🔍 User Management API - applying world filter:', worldFilter);

  let filteredUsers: any[];
  
  if (worldFilter.world_id === null) {
    // Production mode - show only production users (world_id IS NULL)
    filteredUsers = await db.select().from(user).where(isNull(user.world_id));
  } else if (worldFilter.world_id) {
    // Test mode - show only users from current world
    filteredUsers = await db.select().from(user).where(eq(user.world_id, worldFilter.world_id));
  } else {
    // Fallback - show all users
    filteredUsers = await db.select().from(user);
  }
  console.log('🔍 User Management API - found users:', {
    count: filteredUsers.length,
    worldId: worldContext.worldId,
    users: filteredUsers.map(u => ({ id: u.id, email: u.email, type: u.type, world_id: u.world_id }))
  });

  return NextResponse.json(filteredUsers);
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

  // Get world context to add world_id to new user
  const worldContext = getWorldContextFromRequest(req);
  const worldFilter = createWorldFilter(worldContext);

  console.log('🔍 User Management API - creating user with world_id:', worldFilter.world_id);

  // In a real application, you would hash the password before storing it.
  const newUser = await db.insert(user).values({ 
    email, 
    name, 
    password, 
    type,
    world_id: worldFilter.world_id 
  }).returning();

  return NextResponse.json(newUser[0]);
}
