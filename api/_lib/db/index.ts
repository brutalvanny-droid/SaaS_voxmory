import { Pool as NeonPool } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzlePg, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

/**
 * Connexion Postgres.
 *
 * Deux drivers selon l'environnement, pour un même schéma et les mêmes
 * requêtes :
 *
 *  - **Neon serverless** (production / Vercel) : protocole Postgres sur
 *    WebSocket. Pas de pool TCP à réchauffer, ce qui convient aux fonctions
 *    serverless qui démarrent à froid.
 *  - **node-postgres** (développement local) : TCP classique. Indispensable
 *    pour faire tourner un Postgres ordinaire en local, le driver Neon ne
 *    sachant pas dialoguer avec un serveur TCP standard.
 *
 * Le driver est choisi par `DATABASE_DRIVER=neon|pg`.
 */

export type Database = NodePgDatabase<typeof schema>;

interface Connection {
  db: Database;
  driver: 'neon' | 'pg';
  close: () => Promise<void>;
}

function isNeonUrl(url: string): boolean {
  return /(neon\.tech|neon\.build)/i.test(url);
}

function createConnection(): Connection {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL est manquante. Copiez .env.example vers .env et renseignez votre chaîne de connexion.',
    );
  }

  const explicit = process.env.DATABASE_DRIVER;
  let useNeon: boolean;
  if (explicit === 'neon') useNeon = true;
  else if (explicit === 'pg') useNeon = false;
  else useNeon = process.env.NODE_ENV === 'production' && isNeonUrl(connectionString);

  if (useNeon) {
    const pool = new NeonPool({ connectionString });
    return {
      db: drizzleNeon(pool, { schema }) as unknown as Database,
      driver: 'neon',
      close: () => pool.end(),
    };
  }

  const pool = new PgPool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  return {
    db: drizzlePg(pool, { schema }),
    driver: 'pg',
    close: () => pool.end(),
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __voxmoryDb: Connection | undefined;
}

// Sur Vercel, chaque invocation réutilise le conteneur chaud : garder la
// connexion sur globalThis évite d'en ouvrir une nouvelle à chaque requête.
const connection = globalThis.__voxmoryDb ?? createConnection();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__voxmoryDb = connection;
}

export const db = connection.db;
export const driver = connection.driver;
export const closeDb = connection.close;
export { schema };
export * from './schema.js';
