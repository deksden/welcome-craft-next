/**
 * @file app/api/artifacts/import/supported-types/route.ts
 * @description API endpoint для получения поддерживаемых типов файлов для импорта
 * @version 1.0.0
 * @date 2025-06-28
 * @updated Создан отдельный endpoint для supported-types
 */

/** HISTORY:
 * v1.0.0 (2025-06-28): Создан отдельный endpoint для supported-types - перенесен из import/route.ts GET function
 */

import { NextResponse } from 'next/server'

/**
 * @description GET /api/artifacts/import/supported-types - Возвращает поддерживаемые типы файлов
 * @returns {Response} JSON с поддерживаемыми типами файлов и их метаданными
 */
export async function GET() {
  const supportedTypes = {
    documents: [
      { extension: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', artifactKind: 'text' },
      { extension: 'doc', mimeType: 'application/msword', artifactKind: 'text' }
    ],
    spreadsheets: [
      { extension: 'xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', artifactKind: 'sheet' },
      { extension: 'xls', mimeType: 'application/vnd.ms-excel', artifactKind: 'sheet' },
      { extension: 'csv', mimeType: 'text/csv', artifactKind: 'sheet' }
    ],
    text: [
      { extension: 'txt', mimeType: 'text/plain', artifactKind: 'text' },
      { extension: 'md', mimeType: 'text/markdown', artifactKind: 'text' }
    ]
  }
  
  return NextResponse.json(supportedTypes)
}

// END OF: app/api/artifacts/import/supported-types/route.ts