/**
 * @file lib/db/index.ts
 * @description Централизованная инициализация и экспорт инстанса Drizzle.
 * @author Claude Code
 * @created 13.06.2025
 * @purpose ПОСТОЯННЫЙ - для изоляции инстанса DB и упрощения мокирования.
 * @version 0.1.0
 */

/** HISTORY:
 * v0.1.0 (2025-06-13): Инициализация 'db' вынесена из queries.ts.
 */

import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!, {
  idle_timeout: 20,
  max_lifetime: 60 * 5,
})

export const db = drizzle(client)

// END OF: lib/db/index.ts
