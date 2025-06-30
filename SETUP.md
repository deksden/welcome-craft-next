# 🚀 WelcomeCraft: Руководство по настройке рабочего окружения

**Версия документа:** 4.1.0
**Дата:** 2025-06-30
**Обновлено:** Обновлены команды на консистентный паттерн env:db:action + созданы конфигурации для Vercel окружений

Этот документ — **единый источник правды** для полной настройки проекта "WelcomeCraft" на новой машине.

## 1. Предварительные требования

-   **Node.js**: `v20.x` или выше.
-   **pnpm**: `v9.x` или выше (`npm install -g pnpm`).
-   **Git**.
-   **Docker** и **Docker Compose**.
-   **Vercel CLI**: `npm install -g vercel` - для управления переменными окружения и деплоя.
-   **Доступ к Vercel проекту**: Права на чтение/запись переменных окружения в проекте `welcome-craft-next`.

## 2. Vercel-управляемые переменные окружения (Production-готовый подход)

**WelcomeCraft использует Vercel CLI для централизованного управления переменными окружения.** Это обеспечивает консистентность между development, staging и production окружениями.

### 🔑 Получение переменных окружения из Vercel

```bash
# 1. Войти в Vercel CLI (один раз - используй токен, если он предоставлен)
vercel login
# vercel login --token (vercel-token)

# 2. Связать локальный проект с Vercel проектом
vercel link

# 3. Скачать все переменные окружения из Vercel
vercel env pull .env.local
```

**Результат:** Файл `.env.local` будет автоматически создан со всеми production переменными окружения из Vercel dashboard.

### 🔧 Управление переменными через Vercel CLI

```bash
# Просмотр всех переменных для development окружения
vercel env list development

# Добавление новой переменной
vercel env add MY_NEW_SECRET development

# Удаление переменной
vercel env remove OLD_SECRET development

# Обновление локальных переменных после изменений
vercel env pull .env.local
```

### 🌍 Окружения в Vercel

- **`development`** — Локальная разработка (`.env.local`)
- **`preview`** — Staging окружение (ветки кроме main)
- **`production`** — Production окружение (main ветка)

## 3. Автоматическая настройка (Legacy способ)

> **⚠️ Внимание:** Этот способ устарел в пользу Vercel-управляемых переменных окружения. Используйте для случаев, когда нет доступа к Vercel CLI.

Для полной настройки окружения выполните одну команду в корне проекта:
```bash
bash ./setup.sh
```
Этот скрипт автоматически:
1.  Проверит наличие Docker и pnpm.
2.  Установит все зависимости проекта (`pnpm install`).
3.  Установит браузеры для Playwright.
4.  Создаст файлы `.env.local` и `.env.test` из примеров.

После выполнения скрипта вам нужно будет только **заполнить `.env.local`** вашими секретными ключами.

> **💡 Совет:** Для чистой консоли разработки автоматически добавляются переменные подавления webpack логов: `WEBPACK_LOGGING=false` и `NEXT_TELEMETRY_DISABLED=1`.

## 3. Ручная настройка

Если вы предпочитаете настраивать все вручную, следуйте этим шагам:

```bash
# 1. Установить зависимости проекта
pnpm install

# 2. Установить браузеры для Playwright
pnpm exec playwright install --with-deps

# 3. Создать .env.local из .env.example и заполнить его
cp .env.example .env.local

# 4. Создать .env.test для тестовой БД
echo 'POSTGRES_URL="postgresql://testuser:testpassword@localhost:5433/testdb"' > .env.test
```

## 4. Phoenix Project: Архитектура БД

### 🎯 **Критическое разделение DATABASE LOGIC:**

WelcomeCraft использует **ДВЕ ОТДЕЛЬНЫЕ** системы баз данных:

#### 🔧 **ЛОКАЛЬНАЯ БД ДЛЯ РАЗРАБОТКИ (Phoenix LOCAL)**
- **Назначение:** Постоянная база данных для локальной разработки
- **Контейнер:** `welcomecraft_postgres_local` 
- **Порт:** `localhost:5434`
- **Credentials:** `localuser/localpassword/welcomecraft_local`
- **Storage:** Persistent volumes (данные сохраняются между рестартами)
- **Redis:** `welcomecraft_redis_local` на порту `6380`

