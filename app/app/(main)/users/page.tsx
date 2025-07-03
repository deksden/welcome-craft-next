"use client";

/**
 * @file app/(main)/users/page.tsx
 * @description Phoenix User Management Page aligned with System Metrics design patterns
 * @version 2.1.0
 * @date 2025-07-02
 * @updated VISUAL ALIGNMENT: Карточки статистики приведены в соответствие с дизайном System Metrics для полной консистентности
 */

/** HISTORY:
 * v2.1.0 (2025-07-02): VISUAL ALIGNMENT - Карточки статистики приведены в соответствие с System Metrics: убраны градиенты, унифицированы размеры иконок, цвета, typography. Достигнута полная визуальная консистентность.
 * v2.0.0 (2025-07-02): PAGE HEADER UNIFICATION + ENHANCED DESIGN - Добавлен PageHeader компонент, статистические карточки, градиенты, badges, иконки, значительно улучшен дизайн и UX
 * v1.0.0 (2025-06-30): Initial user management page
 */

// Force dynamic rendering for authentication-dependent page
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/components/fast-session-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, PlusCircle, RefreshCw, Users, Shield, Globe, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import type { User } from "@/lib/db/schema";
import { toast } from "@/components/toast";
import { AddUserDialog } from "@/components/add-user-dialog";
import { PageHeader, PageHeaderPresets } from '@/components/page-header';

export default function UsersPage() {
  console.log('🚨🚨🚨 PHOENIX USERS PAGE: COMPONENT FUNCTION CALLED - REACT COMPONENT IS RENDERING!')
  console.log('🚨🚨🚨 PHOENIX USERS PAGE: This log confirms the React component is being executed!')
  console.log('🚨🚨🚨 PHOENIX USERS PAGE: If you see this in browser logs, the routing works!');
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: session, status } = useSession();
  
  console.log('🔥 PHOENIX USERS PAGE: Component render with session:', { 
    hasSession: !!session, 
    sessionEmail: session?.user?.email,
    sessionType: session?.user?.type,
    status 
  });

  const fetchUsers = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
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
        if (isManualRefresh) {
          setIsRefreshing(false);
        } else {
          setLoading(true);
        }
        return;
      }
      
      // CRITICAL FIX: Additional wait for session data to be fully populated
      if (status === 'authenticated' && session && !session.user) {
        console.log('⏳ Phoenix Users Page: Session authenticated but user data not yet populated, waiting...');
        if (isManualRefresh) {
          setIsRefreshing(false);
        } else {
          setLoading(true);
        }
        return;
      }
      
      // CRITICAL FIX: Final admin check with detailed logging
      if (session.user?.type !== 'admin') {
        console.log('❌ Phoenix Users Page: Admin privileges check failed');
        console.log('❌ Phoenix Users Page: Session user:', session.user);
        console.log('❌ Phoenix Users Page: User type received:', session.user?.type);
        console.log('❌ Phoenix Users Page: Type comparison result:', String(session.user?.type) === 'admin');
        setError("Admin privileges required to access this page.");
        if (isManualRefresh) {
          setIsRefreshing(false);
        } else {
          setLoading(false);
        }
        return;
      }
      
      console.log('✅ Phoenix Users Page: Admin check passed, proceeding with API call');

      const response = await fetch("/api/phoenix/users");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUsers(data);
      
      if (isManualRefresh) {
        toast({ type: "success", description: "User list refreshed successfully!" });
      }
    } catch (err: any) {
      setError(err.message);
      toast({ type: "error", description: err.message });
    } finally {
      if (isManualRefresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
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
  }, [fetchUsers, session, status]);

  const handleManualRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    fetchUsers(true);
  };

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

  // Calculate statistics
  const totalUsers = users.length
  const adminUsers = users.filter(user => user.type === 'admin').length
  const regularUsers = users.filter(user => user.type === 'user').length
  const activeUsers = users.filter(user => user.createdAt && new Date(user.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 lg:px-8 space-y-6">
      <PageHeader
        icon={<Users className="size-8 text-purple-600" />}
        title="User Management"
        description="Управление пользователями системы, их ролями и правами доступа. Просмотр статистики активности и администрирование учетных записей."
        badges={[
          ...PageHeaderPresets.admin.badges
        ]}
        meta="Phoenix System: администрирование пользователей и контроль доступа"
        actions={
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleManualRefresh} 
              disabled={isRefreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`mr-2 size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button onClick={() => setIsAddUserDialogOpen(true)}>
              <PlusCircle className="mr-2 size-4" /> Add User
            </Button>
          </div>
        }
      />

      {/* Statistics Cards - Aligned with System Metrics Design */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{totalUsers.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="size-3 mr-1" />
                  +{totalUsers > 0 ? '100' : '0'}% в этом мире
                </p>
              </div>
              <Users className="size-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admin Users</p>
                <p className="text-2xl font-bold">{adminUsers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {adminUsers > 0 ? `${Math.round((adminUsers / totalUsers) * 100)}%` : '0%'} от общего числа
                </p>
              </div>
              <Shield className="size-4 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Regular Users</p>
                <p className="text-2xl font-bold">{regularUsers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {regularUsers > 0 ? `${Math.round((regularUsers / totalUsers) * 100)}%` : '0%'} активных ролей
                </p>
              </div>
              <Globe className="size-4 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users (30d)</p>
                <p className="text-2xl font-bold">{activeUsers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalUsers > 0 ? `${Math.round((activeUsers / totalUsers) * 100)}%` : '0%'} активность
                </p>
              </div>
              <TrendingUp className="size-4 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Manage users and their roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={users} 
            meta={{ 
              onUserAction: () => fetchUsers(true) 
            }}
          />
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