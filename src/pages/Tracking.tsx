import { useEffect, useState } from 'react';
import { Search, AlertCircle, CheckCircle2, Loader2, Music, Download, Gift } from 'lucide-react';
import { api } from '../lib/api.js';
import type { PublicOrderTracking } from '../types.js';

interface Props {
  initialOrderId?: string;
  onNavigate: (page: string, params?: unknown) => void;
}

const PIPELINE: { status: string; label: string; desc: string }[] = [
  { status: 'Nouvelle', label: 'Commande reçue', desc: 'Votre demande est enregistrée.' },
  {
    status: 'En attente de paiement',
    label: 'En attente de règlement',
    desc: 'Validation dès réception de votre paiement mobile money.',
  },
  {
    status: 'Histoire reçue',
    label: 'Histoire reçue',
    desc: 'Nous avons bien reçu vos souvenirs.',
  },
  {
    status: 'Paroles en préparation',
    label: 'Écriture des paroles',
    desc: 'Nos auteurs composent vos rimes.',
  },
  {
    status: 'Chanson en production',
    label: 'En production studio',
    desc: 'Nos musiciens enregistrent et arrangent.',
  },
  { status: 'En révision', label: 'Révisions', desc: 'Validation et mixage final.' },
  {
    status: 'Livrée',
    label: 'Chanson livrée !',
    desc: 'Votre chanson et votre page souvenir sont prêtes.',
  },
];

function stageIndex(status: string): number {
  const s = status.toLowerCase();
  if (s.includes('livrée')) return 6;
  if (s.includes('révision')) return 5;
  if (s.includes('production') || s.includes('cours')) return 4;
  if (s.includes('paroles')) return 3;
  if (s.includes('histoire')) return 2;
  if (s.includes('paiement')) return 1;
  if (s.includes('terminée')) return 6;
  return 0;
}

/**
 * Suivi public.
 *
 * Cet écran n'affiche que des informations non sensibles : le serveur ne
 * renvoie ni numéro de téléphone, ni e-mail, ni histoire personnelle. La
 * recherche se fait par jeton de suivi, impossible à deviner.
 */
export default function Tracking({ initialOrderId, onNavigate }: Props) {
  const [key, setKey] = useState(initialOrderId ?? '');
  const [order, setOrder] = useState<PublicOrderTracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      setOrder(await api.track(trimmed));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recherche impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) void search(initialOrderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrderId]);

  const current = order ? stageIndex(order.status) : -1;

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
      <header className="text-center mb-10">
        <h1 className="text-[clamp(1.9rem,4.6vw,2.9rem)] font-extrabold text-white tracking-[-0.035em] leading-tight">
          Suivre ma <span className="text-gradient">commande</span>
        </h1>
        <p className="text-[14.5px] text-[#A2ABB5] mt-3">
          Saisissez la référence reçue lors de votre commande.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void search(key);
        }}
        className="flex gap-2 mb-8"
      >
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="VOX-2026-…"
          className="flex-1 bg-[#14181D] border border-white/20 rounded-xl px-4 py-3 text-[15px] text-white placeholder:text-[#8A949F] cursor-text hover:border-white/30 focus:outline-none focus:border-[#A3FF12] focus:ring-2 focus:ring-[#A3FF12]/25 font-mono transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-3 rounded-xl bg-[#A3FF12] hover:bg-[#A3FF12] text-black text-xs font-black uppercase tracking-wide disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Suivre
        </button>
      </form>

      {error && (
        <p className="mb-6 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </p>
      )}

      {order && (
        <div className="bg-[#0B0D10] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4 mb-6 pb-5 border-b border-white/10">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#8A949F]">Référence</p>
              <p className="font-mono text-lg font-black text-[#A3FF12]">{order.reference}</p>
            </div>
            <span
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                order.paymentStatus === 'Paid'
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-[#A3FF12]/15 text-[#A3FF12]'
              }`}
            >
              {order.paymentStatus === 'Paid' ? 'Payée' : 'En attente de paiement'}
            </span>
          </div>

          <ol className="space-y-4">
            {PIPELINE.map((stage, i) => {
              const done = i <= current;
              const active = i === current;
              return (
                <li key={stage.status} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        done ? 'bg-emerald-500 text-black' : 'bg-white/10 text-[#6C7581]'
                      }`}
                    >
                      {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    {i < PIPELINE.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 mt-1 ${
                          i < current ? 'bg-emerald-500' : 'bg-white/10'
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-2">
                    <p
                      className={`text-sm font-bold ${
                        active ? 'text-[#A3FF12]' : done ? 'text-white' : 'text-[#8A949F]'
                      }`}
                    >
                      {stage.label}
                    </p>
                    <p className="text-[11px] text-[#8A949F] mt-0.5">{stage.desc}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          {order.songTitle && (
            <p className="mt-6 text-sm text-white">
              Titre : <span className="font-bold">{order.songTitle}</span>
            </p>
          )}

          {order.finalAudioUrl && (
            <div className="mt-5 p-4 rounded-xl bg-black/40 border border-white/10">
              <p className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                <Music className="w-4 h-4 text-[#A3FF12]" />
                Votre chanson
              </p>
              <audio controls src={order.finalAudioUrl} className="w-full" />
              <a
                href={order.finalAudioUrl}
                download
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#A3FF12] hover:underline"
              >
                <Download className="w-3.5 h-3.5" /> Télécharger
              </a>
            </div>
          )}

          {order.memoryPageId && (
            <button
              onClick={() => onNavigate('memory', { slug: order.memoryPageId })}
              className="mt-5 w-full py-3 rounded-xl bg-[#A3FF12]/20 hover:bg-[#A3FF12]/30 border border-[#A3FF12]/40 text-white text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" />
              Voir ma page souvenir
            </button>
          )}
        </div>
      )}
    </div>
  );
}
