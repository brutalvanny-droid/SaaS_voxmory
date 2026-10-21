import { randomUUID } from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import { and, asc, desc, eq, sql } from 'drizzle-orm';

import { db } from './_lib/db/index.js';
import {
  adminUsers,
  auditLogs,
  broadcastCampaigns,
  broadcastContacts,
  broadcastLists,
  dailyStats,
  gallerySongs,
  memoryPages,
  orders,
  packages,
  payments,
  reminders,
  reviews,
  settings,
  users,
  webhookEvents,
} from './_lib/db/schema.js';
import {
  SESSION_COOKIE,
  clearSessionCookie,
  clientIp,
  createSessionToken,
  hashPassword,
  logAudit,
  requireAdmin,
  setSessionCookie,
  verifyPassword,
  type AuthedRequest,
} from './_lib/auth.js';
import { rateLimit, maybePurge } from './_lib/ratelimit.js';
import {
  aiSchema,
  broadcastCampaignSchema,
  broadcastListSchema,
  createOrderSchema,
  createReviewSchema,
  gallerySongSchema,
  initPaymentSchema,
  loginSchema,
  resetSchema,
  forgotSchema,
  changePasswordSchema,
  updateProfileSchema,
  clientLoginSchema,
  registerSchema,
  memoryPageSchema,
  promotionSchema,
  reminderSchema,
  sendWhatsappSchema,
  updateOrderSchema,
  updatePackageSchema,
  updateReviewSchema,
  homeConfigSchema,
} from './_lib/validation.js';
import {
  createClientSessionToken,
  clearClientSessionCookie,
  generateResetToken,
  loadClient,
  linkGuestOrders,
  requireClient,
  setClientSessionCookie,
  type ClientRequest,
} from './_lib/clientAuth.js';
import * as saspay from './_lib/saspay.js';
import * as whatsapp from './_lib/whatsapp.js';
import { handleClientUpload, isBlobConfigured, uploadMode } from './_lib/storage.js';
import { adresseSignee, blobAccess, cheminEstSur } from './_lib/media.js';
import {
  enregistrerVue,
  domaineOrigine,
  typeAppareil,
  resumeAudience,
  serieQuotidienne,
  pagesLesPlusVues,
  sourcesDeTrafic,
  appareils as statsAppareils,
  pays as statsPays,
} from './_lib/analytics.js';
import { runAi } from './_lib/ai.js';

const app = express();
app.set('trust proxy', true);
app.disable('x-powered-by');
app.use(cookieParser());

/* ------------------------------------------------------------------ */
/*  Utilitaires                                                         */
/* ------------------------------------------------------------------ */

type Handler = (req: Request, res: Response) => Promise<unknown> | unknown;

