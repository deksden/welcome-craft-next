/**
 * @file tests/unit/lib/ai/summarizer.test.ts
 * @description Тесты для Summarizer с использованием режима record-or-replay AI Fixtures
 * @version 1.0.0
 * @date 2025-06-18
 * @updated Начальная реализация с AI Fixtures Provider
 */

/** HISTORY:
 * v1.0.0 (2025-06-18): Начальная реализация тестов Summarizer с режимом record-or-replay
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ArtifactKind } from '@/lib/types'

// Мокируем DB операции для изоляции тестов
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'test-artifact-id',
              createdAt: new Date('2025-06-18T10:00:00Z'),
              title: 'Test Artifact',
              summary: null
            }])
          })
        })
      })
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([])
      })
    })
  }
}))

// Мокируем AI provider для подстановки fixtures-wrapped модели
vi.mock('@/lib/ai/providers', () => ({
  myProvider: {
    languageModel: vi.fn()
  }
}))

// Мокируем generateText из AI SDK
vi.mock('ai', () => ({
  generateText: vi.fn()
}))

// Импорты после моков
import { generateAndSaveSummary } from '@/lib/ai/summarizer'
import { AIFixturesProvider } from '@/lib/ai/fixtures-provider'
import { generateText } from 'ai'
import { db } from '@/lib/db'
import { myProvider } from '@/lib/ai/providers'

describe('Summarizer with AI Fixtures (record-or-replay)', () => {
  let fixturesProvider: AIFixturesProvider
  let originalMode: string | undefined

  beforeEach(() => {
    // Сохраняем оригинальный режим
    originalMode = process.env.AI_FIXTURES_MODE
    
    // Устанавливаем режим record-or-replay для тестов
    process.env.AI_FIXTURES_MODE = 'record-or-replay'
    
    // Создаем fixtures provider
    fixturesProvider = new AIFixturesProvider({
      mode: 'record-or-replay',
      fixturesDir: './tests/fixtures/ai/summarizer',
      debug: true
    })
    
    // Очищаем все моки
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Восстанавливаем оригинальный режим
    if (originalMode !== undefined) {
      process.env.AI_FIXTURES_MODE = originalMode
    } else {
      process.env.AI_FIXTURES_MODE = undefined
    }
  })

  it('should generate and save summary for text artifact', async () => {
    // Arrange: подготавливаем мок модели
    const mockModel = {
      specificationVersion: 'v1' as const,
      provider: 'test-provider',
      modelId: 'test-model'
    }
    
    // Создаем wrapped модель с AI fixtures
    const wrappedModel = fixturesProvider.wrapModel(mockModel, {
      useCaseId: 'summarizer-text',
      fixturePrefix: 'summarizer'
    })
    
    // Мокируем myProvider чтобы он вернул обернутую модель
    vi.mocked(myProvider.languageModel).mockReturnValue(wrappedModel)
    
    // Мокируем generateText - он будет использовать обернутую модель
    vi.mocked(generateText).mockResolvedValue({
      text: 'Краткое описание текстового контента',
      finishReason: 'stop',
      usage: { promptTokens: 50, completionTokens: 10, totalTokens: 60 }
    } as any)

    const testContent = 'Это длинный текстовый контент который требует саммаризации. В нем может быть много информации и деталей.'
    const artifactId = 'test-text-artifact'
    const kind: ArtifactKind = 'text'

    // Act: вызываем функцию генерации саммари
    await generateAndSaveSummary(artifactId, testContent, kind)

    // Assert: проверяем что DB операции были вызваны корректно
    expect(vi.mocked(db.select)).toHaveBeenCalled()
    expect(vi.mocked(db.update)).toHaveBeenCalled()
    
    // Проверяем что generateText был вызван с wrapped моделью
    expect(vi.mocked(generateText)).toHaveBeenCalledWith({
      model: wrappedModel,
      prompt: expect.stringContaining('Сделай очень краткое саммари для этого текста')
    })
  })

  it('should generate and save summary for code artifact', async () => {
    // Arrange: подготавливаем мок модели для кода
    const mockModel = {
      specificationVersion: 'v1' as const,
      provider: 'test-provider',
      modelId: 'test-model'
    }
    
    const wrappedModel = fixturesProvider.wrapModel(mockModel, {
      useCaseId: 'summarizer-code',
      fixturePrefix: 'summarizer'
    })
    
    vi.mocked(myProvider.languageModel).mockReturnValue(wrappedModel)
    
    vi.mocked(generateText).mockResolvedValue({
      text: 'Функция сортировки массива',
      finishReason: 'stop',
      usage: { promptTokens: 50, completionTokens: 10, totalTokens: 60 }
    } as any)

    const testCodeContent = `
function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}
    `
    const artifactId = 'test-code-artifact'
    const kind: ArtifactKind = 'code'

    // Act
    await generateAndSaveSummary(artifactId, testCodeContent, kind)

    // Assert: проверяем корректный prompt для кода
    expect(vi.mocked(generateText)).toHaveBeenCalledWith({
      model: wrappedModel,
      prompt: expect.stringContaining('Сделай очень краткое саммари для этого фрагмента кода')
    })
  })

  it('should generate and save summary for site artifact', async () => {
    // Arrange: подготавливаем мок модели для сайта
    const mockModel = {
      specificationVersion: 'v1' as const,
      provider: 'test-provider', 
      modelId: 'test-model'
    }
    
    const wrappedModel = fixturesProvider.wrapModel(mockModel, {
      useCaseId: 'summarizer-site',
      fixturePrefix: 'summarizer'
    })
    
    vi.mocked(myProvider.languageModel).mockReturnValue(wrappedModel)
    
    vi.mocked(generateText).mockResolvedValue({
      text: 'Сайт с блоками hero и contacts',
      finishReason: 'stop',
      usage: { promptTokens: 50, completionTokens: 10, totalTokens: 60 }
    } as any)

    const testSiteContent = JSON.stringify({
      theme: 'modern',
      blocks: [
        { type: 'hero', slots: { title: 'artifact-1', subtitle: 'artifact-2' } },
        { type: 'contacts', slots: { contacts: 'artifact-3' } }
      ]
    })
    const artifactId = 'test-site-artifact'
    const kind: ArtifactKind = 'site'

    // Act
    await generateAndSaveSummary(artifactId, testSiteContent, kind)

    // Assert: проверяем корректный prompt для сайта (должен содержать структуру)
    expect(vi.mocked(generateText)).toHaveBeenCalledWith({
      model: wrappedModel,
      prompt: expect.stringContaining('Опиши структуру этого сайта кратко')
    })
  })

  it('should handle AI errors gracefully', async () => {
    // Arrange: подготавливаем мок модели которая выбросит ошибку
    const mockModel = {
      specificationVersion: 'v1' as const,
      provider: 'test-provider',
      modelId: 'test-model'
    }
    
    const wrappedModel = fixturesProvider.wrapModel(mockModel, {
      useCaseId: 'summarizer-error',
      fixturePrefix: 'summarizer'
    })
    
    vi.mocked(myProvider.languageModel).mockReturnValue(wrappedModel)
    
    // Мокируем ошибку квоты
    vi.mocked(generateText).mockRejectedValue(new Error('API quota exceeded'))

    const testContent = 'Test content'
    const artifactId = 'test-error-artifact'
    const kind: ArtifactKind = 'text'

    // Act & Assert: функция не должна выбросить ошибку
    await expect(
      generateAndSaveSummary(artifactId, testContent, kind)
    ).resolves.not.toThrow()
    
    // DB update не должен быть вызван при ошибке
    expect(vi.mocked(db.update)).not.toHaveBeenCalled()
  })

  it('should use fixtures provider stats correctly', () => {
    // Act: получаем статистику fixtures provider
    const stats = fixturesProvider.getStats()

    // Assert: проверяем что статистика корректна
    expect(stats.mode).toBe('record-or-replay')
    expect(stats.fixturesDir).toContain('summarizer')
    expect(typeof stats.cacheSize).toBe('number')
  })

  it('should handle image artifact summary', async () => {
    // Arrange: подготавливаем мок для изображения
    const mockModel = {
      specificationVersion: 'v1' as const,
      provider: 'test-provider',
      modelId: 'test-model'
    }
    
    const wrappedModel = fixturesProvider.wrapModel(mockModel, {
      useCaseId: 'summarizer-image',
      fixturePrefix: 'summarizer'
    })
    
    vi.mocked(myProvider.languageModel).mockReturnValue(wrappedModel)
    
    vi.mocked(generateText).mockResolvedValue({
      text: 'Логотип компании',
      finishReason: 'stop',
      usage: { promptTokens: 50, completionTokens: 10, totalTokens: 60 }
    } as any)

    const imageUrl = 'https://example.com/image.jpg'
    const artifactId = 'test-image-artifact'
    const kind: ArtifactKind = 'image'

    // Act
    await generateAndSaveSummary(artifactId, imageUrl, kind)

    // Assert: проверяем корректный prompt для изображения
    expect(vi.mocked(generateText)).toHaveBeenCalledWith({
      model: wrappedModel,
      prompt: expect.stringContaining('Опиши это изображение кратко')
    })
  })
})

// END OF: tests/unit/lib/ai/summarizer.test.ts