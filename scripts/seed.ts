/**
 * Amorçage : compte administrateur, formules, réglages.
 *
 * Usage : npm run db:seed
 *
 * Les données de démonstration ne sont insérées QUE si SEED_DEMO=true,
 * afin de ne jamais polluer une base de production avec de faux clients.
 */

import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db, closeDb } from '../api/_lib/db/index.js';
import { hashPassword } from '../api/_lib/auth.js';
import {
  adminUsers,
  dailyStats,
  gallerySongs,
  packages,
  reviews,
  settings,
} from '../api/_lib/db/schema.js';

const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? '';

if (email && password.length < 8) {
  console.error('✗ ADMIN_PASSWORD doit contenir au moins 8 caractères.');
  process.exit(1);
}

/* --------------------------- Formules --------------------------- */

const DEFAULT_PACKAGES = [
  {
    id: 'pack_simple',
    name: 'Chanson Simple',
    promise: 'Un message court transformé en chanson touchante.',
    includes: [
      'Chanson personnalisée courte',
      'Durée : 1 à 2 minutes',
      'Format MP3',
      '1 révision des paroles',
    ],
    priceCents: 2000,
    currency: 'USD',
    deliveryTime: '5 jours',
    sortOrder: 1,
  },
  {
    id: 'pack_musique_video',
    name: 'Musique + Vidéo',
    promise: 'Votre histoire transformée en chanson complète avec vidéo souvenir.',
    includes: [
      'Chanson personnalisée complète',
      'Montage vidéo avec vos photos',
      'Format MP3 + WAV',
      'Couverture personnalisée',
      'Page souvenir privée avec QR code',
    ],
    priceCents: 5000,
    currency: 'USD',
    deliveryTime: '3 jours',
    sortOrder: 2,
  },
  {
    id: 'pack_premium_vip',
    name: 'Premium VIP',
    promise: 'L’expérience VOXMORY complète pour créer un souvenir haut de gamme.',
    includes: [
      'Chanson premium longue',
      'Montage vidéo prestige',
      'Couverture premium',
      'Page souvenir privée à vie',
      'Révisions prioritaires avant production',
      'Assistance WhatsApp VIP',
    ],
    priceCents: 10000,
    currency: 'USD',
    deliveryTime: '24 heures',
    sortOrder: 3,
  },
  {
    id: 'pack_presentiel',
    name: 'Prestation Présentielle',
    promise: 'VOXMORY se déplace pour transformer votre événement en moment inoubliable.',
    includes: [
      'Prestation live devant vos invités',
      'Présence de l’équipe VOXMORY',
      'Chanson personnalisée qualité studio',
      'Vidéo souvenir de la prestation',
      'Carte VIP + certificat souvenir',
      'Organisation sur réservation',
    ],
    priceCents: 100000,
    currency: 'USD',
    deliveryTime: 'Sur réservation',
    sortOrder: 4,
  },
];

console.log('→ Formules…');
for (const pkg of DEFAULT_PACKAGES) {
  const [existing] = await db.select().from(packages).where(eq(packages.id, pkg.id)).limit(1);
  if (existing) {
    await db
      .update(packages)
      .set({
        name: pkg.name,
        promise: pkg.promise,
        includes: pkg.includes,
        deliveryTime: pkg.deliveryTime,
        sortOrder: pkg.sortOrder,
      })
      .where(eq(packages.id, pkg.id));
    console.log(`  ~ ${pkg.name} (prix conservé)`);
  } else {
    await db.insert(packages).values({ ...pkg, isActive: true });
    console.log(`  + ${pkg.name}`);
  }
}

/* ---------------------- Administrateur ---------------------- */

console.log('→ Administrateur…');
if (email && password) {
  const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  if (existing) {
    console.log(`  ~ Le compte ${email} existe déjà (mot de passe inchangé).`);
  } else {
    await db.insert(adminUsers).values({
      id: crypto.randomUUID(),
      email,
      passwordHash: await hashPassword(password),
      name: 'Administrateur VOXMORY',
      role: 'admin',
      isActive: true,
    });
    console.log(`  + Compte créé : ${email}`);
  }
} else {
  console.log('  ! ADMIN_EMAIL / ADMIN_PASSWORD non définis — aucun compte créé.');
}

/* -------------------------- Réglages -------------------------- */

console.log('→ Réglages…');
for (const [key, value] of [
  ['visitsCount', 0],
  ['listensCount', 0],
  [
    'promotion',
    {
      text: 'Offre spéciale : -15 % sur toutes les rumbas avec le code VOX15 !',
      isActive: false,
      bannerStyle: 'marquee',
      linkText: 'En savoir plus',
      linkUrl: '#tarifs',
    },
  ],
] as const) {
  const [existing] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  if (!existing) {
    await db.insert(settings).values({ key, value: value as Record<string, unknown> });
  }
}

/* --------------- Données de démonstration --------------- */

if (process.env.SEED_DEMO === 'true') {
  console.log('→ Données de démonstration…');
  const [anySong] = await db.select().from(gallerySongs).limit(1);
  if (!anySong) {
    await db.insert(gallerySongs).values({
      id: crypto.randomUUID(),
      title: 'Extrait de démonstration',
      occasion: 'Anniversaire',
      style: 'Rumba congolaise',
      language: 'Français',
      mood: 'Chaleureux',
      description: 'Extrait à remplacer par vos vraies créations.',
      audioUrl: '',
      coverUrl: '',
      clientFirstName: 'Démo',
      visibility: 'Demo only',
      startTime: 0,
      endTime: 60,
      isFeatured: false,
    });
  }
  const [anyReview] = await db.select().from(reviews).limit(1);
  if (!anyReview) {
    await db.insert(reviews).values({
      id: crypto.randomUUID(),
      rating: 5,
      clientName: 'Témoignage de démonstration',
      occasion: 'Anniversaire',
      comment: 'À remplacer par les vrais retours de vos clients.',
      approved: false,
    });
  }
  const [anyStat] = await db.select().from(dailyStats).limit(1);
  if (!anyStat) {
    const today = new Date().toISOString().slice(0, 10);
    await db.insert(dailyStats).values({ date: today, visits: 0, listens: 0, orders: 0 });
  }
  console.log('  + insérées.');
} else {
  console.log('→ Démonstration ignorée (SEED_DEMO=true pour l’activer).');
}

console.log('\n✓ Amorçage terminé.');
await closeDb();
process.exit(0);
