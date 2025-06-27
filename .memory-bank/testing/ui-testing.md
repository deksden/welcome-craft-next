# 🏷️ Живой Манифест UI (Реестр data-testid)

**Версия:** 4.0.0
**Дата:** 2025-06-23
**Статус:** POM REVISION COMPLETED - Живой документ с результатами ревизии

Этот документ — единый источник правды для всех `data-testid` в проекте. При создании или изменении UI-компонента, этот манифест **обязателен** к обновлению.

## Схема именования
`{зона}-{компонент}-{описание}`

## Реестр `data-testid`

| `data-testid` | Компонент | Описание | Статус |
| :--- | :--- | :--- | :--- |
| **Auth Zone** | | | |
| `auth-email-input` | `components/auth-form.tsx` | Поле ввода Email. | ✅ Реализован |
| `auth-password-input`| `components/auth-form.tsx` | Поле ввода пароля. | ✅ Реализован |
| `auth-submit-button` | `components/submit-button.tsx`| Кнопка отправки формы. | ✅ Реализован |
| **Header Zone** | | | |
| `header-new-chat-button` | `components/header.tsx` | Кнопка создания нового чата. | ❓ Требует проверки |
| `header-share-button` | `components/header.tsx` | Кнопка шеринга. | ❓ Требует проверки |
| `header-theme-selector` | `components/header.tsx` | Селектор темы. | ❓ Требует проверки |
| `header-user-menu` | `components/header.tsx` | Меню пользователя. | ❓ Требует проверки |
| **Sidebar Zone** | | | |
| `sidebar-toggle-button` | `components/app-sidebar.tsx` | Переключатель сайдбара. | ✅ Реализован |
| `sidebar-chat-section` | `components/app-sidebar.tsx` | Секция AI чата. | ✅ Реализован |
| `sidebar-chat-item` | `components/sidebar-history-item.tsx` | Элемент чата в списке. | ✅ Реализован |
| `sidebar-chat-menu-button` | `components/sidebar-history-item.tsx` | Кнопка меню действий чата. | ✅ Реализован |
| `sidebar-chat-rename-action` | `components/sidebar-history-item.tsx` | Действие переименования чата. | ✅ Реализован |
| `sidebar-chat-share-menu` | `components/sidebar-history-item.tsx` | Подменю публикации чата. | ✅ Реализован |
| `sidebar-chat-delete-action` | `components/sidebar-history-item.tsx` | Действие удаления чата. | ✅ Реализован |
| `sidebar-artifacts-button` | `components/app-sidebar.tsx` | Кнопка секции артефактов. | ✅ Реализован |
| `sidebar-all-artifacts-button` | `components/app-sidebar.tsx` | Кнопка "Все артефакты". | ✅ Реализован |
| **Chat Input Zone** | | | |
| `chat-input-textarea` | `components/chat-input.tsx` | Текстовое поле ввода. | ✅ Реализован |
| `chat-input-send-button` | `components/chat-input.tsx` | Кнопка отправки сообщения. | ✅ Реализован |
| `chat-input-attach-menu` | `components/chat-input.tsx` | Меню прикрепления файлов. | ✅ Реализован |
| **Artifact Zone** | | | |
| `artifact-panel` | `components/artifact.tsx` | Панель редактора артефакта. | ✅ Реализован |
| `artifact-card` | `components/artifact-card.tsx` | Карточка артефакта в списке. | ✅ Реализован |
| `artifact-preview` | `components/artifact-preview.tsx` | Превью артефакта в чате. | ⚠️ Используется в селекторах |
| `artifact-content` | `components/artifact-content.tsx` | Контент панель артефакта. | ⚠️ Используется в селекторах |
| `artifact-publish-button` | `components/site-publish-action.tsx` | Кнопка публикации site артефактов. | ✅ Реализован |
| `site-publication-dialog` | `components/site-publication-dialog.tsx` | Диалог управления публикацией. | ✅ Реализован |
| **File Import Zone** | | | |
| `file-input` | `components/file-import.tsx` | Input для загрузки файлов. | ❌ Отсутствует |
| `file-drop-zone` | `components/file-import.tsx` | Drag & Drop зона для файлов. | ❌ Отсутствует |
| `file-import-toast` | `components/file-import.tsx` | Уведомления об импорте. | ❌ Отсутствует |
| **Toast Zone** | | | |
| `toast` | UI Library | Системные уведомления. | ✅ Реализован |
| `toast-icon` | `components/toast.tsx` | Иконка типа toast уведомления. | ✅ Реализован |
| `toast-message` | `components/toast.tsx` | Текст toast уведомления. | ✅ Реализован |
| **Save Status Zone** | | | |
| `artifact-save-status-icon` | `components/artifact-actions.tsx` | Иконка статуса сохранения. | ✅ Реализован |
| `artifact-actions-save-status` | `components/artifact-actions.tsx` | Контейнер статуса сохранения. | ✅ Реализован |
| **World Zone** | | | |
| `world-indicator` | `components/world-indicator.tsx` | Индикатор тестового мира. | ✅ Реализован |
| `world-indicator-name` | `components/world-indicator.tsx` | Название текущего мира. | ✅ Реализован |
| **Skeleton Zone** | | | |
| `artifact-skeleton` | `components/artifact-skeleton.tsx` | Skeleton loader для артефактов. | ✅ Реализован |
| `artifact-inline-skeleton` | `components/artifact-skeleton.tsx` | Inline skeleton loader. | ✅ Реализован |

