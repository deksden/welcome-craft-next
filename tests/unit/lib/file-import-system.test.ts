/**
 * @file tests/unit/lib/file-import-system.test.ts
 * @description Unit tests для UC-10 File Import System
 * @version 1.0.0
 * @date 2025-06-21
 * @updated Создан полный набор тестов для lib/file-import-system.ts с mock файлами и проверкой автоматического определения типов артефактов
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { importFileToArtifact, detectFileType } from '@/lib/file-import-system'

// Мокируем fab-logger для избежания логирования в тестах
vi.mock('@fab33/fab-logger', () => ({
  createLogger: () => ({
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}))

// Мокируем fetch для возврата содержимого локальных файлов
global.fetch = vi.fn()

/**
 * @description Создает mock fetch response из локального файла
 * @param filePath - Путь к файлу относительно корня проекта
 */
async function createMockFetchResponse(filePath: string) {
  const fileBuffer = await readFile(path.join(process.cwd(), filePath))
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    arrayBuffer: () => Promise.resolve(fileBuffer.buffer),
  } as Response
}

describe('File Import System', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockClear()
  })

  describe('detectFileType', () => {
    it('should detect file type by MIME type', () => {
      expect(detectFileType('any-filename.unknown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('docx')
      expect(detectFileType('any-filename.unknown', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe('xlsx')
      expect(detectFileType('any-filename.unknown', 'text/csv')).toBe('csv')
      expect(detectFileType('any-filename.unknown', 'text/plain')).toBe('txt')
      expect(detectFileType('any-filename.unknown', 'text/markdown')).toBe('md')
    })

    it('should detect file type by file extension', () => {
      expect(detectFileType('document.docx')).toBe('docx')
      expect(detectFileType('spreadsheet.xlsx')).toBe('xlsx')
      expect(detectFileType('data.csv')).toBe('csv')
      expect(detectFileType('readme.md')).toBe('md')
      expect(detectFileType('notes.txt')).toBe('txt')
    })

    it('should prioritize MIME type over file extension', () => {
      // Даже если расширение не совпадает, MIME type должен иметь приоритет
      expect(detectFileType('file.wrong', 'text/csv')).toBe('csv')
    })

    it('should return null for unsupported file types', () => {
      expect(detectFileType('document.pdf')).toBe(null)
      expect(detectFileType('image.jpg')).toBe(null)
      expect(detectFileType('archive.zip')).toBe(null)
      expect(detectFileType('unknown-file', 'application/octet-stream')).toBe(null)
    })

    it('should handle case-insensitive file extensions', () => {
      expect(detectFileType('DOCUMENT.DOCX')).toBe('docx')
      expect(detectFileType('Spreadsheet.XLSX')).toBe('xlsx')
      expect(detectFileType('Data.CSV')).toBe('csv')
    })
  })

  describe('importFileToArtifact', () => {
    it('should correctly import a .md file as a text artifact', async () => {
      // Arrange
      const filePath = 'tests/fixtures/files/sample.md'
      vi.mocked(fetch).mockResolvedValue(await createMockFetchResponse(filePath))

      // Act
      const result = await importFileToArtifact('https://example.com/sample.md')

      // Assert
      expect(result.artifactKind).toBe('text')
      expect(result.suggestedTitle).toBe('sample')
      expect(result.content).toContain('# Sample Markdown File')
      expect(result.content).toContain('This is a test markdown file for UC-11')
      expect(result.metadata.originalFormat).toBe('md')
      expect(result.metadata.encoding).toBe('utf-8')
      expect(result.metadata.wordCount).toBeGreaterThan(0)
      expect(result.importInfo.originalFilename).toBe('sample.md')
      expect(result.importInfo.converter).toBe('text-passthrough')
      expect(result.importInfo.convertedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should correctly import a .csv file as a sheet artifact', async () => {
      // Arrange
      const filePath = 'tests/fixtures/files/sample.csv'
      vi.mocked(fetch).mockResolvedValue(await createMockFetchResponse(filePath))

      // Act
      const result = await importFileToArtifact('https://example.com/sample.csv')

      // Assert
      expect(result.artifactKind).toBe('sheet')
      expect(result.suggestedTitle).toBe('sample')
      expect(result.content).toContain('Name,Age,City')
      expect(result.content).toContain('John Doe,30,New York')
      expect(result.metadata.originalFormat).toBe('csv')
      expect(result.metadata.encoding).toBe('utf-8')
      expect(result.importInfo.originalFilename).toBe('sample.csv')
      expect(result.importInfo.converter).toBe('text-passthrough')
    })

    it('should correctly import a .txt file as a text artifact', async () => {
      // Arrange
      const filePath = 'tests/fixtures/files/sample.txt'
      vi.mocked(fetch).mockResolvedValue(await createMockFetchResponse(filePath))

      // Act
      const result = await importFileToArtifact('https://example.com/sample.txt')

      // Assert
      expect(result.artifactKind).toBe('text')
      expect(result.suggestedTitle).toBe('sample')
      expect(result.content).toContain('This is a sample text file for testing UC-11')
      expect(result.content).toContain('It contains basic text content')
      expect(result.metadata.originalFormat).toBe('txt')
      expect(result.metadata.wordCount).toBeGreaterThan(10)
      expect(result.importInfo.originalFilename).toBe('sample.txt')
    })

    it('should throw error for unsupported file types', async () => {
      // Arrange
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      } as Response)
      
      // Act & Assert
      await expect(importFileToArtifact('https://example.com/unsupported.pdf')).rejects.toThrow(
        'Unsupported file type for URL: https://example.com/unsupported.pdf'
      )
    })

    it('should throw error when fetch fails', async () => {
      // Arrange
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response)
      
      // Act & Assert
      await expect(importFileToArtifact('https://example.com/missing.txt')).rejects.toThrow(
        'Failed to fetch file: 404 Not Found'
      )
    })

    it('should handle MIME type parameter in function call', async () => {
      // Arrange
      const filePath = 'tests/fixtures/files/sample.txt'
      vi.mocked(fetch).mockResolvedValue(await createMockFetchResponse(filePath))

      // Act - передаем MIME type явно
      const result = await importFileToArtifact(
        'https://example.com/file-without-extension',
        'text/plain'
      )

      // Assert
      expect(result.artifactKind).toBe('text')
      expect(result.metadata.originalFormat).toBe('txt')
    })

    it('should extract filename from URL correctly', async () => {
      // Arrange
      const filePath = 'tests/fixtures/files/sample.md'
      vi.mocked(fetch).mockResolvedValue(await createMockFetchResponse(filePath))

      // Act
      const result = await importFileToArtifact('https://blob.vercel.com/path/to/my-document.md')

      // Assert
      expect(result.suggestedTitle).toBe('my-document')
      expect(result.importInfo.originalFilename).toBe('my-document.md')
    })

    it('should handle files with no extension in URL', async () => {
      // Arrange
      const filePath = 'tests/fixtures/files/sample.txt'
      vi.mocked(fetch).mockResolvedValue(await createMockFetchResponse(filePath))

      // Act
      const result = await importFileToArtifact(
        'https://example.com/blob-id-without-extension',
        'text/plain'
      )

      // Assert
      expect(result.suggestedTitle).toBe('blob-id-without-extension')
      expect(result.importInfo.originalFilename).toBe('blob-id-without-extension')
    })
  })

  describe('Error handling and edge cases', () => {
    it('should handle empty files gracefully', async () => {
      // Arrange
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
      } as Response)
      
      // Act
      const result = await importFileToArtifact('https://example.com/empty.txt')

      // Assert
      expect(result.artifactKind).toBe('text')
      expect(result.content).toBe('')
      expect(result.metadata.charCount).toBe(0)
      expect(result.importInfo.fileSize).toBe(0)
    })

    it('should include proper metadata in all results', async () => {
      // Arrange
      const filePath = 'tests/fixtures/files/sample.md'
      vi.mocked(fetch).mockResolvedValue(await createMockFetchResponse(filePath))

      // Act
      const result = await importFileToArtifact('https://example.com/test.md')

      // Assert
      expect(result).toHaveProperty('artifactKind')
      expect(result).toHaveProperty('content')
      expect(result).toHaveProperty('suggestedTitle')
      expect(result).toHaveProperty('metadata')
      expect(result).toHaveProperty('importInfo')
      
      expect(result.metadata).toHaveProperty('originalFormat')
      expect(result.metadata).toHaveProperty('encoding')
      expect(result.metadata).toHaveProperty('charCount')
      
      expect(result.importInfo).toHaveProperty('originalFilename')
      expect(result.importInfo).toHaveProperty('fileSize')
      expect(result.importInfo).toHaveProperty('convertedAt')
      expect(result.importInfo).toHaveProperty('converter')
    })
  })
})

// END OF: tests/unit/lib/file-import-system.test.ts