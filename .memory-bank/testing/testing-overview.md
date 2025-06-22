# 🧪 Стратегия и Паттерны Тестирования

**Назначение:** Описание подходов к тестированию, инструментов и паттернов.

**Версия:** 7.0.0  
**Дата:** 2025-06-22  
**Статус:** UC-10 интеграция - обновлена секция E2E тестов с новыми UC-11, UC-02 v2.0 и SiteEditorPage POM

---

## 🎯 Философия тестирования

WelcomeCraft использует **гибридную стратегию тестирования** для высокой скорости разработки и максимальной надежности.

### Пирамида тестирования
1. **Unit Tests (Vitest)** — быстрая проверка изолированной логики
2. **Route Tests (Playwright)** — API endpoints и интеграция компонентов  
3. **E2E Tests (Playwright)** — сквозные пользовательские сценарии

---

## 🛠️ Стек инструментов

### Playwright (E2E + API)
- **E2E Testing:** Полные пользовательские сценарии
- **Route Testing:** API endpoints и интеграционные тесты
- **Multi-domain Support:** `app.localhost` vs `localhost` архитектура

### Vitest (Unit)
- **Юнит-тесты:** Изолированная бизнес-логика
- **Мокирование:** Все внешние зависимости (БД, API, `server-only`)

---

## 🏗️ Архитектурные паттерны тестирования

### 1. Direct Cookie Header Pattern v2.0.0

**Назначение:** Быстрое и стабильное API тестирование без UI зависимостей.

**Принцип:**
```typescript
// Создание test-session через HTTP заголовки
const sessionData = {
  user: { id: userId, email, name: email, type: 'regular' },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
}

const newContext = await browser.newContext({
  baseURL: appURL,
  extraHTTPHeaders: {
    'Cookie': `test-session-fallback=${encodeURIComponent(JSON.stringify(sessionData))}`,
    'X-Test-Environment': 'playwright',
  },
})
```

**Преимущества:**
- ⚡ **Быстрота:** ~3 секунды на контекст (vs 15 секунд UI-подход)
- 🎯 **Стабильность:** Нет race conditions с middleware
- 🔒 **Изоляция:** API тесты независимы от UI

**Результаты:** 380% рост проходящих route тестов (10→48→82)

### 2. Use Cases + Worlds + AI Fixtures System

**Принцип:** Трехуровневая система для детерминистичного E2E тестирования.

**Структура:**
```typescript
// 1. Use Case спецификация
UC-01-Site-Publication.md // Бизнес-требования

// 2. World definition
SITE_READY_FOR_PUBLICATION // Изолированное тестовое окружение

// 3. AI Fixtures
tests/fixtures/ai/UC-01/ // Записанные AI-ответы для replay
```

**Workflow:**
1. **Record mode:** `AI_FIXTURE_MODE=record` — запись реальных AI ответов
2. **Replay mode:** `AI_FIXTURE_MODE=replay` — детерминистичное воспроизведение
3. **World isolation:** Каждый тест в изолированном окружении

### 3. Page Object Model (POM)

**Принцип:** Инкапсуляция UI логики в переиспользуемые классы.

```typescript
// tests/pages/auth-page.ts
export class AuthPage {
  constructor(private page: Page) {}
  
  async registerUser(email: string, password: string) {
    await this.page.getByTestId('auth-email-input').fill(email)
    await this.page.getByTestId('auth-password-input').fill(password)
    await this.page.getByTestId('auth-submit-button').click()
  }
}
```

**Преимущества:**
- 📦 **Переиспользование:** Один метод для множества тестов
- 🛡️ **Стабильность:** Изоляция изменений UI от тестов
- 📝 **Читаемость:** Декларативный синтаксис тестов

---

## 📋 data-testid система

### Принцип
Каждый интерактивный элемент имеет уникальный `data-testid` для стабильного тестирования.

### Схема именования
`{зона}-{компонент}-{описание}`

