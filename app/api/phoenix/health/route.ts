/**
 * @file app/api/phoenix/health/route.ts
 * @description PHOENIX PROJECT - Health check API endpoint
 * @version 1.0.0
 * @date 2025-06-29
 * @updated PHOENIX PROJECT Step 5 - Health monitoring API
 */

import { type NextRequest, NextResponse } from 'next/server.js'
import { phoenixHealthMonitor } from '@/scripts/phoenix-health-check'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const environment = url.searchParams.get('environment') as 'LOCAL' | 'BETA' | 'PROD' || 'LOCAL'
    
    // Perform health check
    const healthResult = await phoenixHealthMonitor.performHealthCheck()
    
    return NextResponse.json(healthResult)
    
  } catch (error) {
    console.error('Health check API error:', error)
    return NextResponse.json(
      { 
        error: 'Health check failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        status: 'critical',
        timestamp: new Date().toISOString(),
        environment: 'LOCAL'
      },
      { status: 500 }
    )
  }
}

// END OF: app/api/phoenix/health/route.ts