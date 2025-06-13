# 🛠️ `.memory-bank/tech-context.md`: Технический Контекст Проекта "WelcomeCraft"

## HISTORY:

* v1.2.0 (2025-06-13): Добавлена информация о мульти-доменной архитектуре.
* v1.1.0 (2025-06-12): Добавлена директория `site-blocks`.
* v1.0.0 (2025-06-10): Начальная версия.

## 1. Технологический стек

- **Фреймворк:** [Next.js](https://nextjs.org/) (v15.3+ с App Router, Server Components, Server Actions)
- **Язык:** [TypeScript](https://www.typescriptlang.org/)
- **Стилизация:** [Tailwind CSS](https://tailwindcss.com/) с плагинами `tailwindcss-animate` и `@tailwindcss/typography`.
- **UI Компоненты:** [shadcn/ui](https://ui.shadcn.com/)
- **База данных:** [PostgreSQL](https://www.postgresql.org/) (через Vercel Postgres / Neon)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Аутентификация:** [NextAuth.js (Auth.js)](https://authjs.dev/)
- **Хранилище файлов:** [Vercel Blob](https://vercel.com/storage/blob)
- **Кэширование/Стримы:** [Redis](https://redis.io/) (через Vercel KV / Upstash) для поддержки возобновляемых стримов AI SDK и "буфера обмена" артефактов.
- **AI SDK:** [Vercel AI SDK](https://ai-sdk.dev/)
- **AI Модели:** [Google Gemini](https://ai.google.dev/)
- **Менеджер пакетов:** [pnpm](https://pnpm.io/)
- **Тестирование E2E:** [Playwright](https://playwright.dev/)
- **Линтинг и форматирование:** [Biome.js](https://biomejs.dev/) и ESLint (для специфичных правил Next.js)

## 1.1. Мульти-доменная архитектура

Проект имеет сложную архитектуру "3 приложения в одном" с разными доменами:

**Production:**
1. **Лэндинг:** `welcome-onboard.ru` → рендерится из `/site` (публичный)
2. **Админка:** `app.welcome-onboard.ru` → рендерится из `/app` (с аутентификацией) 
3. **Хостинг сайтов:** `welcome-onboard.ru/s/[site-id]` → рендерится из `/site` (публичный)

**Development:**
1. **Лэндинг:** `localhost:3000` → рендерится из `/site`
2. **Админка:** `app.localhost:3000` → рендерится из `/app` (с аутентификацией)
3. **Хостинг сайтов:** `localhost:3000/s/[site-id]` → рендерится из `/site`

Роутинг контролируется через `middleware.ts`, который перенаправляет запросы в соответствующие папки `/app` или `/site` в зависимости от домена.

**Важные особенности для тестирования:**
- E2E тесты должны идти на `app.localhost:3000` для админки
- API тесты используют глобальные роуты `/api/*` (доступны из любого домена)
- Требуется аутентификация через NextAuth для доступа к админке
- Для тестов необходимо создавать уникальные пользователи с timestamp

## 2. Структура проекта

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
├── site-blocks/           # <-- НОВОЕ: Изолированные React-компоненты для блоков сайта
│   ├── hero/
│   │   ├── index.tsx      # Компонент блока
│   │   └── definition.ts  # Схема/метаданные блока
│   └── index.ts           # Barrel-файл для регистрации всех блоков
├── tests/
│   └── (остальные)        # E2E тесты и хелперы
└── ...                    # Конфигурационные файлы
```

## 3. Настройка и запуск

1.  **Установить `pnpm`:** `npm install -g pnpm`
2.  **Клонировать репозиторий.**
3.  **Установить зависимости:** `pnpm install`
4.  **Настроить переменные окружения:** Скопировать `.env.example` в `.env.local` и заполнить значениями.
5.  **Применить миграции БД:** `pnpm db:migrate`
6.  **Запустить dev-сервер:** `pnpm dev`

## 4. Ключевые команды

-   `pnpm dev`: Запуск сервера для разработки.
-   `pnpm build`: Сборка production-версии.
-   `pnpm lint`: Проверка кода линтером.
-   `pnpm format`: Автоматическое форматирование кода.
-   `pnpm test`: Запуск E2E-тестов.
-   `pnpm db:generate`: Генерация новых миграций после изменения схемы в `lib/db/schema.ts`.
-   `pnpm db:studio`: Открыть Drizzle Studio для работы с БД.
