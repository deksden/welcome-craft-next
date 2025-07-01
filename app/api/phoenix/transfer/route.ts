/**
 * @file app/api/phoenix/transfer/route.ts
 * @description PHOENIX PROJECT - Data transfer API endpoint
 * @version 1.0.0
 * @date 2025-06-29
 * @updated PHOENIX PROJECT Step 5 - Data transfer management API
 */

import { type NextRequest, NextResponse } from 'next/server.js'
import { phoenixDataTransfer } from '@/scripts/phoenix-data-transfer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      sourceEnvironment, 
      targetEnvironment, 
      includeWorlds = true,
      includeArtifacts = false,
      includeUsers = false,
      includeChats = false,
      dryRun = false,
      backupFirst = true
    } = body
    
    // Validate required parameters
    if (!sourceEnvironment || !targetEnvironment) {
      return NextResponse.json(
        { error: 'Missing parameters', message: 'sourceEnvironment and targetEnvironment are required' },
        { status: 400 }
      )
    }
    
    // Validate environments
    const validEnvironments = ['LOCAL', 'BETA', 'PROD']
    if (!validEnvironments.includes(sourceEnvironment) || !validEnvironments.includes(targetEnvironment)) {
      return NextResponse.json(
        { error: 'Invalid environment', message: 'Environment must be LOCAL, BETA, or PROD' },
        { status: 400 }
      )
    }
    
    const transferOptions = {
      sourceEnvironment,
      targetEnvironment,
      includeWorlds,
      includeArtifacts,
      includeUsers,
      includeChats,
      dryRun,
      backupFirst
    }
    
    // Perform transfer
    await phoenixDataTransfer.transferData(transferOptions)
    
    return NextResponse.json({
      success: true,
      operation: 'transfer',
      sourceEnvironment,
      targetEnvironment,
      options: {
        includeWorlds,
        includeArtifacts,
        includeUsers,
        includeChats
      },
      dryRun,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Transfer API error:', error)
    return NextResponse.json(
      { 
        error: 'Transfer failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// END OF: app/api/phoenix/transfer/route.ts