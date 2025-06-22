/**
 * @file lib/file-import-system.ts
 * @description UC-10 SCHEMA-DRIVEN CMS - File Import System для автоматического создания артефактов из файлов.
 * @version 1.0.0
 * @date 2025-06-20
 * @updated UC-10 SCHEMA-DRIVEN CMS - Создана система импорта .docx и .xlsx файлов с автоматическим определением типа и конвертацией в артефакты.
 */

/** HISTORY:
 * v1.0.0 (2025-06-20): UC-10 SCHEMA-DRIVEN CMS - Создана система импорта файлов с поддержкой .docx (mammoth + turndown) и .xlsx (xlsx library) конвертации в text и sheet артефакты соответственно.
 */

import mammoth from 'mammoth'
import TurndownService from 'turndown'
import * as XLSX from 'xlsx'
import { createLogger } from '@fab33/fab-logger'
import type { ArtifactKind } from '@/lib/types'

const logger = createLogger('lib:file-import-system')

/**
 * @description Интерфейс результата импорта файла
 * @feature Поддержка метаданных и автоматического определения типа артефакта
 */
export interface ImportResult {
  /** Определенный тип артефакта на основе файла */
  artifactKind: ArtifactKind
  /** Конвертированный контент для сохранения в артефакт */
  content: string
  /** Предлагаемое название артефакта */
  suggestedTitle: string
  /** Дополнительные метаданные для артефакта */
  metadata: Record<string, any>
  /** Информация о процессе импорта */
  importInfo: {
    originalFilename: string
    fileSize: number
    convertedAt: string
    converter: string
  }
}

/**
 * @description Поддерживаемые типы файлов для импорта
 * @feature Автоматическое определение по MIME type и расширению
 */
const SUPPORTED_FILE_TYPES = {
  // Microsoft Word документы
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  
  // Microsoft Excel таблицы
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  
  // CSV файлы
  'text/csv': 'csv',
  'application/csv': 'csv',
  
  // Plain text
  'text/plain': 'txt',
  'text/markdown': 'md'
} as const

/**
 * @description Определяет тип файла по URL и MIME type
 * @param fileUrl - URL файла в Vercel Blob
 * @param mimeType - MIME type файла (опционально)
 * @returns Тип файла или null если не поддерживается
 */
export function detectFileType(fileUrl: string, mimeType?: string): string | null {
  const childLogger = logger.child({ fileUrl, mimeType })
  
  // Попробуем определить по MIME type
  if (mimeType && mimeType in SUPPORTED_FILE_TYPES) {
    const detectedType = SUPPORTED_FILE_TYPES[mimeType as keyof typeof SUPPORTED_FILE_TYPES]
    childLogger.info({ detectedType, method: 'mime-type' }, 'File type detected')
    return detectedType
  }
  
  // Fallback: определение по расширению файла в URL
  const urlLower = fileUrl.toLowerCase()
  for (const [, fileType] of Object.entries(SUPPORTED_FILE_TYPES)) {
    if (urlLower.endsWith(`.${fileType}`)) {
      childLogger.info({ detectedType: fileType, method: 'file-extension' }, 'File type detected')
      return fileType
    }
  }
  
  childLogger.warn('Unsupported file type')
  return null
}

/**
 * @description Конвертирует .docx файл в markdown text артефакт
 * @param fileBuffer - Буфер файла
 * @param filename - Имя файла
 * @returns Promise с результатом импорта
 */
async function convertDocxToText(fileBuffer: ArrayBuffer, filename: string): Promise<ImportResult> {
  const childLogger = logger.child({ filename, converter: 'docx-to-text' })
  const startTime = Date.now()
  
  try {
    childLogger.info('Starting DOCX conversion with mammoth')
    
    // Конвертируем DOCX в HTML с помощью mammoth
    const mammothResult = await mammoth.convertToHtml({ arrayBuffer: fileBuffer })
    const htmlContent = mammothResult.value
    
    if (mammothResult.messages.length > 0) {
      childLogger.warn({ 
        warnings: mammothResult.messages.map(m => m.message) 
      }, 'Mammoth conversion warnings')
    }
    
    // Конвертируем HTML в Markdown с помощью turndown
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    })
    
    const markdownContent = turndownService.turndown(htmlContent)
    const conversionTime = Date.now() - startTime
    
    childLogger.info({ 
      htmlLength: htmlContent.length,
      markdownLength: markdownContent.length,
      conversionTimeMs: conversionTime
    }, 'DOCX conversion completed successfully')
    
    return {
      artifactKind: 'text',
      content: markdownContent,
      suggestedTitle: filename.replace(/\.(docx|doc)$/i, ''),
      metadata: {
        originalFormat: 'docx',
        wordCount: markdownContent.trim().split(/\s+/).length,
        charCount: markdownContent.length
      },
      importInfo: {
        originalFilename: filename,
        fileSize: fileBuffer.byteLength,
        convertedAt: new Date().toISOString(),
        converter: 'mammoth + turndown'
      }
    }
  } catch (error) {
    const conversionTime = Date.now() - startTime
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      conversionTimeMs: conversionTime
    }, 'DOCX conversion failed')
    throw error
  }
}

/**
 * @description Конвертирует .xlsx файл в CSV sheet артефакт
 * @param fileBuffer - Буфер файла
 * @param filename - Имя файла
 * @returns Promise с результатом импорта
 */
