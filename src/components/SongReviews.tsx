import { useEffect, useState, FormEvent } from 'react';
import { Star, Music2, ShieldCheck, Clock } from 'lucide-react';
import { api } from '../lib/api.js';
import type { SongReview } from '../types.js';


/** Affiche les avis d'une chanson et permet d'en déposer un nouveau. */
export default function SongReviews({ songId }: { songId: string }) {
  const [avis, setAvis] = useState<SongReview[]>([]);
  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [nom, setNom] = useState('');
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [merci, setMerci] = useState(false);

  useEffect(() => {
    api.songReviews(songId)
      .then((liste) => setAvis(liste))
      .catch(() => setErreur('Impossible de charger les avis pour le moment.'))
      .finally(() => setCharge(true));
  }, [songId]);

  const deposer = async (e: FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);
    try {
      await api.createSongReview(songId, { clientName: nom, rating: note, comment: commentaire });
      setMerci(true);
      setNom('');
      setNote(5);
      setCommentaire('');
      // Recharger pour afficher le nouvel avis (il sera modéré avant d'apparaître)
      api.songReviews(songId).then((liste) => setAvis(liste));
    } catch {
      setErreur('Impossible d\'envoyer votre avis. Réessayez plus tard.');
    } finally {
      setEnvoi(false);
    }
  };

  const etoiles = (n: number) => (
    <span className="flex items-center gap-1 text-[#A3FF12] text-sm">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-4 h-4 ${i <= n ? 'fill-[#A3FF12]' : 'fill-white/10'}`} />
      ))}
    </span>
  );

  if (merci) {
    return (
      <div className="rounded-2xl border border-[#A3FF12]/30 bg-[#A3FF12]/10 p-4 text-center">
        <Music2 className="w-6 h-6 text-[#A3FF12] mx-auto mb-2" />
        <p className="text-[12px] text-[#A3FF12] font-bold">Merci !</p>
        <p className="text-[11px] text-[#8A949F] mt-1">
          Votre avis a été envoyé et sera publié après validation par l'équipe.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête : nombre d'avis */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold text-[#8A949F] uppercase tracking-wider">
          Avis clients
        </p>
        {avis.length > 0 && (
          <span className="text-[11px] text-[#6C7581]">{avis.length} avis</span>
        )}
      </div>

      {/* Liste des avis */}
      {charge && !erreur ? (
        avis.length === 0 ? (
          <p className="text-[11px] text-[#6C7581] text-center py-4">
            Aucun avis pour le moment. Soyez le premier !
          </p>
        ) : (
          <div className="space-y-3">
            {avis.map((a) => (
              <div key={a.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11.5px] font-bold text-white">{a.clientName}</span>
                  {a.isVerified && (
                    <span className="flex items-center gap-1 text-[10px] text-[#A3FF12] bg-[#A3FF12]/10 px-2 py-0.5 rounded">
                      <ShieldCheck className="w-3 h-3" />
                      Client vérifié
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mb-2">{etoiles(a.rating)}</div>
                <p className="text-[11.5px] text-[#C2CAD3] leading-relaxed">
                  {a.comment}
                </p>
                <span className="text-[10px] text-[#6C7581]">
                  {new Date(a.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            ))}
          </div>
        )
      ) : erreur ? (
        <p className="text-[11px] text-[#FF9B9B] text-center py-4">{erreur}</p>
      ) : (
        <div className="h-16 flex items-center justify-center text-[#6C7581] text-[11px]">
          Chargement…
        </div>
      )}

      {/* Formulaire de dépôt */}
      {!merci && (
        <form onClick={(e) => e.stopPropagation()} onSubmit={deposer} className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <h4 className="text-[12px] font-bold text-white">Laisser un avis</h4>
          <div className="space-y-2">
            <label className="text-[11px] text-[#8A949F] block">Votre nom</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Marie K."
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#A3FF12] focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-[#8A949F] block flex justify-between">
              <span>Votre note</span>
              <span className="text-[#A3FF12] text-xs">{note} / 5</span>
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={note}
              onChange={(e) => setNote(Number(e.target.value))}
              className="w-full accent-[#A3FF12]"
            />
            <div className="flex justify-between text-[10px] text-[#6C7581]">
              <span>1</span>
              <span>5</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-[#8A949F] block">Votre commentaire</label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Ce que vous avez aimé dans cette chanson…"
              rows={3}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#A3FF12] focus:outline-none"
            />
          </div>
          <p className="text-[10px] text-[#6C7581]">
            Votre numéro de téléphone, s'il figure dans le texte, sera automatiquement masqué.
          </p>
          <button
            type="submit"
            disabled={envoi || !nom || !commentaire}
            className="w-full py-2.5 bg-gradient-to-tr from-[#A3FF12] via-[#A3FF12] to-[#7ACC00] text-black font-bold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {envoi ? 'Envoi…' : "Envoyer l'avis"}
          </button>
          {erreur && (
            <p className="text-[11px] text-[#FF9B9B]">{erreur}</p>
          )}
        </form>
      )}
    </div>
  );
}
