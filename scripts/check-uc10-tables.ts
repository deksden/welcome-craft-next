#!/usr/bin/env npx tsx

/**
 * @file scripts/check-uc10-tables.ts
 * @description Script to check UC-10 specialized tables content
 * @version 1.0.0
 * @date 2025-07-02
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { artifact, artifactPerson, artifactAddress, artifactLink, artifactFaqItem, artifactText, artifactSite, worldMeta } from '../lib/db/schema.js'
import { eq } from 'drizzle-orm'

async function checkTables() {
  const client = postgres(process.env.POSTGRES_URL || process.env.DATABASE_URL || 'postgresql://testuser:testpassword@localhost:5433/testdb')
  const db = drizzle(client)
  
  try {
    console.log('=== Checking ENTERPRISE_ONBOARDING world ===')
    
    // Check if world exists
    const worlds = await db.select().from(worldMeta).where(eq(worldMeta.id, 'ENTERPRISE_ONBOARDING'))
    console.log('World metadata:', worlds.length > 0 ? 'EXISTS' : 'NOT FOUND')
    if (worlds.length > 0) {
      const world = worlds[0]
      console.log(`  - Name: ${world.name}`)
      console.log(`  - Users in metadata: ${(world.users as any[])?.length || 0}`)
      console.log(`  - Artifacts in metadata: ${(world.artifacts as any[])?.length || 0}`)
      console.log(`  - Chats in metadata: ${(world.chats as any[])?.length || 0}`)
    }
    
    // Check artifacts in main table
    const artifacts = await db.select().from(artifact).where(eq(artifact.world_id, 'ENTERPRISE_ONBOARDING'))
    console.log('\nArtifacts in main table:', artifacts.length)
    artifacts.forEach(a => console.log(`  - ${a.title} (${a.kind}) - ID: ${a.id}`))
    
    // Check specialized tables
    console.log('\n=== Checking UC-10 specialized tables ===')
    
    // A_Person table
    const persons = await db.select().from(artifactPerson)
    console.log('A_Person records:', persons.length)
    persons.forEach(p => console.log(`  - ${p.fullName} (${p.position || 'No position'}) - Artifact ID: ${p.artifactId}`))
    
    // A_Address table  
    const addresses = await db.select().from(artifactAddress)
    console.log('A_Address records:', addresses.length)
    addresses.forEach(a => console.log(`  - ${a.streetAddress}, ${a.city} - Artifact ID: ${a.artifactId}`))
    
    // A_Link table
    const links = await db.select().from(artifactLink)
    console.log('A_Link records:', links.length)
    links.forEach(l => console.log(`  - ${l.title}: ${l.url} - Artifact ID: ${l.artifactId}`))
    
    // A_FaqItem table
    const faqs = await db.select().from(artifactFaqItem)
    console.log('A_FaqItem records:', faqs.length)
    faqs.forEach(f => console.log(`  - Q: ${f.question} - Artifact ID: ${f.artifactId}`))
    
    // A_Text table
    const texts = await db.select().from(artifactText)
    console.log('A_Text records:', texts.length)
    texts.forEach(t => console.log(`  - Content length: ${t.content?.length || 0} chars - Artifact ID: ${t.artifactId}`))
    
    // A_Site table
    const sites = await db.select().from(artifactSite)
    console.log('A_Site records:', sites.length)
    sites.forEach(s => console.log(`  - Blocks count: ${s.blocksCount || 0} - Artifact ID: ${s.artifactId}`))
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.end()
  }
}

checkTables()