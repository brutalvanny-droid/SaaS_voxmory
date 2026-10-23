/**
 * API Conversions Meta (CAPI).
 *
 * Pourquoi une passerelle serveur en plus du pixel navigateur : sur un
 * téléphone en 3G congolaise, une bonne partie des événements navigateur
 * n'arrive jamais (script bloqué, onglet fermé trop tôt, page qui ne finit
 * pas de charger). L'API Conversions envoie l'événement depuis nos serveurs,
 * ce qui fiabilise la mesure — à condition de **dédoublonner** avec le
 * navigateur, sinon chaque commande serait comptée deux fois.
 *
 * Le dédoublonnage repose sur `event_id` : le même identifiant est envoyé
 * par les deux canaux, Meta n'en garde qu'un.
 *
 * Rien ici n'est exposé au navigateur : le jeton d'accès reste côté serveur.
 */

import { createHash } from 'node:crypto';

/** Version de l'API Graph. À faire évoluer lors des dépréciations Meta. */
const GRAPH_VERSION = 'v21.0';

/**
 * Données de rapprochement.
 *
 * Meta attend des valeurs **hachées en SHA-256** pour tout ce qui identifie
 * une personne (e-mail, téléphone, nom, ville, pays). Les identifiants de
 * navigateur (`fbp`, `fbc`) et l'adresse IP, eux, partent en clair : ce ne
 * sont pas des données personnelles au sens du hachage.
 */
export interface MetaUserData {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  country?: string | null;
  externalId?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  clientIp?: string | null;
  clientUserAgent?: string | null;
}

export interface MetaEventInput {
  eventName: string;
  eventId: string;
  /** Secondes Unix. Par défaut, maintenant. */
  eventTime?: number;
  eventSourceUrl?: string;
  actionSource?: 'website' | 'system_generated' | 'chat' | 'other';
  userData?: MetaUserData;
  customData?: Record<string, unknown>;
}

export interface MetaResult {
  ok: boolean;
  /** Code HTTP renvoyé par Meta (null si l'appel n'a pas abouti). */
  status: number | null;
  error?: string;
}

function pixelId(): string {
  return (process.env.META_PIXEL_ID ?? '').trim();
}

function accessToken(): string {
  return (process.env.META_CAPI_TOKEN ?? '').trim();
}

export function isMetaCapiConfigured(): boolean {
  return pixelId().length > 0 && accessToken().length > 0;
}

/** SHA-256 en hexadécimal minuscule, comme l'exige Meta. */
function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Hache une valeur seulement si elle existe.
 *
 * Meta refuse un champ présent mais vide : on préfère omettre la clé plutôt
 * que d'envoyer une chaîne vide, qui dégraderait le taux de rapprochement.
 */
function hashIfPresent(value: string | null | undefined, transform?: (v: string) => string): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = (transform ? transform(value) : value).trim();
  if (cleaned.length === 0) return undefined;
  return sha256(cleaned.toLowerCase());
}

/** Téléphone : chiffres uniquement, indicatif pays conservé, sans « + ». */
function normaliserTelephone(value: string): string {
  return value.replace(/[^\d]/g, '');
}

/** « Jean-Pierre » → « jeanpierre » : Meta ignore ponctuation et espaces. */
function normaliserNom(value: string): string {
  return value.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

/** « Kinshasa » → « kinshasa » ; « RDC » → « cd » quand c'est un code. */
function normaliserVille(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function construireUserData(u: MetaUserData = {}): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  const em = hashIfPresent(u.email);
  if (em) data.em = [em];

  const ph = hashIfPresent(u.phone, normaliserTelephone);
  if (ph) data.ph = [ph];

  const fn = hashIfPresent(u.firstName, normaliserNom);
  if (fn) data.fn = [fn];

  const ln = hashIfPresent(u.lastName, normaliserNom);
  if (ln) data.ln = [ln];

  const ct = hashIfPresent(u.city, normaliserVille);
  if (ct) data.ct = [ct];

  const country = hashIfPresent(u.country, normaliserVille);
  if (country) data.country = [country];

  const externalId = hashIfPresent(u.externalId);
  if (externalId) data.external_id = [externalId];

  // Ces trois-là ne sont jamais hachés.
  if (u.fbp) data.fbp = u.fbp;
  if (u.fbc) data.fbc = u.fbc;
  if (u.clientIp) data.client_ip_address = u.clientIp;
  if (u.clientUserAgent) data.client_user_agent = u.clientUserAgent.slice(0, 500);

  return data;
}

/**
 * Envoie un événement.
 *
 * Ne lève jamais : un échec de mesure ne doit jamais faire échouer une
 * commande ni une page. L'appelant décide quoi faire du résultat.
 */
export async function sendMetaEvent(input: MetaEventInput): Promise<MetaResult> {
  if (!isMetaCapiConfigured()) {
    return { ok: false, status: null, error: 'API Conversions non configurée.' };
  }

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: input.eventName,
        event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: input.actionSource ?? 'website',
        ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
        user_data: construireUserData(input.userData),
        ...(input.customData && Object.keys(input.customData).length > 0
          ? { custom_data: input.customData }
          : {}),
      },
    ],
  };

  // Code d'essai : permet de vérifier dans l'onglet « Événements de test »
  // sans polluer les statistiques réelles.
  const testCode = (process.env.META_TEST_EVENT_CODE ?? '').trim();
  if (testCode) body.test_event_code = testCode;

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId()}/events?access_token=${encodeURIComponent(accessToken())}`;

  // Un délai borne la fonction serverless : mieux vaut perdre un événement
  // que faire attendre le client 30 secondes.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.warn(`[Meta CAPI] ${input.eventName} refusé (${res.status}) : ${detail.slice(0, 300)}`);
      return { ok: false, status: res.status, error: detail.slice(0, 300) };
    }

    return { ok: true, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[Meta CAPI] ${input.eventName} non envoyé : ${message}`);
    return { ok: false, status: null, error: message };
  } finally {
    clearTimeout(timer);
  }
}