#### 🧪 **ЭФЕМЕРНАЯ БД ДЛЯ ТЕСТОВ**
- **Назначение:** Временная база данных только для автоматических тестов
- **Контейнер:** `welcomecraft_postgres_test`
- **Порт:** `localhost:5433`
- **Credentials:** `testuser/testpassword/testdb`
- **Storage:** tmpfs (в памяти, уничтожается после тестов)
- **Управление:** Автоматическое внутри тестов

### 🚀 **Режим разработки**
```bash
# Поднять локальную БД для разработки
pnpm local:db:up

# Применить миграции
pnpm db:migrate

# Запустить dev сервер
pnpm dev
```
-   **Админ-панель:** `http://app.localhost:3000`
-   **База данных:** Локальная PostgreSQL (порт 5434)
-   **Redis:** Локальный Redis (порт 6380)

### 🧪 **Режим тестирования**
```bash
pnpm test
```
Эта команда автоматически управляет полным жизненным циклом **ЭФЕМЕРНОЙ** тестовой среды:
-   Запускает временную PostgreSQL базу данных в Docker (порт 5433)
-   Применяет миграции и наполняет ее данными
-   Запускает все Playwright тесты (`routes` и `e2e`)
-   Останавливает и уничтожает базу данных после завершения тестов

**❌ ВАЖНО:** НЕ используйте команды `test:db-*` для разработки! Они предназначены только для автоматических тестов.

## 5. Phoenix Project: Команды управления БД

### 🔧 **Локальная БД для разработки**
```bash
# Поднять локальную БД разработки
pnpm local:db:up

# Остановить локальную БД
pnpm local:db:down

# Сбросить локальную БД (удалить все данные)
pnpm local:db:reset

# Посмотреть логи локальной БД
pnpm local:db:logs

# Полная настройка LOCAL окружения
pnpm phoenix:local

# LOCAL окружение + запуск dev сервера
pnpm phoenix:dev
```

### 🧪 **Эфемерная БД для тестов (только для отладки)**
```bash
# ⚠️ ТОЛЬКО ДЛЯ ОТЛАДКИ - обычно управляется автоматически
pnpm test:db:up          # Запустить эфемерную БД
pnpm test:db:setup       # Накатить миграции и данные
pnpm test:db:down        # Остановить эфемерную БД

# Открыть Drizzle Studio для просмотра данных
pnpm db:studio           # (убедитесь что используется правильная БД)
```

### 📊 **Мониторинг Phoenix системы**
```bash
# Статус всех Phoenix контейнеров
pnpm phoenix:status

# Остановить все Phoenix окружения
pnpm phoenix:cleanup

# Health check системы
pnpm phoenix:health
```

## 6. Основные команды для разработки

### 🔧 **Разработка**
-   `pnpm phoenix:dev`: Полная настройка LOCAL + запуск dev сервера
-   `pnpm dev`: Запустить сервер разработки (требует поднятую БД)
-   `pnpm build`: Собрать production-версию приложения
-   `pnpm start`: Запустить production-сборку

### 🔍 **Качество кода**
-   `pnpm lint`: Проверить код линтером
-   `pnpm typecheck`: Проверка TypeScript

### 🧪 **Тестирование**
-   `pnpm test`: Запустить все тесты (E2E + Routes) с эфемерной БД
-   `pnpm test:unit`: Запустить только unit-тесты
-   `pnpm test:routes`: Запустить только API тесты
-   `pnpm test:e2e`: Запустить только E2E тесты

### 💾 **База данных**
-   `pnpm db:migrate`: Применить миграции к текущей БД
-   `pnpm db:studio`: Открыть Drizzle Studio для работы с БД
-   `pnpm db:generate`: Сгенерировать миграции после изменения схемы

### 🚀 **Phoenix Project**
-   `pnpm phoenix:local`: Настроить LOCAL окружение
-   `pnpm phoenix:status`: Статус всех Phoenix контейнеров
-   `pnpm phoenix:health`: Health check системы

