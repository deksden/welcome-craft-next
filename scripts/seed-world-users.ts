/**
 * @file scripts/seed-world-users.ts
 * @description Seeds real user accounts for test worlds in the database
 * @version 1.0.0
 * @date 2025-07-01
 * @updated Initial implementation for creating real user accounts in test worlds
 */

/** HISTORY:
 * v1.0.0 (2025-07-01): Initial implementation - creates real user accounts in database for proper User Management and artifact authorship
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { user } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// Create database connection for Node.js scripts
const client = postgres(process.env.POSTGRES_URL || 'postgresql://localuser:localpassword@localhost:5434/welcomecraft_local', {
  idle_timeout: 20,
  max_lifetime: 60 * 5,
})
const db = drizzle(client)

interface WorldUser {
  email: string
  name: string
  type: 'admin' | 'user'
  password?: string
}

interface WorldUsers {
  worldId: string
  users: WorldUser[]
}

/**
 * Standard test world users - these will be created as real DB records
 */
const WORLD_USERS: WorldUsers[] = [
  {
    worldId: 'CLEAN_USER_WORKSPACE',
    users: [
      {
        email: 'clean-user@test.com',
        name: 'Clean Test User',
        type: 'user',
        password: 'password123'
      }
    ]
  },
  {
    worldId: 'SITE_READY_FOR_PUBLICATION',
    users: [
      {
        email: 'publisher@test.com',
        name: 'Publisher User',
        type: 'user',
        password: 'password123'
      }
    ]
  },
  {
    worldId: 'CONTENT_LIBRARY_BASE',
    users: [
      {
        email: 'content-manager@test.com',
        name: 'Content Manager',
        type: 'user',
        password: 'password123'
      }
    ]
  },
  {
    worldId: 'DEMO_PREPARATION',
    users: [
      {
        email: 'demo@welcomecraft.com',
        name: 'Demo Presenter',
        type: 'user',
        password: 'password123'
      }
    ]
  },
  {
    worldId: 'ENTERPRISE_ONBOARDING',
    users: [
      {
        email: 'hr-admin@enterprise.com',
        name: 'HR Administrator',
        type: 'admin',
        password: 'admin123'
      },
      {
        email: 'new-hire@enterprise.com',
        name: 'New Employee',
        type: 'user',
        password: 'password123'
      },
      {
        email: 'alice.developer@enterprise.com',
        name: 'Alice Johnson',
        type: 'user',
        password: 'password123'
      },
      {
        email: 'bob.designer@enterprise.com',
        name: 'Bob Smith',
        type: 'user',
        password: 'password123'
      },
      {
        email: 'carol.manager@enterprise.com',
        name: 'Carol Wilson',
        type: 'user',
        password: 'password123'
      }
    ]
  }
]

/**
 * Seeds users for a specific world
 */
async function seedWorldUsers(worldId: string): Promise<{ created: number, updated: number, skipped: number }> {
  const worldConfig = WORLD_USERS.find(w => w.worldId === worldId)
  if (!worldConfig) {
    throw new Error(`No user configuration found for world: ${worldId}`)
  }

  console.log(`🌍 Seeding users for world: ${worldId}`)
  
  let created = 0
  const updated = 0
  let skipped = 0

  for (const userConfig of worldConfig.users) {
    try {
      // Check if user already exists
      const existingUser = await db
        .select()
        .from(user)
        .where(and(
          eq(user.email, userConfig.email),
          eq(user.world_id, worldId)
        ))
        .limit(1)

      if (existingUser.length > 0) {
        console.log(`  ⭐ User already exists: ${userConfig.email}`)
        skipped++
        continue
      }

      // Create new user
      const newUser = await db
        .insert(user)
        .values({
          email: userConfig.email,
          name: userConfig.name,
          type: userConfig.type,
          password: userConfig.password || 'password123',
          world_id: worldId
        })
        .returning()

      console.log(`  ✅ Created user: ${userConfig.email} (${userConfig.type})`)
      created++

    } catch (error) {
      console.error(`  ❌ Failed to create user ${userConfig.email}:`, error)
    }
  }

  return { created, updated, skipped }
}

/**
 * Seeds all world users
 */
