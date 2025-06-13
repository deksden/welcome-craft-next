import { createUser, getUser } from './lib/db/queries.ts';

async function testDB() {
  try {
    console.log('Testing database connection...');
    
    // Проверим существующих пользователей
    const existingUsers = await getUser('test@example.com');
    console.log('Existing users with test@example.com:', existingUsers.length);
    
    if (existingUsers.length === 0) {
      console.log('Creating new user...');
      const result = await createUser('test@example.com', 'testpassword123');
      console.log('User created:', result);
    } else {
      console.log('User already exists:', existingUsers[0]);
    }
  } catch (error) {
    console.error('Database error:', error.message);
    console.error('Stack:', error.stack);
  }
  process.exit(0);
}

testDB();