const asyncHandler =
  (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

/** Les fichiers passent par Vercel Blob : 1 Mo suffit largement pour l'API. */
/**
 * Chanson publicitaire pour les entreprises.
 *
 * Tarif forfaitaire, distinct des formules : c'est un jingle de marque, pas
 * un souvenir personnalisé. Le libellé est défini ici pour que le serveur
 * et le formulaire parlent exactement de la même chose — une divergence
 * d'orthographe ferait perdre le tarif sans prévenir.
 */
export const OCCASION_PUB = 'PUB — Chanson pour entreprises';
const PRIX_PUB_CENTS = 3_500; // 35 $

const JSON_LIMIT = '1mb';

function newId(): string {
  return crypto.randomUUID();
}

const HEX = '0123456789ABCDEF';
function randomHex(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => HEX[b % 16]).join('');
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatMoney(cents: number, currency: string): string {
  const value = cents / 100;
  if (currency === 'USD') {
    return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} $`;
  }
  if (currency === 'CDF') {
    return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FC`;
  }
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${currency}`;
}

/* ------------------------------------------------------------------ */
/*  Réglages en base (compteurs, bandeau promo)                         */
/* ------------------------------------------------------------------ */

async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return row ? (row.value as unknown as T) : fallback;
}

async function setSetting(key: string, value: unknown): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value: value as Record<string, unknown>, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: value as Record<string, unknown>, updatedAt: new Date() },
    });
}

const HOME_DEFAUT = {
  hero: {
    videoUrl: '/images/hero.mp4',
    webmUrl: '/images/hero.webm',
    posterUrl: '/images/hero-poster.jpg',
  },
  promo: {
    actif: false,
    texte: '',
    sousTexte: '',
    forme: 'pastille',
    couleur: 'vert',
    position: 'droite',
  },
  vitrine: {
    chansons: 3,
    avis: 3,
  },
  emplacements: ['processus', 'formules', 'ecouter', 'avis', 'tranquillite', 'cta'].map((id) => ({
    id,
    visible: true,
  })),
};

/* ------------------------------------------------------------------ */
/*  Sérialisation                                                       */
/* ------------------------------------------------------------------ */

type PackageRow = typeof packages.$inferSelect;
type OrderRow = typeof orders.$inferSelect;

function serializePackage(row: PackageRow) {
  return {
    id: row.id,
    name: row.name,
    promise: row.promise,
    includes: row.includes ?? [],
    priceCents: row.priceCents,
    currency: row.currency,
    priceLabel: formatMoney(row.priceCents, row.currency),
    deliveryTime: row.deliveryTime,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
}

function serializeOrder(row: OrderRow) {
  return {
    id: row.id,
    reference: row.reference,
    trackingToken: row.trackingToken,
    status: row.status,
    paymentStatus: row.paymentStatus,

    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerCity: row.customerCity,
    customerCountry: row.customerCountry,
    customerEmail: row.customerEmail,
    acceptsWhatsapp: row.acceptsWhatsapp,

    recipientName: row.recipientName,
    recipientRelationship: row.recipientRelationship,
    recipientAge: row.recipientAge,
    eventDate: row.eventDate,

    storyOption: row.storyOption,
    storyText: row.storyText,
    storyAudioUrl: row.storyAudioUrl,
    storyPhotoUrl: row.storyPhotoUrl,
    importantWords: row.importantWords,
    avoidWords: row.avoidWords,
    occasion: row.occasion,

    mood: row.mood,
    musicStyle: row.musicStyle,
    packageId: row.packageId,
    vipCardSelected: row.vipCardSelected,

    amountCents: row.amountCents,
    currency: row.currency,
    amountLabel: formatMoney(row.amountCents, row.currency),

    desiredDeliveryDate: row.desiredDeliveryDate,
    urgency: row.urgency,
    specialInstructions: row.specialInstructions,

    adminNotes: row.adminNotes,
    finalAudioUrl: row.finalAudioUrl,
    coverImageUrl: row.coverImageUrl,
    memoryPageId: row.memoryPageId,
    songTitle: row.songTitle,
    finalLyrics: row.finalLyrics,
    clientFirstName: row.clientFirstName,

    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializeGallery(row: typeof gallerySongs.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    occasion: row.occasion,
    style: row.style,
    language: row.language,
    mood: row.mood,
    description: row.description,
    audioUrl: row.audioUrl,
    coverUrl: row.coverUrl,
    clientReaction: row.clientReaction,
    clientFirstName: row.clientFirstName,
    visibility: row.visibility,
    startTime: row.startTime,
    endTime: row.endTime,
    memorySlug: row.memorySlug,
    isFeatured: row.isFeatured,
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeReview(row: typeof reviews.$inferSelect) {
  return {
    id: row.id,
    rating: row.rating,
    clientName: row.clientName,
    occasion: row.occasion,
    comment: row.comment,
    screenshotUrl: row.screenshotUrl,
    audioTestimonialUrl: row.audioTestimonialUrl,
    approved: row.approved,
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeMemoryPage(row: typeof memoryPages.$inferSelect) {
  return {
    id: row.id,
    orderId: row.orderId,
    eventTitle: row.eventTitle,
    recipientName: row.recipientName,
    recipientPhotoUrl: row.recipientPhotoUrl,
    personalMessage: row.personalMessage,
    audioUrl: row.audioUrl,
    coverUrl: row.coverUrl,
    songTitle: row.songTitle,
    senderName: row.senderName,
    occasion: row.occasion,
    lyrics: row.lyrics,
    photoUrl: row.photoUrl,
    createdAt: row.createdAt.toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/*  Statistiques quotidiennes                                           */
/* ------------------------------------------------------------------ */

async function bumpDailyStat(field: 'visits' | 'listens' | 'orders'): Promise<void> {
  const day = today();
  await db
    .insert(dailyStats)
    .values({ date: day, visits: 0, listens: 0, orders: 0 })
    .onConflictDoNothing();
  await db
    .update(dailyStats)
    .set({ [field]: sql`${dailyStats[field]} + 1` } as never)
    .where(eq(dailyStats.date, day));
}

/* ================================================================== */
/*  ROUTES BRUTES — doivent précéder l'analyseur JSON global           */
/* ================================================================== */

/**
 * Webhook SasPay. Le corps doit rester brut : la signature HMAC est
 * calculée sur les octets exacts reçus.
 */
app.post(
  '/api/webhooks/saspay',
  express.raw({ type: '*/*', limit: '256kb' }),
  asyncHandler(async (req: Request, res: Response) => {
    const secret = process.env.SASPAY_WEBHOOK_SECRET;
    if (!secret) {
      res.status(503).json({ error: 'Webhook non configuré.' });
      return;
    }

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : String(req.body ?? '');

    const signature = req.header('X-Webhook-Signature') ?? undefined;
    const timestamp = req.header('X-Webhook-Timestamp') ?? undefined;
    const eventType = req.header('X-Webhook-Event') ?? 'inconnu';

    if (!saspay.verifyWebhookSignature(rawBody, signature, timestamp, secret)) {
      console.warn('[Webhook SasPay] Signature ou horodatage invalide — requête rejetée.');
      res.status(401).json({ error: 'Signature invalide.' });
      return;
    }

    const payload = JSON.parse(rawBody || '{}') as { event?: string; data?: Record<string, unknown> };
    const data = payload.data ?? {};
    const providerRef = data.id ? String(data.id) : null;
    const providerReference = data.reference ? String(data.reference) : null;

    // Idempotence : une même livraison rejouée ne doit rien re-traiter.
    const existing = await db
      .select({ id: webhookEvents.id })
      .from(webhookEvents)
      .where(eq(webhookEvents.providerRef, providerRef ?? ''))
      .limit(1);
    if (existing.length > 0) {
      res.json({ ok: true, deduplicated: true });
      return;
    }

    const eventId = newId();
    await db.insert(webhookEvents).values({
      id: eventId,
      provider: 'saspay',
      eventType: eventType || String(payload.event ?? 'inconnu'),
      providerRef,
      payload: data,
    });

    try {
      if (eventType === 'transaction.success') {
        await markPaymentSucceeded(providerRef, providerReference, data);
      } else if (eventType === 'transaction.failed' || eventType === 'transaction.cancelled') {
        await markPaymentFailed(providerRef);
      }

      await db
        .update(webhookEvents)
        .set({ processedAt: new Date() })
        .where(eq(webhookEvents.id, eventId));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db
        .update(webhookEvents)
        .set({ error: message })
        .where(eq(webhookEvents.id, eventId));
      console.error('[Webhook SasPay] Échec du traitement :', message);
      // On renvoie 200 : SasPay ne doit pas réessayer indéfiniment sur une
      // erreur métier. L'événement est journalisé pour reprise manuelle.
    }

    res.json({ ok: true });
  }),
);

/**
 * Téléversement direct navigateur → Vercel Blob.
 *
 * Le client demande ici un jeton de dépôt, puis envoie le fichier
 * directement au stockage : le contenu ne transite pas par la fonction
 * serverless, ce qui permet d'accepter des MP3 volumineux malgré la limite
 * de 4,5 Mo du corps de requête.
 *
 * Le jeton public est volontairement restreint — types, taille et quota —
 * pour qu'un visiteur malveillant ne puisse pas transformer le stockage en
 * dépotoir à nos frais.
 */
app.post(
  '/api/uploads',
  express.raw({ type: 'application/json', limit: '64kb' }),
  asyncHandler(async (req: Request, res: Response) => {
    maybePurge();

    const wantsAdminScope = req.query.scope === 'admin';
    if (wantsAdminScope) {
      await new Promise<void>((resolve) => {
        requireAdmin(req as AuthedRequest, res, resolve as NextFunction);
      });
      if (res.headersSent) return;
    } else {
      /**
       * Accès public : quota strict, sinon le stockage devient une cible.
       *
       * Vingt envois par heure et par adresse, et non cinq : une commande
       * complète comprend une note vocale et plusieurs photos, et un client
       * qui hésite ou se reprend consomme plusieurs essais. Sur les réseaux
       * mobiles l'adresse est partagée entre des dizaines d'abonnés, donc un
       * quota trop bas finissait par bloquer des clients parfaitement
       * honnêtes.
       */
      const limit = await rateLimit(`upload:${clientIp(req)}`, 20, 60 * 60 * 1000);
      if (!limit.ok) {
        res.status(429).json({ error: 'Trop de fichiers envoyés. Réessayez plus tard.' });
        return;
      }
    }

    if (!isBlobConfigured()) {
      res.status(501).json({ error: 'Stockage Blob non configuré.' });
      return;
    }

    (req as Request & { body: unknown }).body = JSON.parse(
      Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '{}',
    );
    await handleClientUpload(req, res, wantsAdminScope);
  }),
);

/**
 * Repli pour le développement local, sans Vercel Blob : le fichier est
 * déposé dans `public/uploads`. À réserver au développement.
 */
app.post(
  '/api/uploads/local',
  express.json({ limit: '12mb' }),
  asyncHandler(async (req: Request, res: Response) => {
    maybePurge();
    if (process.env.NODE_ENV === 'production') {
      res.status(404).json({ error: 'Route désactivée en production.' });
      return;
    }
    const limit = await rateLimit(`upload:${clientIp(req)}`, 20, 60 * 60 * 1000);
    if (!limit.ok) {
      res.status(429).json({ error: 'Trop de fichiers envoyés.' });
      return;
    }

    const { fileName, base64Data } = (req.body ?? {}) as {
      fileName?: string;
      base64Data?: string;
    };
    if (!base64Data || !fileName) {
      res.status(400).json({ error: 'Fichier manquant.' });
      return;
    }

    const pure = base64Data.includes(';base64,')
      ? base64Data.split(';base64,')[1]
      : base64Data;
    const buffer = Buffer.from(pure, 'base64');

    if (buffer.length > 10 * 1024 * 1024) {
      res.status(413).json({ error: 'Fichier trop volumineux (10 Mo maximum).' });
      return;
    }

    const { saveLocalUpload } = await import('./_lib/storage.js');
    const url = saveLocalUpload(`${Date.now()}-${fileName}`, buffer);
    res.json({ url });
  }),
);

/* ================================================================== */
/*  Parsing JSON global                                                 */
/* ================================================================== */

app.use(express.json({ limit: JSON_LIMIT }));

/*
 * Charge la session cliente si un cookie valide est présent, sans jamais
 * bloquer la requête : le visiteur non connecté doit pouvoir continuer.
 */
app.use(loadClient);

/* ================================================================== */
/*  SANTÉ & CONFIGURATION PUBLIQUE                                      */
/* ================================================================== */

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'voxmory',
    time: new Date().toISOString(),
    features: {
      database: Boolean(process.env.DATABASE_URL),
      payments: saspay.isSaspayConfigured(),
      whatsapp: whatsapp.isWhatsappConfigured(),
      ai: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
      storage: uploadMode(),
    },
  });
});

app.get('/api/config', (_req, res) => {
  res.json({
    uploadMode: uploadMode(),
    blobAccess: blobAccess(),
    // Le tarif publicitaire est annoncé par le serveur : le formulaire
    // l'affiche sans pouvoir le fixer lui-même.
    occasionPub: OCCASION_PUB,
    prixPubCents: PRIX_PUB_CENTS,
  });
});

/**
 * Lecture d'un fichier stocké.
 *
 * Le magasin Blob étant privé, l'adresse directe d'un fichier répond 403.
 * On fabrique ici une adresse signée valable une heure et on y redirige le
 * navigateur : le fichier est toujours servi par le réseau de Vercel, nous
 * ne faisons que l'aiguiller.
 *
 * Aucune authentification n'est exigée — les pages souvenir sont faites
 * pour être ouvertes depuis un lien envoyé à un proche. La sécurité repose
 * sur le caractère imprévisible du chemin (suffixe aléatoire à l'envoi) et
 * sur la courte durée de validité de l'adresse.
 */
app.get(
  '/api/media/*',
  asyncHandler(async (req: Request, res: Response) => {
    /**
     * Express 4 place la partie joker dans `params[0]`, pas dans un
     * paramètre nommé : `/api/media/audio/x.mp3` donne bien « audio/x.mp3 ».
     */
    const brut = (req.params as Record<string, unknown>)[0];
    const pathname = decodeURIComponent(Array.isArray(brut) ? brut.join('/') : String(brut ?? ''));

    if (!pathname || !cheminEstSur(pathname)) {
      res.status(400).json({ error: 'Chemin de fichier invalide.' });
      return;
    }

    // Accès public : l'adresse directe suffit, inutile de signer.
    if (blobAccess() === 'public') {
      const store = process.env.BLOB_STORE_ID;
      if (!store) {
        res.status(500).json({ error: 'Stockage non configuré.' });
        return;
      }
      res.redirect(302, `https://${store}.public.blob.vercel-storage.com/${pathname}`);
      return;
    }

    let url: string | null;
    try {
      url = await adresseSignee(pathname, {
        telechargement: req.query.download === '1',
      });
    } catch (err) {
      console.error('[Media] Signature impossible :', err);
      res.status(502).json({ error: 'Fichier momentanément indisponible.' });
      return;
    }

    if (!url) {
      res.status(400).json({ error: 'Chemin de fichier invalide.' });
      return;
    }

    // L'adresse signée change à chaque appel : on autorise la mise en cache
    // une heure au plus, jamais au-delà de sa propre expiration.
    res.set('Cache-Control', 'public, max-age=3600');
    res.redirect(302, url);
  }),
);

/* ================================================================== */
/*  AUTHENTIFICATION                                                    */
/* ================================================================== */

app.post(
  '/api/auth/login',
  asyncHandler(async (req: Request, res: Response) => {
    maybePurge();
    const ip = clientIp(req);
    const limit = await rateLimit(`login:${ip}`, 8, 15 * 60 * 1000);
    if (!limit.ok) {
      res
        .status(429)
        .set('Retry-After', String(limit.retryAfter))
        .json({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' });
      return;
    }

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(401).json({ error: 'Identifiants invalides.' });
      return;
    }

    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, parsed.data.email))
      .limit(1);

    // Comparaison systématique, même si le compte n'existe pas : évite de
    // révéler quelles adresses sont enregistrées par le temps de réponse.
    const hash = admin?.passwordHash ?? '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
    const valid = await verifyPassword(parsed.data.password, hash);

    if (!admin || !valid || !admin.isActive) {
      res.status(401).json({ error: 'Identifiants invalides.' });
      return;
    }

    const token = await createSessionToken({
      sub: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });
    setSessionCookie(res, token);

    await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, admin.id));

    res.json({ ok: true, admin: { email: admin.email, name: admin.name, role: admin.role } });
  }),
);

app.post('/api/auth/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get(
  '/api/auth/me',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const admin = (req as AuthedRequest).admin;
    res.json({ admin: { email: admin?.email, name: admin?.name, role: admin?.role } });
  }),
);

/* ================================================================== */
/*  ROUTES PUBLIQUES                                                    */
/* ================================================================== */

