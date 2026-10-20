import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  date,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/* ------------------------------------------------------------------ */
/*  Administrateurs                                                     */
/* ------------------------------------------------------------------ */

export const adminUsers = pgTable(
  'admin_users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull().default('Administrateur'),
    role: text('role').notNull().default('admin'),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('admin_users_email_unique').on(t.email)],
);

/* ------------------------------------------------------------------ */
/*  Offres commerciales                                                 */
/* ------------------------------------------------------------------ */

export const packages = pgTable('packages', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  promise: text('promise').notNull().default(''),
  includes: jsonb('includes').$type<string[]>().notNull().default([]),
  priceCents: integer('price_cents').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  deliveryTime: text('delivery_time').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Commandes                                                           */
/* ------------------------------------------------------------------ */

export const orders = pgTable(
  'orders',
  {
    id: text('id').primaryKey(),

    /** Référence lisible affichée au client : VOX-2026-A1B2C3D4 */
    reference: text('reference').notNull(),
    /** Jeton secret non devinable servant au suivi public. */
    trackingToken: text('tracking_token').notNull(),

    status: text('status').notNull().default('Nouvelle'),
    paymentStatus: text('payment_status').notNull().default('Unpaid'),

    /**
     * Compte client associé, s'il existe.
     *
     * Resté volontairement vide pour les commandes passées en invité : la
     * commande doit rester possible sans inscription. Rempli à la création du
     * compte pour les commandes déjà passées avec la même adresse e-mail.
     */
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),

    /* Client */
    customerName: text('customer_name').notNull(),
    customerPhone: text('customer_phone').notNull(),
    customerCity: text('customer_city').notNull().default(''),
    customerCountry: text('customer_country').notNull().default(''),
    customerEmail: text('customer_email'),
    acceptsWhatsapp: boolean('accepts_whatsapp').notNull().default(false),

    /* Destinataire */
    recipientName: text('recipient_name').notNull().default(''),
    recipientRelationship: text('recipient_relationship').notNull().default(''),
    recipientAge: text('recipient_age'),
    eventDate: text('event_date'),

    /* Histoire */
    storyOption: text('story_option').notNull().default('write'),
    storyText: text('story_text'),
    storyAudioUrl: text('story_audio_url'),
    storyPhotoUrl: text('story_photo_url'),
    importantWords: text('important_words'),
    avoidWords: text('avoid_words'),
    occasion: text('occasion'),

    /* Choix musicaux */
    mood: text('mood').notNull().default(''),
    musicStyle: text('music_style').notNull().default(''),
    packageId: text('package_id').references(() => packages.id),
    vipCardSelected: boolean('vip_card_selected').notNull().default(false),

    /* Montant figé au moment de la commande */
    amountCents: integer('amount_cents').notNull().default(0),
    currency: text('currency').notNull().default('USD'),

    /* Livraison */
    desiredDeliveryDate: text('desired_delivery_date').notNull().default(''),
    urgency: text('urgency').notNull().default('normal'),
    specialInstructions: text('special_instructions'),

    /* Production */
    adminNotes: text('admin_notes'),
    finalAudioUrl: text('final_audio_url'),
    coverImageUrl: text('cover_image_url'),
    memoryPageId: text('memory_page_id'),
    songTitle: text('song_title'),
    finalLyrics: text('final_lyrics'),
    clientFirstName: text('client_first_name'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('orders_reference_unique').on(t.reference),
    uniqueIndex('orders_tracking_token_unique').on(t.trackingToken),
    index('orders_created_at_idx').on(t.createdAt),
    index('orders_status_idx').on(t.status),
    index('orders_user_idx').on(t.userId),
    index('orders_email_idx').on(t.customerEmail),
  ],
);

/* ------------------------------------------------------------------ */
/*  Paiements (SasPay)                                                  */
/* ------------------------------------------------------------------ */

export const payments = pgTable(
  'payments',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull().default('saspay'),
    /** Identifiant de transaction chez SasPay */
    providerRef: text('provider_ref'),
    status: text('status').notNull().default('PENDING'),
    method: text('method').notNull().default('checkout'), // checkout | softpay
    amountCents: integer('amount_cents').notNull().default(0),
    currency: text('currency').notNull().default('USD'),
    country: text('country'),
    network: text('network'),
    checkoutUrl: text('checkout_url'),
    customerPhone: text('customer_phone'),
    /** Clé d'idempotence envoyée à SasPay — évite les doubles débits */
    idempotencyKey: text('idempotency_key').notNull(),
    rawResponse: jsonb('raw_response').$type<Record<string, unknown>>(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('payments_idempotency_key_unique').on(t.idempotencyKey),
    index('payments_order_idx').on(t.orderId),
    index('payments_provider_ref_idx').on(t.providerRef),
  ],
);

/** Journal brut des webhooks reçus — garantit un traitement idempotent. */
export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: text('id').primaryKey(),
    provider: text('provider').notNull().default('saspay'),
    eventType: text('event_type').notNull(),
    providerRef: text('provider_ref'),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('webhook_events_provider_ref_idx').on(t.providerRef),
    index('webhook_events_type_idx').on(t.eventType),
  ],
);

/* ------------------------------------------------------------------ */
/*  Galerie                                                             */
/* ------------------------------------------------------------------ */

