/**
 * @file tests/unit/phoenix-health-monitor.test.ts
 * @description PHOENIX PROJECT - Unit tests for health monitoring system
 * @version 1.0.0
 * @date 2025-06-29
 * @updated PHOENIX PROJECT Step 6 - Comprehensive testing for health check system
 */

/** HISTORY:
 * v1.0.0 (2025-06-29): PHOENIX PROJECT Step 6 - Unit tests for PhoenixHealthMonitor
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    execute: vi.fn(),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([{ count: 5 }]))
        }))
      }))
    }))
  }
}))

vi.mock('@/lib/db/schema', () => ({
  worldMeta: {},
  artifact: {},
  user: {},
  chat: {}
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  count: vi.fn(),
  sql: vi.fn()
}))

vi.mock('fs/promises', () => ({
  default: {
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined)
  },
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined)
}))

describe('PhoenixHealthMonitor', () => {
  let monitor: any
  let consoleSpy: any

  beforeEach(async () => {
    const { PhoenixHealthMonitor } = await import('@/scripts/phoenix-health-check')
    monitor = new PhoenixHealthMonitor('LOCAL')
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('performHealthCheck', () => {
    it('should perform complete health check successfully', async () => {
      const result = await monitor.performHealthCheck()

      expect(result).toBeDefined()
      expect(result.environment).toBe('LOCAL')
      expect(result.status).toMatch(/healthy|warning|critical/)
      expect(result.checks).toHaveProperty('database')
      expect(result.checks).toHaveProperty('worlds')
      expect(result.checks).toHaveProperty('api')
      expect(result.checks).toHaveProperty('performance')
      expect(result.checks).toHaveProperty('storage')
    })

    it('should calculate correct health score', async () => {
      const result = await monitor.performHealthCheck()

      expect(result.summary.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.summary.overallScore).toBeLessThanOrEqual(100)
      expect(result.summary.totalChecks).toBe(5)
      expect(result.summary.passedChecks + result.summary.warnings + result.summary.criticalIssues)
        .toBe(result.summary.totalChecks)
    })

    it('should set critical status when there are failed checks', async () => {
      // Mock a failed database check
      const mockDb = await import('@/lib/db')
      vi.mocked(mockDb.db.execute).mockRejectedValueOnce(new Error('Database connection failed'))

      const result = await monitor.performHealthCheck()

      // Should still complete but with critical status due to database failure
      expect(result.status).toBe('critical')
      expect(result.summary.criticalIssues).toBeGreaterThan(0)
    })
  })

  describe('printHealthSummary', () => {
    it('should print formatted health summary', async () => {
      const result = await monitor.performHealthCheck()
      
      monitor.printHealthSummary(result)

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('PHOENIX HEALTH CHECK SUMMARY'))
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(`Environment: ${result.environment}`))
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(`Health Score: ${result.summary.overallScore}%`))
    })

    it('should show recommendations when available', async () => {
      const result = await monitor.performHealthCheck()
      
      // Add a mock recommendation
      result.checks.database.recommendations = ['Test recommendation']
      
      monitor.printHealthSummary(result)

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('💡 Test recommendation'))
    })
  })

  describe('saveHealthReport', () => {
    it('should save health report to file', async () => {
      const result = await monitor.performHealthCheck()
      const reportPath = await monitor.saveHealthReport(result)

      expect(reportPath).toContain('health-check-LOCAL')
      expect(reportPath).toContain('.json')
    })
  })
})

describe('runHealthCheck', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should run health check for specified environment', async () => {
    const { runHealthCheck } = await import('@/scripts/phoenix-health-check')
    const result = await runHealthCheck('BETA')
    
    expect(result.environment).toBe('BETA')
    expect(result.checks).toBeDefined()
  })

  it('should default to LOCAL environment', async () => {
    const { runHealthCheck } = await import('@/scripts/phoenix-health-check')
    const result = await runHealthCheck()
    
    expect(result.environment).toBe('LOCAL')
  })
})

describe('runContinuousMonitoring', () => {
  it('should start continuous monitoring', async () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval').mockImplementation(() => 123 as any)
    
    // Start monitoring (doesn't await as it runs indefinitely)
    const { runContinuousMonitoring } = await import('@/scripts/phoenix-health-check')
    runContinuousMonitoring('PROD', 1)
    
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000) // 1 minute
    
    setIntervalSpy.mockRestore()
  })
})

describe('HealthCheck Interface Compliance', () => {
  it('should return properly structured HealthCheck objects', async () => {
    const { PhoenixHealthMonitor } = await import('@/scripts/phoenix-health-check')
    const monitor = new PhoenixHealthMonitor('LOCAL')
    const result = await monitor.performHealthCheck()

    Object.values(result.checks).forEach(check => {
      expect(check).toHaveProperty('name')
      expect(check).toHaveProperty('status')
      expect(check).toHaveProperty('message')
      expect(check.status).toMatch(/pass|warning|fail/)
      expect(typeof check.name).toBe('string')
      expect(typeof check.message).toBe('string')
      
      if (check.executionTime) {
        expect(typeof check.executionTime).toBe('number')
        expect(check.executionTime).toBeGreaterThan(0)
      }
    })
  })

  it('should validate HealthCheckResult structure', async () => {
    const { PhoenixHealthMonitor } = await import('@/scripts/phoenix-health-check')
    const monitor = new PhoenixHealthMonitor('PROD')
    const result = await monitor.performHealthCheck()

    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('timestamp')
    expect(result).toHaveProperty('environment')
    expect(result).toHaveProperty('checks')
    expect(result).toHaveProperty('summary')
    
    expect(result.status).toMatch(/healthy|warning|critical/)
    expect(result.environment).toBe('PROD')
    expect(typeof result.timestamp).toBe('string')
    
    expect(result.summary).toHaveProperty('totalChecks')
    expect(result.summary).toHaveProperty('passedChecks')
    expect(result.summary).toHaveProperty('warnings')
    expect(result.summary).toHaveProperty('criticalIssues')
    expect(result.summary).toHaveProperty('overallScore')
  })
})

// END OF: tests/unit/phoenix-health-monitor.test.ts