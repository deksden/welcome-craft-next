# UC-03: Переиспользование артефактов в разных контекстах

**ID Сценария:** UC-03  
**Приоритет:** Высокий  
**Бизнес-ценность:** Эффективность и консистентность - создание библиотеки переиспользуемого контента  
**Версия:** 1.0.0  
**Дата:** 2025-06-18

---

## 1. Пользователь и Цель

**Как** HR-менеджер "Maria",  
**Я хочу** создать стандартный текст приветствия от CEO один раз и использовать его в разных онбординг-сайтах,  
**Чтобы** поддерживать консистентность сообщений и избежать дублирования работы.

## 2. Предусловия (Тестовый "Мир")

- **Мир:** `WORLDS.CONTENT_LIBRARY_BASE`
- **Описание мира:** Пользователь "Maria" аутентифицирован. В системе уже есть несколько готовых артефактов: "Welcome от CEO", "Контакты HR", "Полезные ссылки". Есть один пустой сайт и возможность создать новый.

## 3. Сценарий выполнения

### Часть 1: Создание переиспользуемого контента
- **Дано:** Пользователь "Maria" в новом чате
- **Когда:** Пользователь говорит "Создай текст приветствия от CEO для новых сотрудников"
- **Тогда:** AI создает text артефакт "Welcome от CEO" с персонализированным текстом
- **И:** Артефакт сохраняется в библиотеке пользователя для будущего использования

### Часть 2: Clipboard workflow
- **Когда:** Пользователь переходит к существующему site артефакту
- **И:** Нажимает кнопку "Добавить в чат" в панели text артефакта "Welcome от CEO"
- **Тогда:** Появляется toast "Ссылка на артефакт скопирована"
- **И:** Артефакт добавляется в Redis clipboard с TTL 60 секунд

### Часть 3: Добавление в сайт через attachment
- **Когда:** Пользователь открывает чат с существующим site артефактом
- **И:** Нажимает кнопку "скрепка" в chat input
- **Тогда:** В dropdown меню появляется опция "Артефакт из буфера: Welcome от CEO"
- **Когда:** Пользователь выбирает эту опцию
- **Тогда:** В чат добавляется attachment с reference на text артефакт
- **И:** Пользователь может написать "Добавь этот welcome-текст в hero блок сайта"
- **И:** AI обновляет site артефакт, добавляя reference на text артефакт в hero слот

### Часть 4: Версионирование и консистентность
- **Когда:** Пользователь позже обновляет "Welcome от CEO" артефакт
- **Тогда:** Все сайты использующие "последнюю версию" автоматически отображают новый контент
- **Но:** Сайты с "закрепленной версией" продолжают показывать старый контент
- **И:** Пользователь может выбирать между "последней" и "закрепленной" версией в Site Editor

## 4. Acceptance Criteria

✅ **Clipboard система:**
- [ ] "Добавить в чат" кнопка работает из панели артефактов
- [ ] Redis clipboard с TTL 60 секунд работает корректно
- [ ] Attachment menu показывает доступные артефакты из clipboard
- [ ] Cross-page clipboard синхронизация через window focus events

✅ **AI понимание контекста:**
- [ ] AI понимает attachment references в сообщениях
- [ ] AI может интегрировать внешние артефакты в site structure
- [ ] AI корректно обновляет слоты сайта с references на артефакты

✅ **Версионирование:**
- [ ] Site Editor показывает выбор версии для каждого слота (latest vs pinned)
- [ ] "Последняя версия" автоматически обновляется при изменении артефакта
- [ ] "Закрепленная версия" остается неизменной
- [ ] Dropdown меню версий работает корректно

✅ **UX workflow:**
- [ ] Плавный переход между чатами при работе с clipboard
- [ ] Real-time обновление attachment menu
- [ ] Правильные toast уведомления на каждом шаге
- [ ] Intuitive визуальные индикаторы версионирования

## 5. Связанный E2E-тест

- **🔗 Реализация:** `tests/e2e/use-cases/UC-03-Artifact-Reuse.test.ts`
- **Мир:** `WORLDS.CONTENT_LIBRARY_BASE`
- **AI Фикстуры:** `text-creation-ceo-welcome.json`, `site-update-with-reference.json`

## 6. Технические компоненты

**Redis Clipboard:**
- `copyArtifactToClipboard()` server action
- `getArtifactFromClipboard()` для проверки
- TTL 60 секунд с автоочисткой
- Cross-page синхронизация через window focus

**Artifact References:**
- Tool-invocation архитектура для attachment display
- ArtifactPreview компонент для визуализации
- AI понимание attached artifacts в контексте

**Версионирование:**
- Composite primary key `(id, createdAt)` в БД
- "Latest version" vs "pinned version" логика
- Site Editor с dropdown выбора версий
- Automatic updates для latest version references

## 7. Зависимости и Интеграции

**Системные компоненты:**
- Redis KV для clipboard (Vercel KV / Upstash)
- Tool-invocation messaging архитектура
- Site Editor с версионированием слотов
- SWR для real-time updates

**UI компоненты:**
- ArtifactPreview для attachment display
- Attachment menu в ChatInput
- Version selector dropdown в Site Editor
- Toast notifications система

**API endpoints:**
- `/api/artifacts/clipboard/*` для Redis операций
- `/api/artifact` для получения specific versions
- Artifact server actions для clipboard management

---

> **Бизнес-контекст:** Этот use case демонстрирует эффективность WelcomeCraft - создание библиотеки переиспользуемого контента позволяет HR командам поддерживать консистентность и экономить время при подготовке онбординг-материалов.