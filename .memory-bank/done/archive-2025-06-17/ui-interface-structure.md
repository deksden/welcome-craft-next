# 🎨 Структура пользовательского интерфейса WelcomeCraft

**Версия:** 1.0.0  
**Дата:** 2025-06-16  
**Статус:** Актуально

## HISTORY:
* v1.0.0 (2025-06-16): Создание структурированного описания интерфейса с mapping элементов

---

Этот документ содержит полное структурированное описание пользовательского интерфейса WelcomeCraft с привязкой UI элементов к компонентам, data-testid и файлам.

## 🏷️ Система именования data-testid

Для структурированного тестирования используется иерархическая система префиксов:

### Схема именования:
`{зона-UI}-{компонент}-{действие}` или `{зона-UI}-{элемент}`

### Префиксы зон UI:
- **`header-`** - шапка приложения (логотип, новый чат, share, тема, пользователь)
- **`sidebar-`** - боковая панель (чаты, артефакты, управление)
- **`chat-`** - зона чата (сообщения, input, suggested actions)
- **`artifact-`** - панель артефактов (контент, действия, редакторы)

### Примеры:
- `header-new-chat-button` - кнопка создания чата в шапке
- `sidebar-chat-item` - элемент чата в боковой панели  
- `chat-input-send-button` - кнопка отправки в поле ввода
- `artifact-panel-close-button` - кнопка закрытия панели артефакта

## 🏗️ Архитектура интерфейса

### Общая структура приложения

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Header/Toolbar (components/header.tsx)                                     │
│ ┌──────┐        ┌──────────┐ ┌──────┐ ┌─────────┐ ┌────────────────────┐   │
│ │ Logo │        │ New Chat │ │Share │ │ Theme   │ │ User Avatar + Menu │   │
│ │      │        │ Button   │ │ Btn  │ │Selector │ │                    │   │
│ │      │        │          │ │      │ │         │ │                    │   │
│ └──────┘        └──────────┘ └──────┘ └─────────┘ └────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Main Layout (app/app/(main)/layout.tsx)                                    │
│ ┌─────────────────┐ ┌────────────────────────┐ ┌─────────────────────────┐ │
│ │    Sidebar      │ │      Chat Area         │ │    Artifact Panel      │ │
│ │                 │ │                        │ │                         │ │
│ │ ┌─────────────┐ │ │ ┌────────────────────┐ │ │ ┌─────────────────────┐ │ │
│ │ │ Chat Section│ │ │ │    Messages        │ │ │ │   Artifact Content  │ │ │
│ │ │             │ │ │ │                    │ │ │ │                     │ │ │
│ │ └─────────────┘ │ │ └────────────────────┘ │ │ └─────────────────────┘ │ │
│ │ ┌─────────────┐ │ │ ┌────────────────────┐ │ │                         │ │
│ │ │Artifacts    │ │ │ │   Chat Input       │ │ │                         │ │
│ │ │Section      │ │ │ │ ┌────────────────┐ │ │ │                         │ │
│ │ │             │ │ │ │ │  Text Area     │ │ │ │                         │ │
│ │ └─────────────┘ │ │ │ └────────────────┘ │ │ │                         │ │
│ │ ┌─────────────┐ │ │ │ ┌──┐┌──────┐┌───┐ │ │ │                         │ │
│ │ │Sidebar      │ │ │ │ │📎││Model ││▶ │ │ │ │                         │ │
│ │ │Toggle       │ │ │ │ └──┘└──────┘└───┘ │ │ │                         │ │
│ │ │             │ │ │ └────────────────────┘ │ │                         │ │
│ └─────────────────┘ └────────────────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📱 Основные UI зоны и компоненты

### 1. 🔝 Header/Toolbar (Шапка приложения)

**Файл:** `components/header.tsx`  
**Контейнер:** `data-testid="header"` *(отсутствует)*

| UI Элемент | Компонент | data-testid | Статус | Файл |
|------------|-----------|-------------|---------|------|
| Логотип проекта | ProjectLogo | `header-project-logo` | ❌ Нет | `components/header.tsx` |
| Кнопка "Новый чат" (справа) | NewChatButton | `header-new-chat-button` | ❌ Нет | `components/header.tsx` |
| Кнопка "Share" + индикатор | ShareChatButton | `header-share-button` | ❌ Нет | `components/header.tsx` |
| Селектор темы (день/ночь/авто) | ThemeSelector | `header-theme-selector` | ❌ Нет | `components/theme-selector.tsx` |
| Аватар пользователя | UserAvatar | `header-user-avatar` | ❌ Нет | `components/sidebar-user-nav.tsx` |
| Меню пользователя | SidebarUserNav | `header-user-menu` | ❌ Нет | `components/sidebar-user-nav.tsx` |

