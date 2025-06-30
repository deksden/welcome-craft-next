/**
 * @file components/phoenix/world-management-panel.tsx
 * @description PHOENIX PROJECT - World Management Panel для управления динамическими мирами
 * @version 1.0.0
 * @date 2025-06-29
 * @updated PHOENIX PROJECT Step 4 - Dynamic World Management UI
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  Globe, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  FileText,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import type { WorldMeta } from '@/lib/db/schema'

interface WorldFormData {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  environment: string
  autoCleanup: boolean
  cleanupAfterHours: number
}

/**
 * World Management Panel - главный компонент для управления мирами
 * 
 * Функциональность:
 * - Список всех миров с фильтрацией и поиском
 * - Создание новых миров через modal dialog
 * - Редактирование существующих миров
 * - Активация/деактивация миров
 * - Статистика использования
 * - Bulk operations (массовые операции)
 * 
 * @feature PHOENIX PROJECT Step 4 - Dynamic World Management
 * @feature Real-time updates и статистика
 * @feature Environment-aware filtering
 */
export function WorldManagementPanel() {
  const [worlds, setWorlds] = useState<WorldMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [environmentFilter, setEnvironmentFilter] = useState('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedWorld, setSelectedWorld] = useState<WorldMeta | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  /**
   * Загрузка списка миров с фильтрацией
   */
  const loadWorlds = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (environmentFilter !== 'all') {
        params.append('environment', environmentFilter)
      }
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter)
      }
      
      const response = await fetch(`/api/phoenix/worlds?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setWorlds(data.data)
      } else {
        toast.error(`Failed to load worlds: ${data.error}`)
      }
    } catch (error) {
      toast.error('Error loading worlds')
      console.error('Error loading worlds:', error)
    } finally {
      setLoading(false)
    }
  }, [environmentFilter, categoryFilter])

  // Загрузка миров при инициализации
  useEffect(() => {
    loadWorlds()
  }, [loadWorlds])

  /**
   * Фильтрация миров по поисковому запросу
   */
  const filteredWorlds = worlds.filter(world => {
    const matchesSearch = world.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         world.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         world.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  /**
   * Создание нового мира
   */
  const handleCreateWorld = async (formData: WorldFormData) => {
    try {
      const worldData = {
        id: formData.id,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        environment: formData.environment,
        autoCleanup: formData.autoCleanup,
        cleanupAfterHours: formData.cleanupAfterHours,
        tags: formData.tags,
        users: [],
        artifacts: [],
        chats: [],
        settings: {
          autoCleanup: formData.autoCleanup,
          cleanupAfterHours: formData.cleanupAfterHours
        }
      }

      const response = await fetch('/api/phoenix/worlds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(worldData)
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(`World '${data.data.name}' created successfully`)
        setShowCreateDialog(false)
        loadWorlds()
      } else {
        toast.error(`Failed to create world: ${data.error}`)
      }
    } catch (error) {
      toast.error('Error creating world')
      console.error('Error creating world:', error)
    }
  }

  /**
   * Переключение активности мира
   */
  const toggleWorldActive = async (world: WorldMeta) => {
    try {
      const response = await fetch(`/api/phoenix/worlds/${world.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !world.isActive })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(`World '${world.name}' ${world.isActive ? 'deactivated' : 'activated'}`)
        loadWorlds()
      } else {
        toast.error(`Failed to update world: ${data.error}`)
      }
    } catch (error) {
      toast.error('Error updating world')
      console.error('Error updating world:', error)
    }
  }

  /**
   * Удаление мира
   */
  const deleteWorld = async (world: WorldMeta) => {
    if (!confirm(`Are you sure you want to delete world '${world.name}'? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/phoenix/worlds/${world.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(`World '${world.name}' deleted successfully`)
        loadWorlds()
      } else {
        toast.error(`Failed to delete world: ${data.error}`)
      }
    } catch (error) {
      toast.error('Error deleting world')
      console.error('Error deleting world:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="size-6 animate-spin" />
              <span className="ml-2">Loading worlds...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header с фильтрами */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-5" />
            World Management
          </CardTitle>
          <CardDescription>
            Create, manage and monitor dynamic test worlds across environments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Worlds</Label>
              <Input
                id="search"
                placeholder="Search by name, ID, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="LOCAL">LOCAL</SelectItem>
                  <SelectItem value="BETA">BETA</SelectItem>
                  <SelectItem value="PROD">PROD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="UC">Use Cases</SelectItem>
                  <SelectItem value="REGRESSION">Regression</SelectItem>
                  <SelectItem value="PERFORMANCE">Performance</SelectItem>
                  <SelectItem value="DEMO">Demo</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={loadWorlds} variant="outline" size="sm">
                <RefreshCw className="size-4" />
              </Button>
              
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="size-4 mr-2" />
                    Create World
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <CreateWorldDialog onSubmit={handleCreateWorld} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Worlds</p>
                <p className="text-2xl font-bold">{worlds.length}</p>
              </div>
              <Globe className="size-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Worlds</p>
                <p className="text-2xl font-bold">{worlds.filter(w => w.isActive).length}</p>
              </div>
              <Play className="size-4 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Templates</p>
                <p className="text-2xl font-bold">{worlds.filter(w => w.isTemplate).length}</p>
              </div>
              <FileText className="size-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold">{worlds.reduce((sum, w) => sum + w.usageCount, 0)}</p>
              </div>
              <BarChart3 className="size-4 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Таблица миров */}
      <Card>
        <CardHeader>
          <CardTitle>Worlds ({filteredWorlds.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>World</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorlds.map((world) => (
                  <TableRow key={world.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{world.name}</div>
                        <div className="text-sm text-muted-foreground">{world.id}</div>
                        <div className="text-xs text-muted-foreground">{world.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{world.environment}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{world.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{world.usageCount} times</div>
                        {world.lastUsedAt && (
                          <div className="text-xs text-muted-foreground">
                            Last: {new Date(world.lastUsedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {world.isActive ? (
                          <Badge variant="default" className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {world.isTemplate && (
                          <Badge variant="outline">Template</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleWorldActive(world)}
                        >
                          {world.isActive ? (
                            <Pause className="size-4" />
                          ) : (
                            <Play className="size-4" />
                          )}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedWorld(world)
                            setShowEditDialog(true)
                          }}
                        >
                          <Edit className="size-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteWorld(world)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredWorlds.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No worlds found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Dialog для создания нового мира
 */
function CreateWorldDialog({ onSubmit }: { onSubmit: (data: WorldFormData) => void }) {
  const [formData, setFormData] = useState<WorldFormData>({
    id: '',
    name: '',
    description: '',
    category: 'GENERAL',
    tags: [],
    environment: 'LOCAL',
    autoCleanup: true,
    cleanupAfterHours: 24
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.id || !formData.name || !formData.description) {
      toast.error('Please fill in all required fields')
      return
    }

    onSubmit(formData)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create New World</DialogTitle>
        <DialogDescription>
          Create a new dynamic test world for your environment
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="id">World ID *</Label>
            <Input
              id="id"
              placeholder="WORLD_ID"
              value={formData.id}
              onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value.toUpperCase() }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="environment">Environment</Label>
            <Select value={formData.environment} onValueChange={(value) => setFormData(prev => ({ ...prev, environment: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOCAL">LOCAL</SelectItem>
                <SelectItem value="BETA">BETA</SelectItem>
                <SelectItem value="PROD">PROD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">World Name *</Label>
          <Input
            id="name"
            placeholder="My Test World"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            placeholder="Describe the purpose of this world..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GENERAL">General</SelectItem>
              <SelectItem value="UC">Use Cases</SelectItem>
              <SelectItem value="REGRESSION">Regression</SelectItem>
              <SelectItem value="PERFORMANCE">Performance</SelectItem>
              <SelectItem value="DEMO">Demo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button type="submit">Create World</Button>
        </DialogFooter>
      </form>
    </>
  )
}

// END OF: components/phoenix/world-management-panel.tsx