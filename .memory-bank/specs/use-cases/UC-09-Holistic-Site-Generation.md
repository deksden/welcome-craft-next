# UC-09: Holistic Site Generation (Холистическая Генерация Сайта)

**Версия:** 1.0.0  
**Дата:** 2025-06-20  
**Статус:** 📝 Specification  
**Приоритет:** High  
**Связанный Use Case:** Заменяет UC-08 Intelligent Artifact Search  
**World:** HOLISTIC_GENERATION_BASE

---

## 🎯 Цель и бизнес-ценность

### Пользователь и цель
**Как** HR-специалист  
**Я хочу** создать профессиональный онбординг-сайт одной командой AI  
**Чтобы** получить логически связный, качественный результат за минимальное время с максимальной эффективностью затрат

### Бизнес-ценность
1. **🚀 Революционная производительность**: Сокращение AI-вызовов с ~20 до 1 на генерацию сайта
2. **💎 Превосходное качество**: AI видит полную картину всех слотов для логически связного выбора
3. **⚡ Максимальная скорость**: Генерация сайта за 3-8 секунд вместо 30-60 секунд
4. **💰 Экономия затрат**: Снижение стоимости AI-вызовов в 20 раз
5. **🎨 Дизайн-консистентность**: Единый стиль и тема для всех элементов сайта

---

## 🌍 Предусловия (World Setup)

### Тестовый мир: HOLISTIC_GENERATION_BASE
- **Пользователь**: HR Manager (test-hr-manager@company.com)  
- **Артефакты**: Разнообразная библиотека контента для онбординга
  - 3x welcome messages (CEO, HR, Team Lead) - высокое качество
  - 2x contact lists (HR contacts, Dev Team contacts) - CSV формат
  - 2x useful links (General, IT-specific) - Markdown списки
  - 1x low-quality content (с localhost URLs) - для тестирования фильтрации
- **Site Blocks**: hero, key-contacts, useful-links (стандартные блоки)

### Архитектурные предусловия
- siteTool интегрирован с новой холистической AI-архитектурой
- Удалены компоненты UC-08: SmartSearchEngine, ContentQualityAnalyzer, artifactSearch
- Database schema очищена от UC-08 метаданных
- Zod схема SiteDefinitionSchema готова для structured output

---

## 📋 Сценарий выполнения

### Шаг 1: Инициация генерации сайта
**Дано**: HR Manager открыт чат в админ-панели  
**Когда**: Пользователь вводит "Создай онбординг-сайт для нового Backend разработчика"  
**Тогда**: 
- AI Оркестратор определяет намерение как создание сайта
- Вызывается обновленный siteTool.create() с холистическим подходом

### Шаг 2: Агрегация кандидатов для всех слотов
**Дано**: siteTool получил промпт пользователя  
**Когда**: Выполняется фаза сбора кандидатов  
**Тогда**:
- Для каждого блока сайта (hero, key-contacts, useful-links) собираются кандидаты
- Каждый слот получает до 10 релевантных артефактов через простой DB поиск
- Кандидаты агрегируются в структуру `allCandidates[blockType][slotName]`
- Сохраняется только необходимая информация: artifactId, title, summary

### Шаг 3: Единый AI-вызов для всего сайта
**Дано**: Все кандидаты собраны для всех слотов  
**Когда**: Выполняется холистический AI-анализ  
**Тогда**:
- Формируется комплексный system prompt для AI эксперта по онбордингу
- User prompt содержит запрос пользователя + полную структуру кандидатов
- AI делает **ОДИН** вызов generateObject с SiteDefinitionSchema
- AI выбирает НАИБОЛЕЕ ПОДХОДЯЩИЕ артефакты для КАЖДОГО слота с учетом общей темы

### Шаг 4: Возврат результата и рендеринг
**Дано**: AI вернул валидную SiteDefinition структуру  
**Когда**: siteTool завершает обработку  
**Тогда**:
- Возвращается JSON строка с полным определением сайта
- AI Оркестратор получает ArtifactMetadata для site артефакта
- В чате отображается ArtifactPreview с результатом
- Пользователь может просмотреть и опубликовать сгенерированный сайт

---

## ✅ Acceptance Criteria

### Функциональные требования

#### AC-1: Производительность холистической генерации
- [ ] Генерация сайта выполняется за **ОДИН** AI-вызов вместо ~20
- [ ] Общее время генерации ≤ 8 секунд (вместо 30-60 секунд UC-08)
- [ ] Memory footprint при генерации ≤ 100MB
- [ ] Batch сбор кандидатов выполняется параллельно для всех слотов

#### AC-2: Качество холистического выбора
- [ ] AI выбирает контекстуально связные артефакты для всех слотов
- [ ] Для Backend разработчика выбираются IT-specific контакты, а не HR general
- [ ] Welcome message соответствует роли (Team Lead, а не CEO)
- [ ] Useful links релевантны технической специализации
- [ ] Низкокачественный контент (localhost URLs) автоматически фильтруется

