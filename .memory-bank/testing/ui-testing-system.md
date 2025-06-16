# 🧪 Система тестирования UI в WelcomeCraft

**Версия:** 1.0.0  
**Дата:** 2025-06-16  
**Статус:** Актуально

## HISTORY:
* v1.0.0 (2025-06-16): Создание документации по новой системе тестирования UI

---

Этот документ описывает комплексную систему тестирования пользовательского интерфейса, реализованную в проекте WelcomeCraft.

## 🏷️ Иерархическая система data-testid

### Принципы именования

Используется структурированная схема: `{зона-UI}-{компонент}-{действие}` или `{зона-UI}-{элемент}`

### Префиксы зон UI

| Префикс | Зона | Описание |
|---------|------|----------|
| `header-` | Шапка приложения | Логотип, новый чат, share, тема, пользователь |
| `sidebar-` | Боковая панель | Чаты, артефакты, управление видимостью |
| `chat-` | Зона чата | Сообщения, input, suggested actions |
| `artifact-` | Панель артефактов | Контент, действия, редакторы, типы |

### Примеры реализованных testid

**Header (Шапка):**
- `header-project-logo` - логотип проекта
- `header-new-chat-button` - кнопка создания чата
- `header-share-button` - кнопка шеринга
- `header-theme-selector` - селектор темы
- `header-user-menu` - меню пользователя

**Chat Input (Поле ввода):**
- `chat-input-container` - контейнер поля ввода
- `chat-input-textarea` - текстовое поле
- `chat-input-attach-menu` - меню прикрепления
- `chat-input-model-selector` - селектор AI модели
- `chat-input-send-button` - кнопка отправки
- `chat-input-clipboard-artifact` - буфер артефакта

**Artifact System (Система артефактов):**
- `artifact-panel-close-button` - закрытие панели
- `artifact-actions-add-to-chat-button` - добавить в чат
- `artifact-actions-discuss-button` - обсудить в чате
- `artifact-actions-save-status` - статус сохранения

## 🛠️ UI Хелперы

### Архитектура хелперов

**Файл:** `tests/helpers/ui-helpers.ts`

Система хелперов организована по зонам UI с высокоуровневыми методами для взаимодействия:

```typescript
const ui = createUIHelpers(page)

// Работа с шапкой
await ui.header.createNewChat()
await ui.header.openShareDialog()

// Работа с полем ввода
await ui.chatInput.sendMessage('Привет!')
await ui.chatInput.openAttachMenu()

// Работа с артефактами
await ui.artifactActions.addToChat()
await ui.artifactPanel.close()
```

### Классы хелперов

#### HeaderHelpers
```typescript
class HeaderHelpers {
  get newChatButton()     // header-new-chat-button
  get shareButton()       // header-share-button
  get themeSelector()     // header-theme-selector
  get userMenu()          // header-user-menu
  
  async createNewChat()   // Создание нового чата
  async switchTheme()     // Переключение темы
  async openUserMenu()    // Открытие меню пользователя
}
```

#### ChatInputHelpers
```typescript
class ChatInputHelpers {
  get textarea()              // chat-input-textarea
  get sendButton()            // chat-input-send-button
  get attachMenu()            // chat-input-attach-menu
  get clipboardArtifact()     // chat-input-clipboard-artifact
  
  async sendMessage(text)             // Отправка сообщения
  async sendMessageWithKeyboard()     // Отправка через Ctrl+Enter
  async hasClipboardArtifact()        // Проверка буфера артефакта
  async clearClipboardArtifact()      // Очистка буфера
}
```

#### ArtifactPanelHelpers
```typescript
class ArtifactPanelHelpers {
  get closeButton()           // artifact-panel-close-button
  get fullscreenButton()      // artifact-panel-fullscreen-button
  get container()             // artifact-panel
  
  async close()               // Закрытие панели
  async toggleFullscreen()    // Переключение полноэкранного режима
  async isOpen()              // Проверка открытости панели
}
```

#### ArtifactActionsHelpers
```typescript
class ArtifactActionsHelpers {
  get addToChatButton()       // artifact-actions-add-to-chat-button
  get discussButton()         // artifact-actions-discuss-button
  get saveStatus()            // artifact-actions-save-status
  
  async addToChat()           // Добавление в буфер чата
  async discussInChat()       // Открытие чата для обсуждения
  async getSaveStatus()       // Получение статуса сохранения
  async waitForSaved()        // Ожидание сохранения
}
```

#### SidebarHelpers
```typescript
class SidebarHelpers {
  get toggle()                // sidebar-toggle
  get chatsHistory()          // sidebar-chats-history
  get artifactsList()         // sidebar-artifacts-list
  
  getChatItem(index)          // sidebar-chat-item
  getChatDeleteButton(index)  // sidebar-chat-item-delete-button
  
  async toggleSidebar()       // Переключение видимости
  async openChat(index)       // Открытие чата
  async deleteChat(index)     // Удаление чата
  async getChatCount()        // Количество чатов
}
```

