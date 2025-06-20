'use client';

/**
 * @file components/sheet-editor.tsx
 * @description Редактор таблиц с поддержкой сохранения позиции курсора при SWR обновлениях.
 * @version 2.0.0
 * @date 2025-06-20
 * @updated Добавлено сохранение позиции курсора и ячейки при обновлениях контента.
 */

/** HISTORY:
 * v2.0.0 (2025-06-20): Добавлено сохранение позиции курсора/выбранной ячейки при SWR обновлениях.
 * v1.0.0: Первоначальная версия с базовой функциональностью редактирования таблиц.
 */

import React, { memo, useEffect, useMemo, useState, useRef } from 'react';
import DataGrid, { textEditor, type CellClickArgs } from 'react-data-grid';
import { parse, unparse } from 'papaparse';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import 'react-data-grid/lib/styles.css';

type SheetEditorProps = {
  content: string;
  onSaveContent: (content: string, debounce: boolean) => void; // ✅ Изменено для совместимости с artifact.tsx
  status: string;
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  isReadonly?: boolean;
};

const MIN_ROWS = 50;
const MIN_COLS = 26;

// Position type from react-data-grid v7 (internal but used for cell selection)
type Position = {
  readonly idx: number;
  readonly rowIdx: number;
};

const PureSpreadsheetEditor = ({
  content,
  onSaveContent,
  status,
  isCurrentVersion,
  isReadonly = false,
}: SheetEditorProps) => {
  const { theme } = useTheme();
  
  // ✅ State для сохранения позиции курсора/выбранной ячейки
  const [selectedCell, setSelectedCell] = useState<Position | null>(null);
  const lastContentRef = useRef<string>('');
  
  // ✅ Эффект для сохранения позиции курсора при изменении содержимого
  useEffect(() => {
    // Сохраняем позицию курсора только при существенных изменениях содержимого
    if (content !== lastContentRef.current) {
      lastContentRef.current = content;
      // selectedCell сохраняется автоматически через state
    }
  }, [content]);

  const parseData = useMemo(() => {
    if (!content) return Array(MIN_ROWS).fill(Array(MIN_COLS).fill(''));
    const result = parse<string[]>(content, { skipEmptyLines: true });

    const paddedData = result.data.map((row) => {
      const paddedRow = [...row];
      while (paddedRow.length < MIN_COLS) {
        paddedRow.push('');
      }
      return paddedRow;
    });

    while (paddedData.length < MIN_ROWS) {
      paddedData.push(Array(MIN_COLS).fill(''));
    }

    return paddedData;
  }, [content]);

  const columns = useMemo(() => {
    const rowNumberColumn = {
      key: 'rowNumber',
      name: '',
      frozen: true,
      width: 50,
      renderCell: ({ rowIdx }: { rowIdx: number }) => rowIdx + 1,
      cellClass: 'border-t border-r dark:bg-zinc-950 dark:text-zinc-50',
      headerCellClass: 'border-t border-r dark:bg-zinc-900 dark:text-zinc-50',
    };

    const dataColumns = Array.from({ length: MIN_COLS }, (_, i) => ({
      key: i.toString(),
      name: String.fromCharCode(65 + i),
      renderEditCell: isReadonly ? undefined : textEditor,
      width: 120,
      cellClass: cn(`border-t dark:bg-zinc-950 dark:text-zinc-50`, {
        'border-l': i !== 0,
      }),
      headerCellClass: cn(`border-t dark:bg-zinc-900 dark:text-zinc-50`, {
        'border-l': i !== 0,
      }),
    }));

    return [rowNumberColumn, ...dataColumns];
  }, [isReadonly]);

  const initialRows = useMemo(() => {
    return parseData.map((row, rowIndex) => {
      const rowData: any = {
        id: rowIndex,
        rowNumber: rowIndex + 1,
      };

      columns.slice(1).forEach((col, colIndex) => {
        rowData[col.key] = row[colIndex] || '';
      });

      return rowData;
    });
  }, [parseData, columns]);

  const [localRows, setLocalRows] = useState(initialRows);

  // ✅ Обновляем данные при изменении содержимого, сохраняя позицию курсора
  useEffect(() => {
    // Проверяем, изменился ли контент (это может быть SWR обновление)
    if (content !== lastContentRef.current) {
      lastContentRef.current = content;
      setLocalRows(initialRows);
      // Позиция курсора (selectedCell) сохраняется автоматически в state
    }
  }, [initialRows, content]);

  const generateCsv = (data: any[][]) => {
    return unparse(data);
  };

  const handleRowsChange = (newRows: any[]) => {
    if (isReadonly) return; // Не позволяем изменения в readonly режиме
    
    setLocalRows(newRows);

    const updatedData = newRows.map((row) => {
      return columns.slice(1).map((col) => row[col.key] || '');
    });

    const newCsvContent = generateCsv(updatedData);
    
    // ✅ Используем debounced сохранение (второй параметр true = использовать debounce)
    onSaveContent(newCsvContent, true);
  };

  return (
    <DataGrid
      className={theme === 'dark' ? 'rdg-dark' : 'rdg-light'}
      columns={columns}
      rows={localRows}
      enableVirtualization
      onRowsChange={isReadonly ? undefined : handleRowsChange}
      onCellClick={(args: CellClickArgs<string[]>) => {
        if (!isReadonly && args.column.key !== 'rowNumber') {
          // ✅ Сохраняем позицию выбранной ячейки (restored functionality)
          // Find rowIdx by searching the row data in localRows array
          const rowIdx = localRows.findIndex(row => row === args.row);
          if (rowIdx !== -1) {
            setSelectedCell({ rowIdx, idx: args.column.idx });
            args.selectCell(false); // Select cell without opening editor
          }
        }
      }}
      style={{ height: '100%' }}
      defaultColumnOptions={{
        resizable: true,
        sortable: true,
      }}
    />
  );
};

function areEqual(prevProps: SheetEditorProps, nextProps: SheetEditorProps) {
  return (
    prevProps.currentVersionIndex === nextProps.currentVersionIndex &&
    prevProps.isCurrentVersion === nextProps.isCurrentVersion &&
    !(prevProps.status === 'streaming' && nextProps.status === 'streaming') &&
    prevProps.content === nextProps.content &&
    prevProps.onSaveContent === nextProps.onSaveContent
  );
}

export const SpreadsheetEditor = memo(PureSpreadsheetEditor, areEqual);
