import { Command } from 'commander';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const program = new Command();

program
  .name('phoenix-user-manager')
  .description('CLI to manage users in the Phoenix database');

program
  .command('set-admin <email>')
  .description('Set a user as admin')
  .requiredOption('--db-url <url>', 'Database URL')
  .action(async (email: string, options: { dbUrl: string }) => {
    const client = postgres(options.dbUrl);
    const db = drizzle(client, { schema });

    console.log(`Searching for user with email: ${email}`);
    const user = await db.query.user.findFirst({
      where: eq(schema.user.email, email),
    });

    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    console.log(`Setting user ${user.name} (${user.email}) as admin...`);
    await db.update(schema.user).set({ type: 'admin' }).where(eq(schema.user.id, user.id));
    console.log('User updated successfully');
    process.exit(0);
  });

program
  .command('list')
  .description('List all users')
  .requiredOption('--db-url <url>', 'Database URL')
  .action(async (options: { dbUrl: string }) => {
    const client = postgres(options.dbUrl);
    const db = drizzle(client, { schema });

    const users = await db.query.user.findMany();
    console.log('Users:');
    users.forEach(u => {
      console.log(`- ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Type: ${u.type}`);
    });
    process.exit(0);
  });

program
  .command('add <email> <name> <password> <type>')
  .description('Add a new user')
  .requiredOption('--db-url <url>', 'Database URL')
  .action(async (email: string, name: string, password: string, type: string, options: { dbUrl: string }) => {
    const client = postgres(options.dbUrl);
    const db = drizzle(client, { schema });

    // In a real application, you would hash the password before storing it.
    const newUser = await db.insert(schema.user).values({ email, name, password, type: type as any }).returning();
    console.log('User added successfully:', newUser[0]);
    process.exit(0);
  });

program
  .command('delete <id>')
  .description('Delete a user by ID')
  .requiredOption('--db-url <url>', 'Database URL')
  .action(async (id: string, options: { dbUrl: string }) => {
    const client = postgres(options.dbUrl);
    const db = drizzle(client, { schema });

    await db.delete(schema.user).where(eq(schema.user.id, id));
    console.log('User deleted successfully');
    process.exit(0);
  });

program.parse(process.argv);

export { program };