export async function seedAllWorldUsers(): Promise<void> {
  console.log('🚀 PHOENIX: Seeding all world users...')
  
  let totalCreated = 0
  let totalUpdated = 0
  let totalSkipped = 0

  for (const worldConfig of WORLD_USERS) {
    const { created, updated, skipped } = await seedWorldUsers(worldConfig.worldId)
    totalCreated += created
    totalUpdated += updated
    totalSkipped += skipped
  }

  console.log(`\n✅ World users seeding completed:`)
  console.log(`  📝 Created: ${totalCreated}`)
  console.log(`  🔄 Updated: ${totalUpdated}`)
  console.log(`  ⭐ Skipped: ${totalSkipped}`)
  console.log(`  🌍 Total worlds: ${WORLD_USERS.length}`)
}

/**
 * Seeds users for ENTERPRISE_ONBOARDING world specifically
 */
export async function seedEnterpriseUsers(): Promise<void> {
  console.log('🏢 PHOENIX: Seeding ENTERPRISE_ONBOARDING users...')
  
  const { created, updated, skipped } = await seedWorldUsers('ENTERPRISE_ONBOARDING')
  
  console.log(`\n✅ ENTERPRISE_ONBOARDING users seeding completed:`)
  console.log(`  📝 Created: ${created}`)
  console.log(`  🔄 Updated: ${updated}`)
  console.log(`  ⭐ Skipped: ${skipped}`)
}

/**
 * Lists all users in a specific world
 */
export async function listWorldUsers(worldId: string): Promise<void> {
  console.log(`🔍 PHOENIX: Listing users in world: ${worldId}`)

  try {
    const worldUsers = await db
      .select()
      .from(user)
      .where(eq(user.world_id, worldId))

    console.log(`\n📋 Found ${worldUsers.length} users in world ${worldId}:`)
    console.log('─'.repeat(80))

    for (const userRecord of worldUsers) {
      const roleIcon = userRecord.type === 'admin' ? '👑' : '👤'
      console.log(`${roleIcon} ${userRecord.name} (${userRecord.email})`)
      console.log(`   Type: ${userRecord.type}`)
      console.log(`   Created: ${userRecord.createdAt.toISOString()}`)
      console.log()
    }

  } catch (error) {
    console.error('❌ Error listing world users:', error)
  }
}

/**
 * Removes all users from a specific world
 */
export async function cleanWorldUsers(worldId: string): Promise<void> {
  console.log(`🧹 PHOENIX: Cleaning users from world: ${worldId}`)

  try {
    const deletedUsers = await db
      .delete(user)
      .where(eq(user.world_id, worldId))
      .returning()

    console.log(`✅ Removed ${deletedUsers.length} users from world ${worldId}`)

  } catch (error) {
    console.error('❌ Error cleaning world users:', error)
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2]
  const worldId = process.argv[3]

  switch (command) {
    case 'seed-all':
      await seedAllWorldUsers()
      break
    case 'seed-enterprise':
      await seedEnterpriseUsers()
      break
    case 'seed-world':
      if (!worldId) {
        console.error('❌ Please provide a world ID: node seed-world-users.ts seed-world WORLD_ID')
        process.exit(1)
      }
      await seedWorldUsers(worldId)
      break
    case 'list':
      if (!worldId) {
        console.error('❌ Please provide a world ID: node seed-world-users.ts list WORLD_ID')
        process.exit(1)
      }
      await listWorldUsers(worldId)
      break
    case 'clean':
      if (!worldId) {
        console.error('❌ Please provide a world ID: node seed-world-users.ts clean WORLD_ID')
        process.exit(1)
      }
      await cleanWorldUsers(worldId)
      break
    default:
      console.log('🔧 Available commands:')
      console.log('  seed-all                     - Seed users for all worlds')
      console.log('  seed-enterprise              - Seed ENTERPRISE_ONBOARDING users')
      console.log('  seed-world <WORLD_ID>        - Seed users for specific world')
      console.log('  list <WORLD_ID>              - List users in specific world')
      console.log('  clean <WORLD_ID>             - Remove all users from specific world')
  }

  await client.end()
}

// END OF: scripts/seed-world-users.ts