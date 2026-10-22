import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response } from 'express';

/**
 * Stockage des fichiers (voix, photos, chansons livrées).
 *
 * Sur Vercel, le système de fichiers est éphémère : tout ce qui y est écrit
 * disparaît au redémarrage du conteneur. Les fichiers vont donc dans Vercel
 * Blob, téléversés directement depuis le navigateur afin de contourner la
 * limite de 4,5 Mo du corps de requête des fonctions serverless.
 *
 * En développement local, sans jeton Blob configuré, on retombe sur un
 * dossier `public/uploads` — suffisant pour tester le parcours complet.
 */

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 Mo — studio
export const MAX_PUBLIC_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 Mo — visiteurs

export const ALLOWED_UPLOAD_TYPES = [
  'audio/*',
  'audio/mpeg',
  'audio/mp3',
  'audio/mpeg3',
  'audio/x-mpeg-3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/vnd.wave',
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/aac',
  'audio/flac',
  'audio/x-flac',
  'image/*',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
  // Vidéos : la page d'accueil en diffuse une en boucle, et le studio doit
  // pouvoir la remplacer. Sans ces lignes, le stockage refusait l'envoi et
  // le studio voyait « erreur de téléversement » sans plus d'explication.
  'video/*',
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
];

/**
 * Une vidéo de fond est lourde : quelques secondes en haute définition
 * dépassent vite les 25 Mo accordés à un fichier audio. Le studio dispose
 * donc d'une enveloppe plus large, réservée aux comptes connectés —
 * les visiteurs gardent la leur.
 */
export const MAX_ADMIN_VIDEO_BYTES = 80 * 1024 * 1024; // 80 Mo — vidéos du studio

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/* ------------------------------------------------------------------ */
/*  Téléversement direct navigateur → Vercel Blob                       */
/* ------------------------------------------------------------------ */

interface HandledUploadResult {
  type: string;
  clientToken?: string;
  [key: string]: unknown;
}

/**
 * Point d'entrée unique : le navigateur demande un jeton ici, puis envoie
 * directement le fichier à Blob. Le contenu ne transite jamais par la
 * fonction serverless.
 */
export async function handleClientUpload(
  req: Request,
  res: Response,
  isAdmin = false,
): Promise<void> {
  const { handleUpload } = await import('@vercel/blob/client');

  const body = req.body as unknown;

  // Un visiteur est limité à un fichier raisonnable ; le studio peut
  // déposer une chanson finalisée de plus longue durée.
  // Le studio peut déposer une vidéo de fond, qui pèse bien plus qu'une
  // chanson. Les visiteurs restent limités à un fichier raisonnable.
  const maxBytes = isAdmin ? MAX_ADMIN_VIDEO_BYTES : MAX_PUBLIC_UPLOAD_BYTES;

  let result: HandledUploadResult;
  try {
    result = (await handleUpload({
      body: body as Parameters<typeof handleUpload>[0]['body'],
      request: req as unknown as globalThis.Request,
      onBeforeGenerateToken: async () => ({
        maximumSizeInBytes: maxBytes,
        allowedContentTypes: ALLOWED_UPLOAD_TYPES,
        addRandomSuffix: true,
        /**
         * Le magasin de ce projet est privé.
         *
         * Sans cette ligne, le service fabrique un jeton d'accès public et
         * refuse l'envoi avec « Cannot use public access on a private
         * store » — ce qui, chez le client, se traduisait par un échec de
         * téléversement sans plus d'explication. Autrement dit : tous les
         * envois échouaient, images comme sons.
         *
         * Le caractère privé n'empêche pas la diffusion : la lecture passe
         * par /api/media/, qui fabrique une adresse signée à la demande.
         * C'est même plus sûr — personne ne peut deviner l'adresse d'un
         * fichier qu'on n'a pas partagé.
         */
        access: 'private',
        allowUpload: true,
        //
        // Validité du jeton : 30 minutes, et non 60 secondes.
        // Le jeton doit rester valable pendant TOUT le transfert, pas
        // seulement au moment où il est demandé. Une note vocale de 10 Mo
        // envoyée depuis un téléphone en 3G met couramment plusieurs
        // minutes : avec une minute de validité, le transfert échouait en
        // cours de route par « jeton expiré » — chez l'utilisateur, et de
        // façon intermittente selon la qualité du réseau.
        validUntil: Date.now() + 30 * 60 * 1000,
      }),
      onUploadCompleted: async ({ blob }) => {
        console.log(`[Blob] Fichier déposé : ${blob.pathname}`);
      },
    })) as HandledUploadResult;
  } catch (err) {
    console.error('[Blob] Échec de la génération du jeton :', err);
    res.status(500).json({ error: 'Impossible de préparer le téléversement.' });
    return;
  }

  res.json(result);
}

/* ------------------------------------------------------------------ */
/*  Repli local (développement)                                         */
/* ------------------------------------------------------------------ */

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export function saveLocalUpload(filename: string, data: Buffer): string {
  if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
    fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  }
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  fs.writeFileSync(path.join(LOCAL_UPLOAD_DIR, safe), data);
  return `/uploads/${safe}`;
}

/** Indique au front-end quelle stratégie employer. */
export function uploadMode(): 'blob' | 'local' {
  return isBlobConfigured() ? 'blob' : 'local';
}