app.get(
  '/api/packages',
  asyncHandler(async (_req, res) => {
    const rows = await db
      .select()
      .from(packages)
      .where(eq(packages.isActive, true))
      .orderBy(asc(packages.sortOrder));
    res.json(rows.map(serializePackage));
  }),
);

app.get('/api/promotion', asyncHandler(async (_req, res) => {
  const promo = await getSetting('promotion', {
    text: '',
    isActive: false,
    bannerStyle: 'classic',
  });
  res.json(promo);
}));

app.get(
  '/api/gallery',
  asyncHandler(async (_req, res) => {
    const rows = await db
      .select()
      .from(gallerySongs)
      .orderBy(desc(gallerySongs.isFeatured), desc(gallerySongs.createdAt));
    // Les créations privées ne sortent jamais sur la vitrine publique.
    res.json(rows.filter((r) => r.visibility !== 'Private').map(serializeGallery));
  }),
);

app.get(
  '/api/reviews',
  asyncHandler(async (req: Request, res: Response) => {
    const all = req.query.all === 'true';
    // `all` est réservé à l'administration ; sans session, on force le filtre.
    if (all) {
      await new Promise<void>((resolve) => {
        requireAdmin(req as AuthedRequest, res, resolve as NextFunction);
      });
      if (res.headersSent) return;
    }
    const rows = await db.select().from(reviews).orderBy(desc(reviews.createdAt));
    const filtered = all ? rows : rows.filter((r) => r.approved);
    res.json(filtered.map(serializeReview));
  }),
);

app.post(
  '/api/reviews',
  asyncHandler(async (req: Request, res: Response) => {
    maybePurge();
    const limit = await rateLimit(`review:${clientIp(req)}`, 5, 60 * 60 * 1000);
    if (!limit.ok) {
      res.status(429).json({ error: 'Trop de témoignages envoyés. Réessayez plus tard.' });
      return;
    }

    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Témoignage invalide.', details: parsed.error.issues });
      return;
    }

    const [created] = await db
      .insert(reviews)
      .values({ id: newId(), ...parsed.data, approved: false })
      .returning();
    res.status(201).json(serializeReview(created));
  }),
);

app.get(
  '/api/memory-pages/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const [row] = await db
      .select()
      .from(memoryPages)
      .where(eq(memoryPages.id, req.params.id))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: 'Page souvenir introuvable.' });
      return;
    }
    res.json(serializeMemoryPage(row));
  }),
);

/* --- Suivi de commande ------------------------------------------------ */

function publicTracking(row: OrderRow) {
  const firstName = row.recipientName.trim().split(/\s+/)[0] ?? null;
  return {
    reference: row.reference,
    status: row.status,
    paymentStatus: row.paymentStatus,
    occasion: row.occasion,
    recipientFirstName: firstName,
    songTitle: row.songTitle,
    createdAt: row.createdAt.toISOString(),
    desiredDeliveryDate: row.desiredDeliveryDate,
    memoryPageId: row.memoryPageId,
    finalAudioUrl: row.paymentStatus === 'Paid' ? row.finalAudioUrl : null,
    coverImageUrl: row.coverImageUrl,
  };
}

app.get(
  '/api/track/:key',
  asyncHandler(async (req: Request, res: Response) => {
    maybePurge();
    const limit = await rateLimit(`track:${clientIp(req)}`, 20, 10 * 60 * 1000);
    if (!limit.ok) {
      res.status(429).json({ error: 'Trop de recherches. Réessayez dans quelques minutes.' });
      return;
    }

    const key = String(req.params.key).trim();
    const [row] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.trackingToken, key),
        ),
      )
      .limit(1);

    const found =
      row ??
      (
        await db.select().from(orders).where(eq(orders.reference, key.toUpperCase())).limit(1)
      )[0];

    if (!found) {
      res.status(404).json({ error: 'Aucune commande correspondante.' });
      return;
    }

    // Aucune donnée personnelle n'est exposée : ni téléphone, ni histoire.
    res.json(publicTracking(found));
  }),
);

/* --- Création de commande --------------------------------------------- */

app.post(
  '/api/orders',
  asyncHandler(async (req: Request, res: Response) => {
    maybePurge();
    const limit = await rateLimit(`order:${clientIp(req)}`, 5, 60 * 60 * 1000);
    if (!limit.ok) {
      res.status(429).json({ error: 'Trop de commandes depuis cet appareil. Réessayez plus tard.' });
      return;
    }

    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Données de commande invalides.',
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
      return;
    }
    const data = parsed.data;

    const [pkg] = await db
      .select()
      .from(packages)
      .where(and(eq(packages.id, data.packageId), eq(packages.isActive, true)))
      .limit(1);
    if (!pkg) {
      res.status(400).json({ error: 'Formule indisponible.' });
      return;
    }

    // Le prix est figé côté serveur : jamais celui envoyé par le client.
    const vipFeeCents = data.vipCardSelected ? 200 : 0;

    /**
     * Une chanson publicitaire obéit à un tarif à part.
     *
     * Ce n'est pas un souvenir personnalisé : c'est un jingle commandé par
     * une entreprise pour sa marque. Le forfait est donc unique, quelle que
     * soit la formule cochée. On l'applique ici, et nulle part ailleurs,
     * pour qu'un client ne puisse pas l'annoncer lui-même depuis son
     * navigateur.
     */
    const estPub = data.occasion === OCCASION_PUB;
    const amountCents = estPub ? PRIX_PUB_CENTS : pkg.priceCents + vipFeeCents;

    const id = newId();
    const reference = `VOX-${new Date().getFullYear()}-${randomHex(8)}`;
    const trackingToken = randomHex(24);

    // Insertion explicite de chaque colonne : aucun champ non prévu ne peut
    // se glisser depuis la requête, même si le schéma de validation évolue.
    const [created] = await db
      .insert(orders)
      .values({
        id,
        reference,
        trackingToken,
        status: 'Nouvelle',
        paymentStatus: 'Unpaid',

        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerCity: data.customerCity,
        customerCountry: data.customerCountry,
        customerEmail: data.customerEmail,
        acceptsWhatsapp: data.acceptsWhatsapp,

        recipientName: data.recipientName,
        recipientRelationship: data.recipientRelationship,
        recipientAge: data.recipientAge,
        eventDate: data.eventDate,

        storyOption: data.storyOption,
        storyText: data.storyText,
        storyAudioUrl: data.storyAudioUrl,
        storyPhotoUrl: data.storyPhotoUrl,
        importantWords: data.importantWords,
        avoidWords: data.avoidWords,
        occasion: data.occasion,

        mood: data.mood,
        musicStyle: data.musicStyle,
        packageId: pkg.id,
        vipCardSelected: data.vipCardSelected,

        amountCents,
        currency: pkg.currency,

        desiredDeliveryDate: data.desiredDeliveryDate ?? '',
        urgency: data.urgency,
        specialInstructions: data.specialInstructions,

        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await bumpDailyStat('orders');

    // Notifications — jamais bloquantes pour le client.
    void (async () => {
      const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;
      if (adminNumber) {
        await whatsapp.sendWhatsAppMessage(
          adminNumber,
          whatsapp.adminNewOrderMessage({
            reference,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            packageName: pkg.name + (data.vipCardSelected ? ' + Carte VIP' : ''),
            amountLabel: formatMoney(amountCents, pkg.currency),
          }),
        );
      }
      /**
       * On n'écrit jamais à un client qui a refusé WhatsApp. Sans ce
       * respect du choix, le consentement n'aurait aucun sens — et le
       * message tomberait de toute façon dans le vide.
       */
      if (data.acceptsWhatsapp) {
        await whatsapp.sendWhatsAppMessage(
          data.customerPhone,
          whatsapp.orderReceivedMessage(data.customerName, reference),
        );
      }
    })();

    res.status(201).json(serializeOrder(created));
  }),
);

/* --- Statistiques d'audience ------------------------------------------ */

app.post(
  '/api/stats/visit',
  asyncHandler(async (req: Request, res: Response) => {
    const ip = clientIp(req);
    const limit = await rateLimit(`visit:${ip}`, 120, 10 * 60 * 1000);
    if (!limit.ok) {
      res.json({ ok: true, throttled: true });
      return;
    }

    const corps = (req.body ?? {}) as {
      anonymousId?: unknown;
      path?: unknown;
      referrer?: unknown;
    };

    const anonymousId = typeof corps.anonymousId === 'string' ? corps.anonymousId.trim() : '';
    if (!anonymousId || anonymousId.length > 64) {
      // Sans identifiant, impossible de distinguer deux personnes : on
      // compte la visite globalement, sans l'attribuer.
      await bumpDailyStat('visits');
      res.json({ ok: true, anonymous: false });
      return;
    }

    const hote = req.headers.host ?? '';
    await enregistrerVue({
      anonymousId,
      path: typeof corps.path === 'string' ? corps.path : '/',
      referrer: domaineOrigine(
        typeof corps.referrer === 'string' ? corps.referrer : String(req.headers.referer ?? ''),
        hote,
      ),
      device: typeAppareil(String(req.headers['user-agent'] ?? '')),
      // Vercel fournit le pays sans qu'on ait à géolocaliser quoi que ce
      // soit. On ne conserve pas l'adresse IP, seulement cette information
      // déjà agrégée.
      country:
        typeof req.headers['x-vercel-ip-country'] === 'string'
          ? String(req.headers['x-vercel-ip-country'])
          : null,
    });

    await bumpDailyStat('visits');
    res.json({ ok: true, anonymous: true });
  }),
);

app.post(
  '/api/stats/listen',
  asyncHandler(async (req: Request, res: Response) => {
    const ip = clientIp(req);
    const limit = await rateLimit(`listen:${ip}`, 120, 10 * 60 * 1000);
    if (!limit.ok) {
      res.json({ ok: true, throttled: true });
      return;
    }
    const count = await getSetting<number>('listensCount', 0);
    const next = count + 1;
    await setSetting('listensCount', next);
    await bumpDailyStat('listens');
    res.json({ ok: true, listensCount: next });
  }),
);

/* ================================================================== */
/*  PAIEMENTS                                                            */
/* ================================================================== */

app.get(
  '/api/payments/networks',
  asyncHandler(async (req: Request, res: Response) => {
    const country = String(req.query.country ?? 'CD').toUpperCase().slice(0, 2);
    if (!saspay.isSaspayConfigured()) {
      res.json({ configured: false, networks: [] });
      return;
    }
    try {
      const networks = await saspay.listNetworks(country);
      res.json({ configured: true, country, networks });
    } catch (err) {
      console.error('[SasPay] Réseaux indisponibles :', err);
      res.json({ configured: true, country, networks: [], error: 'Indisponible' });
    }
  }),
);

/** Initie un paiement pour une commande existante. */
app.post(
  '/api/payments/init',
  asyncHandler(async (req: Request, res: Response) => {
    maybePurge();
    const limit = await rateLimit(`pay:${clientIp(req)}`, 10, 10 * 60 * 1000);
    if (!limit.ok) {
      res.status(429).json({ error: 'Trop de tentatives de paiement.' });
      return;
    }

    const parsed = initPaymentSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: 'Paramètres de paiement invalides.' });
      return;
    }
    const reference = String((req.body as { reference?: string })?.reference ?? '').trim();
    if (!reference) {
      res.status(400).json({ error: 'Référence de commande requise.' });
      return;
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.reference, reference.toUpperCase()))
      .limit(1);
    if (!order) {
      res.status(404).json({ error: 'Commande introuvable.' });
      return;
    }
    if (order.paymentStatus === 'Paid') {
      res.json({ alreadyPaid: true, status: 'Paid' });
      return;
    }
    if (!saspay.isSaspayConfigured()) {
      res.status(503).json({ error: 'Paiement en ligne momentanément indisponible.' });
      return;
    }
    if (order.amountCents <= 0) {
      res.status(400).json({ error: 'Montant de commande invalide.' });
      return;
    }

    const idempotencyKey = newId();
    const returnUrl = `${process.env.APP_URL ?? ''}/#suivi/${order.trackingToken}`;
    const base = {
      amountCents: order.amountCents,
      currency: order.currency,
      country: parsed.data.country,
      description: `Commande ${order.reference} — VOXMORY`,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: parsed.data.phone ?? order.customerPhone,
      network: parsed.data.network,
      returnUrl,
      idempotencyKey,
    };

    let intent;
    try {
      intent =
        parsed.data.method === 'softpay'
          ? await saspay.createSoftpayPayment(base)
          : await saspay.createCheckoutSession(base);
    } catch (err) {
      console.error('[SasPay] Échec de l’initialisation :', err);
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Passerelle de paiement indisponible.',
      });
      return;
    }

    const [payment] = await db
      .insert(payments)
      .values({
        id: newId(),
        orderId: order.id,
        provider: 'saspay',
        providerRef: intent.id,
        status: intent.status ?? 'PENDING',
        method: parsed.data.method,
        amountCents: order.amountCents,
        currency: order.currency,
        country: parsed.data.country,
        network: parsed.data.network ?? null,
        checkoutUrl: intent.checkoutUrl,
        customerPhone: parsed.data.phone ?? order.customerPhone,
        idempotencyKey,
        rawResponse: intent.raw as Record<string, unknown>,
      })
      .returning();

    if (intent.checkoutUrl) {
      await db
        .update(orders)
        .set({ paymentStatus: 'Pending confirmation', updatedAt: new Date() })
        .where(eq(orders.id, order.id));
    }

    res.status(201).json({
      paymentId: payment.id,
      status: payment.status,
      checkoutUrl: payment.checkoutUrl,
      amountLabel: formatMoney(order.amountCents, order.currency),
    });
  }),
);

