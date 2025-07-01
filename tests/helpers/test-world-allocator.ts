/**
 * @file tests/helpers/test-world-allocator.ts
 * @description Test World Allocator для параллельного выполнения E2E тестов с изолированными мирами
 * @version 1.0.0
 * @date 2025-07-01
 * @updated Создан для поддержки World Isolation + Parallel E2E Testing Architecture
 */

/** HISTORY:
 * v1.0.0 (2025-07-01): Создан Test World Allocator для динамического распределения изолированных миров между Playwright workers
 */

import { randomUUID } from 'node:crypto'

/**
 * @description Конфигурация теста с привязкой к миру
 */
export interface TestWorldConfig {
  testFile: string
  worldId: string
  seedType: 'basic_user' | 'admin_user' | 'multi_artifact' | 'general'
  timeout: number
  requiresAdmin: boolean
}

/**
 * @description Информация о worker и его миром
 */
export interface WorkerWorldInfo {
  workerId: string
  worldId: string
  assignedTests: string[]
  isActive: boolean
  createdAt: number
}

/**
 * @description Test World Allocator - управляет распределением изолированных миров между workers
 */
export class TestWorldAllocator {
  private static instance: TestWorldAllocator
  private workers: Map<string, WorkerWorldInfo> = new Map()
  private testConfigs: Map<string, TestWorldConfig> = new Map()
  private sessionId: string

  private constructor() {
    this.sessionId = Date.now().toString()
    this.initializeTestConfigs()
  }

  /**
   * @description Получить синглтон экземпляр allocator
   */
  public static getInstance(): TestWorldAllocator {
    if (!TestWorldAllocator.instance) {
      TestWorldAllocator.instance = new TestWorldAllocator()
    }
    return TestWorldAllocator.instance
  }

  /**
   * @description Инициализация конфигураций тестов
   */
  private initializeTestConfigs(): void {
    // UC Tests - можно параллельно
    this.testConfigs.set('UC-01-AI-First-Site-Creation.test.ts', {
      testFile: 'UC-01-AI-First-Site-Creation.test.ts',
      worldId: '', // будет назначен динамически
      seedType: 'basic_user',
      timeout: 60000,
      requiresAdmin: false
    })

    this.testConfigs.set('UC-02-Visual-Site-Building.test.ts', {
      testFile: 'UC-02-Visual-Site-Building.test.ts', 
      worldId: '',
      seedType: 'basic_user',
      timeout: 60000,
      requiresAdmin: false
    })

    this.testConfigs.set('UC-03-Artifact-Reuse.test.ts', {
      testFile: 'UC-03-Artifact-Reuse.test.ts',
      worldId: '',
      seedType: 'basic_user', 
      timeout: 60000,
      requiresAdmin: false
    })

    this.testConfigs.set('UC-04-Site-Publishing.test.ts', {
      testFile: 'UC-04-Site-Publishing.test.ts',
      worldId: '',
      seedType: 'basic_user',
      timeout: 60000, 
      requiresAdmin: false
    })

    // UC-05 - длинный тест, отдельный worker
    this.testConfigs.set('UC-05-Multi-Artifact-Creation.test.ts', {
      testFile: 'UC-05-Multi-Artifact-Creation.test.ts',
      worldId: '',
      seedType: 'multi_artifact',
      timeout: 80000, // увеличенный timeout
      requiresAdmin: false
    })

    this.testConfigs.set('UC-06-Site-Templates.test.ts', {
      testFile: 'UC-06-Site-Templates.test.ts',
      worldId: '',
      seedType: 'basic_user',
      timeout: 60000,
      requiresAdmin: false
    })

    this.testConfigs.set('UC-07-Collaborative-Editing.test.ts', {
      testFile: 'UC-07-Collaborative-Editing.test.ts',
      worldId: '',
      seedType: 'basic_user',
      timeout: 60000,
      requiresAdmin: false
    })

    // Phoenix Tests - требуют admin права, последовательное выполнение
    this.testConfigs.set('phoenix-user-management.test.ts', {
      testFile: 'phoenix-user-management.test.ts',
      worldId: '',
      seedType: 'admin_user',
      timeout: 60000,
      requiresAdmin: true
    })

    this.testConfigs.set('phoenix-seed-export.test.ts', {
      testFile: 'phoenix-seed-export.test.ts', 
      worldId: '',
      seedType: 'admin_user',
      timeout: 60000,
      requiresAdmin: true
    })

    console.log(`🌍 Test World Allocator initialized with ${this.testConfigs.size} test configurations`)
  }

