import type { SeoData } from '../hooks/useSEO.js';

/**
 * Référencement de chaque écran.
 *
 * Les titres sont rédigés pour répondre à une recherche précise, pas pour
 * « faire joli » : « chanson personnalisée mariage RDC » est la requête d'un
 * client prêt à commander, « Nos formules » n'est celle de personne.
 *
 * Règle de longueur : 60 caractères pour le titre, 155 pour la description.
 * Au-delà, Google tronque.
 */

interface RouteSeo extends SeoData {
  h1: string;
}

/** Correspondance entre l'identifiant technique et l'adresse publique. */
export const PACK_SLUGS: Record<string, string> = {
  pack_simple: 'chanson-simple',
  pack_musique_video: 'musique-video',
  pack_premium_vip: 'premium-vip',
  pack_presentiel: 'prestation-presentielle',
  pack_pub: 'chanson-publicitaire',
  pack_collab: 'collaboration-musique',
  pack_clip: 'tournage-clip-video',
};

/** Inverse : retrouver l'identifiant depuis l'adresse. */
export function slugToPackId(slug: string): string | undefined {
  return Object.keys(PACK_SLUGS).find((id) => PACK_SLUGS[id] === slug);
}

const PACK_SEO: Record<string, RouteSeo> = {
  pack_simple: {
    title: 'Chanson Personnalisée pour Mariage ou Anniversaire | VOXMORY',
    description:
      "Offrez une chanson écrite et enregistrée rien que pour vous : voix professionnelle, texte sur-mesure, livraison en 5 jours. Dès 20 $. Paiement Mobile Money accepté.",
    path: '/pack/chanson-simple',
    h1: 'Votre chanson personnalisée, écrite pour vous',
  },
  pack_musique_video: {
    title: 'Chanson Personnalisée + Clip Vidéo Souvenir | VOXMORY',
    description:
      "Une chanson originale accompagnée d'un clip vidéo monté avec vos photos. Le cadeau qui fait pleurer (de joie) à coup sûr. Livraison en 7 jours, dès 50 $.",
    path: '/pack/musique-video',
    h1: 'La chanson, et le clip qui la porte',
  },
  pack_premium_vip: {
    title: 'Chanson Premium VIP — Production Studio Complète | VOXMORY',
    description:
      "Production haut de gamme : arrangement complet, mixage studio, livraison prioritaire en 3 jours et page souvenir personnalisée. Pour les occasions qui comptent vraiment.",
    path: '/pack/premium-vip',
    h1: 'La production studio, sans compromis',
  },
  pack_presentiel: {
    title: 'Prestation Présentielle — Chanteur Live à Kinshasa | VOXMORY',
    description:
      "Nos artistes se déplacent chez vous ou sur votre événement à Kinshasa : mariage, anniversaire, hommage. Une chanson créée pour l'instant, chantée en direct.",
    path: '/pack/prestation-presentielle',
    h1: 'Votre chanson, chantée devant vous',
  },
  pack_pub: {
    title: 'Chanson Publicitaire & Jingle Entreprise dès 35 $ | VOXMORY',
    description:
      "Boostez votre marque ou boutique avec un jingle musical original : paroles sur-mesure, voix studio, livraison rapide en 5 jours dès 35 $.",
    path: '/pack/chanson-publicitaire',
    h1: 'Votre chanson publicitaire sur-mesure',
  },
  pack_collab: {
    title: 'Collaboration Musicale à Distance — Production Studio | VOXMORY',
    description:
      "Vous avez une voix ou une idée ? Notre studio produit votre instru, mixe et masterise votre chanson à distance dès 50 $.",
    path: '/pack/collaboration-musique',
    h1: 'Produisez votre chanson avec notre studio',
  },
  pack_clip: {
    title: 'Tournage & Montage de Clip Vidéo Musical | VOXMORY',
    description:
      "Donnez une image professionnelle à votre chanson : montage vidéo, habillage graphique et clip musical complet dès 500 $.",
    path: '/pack/tournage-clip-video',
    h1: 'Le clip vidéo qui sublime votre musique',
  },
};

