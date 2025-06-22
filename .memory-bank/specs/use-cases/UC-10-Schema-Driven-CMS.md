# 🎯 UC-10: Schema-Driven Content Management System

**ID:** UC-10  
**Версия:** 1.0.0  
**Дата создания:** 2025-06-20  
**Статус:** Спецификация создана  
**Приоритет:** Critical  
**Связанная задача:** #CMS-REFACTOR-UC10-SPECIFICATION  

---

## 📋 Обзор Use Case

**Название:** Переход на Схема-ориентированную Архитектуру Контента  
**Цель:** Трансформация WelcomeCraft от MVP к enterprise-ready CMS с раздельным хранением данных, динамическим маппингом полей и поддержкой сложных типов артефактов  
**Бизнес-ценность:** Масштабируемость, гибкость, поддержка больших библиотек контента  

---

## 👤 Пользователь и цель

**Пользователь:** HR-специалист и команда разработки WelcomeCraft  
**Цель:** Получить мощную, масштабируемую CMS систему способную поддерживать разнообразные типы контента (person, address, FAQ, sets) с динамическим маппингом между блоками сайтов и артефактами  

---

## 🌍 Предусловия (World)

**Рекомендуемый World:** ENTERPRISE_ONBOARDING_EXTENDED  
- Расширенная версия существующего мира с дополнительными типами артефактов
- Содержит examples для новых типов: person, address, faq-item, set-definition, set
- Поддержка файлов импорта (.docx, .xlsx) для тестирования
- Multi-user среда для тестирования прав доступа

---

## 🎯 Сценарий выполнения

### Фаза 1: Database Schema Foundation
**Дано:** Существующая Sparse Columns архитектура с content_text, content_url, content_site_definition  
**Когда:** Создается миграция 0007_schema_driven_artifacts.sql  
**Тогда:** 
- Таблица Artifact содержит только метаданные (без content колонок)
- Созданы специализированные таблицы: A_Text, A_Image, A_Person, A_SetDefinition, A_SetItems
- Поддержаны новые типы артефактов: person, address, faq-item, link, set-definition, set
- Все существующие данные корректно мигрированы

### Фаза 2: Artifact Savers Registry
**Дано:** Новая схема БД с раздельными таблицами  
**Когда:** Создается система диспетчеризации saveArtifact  
**Тогда:**
- artifacts/artifact-savers.ts содержит реестр обработчиков по типам
- Каждый artifacts/kinds/[kind]/server.ts имеет специфическую save() функцию
- saveArtifact в lib/db/queries.ts работает как диспетчер
- Поддержана обратная совместимость для всех существующих типов

### Фаза 3: File Import System
**Дано:** Диспетчер сохранения артефактов  
**Когда:** Пользователь загружает .docx или .xlsx файл  
**Тогда:**
- importArtifact Server Action автоматически определяет тип файла
- .docx конвертируется в text артефакт через mammoth + turndown
- .xlsx конвертируется в sheet артефакт через xlsx library
- Создается соответствующий артефакт с правильными метаданными
- Временный файл удаляется из Vercel Blob

### Фаза 4: Enhanced Site Editor
**Дано:** Новые типы артефактов (person, set)  
**Когда:** Пользователь создает site с person-list блоком  
**Тогда:**
- ArtifactSelectorSheet фильтрует артефакты по kind='person'
- Динамический маппинг полей person → блок свойства
- Поддержка set артефактов для галерей и списков
- Visual редактор отображает превью новых типов контента

### Фаза 5: Advanced Block Types
**Дано:** Схема-ориентированная архитектура  
**Когда:** Добавляются новые блоки (team-gallery, faq-section)  
**Тогда:**
- Блоки автоматически находят совместимые артефакты по schema
- Dynamic property mapping между блок schema и artifact fields
- Support для complex data structures (arrays, nested objects)
- Automatic validation и type safety

---

## ✅ Acceptance Criteria

