import { getAuthSession } from '@/lib/test-auth';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default async function SeedImportPage() {
  const session = await getAuthSession();

  if (!session || session.user?.type !== 'admin') {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-red-500" />
              Access Denied
            </CardTitle>
            <CardDescription>
              Admin privileges required to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Seed Import</h1>
      {/* Seed import UI will be implemented here */}
    </div>
  );
}