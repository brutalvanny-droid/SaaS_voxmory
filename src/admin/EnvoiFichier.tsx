import { useRef, useState } from 'react';
import { Upload, Loader2, X, Music, ImageIcon, Film, FolderOpen, Link2, CheckCircle2 } from 'lucide-react';
import { uploadFile } from '../lib/upload.js';

/**
 * Champ d'envoi de fichier, réutilisé dans tout le studio (galerie,
 * commandes, avis, pages souvenir, vitrine).
 *
 * Trois choses sont montrées en permanence :
 *   1. l'avancement du téléversement, en pourcentage ;
 *   2. l'aperçu immédiat du fichier une fois arrivé (lecteur audio, image ou vidéo) ;
 *   3. un message d'erreur clair en français en cas de souci.
 */

const ACCEPT = {
  image: 'image/*,.jpg,.jpeg,.png,.webp,.gif',
  audio: 'audio/*,.mp3,.wav,.m4a,.ogg,.aac,.flac,.webm,.mp4',
  video: 'video/*,.mp4,.webm,.mov',
} as const;

type Genre = keyof typeof ACCEPT;

interface FichierStocke {
  chemin: string;
  taille: number;
  envoyele: string | null;
}

export default function EnvoiFichier({
  genre,
  libelle,
  valeur,
  onChange,
  admin = true,
}: {
  genre: Genre;
  libelle: string;
  valeur: string;
  onChange: (url: string) => void;
  admin?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [progression, setProgression] = useState<number | null>(null);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState(false);
  const [survol, setSurvol] = useState(false);
  const [modeLien, setModeLien] = useState(false);
  const [biblioOuverte, setBiblioOuverte] = useState(false);
  const [biblio, setBiblio] = useState<FichierStocke[]>([]);
  const [chargementBiblio, setChargementBiblio] = useState(false);

  async function envoyer(fichier: File) {
    setErreur('');
    setSucces(false);
    setProgression(0);
    try {
      const url = await uploadFile(fichier, admin, genre === 'video', setProgression);
      onChange(url);
      setSucces(true);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Envoi impossible.');
    } finally {
      setProgression(null);
    }
  }

  async function ouvrirBibliotheque() {
    if (biblioOuverte) {
      setBiblioOuverte(false);
      return;
    }
    setBiblioOuverte(true);
    setChargementBiblio(true);
    try {
      const r = await fetch('/api/admin/media', { credentials: 'include' });
      const data = (await r.json()) as { fichiers?: FichierStocke[] };
      const tous = data.fichiers ?? [];
      const filtres = tous.filter((f) => {
        const nom = f.chemin.toLowerCase();
        if (genre === 'audio') return /\.(mp3|wav|m4a|ogg|aac|flac|webm)$/i.test(nom);
        if (genre === 'image') return /\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(nom);
        return /\.(mp4|webm|mov|mkv)$/i.test(nom);
      });
      setBiblio(filtres);
    } catch {
      setBiblio([]);
    } finally {
      setChargementBiblio(false);
    }
  }

  const enCours = progression !== null;

  return (
    <div className="space-y-2.5">
      <input
        ref={ref}
        type="file"
        accept={ACCEPT[genre]}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void envoyer(f);
          e.target.value = '';
        }}
      />

      {/* Bouton principal d'envoi + glisser-déposer */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={enCours}
          onClick={() => ref.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setSurvol(true);
          }}
          onDragLeave={() => setSurvol(false)}
          onDrop={(e) => {
            e.preventDefault();
            setSurvol(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void envoyer(f);
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed text-xs font-bold transition-all cursor-pointer ${
            enCours
              ? 'border-[#8A949F] bg-[#8A949F]/15 text-[#C3CAD2] cursor-wait'
              : survol
                ? 'border-[#A3FF12] bg-[#A3FF12]/20 text-[#A3FF12]'
                : 'border-[#A3FF12]/50 hover:border-[#A3FF12] bg-[#A3FF12]/10 hover:bg-[#A3FF12]/15 text-[#A3FF12]'
          }`}
        >
          {enCours ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Téléversement… {progression} %</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>{valeur ? `Remplacer (${libelle})` : libelle}</span>
            </>
          )}
        </button>

        {valeur && !enCours && (
          <button
            type="button"
            onClick={() => {
              setSucces(false);
              onChange('');
            }}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/15 border border-white/10 text-[#A2ABB5] hover:text-red-400 transition-colors"
            title="Retirer ce fichier"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Barre d'avancement */}
      {enCours && (
        <div
          className="h-2 w-full rounded-full bg-white/10 overflow-hidden"
          role="progressbar"
          aria-valuenow={progression ?? 0}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-[#A3FF12] rounded-full transition-[width] duration-200"
            style={{ width: `${Math.max(5, progression ?? 0)}%` }}
          />
        </div>
      )}

      {erreur && <p className="text-[12px] text-red-400">{erreur}</p>}

      {succes && valeur && !erreur && (
        <p className="text-[11.5px] text-emerald-400 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Fichier bien reçu et prêt à être enregistré.
        </p>
      )}

      <Apercu genre={genre} url={valeur} />

      {/* Actions secondaires : bibliothèque des fichiers déjà envoyés ou lien direct */}
      {admin && (
        <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[11px] text-[#8A949F]">
          <button
            type="button"
            onClick={() => void ouvrirBibliotheque()}
            className="inline-flex items-center gap-1 hover:text-[#A3FF12] transition-colors cursor-pointer"
          >
            <FolderOpen className="w-3 h-3" />
            {biblioOuverte ? 'Fermer la bibliothèque' : 'Choisir un fichier déjà envoyé'}
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => setModeLien((v) => !v)}
            className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          >
            <Link2 className="w-3 h-3" />
            {modeLien ? 'Masquer le champ lien' : 'Coller un lien (URL)'}
          </button>
        </div>
      )}

      {modeLien && (
        <input
          type="text"
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          placeholder={genre === 'audio' ? '/api/media/… ou https://…' : 'https://…'}
          className="w-full bg-[#14181D] border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-[#7E8894] focus:outline-none focus:border-[#A3FF12]"
        />
      )}

      {biblioOuverte && (
        <div className="rounded-xl border border-white/10 bg-black/50 p-2.5 max-h-44 overflow-y-auto space-y-1">
          {chargementBiblio ? (
            <p className="text-[11px] text-[#8A949F] py-2 text-center">Chargement des fichiers…</p>
          ) : biblio.length === 0 ? (
            <p className="text-[11px] text-[#7E8894] py-2 text-center">
              Aucun fichier {genre} trouvé dans le stockage.
            </p>
          ) : (
            biblio.map((f) => {
              const url = `/api/media/${f.chemin}`;
              const actif = valeur === url;
              return (
                <button
                  key={f.chemin}
                  type="button"
                  onClick={() => {
                    onChange(url);
                    setBiblioOuverte(false);
                    setSucces(true);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] flex items-center justify-between gap-2 transition-colors ${
                    actif
                      ? 'bg-[#A3FF12]/15 text-[#A3FF12] font-bold'
                      : 'hover:bg-white/10 text-[#C3CAD2]'
                  }`}
                >
                  <span className="truncate">{f.chemin}</span>
                  <span className="text-[10px] text-[#7E8894] shrink-0">
                    {(f.taille / 1024 / 1024).toFixed(1)} Mo
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/** Aperçu fidèle : on montre exactement ce que le visiteur verra. */
function Apercu({ genre, url }: { genre: Genre; url: string }) {
  if (!url) return null;

  if (genre === 'image') {
    return (
      <div className="flex items-center gap-3 p-2 rounded-lg bg-black/30 border border-white/10">
        <img
          src={url}
          alt=""
          className="w-20 h-14 object-cover rounded border border-white/10 flex-shrink-0"
        />
        <p className="text-[11px] text-[#7E8894] truncate flex-1">{url}</p>
        <ImageIcon className="w-3.5 h-3.5 text-[#8A949F] shrink-0" />
      </div>
    );
  }

  if (genre === 'video') {
    return (
      <div className="p-2 rounded-lg bg-black/30 border border-white/10 space-y-2">
        <div className="flex items-center gap-2">
          <Film className="w-3.5 h-3.5 text-[#A3FF12] shrink-0" />
          <p className="text-[11px] text-[#7E8894] truncate flex-1">{url}</p>
        </div>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video src={url} controls preload="metadata" className="w-full max-h-40 rounded" />
      </div>
    );
  }

  return (
    <div className="p-2 rounded-lg bg-black/30 border border-white/10 space-y-2">
      <div className="flex items-center gap-2">
        <Music className="w-3.5 h-3.5 text-[#A3FF12] shrink-0" />
        <p className="text-[11px] text-[#7E8894] truncate flex-1">{url}</p>
      </div>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio src={url} controls preload="metadata" className="w-full h-8" />
    </div>
  );
}
