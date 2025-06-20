# 📊 React Data Grid v7 Documentation

**Версия:** 7.0.0-beta.47  
**Дата:** 2025-06-20  
**Статус:** В проекте используется версия beta  
**Package:** `react-data-grid@7.0.0-beta.47`

---

## 🎯 Назначение в проекте

React Data Grid используется в компоненте `SheetEditor` (`components/sheet-editor.tsx`) для редактирования табличных данных CSV в артефактах типа `sheet`.

---

## 🔍 Ключевые API изменения v7

### Типы и интерфейсы

#### CellClickArgs Interface
```typescript
interface CellClickArgs<TRow, TSummaryRow = unknown> {
  row: TRow;                                    // Данные строки
  column: CalculatedColumn<TRow, TSummaryRow>;  // Метаданные колонки
  selectCell: (enableEditor?: boolean) => void; // Функция выбора ячейки
}
```

**⚠️ Важно:** В отличие от предыдущих версий, `CellClickArgs` НЕ содержит прямого `rowIdx`. Индекс строки нужно получать через поиск в массиве данных.

#### Position Interface
```typescript
interface Position {
  readonly idx: number;     // Индекс колонки
  readonly rowIdx: number;  // Индекс строки
}
```

#### CalculatedColumn Interface
```typescript
interface CalculatedColumn<TRow, TSummaryRow = unknown> {
  readonly idx: number;     // Индекс колонки в массиве
  readonly key: string;     // Уникальный ключ колонки
  readonly width: number | string;
  readonly resizable: boolean;
  readonly sortable: boolean;
  // ... другие свойства
}
```

---

## 🛠️ Рабочие паттерны

### 1. Обработка клика по ячейке

```typescript
const onCellClick = (args: CellClickArgs<string[]>) => {
  if (!isReadonly && args.column.key !== 'rowNumber') {
    // ✅ Получение rowIdx через поиск в данных
    const rowIdx = localRows.findIndex(row => row === args.row);
    
    if (rowIdx !== -1) {
      setSelectedCell({ rowIdx, idx: args.column.idx });
      args.selectCell(false); // Выбрать ячейку без открытия редактора
    }
  }
}

<DataGrid
  onCellClick={onCellClick}
  // другие props
/>
```

### 2. Сохранение позиции курсора

```typescript
// State для позиции курсора
const [selectedCell, setSelectedCell] = useState<Position | null>(null);

// Эффект для сохранения позиции при изменениях
useEffect(() => {
  if (content !== lastContentRef.current) {
    lastContentRef.current = content;
    // selectedCell сохраняется автоматически
  }
}, [content]);
```

### 3. Пример полной интеграции

```typescript
<DataGrid
  className={theme === 'dark' ? 'rdg-dark' : 'rdg-light'}
  columns={columns}
  rows={localRows}
  enableVirtualization
  onRowsChange={isReadonly ? undefined : handleRowsChange}
  onCellClick={(args: CellClickArgs<string[]>) => {
    if (!isReadonly && args.column.key !== 'rowNumber') {
      const rowIdx = localRows.findIndex(row => row === args.row);
      if (rowIdx !== -1) {
        setSelectedCell({ rowIdx, idx: args.column.idx });
        args.selectCell(false);
      }
    }
  }}
  style={{ height: '100%' }}
  defaultColumnOptions={{
    resizable: true,
    sortable: true,
  }}
/>
```

---

## ⚠️ Критические различия с предыдущими версиями

### ❌ НЕ работает в v7
```typescript
// ❌ Position НЕ экспортируется
import { Position } from 'react-data-grid'; // Error!

// ❌ selectedCells prop НЕ поддерживается
<DataGrid selectedCells={selectedCells} /> // Error!

// ❌ onSelectedCellChange НЕ поддерживается
<DataGrid onSelectedCellChange={handler} /> // Error!

// ❌ args.rowIdx НЕ существует в CellClickArgs
onCellClick={(args) => {
  const rowIdx = args.rowIdx; // undefined!
}}
```

### ✅ Работает в v7
```typescript
// ✅ Импорт только доступных типов
import DataGrid, { textEditor, type CalculatedColumn, type CellClickArgs } from 'react-data-grid';

// ✅ Собственное определение Position
type Position = {
  readonly idx: number;
  readonly rowIdx: number;
};

// ✅ Получение rowIdx через поиск
const rowIdx = localRows.findIndex(row => row === args.row);

// ✅ Ручной вызов selectCell
args.selectCell(enableEditor?: boolean);
```

---

## 🎨 Стилизация

### CSS классы
- `rdg-light` — светлая тема
- `rdg-dark` — темная тема
- Требуется импорт: `import 'react-data-grid/lib/styles.css'`

### Responsive поведение
DataGrid автоматически адаптируется к размеру контейнера через `style={{ height: '100%' }}`.

---

## 🐛 Известные проблемы и решения

### 1. TypeScript ошибки с импортами
**Проблема:** `Property 'rowIdx' does not exist on type 'CellClickArgs'`

**Решение:** Получать rowIdx через поиск в данных:
```typescript
const rowIdx = localRows.findIndex(row => row === args.row);
```

### 2. Position type не экспортируется
**Проблема:** `Module has no exported member 'Position'`

**Решение:** Создать собственный интерфейс:
```typescript
type Position = {
  readonly idx: number;
  readonly rowIdx: number;
};
```

### 3. selectedCells не поддерживается
**Проблема:** Нет встроенной поддержки выделения ячеек

**Решение:** Использовать собственный state и `args.selectCell()`:
```typescript
const [selectedCell, setSelectedCell] = useState<Position | null>(null);
// В onCellClick:
args.selectCell(false); // Выбрать без редактирования
```

---

## 📚 Полезные ссылки

- **GitHub:** https://github.com/adazzle/react-data-grid
- **NPM:** https://www.npmjs.com/package/react-data-grid
- **Issues:** https://github.com/adazzle/react-data-grid/issues
- **Type Definitions:** `node_modules/react-data-grid/lib/index.d.ts`

---

## 🔄 Версионирование

**Текущая версия:** `7.0.0-beta.47`  
**Статус:** Beta (может содержать breaking changes)  
**Следующие версии:** Следить за стабильным релизом 7.0.0

**Рекомендация:** При обновлении проверять:
1. Совместимость API CellClickArgs
2. Изменения в экспортированных типах
3. Новые свойства DataGrid компонента

---

> **Инсайт:** React Data Grid v7 находится в активной разработке. API может изменяться между beta версиями. Всегда проверяйте официальную документацию и TypeScript определения при обновлении.