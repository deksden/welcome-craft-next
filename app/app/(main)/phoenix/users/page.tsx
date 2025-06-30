/**
 * @file app/app/(main)/phoenix/users/page.tsx
 * @description PHOENIX PROJECT - User Management Page
 * @version 1.0.0
 * @date 2025-06-30
 * @updated Enterprise Admin Interface - Полный CRUD для управления пользователями
 */

/** HISTORY:
 * v1.0.0 (2025-06-30): Enterprise Admin Interface - создана страница user management
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem, 
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Users,
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  Loader2,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  name: string
  email: string
  type: 'user' | 'admin'
  createdAt: string
  updatedAt: string
}

interface UserFormData {
  name: string
  email: string
  password: string
  type: 'user' | 'admin'
}

/**
 * Phoenix User Management Page
 * 
 * Полноценная страница для управления пользователями:
 * - Только для админов в любом окружении
 * - DataTable с CRUD операциями
 * - Диалоги создания/редактирования
 * - AlertDialog для подтверждения удаления
 * 
 * @feature Enterprise Admin Interface - User management
 * @feature Security - admin only access
 * @feature Full CRUD operations
 */
export default function UserManagementPage() {
  const { toast } = useToast()

  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Dialogs state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  
  // Form state
  const [createForm, setCreateForm] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    type: 'user'
  })
  const [editForm, setEditForm] = useState<Partial<UserFormData>>({
    name: '',
    type: 'user'
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/phoenix/users')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      if (data.success) {
        setUsers(data.users || [])
      } else {
        throw new Error(data.error || 'Failed to load users')
      }
    } catch (error) {
      console.error('Error loading users:', error)
      toast({
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : "Не удалось загрузить пользователей",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast({
        title: "Заполните все поля",
        description: "Имя, email и пароль обязательны",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch('/api/phoenix/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Пользователь создан",
          description: `${data.user.name} успешно добавлен`,
        })
        
        setShowCreateDialog(false)
        setCreateForm({ name: '', email: '', password: '', type: 'user' })
        await loadUsers()
      } else {
        throw new Error(data.error || 'Creation failed')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast({
        title: "Ошибка создания",
        description: error instanceof Error ? error.message : "Не удалось создать пользователя",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditUser = async () => {
    if (!editingUser) return

    setIsUpdating(true)

    try {
      const response = await fetch(`/api/phoenix/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Пользователь обновлен",
          description: `${data.user.name} успешно изменен`,
        })
        
        setShowEditDialog(false)
        setEditingUser(null)
        setEditForm({ name: '', type: 'user' })
        await loadUsers()
      } else {
        throw new Error(data.error || 'Update failed')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: "Ошибка обновления",
        description: error instanceof Error ? error.message : "Не удалось обновить пользователя",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteUser = async (user: User) => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/phoenix/users/${user.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Пользователь удален",
          description: `${user.name} успешно удален`,
        })
        
        await loadUsers()
      } else {
        throw new Error(data.error || 'Deletion failed')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        title: "Ошибка удаления",
        description: error instanceof Error ? error.message : "Не удалось удалить пользователя",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setEditForm({
      name: user.name,
      type: user.type
    })
    setShowEditDialog(true)
  }

  const getUserTypeIcon = (type: string) => {
    return type === 'admin' ? (
      <ShieldCheck className="size-4 text-orange-500" />
    ) : (
      <Shield className="size-4 text-gray-500" />
    )
  }

  const getUserTypeBadge = (type: string) => {
    return type === 'admin' ? (
      <Badge variant="default">Admin</Badge>
    ) : (
      <Badge variant="secondary">User</Badge>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Users className="size-8 text-orange-500" />
            <h1 className="text-3xl font-bold">User Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage system users and permissions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadUsers} disabled={isLoading}>
            <RefreshCw className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system with specified role
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Name</Label>
                  <Input
                    id="create-name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-email">Email</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-password">Password</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Secure password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-type">Role</Label>
                  <Select value={createForm.type} onValueChange={(value: 'user' | 'admin') => 
                    setCreateForm(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger id="create-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateUser} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button asChild variant="outline">
            <Link href="/phoenix">
              <ArrowLeft className="size-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage all system users and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin mr-2" />
              <span>Loading users...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getUserTypeIcon(user.type)}
                        {user.name}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getUserTypeBadge(user.type)}</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                onSelect={(e) => e.preventDefault()}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete <strong>{user.name}</strong>? 
                                  This action cannot be undone and will remove all user data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user)}
                                  disabled={isDeleting}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {isDeleting ? (
                                    <>
                                      <Loader2 className="size-4 mr-2 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    'Delete'
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!isLoading && users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found. Create the first user to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role
            </DialogDescription>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  value={editingUser.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-type">Role</Label>
                <Select 
                  value={editForm.type} 
                  onValueChange={(value: 'user' | 'admin') => 
                    setEditForm(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// END OF: app/app/(main)/phoenix/users/page.tsx