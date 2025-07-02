# 🐞 WelcomeCraft Bug Log

**AURA: AI-Unified Recall Architecture** — Kanban доска для отслеживания ошибок.

**Версия:** 3.8.0  
**Последнее обновление:** 2025-07-02 (BUG-070/071 ИСПРАВЛЕНЫ + SPACING UNIFICATION)  
**Статус:** ✅ FULLY CLEAN - все баги исправлены, spacing унифицирован

---

## 🧊 Backlog (Активные баги)

*(Все критические баги исправлены - готов к новым инициативам)*

---

## 📝 To Do (Готово к работе)

*(В настоящее время нет активных задач)*



- ✅ **#BUG-070: React setState в render ошибка ИСПРАВЛЕНА** `2025-07-02`
  - **Проблема:** Server Function `getSupportedFileTypes()` вызывался во время рендера (строки 51-53)
  - **Решение:** Перенесен вызов в `useEffect()` hook для правильного жизненного цикла React компонента
  - **Files Fixed:** `components/file-import-demo.tsx`

- ✅ **#BUG-071: Logger транспорт warning ИСПРАВЛЕН** `2025-07-02`
  - **Проблема:** `@fab33/fab-logger` падал с "All configured transports failed" warning
  - **Решение:** Заменен на стандартное console логирование с совместимым API (включая `child()` метод)
  - **Files Fixed:** `lib/db/queries.ts`

- ✅ **#SPACING UNIFICATION ЗАВЕРШЕНА** `2025-07-02`
  - **Проблема:** Inconsistent spacing между страницами (artifacts/import имели правильный spacing)
  - **Решение:** Применен единый spacing `py-10 px-4 md:px-6 lg:px-8` ко всем admin страницам
  - **Files Updated:** `users/page.tsx`, `metrics/page.tsx`, `seed-export/page.tsx`, `seed-import/page.tsx`, `worlds/page.tsx`

- ✅ **#BUG-036: Кнопка "создать артефакт" исправлена** `2025-07-02`
  - **Проблема:** При клике на кнопку "создать артефакт" пользователь перенаправлялся в чат (`router.push('/')`)
  - **Решение:** Заменен на `setArtifact()` с правильными параметрами для создания нового артефакта

---

## 🔄 In Progress (В работе)

*(В настоящее время нет задач в работе)*

---

## ✅ Done (Недавние исправления)

### 🎯 Июль 2025 (BUG-074 - BUG-087)

- ✅ **#BUG-087: Сайдбар не обновляется автоматически после создания артефактов** `2025-07-02`
  - **Проблема:** Отсутствовал event listener для `artifact-list-refresh` событий в сайдбаре
  - **Решение:** Добавлен useEffect hook + SWR mutate() при получении refresh events

- ✅ **#BUG-086: Артефакты не отображаются после перегенерации** `2025-07-02`
  - **Проблема:** Tool calls не извлекались из правильного места в generateText() result
  - **Решение:** Fallback логика извлечения из result.steps + диагностика структуры

- ✅ **#BUG-073: Импорт файлов вынесен из артефактов в отдельный раздел** `2025-07-02`
  - **Проблема:** Импорт файлов был спрятан в табах на странице артефактов
  - **Решение:** Создана отдельная страница /import + ссылка в sidebar + убраны табы

- ✅ **#BUG-072: Пропал раздел World Login в Dev Tools** `2025-07-02`
  - **Проблема:** Отсутствовали импорты WorldIndicator и DevWorldSelector в sidebar
  - **Решение:** Добавлены импорты + создана World Login секция в Dev Tools

- ✅ **#BUG-081: PostgreSQL UUID ошибка при отправке сообщений в чат** `2025-07-02`
  - **Проблема:** AI SDK генерирует ID сообщений "msg-XXX", но БД ожидает UUID
  - **Решение:** Заменен `msg.id` на `generateUUID()` + исправлена дедупликация

