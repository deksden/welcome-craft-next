#!/usr/bin/env tsx
/**
 * @file scripts/index-docs.ts
 * @description Скрипт для индексирования документации проекта в SystemDocs таблицу для RAG системы
 * @version 1.0.0
 * @date 2025-07-02
 * @updated TASK-AI-TOOLS-IMPLEMENTATION - Создан скрипт индексации документации для RAG системы
 */

/** HISTORY:
 * v1.0.0 (2025-07-02): TASK-AI-TOOLS-IMPLEMENTATION - Скрипт сканирует .memory-bank/ директорию, вычисляет хэши файлов, генерирует summary и embeddings для документов
 */

import 'server-only'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { db } from '@/lib/db'
import { systemDocs } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generateText, embed } from 'ai'
import { google } from '@ai-sdk/google'

/**
 * @description Вычисляет SHA256 хэш для содержимого файла
 * @param content - Содержимое файла
 * @returns SHA256 хэш в hex формате
 */
function calculateHash(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex')
}

/**
 * @description Генерирует краткое описание документа с помощью AI
 * @param filePath - Путь к файлу
 * @param content - Содержимое файла
 * @returns Promise с кратким описанием
 */
async function generateDocumentSummary(filePath: string, content: string): Promise<string> {
  try {
    const prompt = `Сделай краткое описание (до 30 слов) для этого документа проекта WelcomeCraft. Файл: ${filePath}

Содержимое:
${content.slice(0, 2000)}...`

    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      prompt,
    })
    
    return text || 'Документация проекта WelcomeCraft'
  } catch (error) {
    console.warn(`Failed to generate summary for ${filePath}:`, error)
    return `Документация: ${path.basename(filePath, '.md')}`
  }
}

/**
 * @description Генерирует векторное эмбеддинг для документа
 * @param content - Содержимое документа
 * @returns Promise с векторным эмбеддингом или null при ошибке
 */
async function generateDocumentEmbedding(content: string): Promise<number[] | null> {
  try {
    // Ограничиваем размер контента для эмбеддинга (первые 8000 символов)
    const truncatedContent = content.slice(0, 8000)
    
    const { embedding } = await embed({
      model: google.textEmbeddingModel('text-embedding-004'),
      value: truncatedContent,
    })
    
    return embedding
  } catch (error) {
    console.warn('Failed to generate embedding:', error)
    return null
  }
}

/**
 * @description Извлекает заголовок из markdown файла
 * @param content - Содержимое файла
 * @param filePath - Путь к файлу (для fallback)
 * @returns Заголовок документа
 */
function extractTitle(content: string, filePath: string): string {
  // Ищем первый заголовок # в файле
  const titleMatch = content.match(/^#\s+(.+)$/m)
  if (titleMatch) {
    return titleMatch[1].trim()
  }
  
  // Fallback: имя файла без расширения
  return path.basename(filePath, '.md')
}

/**
 * @description Сканирует директорию и находит все .md файлы
 * @param dirPath - Путь к директории для сканирования
 * @returns Promise с массивом путей к файлам
 */
async function scanDocumentationFiles(dirPath: string): Promise<string[]> {
  const files: string[] = []
  
  async function scanDirectory(currentPath: string) {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name)
        
        if (entry.isDirectory()) {
          // Пропускаем некоторые директории
          if (!entry.name.startsWith('.') || entry.name === '.memory-bank') {
            await scanDirectory(fullPath)
          }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath)
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${currentPath}:`, error)
    }
  }
  
  await scanDirectory(dirPath)
  return files
}

/**
 * @description Обрабатывает один документ - проверяет изменения и обновляет индекс
 * @param filePath - Путь к файлу
 * @returns Promise с результатом обработки
 */
async function processDocument(filePath: string): Promise<{
  action: 'created' | 'updated' | 'skipped'
  filePath: string
}> {
  try {
    // Читаем содержимое файла
    const content = await fs.readFile(filePath, 'utf8')
    const contentHash = calculateHash(content)
    const stats = await fs.stat(filePath)
    
    // Нормализуем путь к файлу (относительно корня проекта)
    const relativePath = path.relative(process.cwd(), filePath)
    
    // Проверяем существующую запись
    const existingDoc = await db
      .select()
      .from(systemDocs)
      .where(eq(systemDocs.id, relativePath))
      .limit(1)
    
    // Если документ не изменился, пропускаем
    if (existingDoc.length > 0 && existingDoc[0].contentHash === contentHash) {
      return { action: 'skipped', filePath: relativePath }
    }
    
    console.log(`Processing: ${relativePath}`)
    
    // Извлекаем заголовок и генерируем summary
    const title = extractTitle(content, filePath)
    const summary = await generateDocumentSummary(relativePath, content)
    const embedding = await generateDocumentEmbedding(content)
    
    const docData = {
      id: relativePath,
      title,
      summary,
      contentHash,
      fileSize: stats.size,
      mimeType: 'text/markdown',
      embedding,
      updatedAt: new Date(),
    }
    
    if (existingDoc.length > 0) {
      // Обновляем существующий документ
      await db
        .update(systemDocs)
        .set(docData)
        .where(eq(systemDocs.id, relativePath))
      
      return { action: 'updated', filePath: relativePath }
    } else {
      // Создаем новый документ
      await db
        .insert(systemDocs)
        .values({
          ...docData,
          createdAt: new Date(),
        })
      
      return { action: 'created', filePath: relativePath }
    }
  } catch (error) {
    console.error(`Failed to process ${filePath}:`, error)
    return { action: 'skipped', filePath }
  }
}

/**
 * @description Основная функция скрипта индексации
 */
async function main() {
  console.log('🚀 TASK-AI-TOOLS-IMPLEMENTATION: Starting documentation indexing...')
  
  const startTime = Date.now()
  const docsPath = path.join(process.cwd(), '.memory-bank')
  
  // Проверяем что директория существует
  try {
    await fs.access(docsPath)
  } catch {
    console.error(`Documentation directory not found: ${docsPath}`)
    process.exit(1)
  }
  
  // Сканируем все .md файлы
  console.log(`Scanning documentation in: ${docsPath}`)
  const files = await scanDocumentationFiles(docsPath)
  console.log(`Found ${files.length} documentation files`)
  
  // Обрабатываем каждый файл
  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  }
  
  for (const file of files) {
    const result = await processDocument(file)
    
    switch (result.action) {
      case 'created':
        results.created++
        console.log(`  ✅ Created: ${result.filePath}`)
        break
      case 'updated':
        results.updated++
        console.log(`  🔄 Updated: ${result.filePath}`)
        break
      case 'skipped':
        results.skipped++
        console.log(`  ⏭️  Skipped: ${result.filePath}`)
        break
    }
  }
  
  const elapsed = Date.now() - startTime
  console.log('\n📊 Documentation indexing completed!')
  console.log(`📈 Results:`)
  console.log(`  - Created: ${results.created}`)
  console.log(`  - Updated: ${results.updated}`)
  console.log(`  - Skipped: ${results.skipped}`)
  console.log(`  - Total files: ${files.length}`)
  console.log(`⏱️  Time elapsed: ${elapsed}ms`)
}

// Запускаем скрипт если он вызван напрямую
if (require.main === module) {
  main().catch((error) => {
    console.error('Documentation indexing failed:', error)
    process.exit(1)
  })
}

export { main as indexDocumentation }

// END OF: scripts/index-docs.ts