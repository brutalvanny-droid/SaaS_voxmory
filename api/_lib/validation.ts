import { z } from 'zod';

/**
 * Toutes les entrées sont validées côté serveur.
 * Les schémas « stricts » rejettent les champs inconnus : un client ne peut
 * donc pas s'attribuer un statut de paiement ou un prix de son choix.
 */

/* ------------------------------------------------------------------ */
/*  Utilitaires                                                         */
/* ------------------------------------------------------------------ */

/**
 * Numéro de téléphone international, tolérant sur la saisie.
 * Le contrôle passe par `regex` plutôt que `refine` : l'inférence de type
 * reste ainsi un `string` ferme, sans `undefined` résiduel.
 */
export const phoneSchema = z
  .string()
  .trim()
  .min(7, 'Numéro de téléphone trop court.')
  .max(20, 'Numéro de téléphone trop long.')
  .regex(/^\+?[0-9\s().-]{7,20}$/, 'Format de numéro invalide.')
  .transform((v) => v.replace(/[\s().-]/g, ''));

const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .nullable();

const requiredText = (label: string, min = 2, max = 200) =>
  z.string().trim().min(min, `${label} est requis.`).max(max, `${label} est trop long.`);

/* ------------------------------------------------------------------ */
/*  Authentification                                                    */
/* ------------------------------------------------------------------ */

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Adresse e-mail invalide.').max(200),
  password: z.string().min(8, 'Mot de passe invalide.').max(200),
});

/* ------------------------------------------------------------------ */
/*  Commandes — création publique                                       */
/* ------------------------------------------------------------------ */

export const createOrderSchema = z
  .object({
    customerName: requiredText('Le nom du client', 2, 120),
    customerPhone: phoneSchema,
    customerCity: requiredText('La ville', 2, 100),
    customerCountry: requiredText('Le pays', 2, 100),
    customerEmail: z
      .string()
      .trim()
      .email('Adresse e-mail invalide.')
      .max(200)
      .optional()
      .or(z.literal(''))
      .transform((v) => (v ? v : null))
      .nullable(),
    /**
     * Consentement WhatsApp — recommandé, jamais obligatoire.
     *
     * L'exiger bloquait la commande des clients sans WhatsApp, alors même
     * que la livraison peut se faire par e-mail. Le téléphone reste
     * obligatoire par ailleurs : le studio garde toujours un moyen de
     * joindre le client.
     */
    acceptsWhatsapp: z.boolean(),

    recipientName: requiredText('Le nom du destinataire', 2, 120),
    recipientRelationship: requiredText('Le lien avec le destinataire', 2, 100),
    recipientAge: optionalText(20),
    eventDate: optionalText(50),

    storyOption: z.enum(['write', 'audio', 'whatsapp']),
    storyText: optionalText(8000),
    storyAudioUrl: optionalText(500),
    storyPhotoUrl: optionalText(500),
    importantWords: optionalText(500),
    avoidWords: optionalText(500),
    occasion: optionalText(100),

    mood: requiredText("L'ambiance", 2, 80),
    musicStyle: requiredText('Le style musical', 2, 80),
    packageId: z.string().trim().min(1).max(60),
    vipCardSelected: z.boolean().default(false),

    desiredDeliveryDate: optionalText(50),
    urgency: z.enum(['normal', 'express', 'super_express']).default('normal'),
    specialInstructions: optionalText(2000),
  })
  .refine(
    (d) => d.storyOption !== 'write' || (d.storyText ?? '').length >= 15,
    { message: "L'histoire doit contenir au moins 15 caractères.", path: ['storyText'] },
  )
  .refine(
    (d) => d.storyOption !== 'audio' || Boolean(d.storyAudioUrl),
    { message: 'Un fichier audio est requis.', path: ['storyAudioUrl'] },
  );

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/** Mise à jour par l'administrateur : champs de production uniquement. */
export const updateOrderSchema = z.object({
  status: z.string().trim().max(60).optional(),
  paymentStatus: z.string().trim().max(60).optional(),
  adminNotes: z.string().max(8000).optional(),
  finalAudioUrl: z.string().trim().max(700).optional(),
  coverImageUrl: z.string().trim().max(700).optional(),
  songTitle: z.string().trim().max(200).optional(),
  finalLyrics: z.string().max(20000).optional(),
  clientFirstName: z.string().trim().max(100).optional(),
  memoryPageId: z.string().trim().max(200).optional(),
  desiredDeliveryDate: z.string().trim().max(50).optional(),
  urgency: z.enum(['normal', 'express', 'super_express']).optional(),
}).strict();

/* ------------------------------------------------------------------ */
/*  Paiement                                                            */
/* ------------------------------------------------------------------ */

export const initPaymentSchema = z.object({
  method: z.enum(['checkout', 'softpay']).default('checkout'),
  country: z.string().trim().length(2).default('CD'),
  network: z.string().trim().max(40).optional(),
  phone: phoneSchema.optional(),
});

/* ------------------------------------------------------------------ */
/*  Avis clients                                                        */
/* ------------------------------------------------------------------ */

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  clientName: requiredText('Le nom', 2, 100),
  occasion: requiredText("L'occasion", 2, 100),
  comment: z
    .string()
    .trim()
    .min(10, 'Le témoignage doit contenir au moins 10 caractères.')
    .max(2000),
  screenshotUrl: optionalText(500),
  audioTestimonialUrl: optionalText(500),
});

