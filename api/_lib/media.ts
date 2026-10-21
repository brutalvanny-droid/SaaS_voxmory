import { issueSignedToken, presignUrl } from '@vercel/blob';

/**
 * Lecture des fichiers stockés.
 *
 * Le magasin Vercel Blob de ce projet est configuré en **accès privé** :
 * un fichier déposé n'est pas téléchargeable depuis son adresse directe,
 * celle-ci répond 403. Et demander un accès public à l'envoi est refusé
 * avec « Cannot use public access on a private store » — ce qui faisait
 * échouer *tous* les envois, sans exception.
 *
 * Plutôt que de faire transiter les fichiers par nos fonctions (coûteux et
 * lent), on fabrique à la volée une adresse signée à courte durée de vie et
 * on y redirige le navigateur. Le fichier part toujours directement du
 * réseau de Vercel ; nous ne servons qu'une redirection.
 *
 * Si le magasin est un jour basculé en accès public, il suffit de passer
 * `BLOB_ACCESS=public` : les adresses directes redeviennent valables et
 * cette couche n'intervient plus.
 */

export type BlobAccess = 'public' | 'private';

/** Accès configuré du magasin. Défaut « private » : c'est l'état réel. */
export function blobAccess(): BlobAccess {
  return process.env.BLOB_ACCESS === 'public' ? 'public' : 'private';
}

/**
 * Motif autorisé pour un chemin de fichier.
 *
 * Volontairement strict — lettres, chiffres, tirets, soulignés, points et
 * barres de dossier. Toute tentative de remonter dans l'arborescence
 * (`..`) ou d'introduire un autre hôte est écartée ici, avant même
 * d'interroger le service de stockage.
 */
const CHEMIN_VALIDE = /^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,300}$/;

export function cheminEstSur(nom: string): boolean {
  if (!CHEMIN_VALIDE.test(nom)) return false;
  if (nom.includes('..')) return false;
  if (nom.includes('//')) return false;
  if (nom.startsWith('/') || nom.startsWith('.')) return false;
  return true;
}

/** Durée de validité d'une adresse signée : 1 heure. */
const DUREE_SIGNATURE_MS = 60 * 60 * 1000;

/**
 * Fabrique une adresse utilisable par un navigateur pour un fichier privé.
 *
 * Renvoie `null` si le chemin est refusé — dans ce cas l'appelant doit
 * répondre 400, jamais tenter sa chance auprès du service.
 */
export async function adresseSignee(
  pathname: string,
  opts: { telechargement?: boolean } = {},
): Promise<string | null> {
  if (!cheminEstSur(pathname)) return null;

  const jeton = await issueSignedToken({
    pathname,
    operations: ['get', 'head'],
    validUntil: Date.now() + DUREE_SIGNATURE_MS,
  });

  const { presignedUrl } = await presignUrl(jeton, {
    operation: 'get',
    pathname,
    access: 'private',
    validUntil: Date.now() + DUREE_SIGNATURE_MS,
  });

  if (!opts.telechargement) return presignedUrl;

  const u = new URL(presignedUrl);
  u.searchParams.set('download', '1');
  return u.toString();
}

/** Adresse publique d'un chemin, quand le magasin l'autorise. */
export function adressePublique(pathname: string, storeId: string): string {
  return `https://${storeId}.public.blob.vercel-storage.com/${pathname}`;
}

/**
 * Normalise une adresse de fichier vers une adresse utilisable.
 *
 * Sert de filet de sécurité : si une adresse privée brute s'était glissée
 * en base avant ce correctif, elle est convertie à l'affichage plutôt que
 * de produire une image cassée.
 */
export function normaliserAdresse(url: string | null | undefined): string | null {
  if (!url) return null;

  // Déjà l'une de nos routes : rien à faire.
  if (url.startsWith('/api/media/')) return url;

  if (url.includes('.private.blob.vercel-storage.com/')) {
    const chemin = url.split('.private.blob.vercel-storage.com/')[1];
    if (chemin && cheminEstSur(chemin)) return `/api/media/${chemin}`;
  }

  // Adresse publique ou externe : utilisable telle quelle.
  return url;
}
