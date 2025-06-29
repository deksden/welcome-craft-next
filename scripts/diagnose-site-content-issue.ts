#!/usr/bin/env tsx

/**
 * @file scripts/diagnose-site-content-issue.ts
 * @description Comprehensive diagnosis of the site artifact content issue
 * @version 1.0.0
 * @date 2025-06-28
 * @updated Complete analysis of UC-10 migration impact on site artifacts
 */

import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq, and, sql, desc, gte } from 'drizzle-orm'
import postgres from 'postgres'
import { artifact, artifactSite } from '../lib/db/schema'

// Load environment
config({ path: '.env.local' })

const main = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined')
  }

  console.log('🔍 Starting comprehensive site content diagnosis...')
  
  const connection = postgres(process.env.POSTGRES_URL, { max: 1 })
  const db = drizzle(connection)

  try {
    // Check the specific reported artifact
    const reportedId = '3d3157b9-c780-4d9b-8855-01b46ecc276d'
    console.log(`\n🎯 REPORTED ISSUE: Artifact ${reportedId}`)
    
    const reportedArtifact = await db
      .select()
      .from(artifact)
      .where(eq(artifact.id, reportedId))
      .orderBy(desc(artifact.createdAt))
      .limit(5) // Check all versions
    
    console.log(`Found ${reportedArtifact.length} versions of reported artifact:`)
    reportedArtifact.forEach((a, i) => {
      console.log(`  ${i+1}. ${a.id} | ${a.title} | ${a.createdAt.toISOString()} | deleted: ${!!a.deletedAt}`)
    })

    // Check if any versions exist in A_Site
    for (const a of reportedArtifact) {
      const inASite = await db
        .select()
        .from(artifactSite)
        .where(and(
          eq(artifactSite.artifactId, a.id),
          eq(artifactSite.createdAt, a.createdAt)
        ))
        .limit(1)
      
      const status = inASite.length > 0 ? '✅ In A_Site' : '❌ Missing from A_Site'
      console.log(`    ${a.createdAt.toISOString()} - ${status}`)
    }

    // Check timeline around UC-10 implementation
    console.log('\n📅 UC-10 IMPLEMENTATION TIMELINE ANALYSIS')
    console.log('UC-10 was implemented around 2025-06-20 to 2025-06-21')
    
    const beforeUC10 = new Date('2025-06-20T00:00:00Z')
    const afterUC10 = new Date('2025-06-22T00:00:00Z')
    
    // Artifacts before UC-10
    const beforeArtifacts = await db
      .select({
        id: artifact.id,
        createdAt: artifact.createdAt,
        title: artifact.title,
      })
      .from(artifact)
      .leftJoin(artifactSite, and(
        eq(artifact.id, artifactSite.artifactId),
        eq(artifact.createdAt, artifactSite.createdAt)
      ))
      .where(and(
        eq(artifact.kind, 'site'),
        sql`${artifact.createdAt} < ${beforeUC10}`,
        sql`${artifactSite.artifactId} IS NULL`
      ))
      .orderBy(desc(artifact.createdAt))
      .limit(10)
    
    console.log(`\n📊 Site artifacts created BEFORE UC-10 (missing from A_Site): ${beforeArtifacts.length}`)
    beforeArtifacts.forEach((a, i) => {
      console.log(`  ${i+1}. ${a.id} | ${a.title} | ${a.createdAt.toISOString()}`)
    })

    // Artifacts after UC-10
    const afterArtifacts = await db
      .select({
        id: artifact.id,
        createdAt: artifact.createdAt,
        title: artifact.title,
      })
      .from(artifact)
      .leftJoin(artifactSite, and(
        eq(artifact.id, artifactSite.artifactId),
        eq(artifact.createdAt, artifactSite.createdAt)
      ))
      .where(and(
        eq(artifact.kind, 'site'),
        gte(artifact.createdAt, afterUC10),
        sql`${artifactSite.artifactId} IS NULL`
      ))
      .orderBy(desc(artifact.createdAt))
      .limit(10)
    
    console.log(`\n📊 Site artifacts created AFTER UC-10 (missing from A_Site): ${afterArtifacts.length}`)
    afterArtifacts.forEach((a, i) => {
      console.log(`  ${i+1}. ${a.id} | ${a.title} | ${a.createdAt.toISOString()}`)
    })

    // Check database schema to see if legacy columns exist
    console.log('\n🗄️  DATABASE SCHEMA ANALYSIS')
    try {
      const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'Artifact' 
        ORDER BY ordinal_position
      `)
      
      console.log('Artifact table columns:')
      columns.forEach((col: any) => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`)
      })
      
      const hasLegacyColumns = columns.some((col: any) => 
        ['content_site_definition', 'content_text', 'content_url'].includes(col.column_name)
      )
      
      if (hasLegacyColumns) {
        console.log('⚠️  LEGACY COLUMNS STILL EXIST - migration 0006 may not have run completely')
      } else {
        console.log('✅ Legacy content columns removed - UC-10 migration completed')
      }

    } catch (error) {
      console.error('❌ Failed to check schema:', error)
    }

    // Check migration history
    console.log('\n📋 MIGRATION HISTORY')
    try {
      const migrations = await db.execute(sql`
        SELECT * FROM __drizzle_migrations 
        ORDER BY id DESC
        LIMIT 10
      `)
      
      console.log('Recent migrations:')
      migrations.forEach((migration: any) => {
        console.log(`  - ${migration.id}: ${migration.hash} (${migration.created_at})`)
      })
    } catch (error) {
      console.log('Could not check migration table (may not exist)')
    }

    // Summary and recommendations
    console.log('\n📊 DIAGNOSIS SUMMARY')
    console.log('='.repeat(50))
    
    const totalMissing = beforeArtifacts.length + afterArtifacts.length
    
    if (totalMissing > 0) {
      console.log(`❌ CONFIRMED ISSUE: ${totalMissing} site artifacts are missing from A_Site table`)
      console.log('')
      console.log('ROOT CAUSE ANALYSIS:')
      console.log('1. Migration 0006 created A_Site table and removed legacy content columns')
      console.log('2. But it did NOT migrate existing site content to the new A_Site table')
      console.log('3. UC-10 system now expects all site artifacts to have entries in A_Site')
      console.log('4. Legacy artifacts created before UC-10 have no A_Site entries')
      console.log('')
      console.log('IMPACT:')
      console.log('- API calls to loadArtifact() for these sites return null')
      console.log('- "Site artifact not found in A_Site table" warnings appear')
      console.log('- Empty content is returned causing UI issues')
      console.log('')
      console.log('SOLUTION:')
      console.log('Run: npx tsx scripts/migrate-legacy-site-artifacts.ts')
      console.log('This will create default A_Site entries for missing artifacts')
    } else {
      console.log('✅ NO ISSUES FOUND: All site artifacts are properly migrated')
    }

  } catch (error) {
    console.error('❌ Diagnosis failed:', error)
  } finally {
    await connection.end()
    console.log('\n✅ Diagnosis completed')
  }
}

main().catch(console.error)

// END OF: scripts/diagnose-site-content-issue.ts