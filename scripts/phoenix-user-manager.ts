/**
 * @file scripts/phoenix-user-manager.ts
 * @description PHOENIX PROJECT - CLI инструмент для управления пользователями
 * @version 1.0.0
 * @date 2025-06-30
 * @updated Enterprise Admin Interface - CLI для bootstrapping и CRUD операций с пользователями
 */

/** HISTORY:
 * v1.0.0 (2025-06-30): Enterprise Admin Interface - создан CLI для user management
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'

/**
 * Phoenix User Manager CLI
 * 
 * Критически важный инструмент для bootstrapping системы:
 * - Создание первого администратора
 * - CRUD операции с пользователями через CLI
 * - Подключение к любой БД через --db-url
 * - Безопасность: хеширование паролей
 * 
 * @feature Enterprise Admin Interface - User management CLI
 * @feature Security - password hashing, admin validation
 * @feature Database flexibility - custom DB URL support
 */

interface UserData {
  id: string
  name: string
  email: string
  type: 'user' | 'admin'
  createdAt: Date
  updatedAt: Date
}

class PhoenixUserManager {
  private db: ReturnType<typeof drizzle>
  private client: postgres.Sql

  constructor(databaseUrl: string) {
    this.client = postgres(databaseUrl)
    this.db = drizzle(this.client)
  }

  async close() {
    await this.client.end()
  }

  /**
   * Установить пользователя как администратора по email
   * Критически важная команда для bootstrapping
   */
  async setAdmin(email: string): Promise<void> {
    try {
      // Ищем пользователя по email
      const users = await this.db
        .select()
        .from(user)
        .where(eq(user.email, email))
        .limit(1)

      if (users.length === 0) {
        throw new Error(`User with email ${email} not found`)
      }

      const foundUser = users[0]
      
      if (foundUser.type === 'admin') {
        console.log(`✅ User ${email} is already an admin`)
        return
      }

      // Обновляем роль на admin
      await this.db
        .update(user)
        .set({ 
          type: 'admin',
          updatedAt: new Date()
        })
        .where(eq(user.id, foundUser.id))

      console.log(`✅ Successfully set ${email} as admin`)
      console.log(`   User ID: ${foundUser.id}`)
      console.log(`   Name: ${foundUser.name}`)
      
    } catch (error) {
      console.error('❌ Error setting admin:', error)
      throw error
    }
  }

  /**
   * Список всех пользователей
   */
  async listUsers(): Promise<void> {
    try {
      const users = await this.db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          type: user.type,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        })
        .from(user)

      if (users.length === 0) {
        console.log('📭 No users found in database')
        return
      }

      console.log(`\n👥 Found ${users.length} users:\n`)
      console.log(`${'ID'.padEnd(36)} | ${'Name'.padEnd(20)} | ${'Email'.padEnd(30)} | ${'Type'.padEnd(8)} | Created`)
      console.log('-'.repeat(110))

      users.forEach(user => {
        const typeIcon = user.type === 'admin' ? '🛡️' : '👤'
        const formattedDate = user.createdAt.toISOString().split('T')[0]
        const displayName = user.name || '(no name)'
        
        console.log(
          `${user.id.padEnd(36)} | ${displayName.padEnd(20)} | ${user.email.padEnd(30)} | ${`${typeIcon} ${user.type}`.padEnd(10)} | ${formattedDate}`
        )
      })

