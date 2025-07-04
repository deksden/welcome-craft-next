# 👨‍💻 Контекст Текущей Разработки

**Версия:** 3.0.0  
**Дата:** 2025-06-17  
**Статус:** Memory Bank ревизия завершена, система стабильна

## HISTORY:
* v3.0.0 (2025-06-17): Ревизия Memory Bank, архивирование устаревших данных, актуализация статуса
* v2.0.0 (2025-06-12): Фокус смещен на реализацию генерации сайтов на основе артефактов

## 1. Текущий статус проекта

### ✅ Завершенные архитектурные компоненты
- **Унификация артефактов** — все сущности работают под единой концепцией "Артефакт"
- **Двухуровневая AI архитектура** — Оркестратор + Специалисты полностью реализованы
- **Redis clipboard система** — поведение как у системного буфера обмена
- **Мульти-доменная архитектура** — app.localhost vs localhost корректно работает
- **Site generation система** — полная генерация сайтов из блоков и артефактов
- **Sparse columns БД** — типизированное хранение контента артефактов
- **Visual Site Editor** — современный блочный интерфейс для создания сайтов

### ⏳ Требует пользовательского тестирования
- **Clipboard Context Fixes (2025-06-17):**
  - DOM-based определение активного чата вместо URL-based
  - Window focus listener для синхронизации clipboard между страницами
  - "Добавить в чат" из панели артефактов
  - Real-time обновление attachment menu

## 2. Ключевые технические решения

### API Артефактов
- **Endpoints доступны глобально:** `/api/artifacts/*` работают на обеих доменах
- **Dual аутентификация:** NextAuth session + test-session fallback
- **Sparse columns:** `content_text`, `content_url`, `content_site_definition`

### Тестирование
- **Route tests:** 71/71 проходят стабильно
- **Unit tests:** 12/12 проходят с Vitest
- **E2E tests:** используют test auth систему для стабильности
- **Custom test auth:** обходит Auth.js v5 сложности

### AI система
- **Sheet generation:** переход на простую генерацию текста (без JSON schema)
- **Timeout защита:** 30 секунд + platform timeout 60 секунд
- **Детальное логирование:** полная наблюдаемость AI операций

## 3. Архитектурные инсайты

### Критические уроки
- **Мульти-доменная архитектура:** Влияет на cookies, аутентификацию и тестирование
- **PostgreSQL + тесты:** Требует валидный UUID формат для test users
- **Promise.race timeout:** Контролировать реальное ожидание данных, не мгновенные вызовы
- **DOM vs URL detection:** DOM-based определение надежнее для SPA

### Паттерны решений
- **Тестирование:** Test auth система для E2E, NextAuth для production
- **AI стабильность:** `mode: 'tool'` + четкие промпты + platform timeout
- **Clipboard UX:** Custom events + window focus для cross-page синхронизации

## 4. Следующие шаги

### Высокий приоритет
- **Подтверждение пользователем:** Clipboard context fixes требуют тестирования
- **Memory Bank актуализация:** Завершена архивация устаревших файлов

### Средний приоритет  
- Расширение библиотеки site blocks (FAQ, галерея, формы)
- User analytics dashboard
- Оптимизация E2E тестов (сейчас работают, но медленные)

### Низкий приоритет
- Artifact sharing между пользователями
- Advanced версионирование UI
- Performance оптимизации

---

> **Ключевая информация:** Система архитектурно завершена и стабильна. Все критические компоненты работают. Фокус на UX улучшениях и новых фичах.