# 🔥 PHOENIX PROJECT: Трехуровневая Архитектура Окружений

**PHOENIX PROJECT Step 2 COMPLETED** - Настройка окружений LOCAL/BETA/PROD

Версия: 2.0.0  
Дата: 2025-06-30  
Статус: ✅ АКТУАЛЬНАЯ АРХИТЕКТУРА - Current three-tier environment system

---

## 🎯 Обзор архитектуры

WelcomeCraft теперь поддерживает **три полностью изолированных окружения** через единую переменную `APP_STAGE`:

- **LOCAL** - Development с полным тестовым функционалом
- **BETA** - Staging максимально приближенный к production  
- **PROD** - Production окружение с максимальной безопасностью

---

## 🚀 Быстрый старт

### LOCAL Development
```bash
# Настройка LOCAL окружения одной командой
pnpm phoenix:local

# Или пошагово:
pnpm env:local        # Активация .env.local с APP_STAGE=LOCAL
pnpm db:local:up      # Запуск PostgreSQL + Redis для LOCAL
pnpm db:migrate       # Применение миграций
pnpm dev              # Запуск Next.js в dev режиме

# Комбинированная команда для разработки
pnpm phoenix:dev      # LOCAL setup + dev server
```

### BETA Staging
```bash
# Настройка BETA окружения
pnpm phoenix:beta

# Или пошагово:
pnpm env:beta         # Активация .env.local с APP_STAGE=BETA
pnpm db:beta:up       # Запуск PostgreSQL + Redis для BETA
pnpm db:migrate       # Применение миграций
pnpm build && pnpm start  # Production сборка для реалистичного тестирования
```

### PROD Production
```bash
# Настройка PROD окружения (manual setup)
pnpm env:prod         # Активация .env.local с APP_STAGE=PROD
# Далее следовать инструкциям по настройке Vercel/хостинга
```

---

## 📊 Сравнение окружений

| Характеристика | LOCAL | BETA | PROD |
|----------------|-------|------|------|
| **APP_STAGE** | `LOCAL` | `BETA` | `PROD` |
| **NODE_ENV** | `development` | `production` | `production` |
| **Database** | PostgreSQL (localhost:5434) | PostgreSQL (localhost:5435) | Vercel Postgres |
| **Redis** | Redis (localhost:6380) | Redis (localhost:6381) | Vercel KV |
| **Test Sessions** | ✅ Enabled | ✅ Enabled | ❌ Disabled |
| **World Isolation** | ✅ Enabled | ✅ Enabled | ❌ Disabled |
| **Debug Mode** | ✅ Enabled | ✅ Enabled | ❌ Disabled |
| **Hot Reload** | ✅ Next.js dev | ❌ Production build | ❌ Production build |
| **Analytics** | ❌ Disabled | ❌ Disabled | ✅ Enabled |
| **Security** | 🟡 Development | 🟠 Staging | 🔴 Maximum |

---

## 🔧 Управление окружениями

### Переключение между окружениями
```bash
# Переключение на LOCAL
pnpm env:local && pnpm db:local:up

# Переключение на BETA  
pnpm env:beta && pnpm db:beta:up

# Переключение на PROD
pnpm env:prod
```

### Мониторинг состояния
```bash
# Статус всех PHOENIX окружений
pnpm phoenix:status

# Логи конкретного окружения
pnpm db:local:logs    # LOCAL логи
pnpm db:beta:logs     # BETA логи
```

### Очистка и сброс
```bash
# Остановка всех окружений
pnpm phoenix:cleanup

# Полный сброс конкретного окружения (с удалением данных)
pnpm db:local:reset   # LOCAL полный сброс
pnpm db:beta:reset    # BETA полный сброс
```

---

## 📁 Структура файлов

```
welcome-craft-next/
├── .env.example           # Шаблон для LOCAL (APP_STAGE=LOCAL)
├── .env.beta             # Шаблон для BETA (APP_STAGE=BETA)
├── .env.prod             # Шаблон для PROD (APP_STAGE=PROD)
├── .env.local            # Активная конфигурация (создается env:* командами)
├── docker-compose.yml    # TEST окружение (существующее)
├── docker-compose.dev.yml    # LOCAL окружение (новое)
├── docker-compose.beta.yml   # BETA окружение (новое)
├── scripts/db-init/      # Скрипты инициализации БД
│   └── 01-init-extensions.sql
└── PHOENIX-ENVIRONMENTS.md  # Этот файл
```

---

## 🌐 Портовая схема

| Сервис | LOCAL | BETA | TEST | PROD |
|--------|-------|------|------|------|
| **PostgreSQL** | 5434 | 5435 | 5433 | Cloud |
| **Redis** | 6380 | 6381 | 6379 | Cloud |
| **Next.js** | 3000 | 3000 | Dynamic | 443 |

---

## 🔐 Особенности безопасности

### LOCAL Environment
- HTTP cookies (для разработки)
- Test session поддержка включена
- Debug режим активен
- Максимальная гибкость для разработки

### BETA Environment  
- Production-like security settings
- Test session поддержка включена (для QA)
- Resource limits для реалистичного тестирования
- Промежуточный уровень безопасности

### PROD Environment
- HTTPS only cookies
- Все тестовые функции отключены
- Rate limiting включен
- Максимальный уровень безопасности

---

## 🔄 Миграция и развертывание

### Development → BETA
```bash
# 1. Тестирование в LOCAL
pnpm phoenix:dev

# 2. Переход на BETA для staging testing
pnpm phoenix:beta

# 3. Запуск E2E тестов против BETA
APP_STAGE=BETA pnpm test:e2e
```

### BETA → PROD
```bash
# 1. Финальная проверка в BETA
pnpm phoenix:beta

# 2. Настройка PROD переменных
pnpm env:prod
# Редактирование .env.local с production секретами

# 3. Deployment на Vercel/хостинг
vercel deploy --prod
```

---

## 🎯 Следующие шаги

1. **PHOENIX Step 3:** Создание WorldMeta таблицы для динамических миров
2. **PHOENIX Step 4:** Разработка Dev & Admin Tools UI
3. **PHOENIX Step 5:** Скрипты миграции и data-transfer
4. **PHOENIX Step 6:** Comprehensive testing framework

---

## 📚 Дополнительные ресурсы

- **Memory Bank:** `.memory-bank/` - Полная документация проекта
- **Tasks:** `.memory-bank/tasks.md` - Tracking PHOENIX PROJECT progress
- **Architecture:** `.memory-bank/architecture/system-patterns.md` - Системные паттерны

---

> **🔥 PHOENIX PROJECT:** Трансформация WelcomeCraft в enterprise-ready систему с профессиональной архитектурой окружений