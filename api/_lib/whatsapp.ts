/**
 * Notifications WhatsApp via OpenWA (passerelle auto-hébergée).
 *
 * OpenWA tourne sur votre propre serveur : depuis Vercel on l'appelle donc
 * simplement en HTTP. Aucune session persistante n'est nécessaire côté
 * serverless.
 */

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (!clean.endsWith('@c.us')) clean = `${clean}@c.us`;
  return clean;
}

export function isWhatsappConfigured(): boolean {
  const { OPENWA_URL, OPENWA_API_KEY, OPENWA_SESSION_ID } = process.env;
  if (!OPENWA_URL || !OPENWA_API_KEY || !OPENWA_SESSION_ID) return false;
  // Les valeurs issues de .env.example ne doivent jamais déclencher d'envoi.
  return !(
    OPENWA_URL.includes('MON-DOMAINE-OPENWA') ||
    OPENWA_API_KEY.includes('MA_CLE_API') ||
    OPENWA_SESSION_ID.includes('MA_SESSION')
  );
}

export interface SendResult {
  ok: boolean;
  reason?: string;
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<SendResult> {
  if (!isWhatsappConfigured()) {
    return { ok: false, reason: 'Intégration WhatsApp non configurée.' };
  }
  if (!phone || !message) {
    return { ok: false, reason: 'Numéro ou message vide.' };
  }

  const cleanPhone = formatPhoneNumber(phone);
  if (cleanPhone.length < 9) {
    return { ok: false, reason: `Numéro invalide : ${phone}` };
  }

  const endpoint = `${process.env.OPENWA_URL}/sessions/${process.env.OPENWA_SESSION_ID}/messages/send-text`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.OPENWA_API_KEY as string,
      },
      body: JSON.stringify({ chatId: cleanPhone, text: message }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[WhatsApp] Échec HTTP ${res.status} : ${detail.slice(0, 300)}`);
      return { ok: false, reason: `La passerelle a répondu ${res.status}.` };
    }
    return { ok: true };
  } catch (err) {
    console.error('[WhatsApp] Erreur de connexion :', err);
    return { ok: false, reason: 'Passerelle injoignable.' };
  } finally {
    clearTimeout(timeout);
  }
}

/* ------------------------------------------------------------------ */
/*  Messages types                                                      */
/* ------------------------------------------------------------------ */

export function orderReceivedMessage(customerName: string, reference: string): string {
  return [
    `Bonjour ${customerName},`,
    '',
    `Votre commande ${reference} a bien été reçue. 🎵`,
    '',
    'Notre équipe vous contacte sur WhatsApp pour finaliser les détails et vous transmettre le lien de paiement sécurisé.',
    '',
    'Merci pour votre confiance.',
    "— L'équipe VOXMORY",
  ].join('\n');
}

export function adminNewOrderMessage(order: {
  reference: string;
  customerName: string;
  customerPhone: string;
  packageName: string;
  amountLabel: string;
}): string {
  return [
    '🎵 Nouvelle commande VOXMORY',
    '',
    `Référence : ${order.reference}`,
    `Client : ${order.customerName}`,
    `Téléphone : ${order.customerPhone}`,
    `Formule : ${order.packageName}`,
    `Montant : ${order.amountLabel}`,
  ].join('\n');
}

export function paymentConfirmedMessage(customerName: string, reference: string): string {
  return [
    `Bonjour ${customerName},`,
    '',
    `✅ Nous avons bien reçu votre paiement pour la commande ${reference}.`,
    '',
    'Nos compositeurs travaillent sur votre chanson. Vous recevrez votre page souvenir privée dès qu’elle est prête.',
    '',
    "— L'équipe VOXMORY",
  ].join('\n');
}

export function deliveryMessage(
  customerName: string,
  recipientName: string,
  memoryUrl: string,
): string {
  return [
    `Bonjour ${customerName},`,
    '',
    `Votre chanson personnalisée pour ${recipientName} est prête ! 🎶`,
    '',
    `Retrouvez-la sur votre page souvenir privée : ${memoryUrl}`,
    '',
    'Merci de nous avoir confié cette histoire.',
    "— L'équipe VOXMORY",
  ].join('\n');
}

/**
 * État de la configuration.
 *
 * Sert au studio à savoir pourquoi un message ne part pas, sans avoir à
 * ouvrir les journaux du serveur. On indique précisément ce qui manque —
 * « non configuré » seul laisserait chercher à l'aveugle.
 */
export interface WhatsappStatus {
  configure: boolean;
  manquants: string[];
  url?: string;
  sessionId?: string;
  numeroAdmin?: boolean;
}

export function whatsappStatus(): WhatsappStatus {
  const { OPENWA_URL, OPENWA_API_KEY, OPENWA_SESSION_ID, ADMIN_WHATSAPP_NUMBER } = process.env;

  const manquants: string[] = [];
  if (!OPENWA_URL) manquants.push('OPENWA_URL');
  if (!OPENWA_API_KEY) manquants.push('OPENWA_API_KEY');
  if (!OPENWA_SESSION_ID) manquants.push('OPENWA_SESSION_ID');

  return {
    configure: manquants.length === 0 && isWhatsappConfigured(),
    manquants,
    ...(OPENWA_URL ? { url: OPENWA_URL } : {}),
    ...(OPENWA_SESSION_ID ? { sessionId: OPENWA_SESSION_ID } : {}),
    numeroAdmin: Boolean(ADMIN_WHATSAPP_NUMBER),
  };
}

/**
 * Vérifie que la passerelle répond et que la session est bien connectée.
 *
 * Une passerelle joignable mais déconnectée ne sert à rien : c'est le cas
 * le plus fréquent après un redémarrage du serveur, quand il faut
 * rescanner le QR code.
 */
export async function testerConnexion(): Promise<{ ok: boolean; detail: string }> {
  if (!isWhatsappConfigured()) {
    const s = whatsappStatus();
    return {
      ok: false,
      detail: s.manquants.length
        ? `Variables manquantes : ${s.manquants.join(', ')}.`
        : 'Passerelle non configurée.',
    };
  }

  const base = (process.env.OPENWA_URL as string).replace(/\/$/, '');
  const endpoint = `${base}/sessions/${process.env.OPENWA_SESSION_ID}`;

  const controller = new AbortController();
  const delai = setTimeout(() => controller.abort(), 8_000);

  try {
    const res = await fetch(endpoint, {
      headers: { 'X-API-Key': process.env.OPENWA_API_KEY as string },
      signal: controller.signal,
    });

    if (!res.ok) {
      return { ok: false, detail: `La passerelle a répondu ${res.status}.` };
    }

    const data = (await res.json().catch(() => null)) as
      | { status?: string; state?: string }
      | null;

    // OpenWA nomme l'état de la session « status » ou « state » selon les
    // versions : on accepte les deux plutôt que de se tromper.
    const etat = (data?.status ?? data?.state ?? '').toUpperCase();
    if (etat && etat !== 'CONNECTED' && etat !== 'AUTHENTICATED') {
      return { ok: false, detail: `Session non connectée (${etat}). Rescannez le QR code.` };
    }

    return { ok: true, detail: 'Passerelle joignable et session connectée.' };
  } catch {
    return { ok: false, detail: 'Passerelle injoignable depuis le serveur.' };
  } finally {
    clearTimeout(delai);
  }
}
