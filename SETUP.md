# 🚀 WelcomeCraft: Руководство по настройке рабочего окружения

**Версия документа:** 3.0.0
**Дата:** 2025-06-29
**Обновлено:** Добавлен Vercel-centric подход к управлению переменными окружения

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
# 1. Войти в Vercel CLI (один раз)
vercel login

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

## 4. Запуск приложения

### Режим разработки
```bash
pnpm dev
```
-   **Админ-панель:** `http://app.localhost:3000`
-   **Основная база данных (dev):** Настраивается в `.env.local`.

### Режим тестирования
```bash
pnpm test
```
Эта команда автоматически управляет полным жизненным циклом тестовой среды:
-   Запускает временную PostgreSQL базу данных в Docker.
-   Применяет миграции и наполняет ее данными.
-   Запускает все Playwright тесты (`routes` и `e2e`).
-   Останавливает и уничтожает базу данных после завершения тестов.

## 5. Работа с тестовой базой данных (для отладки)

Иногда может потребоваться запустить и исследовать тестовую БД вручную.

```bash
# Запустить контейнер с тестовой БД
pnpm test:db-up

# Накатить миграции и наполнить данными
pnpm test:db-setup

# Открыть Drizzle Studio для просмотра данных
pnpm db:studio # (убедитесь, что .env.test используется)

# Остановить и удалить контейнер
pnpm test:db-down
```

## 6. Основные команды для разработки

-   `pnpm dev`: Запустить сервер для разработки.
-   `pnpm build`: Собрать production-версию приложения.
-   `pnpm start`: Запустить production-сборку.
-   `pnpm lint`: Проверить код линтером.
-   `pnpm typecheck`: Проверка TypeScript.
-   `pnpm test`: Запустить все тесты (E2E + Routes).
-   `pnpm test:unit`: Запустить только unit-тесты.
-   `pnpm test:routes`: Запустить только API тесты.
-   `pnpm test:e2e`: Запустить только E2E тесты.
-   `pnpm db:migrate`: Применить миграции базы данных.
-   `pnpm db:studio`: Открыть Drizzle Studio для работы с БД.
-   `pnpm db:generate`: Сгенерировать миграции после изменения схемы.

## 7. Переменные окружения (Vercel-managed)

### 🎯 Рекомендуемый подход: Vercel CLI

**Все переменные окружения управляются через Vercel Dashboard и синхронизируются локально через CLI:**

```bash
# Получить актуальные переменные из Vercel
vercel env pull .env.local

# Проверить какие переменные доступны локально
cat .env.local
```

### 📋 Автоматически управляемые переменные (из Vercel)

**Database (Neon PostgreSQL):**
- `DATABASE_URL` / `POSTGRES_URL` - основная строка подключения
- `DATABASE_URL_UNPOOLED` / `POSTGRES_URL_NON_POOLING` - прямое подключение
- `POSTGRES_PRISMA_URL` - для ORM
- `NEON_PROJECT_ID` - идентификатор проекта Neon

**Authentication:**
- `AUTH_SECRET` - секретный ключ для NextAuth.js

**AI Services:**
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google Gemini API
- `XAI_API_KEY` - xAI Grok API (опционально)

**File Storage:**
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob Storage

**Cache & Sessions:**
- `REDIS_URL` / `UPSTASH_REDIS_REST_URL` - Redis для кэширования
- `UPSTASH_REDIS_REST_TOKEN` - токен авторизации

**Vercel Integration:**
- `VERCEL_OIDC_TOKEN` - токен для интеграции с Vercel API

**Development Optimization:**
- `WEBPACK_LOGGING=false` - подавление webpack логов
- `NEXT_TELEMETRY_DISABLED=1` - отключение телеметрии
- `DEBUG` - настройка debug логов

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

## 8. Архитектура системы

WelcomeCraft использует современную архитектуру с несколькими ключевыми особенностями:

### Мультидоменное приложение
- **`app.localhost:3000`** — Админ-панель для HR-специалистов
- **`localhost:3000`** — Публичные сайты для новых сотрудников

### Эфемерная тестовая БД
- **Docker PostgreSQL** контейнер для изолированного тестирования
- **Автоматические миграции и сидинг** через Playwright globalSetup
- **tmpfs хранение** для максимальной производительности

### Unified Local-Prod Testing
- Все тесты запускаются против production сборки (`next build`)
- Динамические порты для параллельного тестирования
- AI Fixtures для детерминистичных E2E тестов

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
