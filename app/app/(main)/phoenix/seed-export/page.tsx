"use client";

import { useEffect, useState } from "react";
import { useSession } from '@/components/fast-session-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/toast";

interface WorldMeta {
  id: string;
  name: string;
}

export default function SeedExportPage() {
  const { data: session, status } = useSession();
  const [isLocal, setIsLocal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [worlds, setWorlds] = useState<WorldMeta[]>([]);
  const [selectedWorld, setSelectedWorld] = useState<string>("");
  const [sourceDb, setSourceDb] = useState<string>("LOCAL");
  const [manualDbUrl, setManualDbUrl] = useState<string>("");
  const [includeBlobs, setIncludeBlobs] = useState<boolean>(false);
  const [seedName, setSeedName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [exportResult, setExportResult] = useState<string | null>(null);

  useEffect(() => {
    async function checkSessionAndEnv() {
      // CRITICAL FIX: Safe environment variable access with proper fallback
      const appStage = typeof window !== 'undefined' 
        ? (process.env.NEXT_PUBLIC_APP_STAGE || 'LOCAL') 
        : 'LOCAL';
      
      console.log('🌱 SEED EXPORT: Environment check:', { appStage, isClient: typeof window !== 'undefined' });
      setIsLocal(appStage === 'LOCAL');

      if (session?.user?.type === 'admin' && appStage === 'LOCAL') {
        // Fetch worlds from current LOCAL DB
        try {
          const response = await fetch("/api/phoenix/worlds"); // Assuming an API to list worlds
          if (response.ok) {
            const data = await response.json();
            setWorlds(data);
            if (data.length > 0) {
              setSelectedWorld(data[0].id);
              setSeedName(`seed-${data[0].name.toLowerCase().replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}`);
            }
          } else {
            toast({ type: "error", description: "Failed to fetch worlds." });
          }
        } catch (err) {
          toast({ type: "error", description: "Error fetching worlds." });
        }
      }
    }
    checkSessionAndEnv();
  }, [session]);

  const getSourceDbUrl = () => {
    switch (sourceDb) {
      case "LOCAL":
        return "postgresql://localuser:localpassword@localhost:5434/welcomecraft_local";
      case "BETA":
        return "postgresql://betatuser:betapassword@localhost:5435/welcomecraft_beta";
      case "PRODUCTION":
        return ""; // Production DB URL would be configured server-side
      case "MANUAL":
        return manualDbUrl;
      default:
        return "";
    }
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setExportResult(null);

    const dbUrl = getSourceDbUrl();
    if (!selectedWorld || !dbUrl || !seedName) {
      toast({ type: "error", description: "Please fill all required fields." });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/phoenix/seed/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          worldId: selectedWorld,
          sourceDbUrl: dbUrl,
          includeBlobs,
          seedName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start export");
      }

      const result = await response.json();
      setExportResult(`Export successful! Path: ${result.path}`);
      toast({ type: "success", description: "Seed export initiated successfully!" });
    } catch (error: any) {
      toast({ type: "error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // CRITICAL FIX: Safe environment variable access in logging
  const currentAppStage = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_APP_STAGE || 'LOCAL') 
    : 'LOCAL';
    
  console.log('🌱 SEED EXPORT: Final access check:', {
    session: !!session,
    userType: session?.user?.type,
    isAdmin: session?.user?.type === 'admin',
    isLocal,
    appStage: currentAppStage,
    condition1: !session,
    condition2: session?.user?.type !== 'admin',
    condition3: !isLocal,
    overallCondition: !session || session?.user?.type !== 'admin' || !isLocal
  });

  if (!session || session.user?.type !== 'admin' || !isLocal) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-red-500" />
              Access Denied
            </CardTitle>
            <CardDescription>
              This feature is only available for admins in the LOCAL environment.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Seed Export</h1>
      <Card>
        <CardHeader>
          <CardTitle>Export World Seed</CardTitle>
          <CardDescription>Select a world and a data source to export a seed for local development.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleExport} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="world-select">Select World</Label>
              <Select value={selectedWorld} onValueChange={setSelectedWorld}>
                <SelectTrigger id="world-select" data-testid="seed-export-world-select">
                  <SelectValue placeholder="Select a world" />
                </SelectTrigger>
                <SelectContent>
                  {worlds.map((world) => (
                    <SelectItem key={world.id} value={world.id}>
                      {world.name} ({world.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="source-db">Data Source</Label>
              <Select value={sourceDb} onValueChange={setSourceDb}>
                <SelectTrigger id="source-db" data-testid="seed-export-data-source">
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOCAL">Current (LOCAL)</SelectItem>
                  <SelectItem value="BETA">BETA</SelectItem>
                  <SelectItem value="PRODUCTION">PRODUCTION</SelectItem>
                  <SelectItem value="MANUAL">Specify Manually</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {sourceDb === "MANUAL" && (
              <div className="grid gap-2">
                <Label htmlFor="manual-db-url">Manual DB URL</Label>
                <Input
                  id="manual-db-url"
                  type="text"
                  value={manualDbUrl}
                  onChange={(e) => setManualDbUrl(e.target.value)}
                  placeholder="postgresql://user:password@host:port/database"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-blobs"
                data-testid="seed-export-include-blobs"
                checked={includeBlobs}
                onCheckedChange={(checked) => setIncludeBlobs(checked as boolean)}
              />
              <Label htmlFor="include-blobs">
                Include binary files (blobs)
              </Label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="seed-name">Directory Name</Label>
              <Input
                id="seed-name"
                data-testid="seed-export-directory-name"
                type="text"
                value={seedName}
                onChange={(e) => setSeedName(e.target.value)}
                placeholder="e.g., my-exported-seed"
              />
            </div>

            <Button type="submit" disabled={loading} data-testid="seed-export-start-button">
              {loading ? "Exporting..." : "Start Export"}
            </Button>

            {exportResult && (
              <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md">
                {exportResult}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
