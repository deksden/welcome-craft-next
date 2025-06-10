# Подсистема логирования (docs/logger/DOC_SYS_LOGGER.md, v0.8.4)

Подсистема SYS_LOGGER предоставляет унифицированный механизм логирования для всех компонентов системы.

## Основные возможности

- 📝 Централизованное логирование через единый интерфейс
- 🎚️ Уровни логирования от trace до fatal
- 🔍 Фильтрация сообщений по namespace через DEBUG
- 🎨 Цветной вывод в консоль через pino-pretty
- 📐 Форматированный вывод сообщений через pino-pretty
- 🔄 Автоматическая ротация лог файлов
- ⚠️ Структурированные ошибки через SYS_ERRORS
- 🔌 Множественные настраиваемые транспорты
- 📦 Автоматическое преобразование Map структур в обычные объекты
- ✂️ Ограничение длины строк в объектах логирования
- ✨ **Расширенный API логгера:** Возвращаемый объект включает методы `.child()`, `.bindings()`, `.isLevelEnabled()`, `.silent()` и свойство `.level` для большей совместимости с `pino`.

## Быстрый старт

```javascript
import { createLogger } from '../logger/logger.js'

// Создаем логгер с namespace
const logger = createLogger('my-app:module')

// Логируем сообщения разных уровней
logger.info('Application started')
logger.debug({ userId: 123 }, 'Processing user request')
logger.error(new Error('Something failed'), 'Operation failed')

// Создание дочернего логгера
const childLogger = logger.child({ requestId: 'abc-123' })
childLogger.info('Handling request')
// -> Лог будет содержать { namespace: 'my-app:module', requestId: 'abc-123' }

// Проверка уровня перед затратной операцией
if (logger.isLevelEnabled('debug')) {
  const data = prepareExpensiveData()
  logger.debug({ data }, 'Expensive data prepared')
}

// Изменение уровня для конкретного экземпляра
logger.level = 'trace'
logger.trace('Trace log enabled temporarily')
logger.level = 'info' // Возвращаем обратно
```

## Конфигурация через переменные окружения

### Базовые настройки (обратная совместимость)

| Переменная         | Описание                      | Значения по умолчанию |
| ------------------ | ----------------------------- | --------------------- |
| LOG_LEVEL          | Минимальный уровень сообщений | info                  |
| LOG_COLORIZE       | Цветной вывод в консоль       | true                  |
| LOG_FILE_OUTPUT    | Запись в файл                 | false                 |
| LOG_CONSOLE_OUTPUT | Вывод в консоль               | true                  |
| LOG_FOLDER         | Папка для лог файлов          | logs                  |
| DEBUG              | Фильтр по namespace           | \* (или не задан)     |

**Примечание:** Настройки `LOG_FILE_OUTPUT`, `LOG_CONSOLE_OUTPUT`, `LOG_FOLDER`, `LOG_COLORIZE` используются только если _не заданы_ множественные транспорты (`TRANSPORT{N}`). Если транспорты заданы, эти переменные игнорируются. `LOG_LEVEL` задает _глобальный_ минимальный уровень, который может быть переопределен уровнем транспорта (`TRANSPORT{N}_LEVEL`) или уровнем экземпляра логгера (`logger.level`).

### Настройки обработки строк и объектов

```bash
# Максимальная глубина вложенности для Map структур
LOG_MAX_DEPTH=8

# Максимальная длина строковых значений (0 = без ограничений)
LOG_MAX_STRING_LENGTH=100

# Маркер обрезки для длинных строк (применяется когда LOG_MAX_STRING_LENGTH > 0)
LOG_TRUNCATION_MARKER=...
```

По умолчанию система ограничивает глубину вложенности для Map структур до 8 уровней, при превышении которой Map заменяется строкой `[Max Map Depth Reached]`.

Если установлен `LOG_MAX_STRING_LENGTH` больше нуля, строковые значения в объектах и одиночные строковые сообщения будут ограничены указанным количеством символов с добавлением маркера обрезки в конце. Если `LOG_MAX_STRING_LENGTH=0` или не указан, ограничение длины строк не применяется.

Переменная `LOG_MAP_DEPTH_ONLY` больше не используется и не влияет на поведение.

### Множественные транспорты

Система поддерживает настройку нескольких транспортов через переменные окружения вида `TRANSPORT{N}` и `TRANSPORT{N}_*`, где N - порядковый номер транспорта (начиная с 1). Если задан хотя бы один `TRANSPORT{N}`, то настройки `LOG_FILE_OUTPUT`, `LOG_CONSOLE_OUTPUT` и связанные с ними игнорируются.