/** Revérifie l'état réel auprès de SasPay (utilisé par le suivi). */
app.get(
  '/api/payments/:reference/status',
  asyncHandler(async (req: Request, res: Response) => {
    maybePurge();
    const limit = await rateLimit(`paystatus:${clientIp(req)}`, 30, 10 * 60 * 1000);
    if (!limit.ok) {
      res.status(429).json({ error: 'Trop de vérifications.' });
      return;
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.reference, String(req.params.reference).toUpperCase()))
      .limit(1);
    if (!order) {
      res.status(404).json({ error: 'Commande introuvable.' });
      return;
    }

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, order.id))
      .orderBy(desc(payments.createdAt))
      .limit(1);

    if (!payment?.providerRef || !saspay.isSaspayConfigured()) {
      res.json({ status: order.paymentStatus, verified: false });
      return;
    }

    try {
      const verified = await saspay.verifyPayment(payment.providerRef);
      if (verified.status === 'SUCCESS') {
        await markOrderPaid(order.id, payment.id, verified.raw);
        res.json({ status: 'Paid', verified: true });
        return;
      }
      res.json({ status: verified.status === 'FAILED' ? 'Unpaid' : order.paymentStatus, verified: true });
    } catch (err) {
      console.error('[SasPay] Vérification impossible :', err);
      res.json({ status: order.paymentStatus, verified: false });
    }
  }),
);

/* --- Helpers de paiement ---------------------------------------------- */

async function markOrderPaid(
  orderId: string,
  paymentId: string,
  raw: unknown,
): Promise<void> {
  await db
    .update(payments)
    .set({
      status: 'SUCCESS',
      paidAt: new Date(),
      rawResponse: (raw ?? null) as Record<string, unknown> | null,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId));

  await db
    .update(orders)
    .set({ paymentStatus: 'Paid', updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (order) {
    void whatsapp.sendWhatsAppMessage(
      order.customerPhone,
      whatsapp.paymentConfirmedMessage(order.customerName, order.reference),
    );
  }
}

async function markPaymentSucceeded(
  providerRef: string | null,
  providerReference: string | null,
  data: Record<string, unknown>,
): Promise<void> {
  const [payment] = providerRef
    ? await db.select().from(payments).where(eq(payments.providerRef, providerRef)).limit(1)
    : [];
  if (!payment) {
    throw new Error(`Paiement SasPay introuvable : ${providerRef ?? providerReference}`);
  }
  await markOrderPaid(payment.orderId, payment.id, data);
}

async function markPaymentFailed(providerRef: string | null): Promise<void> {
  const [payment] = providerRef
    ? await db.select().from(payments).where(eq(payments.providerRef, providerRef)).limit(1)
    : [];
  if (!payment) return;
  await db
    .update(payments)
    .set({ status: 'FAILED', updatedAt: new Date() })
    .where(eq(payments.id, payment.id));
  await db
    .update(orders)
    .set({ paymentStatus: 'Unpaid', updatedAt: new Date() })
    .where(eq(orders.id, payment.orderId));
}

/* ================================================================== */
/*  COMPTES CLIENTS                                                     */
/* ================================================================== */

/**
 * Un compte n'est jamais obligatoire pour commander : l'imposer avant le
 * paiement fait fuir. Il sert à retrouver ses chansons et à suivre ses
 * commandes sans devoir ressaisir un numéro à chaque visite.
 */

/** Réponse publique d'un compte : jamais le mot de passe. */
function serializeUser(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    city: u.city,
    country: u.country,
    createdAt: u.createdAt,
  };
}

/* --- Inscription --------------------------------------------------- */

app.post(
  '/api/account/register',
  asyncHandler(async (req: Request, res: Response) => {
    maybePurge();
    const ip = clientIp(req);
    const limit = await rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
    if (!limit.ok) {
      res
        .status(429)
        .set('Retry-After', String(limit.retryAfter))
        .json({ error: 'Trop d\'inscriptions depuis chez vous. Réessayez plus tard.' });
      return;
    }

    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? 'Informations invalides.',
      });
      return;
    }

    const email = parsed.data.email.toLowerCase();

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      res.status(409).json({ error: 'Cette adresse est déjà utilisée.' });
      return;
    }

    const id = randomUUID();
    const passwordHash = await hashPassword(parsed.data.password);

    await db.insert(users).values({
      id,
      email,
      passwordHash,
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
    });

    // Les commandes déjà passées avec cette adresse rejoignent le compte.
    await linkGuestOrders(id, email);

    const token = await createClientSessionToken({ id, email, name: parsed.data.name });
    setClientSessionCookie(res, token);

    const [created] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    res.status(201).json({ ok: true, user: serializeUser(created) });
  }),
);

/* --- Connexion ------------------------------------------------------ */

app.post(
  '/api/account/login',
  asyncHandler(async (req: Request, res: Response) => {
    maybePurge();
    const ip = clientIp(req);
    const limit = await rateLimit(`client-login:${ip}`, 10, 15 * 60 * 1000);
    if (!limit.ok) {
      res
        .status(429)
        .set('Retry-After', String(limit.retryAfter))
        .json({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' });
      return;
    }

    const parsed = clientLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(401).json({ error: 'Identifiants invalides.' });
      return;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1);

    // Comparaison systématique : sans compte existant on compare quand même
    // contre un faux hachage, pour que le temps de réponse ne révèle rien.
    const ok = await verifyPassword(
      parsed.data.password,
      user?.passwordHash ?? '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv',
    );

    if (!user || !ok || !user.isActive) {
      res.status(401).json({ error: 'Identifiants invalides.' });
      return;
    }

    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    const token = await createClientSessionToken(user);
    setClientSessionCookie(res, token);

    res.json({ ok: true, user: serializeUser(user) });
  }),
);

/* --- Déconnexion --------------------------------------------------- */

app.post('/api/account/logout', (_req: Request, res: Response) => {
  clearClientSessionCookie(res);
  res.json({ ok: true });
});

/* --- Profil --------------------------------------------------------- */

app.get(
  '/api/account/me',
  requireClient,
  asyncHandler(async (req: ClientRequest, res: Response) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.client!.sub))
      .limit(1);

    if (!user) {
      clearClientSessionCookie(res);
      res.status(401).json({ error: 'Session expirée.' });
      return;
    }

    res.json({ user: serializeUser(user) });
  }),
);