### Зоны тестирования
- **`auth-*`** — аутентификация (email-input, password-input, submit-button)
- **`header-*`** — шапка приложения (new-chat-button, share-button, user-menu)
- **`sidebar-*`** — боковая панель (artifacts-list, chat-list, settings)
- **`chat-input-*`** — зона ввода (textarea, send-button, attach-menu)
- **`artifact-*`** — панель артефактов (content, actions, editors)

---

## 🧪 UC-10 Schema-Driven Testing Patterns

### Artifact Savers Testing
```typescript
// tests/unit/artifacts/savers/person-saver.test.ts
describe('Person Saver', () => {
  it('should save person data to A_Person table', async () => {
    const artifact = createMockArtifact({ kind: 'person' })
    const personContent = JSON.stringify({
      fullName: 'John Doe',
      position: 'Software Engineer'
    })
    
    await personSaver.save(artifact, personContent)
    
    expect(db.insert).toHaveBeenCalledWith(personTable)
  })
})
```

### File Import Testing
```typescript
// tests/e2e/features/file-import.test.ts
test('should import .docx file and create text artifact', async ({ page }) => {
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles('./test-files/sample.docx')
  
  await expect(page.getByTestId('artifact-preview')).toBeVisible()
  
  const artifactKind = await page.getByTestId('artifact-kind').textContent()
  expect(artifactKind).toBe('text')
})
```

---

## 📊 Структура тестов

```
tests/
├── e2e/                    # E2E тесты (Playwright)
│   ├── use-cases/          # Use Case тесты (UC-01, UC-02...)
│   └── regression/         # Регрессионные тесты (BUG-XXX)
├── routes/                 # API тесты (Playwright) 
│   ├── artifact.test.ts    # Артефакты CRUD
│   ├── auth.test.ts        # Аутентификация
│   └── history.test.ts     # История и пагинация
├── unit/                   # Юнит-тесты (Vitest)
│   ├── artifacts/          # Логика артефактов
│   ├── lib/                # Утилиты и библиотеки
│   └── api/                # API хелперы
├── fixtures/               # Тестовые данные
│   ├── ai/                 # AI fixtures для replay
│   ├── worlds/             # World definitions
│   └── files/              # Файлы для импорта
└── helpers/                # Хелперы и POM классы
    ├── auth-helper.ts      # Аутентификация
    ├── test-utils.ts       # Общие утилиты
    └── ui-helpers.ts       # UI взаимодействие
```

---

## 🎯 Текущий статус тестов

### Результаты (2025-06-22)
- ✅ **Route Tests:** 82/82 (100%) — ИДЕАЛЬНЫЙ РЕЗУЛЬТАТ
- ✅ **Unit Tests:** 94/94 (100%) — полное покрытие UC-10  
- ⚠️ **E2E Tests:** Аутентификация исправлена, но заблокированы server-side ошибками
- ✅ **Regression Tests:** 9/9 (100%) — все баги покрыты

### E2E Status Update (2025-06-22)
- ✅ **Аутентификация:** Direct Cookie Header Pattern работает
- ❌ **Архитектурная проблема:** server-only модули импортируются на клиенте
- 📁 **Новые файлы:** `tests/e2e-fixtures.ts`, `tests/helpers/e2e-auth-helper.ts`

### Качество кода
- ✅ **TypeScript:** 0 ошибок
- ✅ **Lint:** 0 предупреждений  
- ✅ **Build:** успешная сборка

---

## 🚀 Лучшие практики

### API Testing
```typescript
// ✅ Используй Direct Cookie Header Pattern
const context = await browser.newContext({
  extraHTTPHeaders: {
    'Cookie': `test-session-fallback=${sessionCookie}`
  }
})
```

