# 🚀 Phoenix System Usage Guide

**Назначение:** Подробное руководство по использованию Phoenix System для управления окружениями WelcomeCraft.

**Версия:** 1.0.0  
**Дата:** 2025-06-29  
**Статус:** PHOENIX PROJECT Documentation - Complete usage guide

---

## 🎯 Обзор Phoenix System

Phoenix System - это комплексная enterprise-ready система управления окружениями WelcomeCraft, предоставляющая:

- **Environment Management:** Управление LOCAL/BETA/PROD окружениями
- **Health Monitoring:** Автоматический мониторинг состояния системы
- **Data Transfer & Backup:** Профессиональные инструменты миграции и резервного копирования
- **World Management:** Динамическое управление тестовыми мирами
- **Admin Dashboard:** Графический интерфейс для администраторов

---

## 🏗️ Архитектура Phoenix

### Трехуровневая система окружений

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    LOCAL    │───▶│    BETA     │───▶│    PROD     │
│             │    │             │    │             │
│ Development │    │   Staging   │    │ Production  │
│  & Testing  │    │ & Pre-Prod  │    │ & Real Users│
└─────────────┘    └─────────────┘    └─────────────┘
```

**LOCAL Environment:**
- Локальная разработка и тестирование
- Быстрые итерации и debugging
- Полный доступ к dev инструментам

**BETA Environment:**
- Staging окружение для тестирования
- Реплика production настроек
- Финальная валидация перед релизом

**PROD Environment:**
- Production окружение
- Реальные пользователи и данные
- Максимальная стабильность и безопасность

---

## 🛠️ Phoenix CLI Commands

### Health Monitoring

```bash
# Базовая проверка состояния
pnpm phoenix:health
# ✅ Database: Connected (15ms response)
# ✅ API: All endpoints responsive
# ✅ Worlds: 5 active, 2 templates
# ✅ Overall Status: HEALTHY

# Детальная проверка
pnpm phoenix:health:detail
# Показывает полный отчет по всем компонентам

# Continuous monitoring
pnpm phoenix:health:watch
# Мониторинг в реальном времени каждые 30 секунд
```

### Environment Management

```bash
# Просмотр статуса окружений
pnpm phoenix:env:status
# LOCAL:  ✅ Active (23 worlds, 156 artifacts)
# BETA:   ⚠️  Warning (2 worlds, 45 artifacts) 
# PROD:   ✅ Healthy (1 world, 892 artifacts)

# Переключение окружения
pnpm phoenix:env:switch LOCAL
# Устанавливает APP_STAGE=LOCAL

# Настройка нового окружения
pnpm phoenix:env:setup
# Интерактивная настройка нового окружения
```

### Data Transfer & Backup

```bash
# Создание backup
pnpm phoenix:backup:local
# 📦 Creating backup for LOCAL environment...
# ✅ Backup created: backup-LOCAL-2025-06-29-14-30-25.json

pnpm phoenix:backup:beta
# Backup BETA окружения

# Миграция данных между окружениями
pnpm phoenix:transfer
# Интерактивный wizard для миграции:
# Source: LOCAL → Target: BETA
# Include: [✓] Worlds [✓] Artifacts [ ] Users [ ] Chats
# Dry run: [✓] Yes (preview only)
```

### World Management

```bash
# Список всех миров
pnpm phoenix:worlds:list
# ID: GENERAL_001    Name: General Testing      Env: LOCAL   Active: ✅
# ID: UC_TESTING     Name: UC Testing World     Env: LOCAL   Active: ✅  
# ID: BETA_STABLE    Name: Stable Beta World    Env: BETA    Active: ✅

# Создание нового мира
pnpm phoenix:worlds:create
# Интерактивное создание мира с настройками

# Очистка неактивных миров
pnpm phoenix:worlds:cleanup
# 🧹 Cleaning up inactive worlds...
# ✅ Removed 3 expired worlds
# ✅ Updated 2 worlds to inactive status

# Заполнение мира тестовыми данными
pnpm phoenix:worlds:seed GENERAL_001
# 📝 Seeding world GENERAL_001...
# ✅ Created 5 users, 12 artifacts, 3 chats
```

### Database Seeding

```bash
# Заполнение LOCAL окружения
pnpm phoenix:seed:local
# 🌱 Seeding LOCAL environment...
# ✅ Created development users and sample data