app.patch(
  '/api/account/me',
  requireClient,
  asyncHandler(async (req: ClientRequest, res: Response) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Informations invalides.' });
      return;
    }

    const [updated] = await db
      .update(users)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(users.id, req.client!.sub))
      .returning();

    res.json({ user: serializeUser(updated) });
  }),
);

app.post(
  '/api/account/password',
  requireClient,
  asyncHandler(async (req: ClientRequest, res: Response) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? 'Mot de passe invalide.',
      });
      return;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.client!.sub))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: 'Session expirée.' });
      return;
    }

    const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!ok) {
      res.status(400).json({ error: 'Votre mot de passe actuel est incorrect.' });
      return;
    }

    await db
      .update(users)
      .set({ passwordHash: await hashPassword(parsed.data.newPassword), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    res.json({ ok: true });
  }),
);

/* --- Commandes du compte -------------------------------------------- */

app.get(
  '/api/account/orders',
  requireClient,
  asyncHandler(async (req: ClientRequest, res: Response) => {
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, req.client!.sub))
      .orderBy(desc(orders.createdAt));

    // Le nom de la formule est joint : la commande ne stocke que son
    // identifiant, pour éviter de figer un libellé qui changerait ensuite.
    const packs = await db.select().from(packages);
    const packName = (id: string | null) =>
      packs.find((p) => p.id === id)?.name ?? 'Formule';

    // Le client voit l'avancement de ses propres commandes, et rien d'autre :
    // ni les notes internes, ni les instructions de production.
    res.json(
      rows.map((o) => ({
        id: o.id,
        reference: o.reference,
        trackingToken: o.trackingToken,
        status: o.status,
        paymentStatus: o.paymentStatus,
        packageName: packName(o.packageId),
        amountCents: o.amountCents,
        currency: o.currency,
        recipientName: o.recipientName,
        occasion: o.occasion,
        songTitle: o.songTitle,
        finalAudioUrl: o.finalAudioUrl,
        coverImageUrl: o.coverImageUrl,
        memoryPageId: o.memoryPageId,
        desiredDeliveryDate: o.desiredDeliveryDate,
        createdAt: o.createdAt,
      })),
    );
  }),
);

/* --- Mot de passe oublié -------------------------------------------- */

app.post(
  '/api/account/forgot',
  asyncHandler(async (req: Request, res: Response) => {
    maybePurge();
    const ip = clientIp(req);
    const limit = await rateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000);
    if (!limit.ok) {
      res
        .status(429)
        .set('Retry-After', String(limit.retryAfter))
        .json({ error: 'Trop de demandes. Réessayez plus tard.' });
      return;
    }

    const parsed = forgotSchema.safeParse(req.body);
    if (!parsed.success) {
      // Réponse neutre : ne jamais révéler si un compte existe.
      res.json({ ok: true });
      return;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1);

    if (user) {
      const token = generateResetToken();
      await db
        .update(users)
        .set({
          resetToken: token,
          resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 h
        })
        .where(eq(users.id, user.id));

      // Sans service d'e-mail configuré, le jeton est journalisé : il faut
      // pouvoir le transmettre au client d'une manière ou d'une autre.
      console.log(`[Compte] Réinitialisation demandée pour ${user.email} — jeton ${token}`);
    }

    // Toujours la même réponse, que le compte existe ou non.
    res.json({ ok: true });
  }),
);

app.post(
  '/api/account/reset',
  asyncHandler(async (req: Request, res: Response) => {
    maybePurge();

    /**
     * Limite d'essais sur la réinitialisation.
     *
     * Le jeton est imprévisible — 256 bits d'aléa — donc une recherche
     * exhaustive n'aboutira pas. Mais rien n'empêchait auparavant de
     * soumettre des milliers de jetons à la seconde : la base encaissait
     * une requête par essai, et l'absence de plafond facilitait
     * l'observation des temps de réponse. La limite coûte peu et ferme
     * cette porte, sans gêner un client légitime qui n'a qu'un jeton.
     */
    const limit = await rateLimit(`reset:${clientIp(req)}`, 10, 15 * 60 * 1000);
    if (!limit.ok) {
      res
        .status(429)
        .set('Retry-After', String(limit.retryAfter))
        .json({ error: 'Trop d’essais. Patientez un instant, puis réessayez.' });
      return;
    }

    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? 'Demande invalide.',
      });
      return;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.resetToken, parsed.data.token))
      .limit(1);

    const expired =
      !user ||
      !user.resetTokenExpiresAt ||
      user.resetTokenExpiresAt.getTime() < Date.now();

    if (expired) {
      res.status(400).json({ error: 'Ce lien a expiré. Demandez-en un nouveau.' });
      return;
    }

    await db
      .update(users)
      .set({
        passwordHash: await hashPassword(parsed.data.password),
        resetToken: null,
        resetTokenExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    res.json({ ok: true });
  }),
);

/* ================================================================== */
/*  ADMINISTRATION — tout ce qui suit exige une session                  */
/* ================================================================== */

app.use('/api/admin', requireAdmin);
app.use('/api/orders', requireAdmin);
app.use('/api/whatsapp', requireAdmin);

/* --- Tableau de bord --------------------------------------------------- */

app.get(
  '/api/admin/stats',
  asyncHandler(async (_req, res) => {
    const [orderRows, reviewRows, statRows] = await Promise.all([
      db.select().from(orders),
      db.select().from(reviews),
      db.select().from(dailyStats).orderBy(asc(dailyStats.date)).limit(90),
    ]);

    const paid = orderRows.filter((o) => o.paymentStatus === 'Paid');
    const totalRevenueCents = paid.reduce((sum, o) => sum + o.amountCents, 0);
    const delivered = orderRows.filter((o) => o.status === 'Livrée').length;
    const pendingPayment = orderRows.filter(
      (o) =>
        o.paymentStatus !== 'Paid' &&
        o.status !== 'Annulée' &&
        o.status !== 'Archivée' &&
        o.status !== 'Livrée',
    ).length;

    const approved = reviewRows.filter((r) => r.approved);
    const averageRating = approved.length
      ? Number(
          (approved.reduce((s, r) => s + r.rating, 0) / approved.length).toFixed(1),
        )
      : 5;
    const clientSatisfaction = approved.length
      ? Number(
          ((approved.filter((r) => r.rating >= 4).length / approved.length) * 100).toFixed(1),
        )
      : 100;

    /* --- Ce mois-ci -----------------------------------------------------
       Le début du mois en UTC : les dates sont stockées en ISO, un simple
       préfixe suffit et évite tout décalage de fuseau. */
    const debutDuMois = new Date();
    debutDuMois.setUTCDate(1);
    debutDuMois.setUTCHours(0, 0, 0, 0);

    const rowsMois = orderRows.filter((o) => +new Date(o.createdAt) >= +debutDuMois);
    const payeesMois = rowsMois.filter((o) => o.paymentStatus === 'Paid');
    const revenueMoisCents = payeesMois.reduce((s, o) => s + o.amountCents, 0);

    /* --- Répartition par statut -----------------------------------------
       Alimente le pipeline : ce sont les colonnes qui réclament une action
       aujourd'hui. */
    const ORDRE_STATUTS = [
      'Nouvelle',
      'En écriture',
      'En composition',
      'En enregistrement',
      'En relecture',
      'Livrée',
      'Annulée',
      'Archivée',
    ] as const;

    const parStatut: Record<string, number> = {};
    for (const st of ORDRE_STATUTS) parStatut[st] = 0;
    for (const o of orderRows) parStatut[o.status] = (parStatut[o.status] ?? 0) + 1;

    const ordersByStatus = ORDRE_STATUTS.map((status) => ({
      status,
      count: parStatut[status] ?? 0,
    }));

    /* --- Formules les plus vendues --------------------------------------
       Sert à savoir quoi mettre en avant. Les annulées ne comptent pas :
       une annulation ne dit rien d'une préférence. */
    const packageRows = await db.select().from(packages);
    const nomFormule = new Map(packageRows.map((pk) => [pk.id, pk.name]));

    const compteurFormules = new Map<
      string,
      { name: string; count: number; revenueCents: number }
    >();
    for (const o of orderRows) {
      if (o.status === 'Annulée') continue;
      const cle = o.packageId ?? 'inconnu';
      const entree = compteurFormules.get(cle) ?? {
        name: nomFormule.get(cle) ?? 'Formule retirée',
        count: 0,
        revenueCents: 0,
      };
      entree.count += 1;
      if (o.paymentStatus === 'Paid') entree.revenueCents += o.amountCents;
      compteurFormules.set(cle, entree);
    }
    const topPackages = [...compteurFormules.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    /* --- Dernières commandes --------------------------------------------
       Volontairement allégées : le tableau de bord n'a pas besoin des
       paroles ni de l'histoire, seulement de quoi savoir par quoi
       commencer la journée. */
    const recentOrders = orderRows
      .slice()
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 8)
      .map((o) => ({
        id: o.id,
        reference: o.reference,
        status: o.status,
        paymentStatus: o.paymentStatus,
        customerName: o.customerName,
        packageName: nomFormule.get(o.packageId ?? '') ?? 'Formule retirée',
        amountCents: o.amountCents,
        currency: o.currency,
        desiredDeliveryDate: o.desiredDeliveryDate,
        createdAt: o.createdAt,
      }));

    /* --- Clients --------------------------------------------------------
       Un client = une adresse e-mail distincte. Les commandes sans e-mail
       ne comptent pas : on ne peut les rattacher à personne. */
    const emailsClients = new Set(
      orderRows.map((o) => (o.customerEmail ?? '').trim().toLowerCase()).filter(Boolean),
    );
    const rowsComptes = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.isActive, true));

    res.json({
      totalOrders: orderRows.length,
      delivered,
      pendingPayment,
      totalRevenueCents,
      currency: 'USD',
      totalRevenueLabel: formatMoney(totalRevenueCents, 'USD'),
      clientSatisfaction,
      averageRating,
      visitsCount: await getSetting<number>('visitsCount', 0),
      listensCount: await getSetting<number>('listensCount', 0),

      /* Lecture d'ensemble : ce qui fait tourner l'activité. */
      ordersThisMonth: rowsMois.length,
      revenueThisMonthCents: revenueMoisCents,
      averageOrderCents: paid.length ? Math.round(totalRevenueCents / paid.length) : 0,
      ordersByStatus,
      topPackages,
      recentOrders,
      totalClients: emailsClients.size,
      clientsWithAccount: rowsComptes.length,

      dailyStats: statRows.map((s) => ({
        date: s.date,
        visits: s.visits,
        listens: s.listens,
        orders: s.orders,
      })),
    });
  }),
);

