/**
 * @file components/phoenix/system-metrics-panel.tsx
 * @description PHOENIX PROJECT - System Metrics Panel для аналитики и мониторинга системы
 * @version 1.0.0
 * @date 2025-06-29
 * @updated PHOENIX PROJECT Step 4 - System analytics и monitoring UI
 */

/** HISTORY:
 * v1.0.0 (2025-06-29): PHOENIX PROJECT Step 4 - Создание System Metrics Panel
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/components/toast'
import { 
  BarChart3,
  Activity,
  Users,
  Globe,
  Database,
  FileText,
  MessageSquare,
  TrendingUp,
  RefreshCw,
  Download,
} from 'lucide-react'

interface SystemMetrics {
  overview: {
    totalUsers: number
    totalArtifacts: number
    totalChats: number
    totalWorlds: number
    activeUsers24h: number
    systemUptime: string
  }
  performance: {
    avgResponseTime: number
    requestsPerMinute: number
    errorRate: number
    dbConnectionPool: number
    cacheHitRate: number
  }
  usage: {
    topArtifactTypes: Array<{ type: string; count: number; percentage: number }>
    worldUsage: Array<{ worldId: string; name: string; usageCount: number; lastUsed: string }>
    userActivity: Array<{ hour: number; activeUsers: number }>
  }
  storage: {
    dbSize: string
    totalArtifactSize: string
    redisMemoryUsage: string
    logFileSize: string
  }
}

interface TimeRange {
  label: string
  value: string
  hours: number
}

const timeRanges: TimeRange[] = [
  { label: 'Last Hour', value: '1h', hours: 1 },
  { label: 'Last 24 Hours', value: '24h', hours: 24 },
  { label: 'Last 7 Days', value: '7d', hours: 168 },
  { label: 'Last 30 Days', value: '30d', hours: 720 }
]

/**
 * System Metrics Panel - аналитика и мониторинг системы
 * 
 * Функциональность:
 * - Общая статистика системы (пользователи, артефакты, чаты, миры)
 * - Метрики производительности (response time, error rate, cache hit rate)
 * - Анализ использования (топ типы артефактов, активность миров)
 * - Мониторинг хранилища (размеры БД, cache, логи)
 * - Экспорт отчетов и аналитики
 * 
 * @feature PHOENIX PROJECT Step 4 - System Analytics
 * @feature Real-time метрики и графики
 * @feature Configurable time ranges
 */