# Заполнение BETA окружения
pnpm phoenix:seed:beta
# 🌱 Seeding BETA environment...
# ✅ Created staging data for testing

# Кастомное заполнение
pnpm phoenix:seed:custom
# Интерактивная настройка данных для заполнения
```

---

## 🌐 Phoenix API Endpoints

### Health Check API

```http
GET /api/phoenix/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-06-29T14:30:25.123Z",
  "environment": "LOCAL",
  "checks": {
    "database": { "status": "healthy", "responseTime": 15 },
    "worlds": { "status": "healthy", "total": 5, "active": 3 },
    "api": { "status": "healthy", "endpoints": 4 }
  }
}
```

### Backup API

```http
POST /api/phoenix/backup
Content-Type: application/json

{
  "environment": "LOCAL"
}
```

**Response:**
```json
{
  "success": true,
  "backupFile": "backup-LOCAL-2025-06-29-14-30-25.json",
  "environment": "LOCAL",
  "timestamp": "2025-06-29T14:30:25.123Z"
}
```

### Data Transfer API

```http
POST /api/phoenix/transfer
Content-Type: application/json

{
  "sourceEnvironment": "LOCAL",
  "targetEnvironment": "BETA", 
  "includeWorlds": true,
  "includeArtifacts": false,
  "dryRun": true
}
```

### System Metrics API

```http
GET /api/phoenix/metrics?environment=LOCAL
```

**Response:**
```json
{
  "timestamp": "2025-06-29T14:30:25.123Z",
  "environment": "LOCAL",
  "system": {
    "totalWorlds": 5,
    "activeWorlds": 3,
    "templateWorlds": 1,
    "environments": ["LOCAL", "BETA"]
  },
  "worlds": {
    "byEnvironment": { "LOCAL": 3, "BETA": 2 },
    "byCategory": { "GENERAL": 2, "UC_TESTING": 3 }
  },
  "performance": {
    "databaseResponseTime": 15,
    "apiResponseTime": 45
  }
}
```

---

## 📊 Phoenix Admin Dashboard

### WorldManagementPanel

**Функции:**
- Просмотр всех миров в таблице с filtering
- Создание новых миров через модальное окно
- Bulk operations (массовое включение/отключение)
- Управление cleanup настройками

**Использование:**
1. Откройте admin панель WelcomeCraft
2. Перейдите в раздел "Phoenix Admin"
3. Выберите tab "World Management"
4. Используйте фильтры для поиска нужных миров
5. Создавайте новые миры через кнопку "Create World"

### EnvironmentStatusPanel

**Функции:**
- Real-time мониторинг LOCAL/BETA/PROD окружений
- Отображение health status каждого окружения
- Метрики производительности
- Алерты и предупреждения

**Использование:**
1. В Phoenix Admin выберите tab "Environment Status"
2. Наблюдайте real-time статус всех окружений
3. Реагируйте на алерты и предупреждения
4. Экспортируйте отчеты для анализа

### SystemMetricsPanel

**Функции:**
- Общая аналитика системы
- Графики использования ресурсов
- Статистика по мирам и артефактам
- Экспорт данных в CSV/JSON

**Использование:**
1. В Phoenix Admin выберите tab "System Metrics"
2. Анализируйте метрики системы
3. Используйте фильтры по окружениям
4. Экспортируйте данные для дальнейшего анализа

---

## 🧪 Testing Phoenix Components

### Unit Tests

```bash
# Запуск всех Phoenix unit тестов
pnpm test:phoenix:unit
# ✅ 50/50 Phoenix unit tests passing

# Отдельные компоненты
pnpm test tests/unit/phoenix-health-monitor.test.ts
pnpm test tests/unit/phoenix-data-transfer.test.ts
pnpm test tests/unit/phoenix-database-seeder.test.ts
```

### Integration Tests

```bash
# Phoenix integration tests (routes format)
pnpm test:phoenix:integration
# Тесты всех Phoenix API endpoints с эфемерной БД
```

### E2E Tests

```bash
# E2E тестирование Phoenix Admin Dashboard
pnpm test:phoenix:e2e
# Тестирование UI компонентов через Playwright
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# Основные настройки Phoenix
APP_STAGE="LOCAL"                      # Текущее окружение
PHOENIX_AUTO_MIGRATE="true"            # Автоматические миграции
PHOENIX_HEALTH_INTERVAL="300"          # Интервал health checks (сек)
PHOENIX_BACKUP_RETENTION="30"          # Срок хранения backup (дни)

