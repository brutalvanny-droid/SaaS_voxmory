import { useEffect, useRef, useState } from 'react';
import { Play, Square, RotateCcw, Scissors } from 'lucide-react';
import { Button } from './ui.js';

/**
 * Choisir l'extrait d'une chanson longue (début / fin).
 *
 * Une chanson livrée dure souvent trois à six minutes : sur la page
 * d'accueil, le studio choisit le meilleur passage (refrain, moment fort)
 * à faire écouter. Le fichier complet reste stocké intact ; seule la
 * lecture publique est bornée entre `debut` et `fin`.
 */

/** « 95 » devient « 1:35 ». */
function horloge(secondes: number): string {
  const s = Math.max(0, Math.round(secondes));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function ExtraitAudio({
  url,
  debut,
  fin,
  onChange,
}: {
  url: string;
  debut: number;
  fin: number | null;
  onChange: (debut: number, fin: number | null) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duree, setDuree] = useState(0);
  const [lecture, setLecture] = useState(false);

  useEffect(() => {
    setDuree(0);
    setLecture(false);
    if (!url) return;
    const a = new Audio();
    a.preload = 'metadata';
    a.src = url;
    const surDuree = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) setDuree(a.duration);
    };
    a.addEventListener('loadedmetadata', surDuree);
    a.addEventListener('durationchange', surDuree);
    return () => {
      a.removeEventListener('loadedmetadata', surDuree);
      a.removeEventListener('durationchange', surDuree);
    };
  }, [url]);

  const maxDuree = duree > 0 ? Math.floor(duree) : Math.max(300, (fin ?? 60) + 60);
  const finEffective = fin ?? (duree > 0 ? Math.floor(duree) : 60);
  const extrait = Math.max(0, finEffective - debut);

  function arreter() {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = debut;
    }
    setLecture(false);
  }

  function ecouter() {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = debut;
    a.play()
      .then(() => setLecture(true))
      .catch(() => setLecture(false));
  }

  function surTemps() {
    const a = audioRef.current;
    if (!a) return;
    if (fin !== null && a.currentTime >= fin) {
      arreter();
    } else if (duree > 0 && a.currentTime >= finEffective) {
      arreter();
    }
  }

  if (!url) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-3 text-[11.5px] text-[#8A949F] flex items-center gap-2">
        <Scissors className="w-4 h-4 text-[#A3FF12]/70 shrink-0" />
        <span>
          Ajoutez d'abord le fichier audio ci-dessus pour choisir le début et la fin de l'extrait diffusé sur l'accueil.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-[#A3FF12]/20 bg-black/30 p-3.5">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setDuree(d);
        }}
        onTimeUpdate={surTemps}
        onEnded={arreter}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] font-semibold text-[#C2CAD3] flex items-center gap-1.5">
          <Scissors className="w-3.5 h-3.5 text-[#A3FF12]" />
          Extrait sélectionné :{' '}
          <span className="text-[#A3FF12] font-mono">
            {horloge(debut)} → {fin !== null || duree > 0 ? horloge(finEffective) : 'Fin'} ({horloge(extrait)})
          </span>
        </p>
        <div className="flex gap-1.5">
          <Button onClick={lecture ? arreter : ecouter}>
            {lecture ? (
              <Square className="w-3.5 h-3.5 inline mr-1.5" />
            ) : (
              <Play className="w-3.5 h-3.5 inline mr-1.5" />
            )}
            {lecture ? 'Arrêter' : "Écouter l'extrait"}
          </Button>
          <span title="Faire écouter la chanson entière">
            <Button onClick={() => onChange(0, null)}>
              <RotateCcw className="w-3.5 h-3.5 inline mr-1.5" />
              Chanson entière
            </Button>
          </span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between text-[11px] text-[#8A949F] mb-1">
            <span>Début de l'extrait</span>
            <span className="text-white font-mono">{horloge(debut)} ({debut}s)</span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(1, maxDuree)}
            value={debut}
            onChange={(e) => {
              const d = Math.max(0, Math.min(Number(e.target.value), finEffective - 1));
              onChange(d, fin);
            }}
            className="w-full accent-[#A3FF12] cursor-pointer"
          />
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-[10px] text-[#7E8894]">Secondes :</span>
            <input
              type="number"
              min={0}
              max={Math.max(0, finEffective - 1)}
              value={debut}
              onChange={(e) => {
                const d = Math.max(0, Number(e.target.value) || 0);
                onChange(d, fin !== null && fin <= d ? d + 30 : fin);
              }}
              className="w-20 bg-[#14181D] border border-white/15 rounded px-2 py-0.5 text-xs text-white font-mono"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-[#8A949F] mb-1">
            <span>Fin de l'extrait</span>
            <span className="text-white font-mono">
              {fin === null && duree === 0 ? 'Jusqu’à la fin' : `${horloge(finEffective)} (${finEffective}s)`}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(1, maxDuree)}
            value={finEffective}
            onChange={(e) => {
              const f = Math.max(Number(e.target.value), debut + 1);
              onChange(debut, duree > 0 && f >= Math.floor(duree) ? null : f);
            }}
            className="w-full accent-[#A3FF12] cursor-pointer"
          />
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-[10px] text-[#7E8894]">Secondes :</span>
            <input
              type="number"
              min={debut + 1}
              placeholder="Fin"
              value={fin ?? (duree > 0 ? Math.floor(duree) : '')}
              onChange={(e) => {
                const val = e.target.value.trim();
                if (!val) {
                  onChange(debut, null);
                  return;
                }
                const f = Math.max(debut + 1, Number(val) || debut + 30);
                onChange(debut, f);
              }}
              className="w-20 bg-[#14181D] border border-white/15 rounded px-2 py-0.5 text-xs text-white font-mono"
            />
          </div>
        </div>
      </div>

      <p className="text-[11px] text-[#7E8894] leading-relaxed">
        Sur la page d'accueil et la galerie, le visiteur n'entendra que ce passage (par exemple 0:30 à 1:15).
      </p>
    </div>
  );
}