export const gallerySongs = pgTable('gallery_songs', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  occasion: text('occasion').notNull().default(''),
  style: text('style').notNull().default(''),
  language: text('language').notNull().default(''),
  mood: text('mood').notNull().default(''),
  description: text('description').notNull().default(''),
  audioUrl: text('audio_url').notNull().default(''),
  coverUrl: text('cover_url').notNull().default(''),
  clientReaction: text('client_reaction'),
  clientFirstName: text('client_first_name'),
  visibility: text('visibility').notNull().default('Private'),
  startTime: integer('start_time').notNull().default(0),
  endTime: integer('end_time'),
  memorySlug: text('memory_slug'),
  isFeatured: boolean('is_featured').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Avis clients                                                        */
/* ------------------------------------------------------------------ */

export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  rating: integer('rating').notNull().default(5),
  clientName: text('client_name').notNull(),
  occasion: text('occasion').notNull().default(''),
  comment: text('comment').notNull(),
  screenshotUrl: text('screenshot_url'),
  audioTestimonialUrl: text('audio_testimonial_url'),
  approved: boolean('approved').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Pages souvenir                                                      */
/* ------------------------------------------------------------------ */

export const memoryPages = pgTable('memory_pages', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'set null' }),
  eventTitle: text('event_title').notNull(),
  recipientName: text('recipient_name').notNull().default(''),
  recipientPhotoUrl: text('recipient_photo_url'),
  personalMessage: text('personal_message').notNull().default(''),
  audioUrl: text('audio_url').notNull().default(''),
  coverUrl: text('cover_url').notNull().default(''),
  songTitle: text('song_title'),
  senderName: text('sender_name'),
  occasion: text('occasion'),
  lyrics: text('lyrics'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Rappels d'événements                                                */
/* ------------------------------------------------------------------ */

export const reminders = pgTable('reminders', {
  id: text('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  eventName: text('event_name').notNull(),
  eventDate: text('event_date').notNull(),
  relationship: text('relationship').notNull().default(''),
  notifiedAt: timestamp('notified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Diffusion WhatsApp                                                  */
/* ------------------------------------------------------------------ */

export const broadcastLists = pgTable('broadcast_lists', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const broadcastContacts = pgTable(
  'broadcast_contacts',
  {
    id: text('id').primaryKey(),
    listId: text('list_id')
      .notNull()
      .references(() => broadcastLists.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    category: text('category').notNull().default('Client'),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('broadcast_contacts_list_idx').on(t.listId)],
);

export const broadcastCampaigns = pgTable('broadcast_campaigns', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  messageTemplate: text('message_template').notNull().default(''),
  targetListId: text('target_list_id'),
  targetListName: text('target_list_name'),
  status: text('status').notNull().default('Brouillon'),
  sentCount: integer('sent_count').notNull().default(0),
  totalCount: integer('total_count').notNull().default(0),
  logs: jsonb('logs')
    .$type<
      {
        contactName: string;
        phone: string;
        status: 'Succès' | 'Échoué';
        time: string;
        error?: string;
      }[]
    >()
    .notNull()
    .default([]),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Statistiques, réglages, sécurité                                    */
/* ------------------------------------------------------------------ */

export const dailyStats = pgTable('daily_stats', {
  date: date('date').primaryKey(),
  visits: integer('visits').notNull().default(0),
  listens: integer('listens').notNull().default(0),
  orders: integer('orders').notNull().default(0),
});

/** Réglages divers (bandeau promo, compteurs globaux…) en clé/valeur. */
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Compteurs pour la limitation de débit (compatible serverless). */
export const rateLimitCounters = pgTable(
  'rate_limit_counters',
  {
    key: text('key').primaryKey(),
    count: integer('count').notNull().default(0),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('rate_limit_window_idx').on(t.windowStart)],
);

/** Journal d'audit des actions d'administration. */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    adminId: text('admin_id'),
    adminEmail: text('admin_email'),
    action: text('action').notNull(),
    entity: text('entity'),
    entityId: text('entity_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    ip: text('ip'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('audit_logs_created_idx').on(t.createdAt)],
);

/* ------------------------------------------------------------------ */
/*  Comptes clients                                                     */
/* ------------------------------------------------------------------ */

/**
 * Les clients qui créent un compte.
 *
 * La commande reste possible sans compte — c'est indispensable : imposer une
 * inscription avant de payer fait fuir une grande partie des acheteurs. Le
 * compte sert à retrouver ses chansons plus tard, pas à passer commande.
 *
 * On rattache donc les commandes après coup : une personne qui commande en
 * invité puis crée un compte avec la même adresse e-mail voit son historique
 * se compléter automatiquement.
 */
export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    phone: text('phone'),
    city: text('city'),
    country: text('country'),

    isActive: boolean('is_active').notNull().default(true),
    /** Jeton de réinitialisation, effacé dès qu'il a servi. */
    resetToken: text('reset_token'),
    resetTokenExpiresAt: timestamp('reset_token_expires_at', { withTimezone: true }),

    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('users_email_unique').on(t.email),
    index('users_created_idx').on(t.createdAt),
  ],
);

/* ------------------------------------------------------------------ */
/*  Types inférés                                                       */
/* ------------------------------------------------------------------ */

export type User = typeof users.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type Package = typeof packages.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type GallerySong = typeof gallerySongs.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type MemoryPage = typeof memoryPages.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type BroadcastList = typeof broadcastLists.$inferSelect;
export type BroadcastContact = typeof broadcastContacts.$inferSelect;
export type BroadcastCampaign = typeof broadcastCampaigns.$inferSelect;
export type DailyStat = typeof dailyStats.$inferSelect;
