/**
 * Pixel Meta + relais vers l'API Conversions.
 *
 * Deux canaux, un seul identifiant d'événement.
 *
 * 1. **Le pixel navigateur** (`fbevents.js`) enregistre l'événement dans le
 *    navigateur et pose les cookies `_fbp` / `_fbc` qui servent au
 *    rapprochement publicitaire.
 * 2. **Le relais serveur** (`/api/meta/event`) renvoie le même événement
 *    depuis nos serveurs, avec l'adresse IP réelle et l'agent utilisateur.
 *
 * Les deux portent le **même `event_id`** : sans cela, Meta compterait
 * chaque visite deux fois et les statistiques seraient fausses. C'est le
 * piège classique d'une installation CAPI.
 *
 * Tout est silencieux : si le pixel ne charge pas, si l'identifiant est
 * absent ou si le réseau tombe, le site se comporte exactement comme avant.
 */

type CustomData = {
  value?: number;
  currency?: string;
  content_name?: string;
  content_ids?: string[];
  content_type?: 'product' | 'product_group';
  num_items?: number;
  order_id?: string;
  status?: string;
};

interface TrackOptions {
  /** Identifiant imposé (indispensable pour le dédoublonnage). */
  eventId?: string;
  customData?: CustomData;
}

/** Clé locale permettant à un visiteur de refuser la mesure. */
const CLE_REFUS = 'voxmory_mesure_refusee';

let initialise = false;
let desactive = false;

function identifiantPixel(): string {
  // Accès littéral obligatoire : c'est la seule forme que Vite remplace au
  // moment du build. Une lecture dynamique renverrait undefined.
  return (import.meta.env.VITE_META_PIXEL_ID ?? '').trim();
}

/**
 * Le visiteur a-t-il demandé à ne pas être mesuré ?
 *
 * `Do Not Track` est respecté, ainsi qu'un refus explicite enregistré sur
 * l'appareil. Un site qui ignore ce signal n'est pas seulement impoli :
 * c'est un risque juridique dès qu'il diffuse hors de RDC.
 */
function mesureRefusee(): boolean {
  try {
    if (localStorage.getItem(CLE_REFUS) === '1') return true;
  } catch {
    /* stockage indisponible : on continue, rien n'est bloquant */
  }

  const dnt =
    navigator.doNotTrack ??
    (window as unknown as { doNotTrack?: string }).doNotTrack ??
    (navigator as unknown as { msDoNotTrack?: string }).msDoNotTrack;

  return dnt === '1' || dnt === 'yes';
}