#### AC-3: Архитектурная целостность
- [ ] siteTool.create() использует только простой DB поиск + один AI-вызов
- [ ] Нет вызовов SmartSearchEngine, ContentQualityAnalyzer, artifactSearch
- [ ] generateObject использует валидную SiteDefinitionSchema
- [ ] Error handling: graceful fallback к простому выбору при AI failures
- [ ] Logging: детальная аналитика времени выполнения каждой фазы

### Технические требования

#### AC-4: Database и Schema интеграция
- [ ] SiteDefinitionSchema корректно валидирует AI output
- [ ] Удалены UC-08 поля: metadata, quality_score, last_analyzed_at
- [ ] Migration rollback выполнена без потери данных
- [ ] Индексы оптимизированы для простого поиска кандидатов

#### AC-5: Промпт-инжиниринг
- [ ] System prompt обеспечивает экспертное понимание онбординга
- [ ] User prompt содержит полный контекст всех кандидатов
- [ ] AI понимает структуру блоков и слотов
- [ ] Temperature=0.1 для консистентности выбора
- [ ] Timeout protection: 30 секунд + 60 секунд platform

#### AC-6: Testing и Quality Assurance
- [ ] Новый E2E тест проверяет полный холистический сценарий
- [ ] AI Fixtures обеспечивают детерминистичное тестирование
- [ ] Удалены UC-08 unit тесты (12 файлов)
- [ ] siteTool unit тест проверяет один generateObject вызов
- [ ] Performance benchmarking: измерение времени vs UC-08

---

## 🧪 Связанный тест

**E2E Test**: `tests/e2e/use-cases/UC-09-Holistic-Site-Generation.test.ts`  
**Unit Test**: `tests/unit/artifacts/kinds/site/server-holistic.test.ts`  
**AI Fixtures**: 
- `tests/fixtures/ai/holistic-site-generation-backend-dev.json`
- `tests/fixtures/ai/holistic-fallback-quality-filter.json`

---

## 🏗️ Архитектурный контекст

### Философия трансформации
UC-09 представляет **фундаментальный сдвиг** от итеративного к холистическому AI-подходу:

**Было (UC-08)**: Послотовый анализ с множественными AI-вызовами
```
siteTool → SmartSearchEngine → ContentQualityAnalyzer → artifactSearch
         ↓                   ↓                        ↓
    20 AI calls      Complex ranking            Batch processing
```

**Стало (UC-09)**: Холистический анализ с единым AI-вызовом
```
siteTool → Simple DB Query → Single AI Call → Complete Site
         ↓                  ↓                ↓
    1 DB query      Full context      Structured output
```

### Технические преимущества
1. **Semantic Coherence**: AI видит весь контекст для связного выбора
2. **Cost Efficiency**: Драматическое снижение API costs
3. **Simplified Architecture**: Устранение сложных промежуточных слоев
4. **Better UX**: Faster response, более предсказуемые результаты
5. **Easier Maintenance**: Меньше компонентов = меньше точек отказа

### Сохраненные концепции UC-08
- **Quality filtering**: Базовая фильтрация localhost/placeholder на AI уровне
- **Context awareness**: Учет роли, департамента, темы сайта в промпте
- **Semantic hints**: Интеграция block-specific подсказок в промпт
- **Graceful degradation**: Fallback к простому выбору при AI errors

---

## 📊 Метрики успеха

### Производительность
- **AI Calls**: 1 вызов (было ~20 в UC-08)
- **Response Time**: ≤8s (было 30-60s в UC-08)  
- **Cost Reduction**: 95% снижение AI costs
- **Memory Usage**: ≤100MB peak (было ~500MB в UC-08)

### Качество
- **Contextual Relevance**: ≥90% релевантность к роли пользователя
- **Content Quality**: ≥95% исключение низкокачественного контента
- **Style Consistency**: Единообразие темы и стиля для всех элементов
- **User Satisfaction**: ≥85% позитивная оценка в A/B тестах

### Техническая стабильность  
- **Error Rate**: ≤1% при нормальной работе AI
- **Fallback Success**: 100% graceful degradation при AI failures
- **Test Coverage**: 95%+ для нового холистического кода
- **Type Safety**: 0 TypeScript errors в производственной сборке

---

## 🔮 Будущие расширения

### Краткосрочные (готово к реализации)
1. **Advanced Prompt Templates**: Специализированные промпты для разных ролей
2. **Quality Scoring Integration**: Возврат AI confidence scores
3. **Multi-language Support**: Холистическая генерация на разных языках

### Среднесрочные  
1. **User Learning Integration**: Адаптация на основе предпочтений пользователя
2. **Advanced Block Types**: Support для gallery, testimonials, FAQ блоков
3. **Template Inheritance**: Использование успешных сайтов как базы

### Долгосрочные
1. **Predictive Generation**: AI предсказывает потребности до запроса
2. **Cross-Platform Integration**: Холистическая генерация для других форматов
3. **Real-time Collaboration**: Multi-user холистическая генерация

---

**Связанные документы:**
- Архитектурный план: `.memory-bank/architecture/system-patterns.md#холистическая-ai-генерация`
- UC-08 Legacy: `.memory-bank/done/archive-2025-06-20/UC-08-Intelligent-Artifact-Search.md`
- Технические детали: `.memory-bank/tasks/task-05-holistic-site-generation/IMPLEMENTATION-PLAN.md`