      console.log()
      
    } catch (error) {
      console.error('❌ Error listing users:', error)
      throw error
    }
  }

  /**
   * Добавить нового пользователя
   */
  async addUser(name: string, email: string, password: string, type: 'user' | 'admin' = 'user'): Promise<void> {
    try {
      // Проверяем уникальность email
      const existingUsers = await this.db
        .select()
        .from(user)
        .where(eq(user.email, email))
        .limit(1)

      if (existingUsers.length > 0) {
        throw new Error(`User with email ${email} already exists`)
      }

      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(password, 12)

      // Создаем пользователя
      const userId = randomUUID()
      await this.db.insert(user).values({
        id: userId,
        name,
        email,
        password: hashedPassword,
        type,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const typeIcon = type === 'admin' ? '🛡️' : '👤'
      console.log(`✅ Successfully created ${typeIcon} ${type}: ${name}`)
      console.log(`   ID: ${userId}`)
      console.log(`   Email: ${email}`)
      
    } catch (error) {
      console.error('❌ Error adding user:', error)
      throw error
    }
  }

  /**
   * Удалить пользователя по email
   */
  async deleteUser(email: string): Promise<void> {
    try {
      // Ищем пользователя
      const users = await this.db
        .select()
        .from(user)
        .where(eq(user.email, email))
        .limit(1)

      if (users.length === 0) {
        throw new Error(`User with email ${email} not found`)
      }

      const foundUser = users[0]

      // Удаляем пользователя
      await this.db
        .delete(user)
        .where(eq(user.id, foundUser.id))

      console.log(`✅ Successfully deleted user: ${foundUser.name}`)
      console.log(`   Email: ${email}`)
      console.log(`   Type: ${foundUser.type}`)
      
    } catch (error) {
      console.error('❌ Error deleting user:', error)
      throw error
    }
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log(`
🔥 Phoenix User Manager CLI

Usage:
  node phoenix-user-manager.js <command> [options]

Commands:
  set-admin <email>                    Set user as admin (CRITICAL for bootstrapping)
  list                                 List all users
  add <name> <email> <password> [type] Add new user (type: user|admin, default: user)
  delete <email>                       Delete user by email

Options:
  --db-url=<url>                       Database URL (required)

Examples:
  # Create first admin (critical for system setup)
  node phoenix-user-manager.js set-admin admin@company.com --db-url="postgresql://..."
  
  # List all users
  node phoenix-user-manager.js list --db-url="postgresql://..."
  
  # Add new admin
  node phoenix-user-manager.js add "John Admin" john@company.com password123 admin --db-url="postgresql://..."
  
  # Delete user
  node phoenix-user-manager.js delete john@company.com --db-url="postgresql://..."
`)
    process.exit(1)
  }

  // Парсим database URL
  const dbUrlArg = args.find(arg => arg.startsWith('--db-url='))
  if (!dbUrlArg) {
    console.error('❌ Error: --db-url parameter is required')
    console.error('   Example: --db-url="postgresql://user:password@host:port/database"')
    process.exit(1)
  }

  const databaseUrl = dbUrlArg.split('=')[1]
  if (!databaseUrl) {
    console.error('❌ Error: Invalid database URL format')
    process.exit(1)
  }

  // Убираем --db-url из аргументов
  const cleanArgs = args.filter(arg => !arg.startsWith('--db-url='))
  const command = cleanArgs[0]

  const userManager = new PhoenixUserManager(databaseUrl)

  try {
    switch (command) {
      case 'set-admin':
        if (cleanArgs.length < 2) {
          console.error('❌ Error: Email is required for set-admin command')
          console.error('   Usage: set-admin <email>')
          process.exit(1)
        }
        await userManager.setAdmin(cleanArgs[1])
        break

      case 'list':
        await userManager.listUsers()
        break

      case 'add': {
        if (cleanArgs.length < 4) {
          console.error('❌ Error: Name, email, and password are required for add command')
          console.error('   Usage: add <name> <email> <password> [type]')
          process.exit(1)
        }
        const [, name, email, password, type = 'user'] = cleanArgs
        if (!['user', 'admin'].includes(type)) {
          console.error('❌ Error: Type must be either "user" or "admin"')
          process.exit(1)
        }
        await userManager.addUser(name, email, password, type as 'user' | 'admin')
        break
      }

      case 'delete':
        if (cleanArgs.length < 2) {
          console.error('❌ Error: Email is required for delete command')
          console.error('   Usage: delete <email>')
          process.exit(1)
        }
        await userManager.deleteUser(cleanArgs[1])
        break

      default:
        console.error(`❌ Error: Unknown command "${command}"`)
        console.error('   Available commands: set-admin, list, add, delete')
        process.exit(1)
    }

  } catch (error) {
    console.error('\n💥 Command failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  } finally {
    await userManager.close()
  }
}

// Запуск CLI
if (require.main === module) {
  main().catch(console.error)
}

export { PhoenixUserManager }

// END OF: scripts/phoenix-user-manager.ts