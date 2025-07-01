/**
 * @file app/api/phoenix/backup/route.ts
 * @description PHOENIX PROJECT - Backup API endpoint
 * @version 1.0.0
 * @date 2025-06-29
 * @updated PHOENIX PROJECT Step 5 - Backup management API
 */

import { type NextRequest, NextResponse } from 'next/server.js'
import { phoenixDataTransfer } from '@/scripts/phoenix-data-transfer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { environment } = body
    
    // Validate environment
    if (!environment || !['LOCAL', 'BETA', 'PROD'].includes(environment)) {
      return NextResponse.json(
        { error: 'Invalid environment', message: 'Environment must be LOCAL, BETA, or PROD' },
        { status: 400 }
      )
    }
    
    // Create backup
    const backupFile = await phoenixDataTransfer.createBackup(environment)
    
    return NextResponse.json({
      success: true,
      backupFile,
      environment,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Backup API error:', error)
    return NextResponse.json(
      { 
        error: 'Backup failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// END OF: app/api/phoenix/backup/route.ts