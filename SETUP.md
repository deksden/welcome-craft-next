# 🚀 WelcomeCraft: Руководство по настройке рабочего окружения

**Версия документа:** 2.1.0
**Дата:** 2025-06-29

Этот документ — **единый источник правды** для полной настройки проекта "WelcomeCraft" на новой машине.

## 1. Предварительные требования

-   **Node.js**: `v20.x` или выше.
-   **pnpm**: `v9.x` или выше (`npm install -g pnpm`).
-   **Git**.
-   **Docker** и **Docker Compose**.

## 2. Автоматическая настройка (Рекомендуемый способ)

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

### 🎯 Критическое разделение баз данных

WelcomeCraft использует **две полностью раздельные** системы баз данных для максимальной стабильности:

#### 🔧 **Локальная БД для Разработки (Phoenix LOCAL)**
- **Назначение:** Ваша постоянная база данных для ежедневной разработки. Данные в ней **сохраняются**.
- **Управление:** `pnpm local:db:up`, `pnpm local:db:down`. (Примечание: эти команды могут отличаться от `pnpm db:migrate` или `pnpm dev` которые используют конфигурацию из `.env.local`. Убедитесь, что используете правильные команды для вашей *локальной постоянной* БД).

#### 🧪 **Эфемерная БД для Тестов**
- **Назначение:** Временная, изолированная база данных **только для `pnpm test`**. Данные в ней **уничтожаются** (контейнер может оставаться, но данные внутри него считаются временными для каждого прогона `pnpm test`).
- **Управление:** **Автоматическое** при запуске `pnpm test`. Команды `pnpm test:db:*` предназначены только для отладки тестов и управляют контейнером `welcomecraft_postgres_test`.

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

## 7. Переменные окружения

### Обязательные (.env.local)
```bash
# Authentication
AUTH_SECRET="your-secret-key"

# Database
POSTGRES_URL="postgresql://..."

# AI API
XAI_API_KEY="your-xai-api-key"

# File Storage
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Redis (optional for development)
REDIS_URL="redis://localhost:6379"

# Webpack/Next.js подавление логов для чистой консоли
WEBPACK_LOGGING=false
NEXT_TELEMETRY_DISABLED=1
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