## 7. Конфигурации для разных окружений

### 🎯 **Предподготовленные конфигурации**

В проекте созданы готовые конфигурации для всех трех окружений:

**LOCAL Development (.env.local.example):**
- Локальная PostgreSQL БД на порту 5434
- Локальный Redis на порту 6380
- Максимальный debug для разработки

**BETA Staging (.env.beta.example):**
- Staging Neon PostgreSQL БД
- Staging Upstash Redis
- Средний уровень логирования

**PRODUCTION (.env.prod.example):**
- Production Neon PostgreSQL БД  
- Production Upstash Redis
- Минимальный уровень логирования

### 🔧 **Быстрое переключение окружений**

```bash
# Переключиться на LOCAL окружение
pnpm env:local

# Переключиться на BETA окружение  
pnpm env:beta

# Переключиться на PROD окружение
pnpm env:prod
```

### 📋 **Что добавить в Vercel для каждого окружения**

**Development Environment (Vercel):**
- Используйте переменные из `.env.local.example`
- Замените `your-*-here` на реальные ключи
- APP_STAGE=LOCAL

**Preview Environment (Vercel):**
- Используйте переменные из `.env.beta.example`
- Настройте staging базы данных
- APP_STAGE=BETA

**Production Environment (Vercel):**
- Используйте переменные из `.env.prod.example`
- Настройте production базы данных
- APP_STAGE=PROD

## 8. Переменные окружения (Vercel-managed)

### 🎯 Рекомендуемый подход: Vercel CLI

**Все переменные окружения управляются через Vercel Dashboard и синхронизируются локально через CLI:**

```bash
# Получить актуальные переменные из Vercel
vercel env pull .env.local

# Проверить какие переменные доступны локально
cat .env.local
```

### 📋 Автоматически управляемые переменные (из Vercel)

**Database (Local Development):**
- `DATABASE_URL` - локальная PostgreSQL: `postgresql://localuser:localpassword@localhost:5434/welcomecraft_local`
- `DATABASE_URL_UNPOOLED` - прямое подключение к локальной БД
- `POSTGRES_URL` / `POSTGRES_PRISMA_URL` - для ORM
- `NEON_PROJECT_ID` - идентификатор проекта Neon (для production)

**Authentication:**
- `AUTH_SECRET` - секретный ключ для NextAuth.js

**AI Services:**
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google Gemini API
- `XAI_API_KEY` - xAI Grok API (опционально)

**File Storage:**
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob Storage

**Cache & Sessions:**
- `REDIS_URL` - локальный Redis: `redis://localhost:6380` или Upstash (production)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis (fallback)

**Phoenix Project Configuration:**
- `APP_STAGE=LOCAL` - текущее окружение (LOCAL/BETA/PROD)

**Vercel Integration:**
- `VERCEL_OIDC_TOKEN` - токен для интеграции с Vercel API

**Development Optimization:**
- `WEBPACK_LOGGING=false` - подавление webpack логов
- `NEXT_TELEMETRY_DISABLED=1` - отключение телеметрии
- `DEBUG="*,-vite*,-connect*,-micromark*"` - настройка debug логов
- `LOG_LEVEL=trace` - уровень логирования

### 🔧 Добавление новых переменных

