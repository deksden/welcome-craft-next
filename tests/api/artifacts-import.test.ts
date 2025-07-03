/**
 * @file tests/routes/artifacts-import.test.ts
 * @description API валидация для UC-10 File Import System (/api/artifacts/import)
 * @version 6.0.0
 * @date 2025-06-28
 * @updated Исправлены паттерны аутентификации - использование unified auth и правильные URL паттерны
 */

/** HISTORY:
 * v6.0.0 (2025-06-28): Исправлены паттерны аутентификации - убран baseURL parameter из тестов, используется context.baseURL
 * v5.0.0 (2025-06-28): Восстановлены тесты - создан /api/test/files/[filename] endpoint для реальных HTTP URLs
 * v4.0.0 (2025-06-28): Временно пропущены - нужен правильный подход к тестированию
 * v3.0.0 (2025-06-28): Попытка мокирования - overengineering
 * v2.0.0 (2025-06-28): Попытка использовать реальные файлы 
 * v1.0.0 (2025-06-21): Изначальная версия с vi.mock
 */

import { expect, apiTest as test } from '../api-fixtures'

test.describe('/api/artifacts/import', () => {

  test('Должен требовать аутентификацию', async ({ browser }) => {
    // Создаем новый контекст без аутентификации
    const unauthContext = await browser.newContext()
    
    const response = await unauthContext.request.post('/api/artifacts/import', {
      data: {
        fileUrl: 'https://example.com/test.txt',
        mimeType: 'text/plain'
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

  test('Тестовый endpoint должен предоставлять файлы', async ({ adaContext }) => {
    // Route тесты автоматически используют правильный домен через api-fixtures
    const fileResponse = await adaContext.request.get('/api/test/files/sample.txt')
    expect(fileResponse.status()).toBe(200)
    
    const fileContent = await fileResponse.text()
    expect(fileContent).toContain('sample text file')
    expect(fileResponse.headers()['content-type']).toBe('text/plain')
  })

  test('Должен успешно импортировать TXT файл', async ({ adaContext }) => {
    // Сначала проверим что тестовый файл доступен
    const fileCheck = await adaContext.request.get('/api/test/files/sample.txt')
    expect(fileCheck.status()).toBe(200)
    
    // Получаем полный URL для файла из context.baseURL
    const contextBaseURL = (adaContext.context as any)._options.baseURL
    if (!contextBaseURL) {
      throw new Error('baseURL не найден в context options')
    }
    const testFileUrl = `${contextBaseURL}/api/test/files/sample.txt`
    
    const response = await adaContext.request.post('/api/artifacts/import', {
      data: {
        fileUrl: testFileUrl,
        mimeType: 'text/plain',
        customTitle: 'Импортированный текст'
      }
    })

    expect(response.status()).toBe(201)
    
    const result = await response.json()
    expect(result).toHaveProperty('artifactId')
    expect(result).toHaveProperty('artifactKind', 'text')
    expect(result).toHaveProperty('artifactTitle', 'Импортированный текст')
    expect(result).toHaveProperty('description')
    expect(result.description).toContain('sample.txt')
    expect(result.description).toContain('imported successfully')
  })

  test('Должен успешно импортировать CSV файл', async ({ adaContext }) => {
    // Получаем полный URL для файла из context.baseURL
    const contextBaseURL = (adaContext.context as any)._options.baseURL
    if (!contextBaseURL) {
      throw new Error('baseURL не найден в context options')
    }
    const testFileUrl = `${contextBaseURL}/api/test/files/sample-employees.csv`
    
    const response = await adaContext.request.post('/api/artifacts/import', {
      data: {
        fileUrl: testFileUrl,
        mimeType: 'text/csv'
      }
    })

    expect(response.status()).toBe(201)
    
    const result = await response.json()
    expect(result).toHaveProperty('artifactId')
    expect(result).toHaveProperty('artifactKind', 'sheet')
    expect(result).toHaveProperty('artifactTitle', 'sample-employees')
    expect(result.description).toContain('csv')
  })

  test('Должен использовать suggestedTitle если customTitle не указан', async ({ adaContext }) => {
    // Получаем полный URL для файла из context.baseURL
    const contextBaseURL = (adaContext.context as any)._options.baseURL
    if (!contextBaseURL) {
      throw new Error('baseURL не найден в context options')
    }
    const testFileUrl = `${contextBaseURL}/api/test/files/sample.txt`
    
    const response = await adaContext.request.post('/api/artifacts/import', {
      data: {
        fileUrl: testFileUrl,
        mimeType: 'text/plain'
        // customTitle не указан
      }
    })

    expect(response.status()).toBe(201)
    
    const result = await response.json()
    expect(result.artifactTitle).toBe('sample') // filename без расширения
  })

  test('Должен возвращать ошибку для несуществующего файла', async ({ adaContext }) => {
    // Получаем полный URL для файла из context.baseURL
    const contextBaseURL = (adaContext.context as any)._options.baseURL
    if (!contextBaseURL) {
      throw new Error('baseURL не найден в context options')
    }
    const testFileUrl = `${contextBaseURL}/api/test/files/nonexistent-file.txt`
    
    const response = await adaContext.request.post('/api/artifacts/import', {
      data: {
        fileUrl: testFileUrl,
        mimeType: 'text/plain'
      }
    })

    expect(response.status()).toBe(500)
    
    const errorData = await response.json()
    expect(errorData.error).toBe('Import failed')
    expect(errorData.details).toContain('404')
  })

  test('Должен возвращать ошибку для неподдерживаемого типа файла', async ({ adaContext }) => {
    const response = await adaContext.request.post('/api/artifacts/import', {
      data: {
        fileUrl: 'https://example.com/unsupported.xyz',
        mimeType: 'application/unknown'
      }
    })

    expect(response.status()).toBe(500)
    
    const errorData = await response.json()
    expect(errorData.error).toBe('Import failed')
    expect(errorData.details).toContain('Unsupported file type')
  })
})

// END OF: tests/routes/artifacts-import.test.ts