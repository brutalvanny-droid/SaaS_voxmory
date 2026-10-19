import { sql } from 'drizzle-orm';
import { db } from './db/index.js';

/**
 * Limitation de débit adossée à Postgres.
 *
 * Un compteur en mémoire ne fonctionnerait pas sur Vercel : chaque fonction
 * serverless s'exécute dans une instance isolée, un compteur local serait
 * remis à zéro à chaque démarrage à froid. La base est le seul état partagé.
 */

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Secondes avant réinitialisation de la fenêtre. */
  retryAfter: number;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const windowSeconds = Math.max(1, Math.round(windowMs / 1000));

  try {
    const rows = await db.execute<{ count: number; window_start: Date }>(sql`
      INSERT INTO rate_limit_counters (key, count, window_start)
      VALUES (${key}, 1, now())
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN rate_limit_counters.window_start < now() - (${windowSeconds} || ' seconds')::interval
          THEN 1
          ELSE rate_limit_counters.count + 1
        END,
        window_start = CASE
          WHEN rate_limit_counters.window_start < now() - (${windowSeconds} || ' seconds')::interval
          THEN now()
          ELSE rate_limit_counters.window_start
        END
      RETURNING count, window_start
    `);

    const row = Array.isArray(rows) ? rows[0] : (rows as { rows?: unknown[] })?.rows?.[0];
    const count = Number(row?.count ?? 1);
    const windowStart = row?.window_start ? new Date(row.window_start).getTime() : Date.now();
    const resetAt = windowStart + windowMs;
    const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));

    return {
      ok: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfter,
    };
  } catch (err) {
    // Si la limitation échoue, on journalise sans bloquer le service.
    console.error('[RateLimit] Erreur, requête autorisée par défaut :', err);
    return { ok: true, remaining: limit, retryAfter: 0 };
  }
}

/** Nettoie les compteurs expirés — appelé de façon opportuniste. */
export async function purgeExpiredCounters(): Promise<void> {
  try {
    await db.execute(sql`
      DELETE FROM rate_limit_counters
      WHERE window_start < now() - interval '1 hour'
    `);
  } catch {
    /* silencieux : tâche de maintenance */
  }
}

let lastPurge = 0;
export function maybePurge(): void {
  const now = Date.now();
  if (now - lastPurge > 10 * 60 * 1000) {
    lastPurge = now;
    void purgeExpiredCounters();
  }
}