#### ChatMessageHelpers
```typescript
class ChatMessageHelpers {
  getMessage(index)                   // chat-message
  getMessageCopyButton(index)         // chat-message-copy-button
  getMessageEditButton(index)         // chat-message-edit-button
  getArtifactPreview(messageIndex)    // chat-message-artifact-preview
  
  async copyMessage(index)            // Копирование сообщения
  async editMessage(index)            // Редактирование сообщения
  async openArtifactFromMessage()     // Открытие артефакта из сообщения
  async getMessageCount()             // Количество сообщений
}
```

## 📝 Примеры использования в тестах

### Базовое использование

```typescript
import { createUIHelpers } from '../helpers/ui-helpers'

test('создание нового чата', async ({ page }) => {
  const ui = createUIHelpers(page)
  
  await page.goto('/app')
  await ui.header.createNewChat()
  
  await expect(page).toHaveURL(/\/chat\/[a-zA-Z0-9-]+/)
})
```

### Отправка сообщения

```typescript
test('отправка сообщения в чат', async ({ page }) => {
  const ui = createUIHelpers(page)
  
  await page.goto('/app')
  await ui.header.createNewChat()
  await ui.chatInput.sendMessage('Создай текстовый артефакт')
  
  await expect(ui.chatInput.textarea).toHaveValue('')
})
```

### Работа с артефактами

```typescript
test('добавление артефакта в новый чат', async ({ page }) => {
  const ui = createUIHelpers(page)
  
  // Создаем артефакт
  await page.goto('/app')
  await ui.header.createNewChat()
  await ui.chatInput.sendMessage('Создай простой текст')
  
  // Открываем артефакт и добавляем в буфер
  await ui.chatMessages.openArtifactFromMessage(0)
  await ui.artifactActions.addToChat()
  
  // Создаем новый чат
  await ui.header.createNewChat()
  
  // Проверяем буфер и отправляем
  await expect(ui.chatInput.clipboardArtifact).toBeVisible()
  await ui.chatInput.sendMessage('Улучши этот артефакт')
  
  await expect(ui.chatInput.clipboardArtifact).not.toBeVisible()
})
```

### Комплексный workflow

```typescript
test('полный workflow создания и переиспользования артефакта', async ({ page }) => {
  const ui = createUIHelpers(page)
  
  // 1. Начальная настройка
  await page.goto('/app')
  await ui.header.createNewChat()
  
  // 2. Создание артефакта
  await ui.chatInput.sendMessage('Создай приветственный текст')
  
  // 3. Работа с артефактом
  const messageCount = await ui.chatMessages.getMessageCount()
  await ui.chatMessages.openArtifactFromMessage(messageCount - 1)
  
  // 4. Проверка автосохранения
  await ui.artifactActions.waitForSaved()
  expect(await ui.artifactActions.getSaveStatus()).toBe('saved')
  
  // 5. Добавление в новый чат
  await ui.artifactActions.addToChat()
  await ui.header.createNewChat()
  
  // 6. Переиспользование
  await ui.chatInput.sendMessage('Создай улучшенную версию')
  
  // 7. Проверка результата
  await expect(ui.chatInput.clipboardArtifact).not.toBeVisible()
})
```

## 🎯 Преимущества системы

### 1. Читаемость тестов
```typescript
// Старый подход
await page.getByTestId('send-button').click()

// Новый подход
await ui.chatInput.sendMessage('Текст')
```

### 2. Maintainability
- Изменения в UI требуют обновления только хелперов
- Тесты остаются стабильными при рефакторинге компонентов
- Централизованная логика взаимодействия с элементами

### 3. Переиспользование
- Общие паттерны взаимодействия инкапсулированы в методах
- Высокоуровневые операции (создание чата, отправка сообщения)
- Консистентное поведение во всех тестах

### 4. Типизация
- Полная TypeScript типизация всех методов
- IntelliSense поддержка в IDE
- Compile-time проверки корректности использования

## 🔧 Расширение системы

### Добавление новых хелперов

```typescript
// Новый хелпер для модального окна
class ModalHelpers {
  constructor(private page: Page) {}
  
  get container() {
    return this.page.getByTestId('modal-container')
  }
  
  get closeButton() {
    return this.page.getByTestId('modal-close-button')
  }
  
  async close() {
    await this.closeButton.click()
  }
}

// Добавление в главный класс
export class UIHelpers {
  public modal: ModalHelpers
  
  constructor(private page: Page) {
    this.modal = new ModalHelpers(page)
    // ... остальные хелперы
  }
}
```

### Добавление новых testid

1. **Добавить testid в компонент:**
```tsx
<Button data-testid="new-feature-button" onClick={handleClick}>
  New Feature
</Button>
```

2. **Обновить соответствующий хелпер:**
```typescript
class FeatureHelpers {
  get newFeatureButton() {
    return this.page.getByTestId('new-feature-button')
  }
  
  async triggerNewFeature() {
    await this.newFeatureButton.click()
  }
}
```

3. **Обновить документацию:**
- Добавить в `ui-interface-structure.md`
- Описать в пользовательских сценариях

## 📚 Связанные документы

- **UI Structure:** `.memory-bank/docs/ui-interface-structure.md` - полный mapping элементов
- **User Scenarios:** `.memory-bank/docs/user-scenarios.md` - сценарии использования
- **Dev Rules:** `.memory-bank/dev-rules.md` - правила разработки тестов

---

Эта система обеспечивает надежное, maintainable и масштабируемое тестирование UI компонентов WelcomeCraft.