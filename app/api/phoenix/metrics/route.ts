/**
 * @file app/api/phoenix/metrics/route.ts
 * @description PHOENIX PROJECT - System metrics API endpoint
 * @version 1.0.0
 * @date 2025-06-29
 * @updated PHOENIX PROJECT Step 5 - System metrics API
 */

import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { worldMeta } from '@/lib/db/schema'
import { eq, } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const environment = url.searchParams.get('environment')
    
    // Get all worlds or filtered by environment
    const worldsQuery = db.select().from(worldMeta)
    const worlds = environment 
      ? await worldsQuery.where(eq(worldMeta.environment, environment))
      : await worldsQuery
    
    // Calculate metrics
    const totalWorlds = worlds.length
    const activeWorlds = worlds.filter(w => w.isActive).length
    const templateWorlds = worlds.filter(w => w.isTemplate).length
    
    // Group by environment
    const byEnvironment = worlds.reduce((acc, world) => {
      acc[world.environment] = (acc[world.environment] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Group by category
    const byCategory = worlds.reduce((acc, world) => {
      const category = world.category || 'UNCATEGORIZED'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Calculate performance metrics (mock for now)
    const databaseStartTime = Date.now()
    await db.select().from(worldMeta).limit(1) // Simple DB ping
    const databaseResponseTime = Date.now() - databaseStartTime
    
    const metrics = {
      timestamp: new Date().toISOString(),
      environment,
      system: {
        totalWorlds,
        activeWorlds,
        templateWorlds,
        environments: Object.keys(byEnvironment)
      },
      worlds: {
        byEnvironment,
        byCategory
      },
      performance: {
        databaseResponseTime,
        apiResponseTime: Date.now() - Number.parseInt(url.searchParams.get('_start') || Date.now().toString())
      }
    }
    
    return NextResponse.json(metrics)
    
  } catch (error) {
    console.error('Metrics API error:', error)
    return NextResponse.json(
      { 
        error: 'Metrics failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// END OF: app/api/phoenix/metrics/route.ts