async function convertXlsxToSheet(fileBuffer: ArrayBuffer, filename: string): Promise<ImportResult> {
  const childLogger = logger.child({ filename, converter: 'xlsx-to-csv' })
  const startTime = Date.now()
  
  try {
    childLogger.info('Starting XLSX conversion with xlsx library')
    
    // Читаем XLSX файл
    const workbook = XLSX.read(fileBuffer, { type: 'array' })
    
    // Берем первый лист
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      throw new Error('XLSX file contains no sheets')
    }
    
    const worksheet = workbook.Sheets[firstSheetName]
    
    // Конвертируем в CSV
    const csvContent = XLSX.utils.sheet_to_csv(worksheet)
    const conversionTime = Date.now() - startTime
    
    // Подсчитаем строки и колонки
    const csvLines = csvContent.split('\n').filter(line => line.trim())
    const csvColumns = csvLines.length > 0 ? csvLines[0].split(',').length : 0
    
    childLogger.info({ 
      sheetsCount: workbook.SheetNames.length,
      firstSheetName,
      csvLength: csvContent.length,
      csvLines: csvLines.length,
      csvColumns,
      conversionTimeMs: conversionTime
    }, 'XLSX conversion completed successfully')
    
    return {
      artifactKind: 'sheet',
      content: csvContent,
      suggestedTitle: filename.replace(/\.(xlsx|xls)$/i, ''),
      metadata: {
        originalFormat: 'xlsx',
        sheetName: firstSheetName,
        totalSheets: workbook.SheetNames.length,
        rowsCount: csvLines.length,
        columnsCount: csvColumns
      },
      importInfo: {
        originalFilename: filename,
        fileSize: fileBuffer.byteLength,
        convertedAt: new Date().toISOString(),
        converter: 'xlsx library'
      }
    }
  } catch (error) {
    const conversionTime = Date.now() - startTime
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      conversionTimeMs: conversionTime
    }, 'XLSX conversion failed')
    throw error
  }
}

/**
 * @description Конвертирует текстовый файл в text артефакт
 * @param fileBuffer - Буфер файла
 * @param filename - Имя файла
 * @param fileType - Тип файла (csv, txt, md)
 * @returns Promise с результатом импорта
 */
async function convertTextFile(fileBuffer: ArrayBuffer, filename: string, fileType: string): Promise<ImportResult> {
  const childLogger = logger.child({ filename, fileType, converter: 'text-passthrough' })
  
  try {
    // Декодируем текст из буфера
    const textContent = new TextDecoder('utf-8').decode(fileBuffer)
    
    // Определяем artifactKind на основе типа файла
    const artifactKind: ArtifactKind = fileType === 'csv' ? 'sheet' : 'text'
    
    childLogger.info({ 
      textLength: textContent.length,
      artifactKind
    }, 'Text file conversion completed')
    
    return {
      artifactKind,
      content: textContent,
      suggestedTitle: filename.replace(/\.(csv|txt|md)$/i, ''),
      metadata: {
        originalFormat: fileType,
        encoding: 'utf-8',
        wordCount: fileType !== 'csv' ? textContent.trim().split(/\s+/).length : undefined,
        charCount: textContent.length
      },
      importInfo: {
        originalFilename: filename,
        fileSize: fileBuffer.byteLength,
        convertedAt: new Date().toISOString(),
        converter: 'text-passthrough'
      }
    }
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error)
    }, 'Text file conversion failed')
    throw error
  }
}

/**
 * @description Главная функция импорта файлов в артефакты
 * @feature Автоматическое определение типа файла и выбор подходящего конвертера
 * @param fileUrl - URL файла в Vercel Blob
 * @param mimeType - MIME type файла (опционально)
 * @returns Promise с результатом импорта
 * @throws Ошибка если файл не поддерживается или конвертация не удалась
 */
export async function importFileToArtifact(
  fileUrl: string, 
  mimeType?: string
): Promise<ImportResult> {
  const childLogger = logger.child({ fileUrl, mimeType })
  const startTime = Date.now()
  
  try {
    // Извлекаем имя файла из URL
    const filename = fileUrl.split('/').pop() || 'unknown-file'
    
    // Определяем тип файла
    const fileType = detectFileType(fileUrl, mimeType)
    if (!fileType) {
      throw new Error(`Unsupported file type for URL: ${fileUrl}`)
    }
    
    childLogger.info({ filename, fileType }, 'Starting file import process')
    
    // Загружаем файл
    const fetchStart = Date.now()
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
    }
    
    const fileBuffer = await response.arrayBuffer()
    const fetchTime = Date.now() - fetchStart
    
    childLogger.info({ 
      fileSize: fileBuffer.byteLength,
      fetchTimeMs: fetchTime
    }, 'File fetched successfully')
    
    // Выбираем подходящий конвертер
    let result: ImportResult
    
    switch (fileType) {
      case 'docx':
      case 'doc':
        result = await convertDocxToText(fileBuffer, filename)
        break
        
      case 'xlsx':
      case 'xls':
        result = await convertXlsxToSheet(fileBuffer, filename)
        break
        
      case 'csv':
      case 'txt':
      case 'md':
        result = await convertTextFile(fileBuffer, filename, fileType)
        break
        
      default:
        throw new Error(`No converter available for file type: ${fileType}`)
    }
    
    const totalTime = Date.now() - startTime
    
    childLogger.info({ 
      artifactKind: result.artifactKind,
      contentLength: result.content.length,
      totalTimeMs: totalTime
    }, 'File import completed successfully')
    
    return result
    
  } catch (error) {
    const totalTime = Date.now() - startTime
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      totalTimeMs: totalTime
    }, 'File import failed')
    
    throw error
  }
}

// END OF: lib/file-import-system.ts