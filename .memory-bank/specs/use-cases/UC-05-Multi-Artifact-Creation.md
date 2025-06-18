# UC-05: Создание комплексного онбординг-набора

**ID Сценария:** UC-05  
**Приоритет:** Высокий  
**Бизнес-ценность:** Демонстрация полной мощи AI-first подхода для создания комплексных материалов  
**Версия:** 1.0.0  
**Дата:** 2025-06-18

---

## 1. Пользователь и Цель

**Как** Senior HR Manager "Elena",  
**Я хочу** создать полный набор онбординг-материалов для нового Technical Lead через один диалог с AI,  
**Чтобы** подготовить весь необходимый контент: welcome-письмо, техническую документацию, контакты команды и финальный сайт.

## 2. Предусловия (Тестовый "Мир")

- **Мир:** `WORLDS.ENTERPRISE_ONBOARDING`
- **Описание мира:** Пользователь "Elena" аутентифицирован. Система содержит базовые шаблоны для different roles и готовые блоки контента. Есть возможность создавать multiple artifact types в одном workflow.

## 3. Сценарий выполнения

### Часть 1: Инициализация комплексного запроса
- **Дано:** Пользователь "Elena" в новом чате
- **Когда:** Пользователь вводит развернутый запрос: "Создай полный онбординг-пакет для нового Technical Lead Михаила: приветственное письмо от CTO, список ключевых контактов команды разработки, техническую документацию по нашему стеку, и финальный сайт объединяющий все это"
- **Тогда:** AI Оркестратор анализирует запрос и определяет необходимость создания multiple artifacts

### Часть 2: Последовательное создание артефактов
- **Когда:** AI обрабатывает запрос
- **Тогда:** AI вызывает `artifactCreate` для text артефакта "Приветственное письмо от CTO"
- **И:** Создается text артефакт с персонализированным контентом для Technical Lead роли
- **Затем:** AI вызывает `artifactCreate` для sheet артефакта "Контакты команды разработки"  
- **И:** Создается таблица с релевантными контактами (tech leads, архитекторы, DevOps)
- **Затем:** AI вызывает `artifactCreate` для text артефакта "Техническая документация"
- **И:** Создается structured документ с информацией о технологическом стеке
- **Наконец:** AI вызывает `artifactCreate` для site артефакта "Онбординг Technical Lead"

### Часть 3: Интеграция артефактов в сайт
- **Когда:** Site артефакт создается
- **Тогда:** AI автоматически связывает ранее созданные артефакты с соответствующими слотами:
  - Text "Приветственное письмо" → hero блок сайта
  - Sheet "Контакты команды" → key-contacts блок  
  - Text "Техническая документация" → useful-links блок
- **И:** Все связи настраиваются на "latest version" для автоматических обновлений

### Часть 4: Визуализация и финализация
- **Когда:** Все артефакты созданы и связаны
- **Тогда:** В чате отображается последовательность ArtifactPreview компонентов для каждого созданного артефакта
- **И:** Пользователь может открыть site артефакт и увидеть полноценный онбординг-сайт
- **И:** Все компоненты сайта наполнены релевантным контентом из связанных артефактов
- **И:** Пользователь может дополнительно уточнить любой из компонентов: "Добавь в контакты также HR Business Partner"

## 4. Acceptance Criteria

✅ **AI Workflow Management:**
- [ ] AI корректно интерпретирует комплексные запросы требующие multiple artifacts
- [ ] Последовательность создания артефактов логична и эффективна
- [ ] AI автоматически создает связи между артефактами в site structure
- [ ] Каждый artifact имеет релевантный контент для указанной роли

✅ **Multi-artifact Creation:**
- [ ] Все 4 типа артефактов создаются успешно (text × 2, sheet × 1, site × 1)
- [ ] Каждый ArtifactPreview появляется в чате после создания
- [ ] Асинхронная генерация не блокирует создание следующих артефактов
- [ ] SWR polling обновляет каждый артефакт по мере готовности контента

✅ **Site Integration:**
- [ ] Site автоматически связывается с созданными артефактами
- [ ] Hero блок содержит welcome-письмо
- [ ] Key-contacts блок отображает таблицу контактов
- [ ] Useful-links блок ссылается на техническую документацию
- [ ] Все связи настроены на "latest version"

✅ **Performance & UX:**
- [ ] UI остается responsive во время создания multiple artifacts
- [ ] Progress indicators показывают статус генерации каждого артефакта
- [ ] Итоговый сайт загружается без задержек
- [ ] Возможность параллельного редактирования отдельных компонентов

## 5. Связанный E2E-тест

- **🔗 Реализация:** `tests/e2e/use-cases/UC-05-Multi-Artifact-Creation.test.ts`
- **Мир:** `WORLDS.ENTERPRISE_ONBOARDING`
- **AI Фикстуры:** 
  - `multi-artifact-text-cto-letter.json`
  - `multi-artifact-sheet-contacts.json`
  - `multi-artifact-text-tech-docs.json`
  - `multi-artifact-site-integration.json`

## 6. AI Prompts и Стратегия

**Prompt Engineering:**
- Комплексные системные промпты для understanding multi-step requests
- Context management между sequential artifact creation
- Role-specific content generation для Technical Lead онбординга

**AI Tools Sequence:**
1. `artifactCreate(kind: 'text')` → CTO welcome letter
2. `artifactCreate(kind: 'sheet')` → Development team contacts  
3. `artifactCreate(kind: 'text')` → Technical documentation
4. `artifactCreate(kind: 'site')` → Integrated onboarding site

**Content Quality:**
- Role-appropriate язык и тон для Technical Lead аудитории
- Актуальная техническая информация и realistic контакты
- Логичная структура и навигация в финальном сайте

## 7. Технические компоненты

**Asynchronous Processing:**
- Multiple background AI tasks running concurrently  
- SWR polling для independent artifact updates
- Progress tracking для each artifact generation stage

**Artifact Linking:**
- Automatic site slot assignment based on artifact types
- Latest version references для dynamic updates
- Fallback handling если artifact generation fails

**Performance Optimization:**
- Concurrent AI calls где possible
- Optimistic UI updates с skeleton loading
- Efficient artifact retrieval для site rendering

## 8. Зависимости и Интеграции

**AI System:**
- Двухуровневая архитектура с enhanced Orchestrator logic
- Multiple Specialist AI для different artifact types
- Context preservation across sequential operations

**Site System:**
- Dynamic блок assignment logic
- Artifact slot management с version control
- Site Editor поддержка для complex structures

**Database:**
- Efficient artifact storage с sparse columns
- Site definition в JSONB с multiple references
- Version tracking для linked artifacts

---

> **Бизнес-контекст:** Этот use case демонстрирует enterprise-level возможности WelcomeCraft - создание comprehensive онбординг-пакетов через один AI диалог, что радикально сокращает время подготовки материалов для senior позиций.