### Database & Backend
- [ ] **A1:** Миграция 0007 успешно применяется без потери данных
- [ ] **A2:** Все 5 новых таблиц (A_Text, A_Image, A_Person, A_SetDefinition, A_SetItems) созданы
- [ ] **A3:** artifact-savers.ts реестр поддерживает все типы артефактов  
- [ ] **A4:** saveArtifact диспетчер корректно маршрутизирует по типам
- [ ] **A5:** importArtifact обрабатывает .docx/.xlsx файлы

### New Artifact Types
- [ ] **A6:** person артефакты содержат fullName, position, photoUrl, quote
- [ ] **A7:** address артефакты поддерживают структурированные адреса
- [ ] **A8:** faq-item артефакты с question/answer парами
- [ ] **A9:** set-definition определяет allowed kinds и constraints
- [ ] **A10:** set артефакты связывают multiple items с ordering

### Frontend & UX
- [ ] **A11:** ArtifactSelectorSheet фильтрует по новым типам
- [ ] **A12:** Visual Site Editor поддерживает новые блоки
- [ ] **A13:** Property mapping между блоками и артефактами
- [ ] **A14:** File upload UI интегрирован с importArtifact
- [ ] **A15:** Превью новых типов артефактов в ArtifactPreview

### Testing & Quality
- [ ] **A16:** Unit тесты покрывают все новые savers
- [ ] **A17:** E2E тесты для import workflow
- [ ] **A18:** UC-02, UC-05 переписаны под новый редактор
- [ ] **A19:** TypeScript compilation 0 ошибок
- [ ] **A20:** All existing functionality остается работоспособной

### Documentation
- [ ] **A21:** architecture/artifacts.md полностью переписан
- [ ] **A22:** API documentation обновлена для новых endpoints
- [ ] **A23:** product-guide.md описывает новые возможности
- [ ] **A24:** Миграционный guide для разработчиков

---

## 🔗 Связи

**Связанный тест:** `tests/e2e/use-cases/UC-10-Schema-Driven-CMS.test.ts`  
**Связанные спецификации:**
- `.memory-bank/specs/components/enhanced-site-editor.md`
- `.memory-bank/specs/components/file-import-system.md`
- `.memory-bank/specs/components/artifact-savers-registry.md`

**Зависимые Use Cases:**
- UC-02 AI Site Generation (требует обновления)
- UC-05 Multi-Artifact Creation (требует обновления)

---

## 📊 Метрики успеха

**Performance:**
- Database queries 30% быстрее за счет типизированных таблиц
- Site generation поддерживает 10+ новых типов блоков
- File import менее 5 секунд для типичных документов

**Developer Experience:**
- TypeScript автокомплит для всех новых типов
- Zero breaking changes для существующей функциональности
- Comprehensive documentation и examples

**User Experience:**  
- Богатые типы контента (команды, FAQ, галереи)
- Drag & drop file import
- Visual schema mapping в Site Editor

---

## 🚧 Риски и митigation

**Риск 1:** Миграция данных может привести к потере контента  
**Митigation:** Создание резервных копий + rollback план + тщательное тестирование миграции

**Риск 2:** Breaking changes в API могут сломать существующие интеграции  
**Митigation:** Обратная совместимость через adapter слой + versioned API endpoints

**Риск 3:** Performance degradation из-за сложности новой архитектуры  
**Митigation:** Database indexing + query optimization + performance тестирование

**Риск 4:** Сложность тестирования возрастает экспоненциально  
**Mitigation:** Модульный подход + comprehensive mocking + automated testing

---

## 🔄 Этапы реализации

1. **Database Foundation** (2-3 дня)
2. **Savers Registry** (1-2 дня)  
3. **File Import** (2-3 дня)
4. **Unit Tests** (1-2 дня)
5. **E2E Tests** (2-3 дня)
6. **Documentation** (1-2 дня)
7. **QA & Verification** (1 день)

**Общее время:** 10-16 дней

---

**Создано:** 2025-06-20  
**Автор:** Claude Code Assistant  
**Статус:** ✅ Спецификация готова к реализации