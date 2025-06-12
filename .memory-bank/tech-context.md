# 🛠️ `.memory-bank/tech-context.md`: Технический Контекст Проекта "WelcomeCraft"

## 1. Технологический стек

- **Фреймворк:** [Next.js](https://nextjs.org/) (v15.3+ с App Router, Server Components, Server Actions)
- **Язык:** [TypeScript](https://www.typescriptlang.org/)
- **Стилизация:** [Tailwind CSS](https://tailwindcss.com/) с плагинами `tailwindcss-animate` и `@tailwindcss/typography`.
- **UI Компоненты:** [shadcn/ui](https://ui.shadcn.com/)
- **База данных:** [PostgreSQL](https://www.postgresql.org/) (через Vercel Postgres / Neon)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Аутентификация:** [NextAuth.js (Auth.js)](https://authjs.dev/)
- **Хранилище файлов:** [Vercel Blob](https://vercel.com/storage/blob)
- **Кэширование/Стримы:** [Redis](https://redis.io/) (через Vercel KV / Upstash) для поддержки возобновляемых стримов AI SDK.
- **AI SDK:** [Vercel AI SDK](https://ai-sdk.dev/)
- **AI Модели:** [Google Gemini](https://ai.google.dev/)
  - Gemini 2.0 Flash
  - Gemini 2.5 Flash Preview 05-04
  - Gemini 2.0 Flash Image Generation
- **Менеджер пакетов:** [pnpm](https://pnpm.io/)
- **Тестирование E2E:** [Playwright](https://playwright.dev/)
- **Линтинг и форматирование:** [Biome.js](https://biomejs.dev/) и ESLint (для специфичных правил Next.js)

## 2. Структура проекта


```
.
├── .docs/                 # Высокоуровневая документация проекта (RULEZZ, WELCOME-CRAFT)
├── .github/               # CI/CD workflows (Lint, Playwright)
├── .memory-bank/          # Моя рабочая память. Документы для восстановления контекста.
├── app/
│   ├── (auth)/            # Группа роутов для аутентификации (login, register, auth.ts)
│   ├── (main)/            # Основная группа роутов приложения после логина
│   │   ├── artifacts/     # Страница и логика для отображения всех артефактов
│   │   ├── chat/          # Динамические роуты для чатов
│   │   └── layout.tsx     # Основной макет приложения
│   ├── api/               # API роуты (chat, artifacts, files, history)
│   ├── globals.css        # Глобальные стили
│   └── layout.tsx         # Корневой макет
├── artifacts/             # Описание и реализация каждого типа артефакта (клиент + сервер)
├── components/
│   ├── ui/                # UI-компоненты из shadcn/ui
│   └── (остальные)        # Кастомные компоненты приложения
├── hooks/                 # Кастомные React-хуки
├── lib/
│   ├── ai/                # Логика, связанная с AI (модели, промпты, инструменты)
│   ├── artifacts/         # Серверная логика и фабрики для работы с артефактами
│   ├── db/                # Drizzle ORM (схема, миграции, запросы)
│   ├── editor/            # Конфигурация и утилиты для Prosemirror-редактора
│   └── (остальные)        # Общие утилиты, константы, типы
├── tests/
│   ├── e2e/               # E2E тесты на Playwright
│   ├── pages/             # Page Object Models для E2E тестов
│   ├── prompts/           # Моки ответов AI для тестов
│   └── (остальные)        # Фикстуры и хелперы для тестов
├── .env.example           # Пример файла с переменными окружения
├── package.json           # Зависимости и скрипты
└── ...                    # Конфигурационные файлы (drizzle, next, postcss, tsconfig)
```

## 3. Настройка и запуск

1.  **Установить `pnpm`:** `npm install -g pnpm`
2.  **Клонировать репозиторий.**
3.  **Установить зависимости:** `pnpm install`
4.  **Настроить переменные окружения:** Скопировать `.env.example` в `.env.local` и заполнить значениями.
5.  **Применить миграции БД:** `pnpm db:migrate`, `pnpm db:push`
6.  **Запустить dev-сервер:** `pnpm dev`

## 4. Ключевые команды

-   `pnpm dev`: Запуск сервера для разработки.
-   `pnpm build`: Сборка production-версии.
-   `pnpm lint`: Проверка кода линтером.
-   `pnpm format`: Автоматическое форматирование кода.
-   `pnpm test`: Запуск E2E-тестов.
-   `pnpm db:generate`: Генерация новых миграций после изменения схемы в `lib/db/schema.ts`.
-   `pnpm db:studio`: Открыть Drizzle Studio для работы с БД.

## 5. Логирование и отладка

- **Сервер:** Используется `@fab33/fab-logger`. Управляется через переменные `LOG_LEVEL` и `DEBUG`. `DEBUG=*` включает все логи.
- **Клиент:** Используется легковесный `createClientLogger` из `lib/client-logger.ts`. Выводит сообщения в консоль браузера с префиксом `[UI:<Namespace>]` только в режиме разработки.