export const updateReviewSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    clientName: requiredText('Le nom', 2, 100).optional(),
    occasion: z.string().trim().max(100).optional(),
    comment: z.string().trim().min(10).max(2000).optional(),
    approved: z.boolean().optional(),
  })
  .strict();

/* ------------------------------------------------------------------ */
/*  Offres, galerie, pages souvenir                                     */
/* ------------------------------------------------------------------ */

export const updatePackageSchema = z
  .object({
    name: z.string().trim().max(120).optional(),
    promise: z.string().max(500).optional(),
    includes: z.array(z.string().max(300)).max(30).optional(),
    priceCents: z.coerce.number().int().min(0).max(100_000_000).optional(),
    currency: z.string().trim().length(3).optional(),
    deliveryTime: z.string().trim().max(80).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const gallerySongSchema = z.object({
  title: requiredText('Le titre', 1, 200),
  occasion: optionalText(100),
  style: optionalText(100),
  language: optionalText(100),
  mood: optionalText(100),
  description: optionalText(2000),
  audioUrl: z.string().trim().max(700).default(''),
  coverUrl: z.string().trim().max(700).default(''),
  clientReaction: optionalText(2000),
  clientFirstName: optionalText(100),
  visibility: z
    .enum(['Private', 'Public with first name', 'Public anonymous', 'Demo only'])
    .default('Private'),
  startTime: z.coerce.number().int().min(0).default(0),
  endTime: z.coerce.number().int().min(1).max(3600).nullable().optional(),
  memorySlug: optionalText(200),
  isFeatured: z.boolean().default(false),
});

export const memoryPageSchema = z.object({
  id: z.string().trim().max(200).optional(),
  orderId: z.string().trim().max(60).nullable().optional(),
  eventTitle: requiredText("Le titre de l'événement", 2, 200),
  recipientName: requiredText('Le nom du destinataire', 1, 120),
  recipientPhotoUrl: optionalText(700),
  personalMessage: z.string().trim().max(4000).default(''),
  audioUrl: z.string().trim().max(700).default(''),
  coverUrl: z.string().trim().max(700).default(''),
  songTitle: optionalText(200),
  senderName: optionalText(100),
  occasion: optionalText(100),
  lyrics: z.string().max(20000).nullable().optional(),
  photoUrl: optionalText(700),
});

export const promotionSchema = z.object({
  text: z.string().trim().max(300).default(''),
  isActive: z.boolean().default(false),
  bannerStyle: z.enum(['marquee', 'pulse', 'gold-gradient', 'classic']).default('classic'),
  linkText: optionalText(60),
  linkUrl: optionalText(300),
});

/* ------------------------------------------------------------------ */
/*  Rappels & diffusion                                                 */
/* ------------------------------------------------------------------ */

export const reminderSchema = z.object({
  customerName: requiredText('Le nom du client', 2, 120),
  customerPhone: phoneSchema,
  eventName: requiredText("Le nom de l'événement", 2, 120),
  eventDate: requiredText('La date', 4, 50),
  relationship: optionalText(100),
});

export const broadcastListSchema = z.object({
  name: requiredText('Le nom de la liste', 2, 120),
  description: optionalText(500),
});

export const broadcastCampaignSchema = z.object({
  title: requiredText('Le titre', 2, 150),
  messageTemplate: z.string().trim().min(5).max(4000),
  targetListId: z.string().trim().max(60).optional(),
});

export const sendWhatsappSchema = z.object({
  phone: phoneSchema,
  message: z.string().trim().min(1).max(4000),
});

/* ------------------------------------------------------------------ */
/*  Assistant IA                                                        */
/* ------------------------------------------------------------------ */

export const aiSchema = z
  .object({
    kind: z.enum([
      'transcribe',
      'summarize',
      'brief',
      'lyrics',
      'suno',
      'cover',
      'video',
      'whatsapp',
      'testimonial',
      'followup',
    ]),
    orderId: z.string().trim().max(60).optional(),
    storyText: z.string().max(20000).optional(),
    mood: z.string().trim().max(100).optional(),
    musicStyle: z.string().trim().max(100).optional(),
    recipientName: z.string().trim().max(120).optional(),
    customerName: z.string().trim().max(120).optional(),
    importantWords: z.string().max(500).optional(),
    avoidWords: z.string().max(500).optional(),
    occasion: z.string().trim().max(100).optional(),
    audioFilename: z.string().trim().max(300).optional(),
    memoryPageUrl: z.string().trim().max(500).optional(),
    eventName: z.string().trim().max(150).optional(),
    relationship: z.string().trim().max(100).optional(),
    eventDate: z.string().trim().max(50).optional(),
  })
  .strict();

/* ------------------------------------------------------------------ */
/*  Comptes clients                                                     */
/* ------------------------------------------------------------------ */

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Votre nom est trop court.').max(120),
  email: z.string().trim().toLowerCase().email('Adresse e-mail invalide.'),
  password: z
    .string()
    .min(8, 'Choisissez un mot de passe d\'au moins 8 caractères.')
    .max(200),
  phone: z.string().trim().max(40).optional(),
});

export const clientLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  city: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Au moins 8 caractères.').max(200),
});

export const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetSchema = z.object({
  token: z.string().trim().min(20),
  password: z.string().min(8, 'Au moins 8 caractères.').max(200),
});
