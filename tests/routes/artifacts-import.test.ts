/**
 * @file tests/routes/artifacts-import.test.ts
 * @description API тесты для UC-10 File Import System (/api/artifacts/import)
 * @version 1.0.0
 * @date 2025-06-21
 */

import { expect, apiTest as test } from '../api-fixtures'

// ВРЕМЕННО ОТКЛЮЧЕН: vi from vitest конфликтует с Playwright
// import { vi } from 'vitest'

// ВРЕМЕННО ОТКЛЮЧЕНЫ: vi.mock вызовы конфликтуют с Playwright
/*
// Мокируем Vercel Blob для тестовой среды
vi.mock('@vercel/blob/client', () => ({
  upload: vi.fn().mockImplementation(async (pathname, body, options) => {
    return {
      url: `https://fake-blob.vercel.app/${pathname}`,
      pathname,
      contentType: options.contentType || 'application/octet-stream',
      contentDisposition: `attachment; filename="${pathname}"`,
    }
  }),
}))

// Мокируем mammoth для DOCX обработки
vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({
      value: 'Mocked DOCX content for testing'
    })
  }
}))

// Мокируем XLSX для Excel обработки  
vi.mock('xlsx', () => ({
  read: vi.fn().mockReturnValue({
    SheetNames: ['Sheet1'],
    Sheets: {
      Sheet1: {}
    }
  }),
  utils: {
    sheet_to_csv: vi.fn().mockReturnValue('Name,Age,Department\nJohn,30,Engineering')
  }
}))
*/

// ВРЕМЕННО ОТКЛЮЧЕН: тесты зависят от vi.mock, недоступного в Playwright
test.describe.skip('/api/artifacts/import', () => {

  test('Должен успешно импортировать DOCX файл как text артефакт', async ({ adaContext }) => {
    // Подготавливаем тестовые данные
    const mockFileUrl = 'https://fake-blob.vercel.app/sample.docx'
    const requestData = {
      fileUrl: mockFileUrl,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      customTitle: 'Импортированный DOCX документ'
    }

    // Выполняем запрос к API
    const response = await adaContext.request.post('/api/artifacts/import', {
      data: requestData
    })

    // Проверяем статус ответа
    expect(response.status()).toBe(201)

    // Проверяем структуру ответа
    const responseData = await response.json()
    expect(responseData).toMatchObject({
      artifactId: expect.any(String),
      artifactKind: 'text',
      artifactTitle: 'Импортированный DOCX документ',
      description: expect.stringContaining('imported successfully as text artifact'),
      version: 1,
      totalVersions: 1
    })

    // Верифицируем создание артефакта через GET API
    const verifyResponse = await adaContext.request.get(`/api/artifact?id=${responseData.artifactId}`)
    expect(verifyResponse.status()).toBe(200)
    
    const artifacts = await verifyResponse.json()
    expect(artifacts).toHaveLength(1)
    expect(artifacts[0]).toMatchObject({
      id: responseData.artifactId,
      title: 'Импортированный DOCX документ',
      kind: 'text',
      content: expect.stringContaining('Mocked DOCX content')
    })
  })

  test('Должен успешно импортировать CSV файл как sheet артефакт', async ({ adaContext }) => {
    const requestData = {
      fileUrl: 'https://fake-blob.vercel.app/data.csv',
      mimeType: 'text/csv',
      customTitle: 'Импортированные данные CSV'
    }

    const response = await adaContext.request.post('/api/artifacts/import', {
      data: requestData
    })

    expect(response.status()).toBe(201)

    const responseData = await response.json()
    expect(responseData.artifactKind).toBe('sheet')
    expect(responseData.artifactTitle).toBe('Импортированные данные CSV')

    // Проверяем что CSV данные корректно сохранились
    const verifyResponse = await adaContext.request.get(`/api/artifact?id=${responseData.artifactId}`)
    const artifacts = await verifyResponse.json()
    expect(artifacts[0].content).toContain('Name,Age,Department')
  })

  test('Должен возвращать ошибку для неподдерживаемого типа файла', async ({ adaContext }) => {
    const requestData = {
      fileUrl: 'https://example.com/file.pdf',
      mimeType: 'application/pdf'
    }

    const response = await adaContext.request.post('/api/artifacts/import', {
      data: requestData
    })

    expect(response.status()).toBe(500)
    
    const errorData = await response.json()
    expect(errorData.error).toBe('Import failed')
    expect(errorData.details).toContain('Unsupported file type')
  })

  test('Должен требовать аутентификацию', async ({ browser }) => {
    // Создаем новый контекст без аутентификации
    const unauthContext = await browser.newContext()
    
    const response = await unauthContext.request.post('/api/artifacts/import', {
      data: {
        fileUrl: 'https://example.com/test.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }
    })

    expect(response.status()).toBe(401)
    
    const errorData = await response.json()
    expect(errorData.error).toBe('Unauthorized')
    
    await unauthContext.close()
  })

  test('Должен валидировать обязательное поле fileUrl', async ({ adaContext }) => {
    const response = await adaContext.request.post('/api/artifacts/import', {
      data: {
        mimeType: 'text/plain'
        // fileUrl отсутствует
      }
    })

    expect(response.status()).toBe(400)
    
    const errorData = await response.json()
    expect(errorData.error).toBe('fileUrl is required')
  })

  test('GET /api/artifacts/import/supported-types должен возвращать поддерживаемые типы', async ({ adaContext }) => {
    const response = await adaContext.request.get('/api/artifacts/import/supported-types')
    
    expect(response.status()).toBe(200)
    
    const supportedTypes = await response.json()
    expect(supportedTypes).toHaveProperty('documents')
    expect(supportedTypes).toHaveProperty('spreadsheets')
    expect(supportedTypes).toHaveProperty('text')
    
    // Проверяем структуру документов
    expect(supportedTypes.documents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          extension: 'docx',
          artifactKind: 'text'
        })
      ])
    )
  })
})