/* --- Analyse complète --------------------------------------------------- */

/**
 * Toutes les mesures du studio en une seule requête.
 *
 * Le tableau de bord ouvre sept onglets ; les alimenter un par un ferait
 * sept allers-retours et sept états de chargement à gérer. On préfère une
 * réponse unique, quitte à ce qu'elle soit un peu plus lourde.
 */
app.get(
  '/api/admin/analytics',
  asyncHandler(async (req: Request, res: Response) => {
    const jours = Math.min(
      365,
      Math.max(1, Number.parseInt(String(req.query.days ?? '30'), 10) || 30),
    );

    const [orderRows, userRows, paymentRows] = await Promise.all([
      db.select().from(orders),
      db.select().from(users),
      db.select().from(payments),
    ]);

    const [audience, audience7, audience1, serie, pages, sources, appareils, paysRows] =
      await Promise.all([
        resumeAudience(jours),
        resumeAudience(7),
        resumeAudience(1),
        serieQuotidienne(jours),
        pagesLesPlusVues(jours),
        sourcesDeTrafic(jours),
        statsAppareils(jours),
        statsPays(jours),
      ]);

    /* ---- Ventes ---- */
    const payees = orderRows.filter((o) => o.paymentStatus === 'Paid');
    const chiffreAffaires = payees.reduce((s, o) => s + o.amountCents, 0);
    const seuilMois = new Date();
    seuilMois.setUTCDate(1);
    seuilMois.setUTCHours(0, 0, 0, 0);

    const duMois = orderRows.filter((o) => +new Date(o.createdAt) >= +seuilMois);
    const payeesMois = duMois.filter((o) => o.paymentStatus === 'Paid');

    // Chiffre d'affaires par jour, pour la courbe des ventes.
    const ventesParJour = new Map<string, number>();
    for (const o of payees) {
      const cle = new Date(o.createdAt).toISOString().slice(0, 10);
      ventesParJour.set(cle, (ventesParJour.get(cle) ?? 0) + o.amountCents);
    }
    const serieVentes = serie.map((p) => ({
      date: p.date,
      montantCents: ventesParJour.get(p.date) ?? 0,
    }));

    /* ---- Commandes ---- */
    const parStatut: Record<string, number> = {};
    for (const o of orderRows) parStatut[o.status] = (parStatut[o.status] ?? 0) + 1;

    const dernieres = orderRows
      .slice()
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 10)
      .map((o) => ({
        id: o.id,
        reference: o.reference,
        status: o.status,
        paymentStatus: o.paymentStatus,
        customerName: o.customerName,
        amountCents: o.amountCents,
        currency: o.currency,
        createdAt: o.createdAt,
      }));

    /* ---- Comptes clients ---- */
    const comptesRecents = userRows
      .slice()
      .sort((a, b) => +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0))
      .slice(0, 10)
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        city: u.city,
        country: u.country,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      }));

    /* ---- Numéros WhatsApp ----
       C'est le carnet d'adresses le plus précieux du studio : des
       personnes qui ont explicitement accepté d'être recontactées. On le
       déduit des commandes plutôt que d'une liste séparée, pour qu'il
       reste exact sans effort de saisie. */
    const carnet = new Map<
      string,
      { nom: string; telephone: string; ville: string; commandes: number; dernier: string | null }
    >();
    for (const o of orderRows) {
      if (!o.acceptsWhatsapp) continue;
      const tel = (o.customerPhone ?? '').replace(/[^0-9+]/g, '').trim();
      if (tel.length < 8) continue;

      const cle = tel;
      const entree = carnet.get(cle) ?? {
        nom: o.customerName,
        telephone: tel,
        ville: o.customerCity ?? '',
        commandes: 0,
        dernier: null,
      };
      entree.commandes += 1;
      const dateCommande = new Date(o.createdAt).toISOString();
      if (!entree.dernier || dateCommande > entree.dernier) {
        entree.dernier = dateCommande;
        entree.nom = o.customerName;
        entree.ville = o.customerCity ?? '';
      }
      carnet.set(cle, entree);
    }

    const numerosWhatsapp = [...carnet.values()]
      .sort((a, b) => (b.dernier ?? '').localeCompare(a.dernier ?? ''))
      .slice(0, 50);

    /* ---- Paiements ---- */
    const paiementsRecents = paymentRows
      .slice()
      .sort((a, b) => +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0))
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        orderId: p.orderId,
        amountCents: p.amountCents,
        currency: p.currency,
        status: p.status,
        provider: p.provider,
        createdAt: p.createdAt,
      }));

    res.json({
      periodeJours: jours,

      audience,
      audience7,
      audienceAujourdhui: audience1,
      serieQuotidienne: serie,
      pagesLesPlusVues: pages,
      sources: sources,
      appareils,
      pays: paysRows,

      ventes: {
        chiffreAffairesCents: chiffreAffaires,
        commandesPayees: payees.length,
        panierMoyenCents: payees.length ? Math.round(chiffreAffaires / payees.length) : 0,
        chiffreAffairesMoisCents: payeesMois.reduce((s, o) => s + o.amountCents, 0),
        commandesMois: duMois.length,
        /*
         * Taux de conversion : commandes rapportées aux visiteurs. Il n'est
         * calculé que sur des visiteurs réellement mesurés — avec zéro
         * visiteur, afficher un pourcentage n'aurait aucun sens.
         */
        tauxConversion: audience.visiteurs
          ? Math.round((orderRows.length / audience.visiteurs) * 1000) / 10
          : null,
        serieVentes,
      },

      commandes: {
        total: orderRows.length,
        parStatut,
        dernieres,
        enCours: orderRows.filter((o) =>
          ['Nouvelle', 'En écriture', 'En composition', 'En enregistrement', 'En relecture'].includes(
            o.status,
          ),
        ).length,
        livrees: orderRows.filter((o) => o.status === 'Livrée').length,
      },

      utilisateurs: {
        total: userRows.length,
        actifs: userRows.filter((u) => u.isActive).length,
        recents: comptesRecents,
      },

      whatsapp: {
        total: numerosWhatsapp.length,
        numeros: numerosWhatsapp,
      },

      paiements: paiementsRecents,
    });
  }),
);


/* --- Vitrine : page d'accueil ------------------------------------------ */

/**
 * Contenu de la page d'accueil.
 *
 * Le studio doit pouvoir changer sa vidéo ou lancer une promotion sans
 * nous écrire ni redéployer le site. Tout passe par la table des réglages,
 * sans migration ni colonne supplémentaire.
 *
 * Les libellés, eux, restent dans les traductions : un texte traduit en
 * trois langues ne doit pas être écrasé par une saisie faite en français.
 */
app.get('/api/home', asyncHandler(async (_req, res) => {
  res.json(await getSetting('home', HOME_DEFAUT));
}));

app.get(
  '/api/admin/home',
  asyncHandler(async (_req, res) => {
    res.json(await getSetting('home', HOME_DEFAUT));
  }),
);

app.put(
  '/api/admin/home',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = homeConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Paramètres invalides.',
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
      return;
    }
    await setSetting('home', parsed.data);
    void logAudit(req, 'home.update', 'setting', null, null);
    res.json(parsed.data);
  }),
);


/* --- Vitrine : notifications du studio -------------------------------- */

/**
 * Ce qui s'est passé depuis la dernière fois que le studio a regardé.
 *
 * Un studio qui vend ne peut pas passer sa journée à recharger son
 * tableau de bord : il doit être averti. On lui renvoie donc les événements
 * récents — nouvelle commande, paiement reçu, avis déposé — et le compte
 * de ceux qu'il n'a pas encore vus.
 *
 * La mémorisation du « déjà vu » reste dans le navigateur du studio, et non
 * dans la base : c'est une préférence d'affichage, pas une donnée
 * métier. Aucune table supplémentaire n'est donc nécessaire, et deux
 * personnes travaillant sur le même compte gardent chacune la leur.
 */
