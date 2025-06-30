/**
 * @file app/app/(main)/phoenix/seed-export/page.tsx
 * @description PHOENIX PROJECT - Seed Export Page с выбором источника БД
 * @version 1.0.0
 * @date 2025-06-30
 * @updated Enterprise Admin Interface - Новая страница для экспорта seeds из любой БД
 */

/** HISTORY:
 * v1.0.0 (2025-06-30): Enterprise Admin Interface - создана страница seed export
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem, 
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload,
  Database,
  Globe,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
  Settings,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

interface WorldInfo {
  id: string
  name: string
  environment: 'LOCAL' | 'BETA' | 'PROD'
  category: string
  isActive: boolean
}

interface ExportResult {
  success: boolean
  seedPath?: string
  error?: string
}

/**
 * Phoenix Seed Export Page
 * 
 * Позволяет администраторам экспортировать данные из любой БД:
 * - Только для LOCAL окружения (безопасность)
 * - Выбор мира из текущей LOCAL БД
 * - Выбор источника данных (LOCAL/BETA/PROD/custom)
 * - Опция включения blob файлов
 * - Настраиваемое название директории
 * 
 * @feature Enterprise Admin Interface - Database export
 * @feature Multi-source export capability
 * @feature Security - LOCAL only access
 */
export default function SeedExportPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [availableWorlds, setAvailableWorlds] = useState<WorldInfo[]>([])
  const [selectedWorld, setSelectedWorld] = useState<string>('')
  const [dataSource, setDataSource] = useState<string>('current')
  const [customDbUrl, setCustomDbUrl] = useState<string>('')
  const [includeBlobs, setIncludeBlobs] = useState<boolean>(false)
  const [seedName, setSeedName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)

  // Проверяем что мы в LOCAL окружении
  const currentEnvironment = process.env.NEXT_PUBLIC_APP_STAGE || 'PROD'
  const isLocalEnvironment = currentEnvironment === 'LOCAL'

  useEffect(() => {
    if (isLocalEnvironment) {
      loadAvailableWorlds()
    }
  }, [isLocalEnvironment])

  useEffect(() => {
    // Автоматически генерируем имя seed директории
    if (selectedWorld && dataSource) {
      const worldInfo = availableWorlds.find(w => w.id === selectedWorld)
      const sourceLabel = getDataSourceLabel(dataSource)
      const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      
      if (worldInfo) {
        setSeedName(`${worldInfo.id}_${sourceLabel}_${timestamp}`)
      }
    }
  }, [selectedWorld, dataSource, availableWorlds])

  const loadAvailableWorlds = async () => {
    setIsLoading(true)
    
    try {
      // Загружаем миры из текущей LOCAL БД
      const response = await fetch('/api/phoenix/worlds?environment=LOCAL')
      if (!response.ok) {
        throw new Error('Failed to load worlds')
      }
      
      const data = await response.json()
      if (data.success) {
        setAvailableWorlds(data.worlds || [])
      } else {
        throw new Error(data.error || 'Failed to load worlds')
      }
    } catch (error) {
      console.error('Error loading worlds:', error)
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить список миров",
        variant: "destructive"
      })
      setAvailableWorlds([])
    } finally {
      setIsLoading(false)
    }
  }

  const getDataSourceLabel = (source: string): string => {
    switch (source) {
      case 'current': return 'LOCAL'
      case 'beta': return 'BETA'
      case 'prod': return 'PROD'
      case 'custom': return 'CUSTOM'
      default: return 'UNKNOWN'
    }
  }

  const getDataSourceUrl = (source: string): string => {
    switch (source) {
      case 'current': return process.env.POSTGRES_URL || ''
      case 'beta': return process.env.POSTGRES_URL_BETA || ''
      case 'prod': return process.env.POSTGRES_URL_PROD || ''
      case 'custom': return customDbUrl
      default: return ''
    }
  }

  const handleExport = async () => {
    if (!selectedWorld || !seedName.trim()) {
      toast({
        title: "Заполните все поля",
        description: "Выберите мир и укажите название seed",
        variant: "destructive"
      })
      return
    }

    const sourceDbUrl = getDataSourceUrl(dataSource)
    if (!sourceDbUrl) {
      toast({
        title: "Неверный источник данных",
        description: "Не удалось получить URL базы данных",
        variant: "destructive"
      })
      return
    }

    setIsExporting(true)
    setExportResult(null)

    try {
      const response = await fetch('/api/phoenix/seed/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldId: selectedWorld,
          sourceDbUrl,
          includeBlobs,
          seedName: seedName.trim()
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setExportResult({
          success: true,
          seedPath: data.seedPath
        })
        
        toast({
          title: "Экспорт завершен",
          description: `Seed данные экспортированы в: ${data.seedPath}`,
        })
      } else {
        throw new Error(data.error || 'Export failed')
      }
    } catch (error) {
      console.error('Error exporting seed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      
      setExportResult({
        success: false,
        error: errorMessage
      })
      
      toast({
        title: "Ошибка экспорта",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Проверяем доступ
  if (!isLocalEnvironment) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-amber-500" />
              LOCAL Environment Required
            </CardTitle>
            <CardDescription>
              Seed Export is only available in LOCAL environment for security reasons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Current environment: <strong>{currentEnvironment}</strong>
            </p>
            <Button asChild variant="outline">
              <Link href="/phoenix">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Upload className="size-8 text-purple-500" />
            <h1 className="text-3xl font-bold">Seed Export</h1>
            <Badge variant="secondary">LOCAL ONLY</Badge>
          </div>
          <p className="text-muted-foreground">
            Export data from any database source for local debugging
          </p>
        </div>
        
        <Button asChild variant="outline">
          <Link href="/phoenix">
            <ArrowLeft className="size-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Security Warning */}
      <Alert>
        <AlertCircle className="size-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> This feature is only available in LOCAL environment. 
          It allows exporting data from Beta/Production databases for local debugging purposes.
        </AlertDescription>
      </Alert>

      {/* Export Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Form */}
        <div className="space-y-6">
          {/* World Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="size-5" />
                World Selection
              </CardTitle>
              <CardDescription>
                Choose world from current LOCAL database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="size-4 animate-spin mr-2" />
                  <span className="text-sm">Loading worlds...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="world-select">World</Label>
                  <Select value={selectedWorld} onValueChange={setSelectedWorld}>
                    <SelectTrigger id="world-select">
                      <SelectValue placeholder="Select world to export" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableWorlds.map((world) => (
                        <SelectItem key={world.id} value={world.id}>
                          <div className="flex items-center gap-2">
                            <span>{world.name || world.id}</span>
                            <Badge variant="outline" className="text-xs">
                              {world.category}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableWorlds.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No worlds found in LOCAL database
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Source Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-5" />
                Data Source
              </CardTitle>
              <CardDescription>
                Choose database to export from
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="source-select">Source Database</Label>
                <Select value={dataSource} onValueChange={setDataSource}>
                  <SelectTrigger id="source-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current (LOCAL)</SelectItem>
                    <SelectItem value="beta">BETA Environment</SelectItem>
                    <SelectItem value="prod">PRODUCTION Environment</SelectItem>
                    <SelectItem value="custom">Custom URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dataSource === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="custom-url">Custom Database URL</Label>
                  <Input
                    id="custom-url"
                    type="url"
                    placeholder="postgresql://user:password@host:port/database"
                    value={customDbUrl}
                    onChange={(e) => setCustomDbUrl(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="size-5" />
                Export Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seed-name">Seed Directory Name</Label>
                <Input
                  id="seed-name"
                  placeholder="e.g., UC_001_LOCAL_2025-06-30"
                  value={seedName}
                  onChange={(e) => setSeedName(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-blobs"
                  checked={includeBlobs}
                  onCheckedChange={(checked) => setIncludeBlobs(checked as boolean)}
                />
                <Label htmlFor="include-blobs" className="text-sm">
                  Include binary files (blobs)
                </Label>
              </div>

              <Button 
                onClick={handleExport} 
                disabled={isExporting || !selectedWorld || !seedName.trim()}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Upload className="size-4 mr-2" />
                    Start Export
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Info & Results */}
        <div className="space-y-6">
          {/* Export Configuration Preview */}
          {selectedWorld && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="size-5" />
                  Export Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">World:</span>
                    <span>{selectedWorld}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Source:</span>
                    <Badge variant="outline">{getDataSourceLabel(dataSource)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Include Blobs:</span>
                    <Badge variant={includeBlobs ? "default" : "secondary"}>
                      {includeBlobs ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Output:</span>
                    <span className="text-muted-foreground">./seeds/{seedName}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Result */}
          {exportResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {exportResult.success ? (
                    <CheckCircle className="size-5 text-green-500" />
                  ) : (
                    <AlertCircle className="size-5 text-red-500" />
                  )}
                  Export Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                {exportResult.success ? (
                  <div className="space-y-2">
                    <p className="text-sm text-green-600">
                      Export completed successfully!
                    </p>
                    {exportResult.seedPath && (
                      <div className="bg-green-50 p-2 rounded text-sm">
                        <strong>Seed Path:</strong> {exportResult.seedPath}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-red-600">
                      Export failed
                    </p>
                    {exportResult.error && (
                      <div className="bg-red-50 p-2 rounded text-sm">
                        <strong>Error:</strong> {exportResult.error}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Usage Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>1. Select a world from your LOCAL database</p>
              <p>2. Choose the source database to export from</p>
              <p>3. Configure export options (blobs, directory name)</p>
              <p>4. Click &quot;Start Export&quot; to begin the process</p>
              <p>5. Use the exported seed for local debugging via Seed Import</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// END OF: app/app/(main)/phoenix/seed-export/page.tsx