**Через Vercel Dashboard:**
1. Перейти в [Vercel Dashboard](https://vercel.com/dashboard)
2. Выбрать проект `welcome-craft-next`
3. Settings → Environment Variables
4. Add New → указать имя, значение и окружения

**Через Vercel CLI:**
```bash
# Добавить переменную для development
vercel env add NEW_VARIABLE development

# Добавить переменную для всех окружений
vercel env add NEW_VARIABLE production preview development

# Обновить локальные переменные
vercel env pull .env.local
```

### Автоматически создаваемые (.env.test)
```bash
# Test Database (Docker)
POSTGRES_URL="postgresql://testuser:testpassword@localhost:5433/testdb"
```

## 8. Phoenix Project: Архитектура системы

WelcomeCraft использует enterprise-готовую архитектуру с Phoenix Project трехуровневой системой окружений:

### 🌍 **Phoenix Three-Stage Environment Architecture**

#### 🔧 **LOCAL Environment (localhost)**
- **Домены:** `app.localhost:3000` (админ), `localhost:3000` (публичный)
- **Database:** `welcomecraft_postgres_local` на порту `5434`
- **Redis:** `welcomecraft_redis_local` на порту `6380`
- **Storage:** Persistent volumes для сохранения данных разработки
- **APP_STAGE:** `LOCAL`

#### 🎭 **BETA Environment (staging)**
- **Database:** `welcomecraft_postgres_beta` на порту `5435`
- **Redis:** `welcomecraft_redis_beta` на порту `6381`
- **Назначение:** Pre-production тестирование
- **APP_STAGE:** `BETA`

#### 🚀 **PROD Environment (production)**
- **Хостинг:** Vercel deployment
- **Database:** Neon PostgreSQL (cloud)
- **Redis:** Upstash Redis (cloud)
- **APP_STAGE:** `PROD`

### 🧪 **Эфемерная тестовая БД (отдельно от окружений)**
- **Docker PostgreSQL** контейнер для изолированного тестирования
- **Автоматические миграции и сидинг** через Playwright globalSetup
- **tmpfs хранение** для максимальной производительности
- **Полная изоляция** от development/staging/production данных

### 🔄 **Unified Local-Prod Testing**
- Все тесты запускаются против production сборки (`next build`)
- Динамические порты для параллельного тестирования
- AI Fixtures для детерминистичных E2E тестов
- **Критическое разделение:** разработка (LOCAL) vs тестирование (эфемерная БД)

## 9. Troubleshooting

### Docker не запускается
```bash
# Проверить статус Docker
docker --version
docker-compose --version

# Запустить Docker Desktop (macOS/Windows)
open -a Docker
```

### Порт уже занят
```bash
# Найти процесс на порту 3000
lsof -ti:3000

# Убить процесс
kill -9 <PID>
```

### Ошибки миграции БД
```bash
# Сбросить БД и пересоздать
pnpm test:db-down
pnpm test:db-up
pnpm test:db-setup
```

### Playwright браузеры не установлены
```bash
# Переустановить браузеры
pnpm exec playwright install --with-deps
```

### Засорение консоли webpack логами
```bash
# Убедиться что переменные подавления логов установлены
echo "DEBUG=" >> .env.local
echo "WEBPACK_LOGGING=false" >> .env.local
echo "NEXT_TELEMETRY_DISABLED=1" >> .env.local

# Перезапустить dev сервер
pnpm dev
```

> **💡 Решение:** Проект использует многоуровневую систему подавления логов:
> - `next.config.ts` - подавление webpack плагинов на уровне конфигурации
> - Переменные окружения - `DEBUG=""`, `WEBPACK_LOGGING=false`, `NEXT_TELEMETRY_DISABLED=1`
> - `scripts/start-silent-server.sh` - grep фильтрация для route тестов

### Логи `next:jsconfig-paths-plugin` в тестах
```bash
# Для полного подавления debug логов в route тестах используется silent server script
# Автоматически активируется в playwright.config.ts
# Дополнительно можно запустить вручную:
bash scripts/start-silent-server.sh pnpm start --port 3000
```

### Проблемы с Vercel CLI

```bash
# Не удается подключиться к Vercel
vercel login
vercel link  # Пересвязать проект

# Переменные окружения не обновляются
vercel env pull .env.local --force  # Принудительное обновление

# Проверить статус связи с проектом
vercel project list
vercel whoami

# Проблемы с правами доступа
# 1. Убедиться что у пользователя есть права на проект
# 2. Проверить что проект связан правильно: cat .vercel/project.json
```

### Отсутствующие переменные окружения

```bash
# Проверить какие переменные доступны в Vercel
vercel env list development
vercel env list production

# Добавить отсутствующие переменные через Dashboard или CLI
vercel env add MISSING_VARIABLE development

# Обновить локальный файл
vercel env pull .env.local

# Проверить что переменные загрузились
grep MISSING_VARIABLE .env.local
```
