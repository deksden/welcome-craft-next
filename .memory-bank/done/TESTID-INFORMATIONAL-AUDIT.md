# Информационные элементы - Аудит data-testid

## 🎯 Обзор анализа

Анализ информационных элементов (статусы, toast, индикаторы, лейблы) критически важных для тестирования состояний UI в WelcomeCraft.

## 📊 Результаты аудита по категориям

### 1. 🍞 TOAST УВЕДОМЛЕНИЯ

**Файл:** `components/toast.tsx`

| Элемент | Текущий testid | Рекомендуемый testid | Критичность | Состояния |
|---------|---------------|---------------------|-------------|-----------|
| Toast контейнер | `toast` ✅ | `toast-container` | **КРИТИЧЕСКАЯ** | success, error, loading |
| Toast иконка | ❌ НЕТ | `toast-icon` | **ВЫСОКАЯ** | Тип: success/error/loading |
| Toast текст | ❌ НЕТ | `toast-message` | **ВЫСОКАЯ** | Текст сообщения |

**Проблемы:**
- ✅ Есть базовый `data-testid="toast"` 
- ❌ НЕТ testid для иконок типов (success/error/loading)
- ❌ НЕТ testid для текста сообщения
- ❌ НЕТ data-атрибутов для типа toast (`data-type` есть только на иконке)

**Рекомендации:**
```tsx
// Улучшенная структура toast
<div data-testid="toast-container" data-toast-type={type}>
  <div data-testid="toast-icon" data-type={type}>
    {iconsByType[type]}
  </div>
  <div data-testid="toast-message">
    {description}
  </div>
</div>
```

---

### 2. 📊 СТАТУСНЫЕ ИНДИКАТОРЫ

#### A. Save Status Indicator
**Файл:** `components/artifact-actions.tsx`

| Элемент | Текущий testid | Рекомендуемый testid | Критичность | Состояния |
|---------|---------------|---------------------|-------------|-----------|
| Save Status обертка | `artifact-actions-save-status` ✅ | `artifact-save-status` | **КРИТИЧЕСКАЯ** | idle, saving, saved |
| Status иконка | ❌ НЕТ | `artifact-save-status-icon` | **ВЫСОКАЯ** | VercelIcon, LoaderIcon, CheckCircle |

**Проблемы:**
- ✅ Есть testid для обертки
- ❌ НЕТ data-атрибута для состояния (`data-save-status`)
- ❌ НЕТ testid для конкретной иконки

#### B. World Indicator
**Файл:** `components/world-indicator.tsx`

| Элемент | Текущий testid | Рекомендуемый testid | Критичность | Состояния |
|---------|---------------|---------------------|-------------|-----------|
| World контейнер | ❌ НЕТ | `world-indicator` | **СРЕДНЯЯ** | Показан/скрыт |
| World название | ❌ НЕТ | `world-indicator-name` | **СРЕДНЯЯ** | Название мира |
| World статус | ❌ НЕТ | `world-indicator-status` | **НИЗКАЯ** | "Тестовый мир" |

**Проблемы:**
- ❌ Полностью отсутствуют testid
- ❌ НЕТ data-атрибутов для текущего мира

---

### 3. 🔄 ЗАГРУЗОЧНЫЕ ИНДИКАТОРЫ

#### A. Artifact Skeleton
**Файл:** `components/artifact-skeleton.tsx`

| Элемент | Текущий testid | Рекомендуемый testid | Критичность | Состояния |
|---------|---------------|---------------------|-------------|-----------|
| Main Skeleton | ❌ НЕТ | `artifact-skeleton` | **ВЫСОКАЯ** | Загрузка основного артефакта |
| Inline Skeleton | ❌ НЕТ | `artifact-inline-skeleton` | **ВЫСОКАЯ** | Загрузка встроенного артефакта |

#### B. Submit Button Loading
**Файл:** `components/submit-button.tsx`

| Элемент | Текущий testid | Рекомендуемый testid | Критичность | Состояния |
|---------|---------------|---------------------|-------------|-----------|
| Submit кнопка | `auth-submit-button` ✅ | ✅ ХОРОШО | **КРИТИЧЕСКАЯ** | pending, successful |
| Loading иконка | ❌ НЕТ | `auth-submit-loading-icon` | **ВЫСОКАЯ** | Спиннер активен |
| Screen reader output | ❌ НЕТ | `auth-submit-status` | **СРЕДНЯЯ** | Loading/Submit text |

**Проблемы:**
- ✅ Есть основной testid
- ❌ НЕТ data-атрибутов для состояния (`data-pending`, `data-successful`)