### E2E Testing  
```typescript
// ✅ Используй POM и data-testid
const authPage = new AuthPage(page)
await authPage.registerUser(email, password)
await expect(page.getByTestId('welcome-message')).toBeVisible()

// ✅ UC-10 интеграция: Site Editor POM
const siteEditor = new SiteEditorPage(page)
await siteEditor.addSiteBlock('hero')
await siteEditor.addArtifactToSlot(0, 'heading', 0)
```

### Unit Testing  
```typescript
// ✅ Мокируй все внешние зависимости
vi.mock('@/lib/db/connection')
vi.mock('server-only')
```

### Что НЕ делать
```typescript
// ❌ Избегай server-only импортов в E2E тестах
import { getWorldData } from '../../helpers/worlds' // server-only

// ❌ Не используй хрупкие селекторы
await page.click('button:nth-child(3)') // плохо
await page.getByTestId('submit-button').click() // хорошо
```

---

## 🔧 Команды тестирования

```bash
# Все тесты
pnpm test              # E2E + Route тесты
pnpm test:unit         # Юнит-тесты (94)
pnpm test:routes       # API тесты (82)  
pnpm test:e2e          # E2E тесты (16)

# AI Fixtures управление
AI_FIXTURE_MODE=record pnpm test:e2e    # Запись
AI_FIXTURE_MODE=replay pnpm test:e2e    # Воспроизведение
```

---

## 🆕 UC-10 Интеграция в E2E тестах

### Обновленные Use Cases

**UC-11: File Import System** (новый)
- **Файл:** `tests/e2e/use-cases/UC-11-File-Import-System.test.ts`
- **Цель:** Тестирование импорта файлов (.md, .csv, .txt) с автоматическим созданием артефактов
- **Ключевые проверки:** Импорт → создание правильного типа артефакта → корректное содержимое

**UC-02: Visual Site Building** (переписан)
- **Файл:** `tests/e2e/use-cases/UC-02-Visual-Site-Building.test.ts` 
- **Изменения:** Полный переход от AI-first к visual-first подходу
- **Интеграция:** SiteEditorPage POM, добавление блоков, использование UC-10 артефактов

**UC-03: Artifact Reuse** (дополнен)
- **Новый тест:** UC-10 интеграция с clipboard workflow в Site Editor
- **Проверки:** Person/address артефакты → clipboard → Site Editor → валидация

**UC-06: Content Management** (дополнен)  
- **Новый тест:** Версионирование UC-10 типов артефактов
- **Проверки:** Изменение person/address → создание версии → DiffView валидация

**UC-01: Site Publication** (углублен)
- **Новый тест:** Углубленная валидация UC-10 контента на опубликованных сайтах
- **Проверки:** Детальный person/address контент → structural validation → responsive проверка

### Ключевые POM классы для UC-10

**SiteEditorPage** - основной POM для визуального редактора:
```typescript
const siteEditor = new SiteEditorPage(page)
await siteEditor.waitForSiteEditorLoad()
await siteEditor.addSiteBlock('key-contacts')
await siteEditor.addArtifactToSlot(blockIndex, slotKey, artifactIndex)
```

**Artifact Payload Factory** - создание UC-10 артефактов:
```typescript
import { createPersonPayload, createAddressPayload } from '../../helpers/artifact-payload-factory'

const personPayload = createPersonPayload({
  content: { fullName: 'John Doe', position: 'HR Manager' }
})
```

### UC-10 покрытие типов артефактов

E2E тесты теперь покрывают все ключевые UC-10 типы:
- ✅ **person** - HR данные (имя, должность, контакты)
- ✅ **address** - адресная информация (офисы, локации)  
- ✅ **text** - текстовый контент (Markdown поддержка)
- ✅ **site** - сайты с блочной структурой
- ✅ **image** - изображения и файлы
- ✅ **sheet** - табличные данные (CSV импорт)

---

> **Принцип тестирования:** Минимальный набор тестов с максимальным покрытием критических путей. Каждый тест должен быть быстрым, стабильным и легко поддерживаемым.