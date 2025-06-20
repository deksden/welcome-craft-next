# 🚀 WelcomeCraft API Documentation

**Версия:** 1.0.0  
**Дата:** 2025-06-20  
**Статус:** Активная документация  

> **⚠️ ВАЖНО:** Данная документация должна обновляться при любых изменениях в API endpoints, параметрах или схемах данных.

---

## 📋 Общие принципы API

### Базовая информация
- **Базовый URL:** `https://app.welcome-onboard.ru/api` (production) / `http://app.localhost:3000/api` (development)
- **Формат данных:** JSON
- **Аутентификация:** NextAuth.js session cookies + test-session fallback для тестирования
- **Обработка ошибок:** Стандартные HTTP коды + детальные сообщения в формате `ChatSDKError`

### Архитектурные принципы
- **REST подход:** Четкое разделение ресурсов и действий
- **Мульти-доменность:** API доступны на обеих доменах (app.domain и domain)
- **World Isolation:** Поддержка изоляции данных по тестовым мирам
- **Sparse Column Storage:** Различные типы контента хранятся в разных колонках БД

---

## 🗂️ Структура API Endpoints

### Соглашения об именовании
- **Единственное число:** `/api/artifact` - работа с конкретным ресурсом по ID
- **Множественное число:** `/api/artifacts` - работа со списками ресурсов  
- **Вложенные ресурсы:** `/api/chat/[chatId]/details` - ресурсы в контексте родительского объекта

---

## 📦 Artifacts API

### GET `/api/artifact`
**Описание:** Получение конкретного артефакта по ID с версионной информацией.

**Параметры:**
- `id` (string, required) - ID артефакта
- `version` (number, optional) - Номер версии (по умолчанию: последняя)
- `versionTimestamp` (string, optional) - ISO timestamp конкретной версии

**Пример запроса:**
```
GET /api/artifact?id=abc123&version=2
```

**Пример ответа:**
```json
[
  {
    "id": "abc123",
    "title": "Приветственное письмо",
    "kind": "text",
    "content": "Добро пожаловать в команду!",
    "summary": "Текст приветствия для новых сотрудников",
    "createdAt": "2025-06-20T10:00:00Z",
    "userId": "user123",
    "authorId": "author456",
    "deletedAt": null,
    "content_text": "Добро пожаловать в команду!",
    "content_url": null,
    "content_site_definition": null,
    "publication_state": [],
    "world_id": null
  }
]
```

**Коды ответов:**
- `200 OK` - Успешное получение данных
- `404 Not Found` - Артефакт не найден
- `401 Unauthorized` - Требуется аутентификация (для приватных артефактов)

---

### POST `/api/artifact`
**Описание:** Создание новой версии артефакта или обновление существующего.

**Тело запроса:**
```json
{
  "id": "abc123",
  "title": "Обновленное приветствие",
  "content": "Добро пожаловать в нашу команду!",
  "kind": "text"
}
```

**Коды ответов:**
- `200 OK` - Версия успешно создана
- `400 Bad Request` - Некорректные данные
- `401 Unauthorized` - Недостаточно прав

---

### GET `/api/artifacts`
**Описание:** Получение списка артефактов пользователя с пагинацией и фильтрацией.

**Параметры запроса:**
- `page` (number, default: 1) - Номер страницы
- `pageSize` (number, default: 20, max: 50) - Размер страницы
- `search` / `searchQuery` (string, optional) - Поисковый запрос по заголовку, summary и содержимому
- `kind` (ArtifactKind, optional) - Фильтр по типу: `text`, `code`, `image`, `sheet`, `site`
- `groupByVersions` (boolean, default: true) - Группировка по версиям (true = только последние версии)

**Пример запроса:**
```
GET /api/artifacts?page=1&pageSize=20&search=приветствие&kind=text&groupByVersions=true
```

**Пример ответа:**
```json
{
  "artifacts": [
    {
      "id": "abc123",
      "title": "Приветственное письмо",
      "kind": "text",
      "content": "Добро пожаловать!",
      "summary": "Текст приветствия",
      "createdAt": "2025-06-20T10:00:00Z"
    }
  ],
  "hasMore": false,
  "nextCursor": null,
  "totalCount": 1,
  "currentPage": 1,
  "pageSize": 20,
  "data": "... (legacy format for backward compatibility)"
}
```

**Коды ответов:**
- `200 OK` - Успешное получение списка
- `400 Bad Request` - Некорректные параметры пагинации
- `401 Unauthorized` - Требуется аутентификация

---

### GET `/api/artifacts/recent`
**Описание:** Получение недавних артефактов пользователя.

**Параметры:**
- `limit` (number, default: 5) - Количество артефактов
- `kind` (ArtifactKind, optional) - Фильтр по типу

**Пример ответа:**
```json
[
  {
    "id": "abc123",
    "title": "Последний артефакт",
    "kind": "text",
    "createdAt": "2025-06-20T10:00:00Z"
  }
]
```

---

### POST `/api/artifacts/create-from-upload`
**Описание:** Создание артефакта из загруженного файла.

**Тело запроса:**
```json
{
  "fileUrl": "https://blob.vercel-storage.com/abc123",
  "fileName": "document.pdf",
  "fileType": "application/pdf"
}
```