---

### 4. 📝 ИНФОРМАЦИОННЫЕ ПАНЕЛИ

#### A. Share Dialog Status
**Файл:** `components/enhanced-share-dialog.tsx`

| Элемент | Текущий testid | Рекомендуемый testid | Критичность | Состояния |
|---------|---------------|---------------------|-------------|-----------|
| Publication status | ❌ НЕТ | `share-dialog-status` | **ВЫСОКАЯ** | published, private |
| TTL badge | ❌ НЕТ | `share-dialog-ttl-badge` | **ВЫСОКАЯ** | Время истечения |
| Status badge | ❌ НЕТ | `share-dialog-status-badge` | **ВЫСОКАЯ** | Опубликован/Приватный |
| Info notice | ❌ НЕТ | `share-dialog-info-notice` | **СРЕДНЯЯ** | Информационное сообщение |

#### B. Version Footer
**Файл:** `components/version-footer.tsx`

| Элемент | Текущий testid | Рекомендуемый testid | Критичность | Состояния |
|---------|---------------|---------------------|-------------|-----------|
| Version footer | ❌ НЕТ | `version-footer` | **ВЫСОКАЯ** | Показан для старых версий |
| Version warning | ❌ НЕТ | `version-footer-warning` | **ВЫСОКАЯ** | "Viewing previous version" |
| Restore button | ❌ НЕТ | `version-footer-restore-button` | **КРИТИЧЕСКАЯ** | Loading/idle состояние |
| Latest button | ❌ НЕТ | `version-footer-latest-button` | **ВЫСОКАЯ** | Кнопка возврата |

---

### 5. 📄 ЛЕЙБЛЫ И ЗАГОЛОВКИ

#### A. Header Elements
**Файл:** `components/header.tsx`

| Элемент | Текущий testid | Рекомендуемый testid | Критичность | Состояния |
|---------|---------------|---------------------|-------------|-----------|
| Header container | `header` ✅ | ✅ ХОРОШО | **СРЕДНЯЯ** | Всегда виден |
| Project logo | `header-project-logo` ✅ | ✅ ХОРОШО | **НИЗКАЯ** | Статичный |
| New chat button | `header-new-chat-button` ✅ | ✅ ХОРОШО | **ВЫСОКАЯ** | Enabled/disabled |
| Share button | `header-share-button` ✅ | ✅ ХОРОШО | **ВЫСОКАЯ** | Highlighted/normal |
| Theme selector | `header-theme-selector` ✅ | ✅ ХОРОШО | **СРЕДНЯЯ** | Theme состояние |
| User menu | `header-user-menu` ✅ | ✅ ХОРОШО | **СРЕДНЯЯ** | Логин состояние |

**Оценка:** ✅ **ОТЛИЧНО** - все элементы имеют testid

#### B. Artifact Preview Header
**Файл:** `components/artifact-preview.tsx`

| Элемент | Текущий testid | Рекомендуемый testid | Критичность | Состояния |
|---------|---------------|---------------------|-------------|-----------|
| Preview container | ❌ НЕТ | `artifact-preview` | **ВЫСОКАЯ** | Показан при создании |
| Header section | ❌ НЕТ | `artifact-preview-header` | **СРЕДНЯЯ** | Статичный заголовок |
| Content section | ❌ НЕТ | `artifact-preview-content` | **ВЫСОКАЯ** | Loading/loaded |
| Summary text | ❌ НЕТ | `artifact-preview-summary` | **ВЫСОКАЯ** | Generated/generating |
| Fullscreen button | ❌ НЕТ | `artifact-preview-fullscreen` | **СРЕДНЯЯ** | Hover состояние |

---

### 6. 🏷️ СЧЕТЧИКИ И МЕТРИКИ

#### A. Chat Input State
**Файл:** `components/chat-input.tsx`

| Элемент | Текущий testid | Рекомендуемый testid | Критичность | Состояния |
|---------|---------------|---------------------|-------------|-----------|
| Input container | `chat-input-container` ✅ | ✅ ХОРОШО | **ВЫСОКАЯ** | Active/inactive |
| Main textarea | `chat-input` ✅ | ✅ ХОРОШО | **КРИТИЧЕСКАЯ** | Enabled/disabled |
| Clipboard artifact | `chat-input-clipboard-artifact` ✅ | ✅ ХОРОШО | **ВЫСОКАЯ** | Показан/скрыт |
| Attachments preview | `chat-input-attachments-preview` ✅ | ✅ ХОРОШО | **ВЫСОКАЯ** | Uploading count |
| Send button | `send-button` ✅ | ✅ ХОРОШО | **КРИТИЧЕСКАЯ** | Enabled/disabled |
| Attach menu | `chat-input-attach-menu` ✅ | ✅ ХОРОШО | **ВЫСОКАЯ** | Enabled/disabled |
| Model selector | `chat-input-model-selector` ✅ | ✅ ХОРОШО | **СРЕДНЯЯ** | Selected model |