## Схема статусов
- ✅ **Реализован** — `data-testid` существует и протестирован
- ⚠️ **Несоответствие** — существует, но под другим именем  
- ❓ **Требует проверки** — нужно проверить наличие в коде
- ❌ **Отсутствует** — необходимо добавить

## Правила обновления
1. При добавлении нового интерактивного элемента — обязательно добавить запись
2. При изменении существующего `data-testid` — обновить статус
3. При создании нового Page Object — обновить столбец "Статус"
4. При обнаружении несоответствий — отметить как ⚠️ с примечанием

## 🔍 POM Revision Results (2025-06-23)

### Обнаруженные проблемы:
1. **UC-05:** 18 direct selectors вместо POM (ChatInputHelpers доступен, но не используется)
2. **UC-11:** 13 direct selectors, FileImportPage POM отсутствует  
3. **UC-01:** 6 direct selectors, частично использует PublicationPage
4. **Fallback селекторы:** `[data-testid*="artifact"]` вместо точных testid

### Direct Selector Audit:
```typescript
// ❌ ПРОБЛЕМАТИЧНЫЕ ПАТТЕРНЫ, найденные в тестах:
page.locator('[data-testid*="chat-input"], textarea, input[type="text"]')
page.locator('[data-testid*="artifact-preview"]').filter({ hasText: /text/ })
page.locator('[data-testid*="toast"]')
page.locator('[data-testid="artifact-card"]').filter({ hasText: 'sample' })

// ✅ ДОЛЖНЫ БЫТЬ:
new ChatInputHelpers(page).sendMessage()
new ArtifactHelpers(page).getPreviewByType('text')
new ToastHelpers(page).waitForSuccess()
new ArtifactHelpers(page).getCardByName('sample')
```

### Action Items:
- [ ] **Создать FileImportPage POM** для UC-11
- [ ] **Рефакторинг UC-05** на использование ChatInputHelpers
- [ ] **Добавить data-testid** для file import элементов
- [ ] **Стандартизировать** использование POM во всех E2E тестах

## Связанные файлы
- **Page Objects:** `tests/pages/` — используют эти testid
- **Test Helpers:** `tests/helpers/` — содержат fallback логику для несоответствий
  - ✅ `sidebar-page.ts` — POM для sidebar с новыми testid
  - ✅ `publication-page.ts` — POM для UC-01 Site Publication
  - ✅ `clipboard-page.ts` — POM для UC-03 Artifact Reuse
  - ✅ `multi-artifact-page.ts` — POM для UC-05 Multi-Artifact Creation
  - ✅ `content-management-page.ts` — POM для UC-06 Content Management
  - ✅ `ai-suggestions-page.ts` — POM для UC-07 AI Suggestions
  - ❌ `file-import-page.ts` — **ТРЕБУЕТСЯ СОЗДАНИЕ** для UC-11
  - ✅ `ui-helpers.ts` — ChatInputHelpers + другие универсальные хелперы
- **Спецификации:** `.memory-bank/specs/` — ссылаются на эти testid