#### Настройка множественных транспортов

```bash
# Консольный транспорт с уровнем info
TRANSPORT1=console
TRANSPORT1_LEVEL=info
TRANSPORT1_COLORS=true

# Файловый транспорт с уровнем debug
TRANSPORT2=file
TRANSPORT2_LEVEL=debug
TRANSPORT2_FOLDER=logs
TRANSPORT2_FILENAME={app_name}_{date}.log

# Отдельный файловый транспорт для ошибок
TRANSPORT3=file
TRANSPORT3_LEVEL=error
TRANSPORT3_FILENAME=errors_{date}.log
```

## Уровни логирования

Система поддерживает следующие уровни логирования (в порядке увеличения важности):

- **trace**: Детальная отладка, вход/выход функций.
  ```javascript
  logger.trace({ params }, 'Function entry')
  ```
- **debug**: Основная отладочная информация, промежуточные состояния.
  ```javascript
  logger.debug({ result }, 'Operation completed')
  ```
- **info**: Важные события и состояния системы.
  ```javascript
  logger.info('User registered successfully')
  ```
- **warn**: Некритичные проблемы, предупреждения.
  ```javascript
  logger.warn({ quota }, 'Disk space running low')
  ```
- **error**: Ошибки выполнения операций.
  ```javascript
  logger.error({ err: error }, 'Failed to process request') // Передавайте ошибку в поле err
  logger.error(new Error('Direct error message')) // Можно и напрямую
  ```
- **fatal**: Критические системные ошибки, обычно приводящие к остановке.
  ```javascript
  logger.fatal({ err: dbError }, 'Database connection lost')
  ```

## Фильтрация по уровням (LOG_LEVEL и logger.level)

- `LOG_LEVEL` (переменная окружения): Задает **глобальный** минимальный уровень для _всех_ логгеров при их инициализации.
- `TRANSPORT{N}_LEVEL` (переменная окружения): Переопределяет минимальный уровень для _конкретного_ транспорта.
- `logger.level` (свойство экземпляра): Позволяет **динамически** изменить минимальный уровень для _конкретного экземпляра_ логгера (и его дочерних элементов, созданных через `.child()` _после_ изменения уровня родителя). Значение должно быть строковым именем уровня ('trace', 'debug', 'info', 'warn', 'error', 'fatal').

Приоритет: `logger.level` > `TRANSPORT{N}_LEVEL` > `LOG_LEVEL`. Сообщение будет записано, только если его уровень не ниже установленного на всех этих этапах для соответствующего транспорта.

```bash
# Показывать все сообщения, начиная с debug
LOG_LEVEL=debug npm start

# Только warn и выше (warn, error, fatal)
LOG_LEVEL=warn npm start
```

```javascript
// Динамическое изменение
const userLogger = createLogger('user:service')
userLogger.level = 'trace' // Включаем детальную отладку только для этого логгера
userLogger.trace('Detailed step')
userLogger.level = 'info' // Возвращаем уровень обратно
```

## Множественные транспорты

### Поддерживаемые типы транспортов

- **console**: Вывод в консоль с форматированием через pino-pretty
- **file**: Запись в файл с поддержкой шаблонов в имени и ротацией

### Общие параметры транспортов

| Переменная                  | Описание                        | Значения по умолчанию |
| --------------------------- | ------------------------------- | --------------------- |
| TRANSPORT{N}                | Тип транспорта (console, file)  | -                     |
| TRANSPORT{N}\_LEVEL         | Уровень логирования             | info                  |
| TRANSPORT{N}\_ENABLED       | Включение/отключение транспорта | true                  |
| TRANSPORT{N}\_SYNC          | Синхронная запись               | false                 |
| TRANSPORT{N}\_TIMESTAMP     | Добавлять временную метку       | true                  |
| TRANSPORT{N}\_MESSAGE_KEY   | Ключ для сообщения              | msg                   |
| TRANSPORT{N}\_TIMESTAMP_KEY | Ключ для временной метки        | time                  |
| TRANSPORT{N}\_LEVEL_KEY     | Ключ для уровня логирования     | level                 |

### Параметры консольного транспорта

