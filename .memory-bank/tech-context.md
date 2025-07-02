# 🛠️ Технический Контекст: Настройка и Запуск

**Назначение:** Помочь новому разработчику (или ИИ) быстро запустить проект.

**Версия:** 6.0.0  
**Дата:** 2025-06-30  
**Статус:** SEED DATA SYSTEM COMPLETE - Реализована полная система управления seed данными с JSON+blob архитектурой, conflict resolution и Quick Login интеграцией

---

## 🚀 Технологический стек

- **Фреймворк:** [Next.js](https://nextjs.org/) v15.3+ (App Router, Server Components, Server Actions)
- **Язык:** [TypeScript](https://www.typescriptlang.org/)
- **Стилизация:** [Tailwind CSS](https://tailwindcss.com/) + `tailwindcss-animate` + `@tailwindcss/typography`
- **UI Компоненты:** [shadcn/ui](https://ui.shadcn.com/)
- **База данных:** [PostgreSQL](https://www.postgresql.org/) (Vercel Postgres / Neon)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Аутентификация:** [NextAuth.js (Auth.js)](https://authjs.dev/)
- **Хранилище файлов:** [Vercel Blob](https://vercel.com/storage/blob)
- **Кэширование:** [Redis](https://redis.io/) (Vercel KV / Upstash)
- **AI SDK:** [Vercel AI SDK](https://ai-sdk.dev/) + [Google Gemini](https://ai.google.dev/)
- **Менеджер пакетов:** [pnpm](https://pnpm.io/)
- **Тестирование:** [Playwright](https://playwright.dev/) (E2E) + [Vitest](https://vitest.dev/) (Unit)
- **Линтинг:** [Biome.js](https://biomejs.dev/) + ESLint

---

## ⚡ Быстрый старт

### Предварительные требования
- **Node.js** 18.17+ 
- **pnpm** (установить: `npm install -g pnpm`)
- **Git**

### 🎯 Рекомендуемая установка (Phoenix Project)
```bash
# 1. Клонировать репозиторий
git clone <repository-url>
cd welcome-craft-next

# 2. Автоматическая настройка Phoenix Project
bash ./setup.sh

# 3. Настроить Phoenix LOCAL окружение
pnpm phoenix:dev
```

### 🔧 Ручная установка (пошагово)
```bash
# 1. Установить зависимости
pnpm install

# 2. Поднять локальную БД для разработки
pnpm local:db:up

# 3. Настроить переменные окружения
cp .env.example .env.local
# Заполнить .env.local с Phoenix LOCAL конфигурацией

# 4. Применить миграции к локальной БД
pnpm db:migrate

# 5. Запустить dev-сервер
pnpm dev
```

### 🚀 Альтернативный способ (Vercel-managed)
```bash
# Для команд с доступом к Vercel проекту
vercel login
vercel link
vercel env pull .env.local
# Затем настроить локальную БД через Phoenix команды
```

### 🌍 Режимы работы (Three-Mode Environment)

**См. детали:** `architecture/system-patterns.md#Three-Mode-Environment-Detection`

1. **Local Dev** (`pnpm dev`):
   - **Админ-панель:** http://app.localhost:3000 (фиксированный порт)
   - **Публичный сайт:** http://localhost:3000 (фиксированный порт)
   - Режим разработки с hot reload

2. **Local Prod** (`pnpm test:e2e`):
   - **Админ-панель:** http://app.localhost:DYNAMIC_PORT (3001, 3002, 3003...)
   - **Публичный сайт:** http://localhost:DYNAMIC_PORT (автоматически подбирается)
   - Тестирование production сборки локально

3. **Real Prod** (хостинг):
   - **Админ-панель:** https://app.welcome-onboard.ru (HTTPS, порт 443)
   - **Публичный сайт:** https://welcome-onboard.ru (HTTPS, порт 443)
   - Реальный production на хостинге

---

## 🔧 Ключевые команды

### 🚀 Phoenix Project (рекомендуемые)
```bash
pnpm phoenix:dev      # Полная настройка LOCAL + запуск dev сервера
pnpm phoenix:local    # Настроить LOCAL окружение
pnpm phoenix:status   # Статус всех Phoenix контейнеров
pnpm phoenix:health   # Health check системы
pnpm phoenix:cleanup  # Остановить все Phoenix окружения
```

### 🔧 Разработка
```bash
pnpm dev              # Запуск сервера разработки (требует поднятую БД)
pnpm build            # Сборка production-версии
pnpm start            # Запуск production сервера
```

### 🔍 Качество кода
```bash
pnpm lint             # Проверка линтером
pnpm format           # Автоматическое форматирование
pnpm typecheck        # Проверка TypeScript
```

### 💾 База данных (локальная БД для разработки)
```bash
pnpm local:db:up      # Поднять локальную БД разработки
pnpm local:db:down    # Остановить локальную БД
pnpm local:db:reset   # Сбросить локальную БД (удалить все данные)
pnpm local:db:logs    # Посмотреть логи локальной БД
pnpm db:generate      # Генерация миграций (после изменения schema.ts)
pnpm db:migrate       # Применение миграций к текущей БД
pnpm db:studio        # Drizzle Studio для работы с БД
```

### 🧪 Тестирование (эфемерная БД остается работать)
```bash
pnpm test             # Все E2E тесты (routes + e2e) с эфемерной БД
pnpm test:routes      # API/интеграционные тесты (109 тестов)
pnpm test:e2e         # End-to-End тесты (40+ тестов)
pnpm test:unit        # Юнит-тесты (269+ тестов)

# 🔧 ВАЖНО: Эфемерная БД остается работать после тестов
pnpm test:db:down     # ⚠️ РУЧНАЯ остановка эфемерной БД (обязательно)
pnpm test:db:up       # Запустить эфемерную БД (если еще не запущена)
pnpm test:db:setup    # Накатить миграции и данные в эфемерную БД

# ⚠️ ВАЖНО: Тесты routes/integration/e2e поднимают БД, но НЕ останавливают!
# Пользователь должен остановить вручную: pnpm test:db:down
```

### 🎯 Критическое разделение баз данных

WelcomeCraft использует **две полностью раздельные** системы баз данных для максимальной стабильности:

#### 🔧 **Локальная БД для Разработки (Phoenix LOCAL)**
- **Назначение:** Ваша постоянная база данных для ежедневной разработки. Данные в ней **сохраняются**.
- **Управление:** `pnpm local:db:up`, `pnpm local:db:down` (или аналогичные команды для вашей Phoenix LOCAL БД, обычно настроенные через `.env.local`).

#### 🧪 **Эфемерная БД для Тестов**
- **Назначение:** Временная, изолированная база данных **только для `pnpm test`**. Данные в ней **уничтожаются** (контейнер `welcomecraft_postgres_test` может оставаться запущенным, но его содержимое очищается или игнорируется перед каждым тестовым прогоном).
- **Управление:** **Автоматическое** при запуске `pnpm test`. Команды `pnpm test:db:*` предназначены только для отладки тестов и управляют контейнером `welcomecraft_postgres_test`.

### UI компоненты
```bash
pnpm dlx shadcn@latest add <component>  # Установка shadcn/ui компонентов
```

### 🚀 Vercel Environment Management (PRODUCTION-READY)
```bash
# Environment Variables Management
vercel env list development           # Список переменных для development
vercel env list production           # Список переменных для production
vercel env pull .env.local           # Скачать переменные в локальный файл
vercel env add NEW_VAR development   # Добавить новую переменную
vercel env remove OLD_VAR development # Удалить переменную

# Project Management
vercel login                         # Вход в Vercel CLI
vercel link                          # Связать локальный проект с Vercel
vercel whoami                        # Проверить текущего пользователя
vercel project list                  # Список всех проектов

# Deployment & Logs
vercel deploy                        # Деплой текущей ветки
vercel --prod                        # Деплой в production
vercel logs                          # Просмотр логов deployment
vercel inspect                       # Детальная информация о deployment
```

### 🚀 Phoenix System Management (PRODUCTION-READY)
```bash
# Health Monitoring & System Status
pnpm phoenix:health           # Проверка состояния системы
pnpm phoenix:health:detail    # Детальный health check
pnpm phoenix:health:watch     # Мониторинг в реальном времени

# Environment Management
pnpm phoenix:status           # Статус всех Phoenix контейнеров
pnpm phoenix:local            # Настроить LOCAL окружение
pnpm phoenix:dev              # Настроить LOCAL + запустить dev сервер
pnpm phoenix:cleanup          # Остановить все Phoenix окружения

# Data Transfer & Backup
pnpm phoenix:backup:local     # Создание backup LOCAL окружения
pnpm phoenix:backup:beta      # Создание backup BETA окружения
pnpm phoenix:transfer         # Миграция данных между окружениями

# World Management (CLI интерфейс)
pnpm phoenix:worlds:list      # Список всех тестовых миров
pnpm phoenix:worlds:create    # Создание нового мира (интерактивно)
pnpm phoenix:worlds:cleanup   # Очистка неактивных миров
pnpm phoenix:worlds:seed      # Заполнение мира тестовыми данными
pnpm phoenix:worlds:copy      # Копирование мира между окружениями
pnpm phoenix:worlds:export    # Экспорт конфигурации миров
pnpm phoenix:worlds:help      # Справка по командам миров

# Seed Data Management (✅ ПОЛНОСТЬЮ РЕАЛИЗОВАНО Phase 3)
pnpm phoenix:seed:export      # Экспорт мира в seed формат
pnpm phoenix:seed:import      # Импорт seed данных с conflict resolution
pnpm phoenix:seed:validate    # Валидация seed структуры
pnpm phoenix:seed:list        # Список доступных seed директорий
pnpm phoenix:seed:cleanup-orphaned  # Обнаружение и очистка orphaned blob файлов

# Phoenix Admin Dashboard GUI
# GUI для управления пользователями и экспорта seed данных реализован.

# User Management (CLI интерфейс)
pnpm phoenix:users:set-admin <email> --db-url=<URL> # Назначение прав администратора
pnpm phoenix:users:list --db-url=<URL>      # Список всех пользователей
pnpm phoenix:users:add <email> <name> <password> <type> --db-url=<URL> # Добавление нового пользователя
pnpm phoenix:users:delete <id> --db-url=<URL>    # Удаление пользователя

# Примеры использования World Manager CLI:
pnpm phoenix:worlds:list LOCAL           # Список миров в LOCAL окружении
pnpm phoenix:worlds:create               # Интерактивное создание мира
pnpm phoenix:worlds:cleanup LOCAL        # Очистка неактивных миров LOCAL
pnpm phoenix:worlds:seed GENERAL_001     # Заполнить мир тестовыми данными
pnpm phoenix:worlds:copy UC_TESTING LOCAL BETA  # Копировать мир UC_TESTING из LOCAL в BETA

# Примеры Seed Data Management:
pnpm phoenix:seed:export UC_001 LOCAL --include-blobs  # Экспорт мира с blob файлами
pnpm phoenix:seed:import ./seeds/UC_001_LOCAL_2025-06-30  # Импорт с conflict resolution
pnpm phoenix:seed:validate ./seeds/UC_001_LOCAL_2025-06-30  # Валидация seed структуры
pnpm phoenix:seed:list                    # Список всех доступных seeds
pnpm phoenix:seed:cleanup-orphaned       # Очистка orphaned blob файлов

# Database Seeding
pnpm phoenix:seed:local       # Заполнение LOCAL БД
pnpm phoenix:seed:beta        # Заполнение BETA БД
pnpm phoenix:seed:custom      # Кастомное заполнение БД

# Testing Phoenix Components
pnpm test:phoenix:unit        # Phoenix unit тесты (50 тестов)
pnpm test:phoenix:integration # Phoenix integration тесты
pnpm test:phoenix:e2e         # Phoenix E2E dashboard тесты

# ⚠️ ВАЖНО: Эфемерная БД Management Policy
# - routes/integration/e2e тесты ПОДНИМАЮТ эфемерную БД, но НЕ ОСТАНАВЛИВАЮТ
# - БД остается работать для последующих запусков (быстрее)
# - Пользователь останавливает вручную: pnpm test:db:down
# - При повторном запуске тестов используется существующий контейнер
```

### Оптимизация разработки
```bash
# Чистая консоль без лишних webpack логов (настроено автоматически)
WEBPACK_LOGGING=false        # Отключение webpack логирования
NEXT_TELEMETRY_DISABLED=1    # Отключение Next.js телеметрии
```

---

## 📂 Структура проекта

```
.
├── app/
│   ├── (auth)/            # Аутентификация
│   ├── (main)/            # Основное приложение
│   ├── api/               # API роуты
│   │   └── phoenix/       # 🚀 Phoenix Admin API endpoints
│   │       ├── health/    # Health monitoring API
│   │       ├── backup/    # Backup management API
│   │       ├── transfer/  # Data transfer API
│   │       └── metrics/   # System metrics API
│   └── site/              # Публичные сайты
├── artifacts/kinds/       # Плагины артефактов
├── components/
│   ├── ui/                # UI компоненты (shadcn/ui)
│   └── phoenix/           # 🚀 Phoenix Admin Dashboard Components
│       ├── world-management-panel.tsx      # Управление мирами
│       ├── environment-status-panel.tsx    # Мониторинг окружений
│       └── system-metrics-panel.tsx        # Системная аналитика
├── site-blocks/           # Модульные блоки сайтов
├── scripts/               # 🚀 Phoenix CLI Scripts
│   ├── phoenix-health-check.ts       # Health monitoring system
│   ├── phoenix-data-transfer.ts      # Backup/restore/migration
│   ├── phoenix-database-seeder.ts    # Database seeding
│   └── phoenix-world-manager.ts      # ✅ World management CLI
├── lib/
│   ├── ai/                # AI логика и промпты
│   ├── db/                # База данных (Drizzle)
│   │   └── schema.ts      # 🚀 Включает worldMeta table
│   └── ...                # Утилиты
├── tests/
│   ├── e2e/               # E2E тесты (Playwright)
│   ├── routes/            # API тесты (Playwright)
│   │   └── phoenix-integration.test.ts  # 🚀 Phoenix integration tests
│   └── unit/              # Юнит-тесты (Vitest)
│       ├── phoenix-health-monitor.test.ts     # 🚀 Phoenix unit tests
│       ├── phoenix-data-transfer.test.ts      # 🚀 Phoenix unit tests
│       └── phoenix-database-seeder.test.ts    # 🚀 Phoenix unit tests
└── .memory-bank/          # Документация и знания
```

---

## 🔐 Переменные окружения (Vercel-managed)

### 🎯 Основной принцип: Vercel CLI Management

**Все переменные окружения управляются централизованно через Vercel Dashboard и автоматически синхронизируются через CLI:**

```bash
# Получить все переменные из Vercel
vercel env pull .env.local

# Обновить переменные после изменений в Dashboard
vercel env pull .env.local --force
```

### 📋 Автоматически управляемые переменные

**Database (Neon PostgreSQL) - управляется Vercel:**
```bash
DATABASE_URL="postgres://neondb_owner:***@ep-***-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:***@ep-***.eu-central-1.aws.neon.tech/neondb?sslmode=require"
POSTGRES_URL="postgres://neondb_owner:***@ep-***-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
POSTGRES_PRISMA_URL="postgres://neondb_owner:***@ep-***-pooler.eu-central-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require"
NEON_PROJECT_ID="sparkling-sky-09912947"
```

**Authentication - управляется Vercel:**
```bash
AUTH_SECRET="e1f31e8ac75d15ecd726d5f05b00a87f"  # NextAuth.js secret
```

**AI Services - управляется Vercel:**
```bash
GOOGLE_GENERATIVE_AI_API_KEY="AIzaSyAe68ANhTac0cj_aPFTFgDc-sWEI-HABMw"  # Google Gemini
XAI_API_KEY=""  # xAI Grok API (optional)
```

**File Storage - управляется Vercel:**
```bash
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_WA4VkxAAwtGcjrml_***"  # Vercel Blob
```

**Cache & Redis - управляется Vercel:**
```bash
REDIS_URL="rediss://default:***@logical-firefly-14789.upstash.io:6379"
UPSTASH_REDIS_REST_URL="https://logical-firefly-14789.upstash.io"
UPSTASH_REDIS_REST_TOKEN="***"
```

**Vercel Integration:**
```bash
VERCEL_OIDC_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Im1yay0***"  # Auto-generated
```

### 🔧 Development & Testing переменные

**Локально управляемые (не из Vercel):**
```bash
# Playwright тестирование
PLAYWRIGHT_PORT="3003"

# AI Fixtures для E2E тестов
AI_FIXTURE_MODE="replay"  # record | replay | passthrough

# Development оптимизация
WEBPACK_LOGGING=false         # Подавление webpack логов
NEXT_TELEMETRY_DISABLED=1     # Отключение Next.js телеметрии  
DEBUG="*,-vite*,-connect*"    # Debug логи настройка
LOG_LEVEL="trace"             # Уровень логирования
```

### 🚀 Добавление новых переменных через Vercel

**Через Vercel Dashboard:**
1. Зайти на [vercel.com/dashboard](https://vercel.com/dashboard)
2. Выбрать проект `welcome-craft-next`
3. Settings → Environment Variables → Add New

**Через Vercel CLI:**
```bash
# Добавить переменную для всех окружений
vercel env add NEW_VARIABLE

# Добавить только для development
vercel env add NEW_VARIABLE development

# Обновить локальные переменные
vercel env pull .env.local
```

### 🚀 Phoenix System Variables (NEW)
```bash
# Environment Management
APP_STAGE="LOCAL"              # Current environment: LOCAL | BETA | PROD
PHOENIX_AUTO_MIGRATE="true"    # Auto-apply migrations in Phoenix
PHOENIX_HEALTH_INTERVAL="300"  # Health check interval (seconds)
PHOENIX_BACKUP_RETENTION="30"  # Backup retention days

# World Management
PHOENIX_WORLD_AUTO_CLEANUP="true"     # Auto cleanup inactive worlds
PHOENIX_WORLD_DEFAULT_TTL="24"        # Default world TTL (hours)
PHOENIX_WORLD_MAX_PER_ENV="100"       # Max worlds per environment

# Alert & Monitoring
PHOENIX_ALERTS_ENABLED="true"         # Enable health alerts
PHOENIX_ALERTS_EMAIL="admin@company.com"  # Alert email
PHOENIX_METRICS_RETENTION="7"         # Metrics retention (days)
```

### Оптимизация разработки
```bash
# Webpack/Next.js подавление логов для чистой консоли
WEBPACK_LOGGING=false
NEXT_TELEMETRY_DISABLED=1
```

---

## 🌍 Мульти-доменная архитектура

### Development
- **`app.localhost:3000`** → Админ-панель (`/app/*` routes)
- **`localhost:3000`** → Публичный сайт (`/site/*` routes)
- **API routes** — доступны на обоих доменах

### Production  
- **`app.welcome-onboard.ru`** → Админ-панель
- **`welcome-onboard.ru`** → Публичный сайт + хостинг (`/s/[site-id]`)

**Важно для тестирования:** E2E тесты используют `app.localhost:PORT`, API тесты — `localhost:PORT`

---

## 🌈 Spectrum Schema-Driven CMS

### Специализированные таблицы БД
- **A_Text** — текстовый контент и код
- **A_Image** — изображения и файлы  
- **A_Site** — сайты (JSON definition)
- **A_Person** — HR данные персонала
- **A_Address** — адресные данные
- **A_FaqItem** — FAQ элементы
- **A_Link** — ссылки и ресурсы
- **A_SetDefinition** — определения наборов
- **A_SetItems** — элементы наборов

### Unified Artifact Tools Registry
**Файл:** `artifacts/kinds/artifact-tools.ts`
- Централизованная система для всех 11 типов артефактов
- Legacy AI Operations (create, update) + Spectrum Operations (save, load, delete)

### File Import System
**Поддерживаемые форматы:** .docx, .xlsx, .csv, .txt, .md, изображения  
**API Endpoint:** `/api/artifacts/import`

---

---

## 🚀 Phoenix System Architecture (ENTERPRISE EDITION)

### Архитектура управления окружениями

**APP_STAGE Environment System:**
- **LOCAL** — Разработка и локальное тестирование
- **BETA** — Staging окружение для предпроизводственного тестирования  
- **PROD** — Production окружение для реальных пользователей

### Phoenix Admin Dashboard

**Компоненты мониторинга:**
- **WorldManagementPanel** — управление тестовыми мирами с filtering и bulk operations
- **EnvironmentStatusPanel** — real-time мониторинг состояния всех окружений
- **SystemMetricsPanel** — комплексная аналитика системы с экспортом данных

### Phoenix CLI Tools

**Health Monitoring:**
```bash
pnpm phoenix:health           # Проверка состояния всех компонентов
pnpm phoenix:health:watch     # Continuous monitoring
```

**Data Management:**
```bash
pnpm phoenix:backup:local     # Backup текущего окружения
pnpm phoenix:transfer         # Миграция данных между окружениями
pnpm phoenix:seed:local       # Заполнение БД тестовыми данными
```

**World Management CLI (✅ РЕАЛИЗОВАНО):**
```bash
# Основные команды
pnpm phoenix:worlds:list [environment]        # Список миров с фильтрацией
pnpm phoenix:worlds:create                    # Интерактивное создание мира
pnpm phoenix:worlds:cleanup [environment]     # Очистка неактивных миров
pnpm phoenix:worlds:seed <worldId>           # Заполнить мир тестовыми данными
pnpm phoenix:worlds:copy <id> <from> <to>    # Копировать между окружениями
pnpm phoenix:worlds:export [json|csv]        # Экспорт конфигурации
pnpm phoenix:worlds:help                     # Справка по командам

# Примеры использования
pnpm phoenix:worlds:list LOCAL               # Миры в LOCAL окружении
pnpm phoenix:worlds:cleanup LOCAL            # Очистка LOCAL миров
pnpm phoenix:worlds:seed UC_TESTING_001      # Заполнить мир данными
pnpm phoenix:worlds:copy UC_001 LOCAL BETA   # Копировать UC_001 из LOCAL в BETA
```

**Архитектура CLI:**
- **Interactive prompts** — Удобный ввод данных через CLI
- **Environment filtering** — Фильтрация по LOCAL/BETA/PROD
- **Database integration** — Прямая работа с WorldMeta таблицей
- **Error handling** — Robust обработка ошибок и валидация

> **📚 CLI Implementation:** Полнофункциональный CLI реализован в `scripts/phoenix-world-manager.ts` с использованием существующей API логики из WorldManagementPanel GUI компонента.

### Phoenix API Endpoints

- **GET /api/phoenix/health** — Health checks и система мониторинга
- **POST /api/phoenix/backup** — Создание резервных копий окружений
- **POST /api/phoenix/transfer** — Миграция данных между окружениями
- **GET /api/phoenix/metrics** — Системная аналитика и метрики

### WorldMeta Database Table

**Динамическое управление тестовыми мирами:**
```sql
worldMeta {
  id: string (PRIMARY KEY)
  name: string
  environment: 'LOCAL' | 'BETA' | 'PROD'
  category: string
  isActive: boolean
  isTemplate: boolean
  autoCleanup: boolean
  cleanupAfterHours: number
  isolationLevel: 'FULL' | 'PARTIAL' | 'NONE'
  tags: string[]
  dependencies: string[]
}
```

---

## 📋 Первые шаги после установки

### Базовая настройка
1. ✅ Убедиться что `pnpm dev` запускается без ошибок
2. ✅ Проверить доступность admin панели: http://app.localhost:3000
3. ✅ Проверить доступность API: http://localhost:3000/api/ping
4. ✅ Запустить быструю проверку тестов: `pnpm test:unit`
5. ✅ Посмотреть БД через: `pnpm db:studio`

### 🚀 Phoenix System Setup (NEW)
6. ✅ Проверить Phoenix health: `pnpm phoenix:health`
7. ✅ Настроить окружение: `APP_STAGE=LOCAL` в `.env.local`
8. ✅ Проверить Phoenix API: http://localhost:3000/api/phoenix/health
9. ✅ Запустить Phoenix тесты: `pnpm test:phoenix:unit`
10. ✅ Изучить Phoenix Admin Dashboard в приложении

**Готово!** Для понимания архитектуры читай `architecture/system-patterns.md`.