- ✅ **#BUG-080: Регрессия BUG-079 - world_id null, чаты не появляются** `2025-07-02`
  - **Проблема:** `getCurrentWorldContextSync()` не работает на сервере
  - **Решение:** Заменен на `getWorldContextFromRequest()` + server-side window fixes

- ✅ **#BUG-079: HR admin - не сохраняются чаты и артефакты** `2025-07-02`
  - **Проблема:** Отсутствие world_id в функциях сохранения
  - **Решение:** Добавлена world isolation в saveChat/saveArtifact/saveMessages

- ✅ **#BUG-078: Chat Send→Stop button transformation** `2025-07-02`
  - **Фича:** Send кнопка превращается в Stop при AI генерации
  - **Решение:** Интеграция с Vercel AI SDK stop() функцией

- ✅ **#BUG-077: Артефакты не открываются - Spectrum pipeline reconstruction** `2025-07-02`
  - **Проблема:** 403 API ошибки + пустые Spectrum таблицы + papaparse конфликты
  - **Решение:** Test world detection + заполнение A_Person/A_Address/A_Link + убраны papaparse

- ✅ **#BUG-076: КОЛЛАБОРАТИВНАЯ СИСТЕМА АРТЕФАКТОВ** `2025-07-02`
  - **Фича:** По умолчанию показывать все артефакты + фильтр "Мои"
  - **Решение:** Database schema + API + UI ToggleGroup + персистентные настройки

- ✅ **#BUG-075: Артефакты не отображаются в тестовых мирах** `2025-07-02`
  - **Проблема:** userId фильтрация блокирует demo контент
  - **Решение:** Test world detection + показ всех артефактов мира

- ✅ **#BUG-074: PostgreSQL UUID ошибка - строковые ID вместо UUID** `2025-07-02`
  - **Проблема:** Quick Login создает строковые ID
  - **Решение:** `generateDeterministicUUID()` из SHA-256 hash email

### 🎯 Phoenix & Testing Infrastructure

- ✅ **#BUG-062: HR администратор не видит разделов интерфейса** `2025-07-01`
- ✅ **#BUG-061: Phoenix Quick Login UX проблемы** `2025-07-01`
- ✅ **#BUG-060: Отсутствует список миров на странице входа** `2025-07-01`
- ✅ **#BUG-057: World Isolation + Parallel E2E Testing Architecture** `2025-07-01`
- ✅ **#BUG-056: E2E тесты производительность - ускорение в 16.5 раз** `2025-07-01`

---

## 📚 Архивы

**Последний архив:** `.memory-bank/done/buglog-archive-2025-07-02.md` (11 багов)  
**Предыдущие архивы:** `.memory-bank/done/archive-2025-06-30/`

---

## 📋 Шаблон для новых багов

```markdown
- [ ] **#BUG-XXX: Краткое описание проблемы**
  - **Priority:** High/Medium/Low | **Type:** Bug/Enhancement | **Created:** YYYY-MM-DD
  - **Description:** Подробное описание бага
  - **User Report:** "Точная цитата пользователя"
  - **Files Affected:** Список файлов
```

---

## 🎯 Процесс работы с багами

### Workflow:
1. **WF-01: Работа с ошибками** - полный цикл с тестом
2. **WF-02: Фикс без теста** - для незначительных багов
3. **WF-03: Обновление memory bank** - фиксация опыта
4. **WF-04: Архивирование** - перенос решенных багов в архив

### Критерии качества:
- ✅ **TypeScript:** `pnpm typecheck` без ошибок
- ✅ **ESLint:** `pnpm lint` без предупреждений  
- ✅ **Build:** `pnpm build` успешная сборка
- ✅ **Testing:** Unit/E2E тесты проходят
- ✅ **User Verification:** Подтверждение от пользователя

---

> **Статус:** 🧹 CLEAN - готов к новым задачам  
> **Production Status:** ✅ READY - все критические баги решены