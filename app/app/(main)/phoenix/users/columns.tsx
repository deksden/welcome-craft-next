
"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { User } from "@/lib/db/schema"
import { toast } from "@/components/toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { Label } from "@/components/ui/label"

interface UserActionsProps {
  user: User;
  onUserUpdated: () => void;
  onUserDeleted: () => void;
}

function UserActions({ user, onUserUpdated, onUserDeleted }: UserActionsProps) {
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.type);

  const handleChangeRole = async () => {
    try {
      const response = await fetch(`/api/phoenix/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: selectedRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change role");
      }

      toast({ type: "success", description: "User role updated successfully!" });
      onUserUpdated();
      setIsChangeRoleDialogOpen(false);
    } catch (error: any) {
      toast({ type: "error", description: error.message });
    }
  };

  const handleDeleteUser = async () => {
    try {
      const response = await fetch(`/api/phoenix/users/${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      toast({ type: "success", description: "User deleted successfully!" });
      onUserDeleted();
    } catch (error: any) {
      toast({ type: "error", description: error.message });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(user.id)}
        >
          Copy user ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setIsChangeRoleDialogOpen(true)}>
          Change Role
        </DropdownMenuItem>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              Delete User
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user
                account and remove their data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>

      <AlertDialog open={isChangeRoleDialogOpen} onOpenChange={setIsChangeRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              Select a new role for {user.name} ({user.email}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangeRole}>
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenu>
  );
}

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "type",
    header: "Role",
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const refreshData = () => {
        // This is a simplified way to trigger a refresh. In a real app,
        // you might pass a more direct refresh function from the parent.
        (table.options.meta as any)?.onUserAction();
      };
      return (
        <UserActions
          user={row.original}
          onUserUpdated={refreshData}
          onUserDeleted={refreshData}
        />
      )
    },
  },
]
