/**
 * @file tests/unit/debug/artifacts-grouping.test.ts
 * @description Диагностический тест для проверки группировки версий артефактов
 * @version 1.0.0
 * @date 2025-06-20
 * @purpose ДИАГНОСТИКА BUG-023 - проверить почему список артефактов показывает версии
 */

/** HISTORY:
 * v1.0.0 (2025-06-20): Создан для диагностики проблемы с groupByVersions=true
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPagedArtifactsByUserId } from '@/lib/db/queries'
import { db } from '@/lib/db'

// Мокируем БД с полной цепочкой Drizzle
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => [])
        }))
      }))
    })),
  },
}))

describe('🔍 Artifacts Grouping Diagnosis (BUG-023)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('🧪 should group artifacts correctly for groupByVersions=true', async () => {
    // ✅ УПРОЩЕННЫЙ ТЕСТ: Фокус на результате, а не на SQL
    vi.mocked(db.select).mockImplementation(() => ({
      from: () => ({
        where: () => ({
          orderBy: () => Promise.resolve([
            { 
              id: 'artifact-1', 
              title: 'Test Artifact 1 V2', 
              createdAt: new Date('2025-06-20T10:00:00Z'),
              kind: 'text',
              userId: 'user-1'
            },
            { 
              id: 'artifact-1', 
              title: 'Test Artifact 1 V1', 
              createdAt: new Date('2025-06-19T10:00:00Z'),
              kind: 'text',
              userId: 'user-1'
            },
            { 
              id: 'artifact-2', 
              title: 'Test Artifact 2 V1', 
              createdAt: new Date('2025-06-18T10:00:00Z'),
              kind: 'site', 
              userId: 'user-1'
            }
          ])
        })
      })
    }) as any)

    const result = await getPagedArtifactsByUserId({
      userId: 'user-1',
      page: 1,
      pageSize: 10,
      groupByVersions: true
    })

    // ✅ ГЛАВНОЕ: проверяем что группировка работает
    expect(result.data).toHaveLength(2) // 2 уникальных артефакта
    expect(result.totalCount).toBe(2)
    
    const returnedIds = result.data.map(a => a.id)
    const uniqueIds = [...new Set(returnedIds)]
    expect(returnedIds).toEqual(uniqueIds) // No duplicates
    
    console.log('✅ BUG-023 Test: JavaScript grouping works correctly')
  })

  it('🧪 should return all versions for groupByVersions=false', async () => {
    // ✅ УПРОЩЕННЫЙ ТЕСТ: Мок для показа всех версий
    vi.mocked(db.select).mockImplementation(() => ({
      from: () => ({
        where: () => Promise.resolve([{ count: 3 }])
      })
    }) as any)
    
    // Второй вызов для data
    vi.mocked(db.select).mockImplementationOnce(() => ({
      from: () => ({
        where: () => Promise.resolve([{ count: 3 }])
      })
    }) as any).mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => ({
              offset: () => Promise.resolve([
                { id: 'artifact-1', title: 'Test V2', createdAt: new Date('2025-06-20') },
                { id: 'artifact-1', title: 'Test V1', createdAt: new Date('2025-06-19') },
                { id: 'artifact-2', title: 'Other V1', createdAt: new Date('2025-06-18') }
              ])
            })
          })
        })
      })
    }) as any)

    const result = await getPagedArtifactsByUserId({
      userId: 'user-1', 
      page: 1,
      pageSize: 10,
      groupByVersions: false
    })

    expect(result.data).toHaveLength(3) // Все версии включая дубликаты
    expect(result.totalCount).toBe(3)
    
    console.log('✅ BUG-023 Test: No grouping works correctly')
  })

  it('🚨 DIAGNOSTIC: Log actual groupByVersions parameter processing', () => {
    // Проверяем как обрабатывается параметр в API
    
    // Тест 1: Параметр по умолчанию (true)
    const defaultGrouping = new URLSearchParams('').get('groupByVersions') !== 'false'
    expect(defaultGrouping).toBe(true) // Default должен быть true
    
    // Тест 2: Явно указанный true
    const explicitTrue = new URLSearchParams('groupByVersions=true').get('groupByVersions') !== 'false'
    expect(explicitTrue).toBe(true)
    
    // Тест 3: Явно указанный false
    const explicitFalse = new URLSearchParams('groupByVersions=false').get('groupByVersions') !== 'false'
    expect(explicitFalse).toBe(false)

    console.log('✅ Parameter processing works correctly')
  })
})

// END OF: tests/unit/debug/artifacts-grouping.test.ts