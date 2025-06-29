/**
 * @file app/api/test/files/[filename]/route.ts
 * @description Тестовый endpoint для предоставления fixture файлов через HTTP в тестах
 * @version 2.0.0
 * @date 2025-06-28
 * @updated Полностью переписан на генерацию тестовых данных в памяти - решение проблемы доступности файлов в production build
 */

/** HISTORY:
 * v2.0.0 (2025-06-28): Полностью переписан на генерацию тестовых данных в памяти вместо чтения файлов - файловая система недоступна в production build
 * v1.1.0 (2025-06-28): Исправлен путь к файлам - public папка доступна в production build, tests папка не включается
 * v1.0.0 (2025-06-28): Создан тестовый endpoint для решения проблемы тестирования file import API - предоставляет реальные HTTP URLs для fetch() в route тестах
 */

import { type NextRequest, NextResponse } from 'next/server'

/**
 * @description GET /api/test/files/[filename] - Предоставляет тестовые файлы через HTTP в режиме тестирования
 * @feature Только для тестового окружения, генерирует тестовые файлы в памяти
 * @param filename - Имя тестового файла (sample.txt, sample-employees.csv, etc.)
 * @returns HTTP response с содержимым файла и правильными MIME типами
 * @deterministic Возвращает одинаковое содержимое для одинаковых filename'ов
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  // Проверяем что мы в тестовом окружении (включая локальный production testing)
  const isTestEnvironment = process.env.NODE_ENV === 'test' || 
                           process.env.PLAYWRIGHT === 'true' ||
                           !!process.env.PLAYWRIGHT_PORT ||
                           request.headers.get('X-Test-Environment') === 'playwright'
  
  if (!isTestEnvironment) {
    return NextResponse.json(
      { error: 'Test endpoint not available in production' },
      { status: 404 }
    )
  }
  
  try {
    const resolvedParams = await params
    const filename = resolvedParams.filename
    
    // Безопасность: проверяем что filename не содержит пути вверх
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }
    
    // Генерируем тестовые файлы в памяти
    const testFiles: Record<string, { content: string, mimeType: string }> = {
      'sample.txt': {
        content: 'This is a sample text file for testing file import functionality.\nLine 2 of sample text file.\nThis file is generated in memory for route tests.',
        mimeType: 'text/plain'
      },
      'sample-employees.csv': {
        content: 'Employee,Department,Salary\nAlice Johnson,Engineering,95000\nBob Smith,Marketing,65000\nCarol Davis,HR,70000',
        mimeType: 'text/csv'
      },
      'sample.md': {
        content: '# Sample Markdown\n\nThis is a **test** markdown file.\n\n## Features\n\n- Import testing\n- Markdown parsing\n- Route tests',
        mimeType: 'text/markdown'
      },
      'test-document.txt': {
        content: 'Test document content\nMultiple lines\nFor artifact creation testing',
        mimeType: 'text/plain'
      },
      'large-dataset.csv': {
        content: 'Name,Age,City,Country\nJohn Doe,30,New York,USA\nJane Smith,25,London,UK\nPierre Dupont,35,Paris,France\nAnna Müller,28,Berlin,Germany\nTakeshi Tanaka,32,Tokyo,Japan',
        mimeType: 'text/csv'
      }
    }
    
    // Проверяем что файл существует в нашем списке
    if (!testFiles[filename]) {
      return NextResponse.json(
        { 
          error: `Test file not found: ${filename}`,
          availableFiles: Object.keys(testFiles)
        },
        { status: 404 }
      )
    }
    
    const testFile = testFiles[filename]
    
    // Возвращаем файл с правильным MIME типом
    return new NextResponse(testFile.content, {
      status: 200,
      headers: {
        'Content-Type': testFile.mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Test-File': 'true',
        'X-Generated-In-Memory': 'true'
      }
    })
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to serve test file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// END OF: app/api/test/files/[filename]/route.ts