| Переменная                     | Описание                  | Значения по умолчанию |
| ------------------------------ | ------------------------- | --------------------- |
| TRANSPORT{N}\_COLORS           | Цветной вывод             | true                  |
| TRANSPORT{N}\_TRANSLATE_TIME   | Формат времени            | SYS:standard          |
| TRANSPORT{N}\_IGNORE           | Поля для игнорирования    | pid,hostname          |
| TRANSPORT{N}\_SINGLE_LINE      | Однострочный вывод        | false                 |
| TRANSPORT{N}\_HIDE_OBJECT_KEYS | Скрываемые ключи объектов | ''                    |
| TRANSPORT{N}\_SHOW_METADATA    | Показывать метаданные     | false                 |

### Параметры файлового транспорта

| Переменная                     | Описание                             | Значения по умолчанию |
| ------------------------------ | ------------------------------------ | --------------------- |
| TRANSPORT{N}\_FOLDER           | Папка для логов                      | logs                  |
| TRANSPORT{N}\_FILENAME         | Шаблон имени файла                   | {app_name}.log        |
| TRANSPORT{N}\_DESTINATION      | Полный путь или дескриптор           | ''                    |
| TRANSPORT{N}\_MKDIR            | Создавать папку если не существует   | true                  |
| TRANSPORT{N}\_APPEND           | Дописывать в существующий файл       | true                  |
| TRANSPORT{N}\_PRETTY_PRINT     | Применить форматирование pino-pretty | false                 |
| TRANSPORT{N}\_ROTATE           | Включить ротацию файлов              | false                 |
| TRANSPORT{N}\_ROTATE_MAX_SIZE  | Максимальный размер файла            | 10485760 (10MB)       |
| TRANSPORT{N}\_ROTATE_MAX_FILES | Максимальное количество архивов      | 5                     |
| TRANSPORT{N}\_ROTATE_COMPRESS  | Сжимать архивы                       | false                 |

### Шаблоны в именах файлов

В настройке `TRANSPORT{N}_FILENAME` можно использовать следующие плейсхолдеры:

- `{date}` - текущая дата (YYYY-MM-DD)
- `{time}` - текущее время (HH-mm-ss)
- `{datetime}` - комбинация даты и времени (YYYY-MM-DD_HH-mm-ss)
- `{app_name}` - имя приложения из package.json
- `{app_version}` - версия приложения из package.json
- `{pid}` - ID процесса
- `{hostname}` - имя хоста

Пример: `TRANSPORT2_FILENAME=logs/{app_name}_{date}.log` -> `logs/my-app_2023-01-01.log`

## Работа с namespace и DEBUG

### Создание логгеров с namespace

```javascript
const authLogger = createLogger('auth')
const dbLogger = createLogger('database')
const apiLogger = createLogger('api:requests')
```

### Фильтрация по namespace через переменную DEBUG

Переменная окружения `DEBUG` управляет тем, логи с какими `namespace` будут активны. Логика фильтрации основана на модуле `debug`.

```bash
# Показать все логи (включая без namespace)
DEBUG=*

# Показать только конкретные namespace
DEBUG=auth,database

# Показать все логи api и вложенных namespace (api:requests, api:responses, etc.)
DEBUG=api:*

# Показать все, кроме определенного namespace
DEBUG=*,-database

# Комбинация правил (показать api и auth, но скрыть api:internal)
# Отрицание имеет приоритет
DEBUG=api:*,auth,-api:internal

# Показать все, начинающиеся на 'service:' КРОМЕ 'service:network'
DEBUG=service:*,-service:network

# По умолчанию (если DEBUG не задан или пуст), активны только логгеры БЕЗ namespace
```

**Важно:** Логгеры, созданные через `parentLogger.child()`, наследуют `namespace` родителя для целей **фильтрации** по `DEBUG`. Сам `namespace` не добавляется повторно в `bindings` дочернего логгера.

## Расширенное API Логгера

Объект, возвращаемый `createLogger`, предоставляет дополнительные методы и свойства для управления и интроспекции.

### `logger.child(bindings)`

Создает новый экземпляр логгера, который наследует конфигурацию родителя (уровень, транспорты), `namespace` родителя (для `DEBUG`-фильтрации) и добавляет указанные `bindings` (ключ-значение) ко всем своим лог-сообщениям.

```javascript
const parent = createLogger('http')
const requestLogger = parent.child({ method: 'GET', url: '/users' })

requestLogger.info('Processing request')
// -> { "level": 30, ..., "namespace": "http", "method": "GET", "url": "/users", "msg": "Processing request" }
```

### `logger.bindings()`

Возвращает объект, содержащий все `bindings`, активные для данного экземпляра логгера (включая `namespace`, если он был задан, и `bindings`, добавленные через `.child()`).

