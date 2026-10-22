/**
 * Contrat de données partagé entre le front-end et l'API.
 * L'API sérialise toujours en camelCase, en cohérence avec ces types.
 */

export type OrderStatus =
  | 'Nouvelle'
  | 'En cours'
  | 'Terminée'
  | 'Livrée'
  | 'Annulée'
  | 'Commande reçue'
  | 'En attente de paiement'
  | 'Histoire reçue'
  | 'Paroles en préparation'
  | 'Chanson en production'
  | 'En révision'
  | 'Validée'
  | 'Archivée';

export const ORDER_STATUSES: OrderStatus[] = [
  'Nouvelle',
  'Commande reçue',
  'En attente de paiement',
  'Histoire reçue',
  'Paroles en préparation',
  'Validée',
  'Chanson en production',
  'En cours',
  'En révision',
  'Terminée',
  'Livrée',
  'Annulée',
  'Archivée',
];

export type PaymentStatus = 'Unpaid' | 'Pending confirmation' | 'Paid' | 'Refunded';

export const PAYMENT_STATUSES: PaymentStatus[] = [
  'Unpaid',
  'Pending confirmation',
  'Paid',
  'Refunded',
];

/* ------------------------------------------------------------------ */

export interface Package {
  id: string;
  name: string;
  promise: string;
  includes: string[];
  priceCents: number;
  currency: string;
  /** Formaté pour l'affichage, ex. « 20 $ » */
  priceLabel: string;
  deliveryTime: string;
  sortOrder: number;
  isActive: boolean;
  /** À qui ce service s'adresse. */
  targetAudience: string;
  /** Ce que le client doit nous envoyer. */
  clientSends: string;
  /** Ce que le client reçoit. */
  clientReceives: string;
  /** Les étapes de production (3 max). */
  steps: string[];
}

export interface Order {
  id: string;
  reference: string;
  /** Jeton secret permettant au client de suivre sa commande. */
  trackingToken: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;

  customerName: string;
  customerPhone: string;
  customerCity: string;
  customerCountry: string;
  customerEmail?: string | null;
  acceptsWhatsapp: boolean;

  recipientName: string;
  recipientRelationship: string;
  recipientAge?: string | null;
  eventDate?: string | null;

  storyOption: 'write' | 'audio' | 'whatsapp';
  storyText?: string | null;
  storyAudioUrl?: string | null;
  storyPhotoUrl?: string | null;
  importantWords?: string | null;
  avoidWords?: string | null;
  occasion?: string | null;

  mood: string;
  musicStyle: string;
  packageId?: string | null;
  vipCardSelected: boolean;

  amountCents: number;
  currency: string;

  desiredDeliveryDate: string;
  urgency: 'normal' | 'express' | 'super_express';
  specialInstructions?: string | null;

  adminNotes?: string | null;
  finalAudioUrl?: string | null;
  coverImageUrl?: string | null;
  memoryPageId?: string | null;
  songTitle?: string | null;
  finalLyrics?: string | null;
  clientFirstName?: string | null;

  createdAt: string;
  updatedAt: string;
}

/**
 * Vue publique d'une commande, renvoyée par le suivi.
 * Ne contient volontairement aucune donnée personnelle sensible.
 */
export interface PublicOrderTracking {
  reference: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  occasion: string | null;
  recipientFirstName: string | null;
  songTitle: string | null;
  createdAt: string;
  desiredDeliveryDate: string;
  memoryPageId: string | null;
  finalAudioUrl: string | null;
  coverImageUrl: string | null;
}

export interface PaymentInfo {
  id: string;
  status: string;
  method: string;
  amountCents: number;
  currency: string;
  checkoutUrl?: string | null;
  providerRef?: string | null;
  createdAt: string;
}

/* ------------------------------------------------------------------ */

export interface GallerySong {
  id: string;
  title: string;
  occasion: string;
  style: string;
  language: string;
  mood: string;
  description: string;
  audioUrl: string;
  coverUrl: string;
  clientReaction?: string | null;
  clientFirstName?: string | null;
  visibility: 'Private' | 'Public with first name' | 'Public anonymous' | 'Demo only';
  startTime: number;
  endTime?: number | null;
  memorySlug?: string | null;
  isFeatured: boolean;
  createdAt: string;
}

export interface PromotionSettings {
  text: string;
  isActive: boolean;
  bannerStyle: 'marquee' | 'pulse' | 'gold-gradient' | 'classic';
  linkText?: string;
  linkUrl?: string;
}

export interface ClientReview {
  id: string;
  rating: number;
  clientName: string;
  occasion: string;
  comment: string;
  screenshotUrl?: string | null;
  audioTestimonialUrl?: string | null;
  approved: boolean;
  isVerified: boolean;
  orderId?: string | null;
  createdAt: string;
}

/** Avis laissé sous une chanson exemple. */
export interface SongReview {
  id: string;
  songId: string;
  orderId?: string | null;
  clientName: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  approved: boolean;
  createdAt: string;
}

export interface MemoryPage {
  id: string;
  orderId?: string | null;
  eventTitle: string;
  recipientName: string;
  recipientPhotoUrl?: string | null;
  personalMessage: string;
  audioUrl: string;
  coverUrl: string;
  songTitle?: string | null;
  senderName?: string | null;
  occasion?: string | null;
  lyrics?: string | null;
  photoUrl?: string | null;
  createdAt: string;
}

export interface EventReminder {
  id: string;
  customerName: string;
  customerPhone: string;
  eventName: string;
  eventDate: string;
  relationship: string;
  createdAt: string;
}

