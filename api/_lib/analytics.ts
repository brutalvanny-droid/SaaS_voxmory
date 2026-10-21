import { eq, sql, and, gte, desc, count, countDistinct } from 'drizzle-orm';
import { db } from './db/index.js';
import { visitors, pageViews } from './db/schema.js';

/**
 * Mesure d'audience.
 *
 * Deux tables seulement, mais elles répondent aux questions qu'un studio
 * se pose vraiment : combien de personnes sont passées, lesquelles sont
 * revenues, par où elles sont arrivées, et quelles pages les retiennent.
 *
 * Principe : on mesure des personnes, pas des coups de rafraîchissement.
 * Une même personne qui recharge trois fois la page compte pour une vue
 * utile, pas pour trois visiteurs.
 */

/** Au-delà de ce silence, on considère que c'est une nouvelle visite. */
const SEUIL_NOUVELLE_VISITE_MS = 30 * 60 * 1000;

/* ------------------------------------------------------------------ */
/*  Enregistrement                                                      */
/* ------------------------------------------------------------------ */

export interface TrackInput {
  anonymousId: string;
  path: string;
  referrer?: string;
  device?: string;
  country?: string | null;
}

/** Réduit une adresse d'origine à son domaine nu. */
export function domaineOrigine(referrer: string | undefined, hoteActuel?: string): string {
  if (!referrer) return 'direct';
  try {
    const u = new URL(referrer);
    const hote = u.hostname.replace(/^www\./, '');
    if (!hote) return 'direct';
    // Venir d'une de nos propres pages n'est pas une « source » : la
    // personne est déjà là. La compter comme telle noierait le vrai trafic
    // entrant sous du trafic interne.
    if (hoteActuel && hote === hoteActuel.replace(/^www\./, '')) return 'direct';
    return hote;
  } catch {
    return 'direct';
  }
}

/** Classe l'appareil d'après l'agent utilisateur. */
export function typeAppareil(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua)) return 'tablet';
  if (/mobile|android|iphone|ipod|windows phone/.test(ua)) return 'mobile';
  return 'desktop';
}

/**
 * Enregistre une page vue.
 *
 * Ne doit jamais faire échouer la navigation : si la mesure tombe en
 * panne, la page continue de s'afficher. C'est pourquoi l'appelant
 * enveloppe cet appel dans un `catch`.
 */
export async function enregistrerVue(input: TrackInput): Promise<void> {
  const maintenant = new Date();

  const [existant] = await db
    .select()
    .from(visitors)
    .where(eq(visitors.anonymousId, input.anonymousId))
    .limit(1);

  if (!existant) {
    await db.insert(visitors).values({
      anonymousId: input.anonymousId,
      firstSeenAt: maintenant,
      lastSeenAt: maintenant,
      visits: 1,
      device: input.device ?? 'desktop',
      country: input.country ?? null,
      referrerDomain: input.referrer ?? 'direct',
    });
  } else {
    const ecoule = maintenant.getTime() - new Date(existant.lastSeenAt).getTime();
    await db
      .update(visitors)
      .set({
        lastSeenAt: maintenant,
        // Une nouvelle visite seulement après une vraie pause : sinon
        // chaque rechargement gonflerait le compteur.
        visits: ecoule > SEUIL_NOUVELLE_VISITE_MS ? sql`${visitors.visits} + 1` : existant.visits,
        device: input.device ?? existant.device,
        country: input.country ?? existant.country,
      })
      .where(eq(visitors.anonymousId, input.anonymousId));
  }

  // Temps écoulé depuis la vue précédente du même visiteur.
  const [derniere] = await db
    .select({ createdAt: pageViews.createdAt })
    .from(pageViews)
    .where(eq(pageViews.anonymousId, input.anonymousId))
    .orderBy(desc(pageViews.createdAt))
    .limit(1);

  const ecouleSecondes = derniere
    ? Math.round((maintenant.getTime() - new Date(derniere.createdAt).getTime()) / 1000)
    : null;

  await db.insert(pageViews).values({
    id: crypto.randomUUID(),
    anonymousId: input.anonymousId,
    path: input.path.slice(0, 300),
    referrerDomain: input.referrer ?? 'direct',
    device: input.device ?? 'desktop',
    country: input.country ?? null,
    secondsSinceLastView: ecouleSecondes !== null && ecouleSecondes < 86_400 ? ecouleSecondes : null,
    createdAt: maintenant,
  });
}

