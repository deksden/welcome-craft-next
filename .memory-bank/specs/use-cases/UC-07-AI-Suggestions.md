# UC-07: Работа с AI предложениями и улучшениями

**ID Сценария:** UC-07  
**Приоритет:** Низкий  
**Бизнес-ценность:** Демонстрация интеллектуальных возможностей AI для непрерывного улучшения контента  
**Версия:** 1.0.0  
**Дата:** 2025-06-19

---

## 1. Пользователь и Цель

**Как** HR Manager "Maria",  
**Я хочу** получать интеллектуальные предложения от AI для улучшения контента артефактов,  
**Чтобы** постоянно повышать качество онбординг-материалов без дополнительных усилий.

## 2. Предусловия (Тестовый "Мир")

- **Мир:** `WORLDS.CONTENT_LIBRARY_BASE`
- **Описание мира:** Пользователь "Maria" аутентифицирован. В библиотеке есть артефакты с различным качеством контента. AI система настроена для генерации contextual suggestions.

## 3. Сценарий выполнения

### Часть 1: Автоматические AI Suggestions
- **Дано:** Пользователь открывает существующий text артефакт в панели управления
- **Когда:** AI анализирует контент артефакта на предмет улучшений
- **Тогда:** В боковой панели появляется секция "AI Suggestions" с 2-3 предложениями
- **И:** Каждое предложение содержит:
  - Тип улучшения (grammar, clarity, tone, structure)
  - Краткое описание изменения
  - Preview кнопку для просмотра
  - Accept/Dismiss действия

### Часть 2: Preview и Apply Suggestions
- **Дано:** В панели AI Suggestions есть предложение "Improve readability"
- **Когда:** Пользователь кликает "Preview" на suggestion
- **Тогда:** Открывается side-by-side view с оригиналом и улучшенной версией
- **И:** Изменения выделены highlights (additions, deletions, modifications)
- **Когда:** Пользователь кликает "Apply Suggestion"
- **Тогда:** Создается новая версия артефакта с примененными изменениями
- **И:** Suggestion помечается как "Applied" и исчезает из списка

### Часть 3: Dismiss и Feedback System
- **Дано:** AI предлагает изменить тон на более формальный
- **Когда:** Пользователь считает предложение неподходящим и кликает "Dismiss"
- **Тогда:** Появляется optional feedback form с причинами отклонения
- **И:** Suggestion удаляется из текущего списка
- **И:** AI запоминает предпочтения для будущих suggestions (learning)

### Часть 4: Contextual Suggestions для Site Artifacts
- **Дано:** Пользователь работает с site артефактом
- **Когда:** AI анализирует структуру и контент сайта
- **Тогда:** Появляются site-specific suggestions:
  - "Add FAQ section for better user guidance"
  - "Optimize mobile layout for key-contacts block"
  - "Include call-to-action in hero section"
- **И:** Каждое предложение включает готовую реализацию или template

### Часть 5: Bulk Suggestions для Content Library
- **Дано:** Пользователь находится в Content Library с множественными артефактами
- **Когда:** AI проводит анализ всей библиотеки контента
- **Тогда:** В top panel появляется "Library Insights" с общими рекомендациями:
  - Inconsistent tone across 5 welcome messages
  - Missing contact information in 3 onboarding guides
  - Outdated links detected in 2 resource documents
- **И:** Bulk actions доступны для применения suggestions к multiple artifacts

## 4. Acceptance Criteria

✅ **Automatic Suggestion Generation:**
- [ ] AI автоматически анализирует открытые артефакты
- [ ] Suggestions появляются в dedicated UI panel
- [ ] Различные типы suggestions (grammar, tone, structure, content)
- [ ] Suggestions релевантны контексту и типу артефакта

✅ **Preview & Apply Workflow:**
- [ ] Side-by-side preview с highlight изменений
- [ ] Apply создает новую версию без потери оригинала
- [ ] Visual feedback о применении suggestions
- [ ] Undo functionality для recently applied suggestions

✅ **Feedback & Learning:**
- [ ] Dismiss functionality с optional feedback
- [ ] AI learning от user preferences
- [ ] Suggestion quality улучшается со временем
- [ ] No repetitive suggestions для dismissed improvements

✅ **Site-Specific Intelligence:**
- [ ] Contextual suggestions для site artifacts
- [ ] Structure и layout recommendations
- [ ] Ready-to-use templates для suggested improvements
- [ ] Integration с site editor для seamless application

✅ **Library-Level Insights:**
- [ ] Bulk analysis всей content library
- [ ] Cross-artifact consistency recommendations
- [ ] Batch operations для library-wide improvements
- [ ] Priority-based suggestion ranking

## 5. Связанный E2E-тест

- **🔗 Реализация:** `tests/e2e/use-cases/UC-07-AI-Suggestions.test.ts`
- **Мир:** `WORLDS.CONTENT_LIBRARY_BASE`
- **AI Фикстуры:** 
  - `suggestions-grammar-improvement.json`
  - `suggestions-tone-adjustment.json`
  - `suggestions-site-optimization.json`
  - `suggestions-library-insights.json`

## 6. AI Suggestions Engine

**Suggestion Types:**
- **Grammar & Style** — исправление ошибок, улучшение читаемости
- **Tone Adjustment** — формальный/неформальный тон, audience targeting
- **Content Structure** — organization, headings, flow improvement
- **Completeness** — missing information, additional context
- **Consistency** — alignment с other content в library

**Intelligence Levels:**
- **Basic** — rule-based suggestions (grammar, spelling)
- **Contextual** — content-aware improvements (tone, structure)
- **Library-wide** — cross-artifact analysis и consistency
- **Learning** — user preference adaptation over time

## 7. Технические компоненты

**Suggestion Generation:**
- Background AI analysis для открытых артефактов
- Content quality scoring и improvement identification
- Context-aware suggestion ranking и priority
- Real-time suggestion updates при content changes

**UI Components:**
- Suggestion panel с expandable/collapsible suggestions
- Side-by-side preview component с diff highlighting
- Feedback collection forms для dismissed suggestions
- Library insights dashboard с actionable recommendations

**Learning System:**
- User interaction tracking (accept/dismiss patterns)
- Preference storage и retrieval для personalization
- Suggestion quality metrics и continuous improvement
- A/B testing framework для suggestion algorithms

## 8. Зависимости и Интеграции

**AI Infrastructure:**
- Enhanced Specialist AI для content analysis
- Suggestion generation models с domain knowledge
- Learning pipeline для user preference adaptation
- Background processing для library-wide analysis

**Version System:**
- Integration с artifact versioning для suggestion application
- Rollback capabilities для recently applied suggestions
- Change tracking для applied vs dismissed suggestions
- History preservation для learning insights

**Content Library:**
- Cross-artifact analysis capabilities
- Bulk operation support для library-wide improvements
- Content consistency checking и recommendations
- Usage analytics для suggestion prioritization

---

> **Бизнес-контекст:** UC-07 демонстрирует WelcomeCraft как intelligent content assistant, который не только создает контент, но и continuously помогает его улучшать. Это особенно ценно для organizations с large content libraries, где manual quality control не масштабируется.