  /**
   * @description Получить или создать world для worker
   * @param workerId - ID Playwright worker
   * @param testFile - имя файла теста
   * @returns Информация о мире для этого worker
   */
  public async allocateWorldForWorker(workerId: string, testFile: string): Promise<WorkerWorldInfo> {
    // Проверяем существующий worker
    let workerInfo = this.workers.get(workerId)
    
    if (!workerInfo) {
      // Создаем новый world для worker
      const worldId = `TEST_W${workerId}_${this.sessionId}_${randomUUID().slice(0, 8)}`
      
      workerInfo = {
        workerId,
        worldId,
        assignedTests: [testFile],
        isActive: true,
        createdAt: Date.now()
      }
      
      this.workers.set(workerId, workerInfo)
      
      console.log(`🌍 Created new world ${worldId} for worker ${workerId}`)
      console.log(`📝 Assigned test: ${testFile}`)
      
      // Инициализируем world в БД через Phoenix API
      await this.initializeWorldInDatabase(worldId, testFile)
      
    } else {
      // Добавляем тест к существующему worker
      if (!workerInfo.assignedTests.includes(testFile)) {
        workerInfo.assignedTests.push(testFile)
        console.log(`📝 Added test ${testFile} to existing world ${workerInfo.worldId}`)
      }
    }

    return workerInfo
  }

  /**
   * @description Инициализация мира в БД через Phoenix World Management API
   * @param worldId - ID мира
   * @param testFile - имя файла теста для определения типа seed данных
   */
  private async initializeWorldInDatabase(worldId: string, testFile: string): Promise<void> {
    const testConfig = this.testConfigs.get(testFile)
    if (!testConfig) {
      console.warn(`⚠️ No config found for test ${testFile}, using default seed`)
      return
    }

    // Обновляем worldId в конфигурации
    testConfig.worldId = worldId

    try {
      console.log(`🔧 Initializing world ${worldId} with seed type: ${testConfig.seedType}`)
      
      // Здесь будет вызов Phoenix World Management API
      // Пока что логируем для отладки
      console.log(`🌱 Seed data type: ${testConfig.seedType}`)
      console.log(`👤 Requires admin: ${testConfig.requiresAdmin}`)
      console.log(`⏱️ Timeout: ${testConfig.timeout}ms`)
      
      // TODO: Реальный вызов Phoenix API для создания мира и seeding
      // await phoenixWorldManager.createWorld(worldId, testConfig.seedType)
      
    } catch (error) {
      console.error(`❌ Failed to initialize world ${worldId}:`, error)
      throw error
    }
  }

  /**
   * @description Получить конфигурацию теста
   * @param testFile - имя файла теста
   * @returns Конфигурация теста
   */
  public getTestConfig(testFile: string): TestWorldConfig | undefined {
    return this.testConfigs.get(testFile)
  }

  /**
   * @description Получить world ID для теста
   * @param workerId - ID worker
   * @returns World ID или undefined
   */
  public getWorldIdForWorker(workerId: string): string | undefined {
    return this.workers.get(workerId)?.worldId
  }

  /**
   * @description Освободить world для worker
   * @param workerId - ID worker
   */
  public async releaseWorkerWorld(workerId: string): Promise<void> {
    const workerInfo = this.workers.get(workerId)
    if (!workerInfo) {
      return
    }

    console.log(`🧹 Releasing world ${workerInfo.worldId} for worker ${workerId}`)
    
    try {
      // TODO: Вызов Phoenix API для очистки world
      // await phoenixWorldManager.deleteWorld(workerInfo.worldId)
      
      this.workers.delete(workerId)
      console.log(`✅ World ${workerInfo.worldId} released successfully`)
      
    } catch (error) {
      console.error(`❌ Failed to release world ${workerInfo.worldId}:`, error)
    }
  }

  /**
   * @description Получить статистику по всем workers
   * @returns Статистика allocation
   */
  public getAllocationStats(): { totalWorkers: number, activeWorlds: number, totalTests: number } {
    const activeWorlds = Array.from(this.workers.values()).filter(w => w.isActive).length
    const totalTests = Array.from(this.workers.values())
      .reduce((acc, worker) => acc + worker.assignedTests.length, 0)

    return {
      totalWorkers: this.workers.size,
      activeWorlds,
      totalTests
    }
  }

  /**
   * @description Очистка всех миров (для teardown)
   */
  public async cleanupAllWorlds(): Promise<void> {
    console.log(`🧹 Cleaning up ${this.workers.size} test worlds...`)
    
    const cleanupPromises = Array.from(this.workers.keys()).map(workerId => 
      this.releaseWorkerWorld(workerId)
    )
    
    await Promise.all(cleanupPromises)
    console.log(`✅ All test worlds cleaned up`)
  }
}

/**
 * @description Helper функция для получения world ID в тестах
 * @param workerId - ID Playwright worker  
 * @param testFile - имя файла теста
 * @returns World ID для использования в тесте
 */
export async function getTestWorldId(workerId: string, testFile: string): Promise<string> {
  const allocator = TestWorldAllocator.getInstance()
  const workerInfo = await allocator.allocateWorldForWorker(workerId, testFile)
  return workerInfo.worldId
}

/**
 * @description Helper функция для получения конфигурации теста
 * @param testFile - имя файла теста
 * @returns Конфигурация теста
 */
export function getTestConfig(testFile: string): TestWorldConfig | undefined {
  const allocator = TestWorldAllocator.getInstance()
  return allocator.getTestConfig(testFile)
}

// END OF: tests/helpers/test-world-allocator.ts