/* ------------------------------------------------------------------ */
/*  Lecture                                                             */
/* ------------------------------------------------------------------ */

function depuis(jours: number): Date {
  return new Date(Date.now() - jours * 24 * 60 * 60 * 1000);
}

export interface ResumeAudience {
  visiteurs: number;
  pagesVues: number;
  nouveaux: number;
  revenus: number;
  pagesParVisite: number;
}

/** Chiffres d'audience sur une période glissante. */
export async function resumeAudience(jours: number): Promise<ResumeAudience> {
  const seuil = depuis(jours);

  const [vues] = await db
    .select({
      total: count(),
      visiteurs: countDistinct(pageViews.anonymousId),
    })
    .from(pageViews)
    .where(gte(pageViews.createdAt, seuil));

  const [profils] = await db
    .select({ total: count() })
    .from(visitors)
    .where(gte(visitors.firstSeenAt, seuil));

  const [actifs] = await db
    .select({ total: countDistinct(pageViews.anonymousId) })
    .from(pageViews)
    .where(gte(pageViews.createdAt, seuil));

  const visiteurs = Number(actifs?.total ?? 0);
  const pagesVues = Number(vues?.total ?? 0);
  const nouveaux = Number(profils?.total ?? 0);

  return {
    visiteurs,
    pagesVues,
    nouveaux,
    revenus: Math.max(0, visiteurs - nouveaux),
    pagesParVisite: visiteurs ? Math.round((pagesVues / visiteurs) * 10) / 10 : 0,
  };
}

export interface PointJournalier {
  date: string;
  visiteurs: number;
  pagesVues: number;
}

/** Série quotidienne, pour la courbe du tableau de bord. */
export async function serieQuotidienne(jours: number): Promise<PointJournalier[]> {
  const seuil = depuis(jours);

  const rows = await db
    .select({
      jour: sql<string>`to_char(date_trunc('day', ${pageViews.createdAt}), 'YYYY-MM-DD')`,
      visiteurs: countDistinct(pageViews.anonymousId),
      pagesVues: count(),
    })
    .from(pageViews)
    .where(gte(pageViews.createdAt, seuil))
    .groupBy(sql`date_trunc('day', ${pageViews.createdAt})`)
    .orderBy(sql`date_trunc('day', ${pageViews.createdAt})`);

  // Tous les jours doivent figurer, y compris ceux sans visite : une
  // courbe avec des trous laisse croire à une panne.
  const parJour = new Map(rows.map((r) => [r.jour, r]));
  const out: PointJournalier[] = [];

  for (let i = jours - 1; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const cle = d.toISOString().slice(0, 10);
    const r = parJour.get(cle);
    out.push({
      date: cle,
      visiteurs: Number(r?.visiteurs ?? 0),
      pagesVues: Number(r?.pagesVues ?? 0),
    });
  }
  return out;
}

export interface Repartition {
  cle: string;
  total: number;
}

async function repartir(colonne: 'path' | 'referrerDomain' | 'device' | 'country', jours: number, limite: number): Promise<Repartition[]> {
  const seuil = depuis(jours);
  const cible =
    colonne === 'path'
      ? pageViews.path
      : colonne === 'referrerDomain'
        ? pageViews.referrerDomain
        : colonne === 'device'
          ? pageViews.device
          : pageViews.country;

  const rows = await db
    .select({ cle: cible, total: count() })
    .from(pageViews)
    .where(and(gte(pageViews.createdAt, seuil), sql`${cible} IS NOT NULL`))
    .groupBy(cible)
    .orderBy(desc(count()))
    .limit(limite);

  return rows.map((r) => ({ cle: String(r.cle ?? 'inconnu'), total: Number(r.total) }));
}

export const pagesLesPlusVues = (jours: number, limite = 8) => repartir('path', jours, limite);
export const sourcesDeTrafic = (jours: number, limite = 8) => repartir('referrerDomain', jours, limite);
export const appareils = (jours: number, limite = 4) => repartir('device', jours, limite);
export const pays = (jours: number, limite = 8) => repartir('country', jours, limite);
