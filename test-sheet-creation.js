/**
 * Тестовый скрипт для проверки создания sheet артефакта
 */
import { artifactCreate } from './artifacts/tools/artifactCreate.js';

const mockSession = {
  user: { 
    id: 'test-user-123', 
    email: 'test@test.com', 
    type: 'regular' 
  },
  expires: new Date(Date.now() + 86400 * 1000).toISOString(),
};

async function testSheetCreation() {
  console.log('Testing sheet artifact creation...');
  
  const createTool = artifactCreate({ session: mockSession });
  
  try {
    const result = await createTool.execute({
      title: 'Преимущества Next.js',
      kind: 'sheet',
      prompt: 'Создай таблицу с преимуществами Next.js и их описанием'
    }, {
      toolCallId: 'test-tool-call',
      messages: []
    });
    
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSheetCreation();