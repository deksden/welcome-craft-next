# 🌍 Worlds Manifest: Тестовые Миры WelcomeCraft

**Версия:** 1.0.0  
**Дата:** 2025-06-18  
**Назначение:** Документация тестовых "миров" - изолированных наборов данных для E2E тестирования

---

## 🎯 Концепция Worlds

**"Мир" (World)** - это изолированный набор предустановленных данных (пользователи, артефакты, чаты) для конкретного тестового сценария. Каждый Use Case ссылается на определенный мир, что обеспечивает:

- **Изоляцию тестов** - каждый тест начинается с известного состояния
- **Переиспользование** - один мир может использоваться в нескольких тестах
- **Детерминизм** - одинаковые начальные условия для воспроизводимых результатов
- **Читаемость** - ясное понимание контекста теста

---

## 📋 Доступные Миры

### 1. `CLEAN_USER_WORKSPACE`
**Назначение:** Чистое пространство для AI-генерации контента с нуля  
**Use Cases:** UC-02 (AI Site Generation)

**Данные:**
- **Пользователь:** Sarah Wilson (HR Manager)
- **Артефакты:** Минимальный набор базовых шаблонов (HR контакты, полезные ссылки)
- **Чаты:** Пустые
- **Особенности:** Включена AI fixtures система

---

### 2. `SITE_READY_FOR_PUBLICATION`
**Назначение:** Готовый site артефакт для тестирования публикации  
**Use Cases:** UC-01 (Site Publication)

**Данные:**
- **Пользователь:** Ada Thompson (HR Manager)
- **Артефакты:** 
  - Полностью готовый site "Onboarding для разработчика"
  - Welcome текст от CEO
  - Контакты команды разработки
- **Статус:** Артефакты НЕ опубликованы (для тестирования процесса публикации)
- **Особенности:** TTL настройки, Publication система включена

---

### 3. `CONTENT_LIBRARY_BASE`
**Назначение:** Библиотека переиспользуемого контента  
**Use Cases:** UC-03 (Artifact Reuse)

**Данные:**
- **Пользователь:** Maria Garcia (HR Manager)
- **Артефакты:**
  - Welcome от CEO (переиспользуемый)
  - Стандартные HR контакты
  - Комплексный список полезных ссылок
  - Пустой шаблон сайта
- **Особенности:** Clipboard система включена, все артефакты с тегами для поиска

---

### 4. `DEMO_PREPARATION`
**Назначение:** Готовая демонстрация для публикации чатов  
**Use Cases:** UC-04 (Chat Publication)

**Данные:**
- **Пользователь:** David Chen (HR Manager)
- **Артефакты:** Завершенный демо-сайт онбординга
- **Чаты:** Полная история создания сайта через AI диалог
- **Особенности:** Extended TTL (3 часа), предзаполненные сообщения

---

### 5. `ENTERPRISE_ONBOARDING`
**Назначение:** Корпоративная среда для сложных сценариев  
**Use Cases:** UC-05 (Multi-Artifact Creation)

**Данные:**
- **Пользователь:** Elena Rodriguez (Admin)
- **Артефакты:**
  - Шаблоны для разных ролей (Technical Lead)
  - Корпоративные контакты команд
  - Техническая документация
- **Особенности:** Все системы включены, enterprise-level контент

---

## 🔧 Техническая Архитектура

### Конфигурация
- **Файл:** `tests/helpers/worlds.config.ts`
- **Типы:** TypeScript интерфейсы для всех сущностей
- **Валидация:** Автоматическая проверка целостности данных

### Структура данных
```typescript
interface WorldDefinition {
  id: WorldId
  name: string
  description: string
  users: WorldUser[]
  artifacts: WorldArtifact[]
  chats: WorldChat[]
  settings: WorldSettings
}
```

### Файловая структура
```
tests/fixtures/worlds/
├── base/                    # CLEAN_USER_WORKSPACE
│   ├── hr-contacts.csv
│   └── useful-links.md
├── publication/             # SITE_READY_FOR_PUBLICATION  
│   ├── developer-site-complete.json
│   ├── ceo-welcome.md
│   └── dev-team-contacts.csv
├── library/                 # CONTENT_LIBRARY_BASE
│   ├── ceo-welcome-reusable.md
│   ├── hr-contacts-standard.csv
│   ├── useful-links-comprehensive.md
│   └── empty-site-template.json
├── demo/                    # DEMO_PREPARATION
│   ├── complete-demo-site.json
│   └── ai-site-creation-chat.json
└── enterprise/              # ENTERPRISE_ONBOARDING
    ├── tech-lead-template.md
    ├── dev-team-contacts.csv
    └── tech-stack-docs.md
```

---

## 🚀 Использование в тестах

### Инициализация мира
```typescript
import { setupWorld, cleanupWorld } from '@/tests/helpers/world-setup'
import { WORLDS } from '@/tests/helpers/worlds.config'

test('UC-01: Site Publication', async ({ page }) => {
  // Инициализация мира
  const world = await setupWorld('SITE_READY_FOR_PUBLICATION')
  
  // Тест работает с предустановленными данными
  await page.goto(`/artifacts`)
  await expect(page.getByTestId('artifact-developer-onboarding')).toBeVisible()
  
  // Автоматическая очистка (если autoCleanup: true)
})
```

### Доступ к данным мира
```typescript
const worldDef = getWorldDefinition('SITE_READY_FOR_PUBLICATION')
const mainUser = worldDef.users[0] // Ada Thompson
const siteArtifact = worldDef.artifacts.find(a => a.kind === 'site')
```

---

## 🔄 Жизненный цикл

### Создание мира
1. **Валидация** - проверка целостности конфигурации
2. **Инициализация** - создание пользователей и базовых данных  
3. **Заполнение** - загрузка артефактов и чатов из fixture файлов
4. **Готовность** - мир готов к выполнению тестов

### Очистка мира
1. **Автоматическая** - если `autoCleanup: true` в настройках
2. **Ручная** - через `cleanupWorld()` вызов
3. **TTL** - автоматическое истечение временных данных

---

## 🛡️ Изоляция и Безопасность

### Изоляция данных
- **Независимость** - миры не влияют друг на друга
- **Восстановление** - каждый тест начинается с чистого состояния
- **Параллельность** - возможность параллельного выполнения тестов

### Безопасность тестов  
- **Тестовые учетные записи** - специальные пользователи только для тестов
- **Защита продакшена** - невозможность случайного воздействия на реальные данные
- **Временность** - автоматическая очистка тестовых данных

---

## 📈 Развитие системы

### Phase 2: Database Isolation
- Добавление `world_id` полей в схему БД
- Middleware для автоматической фильтрации по world_id
- Миграции с backward compatibility

### Phase 3: AI Fixtures Integration
- Связь миров с AI фикстурами
- Автоматическая запись/воспроизведение AI взаимодействий
- Consistent AI responses для каждого мира

### Phase 4: Advanced Features
- Динамическое создание миров
- Композиция миров из базовых компонентов
- Визуальный редактор миров

---

> **Философия:** Каждый мир должен рассказывать историю - представлять реальный бизнес-сценарий, в котором пользователь решает конкретную задачу с помощью WelcomeCraft.