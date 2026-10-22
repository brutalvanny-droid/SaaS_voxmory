import { useCallback, useState } from 'react';
import type { JSX } from 'react';
import { put } from '@vercel/blob';
import { Upload, Trash2, AlertCircle } from 'lucide-react';
import { Field } from './ui.js';

/**
 * Champ de téléversement de fichier réutilisable.
 *
 * Ouvre une fenêtre de sélection de fichier, vérifie le type et la taille,
 * affiche une barre de progression et une prévisualisation, puis envoie le
 * fichier directement depuis le navigateur vers Vercel Blob (contournant la
 * limite de 4,5 Mo des fonctions serverless).
 *
 * @param genre    'audio' | 'image' | 'video' — détermine les types acceptés
 * @param libelle  Texte affiché comme libellé du champ
 * @param valeur   URL actuelle du fichier (déjà uploadé), ou null
 * @param onChange Appelé avec la nouvelle URL (string) ou null si supprimé
 * @param admin    Si true, autorise les fichiers plus lourds (jusqu'à 80 Mo pour la vidéo)
 */
interface EnvoiFichierProps {
  genre: 'audio' | 'image' | 'video';
  libelle: string;
  valeur: string | null | undefined;
  onChange: (valeur: string | null) => void;
  admin?: boolean;
}

export default function EnvoiFichier({
  genre,
  libelle,
  valeur,
  onChange,
  admin = false,
}: EnvoiFichierProps) {
  const [fichier, setFichier] = useState<File | null>(null);
  const [progression, setProgression] = useState(0);
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);

  /* ------------------------------------------------------------------ */
  /*  Règles d'acceptation                                              */
  /* ------------------------------------------------------------------ */

  const typesAutorises = genre === 'audio'
    ? ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/m4a']
    : genre === 'video'
    ? ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
    : ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  const limiteOctets = genre === 'video' && admin ? 80 * 1024 * 1024 : 25 * 1024 * 1024;
  const limiteMo = Math.round(limiteOctets / 1024 / 1024);

  const extensionsTexte = genre === 'audio'
    ? 'MP3, WAV ou M4A'
    : genre === 'video'
    ? 'MP4 ou WebM'
    : 'JPG, PNG ou WEBP';

  /* ------------------------------------------------------------------ */
  /*  Sélection de fichier                                              */
  /* ------------------------------------------------------------------ */

  const accepterFichier = useCallback((f: File) => {
    if (!typesAutorises.includes(f.type)) {
      setErreur(`Format non accepté. Utilisez ${extensionsTexte}.`);
      return;
    }
    if (f.size > limiteOctets) {
      setErreur(`Fichier trop lourd (maximum ${limiteMo} Mo).`);
      return;
    }
    setErreur('');
    setFichier(f);
  }, [typesAutorises, limiteOctets, limiteMo, extensionsTexte, genre]);

  const supprimer = () => {
    setFichier(null);
    setErreur('');
    onChange(null);
  };

  /* ------------------------------------------------------------------ */
  /*  Téléversement navigateur → Vercel Blob                            */
  /* ------------------------------------------------------------------ */

  const televerser = async () => {
    if (!fichier) return;
    setEnCours(true);
    setProgression(0);
    setErreur('');
    try {
      // Nom de destination dans le stockage Blob
      const safeName = fichier.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
      const pathname = `studio/${genre}/${Date.now()}-${safeName}`;

      /* -------------------------------------------------------------- */
      /*  1. Demander un jeton de dépôt au serveur                      */
      /* -------------------------------------------------------------- */
      const reponseToken = await fetch(
        'https://saa-s-voxmory.vercel.app/api/uploads',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'blob.generate-client-token',
            pathname,
            clientPayload: null,
            multipart: false,
          }),
        }
      );

      if (!reponseToken.ok) {
        const donneesErr = await reponseToken.json().catch(() => ({}));
        throw new Error(donneesErr.error || 'Impossible de préparer le téléversement.');
      }

      const donneesToken = await reponseToken.json();
      const clientToken: string | undefined = donneesToken.clientToken;
      if (!clientToken) throw new Error('Jeton de dépôt manquant.');

      /* -------------------------------------------------------------- */
      /*  2. Envoyer le fichier directement vers Vercel Blob            */
      /* -------------------------------------------------------------- */
      const resultat = await put(pathname, fichier, {
        access: 'private',
        token: clientToken,
        addRandomSuffix: true,
        contentType: fichier.type,
        onUploadProgress: (progr) => {
          setProgression(Math.round(progr.percentage));
        },
      });

      let urlFichier = resultat.url || resultat.downloadUrl || '';

      // Le magasin est privé : on convertit l'URL Blob en notre route /api/media/
      // qui fabrique une adresse signée à la volée.
      if (urlFichier.includes('.private.blob.vercel-storage.com/')) {
        const chemin = urlFichier.split('.private.blob.vercel-storage.com/')[1];
        if (chemin) {
          urlFichier = `/api/media/${encodeURIComponent(chemin)}`;
        }
      }

      onChange(urlFichier || null);
    } catch (err: any) {
      setErreur(err.message || 'Échec du téléversement.');
    } finally {
      setEnCours(false);
      setProgression(0);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Prévisualisation                                                  */
  /* ------------------------------------------------------------------ */

  let apercu: JSX.Element | null = null;
  const source = valeur || (fichier ? URL.createObjectURL(fichier) : null);

  if (source) {
    if (genre === 'audio') {
      apercu = (
        <audio controls src={source} style={{ width: '100%', borderRadius: '6px' }} />
      );
    } else if (genre === 'image') {
      apercu = (
        <img src={source} alt={libelle} style={{ width: '100%', height: 'auto', borderRadius: '6px', objectFit: 'cover' }} />
      );
    } else if (genre === 'video') {
      apercu = (
        <video controls src={source} style={{ width: '100%', height: 'auto', borderRadius: '6px' }} />
      );
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-4">
      <Field label={libelle}>
        <div className="space-y-3">
          {/* Sélecteur de fichier */}
          <label className="block cursor-pointer">
            <button
              type="button"
              disabled={enCours}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed transition-colors ${
                enCours
                  ? 'border-[#8A949F] bg-[#8A949F]/20 text-[#8A949F]'
                  : 'border-[#A3FF12]/50 hover:border-[#A3FF12] bg-[#A3FF12]/10 text-[#A3FF12]'
              }`}
            >
              {enCours ? (
                <>
                  <Upload className="w-4 h-4 animate-spin" />
                  <span>Téléversement… {progression}%</span>
                </>
              ) : fichier ? (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Remplacer {fichier.name}</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Choisir un fichier</span>
                </>
              )}
            </button>
            <input
              type="file"
              accept={typesAutorises.join(',')}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) accepterFichier(f);
              }}
              className="hidden"
            />
          </label>

          {/* Erreur */}
          {erreur && (
            <p className="text-[11px] text-[#FF9B9B] flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" />
              {erreur}
            </p>
          )}

          {/* Progression */}
          {enCours && progression > 0 && progression < 100 && (
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <div className="bg-[#A3FF12] h-1.5 rounded-full" style={{ width: `${progression}%` }} />
            </div>
          )}

          {/* Prévisualisation */}
          {apercu && (
            <div className="flex items-center gap-3">
              <div className="flex-1">{apercu}</div>
              {valeur && (
                <button
                  type="button"
                  onClick={supprimer}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-[#A2ABB5] hover:text-red-400"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </Field>
    </div>
  );
}