const ROUTES: Record<string, RouteSeo> = {
  home: {
    title: 'Chanson personnalisée & jingle entreprise | VOXMORY',
    description:
      "Offrez une chanson écrite avec votre histoire : mariage, anniversaire, hommage. Nous créons aussi votre chanson publicitaire d'entreprise dès 35 $. Rumba, Afrobeat, Gospel. Livraison sur WhatsApp en RDC.",
    path: '/',
    h1: 'Votre histoire mérite une chanson',
  },
  order: {
    title: 'Commander ma Chanson Personnalisée | VOXMORY',
    description:
      "Racontez votre histoire en deux minutes : texte, audio ou WhatsApp. Nos paroliers et compositeurs s'occupent du reste. Chanson publicitaire pour entreprise dès 35 $. Paiement Mobile Money sécurisé.",
    path: '/commander',
    h1: 'Racontez-nous votre histoire',
  },
  gallery: {
    title: 'Écouter nos Chansons Personnalisées (Exemples) | VOXMORY',
    description:
      "Écoutez des chansons déjà livrées : rumba pour un mariage, hommage à une maman, anniversaire surprise. Jugez la qualité studio avant de commander.",
    path: '/exemples',
    h1: 'Écoutez ce que nous avons déjà créé',
  },
  reviews: {
    title: 'Avis Clients — Ils ont offert une Chanson VOXMORY | VOXMORY',
    description:
      "Découvrez les témoignages de ceux qui ont offert une chanson personnalisée. Vous aussi, laissez le vôtre : chaque retour aide un proche à franchir le pas.",
    path: '/avis',
    h1: "Ce qu'en disent ceux qui ont offert une chanson",
  },
  pricing: {
    title: 'Tarifs Chanson Personnalisée : dès 20 $ | VOXMORY',
    description:
      "Quatre formules, de la chanson simple à la prestation live à Kinshasa. Prix clairs, sans surprise, paiement Mobile Money ou carte. Livraison dès 3 jours.",
    path: '/tarifs',
    h1: 'Nos formules',
  },
  account: {
    title: 'Connexion — Mon espace VOXMORY',
    description:
      "Connectez-vous pour retrouver vos chansons et suivre vos commandes. Pas encore de compte ? Créez-en un en trente secondes.",
    path: '/compte',
    h1: 'Mon espace',
  },
  myaccount: {
    title: 'Mes Chansons — Mon espace VOXMORY',
    description:
      "Retrouvez toutes vos chansons personnalisées, suivez l'avancement de vos commandes et téléchargez vos fichiers audio.",
    path: '/mon-compte',
    h1: 'Mon espace',
  },
  tracking: {
    title: 'Suivre ma Commande de Chanson | VOXMORY',
    description:
      "Suivez l'avancement de votre chanson en temps réel : écriture, composition, enregistrement, livraison. Entrez simplement votre numéro de commande.",
    path: '/suivi',
    h1: 'Où en est votre chanson ?',
  },
  admin: {
    title: 'Espace Studio — Administration VOXMORY',
    description: 'Gestion du studio VOXMORY.',
    path: '/admin',
    h1: 'Espace Studio',
  },
  install: {
    title: "Installer l'application VOXMORY sur votre téléphone",
    description:
      "Ajoutez VOXMORY à votre écran d'accueil : accès en un geste, lecture de vos chansons même avec une connexion faible. Guide pas à pas pour Android et iPhone.",
    path: '/installer',
    h1: "Installer l'application VOXMORY",
  },
  /**
   * Repli pour les pages souvenir : leur véritable titre est posé par la page
   * elle-même une fois la chanson chargée (prénom, occasion, dédicace).
   */
  memory: {
    title: 'Chanson personnalisée offerte — Page souvenir | VOXMORY',
    description:
      'Écoutez une chanson personnalisée créée par le studio VOXMORY : paroles sur-mesure, dédicace et lecture en ligne.',
    path: '/memory',
    h1: 'Une chanson offerte, un souvenir à garder',
  },
};

/**
 * Adresse publique d'un écran. Les noms gardés en interne (« pricing »)
 * sont traduits en mots-clés (« /tarifs »), meilleurs pour le référencement.
 */
export const PAGE_PATHS: Record<string, string> = {
  home: '/',
  order: '/commander',
  gallery: '/exemples',
  reviews: '/avis',
  pricing: '/tarifs',
  tracking: '/suivi',
  account: '/compte',
  myaccount: '/mon-compte',
  admin: '/admin',
  install: '/installer',
};

/** Retrouve l'écran interne depuis une adresse publique. */
export function pathToPage(pathname: string): { page: string; param: string } {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  if (!clean) return { page: 'home', param: '' };

  const [first, second] = clean.split('/');

  if (first === 'pack' && second) return { page: 'pack', param: second };
  if (first === 'memory' && second) return { page: 'memory', param: second };
  if (first === 'admin' || first === 'studio') return { page: 'admin', param: '' };

  const entry = Object.entries(PAGE_PATHS).find(([, p]) => p === `/${first}`);
  if (entry) return { page: entry[0], param: '' };

  // Anciennes adresses en « # » : on les traduit plutôt que de perdre le visiteur.
  if (second === undefined) {
    const legacy: Record<string, string> = {
      home: 'home', gallery: 'gallery', reviews: 'reviews',
      pricing: 'pricing', tracking: 'tracking', order: 'order',
    };
    if (legacy[first]) return { page: legacy[first], param: '' };
  }

  return { page: 'home', param: '' };
}

export function getPackSeo(packId: string): RouteSeo | undefined {
  return PACK_SEO[packId];
}

export function getRouteSeo(page: string): RouteSeo {
  return ROUTES[page] ?? ROUTES.home;
}
