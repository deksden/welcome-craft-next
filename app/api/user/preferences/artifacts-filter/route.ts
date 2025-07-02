/**
 * @file app/api/user/preferences/artifacts-filter/route.ts
 * @description API endpoint for managing user's artifact filter preference
 * @version 1.0.0
 * @date 2025-07-02
 * @updated Created collaborative artifacts system with user filter preference
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/test-auth';
import { getUserArtifactFilterPreference, updateUserArtifactFilterPreference, resolveUserIdFromSession } from '@/lib/db/queries';

/**
 * GET: Get user's artifact filter preference
 */
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🚀 COLLABORATIVE SYSTEM: Resolve real user ID
    const realUserId = await resolveUserIdFromSession(session.user.id, session.user.email || undefined);
    const showOnlyMyArtifacts = await getUserArtifactFilterPreference(realUserId);
    
    return NextResponse.json({ 
      showOnlyMyArtifacts,
      success: true 
    });
  } catch (error) {
    console.error('Failed to get artifact filter preference:', error);
    return NextResponse.json(
      { error: 'Failed to get filter preference' },
      { status: 500 }
    );
  }
}

/**
 * POST: Update user's artifact filter preference
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { showOnlyMyArtifacts } = await request.json();
    
    if (typeof showOnlyMyArtifacts !== 'boolean') {
      return NextResponse.json(
        { error: 'showOnlyMyArtifacts must be a boolean' },
        { status: 400 }
      );
    }

    // 🚀 COLLABORATIVE SYSTEM: Resolve real user ID
    const realUserId = await resolveUserIdFromSession(session.user.id, session.user.email || undefined);
    await updateUserArtifactFilterPreference({
      userIdOrEmail: realUserId,
      showOnlyMyArtifacts
    });
    
    return NextResponse.json({ 
      showOnlyMyArtifacts,
      success: true 
    });
  } catch (error) {
    console.error('Failed to update artifact filter preference:', error);
    return NextResponse.json(
      { error: 'Failed to update filter preference' },
      { status: 500 }
    );
  }
}

// END OF: app/api/user/preferences/artifacts-filter/route.ts