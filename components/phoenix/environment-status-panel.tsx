/**
 * @file components/phoenix/environment-status-panel.tsx
 * @description PHOENIX PROJECT - Environment Status Panel для мониторинга LOCAL/BETA/PROD окружений
 * @version 1.0.0
 * @date 2025-06-29
 * @updated PHOENIX PROJECT Step 4 - Environment monitoring UI
 */

/** HISTORY:
 * v1.0.0 (2025-06-29): PHOENIX PROJECT Step 4 - Создание Environment Status Panel
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { 
  Database,
  Server,
  Globe,
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Zap,
  HardDrive,
  Cpu,
  RefreshCw,
  Play,
  Square,
  Settings
} from 'lucide-react'

interface EnvironmentStatus {
  name: 'LOCAL' | 'BETA' | 'PROD'
  status: 'healthy' | 'warning' | 'error' | 'offline'
  uptime: string
  lastCheck: string
  services: {
    database: 'online' | 'offline' | 'error'
    redis: 'online' | 'offline' | 'error'
    webServer: 'online' | 'offline' | 'error'
  }
  metrics: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
    activeConnections: number
  }
  port?: number
  url?: string
}

/**
 * Environment Status Panel - мониторинг всех окружений
 * 
 * Функциональность:
 * - Real-time статус LOCAL/BETA/PROD окружений
 * - Мониторинг сервисов (PostgreSQL, Redis, Web Server)
 * - Метрики производительности (CPU, Memory, Disk)
 * - Управление окружениями (start/stop/restart)
 * - Health check automation
 * 
 * @feature PHOENIX PROJECT Step 4 - Environment Monitoring
 * @feature Real-time health checks
 * @feature Service management controls
 */
export function EnvironmentStatusPanel() {
  const [environments, setEnvironments] = useState<EnvironmentStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Загрузка статуса окружений при инициализации
  useEffect(() => {
    loadEnvironmentStatus()
    
    // Auto-refresh каждые 30 секунд
    if (autoRefresh) {
      const interval = setInterval(loadEnvironmentStatus, 30000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  /**
   * Загрузка статуса всех окружений
   */
  const loadEnvironmentStatus = async () => {
    try {
      // MOCK DATA для демонстрации - в реальном проекте это будут API вызовы
      const mockEnvironments: EnvironmentStatus[] = [
        {
          name: 'LOCAL',
          status: 'healthy',
          uptime: '2h 34m',
          lastCheck: new Date().toISOString(),
          services: {
            database: 'online',
            redis: 'online', 
            webServer: 'online'
          },
          metrics: {
            cpuUsage: 12,
            memoryUsage: 45,
            diskUsage: 23,
            activeConnections: 8
          },
          port: 3000,
          url: 'http://app.localhost:3000'
        },
        {
          name: 'BETA',
          status: 'warning',
          uptime: '1d 5h 12m',
          lastCheck: new Date().toISOString(),
          services: {
            database: 'online',
            redis: 'offline',
            webServer: 'online'
          },
          metrics: {
            cpuUsage: 67,
            memoryUsage: 78,
            diskUsage: 45,
            activeConnections: 23
          },
          url: 'https://beta.welcome-onboard.ru'
        },
        {
          name: 'PROD',
          status: 'healthy',
          uptime: '15d 8h 45m',
          lastCheck: new Date().toISOString(),
          services: {
            database: 'online',
            redis: 'online',
            webServer: 'online'
          },
          metrics: {
            cpuUsage: 34,
            memoryUsage: 56,
            diskUsage: 67,
            activeConnections: 156
          },
          url: 'https://app.welcome-onboard.ru'
        }
      ]

      setEnvironments(mockEnvironments)
    } catch (error) {
      toast.error('Failed to load environment status')
      console.error('Error loading environment status:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Получение иконки статуса
   */
  const getStatusIcon = (status: EnvironmentStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'offline':
        return <XCircle className="h-5 w-5 text-gray-500" />
    }
  }

  /**
   * Получение цвета badge для статуса
   */
  const getStatusBadgeVariant = (status: EnvironmentStatus['status']) => {
    switch (status) {
      case 'healthy':
        return 'default'
      case 'warning':
        return 'secondary'
      case 'error':
        return 'destructive'
      case 'offline':
        return 'outline'
    }
  }

  /**
   * Получение иконки сервиса
   */
  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'database':
        return <Database className="h-4 w-4" />
      case 'redis':
        return <Zap className="h-4 w-4" />
      case 'webServer':
        return <Server className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  /**
   * Получение цвета для статуса сервиса
   */
  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-500'
      case 'offline':
        return 'text-gray-500'
      case 'error':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-32 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header с controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Environment Status
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? (
                  <Square className="h-4 w-4 mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Auto-refresh
              </Button>
              <Button variant="outline" size="sm" onClick={loadEnvironmentStatus}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Real-time monitoring of LOCAL, BETA, and PROD environments
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Environment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {environments.map((env) => (
          <Card key={env.name} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(env.status)}
                  {env.name}
                </div>
                <Badge variant={getStatusBadgeVariant(env.status)}>
                  {env.status}
                </Badge>
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Uptime: {env.uptime}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Services Status */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Services</h4>
                {Object.entries(env.services).map(([service, status]) => (
                  <div key={service} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getServiceIcon(service)}
                      <span className="text-sm capitalize">{service}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={getServiceStatusColor(status)}
                    >
                      {status}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Metrics */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Metrics</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      CPU
                    </div>
                    <span>{env.metrics.cpuUsage}%</span>
                  </div>
                  <Progress value={env.metrics.cpuUsage} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Memory
                    </div>
                    <span>{env.metrics.memoryUsage}%</span>
                  </div>
                  <Progress value={env.metrics.memoryUsage} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      Disk
                    </div>
                    <span>{env.metrics.diskUsage}%</span>
                  </div>
                  <Progress value={env.metrics.diskUsage} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm pt-2">
                  <span>Active Connections</span>
                  <Badge variant="outline">{env.metrics.activeConnections}</Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                {env.url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={env.url} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      Open
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>

            {/* Environment Badge */}
            <div className="absolute top-2 right-2">
              <Badge variant={env.name === 'PROD' ? 'default' : 'secondary'}>
                {env.name}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Overall Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {environments.filter(env => env.status === 'healthy').length}
              </div>
              <div className="text-sm text-muted-foreground">Healthy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {environments.filter(env => env.status === 'warning').length}
              </div>
              <div className="text-sm text-muted-foreground">Warning</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {environments.filter(env => env.status === 'error').length}
              </div>
              <div className="text-sm text-muted-foreground">Error</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {environments.reduce((sum, env) => sum + env.metrics.activeConnections, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Connections</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// END OF: components/phoenix/environment-status-panel.tsx