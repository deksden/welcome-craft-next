# 🛠️ `.memory-bank/tech-context.md`: Технический Контекст Проекта "WelcomeCraft"

**Версия:** 1.3.0
**Дата:** 2025-06-13
**Статус:** Актуально

### HISTORY:
*   v1.3.0 (2025-06-13): Добавлен Vitest в технологический стек.
*   v1.2.0 (2025-06-13): Добавлена информация о мульти-доменной архитектуре.
*   v1.1.0 (2025-06-12): Добавлена директория `site-blocks`.
*   v1.0.0 (2025-06-10): Начальная версия.

## 1. Технологический стек

-   **Фреймворк:** [Next.js](https://nextjs.org/) (v15.3+ с App Router, Server Components, Server Actions)
-   **Язык:** [TypeScript](https://www.typescriptlang.org/)
-   **Стилизация:** [Tailwind CSS](https://tailwindcss.com/) с плагинами `tailwindcss-animate` и `@tailwindcss/typography`.
-   **UI Компоненты:** [shadcn/ui](https://ui.shadcn.com/)
-   **База данных:** [PostgreSQL](https://www.postgresql.org/) (через Vercel Postgres / Neon)
-   **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
-   **Аутентификация:** [NextAuth.js (Auth.js)](https://authjs.dev/)
-   **Хранилище файлов:** [Vercel Blob](https://vercel.com/storage/blob)
-   **Кэширование/Стримы:** [Redis](https://redis.io/) (через Vercel KV / Upstash) для поддержки возобновляемых стримов AI SDK и "буфера обмена" артефактов.
-   **AI SDK:** [Vercel AI SDK](https://ai-sdk.dev/)
-   **AI Модели:** [Google Gemini](https://ai.google.dev/)
-   **Менеджер пакетов:** [pnpm](https://pnpm.io/)
-   **Тестирование:**
    *   **E2E / Интеграционное:** [Playwright](https://playwright.dev/)
    *   **Юнит-тесты:** [Vitest](https://vitest.dev/)
-   **Линтинг и форматирование:** [Biome.js](https://biomejs.dev/) и ESLint (для специфичных правил Next.js)

## 2. Мульти-доменная архитектура

Проект имеет сложную архитектуру "3 приложения в одном" с разными доменами:

**Production:**
1.  **Лэндинг:** `welcome-onboard.ru` → рендерится из `/site` (публичный)
2.  **Админка:** `app.welcome-onboard.ru` → рендерится из `/app` (с аутентификацией)
3.  **Хостинг сайтов:** `welcome-onboard.ru/s/[site-id]` → рендерится из `/site` (публичный)

**Development:**
1.  **Лэндинг:** `localhost:3000` → рендерится из `/site`
2.  **Админка:** `app.localhost:3000` → рендерится из `/app` (с аутентификацией)
3.  **Хостинг сайтов:** `localhost:3000/s/[site-id]` → рендерится из `/site`

Роутинг контролируется через `middleware.ts`, который перенаправляет запросы в соответствующие папки `/app` или `/site` в зависимости от домена.

**⚠️ ВАЖНО ДЛЯ ТЕСТИРОВАНИЯ:** 
- API routes (`/api/*`) исключены из middleware и доступны на всех доменах
- Playwright тесты должны использовать правильные домены: E2E → `app.localhost:PORT`, API → `localhost:PORT`
- **РЕШЕНА ПРОБЛЕМА С ПОРТАМИ:** Async config Playwright'а теперь использует переменную `PLAYWRIGHT_PORT` для консистентности - предотвращает запуск сервера на одном порту, а тестов на другом

## 3. Структура проекта

```
.
├── .docs/                 # Высокоуровневая документация проекта (RULEZZ, WELCOME-CRAFT)
├── .github/               # CI/CD workflows (Lint, Playwright)
├── .memory-bank/          # Моя рабочая память. Документы для восстановления контекста.
├── app/
│   ├── (auth)/            # Группа роутов для аутентификации
│   ├── (main)/            # Основная группа роутов приложения после логина
│   ├── api/               # API роуты
│   └── site/              # Роуты для публичных сгенерированных сайтов
├── artifacts/
│   └── kinds/             # Реализация каждого типа артефакта ("плагины")
├── components/
│   ├── ui/                # UI-компоненты из shadcn/ui
│   └── (остальные)        # Кастомные компоненты приложения
├── hooks/                 # Кастомные React-хуки
├── lib/
│   ├── ai/                # Логика, связанная с AI (модели, промпты, инструменты)
│   ├── db/                # Drizzle ORM (схема, миграции, запросы)
│   └── (остальные)        # Общие утилиты, константы, типы
├── site-blocks/
│   ├── hero/
│   │   ├── index.tsx      # Компонент блока
│   │   └── definition.ts  # Схема/метаданные блока
│   └── index.ts           # Barrel-файл для регистрации всех блоков
├── tests/
│   ├── e2e/               # E2E тесты Playwright
│   ├── helpers/           # Хелперы для тестов (ui-helpers.ts, test-utils.ts)
│   └── unit/              # Юнит-тесты Vitest
└── ...                    # Конфигурационные файлы
```

## 4. Настройка и запуск

1.  **Установить `pnpm`:** `npm install -g pnpm`
2.  **Клонировать репозиторий.**
3.  **Установить зависимости:** `pnpm install`
4.  **Настроить переменные окружения:** Скопировать `.env.example` в `.env.local` и заполнить значениями.
5.  **Применить миграции БД:** `pnpm db:migrate`
6.  **Запустить dev-сервер:** `pnpm dev`

## 5. Ключевые команды

-   `pnpm dev`: Запуск сервера для разработки.
-   `pnpm build`: Сборка production-версии.
-   `pnpm lint`: Проверка кода линтером.
-   `pnpm format`: Автоматическое форматирование кода.
-   `pnpm test`: Запуск всех E2E-тестов (и routes, и e2e).
-   `pnpm test:routes`: Запуск API/интеграционных тестов (проект routes).
-   `pnpm test:e2e`: Запуск End-to-End тестов (проект e2e).
-   `pnpm test:unit`: Запуск юнит-тестов.
-   `pnpm db:generate`: Генерация новых миграций после изменения схемы в `lib/db/schema.ts`.
-   `pnpm db:studio`: Открыть Drizzle Studio для работы с БД.

Установка компонентов Shadcn UI: `pnpm dlx shadcn@latest add badge`