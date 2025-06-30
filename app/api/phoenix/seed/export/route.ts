import { type NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/test-auth';
import { PhoenixSeedManager } from '@/lib/phoenix/seed-manager';

export async function POST(req: NextRequest) {
  const session = await getAuthSession();

  if (process.env.APP_STAGE !== 'LOCAL') {
    return NextResponse.json({ error: 'This feature is only available in the LOCAL environment.' }, { status: 403 });
  }

  if (!session || session.user?.type !== 'admin') {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  const body = await req.json();
  const { worldId, sourceDbUrl, includeBlobs, seedName } = body;

  if (!worldId || !sourceDbUrl || !seedName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const seedManager = new PhoenixSeedManager(sourceDbUrl);
    const exportPath = await seedManager.exportWorld(worldId, seedName, includeBlobs);
    return NextResponse.json({ success: true, path: exportPath });
  } catch (error) {
    console.error('Seed export failed:', error);
    return NextResponse.json({ error: 'Seed export failed.' }, { status: 500 });
  }
}