app.get(
  '/api/admin/notifications',
  requireAdmin,
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const depuisRaw = String(req.query.since ?? '');
    const depuis = depuisRaw ? new Date(depuisRaw) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const borneValide = !Number.isNaN(depuis.getTime());
    const borne = borneValide ? depuis : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [commandes, avis] = await Promise.all([
      db
        .select({
          id: orders.id,
          reference: orders.reference,
          client: orders.customerName,
          montant: orders.amountCents,
          devise: orders.currency,
          statutPaiement: orders.paymentStatus,
          occasion: orders.occasion,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(20),
      db
        .select({
          id: reviews.id,
          client: reviews.clientName,
          note: reviews.rating,
          approuve: reviews.approved,
          createdAt: reviews.createdAt,
        })
        .from(reviews)
        .orderBy(desc(reviews.createdAt))
        .limit(20),
    ]);

    const evenements: {
      id: string;
      type: 'commande' | 'paiement' | 'avis';
      titre: string;
      detail: string;
      date: string;
      lien?: string;
    }[] = [];

    for (const c of commandes) {
      const date = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
      const paye = c.statutPaiement === 'Paid';
      evenements.push({
        id: `c-${c.id}`,
        type: paye ? 'paiement' : 'commande',
        titre: paye
          ? `Paiement reçu — ${((c.montant ?? 0) / 100).toLocaleString('fr-FR')} ${c.devise ?? ''}`
          : 'Nouvelle commande',
        detail: `${c.client ?? 'Client'}${c.occasion ? ` · ${c.occasion}` : ''} · ${c.reference}`,
        date: date.toISOString(),
        lien: `/admin/orders`,
      });
    }

    for (const a of avis) {
      const date = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      evenements.push({
        id: `a-${a.id}`,
        type: 'avis',
        titre: a.approuve ? 'Avis publié' : 'Avis en attente de validation',
        detail: `${a.client ?? 'Client'} · ${a.note ?? 0}/5`,
        date: date.toISOString(),
      });
    }

    evenements.sort((x, y) => y.date.localeCompare(x.date));

    const nonVus = evenements.filter((e) => new Date(e.date) > borne);

    res.json({
      evenements: evenements.slice(0, 20),
      nonVus: nonVus.length,
    });
  }),
);

/* --- Commandes --------------------------------------------------------- */

app.get(
  '/api/orders',
  asyncHandler(async (req: Request, res: Response) => {
    const status = typeof req.query.status === 'string' ? req.query.status : null;
    const rows = status
      ? await db.select().from(orders).where(eq(orders.status, status)).orderBy(desc(orders.createdAt))
      : await db.select().from(orders).orderBy(desc(orders.createdAt));
    res.json(rows.map(serializeOrder));
  }),
);

app.get(
  '/api/orders/:id/detail',
  asyncHandler(async (req: Request, res: Response) => {
    const [row] = await db.select().from(orders).where(eq(orders.id, req.params.id)).limit(1);
    if (!row) {
      res.status(404).json({ error: 'Commande introuvable.' });
      return;
    }
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, row.id))
      .orderBy(desc(payments.createdAt))
      .limit(1);

    res.json({
      order: serializeOrder(row),
      payment: payment
        ? {
            id: payment.id,
            status: payment.status,
            method: payment.method,
            amountCents: payment.amountCents,
            currency: payment.currency,
            checkoutUrl: payment.checkoutUrl,
            providerRef: payment.providerRef,
            createdAt: payment.createdAt.toISOString(),
          }
        : null,
    });
  }),
);

app.put(
  '/api/orders/:id',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = updateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Mise à jour invalide.', details: parsed.error.issues });
      return;
    }
    const [updated] = await db
      .update(orders)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(orders.id, req.params.id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: 'Commande introuvable.' });
      return;
    }
    void logAudit(req, 'order.update', 'order', updated.id, parsed.data);
    res.json(serializeOrder(updated));
  }),
);

app.delete(
  '/api/orders/:id',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const [deleted] = await db
      .delete(orders)
      .where(eq(orders.id, req.params.id))
      .returning({ id: orders.id });
    void logAudit(req, 'order.delete', 'order', req.params.id);
    res.json({ success: Boolean(deleted) });
  }),
);

/* --- Offres ------------------------------------------------------------ */

app.get(
  '/api/admin/packages',
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(packages).orderBy(asc(packages.sortOrder));
    res.json(rows.map(serializePackage));
  }),
);

app.put(
  '/api/admin/packages/:id',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = updatePackageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Données invalides.', details: parsed.error.issues });
      return;
    }
    const [updated] = await db
      .update(packages)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(packages.id, req.params.id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: 'Formule introuvable.' });
      return;
    }
    void logAudit(req, 'package.update', 'package', updated.id, parsed.data);
    res.json(serializePackage(updated));
  }),
);

/* --- Galerie ----------------------------------------------------------- */

app.get(
  '/api/admin/gallery',
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(gallerySongs).orderBy(desc(gallerySongs.createdAt));
    res.json(rows.map(serializeGallery));
  }),
);

app.post(
  '/api/admin/gallery',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = gallerySongSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Chanson invalide.', details: parsed.error.issues });
      return;
    }
    const [created] = await db
      .insert(gallerySongs)
      .values({ id: newId(), ...parsed.data, endTime: parsed.data.endTime ?? null })
      .returning();
    void logAudit(req, 'gallery.create', 'gallerySong', created.id);
    res.status(201).json(serializeGallery(created));
  }),
);

app.put(
  '/api/admin/gallery/:id',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = gallerySongSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Données invalides.', details: parsed.error.issues });
      return;
    }
    const [updated] = await db
      .update(gallerySongs)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(gallerySongs.id, req.params.id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: 'Chanson introuvable.' });
      return;
    }
    res.json(serializeGallery(updated));
  }),
);

app.delete(
  '/api/admin/gallery/:id',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const [deleted] = await db
      .delete(gallerySongs)
      .where(eq(gallerySongs.id, req.params.id))
      .returning({ id: gallerySongs.id });
    void logAudit(req, 'gallery.delete', 'gallerySong', req.params.id);
    res.json({ success: Boolean(deleted) });
  }),
);

/* --- Avis -------------------------------------------------------------- */

app.put(
  '/api/admin/reviews/:id',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = updateReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Données invalides.', details: parsed.error.issues });
      return;
    }
    const [updated] = await db
      .update(reviews)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(reviews.id, req.params.id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: 'Avis introuvable.' });
      return;
    }
    void logAudit(req, 'review.update', 'review', updated.id, parsed.data);
    res.json(serializeReview(updated));
  }),
);

app.delete(
  '/api/admin/reviews/:id',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const [deleted] = await db
      .delete(reviews)
      .where(eq(reviews.id, req.params.id))
      .returning({ id: reviews.id });
    void logAudit(req, 'review.delete', 'review', req.params.id);
    res.json({ success: Boolean(deleted) });
  }),
);

/* --- Pages souvenir ---------------------------------------------------- */

app.get(
  '/api/admin/memory-pages',
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(memoryPages).orderBy(desc(memoryPages.createdAt));
    res.json(rows.map(serializeMemoryPage));
  }),
);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}

app.post(
  '/api/admin/memory-pages',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = memoryPageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Données invalides.', details: parsed.error.issues });
      return;
    }
    const data = parsed.data;
    const id = data.id?.trim() || `mem_${slugify(data.recipientName)}_${randomHex(5)}`;

    const [created] = await db
      .insert(memoryPages)
      .values({ ...data, id, orderId: data.orderId ?? null })
      .returning();

    if (data.orderId) {
      await db
        .update(orders)
        .set({ memoryPageId: id, updatedAt: new Date() })
        .where(eq(orders.id, data.orderId));
    }
    void logAudit(req, 'memoryPage.create', 'memoryPage', id);
    res.status(201).json(serializeMemoryPage(created));
  }),
);

app.post(
  '/api/admin/memory-pages/generate',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const orderId = String((req.body as { orderId?: string })?.orderId ?? '').trim();
    if (!orderId) {
      res.status(400).json({ error: 'Commande requise.' });
      return;
    }
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) {
      res.status(404).json({ error: 'Commande introuvable.' });
      return;
    }
    if (order.memoryPageId) {
      res.json({ success: true, id: order.memoryPageId, existing: true });
      return;
    }

    const id = `mem_${slugify(order.recipientName || 'souvenir')}_${randomHex(5)}`;
    const [created] = await db
      .insert(memoryPages)
      .values({
        id,
        orderId: order.id,
        eventTitle: `Le souvenir en musique de ${order.recipientName}`,
        recipientName: order.recipientName,
        recipientPhotoUrl: order.storyPhotoUrl,
        personalMessage: order.storyText ?? '',
        audioUrl: order.finalAudioUrl ?? '',
        coverUrl: order.coverImageUrl ?? '',
        songTitle: order.songTitle,
        senderName: order.clientFirstName || order.customerName,
        occasion: order.occasion,
        lyrics: order.finalLyrics,
        photoUrl: order.storyPhotoUrl,
      })
      .returning();

    await db
      .update(orders)
      .set({ memoryPageId: id, updatedAt: new Date() })
      .where(eq(orders.id, order.id));

    void logAudit(req, 'memoryPage.generate', 'memoryPage', id);
    res.status(201).json({ success: true, id: created.id });
  }),
);

app.delete(
  '/api/admin/memory-pages/:id',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const [deleted] = await db
      .delete(memoryPages)
      .where(eq(memoryPages.id, req.params.id))
      .returning({ id: memoryPages.id });
    void logAudit(req, 'memoryPage.delete', 'memoryPage', req.params.id);
    res.json({ success: Boolean(deleted) });
  }),
);

/* --- Bandeau promotionnel ---------------------------------------------- */

app.put(
  '/api/admin/promotion',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = promotionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Données invalides.', details: parsed.error.issues });
      return;
    }
    await setSetting('promotion', parsed.data);
    void logAudit(req, 'promotion.update', 'settings', 'promotion', parsed.data);
    res.json(parsed.data);
  }),
);

/* --- Rappels ----------------------------------------------------------- */

app.get(
  '/api/admin/reminders',
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(reminders).orderBy(asc(reminders.eventDate));
    res.json(
      rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    );
  }),
);

app.post(
  '/api/admin/reminders',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = reminderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Données invalides.', details: parsed.error.issues });
      return;
    }
    const [created] = await db
      .insert(reminders)
      .values({
        id: newId(),
        customerName: parsed.data.customerName,
        customerPhone: parsed.data.customerPhone,
        eventName: parsed.data.eventName,
        eventDate: parsed.data.eventDate,
        relationship: parsed.data.relationship ?? '',
      })
      .returning();
    void logAudit(req, 'reminder.create', 'reminder', created.id);
    res.status(201).json({ ...created, createdAt: created.createdAt.toISOString() });
  }),
);

