/**
 * @file components/phoenix/seed-import-tab.tsx
 * @description PHOENIX PROJECT - Seed Import Tab для WorldManagementPanel
 * @version 1.0.0
 * @date 2025-06-30
 * @updated Phase 3: Создан GUI для импорта seed данных с conflict resolution
 */

/** HISTORY:
 * v1.0.0 (2025-06-30): Создан SeedImportTab для Phoenix Admin Dashboard GUI integration
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  Select,
  SelectContent,
  SelectItem, 
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Download,
  Upload,
  FileCheck,
  FileX,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Users,
  MessageSquare,
  Image,
  RefreshCw,
  Info,
  Settings
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SeedInfo {
  name: string
  worldId: string
  environment: 'LOCAL' | 'BETA' | 'PROD'
  createdAt: string
  users: number
  artifacts: number
  chats: number
  blobs: number
  isValid: boolean
  description?: string
}

interface ConflictInfo {
  worldExists: boolean
  conflictingUsers: string[]
  conflictingArtifacts: string[]
  conflictingChats: string[]
  orphanedBlobs: string[]
  missingBlobs: string[]
}

type ConflictResolution = 'replace' | 'merge' | 'skip'
type ExtendedResolution = ConflictResolution | 'overwrite' | 'rename'

interface ConflictStrategy {
  world: ConflictResolution
  users: ExtendedResolution
  artifacts: ExtendedResolution
  chats: ExtendedResolution
  blobs: ExtendedResolution
}

interface ImportProgress {
  phase: 'analyzing' | 'importing' | 'complete' | 'error'
  progress: number
  message: string
  details?: string
}

/**
 * Phoenix Seed Import Tab
 * 
 * GUI компонент для импорта seed данных в WorldManagementPanel:
 * - Браузинг и выбор seed директорий
 * - Валидация seed структуры
 * - Conflict analysis и resolution UI
 * - Прогресс импорта с детальной информацией
 * - Интеграция с PhoenixSeedManager
 * 
 * @feature PHOENIX PROJECT - Seed Import GUI
 * @feature Conflict resolution dialogs
 * @feature Import progress tracking
 * @feature Seed validation UI
 */
