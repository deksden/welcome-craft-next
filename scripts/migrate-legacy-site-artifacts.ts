#!/usr/bin/env tsx

/**
 * @file scripts/migrate-legacy-site-artifacts.ts
 * @description Migration tool to fix missing A_Site table entries for legacy site artifacts
 * @version 1.0.0
 * @date 2025-06-28
 * @updated Migration tool for UC-10 site artifacts that exist in main table but missing from A_Site
 */

import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq, and, sql } from 'drizzle-orm'
import postgres from 'postgres'
import { artifact, artifactSite } from '../lib/db/schema'

// Load environment
config({ path: '.env.local' })

interface LegacyArtifact {
  id: string
  createdAt: Date
  title: string
  userId: string
  content_site_definition?: any // Legacy field that might still exist in some records
}

const main = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined')
  }

  console.log('🔧 Starting legacy site artifacts migration...')
  
  const connection = postgres(process.env.POSTGRES_URL, { max: 1 })
  const db = drizzle(connection)

  try {
    // 1. Find site artifacts missing from A_Site table
    console.log('\n🔍 Step 1: Finding site artifacts missing from A_Site table')
    const missingSiteArtifacts = await db
      .select({
        id: artifact.id,
        createdAt: artifact.createdAt,
        title: artifact.title,
        userId: artifact.userId,
      })
      .from(artifact)
      .leftJoin(artifactSite, and(
        eq(artifact.id, artifactSite.artifactId),
        eq(artifact.createdAt, artifactSite.createdAt)
      ))
      .where(and(
        eq(artifact.kind, 'site'),
        sql`${artifactSite.artifactId} IS NULL`
      ))
    
    console.log(`Found ${missingSiteArtifacts.length} site artifacts missing from A_Site`)

    if (missingSiteArtifacts.length === 0) {
      console.log('✅ No migration needed - all site artifacts are properly migrated')
      return
    }

    // 2. Try to check if legacy content columns still exist (they shouldn't after migration 0006)
    console.log('\n🔍 Step 2: Checking for legacy content format')
    try {
      const legacyContentCheck = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Artifact' 
        AND column_name IN ('content_site_definition', 'content_text', 'content_url')
      `)
      
      if (legacyContentCheck.length > 0) {
        console.log('⚠️  Legacy content columns still exist in database')
        console.log(legacyContentCheck)
      } else {
        console.log('✅ Legacy content columns have been removed (as expected)')
      }
    } catch (error) {
      console.log('✅ Legacy content columns check failed (expected after UC-10 migration)')
    }

    // 3. Migrate each missing artifact
    console.log('\n🔧 Step 3: Migrating missing artifacts to A_Site table')
    let migratedCount = 0
    let errorCount = 0

    for (const missing of missingSiteArtifacts) {
      try {
        console.log(`\n📝 Migrating: ${missing.id} | ${missing.title}`)
        
        // Create default site definition for legacy artifacts
        const defaultSiteDefinition = {
          theme: 'default',
          blocks: [],
          reasoning: 'Migrated from legacy format - original content may be lost'
        }

        // Insert into A_Site table with default values
        await db.insert(artifactSite).values({
          artifactId: missing.id,
          createdAt: missing.createdAt,
          siteDefinition: defaultSiteDefinition,
          theme: 'default',
          reasoning: 'Legacy artifact migrated with empty content. Original site definition was lost during UC-10 migration.',
          blocksCount: 0,
          lastOptimized: new Date()
        })

        console.log(`✅ Successfully migrated ${missing.id}`)
        migratedCount++

      } catch (error) {
        console.error(`❌ Failed to migrate ${missing.id}:`, error)
        errorCount++
      }
    }

    // 4. Verification
    console.log('\n🔍 Step 4: Verification')
    const stillMissing = await db
      .select({
        id: artifact.id
      })
      .from(artifact)
      .leftJoin(artifactSite, and(
        eq(artifact.id, artifactSite.artifactId),
        eq(artifact.createdAt, artifactSite.createdAt)
      ))
      .where(and(
        eq(artifact.kind, 'site'),
        sql`${artifactSite.artifactId} IS NULL`
      ))

    console.log('\n📊 Migration Results:')
    console.log(`- Artifacts found: ${missingSiteArtifacts.length}`)
    console.log(`- Successfully migrated: ${migratedCount}`)
    console.log(`- Errors: ${errorCount}`)
    console.log(`- Still missing: ${stillMissing.length}`)

    if (stillMissing.length === 0) {
      console.log('\n🎉 SUCCESS: All site artifacts are now properly migrated to A_Site table!')
      console.log('The "Site artifact not found in A_Site table" warnings should no longer appear.')
    } else {
      console.log('\n⚠️  Some artifacts are still missing. Manual investigation may be needed.')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await connection.end()
    console.log('\n✅ Migration script completed')
  }
}

main().catch(console.error)

// END OF: scripts/migrate-legacy-site-artifacts.ts