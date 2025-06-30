# 🚀 Vercel Environment Management Guide

**Назначение:** Руководство по управлению переменными окружения через Vercel CLI и Dashboard для WelcomeCraft.

**Версия:** 1.0.0  
**Дата:** 2025-06-29  
**Статус:** Актуальный - отражает текущий production-ready подход

---

## 🎯 Философия Vercel-Centric подхода

**WelcomeCraft использует Vercel как единый источник истины для всех переменных окружения.** Это обеспечивает:

- ✅ **Консистентность** между development, staging и production
- ✅ **Безопасность** через централизованное управление секретами
- ✅ **Простота деплоя** - автоматическая синхронизация переменных
- ✅ **Team collaboration** - общий доступ к конфигурации через Dashboard

---

## 🔧 Базовая настройка

### Первичная настройка Vercel CLI

```bash
# 1. Установить Vercel CLI глобально
npm install -g vercel

# 2. Войти в аккаунт (один раз)
vercel login

# 3. Связать проект с Vercel (один раз)
vercel link

# 4. Скачать все переменные окружения
vercel env pull .env.local
```

### Проверка корректности настройки

```bash
# Проверить пользователя
vercel whoami

# Проверить связанный проект
cat .vercel/project.json

# Проверить доступные переменные
vercel env list development
```

---

## 📋 Управление переменными окружения

### Просмотр переменных

```bash
# Все переменные для development
vercel env list development

# Все переменные для production
vercel env list production

# Все переменные для preview (staging)
vercel env list preview

# Скачать актуальные переменные
vercel env pull .env.local

# Принудительно обновить (перезаписать существующий файл)
vercel env pull .env.local --force
```

### Добавление новых переменных

```bash
# Добавить переменную только для development
vercel env add NEW_SECRET development

# Добавить переменную для всех окружений
vercel env add SHARED_CONFIG production preview development

# Добавить переменную с конкретным значением (без интерактивного ввода)
echo "secret-value" | vercel env add API_KEY development
```

### Удаление переменных

```bash
# Удалить переменную из development
vercel env remove OLD_CONFIG development

# Удалить переменную из всех окружений
vercel env remove DEPRECATED_VAR production preview development
```

---

## 🌍 Окружения и их назначение

### Development
- **Назначение:** Локальная разработка
- **Файл:** `.env.local`
- **Особенности:** 
  - Test-session поддержка для E2E тестов
  - Debug режимы включены
  - Webpack логи подавлены для чистой консоли

### Preview (Staging)
- **Назначение:** Staging окружение для ветвей (не main)
- **Деплой:** Автоматически при push в любую ветку кроме main
- **Особенности:**
  - Полный production режим, но отдельная БД
  - Подходит для testing новых фич

### Production
- **Назначение:** Реальный production на main ветке
- **Деплой:** Автоматически при push/merge в main
- **Особенности:**
  - Только NextAuth.js аутентификация (БЕЗ test-session)
  - Production оптимизации включены

---

## 🔐 Безопасность и best practices

### Принципы безопасности

1. **Никогда не коммитить секреты** в git репозиторий
2. **Использовать .env.local** для локальной разработки (файл в .gitignore)
3. **Rotatio секретов** через Vercel Dashboard
4. **Минимальные права доступа** - только необходимые переменные для каждого окружения

### Ротация секретов

```bash
# 1. Обновить секрет в Vercel Dashboard
# 2. Обновить локальные переменные
vercel env pull .env.local --force

# 3. Перезапустить локальный сервер
pnpm dev
```

### Team access

Для работы в команде каждый разработчик должен:

1. Иметь доступ к Vercel проекту
2. Выполнить `vercel login` и `vercel link`
3. Получить переменные через `vercel env pull .env.local`

---

## 🚀 Integration с CI/CD

### Автоматический деплой

Vercel автоматически деплоит проект при:
- **Push в main ветку** → Production деплой
- **Push в любую другую ветку** → Preview деплой
- **Pull Request** → Preview деплой с комментарием

### Переменные окружения в деплое

Переменные автоматически применяются к соответствующим окружениям:
- **Development** переменные → НЕ используются в деплое
- **Preview** переменные → Preview деплои
- **Production** переменные → Production деплой

---

## 🛠️ Troubleshooting

### Распространенные проблемы

**Проблема:** `vercel env pull` не обновляет переменные
```bash
# Решение: принудительное обновление
vercel env pull .env.local --force
```

**Проблема:** "Project not linked"
```bash
# Решение: пересвязать проект
vercel link --yes
```

**Проблема:** "Permission denied"
```bash
# Решение: проверить права доступа к проекту
vercel teams list
vercel project list
```

**Проблема:** Переменные не загружаются в приложение
```bash
# 1. Проверить что переменные скачались
cat .env.local

# 2. Перезапустить dev сервер
pnpm dev

# 3. Проверить import в коде
# Убедиться что переменные используются корректно (process.env.VARIABLE_NAME)
```

### Debug команды

```bash
# Проверить статус авторизации
vercel whoami

# Проверить список проектов
vercel project list

# Проверить конфигурацию проекта
cat .vercel/project.json

# Проверить логи последнего деплоя
vercel logs

# Проверить инспекцию последнего деплоя
vercel inspect
```

---

## 📚 Integration с WelcomeCraft

### Специфичные переменные WelcomeCraft

**Database (автоматически от Vercel Postgres):**
- `DATABASE_URL` - основная строка подключения с пулингом
- `DATABASE_URL_UNPOOLED` - прямое подключение без пулинга
- `NEON_PROJECT_ID` - идентификатор Neon проекта

**AI Services:**
- `GOOGLE_GENERATIVE_AI_API_KEY` - основной AI provider
- `XAI_API_KEY` - дополнительный AI provider (опционально)

**File Storage:**
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob для загрузки файлов

**Sessions & Cache:**
- `REDIS_URL` - Upstash Redis для кэширования и clipboard
- `AUTH_SECRET` - NextAuth.js секрет

### Проверка работоспособности

```bash
# 1. Получить переменные
vercel env pull .env.local

# 2. Запустить приложение
pnpm dev

# 3. Проверить подключение к БД
pnpm db:studio

# 4. Проверить health check
curl http://localhost:3000/api/ping
```

---

## 🎯 Workflow для разработчиков

### Ежедневная работа

```bash
# Утром: обновить переменные если были изменения
vercel env pull .env.local

# Запустить dev сервер
pnpm dev

# При необходимости добавить новую переменную
vercel env add NEW_FEATURE_FLAG development
vercel env pull .env.local --force
```

### При добавлении новых фич

```bash
# 1. Добавить переменную через Dashboard или CLI
vercel env add FEATURE_CONFIG development

# 2. Обновить локальные переменные
vercel env pull .env.local

# 3. Использовать в коде
# const config = process.env.FEATURE_CONFIG

# 4. Для production: добавить в соответствующие окружения
vercel env add FEATURE_CONFIG production preview
```

---

> **Итог:** Vercel-centric подход значительно упрощает управление конфигурацией и обеспечивает enterprise-готовый workflow для WelcomeCraft.