# World Management
PHOENIX_WORLD_AUTO_CLEANUP="true"      # Автоочистка миров
PHOENIX_WORLD_DEFAULT_TTL="24"         # TTL миров по умолчанию (часы)
PHOENIX_WORLD_MAX_PER_ENV="100"        # Максимум миров на окружение

# Alerts & Monitoring
PHOENIX_ALERTS_ENABLED="true"          # Включить алерты
PHOENIX_ALERTS_EMAIL="admin@company.com"  # Email для алертов
PHOENIX_METRICS_RETENTION="7"          # Хранение метрик (дни)
```

### Database Schema

WorldMeta table поддерживает следующие поля:

```sql
CREATE TABLE "worldMeta" (
  "id" varchar(255) PRIMARY KEY,
  "name" varchar(255) NOT NULL,
  "description" text,
  "environment" varchar(10) NOT NULL,    -- LOCAL | BETA | PROD
  "category" varchar(100) NOT NULL,
  "isActive" boolean DEFAULT true,
  "isTemplate" boolean DEFAULT false,
  "autoCleanup" boolean DEFAULT true,
  "cleanupAfterHours" integer DEFAULT 24,
  "isolationLevel" varchar(20) DEFAULT 'FULL',  -- FULL | PARTIAL | NONE
  "tags" jsonb DEFAULT '[]',
  "dependencies" jsonb DEFAULT '[]',
  "settings" jsonb DEFAULT '{}',
  "version" varchar(20) DEFAULT '1.0.0',
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);
```

---

## 🚨 Troubleshooting

### Common Issues

**Problem:** Phoenix health check fails
```bash
pnpm phoenix:health
# ❌ Database: Connection failed
```
**Solution:** Check database connection and ensure migrations are applied
```bash
pnpm db:migrate
pnpm phoenix:health
```

**Problem:** Backup creation fails
```bash
pnpm phoenix:backup:local
# ❌ Error: Permission denied writing backup file
```
**Solution:** Check file permissions and available disk space

**Problem:** World cleanup not working
```bash
pnpm phoenix:worlds:cleanup
# ⚠️ No worlds eligible for cleanup
```
**Solution:** Check autoCleanup settings and TTL configuration

### Debug Mode

Включить детальное логирование:
```bash
DEBUG=phoenix:* pnpm phoenix:health
# Показывает подробные логи для отладки
```

---

## 📚 Best Practices

### Environment Management
1. **Всегда используйте LOCAL для разработки**
2. **Тестируйте в BETA перед deployment в PROD**
3. **Создавайте backup перед важными операциями**
4. **Мониторьте health status регулярно**

### World Management
1. **Используйте осмысленные имена для миров**
2. **Настройте autoCleanup для тестовых миров**
3. **Используйте tags для категоризации**
4. **Создавайте template миры для переиспользования**

### Data Safety
1. **Регулярно создавайте backup**
2. **Тестируйте restore процедуры**
3. **Используйте dry-run для transfer операций**
4. **Мониторьте alerts и реагируйте оперативно**

---

## 🔄 Migration from Legacy System

Если вы мигрируете с устаревшей системы управления мирами:

1. **Backup текущих данных:**
   ```bash
   pnpm phoenix:backup:local
   ```

2. **Проверьте Phoenix health:**
   ```bash
   pnpm phoenix:health
   ```

3. **Мигрируйте worlds в WorldMeta:**
   ```bash
   pnpm phoenix:worlds:migrate-legacy
   ```

4. **Настройте новые environment variables**

5. **Протестируйте все функции Phoenix System**

---

> **Phoenix System** предоставляет enterprise-grade возможности управления окружениями WelcomeCraft. Используйте это руководство для максимально эффективного использования всех возможностей системы.
