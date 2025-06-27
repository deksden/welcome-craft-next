# 🛠️ Технический Контекст: Настройка и Запуск

**Назначение:** Помочь новому разработчику (или ИИ) быстро запустить проект.

**Версия:** 3.0.0  
**Дата:** 2025-06-22  
**Статус:** Рефакторированная версия - только настройка и запуск

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

### Установка и запуск
```bash
# 1. Клонировать репозиторий
git clone <repository-url>
cd welcome-craft-next

# 2. Установить зависимости
pnpm install

# 3. Настроить переменные окружения
cp .env.example .env.local
# Заполнить .env.local необходимыми значениями

# 4. Применить миграции БД
pnpm db:migrate

# 5. Запустить dev-сервер
pnpm dev
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

### Разработка
```bash
pnpm dev              # Запуск сервера разработки
pnpm build            # Сборка production-версии
pnpm start            # Запуск production сервера
```

### Качество кода
```bash
pnpm lint             # Проверка линтером
pnpm format           # Автоматическое форматирование
pnpm typecheck        # Проверка TypeScript
```

### База данных
```bash
pnpm db:generate      # Генерация миграций (после изменения schema.ts)
pnpm db:migrate       # Применение миграций
pnpm db:studio        # Drizzle Studio для работы с БД
pnpm db:reset         # Сброс БД (осторожно!)
```

### Тестирование
```bash
pnpm test             # Все E2E тесты (routes + e2e)
pnpm test:routes      # API/интеграционные тесты (82 теста)
pnpm test:e2e         # End-to-End тесты (16 тестов)
pnpm test:unit        # Юнит-тесты (94 теста)
```

### UI компоненты
```bash
pnpm dlx shadcn@latest add <component>  # Установка shadcn/ui компонентов
```

---

## 📂 Структура проекта

```
.
├── app/
│   ├── (auth)/            # Аутентификация
│   ├── (main)/            # Основное приложение
│   ├── api/               # API роуты
│   └── site/              # Публичные сайты
├── artifacts/kinds/       # Плагины артефактов
├── components/ui/         # UI компоненты (shadcn/ui)
├── site-blocks/           # Модульные блоки сайтов
├── lib/
│   ├── ai/                # AI логика и промпты
│   ├── db/                # База данных (Drizzle)
│   └── ...                # Утилиты
├── tests/
│   ├── e2e/               # E2E тесты (Playwright)
│   ├── routes/            # API тесты (Playwright)
│   └── unit/              # Юнит-тесты (Vitest)
└── .memory-bank/          # Документация и знания
```

---

## 🔐 Переменные окружения (.env.local)

### Обязательные
```bash
# Database
DATABASE_URL="postgresql://..."
DATABASE_DIRECT_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# AI (Google Gemini)
GOOGLE_GENERATIVE_AI_API_KEY="your-api-key"

# Redis (для production)
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="your-token"
```

### Опциональные (для тестирования)
```bash
# Playwright
PLAYWRIGHT_PORT="3003"

# AI Fixtures
AI_FIXTURE_MODE="replay"  # record | replay | passthrough
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

## 🧪 UC-10 Schema-Driven CMS

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
- Legacy AI Operations (create, update) + UC-10 Operations (save, load, delete)

### File Import System
**Поддерживаемые форматы:** .docx, .xlsx, .csv, .txt, .md, изображения  
**API Endpoint:** `/api/artifacts/import`

---

## 📋 Первые шаги после установки

1. ✅ Убедиться что `pnpm dev` запускается без ошибок
2. ✅ Проверить доступность admin панели: http://app.localhost:3000
3. ✅ Проверить доступность API: http://localhost:3000/api/ping
4. ✅ Запустить быструю проверку тестов: `pnpm test:unit`
5. ✅ Посмотреть БД через: `pnpm db:studio`

**Готово!** Для понимания архитектуры читай `architecture/system-patterns.md`.