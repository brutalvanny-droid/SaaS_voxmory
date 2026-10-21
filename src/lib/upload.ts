/**
 * Téléversement de fichiers (voix, photos).
 *
 * En production, le fichier part directement du navigateur vers Vercel Blob
 * après obtention d'un jeton auprès du serveur. Cela contourne la limite de
 * 4,5 Mo imposée au corps des requêtes serverless.
 *
 * Sans jeton Blob configuré (développement local), on passe par la route de
 * repli qui écrit dans `public/uploads`.
 */

let cachedMode: 'blob' | 'local' | null = null;
/** `null` tant que le serveur ne l'a pas dit. */
let cachedAccess: 'public' | 'private' | null = null;

async function uploadMode(): Promise<'blob' | 'local'> {
  if (cachedMode) return cachedMode;
  try {
    const res = await fetch('/api/config');
    const cfg = (await res.json()) as { uploadMode?: 'blob' | 'local' };
    cachedMode = cfg.uploadMode === 'blob' ? 'blob' : 'local';
  } catch {
    cachedMode = 'local';
  }
  return cachedMode;
}

/**
 * Accès à demander à l'envoi.
 *
 * Le magasin Vercel Blob de ce projet est privé : demander un accès public
 * fait échouer l'envoi avec « Cannot use public access on a private
 * store ». On suit donc ce que le serveur annonce.
 */
async function blobAccess(): Promise<'public' | 'private'> {
  if (cachedAccess) return cachedAccess;
  try {
    const res = await fetch('/api/config');
    const cfg = (await res.json()) as { blobAccess?: 'public' | 'private' };
    cachedAccess = cfg.blobAccess === 'public' ? 'public' : 'private';
  } catch {
    cachedAccess = 'private';
  }
  return cachedAccess;
}

export async function uploadFile(file: File, admin = false, estVideo = false): Promise<string> {
  // Une vidéo de fond est lourde : le studio dispose d'une enveloppe plus
  // large que celle d'un visiteur qui dépose une note vocale.
  const limite = admin && estVideo ? 80 : 25;
  if (file.size > limite * 1024 * 1024) {
    throw new Error(`Fichier trop volumineux (${limite} Mo maximum).`);
  }

  if ((await uploadMode()) === 'local') {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
      reader.readAsDataURL(file);
    });
    const res = await fetch('/api/uploads/local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, base64Data: base64 }),
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url) throw new Error(data.error ?? 'Téléversement impossible.');
    return data.url;
  }

  const { upload } = await import('@vercel/blob/client');
  const access = await blobAccess();
  try {
    const blob = await upload(file.name, file, {
      access,
      handleUploadUrl: admin ? '/api/uploads?scope=admin' : '/api/uploads',
    });

    /**
     * Avec un magasin privé, l'adresse renvoyée répond 403 : on stocke à la
     * place le chemin vers notre route de lecture, qui fabriquera une
     * adresse signée à la demande. Le reste du site continue d'utiliser
     * l'adresse sans rien savoir de tout ceci.
     */
    if (access === 'private') {
      return `/api/media/${cheminReel(blob)}`;
    }
    return blob.url;
  } catch (err) {
    // Les messages du service Blob sont en anglais et parlent de « jeton » :
    // incompréhensibles pour un client. On les traduit en langage courant.
    throw new Error(expliquerEchec(err, file));
  }
}

/**
 * Chemin réellement occupé par le fichier.
 *
 * Piège : `blob.pathname` renvoie le chemin *demandé*, alors que le service
 * ajoute un suffixe aléatoire quand `addRandomSuffix` est actif — ce qui est
 * notre cas. Suivre `pathname` menait donc à une adresse qui n'existe pas :
 * le fichier était bien stocké, mais introuvable.
 *
 * Seule l'adresse `blob.url` porte le vrai chemin. On l'utilise donc comme
 * source de vérité, avec repli sur `pathname` si elle manquait.
 */
function cheminReel(blob: { pathname: string; url: string }): string {
  const marque = '.blob.vercel-storage.com/';
  const i = blob.url.indexOf(marque);
  if (i === -1) return blob.pathname;
  return blob.url.slice(i + marque.length).split('?')[0];
}

/**
 * Traduit un échec de téléversement en phrase compréhensible par un client.
 *
 * Un visiteur qui voit « Vercel Blob: Client token has expired » croit que le
 * site est cassé et abandonne sa commande. Le même incident formulé
 * « votre connexion a été interrompue, réessayez » se résout de lui-même.
 */
function expliquerEchec(err: unknown, file: File): string {
  const brut = err instanceof Error ? err.message : String(err);
  const m = brut.toLowerCase();

  if (m.includes('token') && (m.includes('expired') || m.includes('invalid'))) {
    return "L'envoi a duré trop longtemps et a été interrompu. Vérifiez votre connexion, puis réessayez.";
  }
  if (m.includes('too large') || m.includes('exceed') || m.includes('size')) {
    return `Votre fichier est trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Envoyez un fichier plus léger.`;
  }
  if (m.includes('content type') || m.includes('not allowed') || m.includes('type')) {
    return "Format non accepté. Envoyez un fichier audio (MP3, WAV, M4A, OGG) ou une image (JPG, PNG, WEBP).";
  }
  if (m.includes('network') || m.includes('fetch') || m.includes('failed')) {
    return "Votre connexion a été interrompue pendant l'envoi. Réessayez.";
  }
  if (m.includes('private store') || m.includes('public access')) {
    return "Le stockage du site refuse cet envoi. Le problème a été signalé à l'équipe.";
  }

  return "L'envoi du fichier a échoué. Vérifiez votre connexion, puis réessayez.";
}
