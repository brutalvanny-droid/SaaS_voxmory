import crypto from 'node:crypto';

/**
 * Intégration SasPay — encaissement mobile money et carte en Afrique.
 *
 * Points de vigilance respectés ici :
 *  - la clé secrète ne quitte jamais le serveur ;
 *  - toute requête qui déplace de l'argent porte un en-tête `Idempotency-Key`,
 *    sinon une simple reprise réseau débiterait le client deux fois ;
 *  - le statut n'est jamais déduit d'un délai : on interroge toujours
 *    `/verify/` avant de considérer un paiement comme acquis ;
 *  - les webhooks sont vérifiés par HMAC **et** par leur fraîcheur.
 */

const BASE_URL = 'https://api.saspay.me/api/v1';

export function isSaspayConfigured(): boolean {
  return Boolean(process.env.SASPAY_API_KEY);
}

function apiKey(): string {
  const key = process.env.SASPAY_API_KEY;
  if (!key) throw new Error('SASPAY_API_KEY est manquante.');
  return key;
}

/** Montant au format attendu par l'API : chaîne décimale à deux chiffres. */
function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

interface SasPayEnvelope<T> {
  success?: boolean;
  data?: T;
  code?: number;
  error?: unknown;
  [key: string]: unknown;
}

async function saspayFetch<T>(
  pathname: string,
  options: { method?: 'GET' | 'POST'; body?: unknown; idempotencyKey?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey()}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(`${BASE_URL}${pathname}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const raw = (await res.json().catch(() => ({}))) as SasPayEnvelope<T>;

    if (!res.ok) {
      const message =
        (raw.error as { message?: string } | undefined)?.message ??
        `SasPay a répondu avec le code HTTP ${res.status}.`;
      throw new Error(message);
    }

    // L'API enveloppe ses réponses dans `data`, mais certains endpoints
    // historiques répondent à plat.
    return (raw.data ?? raw) as T;
  } finally {
    clearTimeout(timeout);
  }
}

/* ------------------------------------------------------------------ */
/*  Référence : pays et réseaux                                         */
/* ------------------------------------------------------------------ */

export interface SasPayCountry {
  id: string;
  iso_code: string;
  name: string;
  default_currency: string;
  is_active: boolean;
}

export interface SasPayNetwork {
  code: string;
  name: string;
  [key: string]: unknown;
}

/** Aucune authentification requise — mettons la liste en cache. */
let countriesCache: { at: number; data: SasPayCountry[] } | null = null;

export async function listCountries(): Promise<SasPayCountry[]> {
  if (countriesCache && Date.now() - countriesCache.at < 6 * 60 * 60 * 1000) {
    return countriesCache.data;
  }
  const data = await saspayFetch<SasPayCountry[]>('/countries/');
  countriesCache = { at: Date.now(), data };
  return data;
}

export async function listNetworks(country: string): Promise<SasPayNetwork[]> {
  const data = await saspayFetch<SasPayNetwork[] | { results: SasPayNetwork[] }>(
    `/networks/?country=${encodeURIComponent(country)}`,
  );
  if (Array.isArray(data)) return data;
  const nested = data as { results?: SasPayNetwork[] };
  return Array.isArray(nested?.results) ? nested.results : [];
}

/* ------------------------------------------------------------------ */
/*  Encaissement                                                        */
/* ------------------------------------------------------------------ */

export interface PaymentIntentInput {
  amountCents: number;
  currency: string;
  country: string;
  description: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  /** Obligatoire uniquement en softpay */
  network?: string;
  returnUrl: string;
  idempotencyKey: string;
}

export interface PaymentIntentResult {
  id: string;
  status: string;
  checkoutUrl: string | null;
  raw: unknown;
}

function splitName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    first_name: parts[0] ?? fullName,
    last_name: parts.length > 1 ? parts.slice(1).join(' ') : (parts[0] ?? ''),
  };
}

/** Push USSD directement sur le téléphone du client. */
export async function createSoftpayPayment(
  input: PaymentIntentInput,
): Promise<PaymentIntentResult> {
  if (!input.network) {
    throw new Error('Le réseau mobile money est requis pour un paiement direct.');
  }
  const { first_name, last_name } = splitName(input.customerName);

  const data = await saspayFetch<{
    id: string;
    status: string;
    checkout_url?: string | null;
    message?: string;
  }>('/payments/softpay/', {
    method: 'POST',
    idempotencyKey: input.idempotencyKey,
    body: {
      amount: formatAmount(input.amountCents),
      currency: input.currency,
      country: input.country,
      network: input.network,
      description: input.description,
      customer: {
        email: input.customerEmail || undefined,
        first_name,
        last_name,
        phone: input.customerPhone,
      },
    },
  });

  return {
    id: String(data.id),
    status: String(data.status ?? 'PENDING'),
    // Vide sur les réseaux qui fonctionnent en push ; renseigné ailleurs,
    // auquel cas il faut y rediriger le client sous peine de ne rien encaisser.
    checkoutUrl: data.checkout_url ? String(data.checkout_url) : null,
    raw: data,
  };
}

/** Page de paiement hébergée : le client choisit lui-même son réseau. */
export async function createCheckoutSession(
  input: PaymentIntentInput,
): Promise<PaymentIntentResult> {
  const data = await saspayFetch<{
    id: string;
    checkout_url?: string | null;
    status?: string;
  }>('/checkout-sessions/', {
    method: 'POST',
    body: {
      amount: formatAmount(input.amountCents),
      currency: input.currency,
      description: input.description,
      customer_email: input.customerEmail || undefined,
      customer_name: input.customerName,
      return_url: input.returnUrl,
    },
  });

  return {
    id: String(data.id),
    status: String(data.status ?? 'PENDING'),
    checkoutUrl: data.checkout_url ? String(data.checkout_url) : null,
    raw: data,
  };
}

/**
 * Source de vérité : on ne fait jamais confiance à un statut mémorisé.
 * Cet appel revérifie l'état réel auprès de la passerelle.
 */
export async function verifyPayment(paymentId: string): Promise<{
  id: string;
  status: string;
  reference?: string;
  raw: unknown;
}> {
  const data = await saspayFetch<{ id: string; status: string; reference?: string }>(
    `/payments/${encodeURIComponent(paymentId)}/verify/`,
  );
  return {
    id: String(data.id ?? paymentId),
    status: String(data.status ?? 'PENDING').toUpperCase(),
    reference: data.reference ? String(data.reference) : undefined,
    raw: data,
  };
}

/* ------------------------------------------------------------------ */
/*  Webhooks                                                            */
/* ------------------------------------------------------------------ */

const WEBHOOK_TOLERANCE_SECONDS = 300;

/**
 * Recalcule la signature sur le **corps brut** reçu.
 * Re-sérialiser le JSON analysé casserait la comparaison octet par octet.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  timestampHeader: string | undefined,
  secret: string,
): boolean {
  if (!signatureHeader || !timestampHeader) return false;

  const now = Math.floor(Date.now() / 1000);
  const ts = Number(timestampHeader);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > WEBHOOK_TOLERANCE_SECONDS) {
    // Sans ce contrôle d'âge, un webhook intercepté resterait rejouable
    // indéfiniment : sa signature ne périme jamais.
    return false;
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestampHeader}.${rawBody}`)
    .digest('hex');

  const a = Buffer.from(signatureHeader, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