### 2. 📋 Sidebar (Боковая панель)

**Файл:** `components/sidebar.tsx`  
**Контейнер:** `data-testid="sidebar"` *(отсутствует)*

#### 2.1 Раздел чатов (верхняя часть)

| UI Элемент | Компонент | data-testid | Статус | Файл |
|------------|-----------|-------------|---------|------|
| Заголовок "Чаты" | ChatsSection | `sidebar-chats-section` | ❌ Нет | `components/sidebar.tsx` |
| История чатов | SidebarHistory | `sidebar-history` | ❌ Нет | `components/sidebar-history.tsx` |
| Пустая история | EmptyHistory | `sidebar-history-empty` | ❌ Нет | `components/sidebar-history.tsx` |
| Элемент чата | SidebarHistoryItem | `chat-item` | ❌ Нет | `components/sidebar-history-item.tsx` |
| Меню элемента | ChatItemMenu | `chat-item-menu-button` | ❌ Нет | `components/sidebar-history-item.tsx` |
| Переименовать | RenameButton | `chat-item-rename-button` | ❌ Нет | `components/sidebar-history-item.tsx` |
| Удалить чат | DeleteButton | `chat-item-delete-button` | ❌ Нет | `components/sidebar-history-item.tsx` |
| Приватный режим | PrivateButton | `chat-item-share-private-button` | ❌ Нет | `components/sidebar-history-item.tsx` |
| Публичный режим | PublicButton | `chat-item-share-public-button` | ❌ Нет | `components/sidebar-history-item.tsx` |

#### 2.2 Раздел артефактов (средняя часть)

| UI Элемент | Компонент | data-testid | Статус | Файл |
|------------|-----------|-------------|---------|------|
| Заголовок "Артефакты" | ArtifactsSection | `sidebar-artifacts-section` | ❌ Нет | `components/sidebar.tsx` |
| Список артефактов | ArtifactsList | `sidebar-artifacts-list` | ❌ Нет | `components/sidebar-artifacts.tsx` |
| Элемент артефакта | ArtifactItem | `artifact-item` | ❌ Нет | `components/sidebar-artifact-item.tsx` |
| Меню артефакта | ArtifactItemMenu | `artifact-item-menu-button` | ❌ Нет | `components/sidebar-artifact-item.tsx` |

#### 2.3 Управление сайдбаром (нижняя часть)

| UI Элемент | Компонент | data-testid | Статус | Файл |
|------------|-----------|-------------|---------|------|
| Кнопка раскрытия | SidebarToggle | `sidebar-toggle` | ✅ Есть | `components/sidebar-toggle.tsx` |

### 3. 💬 Chat Area (Область чата)

**Файл:** `components/chat.tsx`  
**Контейнер:** `data-testid="chat-container"` *(отсутствует)*

#### 3.1 Контейнер сообщений

| UI Элемент | Компонент | data-testid | Статус | Файл |
|------------|-----------|-------------|---------|------|
| Список сообщений | MessagesContainer | `chat-messages-container` | ❌ Нет | `components/chat.tsx` |
| Сообщение | Message | `message` | ❌ Нет | `components/message.tsx` |
| Кнопка копирования | CopyButton | `message-copy-button` | ❌ Нет | `components/message.tsx` |
| Кнопка редактирования | EditButton | `message-edit-button` | ❌ Нет | `components/message.tsx` |
| Кнопка удаления | DeleteButton | `message-delete-button` | ❌ Нет | `components/message.tsx` |
| Кнопка перегенерации | RegenerateButton | `message-regenerate-button` | ❌ Нет | `components/message.tsx` |

#### 3.2 Поле ввода сообщений

**Файл:** `components/chat-input.tsx`  
**Контейнер:** `data-testid="chat-input-container"` *(отсутствует)*

