"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, PlusCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import type { User } from "@/lib/db/schema";
import { toast } from "@/components/toast";
import { AddUserDialog } from "@/components/add-user-dialog";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

  const { data: session } = useSession();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!session || session.user?.type !== 'admin') {
        setError("Admin privileges required to access this page.");
        setLoading(false);
        return;
      }

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
  }, [session]);

  useEffect(() => {
    fetchUsers();
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