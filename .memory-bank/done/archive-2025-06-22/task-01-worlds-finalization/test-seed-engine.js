// Быстрый тест seed-engine для проверки что world_id корректно добавляется

import { seedWorld, cleanupWorld } from '../../tests/helpers/seed-engine.ts'

async function testSeedEngine() {
  console.log('🧪 Testing seed-engine with world_id integration...')
  
  try {
    // Попробуем создать тестовый мир
    const worldId = 'CLEAN_USER_WORKSPACE'
    
    console.log(`📝 Creating world: ${worldId}`)
    const result = await seedWorld(worldId)
    
    console.log('✅ Seed result:', {
      worldId: result.worldId,
      totalTime: result.totalTime,
      users: result.operations.users.count,
      artifacts: result.operations.artifacts.count
    })
    
    console.log(`🧹 Cleaning up world: ${worldId}`)
    await cleanupWorld(worldId)
    
    console.log('✅ Test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testSeedEngine()