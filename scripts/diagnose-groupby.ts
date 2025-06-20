/**
 * @file scripts/diagnose-groupby.ts
 * @description Прямая диагностика SQL запроса для groupByVersions
 * @version 1.0.0
 * @date 2025-06-20
 * @purpose Диагностика BUG-023 - проверить SQL запрос групировки версий артефактов
 */

import { getPagedArtifactsByUserId } from '../lib/db/queries'

async function diagnoseSQLGrouping() {
  console.log('🔍 Diagnosing SQL groupByVersions functionality...')
  
  try {
    // Test with groupByVersions=true (should show only latest versions)
    console.log('\n1️⃣ Testing groupByVersions=true (show only latest versions):')
    const resultTrue = await getPagedArtifactsByUserId({
      userId: 'test-user-debug',
      page: 1,
      pageSize: 10,
      groupByVersions: true
    })
    
    console.log(`   Total artifacts: ${resultTrue.data.length}`)
    console.log(`   Total count: ${resultTrue.totalCount}`)
    
    if (resultTrue.data.length > 0) {
      const ids = resultTrue.data.map(a => a.id)
      const uniqueIds = [...new Set(ids)]
      
      console.log(`   Unique IDs: ${uniqueIds.length}`)
      console.log(`   Sample IDs: ${ids.slice(0, 3).join(', ')}`)
      
      if (ids.length !== uniqueIds.length) {
        console.log('   🚨 PROBLEM: Duplicate IDs found despite groupByVersions=true')
        console.log(`   🔍 Duplicates: ${ids.filter((id, index) => ids.indexOf(id) !== index)}`)
      } else {
        console.log('   ✅ SUCCESS: No duplicate IDs found (grouping works)')
      }
      
      // Show version details
      console.log('   📊 Version details:')
      resultTrue.data.slice(0, 3).forEach((artifact, i) => {
        console.log(`     ${i + 1}. ID: ${artifact.id}, Title: ${artifact.title}, Created: ${artifact.createdAt.toISOString()}`)
      })
    } else {
      console.log('   ⚠️ No artifacts found for test user')
    }
    
    // Test with groupByVersions=false (should show all versions)
    console.log('\n2️⃣ Testing groupByVersions=false (show all versions):')
    const resultFalse = await getPagedArtifactsByUserId({
      userId: 'test-user-debug',
      page: 1,
      pageSize: 10,
      groupByVersions: false
    })
    
    console.log(`   Total artifacts: ${resultFalse.data.length}`)
    console.log(`   Total count: ${resultFalse.totalCount}`)
    
    if (resultFalse.data.length > 0) {
      const ids = resultFalse.data.map(a => a.id)
      const uniqueIds = [...new Set(ids)]
      
      console.log(`   Unique IDs: ${uniqueIds.length}`)
      console.log(`   Sample IDs: ${ids.slice(0, 3).join(', ')}`)
      console.log('   📊 Expected: Should show more total artifacts than unique IDs (all versions)')
      
      // Show version details
      console.log('   📊 Version details:')
      resultFalse.data.slice(0, 5).forEach((artifact, i) => {
        console.log(`     ${i + 1}. ID: ${artifact.id}, Title: ${artifact.title}, Created: ${artifact.createdAt.toISOString()}`)
      })
    } else {
      console.log('   ⚠️ No artifacts found for test user')
    }
    
    console.log('\n📋 Summary:')
    console.log(`   - groupByVersions=true: ${resultTrue.data.length} artifacts, ${resultTrue.totalCount} total`)
    console.log(`   - groupByVersions=false: ${resultFalse.data.length} artifacts, ${resultFalse.totalCount} total`)
    console.log(`   - Expected: true should have ≤ false (latest versions only vs all versions)`)
    
    if (resultTrue.data.length > resultFalse.data.length) {
      console.log('   🚨 UNEXPECTED: true result has more artifacts than false result!')
    } else if (resultTrue.data.length === resultFalse.data.length) {
      console.log('   ⚠️ NOTICE: Same number of artifacts - either no versioning or user has no artifacts')
    } else {
      console.log('   ✅ EXPECTED: true result has fewer artifacts than false (grouping works)')
    }
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error)
  }
}

diagnoseSQLGrouping()

// END OF: scripts/diagnose-groupby.ts