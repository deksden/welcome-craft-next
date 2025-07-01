"use client";

// Force dynamic rendering for authentication-dependent page
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/components/fast-session-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, PlusCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import type { User } from "@/lib/db/schema";
import { toast } from "@/components/toast";
import { AddUserDialog } from "@/components/add-user-dialog";

export default function UsersPage() {
  console.log('🚨🚨🚨 PHOENIX USERS PAGE: COMPONENT FUNCTION CALLED - REACT COMPONENT IS RENDERING!')
  console.log('🚨🚨🚨 PHOENIX USERS PAGE: This log confirms the React component is being executed!')
  console.log('🚨🚨🚨 PHOENIX USERS PAGE: If you see this in browser logs, the routing works!');
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

  const { data: session, status } = useSession();
  
  console.log('🔥 PHOENIX USERS PAGE: Component render with session:', { 
    hasSession: !!session, 
    sessionEmail: session?.user?.email,
    sessionType: session?.user?.type,
    status 
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Phoenix Users Page: Session data:', session);
      console.log('🔍 Phoenix Users Page: Session status:', status);
      console.log('🔍 Phoenix Users Page: Session status is loading:', status === 'loading');
      console.log('🔍 Phoenix Users Page: Session status is authenticated:', status === 'authenticated');
      console.log('🔍 Phoenix Users Page: User exists:', !!session?.user);
      console.log('🔍 Phoenix Users Page: User type:', session?.user?.type);
      console.log('🔍 Phoenix Users Page: Admin check result:', session?.user?.type === 'admin');
      console.log('🔍 Phoenix Users Page: Full session object:', JSON.stringify(session, null, 2));
      
      // CRITICAL FIX: Wait for session to be fully loaded AND authenticated
      if (status === 'loading' || !session) {
        console.log('⏳ Phoenix Users Page: Session not ready, waiting...', { status, hasSession: !!session });
        setLoading(true);
        return;
      }
      
      // CRITICAL FIX: Additional wait for session data to be fully populated
      if (status === 'authenticated' && session && !session.user) {
        console.log('⏳ Phoenix Users Page: Session authenticated but user data not yet populated, waiting...');
        setLoading(true);
        return;
      }
      
      // CRITICAL FIX: Final admin check with detailed logging
      if (session.user?.type !== 'admin') {
        console.log('❌ Phoenix Users Page: Admin privileges check failed');
        console.log('❌ Phoenix Users Page: Session user:', session.user);
        console.log('❌ Phoenix Users Page: User type received:', session.user?.type);
        console.log('❌ Phoenix Users Page: Type comparison result:', String(session.user?.type) === 'admin');
        setError("Admin privileges required to access this page.");
        setLoading(false);
        return;
      }
      
      console.log('✅ Phoenix Users Page: Admin check passed, proceeding with API call');

      const response = await fetch("/api/phoenix/users");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
      toast({ type: "error", description: err.message });
    } finally {
      setLoading(false);
    }
  }, [session, status]);

  useEffect(() => {
    console.log('🎯 PHOENIX USERS PAGE: useEffect triggered');
    console.log('🎯 PHOENIX USERS PAGE: Session dependency changed:', { session, status });
    
    // CRITICAL FIX: Delay to allow session bridge to fully initialize
    const delayedFetchUsers = setTimeout(() => {
      console.log('🎯 PHOENIX USERS PAGE: Delayed fetchUsers execution');
      fetchUsers();
    }, 100); // Small delay to allow session bridge
    
    return () => clearTimeout(delayedFetchUsers);
  }, [fetchUsers]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading Users...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please wait while we fetch user data.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-red-500" />
              Error
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button onClick={() => setIsAddUserDialogOpen(true)}>
          <PlusCircle className="mr-2 size-4" /> Add User
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Manage users and their roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={users} />
        </CardContent>
      </Card>
      <AddUserDialog
        isOpen={isAddUserDialogOpen}
        onClose={() => setIsAddUserDialogOpen(false)}
        onUserAdded={fetchUsers}
      />
    </div>
  );
}