**Оценка:** ✅ **ОТЛИЧНО** - очень хорошо покрыт testid

---

### 7. ⚠️ СООБЩЕНИЯ ОБ ОШИБКАХ

#### A. Artifact Preview Errors
**Файл:** `components/artifact-preview.tsx`

| Элемент | Текущий testid | Рекомендуемый testid | Критичность | Состояния |
|---------|---------------|---------------------|-------------|-----------|
| Error container | ❌ НЕТ | `artifact-preview-error` | **КРИТИЧЕСКАЯ** | Ошибка создания |
| Error icon | ❌ НЕТ | `artifact-preview-error-icon` | **СРЕДНЯЯ** | Warning icon |
| Error title | ❌ НЕТ | `artifact-preview-error-title` | **ВЫСОКАЯ** | "Ошибка создания" |
| Error message | ❌ НЕТ | `artifact-preview-error-message` | **КРИТИЧЕСКАЯ** | Текст ошибки |

#### B. Auth Form Errors
**Файл:** `components/auth-form.tsx`

| Элемент | Текущий testid | Рекомендуемый testid | Критичность | Состояния |
|---------|---------------|---------------------|-------------|-----------|
| Email input | `auth-email-input` ✅ | ✅ ХОРОШО | **КРИТИЧЕСКАЯ** | Valid/invalid |
| Password input | `auth-password-input` ✅ | ✅ ХОРОШО | **КРИТИЧЕСКАЯ** | Valid/invalid |

**Проблемы:**
- ✅ Есть testid для полей
- ❌ НЕТ testid для сообщений валидации
- ❌ НЕТ data-атрибутов для состояния валидации

---

## 🎯 Приоритетная матрица внедрения

### 🔴 КРИТИЧЕСКИЙ ПРИОРИТЕТ (P1)
1. **Toast типы и сообщения** - добавить `data-toast-type` и `toast-message`
2. **Artifact error states** - добавить `artifact-preview-error` и связанные
3. **Loading states** - добавить data-атрибуты для всех loading индикаторов
4. **Version footer actions** - добавить testid для restore/latest кнопок
5. **Save status data-attributes** - добавить `data-save-status` для состояний

### 🟡 ВЫСОКИЙ ПРИОРИТЕТ (P2)
1. **Share dialog status elements** - статусные badges и TTL информация
2. **Artifact preview states** - контейнеры и content loading states
3. **World indicator** - полное покрытие testid для тестового режима
4. **Auth validation messages** - сообщения об ошибках валидации

### 🟢 СРЕДНИЙ ПРИОРИТЕТ (P3)
1. **Skeleton loaders** - базовые testid для loading состояний
2. **Info notices** - информационные панели в диалогах
3. **Header improvements** - дополнительные data-атрибуты

## 🛠️ Рекомендуемая схема именования

```typescript
// Информационные элементы
{зона}-{тип-информации}-{описание}

// Примеры:
toast-container
toast-icon
toast-message
artifact-save-status
artifact-preview-error
share-dialog-status-badge
version-footer-warning
chat-input-loading-count
```

## 📈 Метрики покрытия

**Общая статистика:**
- ✅ **Хорошо покрыто:** Header, Chat Input (90%+ testid)
- 🟡 **Частично покрыто:** Toast, Submit Button, Artifact Actions (50-70%)
- ❌ **Слабо покрыто:** Artifact Preview, Share Dialog, Version Footer (<30%)

**Критичность по типам:**
- **КРИТИЧЕСКАЯ:** 8 элементов требуют немедленного внимания
- **ВЫСОКАЯ:** 15 элементов важны для стабильного тестирования 
- **СРЕДНЯЯ:** 12 элементов улучшат читаемость тестов

## 🎯 Следующие шаги

1. **P1 элементы** - исправить в первую очередь (toast, errors, loading)
2. **Unified Pattern** - применить схему `{зона}-{тип}-{описание}` везде
3. **Data Attributes** - добавить `data-*` атрибуты для состояний
4. **Testing Integration** - обновить Page Objects для новых testid