| UI Элемент | Компонент | data-testid | Статус | Файл |
|------------|-----------|-------------|---------|------|
| Текстовое поле (расширяющееся) | Textarea | `chat-input-textarea` | ✅ Есть (как `chat-input`) | `components/chat-input.tsx` |
| Меню "скрепка" (слева) | AttachButton | `chat-input-attach-menu` | ✅ Есть (как `attachments-button`) | `components/chat-input.tsx` |
| Селектор модели | ModelSelector | `chat-input-model-selector` | ❌ Нет | `components/model-selector.tsx` |
| Кнопка "отправить"/"стоп" (справа) | SendButton | `chat-input-send-button` | ✅ Есть (как `send-button`) | `components/chat-input.tsx` |
| Превью вложений (сверху) | AttachmentsPreview | `chat-input-attachments-preview` | ✅ Есть (как `attachments-preview`) | `components/chat-input.tsx` |
| Буфер артефакта | ClipboardArtifact | `chat-input-clipboard-artifact` | ❌ Нет | `components/chat-input.tsx` |

#### 3.3 Suggested Actions

**Файл:** `components/suggested-actions.tsx`

| UI Элемент | Компонент | data-testid | Статус | Файл |
|------------|-----------|-------------|---------|------|
| Предложенное действие | SuggestedAction | `suggested-action` | ❌ Нет | `components/suggested-actions.tsx` |

### 4. 🎨 Artifact Panel (Панель артефактов)

**Файл:** `components/artifact.tsx`  
**Контейнер:** `data-testid="artifact-panel"` *(отсутствует)*

#### 4.1 Основная панель артефакта

| UI Элемент | Компонент | data-testid | Статус | Файл |
|------------|-----------|-------------|---------|------|
| Заголовок артефакта | ArtifactTitle | `artifact-title` | ❌ Нет | `components/artifact.tsx` |
| Контент артефакта | ArtifactContent | `artifact-content` | ❌ Нет | `components/artifact.tsx` |
| Кнопка закрытия | ArtifactCloseButton | `artifact-close-button` | ❌ Нет | `components/artifact-close-button.tsx` |
| Кнопка полного экрана | FullscreenButton | `artifact-fullscreen-button` | ❌ Нет | `components/artifact.tsx` |
| Селектор версий | VersionSelector | `artifact-version-selector` | ❌ Нет | `components/artifact.tsx` |

#### 4.2 Действия с артефактами

**Файл:** `components/artifact-actions.tsx`

| UI Элемент | Компонент | data-testid | Статус | Файл |
|------------|-----------|-------------|---------|------|
| Кнопка "Обсудить" | DiscussButton | `artifact-discuss-button` | ❌ Нет | `components/artifact-actions.tsx` |
| Кнопка "Добавить в чат" | AddToChatButton | `artifact-add-to-chat-button` | ❌ Нет | `components/artifact-actions.tsx` |
| Статус сохранения | SaveStatus | `artifact-save-status` | ❌ Нет | `components/artifact-actions.tsx` |

#### 4.3 Превью артефактов в сообщениях

**Файл:** `components/artifact-preview.tsx`

| UI Элемент | Компонент | data-testid | Статус | Файл |
|------------|-----------|-------------|---------|------|
| Превью артефакта | ArtifactPreview | `artifact-preview` | ❌ Нет | `components/artifact-preview.tsx` |
| Кнопка открытия | OpenArtifactButton | `artifact-preview-open-button` | ❌ Нет | `components/artifact-preview.tsx` |

#### 4.4 Результаты AI инструментов

**Файл:** `components/artifact-tool-results.tsx`

| UI Элемент | Компонент | data-testid | Статус | Файл |
|------------|-----------|-------------|---------|------|
| Результат создания | ToolResult | `artifact-tool-result` | ❌ Нет | `components/artifact-tool-results.tsx` |
| Процесс создания | ToolCall | `artifact-tool-call` | ❌ Нет | `components/artifact-tool-results.tsx` |

### 5. 📄 Типы артефактов (Редакторы)

#### 5.1 Text артефакт

**Файл:** `artifacts/kinds/text/client.tsx`

| UI Элемент | Компонент | data-testid | Статус | Файл |
|------------|-----------|-------------|---------|------|
| Текстовый редактор | TextEditor | `text-artifact-editor` | ❌ Нет | `artifacts/kinds/text/client.tsx` |
| Превью Markdown | MarkdownPreview | `text-artifact-preview` | ❌ Нет | `artifacts/kinds/text/client.tsx` |

#### 5.2 Code артефакт

**Файл:** `artifacts/kinds/code/client.tsx`

