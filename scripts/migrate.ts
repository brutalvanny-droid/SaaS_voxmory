/**
 * Applique les migrations générées par `npm run db:generate`.
 *
 * Usage : npm run db:migrate
 */

import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db, driver, closeDb } from '../api/_lib/db/index.js';

console.log(`→ Application des migrations (driver : ${driver})…`);

if (driver === 'pg') {
  const { migrate } = await import('drizzle-orm/node-postgres/migrator');
  await migrate(db, { migrationsFolder: './drizzle' });
} else {
  const { migrate } = await import('drizzle-orm/neon-serverless/migrator');
  await migrate(db, { migrationsFolder: './drizzle' });
}

await db.execute(sql`SELECT 1`);
console.log('✓ Migrations appliquées.');
await closeDb();
process.exit(0);
