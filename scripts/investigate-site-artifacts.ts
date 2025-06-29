#!/usr/bin/env tsx

/**
 * @file scripts/investigate-site-artifacts.ts
 * @description Database investigation script for UC-10 site artifacts migration issue
 * @version 1.0.0
 * @date 2025-06-28
 * @updated Initial creation to diagnose missing A_Site table entries
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

  console.log('🔍 Starting site artifacts investigation...')
  
  const connection = postgres(process.env.POSTGRES_URL, { max: 1 })
  const db = drizzle(connection)

  try {
    // 1. Find all site artifacts in main Artifact table
    console.log('\n📊 Step 1: All site artifacts in main Artifact table')
    const allSiteArtifacts = await db
      .select({
        id: artifact.id,
        createdAt: artifact.createdAt,
        title: artifact.title,
        userId: artifact.userId,
        deletedAt: artifact.deletedAt
      })
      .from(artifact)
      .where(eq(artifact.kind, 'site'))
      .orderBy(desc(artifact.createdAt))
      .limit(20)
    
    console.log(`Found ${allSiteArtifacts.length} site artifacts in main table:`)
    allSiteArtifacts.forEach((a, i) => {
      console.log(`  ${i+1}. ${a.id} | ${a.title} | ${a.createdAt.toISOString()} | deleted: ${!!a.deletedAt}`)
    })

    // 2. Find all entries in A_Site table
    console.log('\n📊 Step 2: All entries in A_Site table')
    const allASiteEntries = await db
      .select({
        artifactId: artifactSite.artifactId,
        createdAt: artifactSite.createdAt,
        theme: artifactSite.theme,
        blocksCount: artifactSite.blocksCount,
        hasReasoning: sql<boolean>`CASE WHEN ${artifactSite.reasoning} IS NOT NULL THEN true ELSE false END`
      })
      .from(artifactSite)
      .orderBy(desc(artifactSite.createdAt))
      .limit(20)
    
    console.log(`Found ${allASiteEntries.length} entries in A_Site table:`)
    allASiteEntries.forEach((a, i) => {
      console.log(`  ${i+1}. ${a.artifactId} | ${a.createdAt.toISOString()} | theme: ${a.theme} | blocks: ${a.blocksCount}`)
    })

    // 3. Find site artifacts missing from A_Site
    console.log('\n🔍 Step 3: Site artifacts missing from A_Site table')
    const missingSiteArtifacts = await db
      .select({
        id: artifact.id,
        createdAt: artifact.createdAt,
        title: artifact.title,
        userId: artifact.userId,
        deletedAt: artifact.deletedAt
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
      .orderBy(desc(artifact.createdAt))
    
    console.log(`Found ${missingSiteArtifacts.length} site artifacts missing from A_Site:`)
    missingSiteArtifacts.forEach((a, i) => {
      console.log(`  ${i+1}. ${a.id} | ${a.title} | ${a.createdAt.toISOString()} | deleted: ${!!a.deletedAt}`)
    })

    // 4. Check specifically for the reported artifact
    const reportedId = '3d3157b9-c780-4d9b-8855-01b46ecc276d'
    console.log(`\n🎯 Step 4: Checking reported artifact ${reportedId}`)
    
    const reportedArtifact = await db
      .select()
      .from(artifact)
      .where(eq(artifact.id, reportedId))
      .limit(1)
    
    if (reportedArtifact.length > 0) {
      const a = reportedArtifact[0]
      console.log(`✅ Found in main table: ${a.id} | ${a.title} | ${a.kind} | ${a.createdAt.toISOString()}`)
      
      const reportedInASite = await db
        .select()
        .from(artifactSite)
        .where(and(
          eq(artifactSite.artifactId, reportedId),
          eq(artifactSite.createdAt, a.createdAt)
        ))
        .limit(1)
      
      if (reportedInASite.length > 0) {
        console.log(`✅ Found in A_Site table`)
      } else {
        console.log(`❌ MISSING from A_Site table - this is the root cause!`)
      }
    } else {
      console.log(`❌ Not found in main Artifact table`)
    }

    // 5. Check timeline around UC-10 implementation
    console.log('\n📅 Step 5: Site artifacts around UC-10 implementation (June 20-21, 2025)')
    const ucImplementationStart = new Date('2025-06-20T00:00:00Z')
    const ucImplementationEnd = new Date('2025-06-22T00:00:00Z')
    
    const aroundUCImplementation = await db
      .select({
        id: artifact.id,
        createdAt: artifact.createdAt,
        title: artifact.title,
        hasASiteEntry: sql<boolean>`CASE WHEN ${artifactSite.artifactId} IS NOT NULL THEN true ELSE false END`
      })
      .from(artifact)
      .leftJoin(artifactSite, and(
        eq(artifact.id, artifactSite.artifactId),
        eq(artifact.createdAt, artifactSite.createdAt)
      ))
      .where(and(
        eq(artifact.kind, 'site'),
        gte(artifact.createdAt, ucImplementationStart),
        sql`${artifact.createdAt} < ${ucImplementationEnd}`
      ))
      .orderBy(artifact.createdAt)
    
    console.log(`Site artifacts created during UC-10 implementation period:`)
    aroundUCImplementation.forEach((a, i) => {
      const status = a.hasASiteEntry ? '✅' : '❌'
      console.log(`  ${i+1}. ${status} ${a.id} | ${a.title} | ${a.createdAt.toISOString()}`)
    })

    console.log('\n📊 Summary:')
    console.log(`- Total site artifacts: ${allSiteArtifacts.length}`)
    console.log(`- Entries in A_Site: ${allASiteEntries.length}`)  
    console.log(`- Missing from A_Site: ${missingSiteArtifacts.length}`)
    console.log(`- Around UC-10 period: ${aroundUCImplementation.length}`)

    if (missingSiteArtifacts.length > 0) {
      console.log('\n⚠️  ISSUE CONFIRMED: Some site artifacts exist in main table but are missing from A_Site')
      console.log('This explains why "Site artifact not found in A_Site table" warnings appear')
      console.log('These artifacts likely contain legacy content in old format that needs migration')
    }

  } catch (error) {
    console.error('❌ Investigation failed:', error)
  } finally {
    await connection.end()
    console.log('\n✅ Investigation completed')
  }
}

main().catch(console.error)

// END OF: scripts/investigate-site-artifacts.ts