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

export async function uploadFile(file: File, admin = false): Promise<string> {
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('Fichier trop volumineux (25 Mo maximum).');
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
  try {
    const blob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: admin ? '/api/uploads?scope=admin' : '/api/uploads',
    });
    return blob.url;
  } catch (err) {
    // Les messages du service Blob sont en anglais et parlent de « jeton » :
    // incompréhensibles pour un client. On les traduit en langage courant.
    throw new Error(expliquerEchec(err, file));
  }
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

  return "L'envoi du fichier a échoué. Vérifiez votre connexion, puis réessayez.";
}