app.delete(
  '/api/admin/reminders/:id',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const [deleted] = await db
      .delete(reminders)
      .where(eq(reminders.id, req.params.id))
      .returning({ id: reminders.id });
    res.json({ success: Boolean(deleted) });
  }),
);

/* --- Diffusion WhatsApp ------------------------------------------------ */

app.get(
  '/api/admin/broadcast/lists',
  asyncHandler(async (_req, res) => {
    const lists = await db.select().from(broadcastLists).orderBy(desc(broadcastLists.createdAt));
    const contacts = await db.select().from(broadcastContacts);
    res.json(
      lists.map((l) => ({
        id: l.id,
        name: l.name,
        description: l.description,
        createdAt: l.createdAt.toISOString(),
        contacts: contacts
          .filter((c) => c.listId === l.id)
          .map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            category: c.category,
            addedAt: c.addedAt.toISOString(),
          })),
      })),
    );
  }),
);

app.post(
  '/api/admin/broadcast/lists',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = broadcastListSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Données invalides.' });
      return;
    }
    const [created] = await db
      .insert(broadcastLists)
      .values({ id: newId(), name: parsed.data.name, description: parsed.data.description ?? '' })
      .returning();
    res.status(201).json({ ...created, contacts: [] });
  }),
);

app.post(
  '/api/admin/broadcast/lists/:id/contacts',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const body = req.body as { name?: string; phone?: string; category?: string };
    if (!body?.name || !body?.phone) {
      res.status(400).json({ error: 'Nom et numéro requis.' });
      return;
    }
    const [created] = await db
      .insert(broadcastContacts)
      .values({
        id: newId(),
        listId: req.params.id,
        name: String(body.name).slice(0, 120),
        phone: String(body.phone).slice(0, 30),
        category: String(body.category ?? 'Client').slice(0, 60),
      })
      .returning();
    res.status(201).json(created);
  }),
);

app.delete(
  '/api/admin/broadcast/lists/:id',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const [deleted] = await db
      .delete(broadcastLists)
      .where(eq(broadcastLists.id, req.params.id))
      .returning({ id: broadcastLists.id });
    res.json({ success: Boolean(deleted) });
  }),
);

app.get(
  '/api/admin/broadcast/campaigns',
  asyncHandler(async (_req, res) => {
    const rows = await db
      .select()
      .from(broadcastCampaigns)
      .orderBy(desc(broadcastCampaigns.createdAt));
    res.json(
      rows.map((c) => ({ ...c, sentAt: c.sentAt?.toISOString() ?? null })),
    );
  }),
);

app.post(
  '/api/admin/broadcast/campaigns',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = broadcastCampaignSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Campagne invalide.', details: parsed.error.issues });
      return;
    }
    const data = parsed.data;

    let targets: { name: string; phone: string }[] = [];
    let listName: string | null = null;
    if (data.targetListId) {
      const [list] = await db
        .select()
        .from(broadcastLists)
        .where(eq(broadcastLists.id, data.targetListId))
        .limit(1);
      const contacts = await db
        .select()
        .from(broadcastContacts)
        .where(eq(broadcastContacts.listId, data.targetListId));
      targets = contacts.map((c) => ({ name: c.name, phone: c.phone }));
      listName = list?.name ?? null;
    }

    const [created] = await db
      .insert(broadcastCampaigns)
      .values({
        id: newId(),
        title: data.title,
        messageTemplate: data.messageTemplate,
        targetListId: data.targetListId ?? null,
        targetListName: listName,
        status: 'Brouillon',
        totalCount: targets.length,
      })
      .returning();
    void logAudit(req, 'campaign.create', 'campaign', created.id);
    res.status(201).json({ ...created, sentAt: null });
  }),
);

/**
 * Envoi d'une campagne. Volontairement plafonné et séquencé : un envoi
 * massif depuis un numéro professionnel entraîne un bannissement.
 */
const CAMPAIGN_MAX_RECIPIENTS = 200;
const CAMPAIGN_DELAY_MS = 1500;

app.post(
  '/api/admin/broadcast/campaigns/:id/send',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const limit = await rateLimit(`campaign:${req.params.id}`, 3, 60 * 60 * 1000);
    if (!limit.ok) {
      res.status(429).json({ error: 'Cette campagne a déjà été envoyée plusieurs fois.' });
      return;
    }

    const [campaign] = await db
      .select()
      .from(broadcastCampaigns)
      .where(eq(broadcastCampaigns.id, req.params.id))
      .limit(1);
    if (!campaign) {
      res.status(404).json({ error: 'Campagne introuvable.' });
      return;
    }
    if (!campaign.targetListId) {
      res.status(400).json({ error: 'Aucune liste ciblée.' });
      return;
    }

    const contacts = await db
      .select()
      .from(broadcastContacts)
      .where(eq(broadcastContacts.listId, campaign.targetListId))
      .limit(CAMPAIGN_MAX_RECIPIENTS);

    if (contacts.length === 0) {
      res.status(400).json({ error: 'La liste ciblée est vide.' });
      return;
    }

    await db
      .update(broadcastCampaigns)
      .set({ status: 'En cours' })
      .where(eq(broadcastCampaigns.id, campaign.id));

    const logs: {
      contactName: string;
      phone: string;
      status: 'Succès' | 'Échoué';
      time: string;
      error?: string;
    }[] = [];

    for (const contact of contacts) {
      const text = campaign.messageTemplate.replace(/\{name\}/g, contact.name);
      const result = await whatsapp.sendWhatsAppMessage(contact.phone, text);
      logs.push({
        contactName: contact.name,
        phone: contact.phone,
        status: result.ok ? 'Succès' : 'Échoué',
        time: new Date().toISOString(),
        ...(result.ok ? {} : { error: result.reason }),
      });
      await new Promise((r) => setTimeout(r, CAMPAIGN_DELAY_MS));
    }

    const sentCount = logs.filter((l) => l.status === 'Succès').length;
    const [updated] = await db
      .update(broadcastCampaigns)
      .set({ status: 'Envoyé', sentCount, logs, sentAt: new Date() })
      .where(eq(broadcastCampaigns.id, campaign.id))
      .returning();

    void logAudit(req, 'campaign.send', 'campaign', campaign.id, { sentCount, total: contacts.length });
    res.json({ ...updated, sentAt: updated.sentAt?.toISOString() ?? null });
  }),
);

/* --- WhatsApp unitaire ------------------------------------------------- */

app.post(
  '/api/whatsapp/send',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const limit = await rateLimit(`wa:${req.admin?.sub ?? 'unknown'}`, 60, 60 * 60 * 1000);
    if (!limit.ok) {
      res.status(429).json({ error: 'Quota d’envoi horaire atteint.' });
      return;
    }
    const parsed = sendWhatsappSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Paramètres invalides.' });
      return;
    }
    const result = await whatsapp.sendWhatsAppMessage(parsed.data.phone, parsed.data.message);
    void logAudit(req, 'whatsapp.send', 'order', null, { phone: parsed.data.phone });
    res.json(result);
  }),
);

/**
 * État de la passerelle.
 *
 * Permet au studio de voir, sans ouvrir les journaux, si les variables sont
 * en place et si la session est connectée — les deux causes d'un message
 * qui ne part pas.
 */
app.get(
  '/api/whatsapp/status',
  asyncHandler(async (_req: AuthedRequest, res: Response) => {
    const etat = whatsapp.whatsappStatus();
    const sonde = etat.configure ? await whatsapp.testerConnexion() : null;
    res.json({
      ...etat,
      joignable: sonde?.ok ?? null,
      detail: sonde?.detail ?? (etat.configure ? undefined : 'Configuration incomplète.'),
    });
  }),
);

app.post(
  '/api/whatsapp/test',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const cible =
      (typeof req.body?.phone === 'string' && req.body.phone.trim()) ||
      process.env.ADMIN_WHATSAPP_NUMBER;

    if (!cible) {
      res.status(400).json({
        error: 'Indiquez un numéro, ou configurez ADMIN_WHATSAPP_NUMBER.',
      });
      return;
    }

    const result = await whatsapp.sendWhatsAppMessage(
      cible,
      `[VOXMORY] Test d'intégration réussi — ${new Date().toLocaleString('fr-FR')}`,
    );
    void logAudit(req, 'whatsapp.test', 'order', null, { phone: cible });
    res.json(result);
  }),
);

/* --- Assistant IA ------------------------------------------------------- */

app.post(
  '/api/admin/ai',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const limit = await rateLimit(`ai:${req.admin?.sub ?? 'unknown'}`, 60, 60 * 60 * 1000);
    if (!limit.ok) {
      res.status(429).json({ error: 'Quota d’assistance IA atteint pour cette heure.' });
      return;
    }
    const parsed = aiSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Requête invalide.', details: parsed.error.issues });
      return;
    }
    const result = await runAi(parsed.data);
    res.json(result);
  }),
);

/* --- Journal d'audit ---------------------------------------------------- */

app.get(
  '/api/admin/audit',
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200);
    res.json(
      rows.map((r) => ({
        id: r.id,
        adminEmail: r.adminEmail,
        action: r.action,
        entity: r.entity,
        entityId: r.entityId,
        metadata: r.metadata,
        ip: r.ip,
        createdAt: r.createdAt.toISOString(),
      })),
    );
  }),
);

/* ================================================================== */
/*  Gestion des erreurs                                                  */
/* ================================================================== */

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Un corps trop volumineux est une erreur client, pas une panne serveur.
  if (err && (err as { type?: string }).type === 'entity.too.large') {
    res.status(413).json({ error: 'Requête trop volumineuse.' });
    return;
  }
  console.error('[API] Erreur non gérée :', err);
  res.status(500).json({ error: 'Une erreur interne est survenue.' });
});

/* 404 pour tout ce qui n'a pas été routé sous /api */
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Route inconnue.' });
});

export default app;
export { SESSION_COOKIE };