**Коды ответов:**
- `201 Created` - Артефакт успешно создан
- `400 Bad Request` - Некорректный файл или URL
- `401 Unauthorized` - Требуется аутентификация

---

## 💬 Chat API

### GET `/api/history`
**Описание:** Получение истории чатов пользователя.

**Пример ответа:**
```json
[
  {
    "id": "chat123",
    "title": "Создание сайта для HR",
    "createdAt": "2025-06-20T09:00:00Z",
    "published_until": null,
    "userId": "user123"
  }
]
```

---

### GET `/api/chat/[chatId]/details`
**Описание:** Получение детальной информации о чате.

**Параметры URL:**
- `chatId` (string, required) - ID чата

**Пример ответа:**
```json
{
  "id": "chat123",
  "title": "Создание сайта",
  "createdAt": "2025-06-20T09:00:00Z",
  "published_until": "2025-07-20T09:00:00Z",
  "userId": "user123"
}
```

---

## 🎯 AI Tools API

### POST `/api/chat`
**Описание:** Основной endpoint для взаимодействия с AI-системой.

**Поддерживаемые AI инструменты:**
- `artifactCreate` - Создание нового артефакта
- `artifactUpdate` - Обновление существующего артефакта  
- `artifactEnhance` - Улучшение артефакта с предложениями
- `artifactDelete` - Мягкое удаление артефакта
- `artifactRestore` - Восстановление удаленного артефакта

**Пример тела запроса:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Создай текстовый артефакт с приветствием"
    }
  ],
  "chatId": "chat123"
}
```

---

## 🔐 Authentication API

### POST `/api/auth/signin`
**Описание:** Аутентификация пользователя.

### POST `/api/auth/signout`
**Описание:** Выход из системы.

---

## 📊 Типы данных

### ArtifactKind
```typescript
type ArtifactKind = 'text' | 'code' | 'image' | 'sheet' | 'site'
```

### ArtifactApiResponse
```typescript
interface ArtifactApiResponse {
  id: string
  title: string
  kind: ArtifactKind
  content: string
  summary: string | null
  createdAt: Date
  userId: string
  authorId: string | null
  deletedAt: Date | null
  content_text: string | null
  content_url: string | null
  content_site_definition: object | null
  publication_state: PublicationInfo[]
  world_id: string | null
}
```

### PublicationInfo
```typescript
interface PublicationInfo {
  source: 'direct' | 'chat' | 'site'
  sourceId: string
  publishedAt: string
  expiresAt: string | null
}
```

---

## 🔍 Обработка ошибок

### Стандартные HTTP коды
- `200 OK` - Успешный запрос
- `201 Created` - Ресурс создан
- `400 Bad Request` - Некорректный запрос
- `401 Unauthorized` - Требуется аутентификация  
- `403 Forbidden` - Недостаточно прав
- `404 Not Found` - Ресурс не найден
- `500 Internal Server Error` - Внутренняя ошибка сервера

### Формат ошибок
```json
{
  "error": {
    "type": "bad_request:api",
    "message": "Invalid page parameter. Must be between 1 and 50."
  }
}
```

---

## 🌍 World Isolation

API поддерживает изоляцию данных по тестовым мирам через:
- **Cookie:** `world_id` - ID активного мира
- **Middleware:** Автоматическое применение фильтров по world_id
- **Queries:** Поддержка world context в database queries

**Влияние на API:**
- Все endpoints возвращают только данные текущего мира
- Без world_id работают с production данными
- Test sessions автоматически изолируют данные

---

## 📝 Примеры использования

### Создание артефакта
```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ 
      role: 'user', 
      content: 'Создай текстовый артефакт с приветствием для новых сотрудников' 
    }],
    chatId: 'chat123'
  })
})
```

### Получение списка артефактов
```javascript
const response = await fetch('/api/artifacts?page=1&search=приветствие&groupByVersions=true')
const data = await response.json()
```

### Обновление артефакта  
```javascript
const response = await fetch('/api/artifact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'abc123',
    title: 'Обновленное приветствие',
    content: 'Новый текст приветствия',
    kind: 'text'
  })
})
```

---

## ⚠️ Важные замечания

### Безопасность
- Все приватные endpoints требуют действующую сессию
- Публичные артефакты доступны без аутентификации
- CORS настроен для мульти-доменной архитектуры

### Производительность
- Используйте пагинацию для больших списков
- `groupByVersions=true` рекомендуется для лучшей производительности
- SWR кеширование на клиенте для оптимизации запросов

### Версионирование
- API следует semver принципам
- Breaking changes будут сопровождаться версионированием URL
- Обратная совместимость поддерживается через legacy форматы

---

> **📚 Документация должна обновляться при:**
> - Добавлении новых endpoints
> - Изменении параметров или схем данных  
> - Изменении бизнес-логики API
> - Обновлении типов данных
> - Изменении обработки ошибок
> - Изменении валидации или security логики
> - Добавлении новых error codes или messages

**Ответственность за обновление:** Разработчик, вносящий изменения в API

**Процесс обновления:**
1. **Изменить код** API endpoint
2. **Обновить документацию** в этом файле
3. **Обновить соответствующие Use Case** спецификации если затронута бизнес-логика
4. **Обновить связанные тесты** для отражения новой логики
5. **Зафиксировать изменения** в git с описательным commit message

**Критично:** API изменения без обновления документации недопустимы!