```javascript
const logger = createLogger('db').child({ connectionId: 12 })
console.log(logger.bindings())
// -> { namespace: 'db', connectionId: 12 }
```

### `logger.level` (get/set)

Позволяет получить или установить **строковое** имя минимального уровня логирования для данного экземпляра логгера. Изменение уровня родителя влияет на дочерние элементы, созданные _после_ изменения.

```javascript
const logger = createLogger('service')
console.log(logger.level) // -> 'info' (или что задано глобально)

logger.level = 'debug'
logger.debug('Debug message now visible')

logger.level = 'warn'
logger.info('Info message now hidden')
```

### `logger.isLevelEnabled(levelName)`

Возвращает `true`, если сообщения с указанным `levelName` (строка) будут записаны этим экземпляром логгера (учитывается и текущий `logger.level`, и `DEBUG`-фильтр). Полезно для предотвращения затратных вычислений.

```javascript
const logger = createLogger('heavy:calc')
logger.level = 'info'

if (logger.isLevelEnabled('debug')) {
  // Вернет false
  const result = performHeavyCalculation()
  logger.debug({ result }, 'Calculation done') // Этот лог не будет записан
}
```

### `logger.silent()`

Временно полностью отключает вывод для данного экземпляра логгера. Вызов `pinoInstance.silent()`. Редко используется.

## Структурированное логирование

(Этот раздел остается без изменений)

Логгер поддерживает несколько способов передачи данных:

### Контекст как объект

```javascript
logger.info('Message') // Только сообщение
logger.info({ userId: 123, action: 'login' }, 'User logged in') // Контекст + сообщение
logger.debug({ data: myDataObject }) // Только контекст
```

### Логирование ошибок

Рекомендуется передавать объект ошибки в поле `err`:

```javascript
try {
  await operation()
} catch (error) {
  logger.error({ err: error, context: { userId: 123 } }, 'Operation failed')
}
```

Можно передать ошибку и первым аргументом:

```javascript
logger.error(new Error('Direct error'), 'Optional message')
```

### Placeholders в сообщениях

Логгер поддерживает использование placeholders. Значения для подстановки передаются дополнительными аргументами.

```javascript
logger.info('Processing user %s', username)
logger.debug('Request from %s to %s', sourceIp, targetIp)
logger.info('User data: %j', { id: 1, name: 'Test' }) // %j для объектов
logger.info({ requestId }, 'User %s made request to %s', username, endpoint) // Комбинация
```

Поддерживаемые placeholders: `%s`, `%d`, `%i`, `%f`, `%o`, `%O`, `%j`, `%%`.

## Преобразование Map в обычные объекты

(Этот раздел остается без изменений)

По умолчанию система автоматически преобразует структуры Map в обычные объекты для логирования, ограниченные глубиной `LOG_MAX_DEPTH` (по умолчанию 8).

```javascript
const myMap = new Map([
  ['key1', 'value1'],
  ['key2', { nested: 'object' }],
])
logger.info({ data: myMap })
// -> { data: { key1: 'value1', key2: { nested: 'object' } } }
```

## Ограничение длины строк

(Этот раздел остается без изменений)

Система может ограничивать длину строковых значений в объектах и одиночных сообщений (`LOG_MAX_STRING_LENGTH`, `LOG_TRUNCATION_MARKER`).

```javascript
// LOG_MAX_STRING_LENGTH=20
// LOG_TRUNCATION_MARKER=...
const longText = 'Очень длинный текст, который будет обрезан для лога.'
logger.info({ details: longText })
// -> { details: 'Очень длинный текст,...' }
logger.warn(longText)
// -> 'Очень длинный текст,...'
```

## Лучшие практики

1.  **Уровни логирования:** Используйте уровни семантически правильно.
2.  **Структура:** Передавайте контекст первым аргументом ({ `key`: `value` }). Используйте `err` для ошибок.
3.  **Namespace:** Используйте иерархию (`app:module:submodule`) и `DEBUG` для фильтрации.
4.  **Дочерние логгеры (`.child()`):** Используйте для добавления контекста (ID запроса, ID пользователя) к группе связанных логов.
5.  **Производительность:**
    - Не логируйте избыточно в циклах.
    - Используйте `logger.isLevelEnabled(level)` перед подготовкой _действительно_ дорогих данных для логов уровня `debug` или `trace`.
    - В продакшене обычно достаточно уровня `info`.
6.  **Транспорты:** Настройте отдельные транспорты (например, файл для ошибок `level: 'error'`, консоль для `level: 'info'`) через переменные `TRANSPORT{N}` для лучшего управления логами.