export function SystemMetricsPanel() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('24h')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Загрузка метрик при инициализации и изменении timeRange
  useEffect(() => {
    loadSystemMetrics()
    
    // Auto-refresh каждые 60 секунд
    if (autoRefresh) {
      const interval = setInterval(loadSystemMetrics, 60000)
      return () => clearInterval(interval)
    }
  }, [timeRange, autoRefresh])

  /**
   * Загрузка системных метрик
   */
  const loadSystemMetrics = async () => {
    try {
      setLoading(true)

      // MOCK DATA для демонстрации - в реальном проекте это будут API вызовы
      const mockMetrics: SystemMetrics = {
        overview: {
          totalUsers: 1247,
          totalArtifacts: 8934,
          totalChats: 2156,
          totalWorlds: 23,
          activeUsers24h: 89,
          systemUptime: '15d 8h 32m'
        },
        performance: {
          avgResponseTime: 145,
          requestsPerMinute: 234,
          errorRate: 0.3,
          dbConnectionPool: 8,
          cacheHitRate: 94.2
        },
        usage: {
          topArtifactTypes: [
            { type: 'text', count: 4567, percentage: 51 },
            { type: 'site', count: 2341, percentage: 26 },
            { type: 'image', count: 1234, percentage: 14 },
            { type: 'person', count: 567, percentage: 6 },
            { type: 'link', count: 225, percentage: 3 }
          ],
          worldUsage: [
            { worldId: 'UC_BASIC', name: 'UC Basic Testing', usageCount: 156, lastUsed: '2025-06-29T10:30:00Z' },
            { worldId: 'REGRESSION_TESTS', name: 'Regression Testing', usageCount: 89, lastUsed: '2025-06-29T09:15:00Z' },
            { worldId: 'DEMO_WORLD', name: 'Demo Environment', usageCount: 67, lastUsed: '2025-06-29T08:45:00Z' },
            { worldId: 'PERFORMANCE_TEST', name: 'Performance Testing', usageCount: 34, lastUsed: '2025-06-28T16:20:00Z' }
          ],
          userActivity: [
            { hour: 0, activeUsers: 12 },
            { hour: 1, activeUsers: 8 },
            { hour: 2, activeUsers: 5 },
            { hour: 3, activeUsers: 3 },
            { hour: 4, activeUsers: 4 },
            { hour: 5, activeUsers: 8 },
            { hour: 6, activeUsers: 15 },
            { hour: 7, activeUsers: 28 },
            { hour: 8, activeUsers: 45 },
            { hour: 9, activeUsers: 67 },
            { hour: 10, activeUsers: 89 },
            { hour: 11, activeUsers: 78 }
          ]
        },
        storage: {
          dbSize: '2.3 GB',
          totalArtifactSize: '1.8 GB',
          redisMemoryUsage: '256 MB',
          logFileSize: '145 MB'
        }
      }

      setMetrics(mockMetrics)
    } catch (error) {
      toast({ type: 'error', description: 'Failed to load system metrics' })
      console.error('Error loading system metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Экспорт метрик в CSV
   */
  const exportMetrics = () => {
    if (!metrics) return

    const csvData = [
      ['Metric', 'Value'],
      ['Total Users', metrics.overview.totalUsers.toString()],
      ['Total Artifacts', metrics.overview.totalArtifacts.toString()],
      ['Total Chats', metrics.overview.totalChats.toString()],
      ['Active Users (24h)', metrics.overview.activeUsers24h.toString()],
      ['Avg Response Time (ms)', metrics.performance.avgResponseTime.toString()],
      ['Requests Per Minute', metrics.performance.requestsPerMinute.toString()],
      ['Error Rate (%)', metrics.performance.errorRate.toString()],
      ['Cache Hit Rate (%)', metrics.performance.cacheHitRate.toString()]
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system-metrics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    
    toast({ type: 'success', description: 'Metrics exported successfully' })
  }

  if (loading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
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
              <BarChart3 className="size-5" />
              System Metrics & Analytics
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" onClick={exportMetrics}>
                <Download className="size-4 mr-2" />
                Export
              </Button>
              
              <Button variant="outline" size="sm" onClick={loadSystemMetrics}>
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Comprehensive system analytics and performance monitoring for {timeRanges.find(r => r.value === timeRange)?.label.toLowerCase()}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{metrics.overview.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="size-3 mr-1" />
                  +{metrics.overview.activeUsers24h} active (24h)
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
                <p className="text-sm font-medium text-muted-foreground">Total Artifacts</p>
                <p className="text-2xl font-bold">{metrics.overview.totalArtifacts.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Size: {metrics.storage.totalArtifactSize}
                </p>
              </div>
              <FileText className="size-4 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Chats</p>
                <p className="text-2xl font-bold">{metrics.overview.totalChats.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Interactive sessions
                </p>
              </div>
              <MessageSquare className="size-4 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Worlds</p>
                <p className="text-2xl font-bold">{metrics.overview.totalWorlds}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Test environments
                </p>
              </div>
              <Globe className="size-4 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Response Time</span>
                <Badge variant="outline">{metrics.performance.avgResponseTime}ms</Badge>
              </div>
              <Progress 
                value={Math.min((metrics.performance.avgResponseTime / 500) * 100, 100)} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground">Target: &lt;200ms</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cache Hit Rate</span>
                <Badge variant="outline">{metrics.performance.cacheHitRate}%</Badge>
              </div>
              <Progress value={metrics.performance.cacheHitRate} className="h-2" />
              <p className="text-xs text-muted-foreground">Target: &gt;90%</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Error Rate</span>
                <Badge variant={metrics.performance.errorRate < 1 ? "outline" : "destructive"}>
                  {metrics.performance.errorRate}%
                </Badge>
              </div>
              <Progress 
                value={metrics.performance.errorRate} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">Target: &lt;1%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5" />
              Top Artifact Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.usage.topArtifactTypes.map((type) => (
                <div key={type.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{type.type}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {type.count.toLocaleString()}
                      </span>
                      <Badge variant="outline">{type.percentage}%</Badge>
                    </div>
                  </div>
                  <Progress value={type.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-5" />
              World Usage Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.usage.worldUsage.map((world) => (
                <div key={world.worldId} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{world.name}</div>
                    <div className="text-xs text-muted-foreground">{world.worldId}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant="outline">{world.usageCount} uses</Badge>
                    <div className="text-xs text-muted-foreground">
                      {new Date(world.lastUsed).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage & System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-5" />
            Storage & System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.storage.dbSize}</div>
              <div className="text-sm text-muted-foreground">Database Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.storage.totalArtifactSize}</div>
              <div className="text-sm text-muted-foreground">Artifact Storage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.storage.redisMemoryUsage}</div>
              <div className="text-sm text-muted-foreground">Redis Memory</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.overview.systemUptime}</div>
              <div className="text-sm text-muted-foreground">System Uptime</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Real-time Activity</p>
                <p className="text-xs text-muted-foreground">
                  {metrics.performance.requestsPerMinute} requests/min • 
                  {metrics.performance.dbConnectionPool} DB connections • 
                  Log size: {metrics.storage.logFileSize}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <div className="size-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// END OF: components/phoenix/system-metrics-panel.tsx