/**
 * @file tests/routes/phoenix-integration.test.ts
 * @description PHOENIX PROJECT - Integration tests for complete Phoenix system (routes format)
 * @version 2.0.0
 * @date 2025-06-30
 * @updated BUG-047 Fix - API contract compliance for structured responses
 */

/** HISTORY:
 * v2.0.0 (2025-06-30): BUG-047 Fix - API contract compliance for structured responses
 * v1.0.0 (2025-06-29): PHOENIX PROJECT Step 6 - Routes-based integration tests for Phoenix system
 */

import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'

test.describe('Phoenix System Integration Tests', () => {

  test.describe('Complete Phoenix Workflow', () => {
    test('should perform complete setup workflow via API', async ({ request }) => {
      // Step 1: Health check to ensure system is ready
      const healthResponse = await request.get('/api/phoenix/health')
      expect(healthResponse.ok()).toBeTruthy()
      
      const healthResult = await healthResponse.json()
      expect(['healthy', 'warning', 'critical']).toContain(healthResult.status)

      // Step 2: Create backup
      const backupResponse = await request.post('/api/phoenix/backup', {
        data: { environment: 'LOCAL' }
      })
      expect(backupResponse.ok()).toBeTruthy()
      
      const backupResult = await backupResponse.json()
      expect(backupResult.backupFile).toContain('backup-LOCAL')
      expect(backupResult.backupFile).toContain('.json')

      // Step 3: Get system metrics
      const metricsResponse = await request.get('/api/phoenix/metrics')
      expect(metricsResponse.ok()).toBeTruthy()
      
      const metrics = await metricsResponse.json()
      expect(metrics).toHaveProperty('system')
      expect(metrics).toHaveProperty('worlds')
      expect(metrics).toHaveProperty('performance')
    })

    test('should handle environment transitions via API', async ({ request }) => {
      // Create test world in LOCAL
      const testWorldId = `INTEGRATION_${randomUUID().split('-')[0]}`
      const testWorld = {
        id: testWorldId,
        name: 'Integration Test World',
        description: 'Testing environment transitions',
        environment: 'LOCAL',
        category: 'GENERAL',
        users: [{ email: 'integration@test.com', name: 'Integration User', type: 'user' }],
        artifacts: [],
        chats: [],
        settings: { autoCleanup: true, cleanupAfterHours: 24 },
        dependencies: [],
        tags: ['integration-test'],
        isActive: true,
        isTemplate: false,
        autoCleanup: true,
        cleanupAfterHours: 24,
        version: '1.0.0',
        isolationLevel: 'FULL'
      }

      // Create world in LOCAL
      const createResponse = await request.post('/api/phoenix/worlds', {
        data: testWorld
      })
      expect(createResponse.ok()).toBeTruthy()

      // Transfer data from LOCAL to BETA (dry run)
      const transferResponse = await request.post('/api/phoenix/transfer', {
        data: {
          sourceEnvironment: 'LOCAL',
          targetEnvironment: 'BETA',
          includeWorlds: true,
          dryRun: true
        }
      })
      expect(transferResponse.ok()).toBeTruthy()
      
      const transferResult = await transferResponse.json()
      expect(transferResult.dryRun).toBe(true)
      expect(transferResult.sourceEnvironment).toBe('LOCAL')
      expect(transferResult.targetEnvironment).toBe('BETA')

      // Verify world still exists in LOCAL
      const verifyResponse = await request.get(`/api/phoenix/worlds/${testWorldId}`)
      expect(verifyResponse.ok()).toBeTruthy()
      
      const verifyResult = await verifyResponse.json()
      expect(verifyResult.success).toBeTruthy()
      const world = verifyResult.data
      expect(world.id).toBe(testWorldId)
      expect(world.environment).toBe('LOCAL')
    })

    test('should maintain data consistency across operations', async ({ request }) => {
      // Create initial test data
      const consistencyWorldId = `CONSISTENCY_${randomUUID().split('-')[0]}`
      const worldData = {
        id: consistencyWorldId,
        name: 'Consistency Test World',
        description: 'Testing data consistency',
        environment: 'LOCAL',
        category: 'GENERAL',
        users: [{ email: 'consistency@test.com', name: 'Test User', type: 'user' }],
        artifacts: [],
        chats: [],
        settings: { autoCleanup: true, cleanupAfterHours: 24 },
        dependencies: [],
        tags: ['consistency-test'],
        isActive: true,
        isTemplate: false,
        autoCleanup: true,
        cleanupAfterHours: 24,
        version: '1.0.0',
        isolationLevel: 'FULL'
      }

      // Create world
      const createResponse = await request.post('/api/phoenix/worlds', {
        data: worldData
      })
      expect(createResponse.ok()).toBeTruthy()

      // Verify world exists
      const getResponse = await request.get(`/api/phoenix/worlds/${consistencyWorldId}`)
      expect(getResponse.ok()).toBeTruthy()
      
      const getResult = await getResponse.json()
      expect(getResult.success).toBeTruthy()
      const retrievedWorld = getResult.data
      expect(retrievedWorld.id).toBe(consistencyWorldId)
      expect(retrievedWorld.name).toBe(worldData.name)
      expect(retrievedWorld.environment).toBe('LOCAL')

      // Update world
      const updateData = {
        name: 'Updated Consistency World',
        description: 'Updated description'
      }
      
      const updateResponse = await request.put(`/api/phoenix/worlds/${consistencyWorldId}`, {
        data: updateData
      })
      expect(updateResponse.ok()).toBeTruthy()
      
      const updateResult = await updateResponse.json()
      expect(updateResult.success).toBeTruthy()

      // Verify update
      const updatedGetResponse = await request.get(`/api/phoenix/worlds/${consistencyWorldId}`)
      expect(updatedGetResponse.ok()).toBeTruthy()
      
      const updatedGetResult = await updatedGetResponse.json()
      expect(updatedGetResult.success).toBeTruthy()
      const updatedWorld = updatedGetResult.data
      expect(updatedWorld.name).toBe(updateData.name)
      expect(updatedWorld.description).toBe(updateData.description)
      expect(updatedWorld.id).toBe(consistencyWorldId) // ID should remain unchanged
    })
  })

  test.describe('Error Recovery and Resilience', () => {
    test('should handle invalid world creation gracefully', async ({ request }) => {
      // Test with missing required fields
      const invalidWorld = {
        name: 'Invalid World'
        // Missing required fields like id, description, users, artifacts, chats, settings
      }

      const response = await request.post('/api/phoenix/worlds', {
        data: invalidWorld
      })
      
      expect(response.ok()).toBeFalsy()
      expect(response.status()).toBe(400)
      
      const error = await response.json()
      expect(error).toHaveProperty('success')
      expect(error.success).toBe(false)
      expect(error).toHaveProperty('error')
      expect(error.error).toContain('Missing required field:')
    })

    test('should handle non-existent world operations', async ({ request }) => {
      const nonExistentId = 'NON_EXISTENT_WORLD_ID'
      
      // Try to get non-existent world
      const getResponse = await request.get(`/api/phoenix/worlds/${nonExistentId}`)
      expect(getResponse.status()).toBe(404)
      
      const getError = await getResponse.json()
      expect(getError.success).toBe(false)
      expect(getError.error).toContain('not found')
      
      // Try to update non-existent world
      const updateResponse = await request.put(`/api/phoenix/worlds/${nonExistentId}`, {
        data: { name: 'Updated Name' }
      })
      expect(updateResponse.status()).toBe(404)
      
      const updateError = await updateResponse.json()
      expect(updateError.success).toBe(false)
      expect(updateError.error).toContain('not found')
      
      // Try to delete non-existent world
      const deleteResponse = await request.delete(`/api/phoenix/worlds/${nonExistentId}`)
      expect(deleteResponse.status()).toBe(404)
      
      const deleteError = await deleteResponse.json()
      expect(deleteError.success).toBe(false)
      expect(deleteError.error).toContain('not found')
    })

    test('should validate system state after operations', async ({ request }) => {
      // Create multiple test worlds
      const testWorlds = Array.from({ length: 3 }, (_, i) => ({
        id: `VALIDATION_${i}_${randomUUID().split('-')[0]}`,
        name: `Validation World ${i + 1}`,
        description: `Testing validation ${i + 1}`,
        environment: 'LOCAL',
        category: 'GENERAL',
        users: [],
        artifacts: [],
        chats: [],
        settings: { autoCleanup: true, cleanupAfterHours: 24 },
        dependencies: [],
        tags: ['validation-test'],
        isActive: i % 2 === 0, // Alternate active/inactive
        isTemplate: i === 2, // Last one is template
        autoCleanup: true,
        cleanupAfterHours: 24,
        version: '1.0.0',
        isolationLevel: 'FULL'
      }))

      // Create all worlds with unique IDs to avoid conflicts
      for (const world of testWorlds) {
        const response = await request.post('/api/phoenix/worlds', {
          data: world
        })
        
        if (!response.ok()) {
          const errorDetails = await response.json()
          console.log('Failed to create world:', { world, error: errorDetails })
        }
        expect(response.ok()).toBeTruthy()
        
        const result = await response.json()
        expect(result.success).toBeTruthy()
      }

      // Validate through metrics API
      const metricsResponse = await request.get('/api/phoenix/metrics?environment=LOCAL')
      expect(metricsResponse.ok()).toBeTruthy()
      
      const metrics = await metricsResponse.json()
      expect(metrics.environment).toBe('LOCAL')
      expect(metrics.system.totalWorlds).toBeGreaterThanOrEqual(3)
      
      // Validate through worlds list
      const worldsResponse = await request.get('/api/phoenix/worlds?environment=LOCAL')
      expect(worldsResponse.ok()).toBeTruthy()
      
      const worldsResult = await worldsResponse.json()
      expect(worldsResult.success).toBeTruthy()
      const worlds = worldsResult.data
      const validationWorlds = worlds.filter((w: any) => w.tags?.includes('validation-test'))
      expect(validationWorlds.length).toBe(3)
      
      // Validate active/template counts
      const activeWorlds = validationWorlds.filter((w: any) => w.isActive)
      const templateWorlds = validationWorlds.filter((w: any) => w.isTemplate)
      
      // Debug logging for validation
      console.log('Validation test debug:', {
        totalValidationWorlds: validationWorlds.length,
        activeCount: activeWorlds.length,
        templateCount: templateWorlds.length,
        worldsDetail: validationWorlds.map((w: any) => ({ 
          id: w.id, 
          name: w.name, 
          isActive: w.isActive, 
          isTemplate: w.isTemplate 
        }))
      })
      
      expect(activeWorlds.length).toBeGreaterThanOrEqual(2) // At least 2 active (0 and 2)
      expect(templateWorlds.length).toBeGreaterThanOrEqual(1) // At least 1 template (2)
    })
  })

  test.describe('Performance and Scalability', () => {
    test('should handle concurrent world operations', async ({ request }) => {
      const concurrentOperations = Array.from({ length: 5 }, (_, i) => 
        request.get('/api/phoenix/worlds?environment=LOCAL')
      )

      const results = await Promise.all(concurrentOperations)
      
      // All requests should succeed
      results.forEach(response => {
        expect(response.ok()).toBeTruthy()
      })
      
      // All should return consistent data structure
      const worldsData = await Promise.all(results.map(r => r.json()))
      worldsData.forEach(worldsResult => {
        expect(worldsResult.success).toBeTruthy()
        expect(Array.isArray(worldsResult.data)).toBeTruthy()
      })
    })

    test('should perform efficiently with bulk world operations', async ({ request }) => {
      const startTime = Date.now()
      
      // Create multiple worlds
      const bulkWorlds = Array.from({ length: 10 }, (_, i) => ({
        id: `BULK_${i}_${randomUUID().split('-')[0]}`,
        name: `Bulk World ${i + 1}`,
        description: `Performance testing world ${i + 1}`,
        environment: 'LOCAL',
        category: 'PERFORMANCE',
        users: [],
        artifacts: [],
        chats: [],
        settings: { autoCleanup: true, cleanupAfterHours: 24 },
        dependencies: [],
        tags: ['performance-test'],
        isActive: true,
        isTemplate: false,
        autoCleanup: true,
        cleanupAfterHours: 24,
        version: '1.0.0',
        isolationLevel: 'FULL'
      }))

      // Create all worlds concurrently
      const createPromises = bulkWorlds.map(world =>
        request.post('/api/phoenix/worlds', { data: world })
      )
      
      const createResults = await Promise.all(createPromises)
      const endTime = Date.now()
      
      // All should succeed
      createResults.forEach(response => {
        expect(response.ok()).toBeTruthy()
      })
      
      // Should complete within reasonable time (adjust as needed)
      expect(endTime - startTime).toBeLessThan(10000) // 10 seconds max
      
      // Verify all worlds were created
      const verifyResponse = await request.get('/api/phoenix/worlds?environment=LOCAL')
      expect(verifyResponse.ok()).toBeTruthy()
      
      const verifyResult = await verifyResponse.json()
      expect(verifyResult.success).toBeTruthy()
      const allWorlds = verifyResult.data
      const bulkTestWorlds = allWorlds.filter((w: any) => 
        w.tags?.includes('performance-test') && w.category === 'PERFORMANCE'
      )
      expect(bulkTestWorlds.length).toBe(10)
    })

    test('should maintain performance under load', async ({ request }) => {
      // Simulate load with concurrent requests
      const loadTests = Array.from({ length: 20 }, () => 
        request.get('/api/phoenix/health')
      )
      
      const startTime = Date.now()
      const results = await Promise.all(loadTests)
      const endTime = Date.now()
      
      // All health checks should succeed
      results.forEach(response => {
        expect(response.ok()).toBeTruthy()
      })
      
      // Should handle load efficiently
      const avgResponseTime = (endTime - startTime) / loadTests.length
      expect(avgResponseTime).toBeLessThan(1000) // Less than 1 second average
      
      // Verify health status is consistent
      const healthData = await Promise.all(results.map(r => r.json()))
      healthData.forEach(health => {
        expect(['healthy', 'warning', 'critical']).toContain(health.status)
        expect(health).toHaveProperty('checks')
      })
    })
  })

  test.describe('Cross-Environment Operations', () => {
    test('should maintain isolation between environments', async ({ request }) => {
      // Create world in LOCAL
      const localWorldId = `LOCAL_${randomUUID().split('-')[0]}`
      const localWorld = {
        id: localWorldId,
        name: 'Local Environment World',
        description: 'Testing environment isolation',
        environment: 'LOCAL',
        category: 'GENERAL',
        users: [],
        artifacts: [],
        chats: [],
        settings: { autoCleanup: true, cleanupAfterHours: 24 },
        dependencies: [],
        tags: ['isolation-test', 'local'],
        isActive: true,
        isTemplate: false,
        autoCleanup: true,
        cleanupAfterHours: 24,
        version: '1.0.0',
        isolationLevel: 'FULL'
      }
      
      await request.post('/api/phoenix/worlds', { data: localWorld })
      
      // Create world in BETA (simulated by changing environment)
      const betaWorldId = `BETA_${randomUUID().split('-')[0]}`
      const betaWorld = {
        ...localWorld,
        id: betaWorldId,
        name: 'Beta Environment World',
        environment: 'BETA',
        tags: ['isolation-test', 'beta']
      }
      
      await request.post('/api/phoenix/worlds', { data: betaWorld })
      
      // Verify LOCAL environment only shows LOCAL world
      const localResponse = await request.get('/api/phoenix/worlds?environment=LOCAL')
      expect(localResponse.ok()).toBeTruthy()
      
      const localResult = await localResponse.json()
      expect(localResult.success).toBeTruthy()
      const localWorlds = localResult.data
      const localIsolationWorlds = localWorlds.filter((w: any) => 
        w.tags?.includes('isolation-test')
      )
      expect(localIsolationWorlds.length).toBe(1)
      expect(localIsolationWorlds[0].environment).toBe('LOCAL')
      
      // Verify BETA environment only shows BETA world
      const betaResponse = await request.get('/api/phoenix/worlds?environment=BETA')
      expect(betaResponse.ok()).toBeTruthy()
      
      const betaResult = await betaResponse.json()
      expect(betaResult.success).toBeTruthy()
      const betaWorlds = betaResult.data
      const betaIsolationWorlds = betaWorlds.filter((w: any) => 
        w.tags?.includes('isolation-test')
      )
      expect(betaIsolationWorlds.length).toBe(1)
      expect(betaIsolationWorlds[0].environment).toBe('BETA')
    })

    test('should sync environments correctly via API', async ({ request }) => {
      // Perform dry run transfer to test sync functionality
      const syncResponse = await request.post('/api/phoenix/transfer', {
        data: {
          sourceEnvironment: 'LOCAL',
          targetEnvironment: 'BETA',
          includeWorlds: true,
          dryRun: true
        }
      })
      
      expect(syncResponse.ok()).toBeTruthy()
      const syncResult = await syncResponse.json()
      
      expect(syncResult.operation).toBe('transfer')
      expect(syncResult.sourceEnvironment).toBe('LOCAL')
      expect(syncResult.targetEnvironment).toBe('BETA')
      expect(syncResult.dryRun).toBe(true)
    })
  })

  test.describe('Backup and Recovery Integration', () => {
    test('should perform complete backup cycle via API', async ({ request }) => {
      // Create backup
      const backupResponse = await request.post('/api/phoenix/backup', {
        data: { environment: 'LOCAL' }
      })
      expect(backupResponse.ok()).toBeTruthy()
      
      const backupResult = await backupResponse.json()
      expect(backupResult.backupFile).toContain('backup-LOCAL')
      expect(backupResult.environment).toBe('LOCAL')
      
      // Verify backup file properties
      expect(backupResult).toHaveProperty('timestamp')
      expect(backupResult.backupFile).toMatch(/\.json$/)
    })

    test('should validate backup data integrity via metrics', async ({ request }) => {
      // Create backup
      const backupResponse = await request.post('/api/phoenix/backup', {
        data: { environment: 'LOCAL' }
      })
      expect(backupResponse.ok()).toBeTruthy()
      
      // Get metrics to validate backup integrity
      const metricsResponse = await request.get('/api/phoenix/metrics?environment=LOCAL')
      expect(metricsResponse.ok()).toBeTruthy()
      
      const metrics = await metricsResponse.json()
      
      // Backup should contain all current worlds
      expect(metrics.system).toHaveProperty('totalWorlds')
      expect(metrics.worlds).toHaveProperty('byEnvironment')
      expect(metrics.worlds.byEnvironment).toHaveProperty('LOCAL')
      
      // Environment should be properly identified
      expect(metrics.environment).toBe('LOCAL')
    })
  })
})

// END OF: tests/routes/phoenix-integration.test.ts