| UI Элемент | Компонент | data-testid | Статус | Файл |
|------------|-----------|-------------|---------|------|
| Редактор кода | CodeEditor | `code-artifact-editor` | ❌ Нет | `artifacts/kinds/code/client.tsx` |
| Кнопка запуска | RunButton | `code-artifact-run-button` | ❌ Нет | `artifacts/kinds/code/client.tsx` |
| Вывод консоли | ConsoleOutput | `code-artifact-output` | ❌ Нет | `artifacts/kinds/code/client.tsx` |

#### 5.3 Site артефакт

**Файл:** `artifacts/kinds/site/client.tsx`

| UI Элемент | Компонент | data-testid | Статус | Файл |
|------------|-----------|-------------|---------|------|
| Редактор сайта | SiteEditor | `site-artifact-editor` | ❌ Нет | `artifacts/kinds/site/client.tsx` |
| Добавить блок | AddBlockButton | `site-add-block-button` | ❌ Нет | `artifacts/kinds/site/client.tsx` |
| Блок сайта | SiteBlock | `site-block` | ❌ Нет | `artifacts/kinds/site/client.tsx` |

## 🎯 Критически важные отсутствующие testid (с новыми префиксами)

### Приоритет 1 (Основные пользовательские действия)

| Элемент | Новый testid | Компонент | Важность |
|---------|--------------|-----------|----------|
| Кнопка "Новый чат" | `header-new-chat-button` | Header | 🔴 Критично |
| Кнопка отправки | `chat-input-send-button` | ChatInput | ✅ OK (есть как `send-button`) |
| Поле ввода | `chat-input-textarea` | ChatInput | ✅ OK (есть как `chat-input`) |
| Закрытие артефакта | `artifact-panel-close-button` | ArtifactCloseButton | 🔴 Критично |
| Редактирование сообщения | `chat-message-edit-button` | Message | 🔴 Критично |
| Добавить в чат | `artifact-actions-add-to-chat-button` | ArtifactActions | 🔴 Критично |

### Приоритет 2 (Навигация и управление)

| Элемент | Новый testid | Компонент | Важность |
|---------|--------------|-----------|----------|
| Элемент чата | `sidebar-chat-item` | SidebarHistoryItem | 🟡 Важно |
| Удаление чата | `sidebar-chat-item-delete-button` | SidebarHistoryItem | 🟡 Важно |
| История чатов | `sidebar-chats-history` | SidebarHistory | 🟡 Важно |
| Превью артефакта | `chat-message-artifact-preview` | ArtifactPreview | 🟡 Важно |

### Приоритет 3 (Дополнительная функциональность)

| Элемент | Новый testid | Компонент | Важность |
|---------|--------------|-----------|----------|
| Меню пользователя | `header-user-menu` | SidebarUserNav | 🟢 Средне |
| Селектор модели | `chat-input-model-selector` | ModelSelector | 🟢 Средне |
| Полный экран | `artifact-panel-fullscreen-button` | Artifact | 🟢 Средне |
| Селектор темы | `header-theme-selector` | ThemeSelector | 🟢 Средне |

## 🗺️ Mapping файлов по зонам UI

### Layout и навигация
- `app/app/(main)/layout.tsx` - общий layout
- `components/header.tsx` - шапка
- `components/sidebar.tsx` - боковая панель
- `components/sidebar-history.tsx` - история чатов
- `components/sidebar-history-item.tsx` - элемент истории

### Чат и сообщения
- `components/chat.tsx` - основной компонент чата
- `components/chat-input.tsx` - поле ввода
- `components/message.tsx` - отображение сообщений
- `components/suggested-actions.tsx` - предложенные действия

### Артефакты
- `components/artifact.tsx` - основная панель артефакта
- `components/artifact-preview.tsx` - превью в сообщениях
- `components/artifact-actions.tsx` - действия с артефактами
- `components/artifact-tool-results.tsx` - результаты AI инструментов
- `components/artifact-close-button.tsx` - кнопка закрытия

### Редакторы артефактов
- `artifacts/kinds/text/client.tsx` - текстовый редактор
- `artifacts/kinds/code/client.tsx` - редактор кода  
- `artifacts/kinds/site/client.tsx` - редактор сайтов

### UI компоненты
- `components/model-selector.tsx` - выбор AI модели
- `components/preview-attachment.tsx` - превью файлов
- `components/toast.tsx` - уведомления

---

Этот документ служит единственным источником истины для структуры UI и должен обновляться при добавлении новых компонентов или изменении существующих.