export interface DashboardStats {
  totalOrders: number;
  delivered: number;
  pendingPayment: number;
  totalRevenueCents: number;
  currency: string;
  clientSatisfaction: number;
  averageRating: number;
  visitsCount: number;
  listensCount: number;

  /** Lecture d'ensemble ajoutée pour le tableau de bord. */
  ordersThisMonth: number;
  revenueThisMonthCents: number;
  averageOrderCents: number;
  ordersByStatus: { status: string; count: number }[];
  topPackages: { name: string; count: number; revenueCents: number }[];
  recentOrders: {
    id: string;
    reference: string;
    status: string;
    paymentStatus: string;
    customerName: string;
    packageName: string;
    amountCents: number;
    currency: string;
    desiredDeliveryDate: string | null;
    createdAt: string;
  }[];
  totalClients: number;
  clientsWithAccount: number;

  dailyStats: { date: string; visits: number; listens: number; orders: number }[];
}

export interface BroadcastContact {
  id: string;
  name: string;
  phone: string;
  category: string;
  addedAt: string;
}

export interface BroadcastList {
  id: string;
  name: string;
  description: string;
  contacts: BroadcastContact[];
  createdAt: string;
}

export interface BroadcastCampaign {
  id: string;
  title: string;
  messageTemplate: string;
  targetListId?: string | null;
  targetListName?: string | null;
  status: 'Brouillon' | 'En cours' | 'Envoyé';
  sentCount: number;
  totalCount: number;
  sentAt?: string | null;
  logs: {
    contactName: string;
    phone: string;
    status: 'Succès' | 'Échoué';
    time: string;
    error?: string;
  }[];
}

/* ------------------------------------------------------------------ */

export interface AdminSession {
  email: string;
  name: string;
  role: string;
}

export interface NetworkOption {
  code: string;
  name: string;
}

export interface Money {
  cents: number;
  currency: string;
  label: string;
}

/* ------------------------------------------------------------------ */
/*  Compte client                                                       */
/* ------------------------------------------------------------------ */

export interface ClientUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  city: string | null;
  country: string | null;
  createdAt: string;
}

/**
 * Une commande vue par son propriétaire.
 *
 * Volontairement plus restreinte que la vue du studio : ni notes internes,
 * ni instructions de production — uniquement de quoi suivre et récupérer
 * sa chanson.
 */
export interface ClientOrder {
  id: string;
  reference: string;
  trackingToken: string;
  status: string;
  paymentStatus: string;
  packageName: string;
  amountCents: number | null;
  currency: string | null;
  recipientName: string;
  occasion: string | null;
  songTitle: string | null;
  finalAudioUrl: string | null;
  coverImageUrl: string | null;
  memoryPageId: string | null;
  desiredDeliveryDate: string | null;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Analyse complète du studio                                          */
/* ------------------------------------------------------------------ */

export interface AudienceResume {
  visiteurs: number;
  pagesVues: number;
  nouveaux: number;
  revenus: number;
  pagesParVisite: number;
}

export interface Repartition {
  cle: string;
  total: number;
}

export interface Analytics {
  periodeJours: number;

  audience: AudienceResume;
  audience7: AudienceResume;
  audienceAujourdhui: AudienceResume;
  serieQuotidienne: { date: string; visiteurs: number; pagesVues: number }[];
  pagesLesPlusVues: Repartition[];
  sources: Repartition[];
  appareils: Repartition[];
  pays: Repartition[];

  ventes: {
    chiffreAffairesCents: number;
    commandesPayees: number;
    panierMoyenCents: number;
    chiffreAffairesMoisCents: number;
    commandesMois: number;
    tauxConversion: number | null;
    serieVentes: { date: string; montantCents: number }[];
  };

  commandes: {
    total: number;
    parStatut: Record<string, number>;
    dernieres: {
      id: string;
      reference: string;
      status: string;
      paymentStatus: string;
      customerName: string;
      amountCents: number;
      currency: string;
      createdAt: string;
    }[];
    enCours: number;
    livrees: number;
  };

  utilisateurs: {
    total: number;
    actifs: number;
    recents: {
      id: string;
      name: string;
      email: string;
      city: string | null;
      country: string | null;
      lastLoginAt: string | null;
      createdAt: string;
    }[];
  };

  whatsapp: {
    total: number;
    numeros: {
      nom: string;
      telephone: string;
      ville: string;
      commandes: number;
      dernier: string | null;
    }[];
  };

  paiements: {
    id: string;
    orderId: string | null;
    amountCents: number;
    currency: string;
    status: string;
    provider: string;
    createdAt: string;
  }[];
}

/* ------------------------------------------------------------------ */
/*  Vitrine : ce que le studio pilote depuis les réglages               */
/* ------------------------------------------------------------------ */

export interface HomeConfig {
  hero: {
    videoUrl: string;
    webmUrl: string;
    posterUrl: string;
  };
  promo: {
    actif: boolean;
    texte: string;
    sousTexte: string;
    forme: 'pastille' | 'ruban' | 'eclair';
    couleur: 'vert' | 'rouge' | 'or' | 'bleu';
    position: 'gauche' | 'droite';
  };
  vitrine: {
    chansons: 3 | 6 | 10;
    avis: 3 | 6;
  };
  emplacements: { id: SectionAccueil; visible: boolean }[];
}

export type SectionAccueil =
  | 'processus'
  | 'formules'
  | 'ecouter'
  | 'avis'
  | 'tranquillite'
  | 'cta';

export interface NotificationStudio {
  id: string;
  type: 'commande' | 'paiement' | 'avis';
  titre: string;
  detail: string;
  date: string;
  lien?: string;
}