export function SeedImportTab() {
  const [availableSeeds, setAvailableSeeds] = useState<SeedInfo[]>([])
  const [selectedSeed, setSelectedSeed] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [conflicts, setConflicts] = useState<ConflictInfo | null>(null)
  const [showConflictDialog, setShowConflictDialog] = useState(false)
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>({
    world: 'merge',
    users: 'merge',
    artifacts: 'merge', 
    chats: 'merge',
    blobs: 'merge'
  })
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  
  const { toast } = useToast()

  const loadAvailableSeeds = useCallback(async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/phoenix/seed/list')
      if (!response.ok) {
        throw new Error('Failed to load seeds')
      }
      
      const data = await response.json()
      if (data.success) {
        setAvailableSeeds(data.seeds || [])
      } else {
        throw new Error(data.error || 'Failed to load seeds')
      }
    } catch (error) {
      console.error('Error loading seeds:', error)
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить список seed данных",
        variant: "destructive"
      })
      setAvailableSeeds([])
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadAvailableSeeds()
  }, [loadAvailableSeeds])

  const handleAnalyzeConflicts = async () => {
    if (!selectedSeed) {
      toast({
        title: "Выберите seed",
        description: "Сначала выберите seed для анализа",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/phoenix/seed/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedPath: `./seeds/${selectedSeed}` })
      })
      
      if (!response.ok) {
        throw new Error('Failed to analyze conflicts')
      }
      
      const data = await response.json()
      if (data.success) {
        setConflicts(data.conflicts)
        setShowConflictDialog(true)
      } else {
        throw new Error(data.error || 'Failed to analyze conflicts')
      }
    } catch (error) {
      console.error('Error analyzing conflicts:', error)
      toast({
        title: "Ошибка анализа",
        description: "Не удалось проанализировать конфликты",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportSeed = async () => {
    if (!selectedSeed || !conflicts) {
      return
    }

    setShowConflictDialog(false)
    setShowProgressDialog(true)
    setImportProgress({
      phase: 'analyzing',
      progress: 10,
      message: 'Подготовка к импорту...',
      details: 'Анализ seed данных и настройка окружения'
    })

    try {
      // Симуляция прогресса для лучшего UX
      setTimeout(() => {
        setImportProgress({
          phase: 'importing',
          progress: 50,
          message: 'Импорт данных...',
          details: 'Применение conflict resolution стратегии'
        })
      }, 1000)

      const response = await fetch('/api/phoenix/seed/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          seedPath: `./seeds/${selectedSeed}`,
          strategy: conflictStrategy
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to import seed')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setImportProgress({
          phase: 'complete',
          progress: 100,
          message: 'Импорт завершен успешно!',
          details: 'Все данные импортированы согласно выбранной стратегии'
        })
        
        toast({
          title: "Импорт завершен",
          description: `Seed "${selectedSeed}" успешно импортирован`,
        })
        
        // Закрываем диалог через несколько секунд
        setTimeout(() => {
          setShowProgressDialog(false)
          setImportProgress(null)
          setConflicts(null)
          setSelectedSeed('')
        }, 3000)
        
      } else {
        throw new Error(data.error || 'Import failed')
      }
    } catch (error) {
      console.error('Error importing seed:', error)
      setImportProgress({
        phase: 'error',
        progress: 0,
        message: 'Ошибка импорта',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      })
      
      toast({
        title: "Ошибка импорта",
        description: "Не удалось импортировать seed данные",
        variant: "destructive"
      })
    }
  }

  const handleValidateSeed = async (seedName: string) => {
    try {
      const response = await fetch('/api/phoenix/seed/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedPath: `./seeds/${seedName}` })
      })
      
      if (!response.ok) {
        throw new Error('Failed to validate seed')
      }
      
      const data = await response.json()
      
      if (data.success && data.isValid) {
        toast({
          title: "Валидация успешна",
          description: `Seed "${seedName}" имеет корректную структуру`,
        })
      } else {
        toast({
          title: "Ошибка валидации",
          description: `Seed "${seedName}" имеет некорректную структуру`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error validating seed:', error)
      toast({
        title: "Ошибка валидации",
        description: "Не удалось выполнить валидацию",
        variant: "destructive"
      })
    }
  }

  const getConflictBadgeVariant = (conflictCount: number) => {
    if (conflictCount === 0) return 'secondary'
    if (conflictCount <= 3) return 'default'
    return 'destructive'
  }

  const getEnvironmentBadgeVariant = (env: string) => {
    switch (env) {
      case 'LOCAL': return 'secondary'
      case 'BETA': return 'default'
      case 'PROD': return 'destructive'
      default: return 'outline'
    }
  }

  const selectedSeedInfo = availableSeeds.find(s => s.name === selectedSeed)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Seed Data Import</h3>
          <p className="text-sm text-muted-foreground">
            Импорт seed данных с разрешением конфликтов
          </p>
        </div>
        <Button 
          onClick={loadAvailableSeeds} 
          variant="outline" 
          size="sm"
          disabled={isLoading}
        >
          <RefreshCw className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {/* Available Seeds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-5" />
            Доступные Seed Данные
            <Badge variant="secondary">{availableSeeds.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full size-6 border-b-2 border-gray-900 mr-2" />
              <span className="text-sm text-muted-foreground">Загрузка seeds...</span>
            </div>
          ) : availableSeeds.length === 0 ? (
            <Alert>
              <Info className="size-4" />
              <AlertDescription>
                Нет доступных seed данных. Создайте seeds через CLI или экспортируйте существующие миры.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {availableSeeds.map((seed) => (
                <div 
                  key={seed.name}
                  role="button"
                  tabIndex={0}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedSeed === seed.name ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedSeed(seed.name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedSeed(seed.name)
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {seed.isValid ? (
                          <CheckCircle className="size-4 text-green-500" />
                        ) : (
                          <FileX className="size-4 text-red-500" />
                        )}
                        <span className="font-medium">{seed.name}</span>
                      </div>
                      <Badge variant={getEnvironmentBadgeVariant(seed.environment)}>
                        {seed.environment}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleValidateSeed(seed.name)
                        }}
                      >
                        <FileCheck className="size-3 mr-1" />
                        Проверить
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>World: {seed.worldId}</span>
                      <span className="flex items-center gap-1">
                        <Users className="size-3" />
                        {seed.users}
                      </span>
                      <span className="flex items-center gap-1">
                        <Database className="size-3" />
                        {seed.artifacts}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="size-3" />
                        {seed.chats}
                      </span>
                      <span className="flex items-center gap-1">
                        <Image className="size-3" aria-label="Blob files count" />
                        {seed.blobs}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <Clock className="size-3" />
                      <span>{new Date(seed.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Seed Actions */}
      {selectedSeedInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-5" />
              Импорт: {selectedSeedInfo.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm">
                <div><strong>World ID:</strong> {selectedSeedInfo.worldId}</div>
                <div><strong>Environment:</strong> {selectedSeedInfo.environment}</div>
                <div><strong>Created:</strong> {new Date(selectedSeedInfo.createdAt).toLocaleString()}</div>
                {selectedSeedInfo.description && (
                  <div className="mt-2"><strong>Description:</strong> {selectedSeedInfo.description}</div>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button
                onClick={handleAnalyzeConflicts}
                disabled={isLoading || !selectedSeedInfo.isValid}
                className="flex-1"
              >
                <Settings className="size-4 mr-2" />
                Анализ и Импорт
              </Button>
              <Button
                onClick={() => handleValidateSeed(selectedSeedInfo.name)}
                variant="outline"
              >
                <FileCheck className="size-4 mr-2" />
                Проверить
              </Button>
            </div>

            {!selectedSeedInfo.isValid && (
              <Alert>
                <AlertTriangle className="size-4" />
                <AlertDescription>
                  Seed имеет некорректную структуру и не может быть импортирован
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Conflict Resolution Dialog */}
      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Разрешение Конфликтов</DialogTitle>
            <DialogDescription>
              Обнаружены конфликты при импорте. Выберите стратегию разрешения.
            </DialogDescription>
          </DialogHeader>

          {conflicts && (
            <div className="space-y-4">
              {/* Conflict Summary */}
              <div className="bg-yellow-50 p-3 rounded-lg">
                <h4 className="font-medium mb-2">Обнаруженные конфликты:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>World существует:</span>
                    <Badge variant={conflicts.worldExists ? 'destructive' : 'secondary'}>
                      {conflicts.worldExists ? 'Да' : 'Нет'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Конфликты пользователей:</span>
                    <Badge variant={getConflictBadgeVariant(conflicts.conflictingUsers.length)}>
                      {conflicts.conflictingUsers.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Конфликты артефактов:</span>
                    <Badge variant={getConflictBadgeVariant(conflicts.conflictingArtifacts.length)}>
                      {conflicts.conflictingArtifacts.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Отсутствующие blob:</span>
                    <Badge variant={getConflictBadgeVariant(conflicts.missingBlobs.length)}>
                      {conflicts.missingBlobs.length}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Strategy Selection */}
              <div className="space-y-3">
                <h4 className="font-medium">Стратегии разрешения:</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>World конфликт:</Label>
                    <Select 
                      value={conflictStrategy.world} 
                      onValueChange={(value: ConflictResolution) => 
                        setConflictStrategy(prev => ({ ...prev, world: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="replace">Replace - Заменить существующий</SelectItem>
                        <SelectItem value="merge">Merge - Объединить данные</SelectItem>
                        <SelectItem value="skip">Skip - Пропустить если существует</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Пользователи:</Label>
                    <Select 
                      value={conflictStrategy.users} 
                      onValueChange={(value: ExtendedResolution) => 
                        setConflictStrategy(prev => ({ ...prev, users: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="replace">Replace - Заменить</SelectItem>
                        <SelectItem value="merge">Merge - Объединить</SelectItem>
                        <SelectItem value="skip">Skip - Пропустить</SelectItem>
                        <SelectItem value="rename">Rename - Переименовать</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Артефакты:</Label>
                    <Select 
                      value={conflictStrategy.artifacts} 
                      onValueChange={(value: ExtendedResolution) => 
                        setConflictStrategy(prev => ({ ...prev, artifacts: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="replace">Replace - Заменить</SelectItem>
                        <SelectItem value="merge">Merge - Объединить</SelectItem>
                        <SelectItem value="skip">Skip - Пропустить</SelectItem>
                        <SelectItem value="rename">Rename - Переименовать</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Blob файлы:</Label>
                    <Select 
                      value={conflictStrategy.blobs} 
                      onValueChange={(value: ExtendedResolution) => 
                        setConflictStrategy(prev => ({ ...prev, blobs: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="replace">Replace - Заменить</SelectItem>
                        <SelectItem value="merge">Merge - Объединить</SelectItem>
                        <SelectItem value="skip">Skip - Пропустить</SelectItem>
                        <SelectItem value="rename">Rename - Переименовать</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConflictDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleImportSeed}>
              <Download className="size-4 mr-2" />
              Импортировать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Progress Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Импорт Seed Данных</DialogTitle>
            <DialogDescription>
              Прогресс импорта seed данных
            </DialogDescription>
          </DialogHeader>

          {importProgress && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{importProgress.message}</span>
                  <span className="text-sm text-muted-foreground">{importProgress.progress}%</span>
                </div>
                <Progress value={importProgress.progress} />
              </div>

              {importProgress.details && (
                <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                  {importProgress.details}
                </div>
              )}

              {importProgress.phase === 'complete' && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="size-4" />
                  <span className="text-sm">Импорт завершен успешно!</span>
                </div>
              )}

              {importProgress.phase === 'error' && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="size-4" />
                  <span className="text-sm">Произошла ошибка при импорте</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {importProgress?.phase === 'complete' || importProgress?.phase === 'error' ? (
              <Button onClick={() => setShowProgressDialog(false)}>
                Закрыть
              </Button>
            ) : (
              <Button variant="outline" disabled>
                Импорт в процессе...
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// END OF: components/phoenix/seed-import-tab.tsx