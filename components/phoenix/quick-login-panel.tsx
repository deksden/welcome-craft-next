/**
 * @file components/phoenix/quick-login-panel.tsx
 * @description PHOENIX PROJECT - Quick Login Panel для админ дашборда
 * @version 1.0.0
 * @date 2025-06-30
 * @updated Создан компонент для быстрой смены пользователей в dev/beta окружениях
 */

/** HISTORY:
 * v1.0.0 (2025-06-30): Создан QuickLoginPanel для Phoenix Admin Dashboard
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Select,
  SelectContent,
  SelectItem, 
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, 
  LogIn, 
  LogOut, 
  Crown, 
  Shield, 
  Globe,
  AlertTriangle,
  Clock,
  Settings
} from 'lucide-react'
import { QuickLoginHelper, type QuickLoginUser } from '@/lib/phoenix/quick-login'
import { useToast } from '@/hooks/use-toast'

/**
 * Phoenix Quick Login Panel
 * 
 * Компонент для быстрого переключения между пользователями в Phoenix Admin Dashboard:
 * - Список заранее настроенных demo пользователей
 * - Поддержка world isolation
 * - Сохранение последнего пользователя
 * - Текущий статус аутентификации
 * - Безопасность: только LOCAL/BETA окружения
 * 
 * @feature PHOENIX PROJECT - Quick Login Panel
 * @feature Environment-aware security
 * @feature World isolation support
 * @feature User preference memory
 */
export function QuickLoginPanel() {
  const [quickLoginHelper] = useState(() => new QuickLoginHelper())
  const [users, setUsers] = useState<QuickLoginUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [currentAuth, setCurrentAuth] = useState<{
    isAuthenticated: boolean
    user?: any
    worldId?: string
  }>({ isAuthenticated: false })
  const [rememberUser, setRememberUser] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)
  
  const { toast } = useToast()

  const initializePanel = useCallback(async () => {
    // Проверяем доступность Quick Login
    const available = quickLoginHelper.isAvailable()
    setIsAvailable(available)

    if (!available) {
      return
    }

    // Загружаем пользователей
    const availableUsers = quickLoginHelper.getQuickLoginUsers()
    setUsers(availableUsers)

    // Проверяем текущий статус авторизации
    const authStatus = await quickLoginHelper.getCurrentAuthStatus()
    setCurrentAuth(authStatus)

    // Загружаем последнего пользователя
    const lastUser = quickLoginHelper.getLastUser()
    if (lastUser) {
      setSelectedUserId(lastUser.id)
    }
  }, [quickLoginHelper])

  useEffect(() => {
    initializePanel()
  }, [initializePanel])

  const handleQuickLogin = async () => {
    const selectedUser = users.find(u => u.id === selectedUserId)
    if (!selectedUser) {
      toast({
        title: "Ошибка",
        description: "Выберите пользователя для входа",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const success = await quickLoginHelper.quickLogin(selectedUser, {
        environment: 'LOCAL',
        rememberLastUser: rememberUser
      })

      if (success) {
        toast({
          title: "Успешно",
          description: `Выполнен вход как ${selectedUser.name}`,
        })
        
        // Обновляем статус авторизации через небольшую задержку
        setTimeout(async () => {
          const newAuthStatus = await quickLoginHelper.getCurrentAuthStatus()
          setCurrentAuth(newAuthStatus)
        }, 1000)
      } else {
        toast({
          title: "Ошибка входа",
          description: "Не удалось выполнить быстрый вход",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при входе",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Очищаем test-session cookie
      document.cookie = 'test-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = 'test-session-fallback=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost'
      
      // Очищаем сохраненного пользователя если требуется
      if (!rememberUser) {
        quickLoginHelper.clearLastUser()
      }

      // Перезагружаем страницу
      window.location.reload()
      
      toast({
        title: "Выход выполнен",
        description: "Сессия завершена",
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Ошибка при выходе",
        variant: "destructive"
      })
    }
  }

  const getUserIcon = (user: QuickLoginUser) => {
    switch (user.type) {
      case 'admin':
        return <Crown className="size-4 text-yellow-500" />
      case 'demo':
        return <Settings className="size-4 text-blue-500" />
      default:
        return <User className="size-4 text-gray-500" />
    }
  }

  const getUserBadgeVariant = (user: QuickLoginUser) => {
    switch (user.type) {
      case 'admin':
        return 'destructive'
      case 'demo':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (!isAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Quick Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="size-4" />
            <AlertDescription>
              Quick Login недоступен в production окружении
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="size-5" />
          Quick Login
          <Badge variant="secondary">DEV/BETA</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Текущий статус */}
        {currentAuth.isAuthenticated && (
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="size-4 text-green-600" />
                <span className="text-sm font-medium">
                  {currentAuth.user?.name || currentAuth.user?.email}
                </span>
                {currentAuth.worldId && (
                  <Badge variant="outline" className="text-xs">
                    <Globe className="size-3 mr-1" />
                    {currentAuth.worldId}
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleLogout}
                className="text-xs"
              >
                <LogOut className="size-3 mr-1" />
                Выйти
              </Button>
            </div>
          </div>
        )}

        {/* Выбор пользователя */}
        <div className="space-y-2">
          <Label htmlFor="user-select">Выберите пользователя</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger id="user-select">
              <SelectValue placeholder="Выберите пользователя для входа" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    {getUserIcon(user)}
                    <span>{user.name}</span>
                    <Badge variant={getUserBadgeVariant(user)} className="text-xs">
                      {user.type}
                    </Badge>
                    {user.worldId && (
                      <Badge variant="outline" className="text-xs">
                        <Globe className="size-3 mr-1" />
                        {user.worldId}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Опции */}
        <div className="flex items-center space-x-2">
          <Switch
            id="remember-user"
            checked={rememberUser}
            onCheckedChange={setRememberUser}
          />
          <Label htmlFor="remember-user" className="text-sm">
            <Clock className="size-3 inline mr-1" />
            Запомнить пользователя
          </Label>
        </div>

        <Separator />

        {/* Кнопка входа */}
        <Button
          onClick={handleQuickLogin}
          disabled={!selectedUserId || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full size-4 border-b-2 border-white mr-2" />
              Вход...
            </>
          ) : (
            <>
              <LogIn className="size-4 mr-2" />
              Быстрый вход
            </>
          )}
        </Button>

        {/* Информация */}
        <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
          <div className="flex items-center gap-1">
            <AlertTriangle className="size-3" />
            Quick Login доступен только в LOCAL и BETA окружениях
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// END OF: components/phoenix/quick-login-panel.tsx