/** Identifiant unique d'événement, compatible avec les vieux navigateurs. */
function nouvelIdentifiant(): string {
  const c = crypto as Crypto & { randomUUID?: () => string };
  if (typeof c?.randomUUID === 'function') return c.randomUUID();
  return `ev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

/** File d'attente locale, comme le fait le fragment officiel de Meta. */
type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string };

function installerFile(): Fbq {
  const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };
  if (w.fbq) return w.fbq;

  const fbq = function (...args: unknown[]) {
    if (fbq.loaded && typeof (fbq as unknown as { callMethod?: (...a: unknown[]) => void }).callMethod === 'function') {
      (fbq as unknown as { callMethod: (...a: unknown[]) => void }).callMethod(...args);
      return;
    }
    fbq.queue?.push(args);
  } as Fbq;

  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = '2.0';

  w.fbq = fbq;
  w._fbq = fbq;
  return fbq;
}

/**
 * Initialise le pixel une seule fois.
 *
 * À appeler au premier rendu. Sans identifiant configuré, la fonction ne
 * fait rien : le site reste identique, simplement non mesuré.
 */
export function initMetaPixel(): void {
  if (initialise || desactive) return;

  const id = identifiantPixel();
  if (!id) {
    // Visible en console : sans ce message, une mesure absente ressemble à
    // une panne de Meta alors qu'il manque simplement une variable.
    console.info('[Meta] Pixel non configuré (VITE_META_PIXEL_ID absent).');
    desactive = true;
    return;
  }
  if (mesureRefusee()) {
    console.info('[Meta] Mesure désactivée : le visiteur a demandé à ne pas être suivi.');
    desactive = true;
    return;
  }

  try {
    const fbq = installerFile();
    fbq('init', id);

    if (!document.getElementById('meta-pixel-script')) {
      const script = document.createElement('script');
      script.id = 'meta-pixel-script';
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      script.onerror = () => {
        // Réseau bloqué : le relais serveur prend le relais, on ne casse rien.
        console.warn('[Meta] Pixel indisponible — mesure serveur uniquement.');
      };
      document.head.appendChild(script);
    }

    initialise = true;
  } catch {
    desactive = true;
  }
}

/**
 * Envoie un événement aux deux canaux.
 *
 * Ne lève jamais et n'attend jamais la réponse serveur : une mesure ne doit
 * pas retarder une navigation ou un clic WhatsApp.
 */
export function trackMeta(eventName: string, options: TrackOptions = {}): void {
  const id = options.eventId ?? nouvelIdentifiant();

  try {
    initMetaPixel();
    if (!desactive) {
      const w = window as unknown as { fbq?: Fbq };
      w.fbq?.('track', eventName, options.customData ?? {}, { eventID: id });
    }
  } catch {
    /* le pixel ne doit jamais casser la page */
  }

  try {
    void fetch('/api/meta/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // `keepalive` : l'événement survit à un clic qui ouvre WhatsApp.
      keepalive: true,
      body: JSON.stringify({
        eventName,
        eventId: id,
        eventTime: Math.floor(Date.now() / 1000),
        eventSourceUrl: window.location.href,
        ...(options.customData ? { customData: options.customData } : {}),
      }),
    }).catch(() => {});
  } catch {
    /* idem */
  }
}

/* ------------------------------------------------------------------ */
/*  Événements du site                                                  */
/* ------------------------------------------------------------------ */

/** Vue de page — à chaque changement de route, pas seulement au chargement. */
export function trackPageView(path: string): void {
  trackMeta('PageView', {
    customData: { content_name: path },
  });
}

/**
 * Vue d'une page « produit » : une formule, un exemple, une page souvenir.
 * Les paramètres sont ceux que Meta attend pour optimiser sur la valeur.
 */
export function trackViewContent(
  path: string,
  contenu: { id: string; name: string; value?: number; currency?: string },
): void {
  trackMeta('ViewContent', {
    customData: {
      content_name: contenu.name,
      content_ids: [contenu.id],
      content_type: 'product',
      ...(typeof contenu.value === 'number'
        ? { value: contenu.value, currency: contenu.currency ?? 'USD' }
        : {}),
      status: path,
    },
  });
}

/**
 * Prise de contact.
 *
 * Déclenché au clic sur un lien WhatsApp : c'est l'équivalent d'un
 * formulaire rempli, puisque la conversation est le vrai début du parcours.
 */
export function trackContact(page: string, libelle?: string): void {
  trackMeta('Contact', {
    customData: { content_name: libelle ?? page, status: page },
  });
}

/**
 * Début de commande.
 *
 * Envoyé au moment où la commande est réellement créée (pas à l'ouverture
 * du formulaire) : c'est le seul instant où l'on connaît la formule et le
 * montant choisis. L'identifiant est imposé — `checkout_<référence>` — pour
 * que le serveur envoie le même et que Meta dédoublonne.
 */
export function trackInitiateCheckout(commande: {
  reference: string;
  value: number;
  currency?: string;
  contentId?: string;
}): void {
  trackMeta('InitiateCheckout', {
    eventId: `checkout_${commande.reference}`,
    customData: {
      value: commande.value,
      currency: commande.currency ?? 'USD',
      content_ids: commande.contentId ? [commande.contentId] : undefined,
      content_type: 'product',
      num_items: 1,
      order_id: commande.reference,
    },
  });
}

/**
 * Piste — dépôt d'un avis.
 *
 * Un avis n'est pas un achat, mais c'est un signal d'engagement fort :
 * quelqu'un qui prend le temps d'écrire un témoignage est un client
 * satisfait, et Meta s'en sert pour chercher des profils similaires.
 */
export function trackLead(page: string, details?: { content_name?: string }): void {
  trackMeta('Lead', {
    customData: {
      content_name: details?.content_name ?? 'Avis client',
      status: page,
    },
  });
}

/**
 * Achat confirmé.
 *
 * L'identifiant est **imposé** : `purchase_<référence>`. Le serveur envoie
 * le même au moment de la confirmation de paiement ; Meta n'en garde qu'un.
 */
export function trackPurchase(achat: {
  reference: string;
  value: number;
  currency?: string;
  contentId?: string;
}): void {
  trackMeta('Purchase', {
    eventId: `purchase_${achat.reference}`,
    customData: {
      value: achat.value,
      currency: achat.currency ?? 'USD',
      content_ids: achat.contentId ? [achat.contentId] : undefined,
      content_type: 'product',
      num_items: 1,
      order_id: achat.reference,
    },
  });
}

/** Refus explicite de la mesure, mémorisé sur l'appareil. */
export function refuserLaMesure(): void {
  try {
    localStorage.setItem(CLE_REFUS, '1');
  } catch {
    /* rien */
  }
  desactive = true;
}
