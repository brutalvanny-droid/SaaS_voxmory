import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle2, Loader2, MessageSquare, ShoppingBag } from 'lucide-react';
import { api } from '../lib/api.js';

/**
 * Cloche du studio.
 *
 * Le studio ne peut pas surveiller son site en continu. Cette cloche
 * annonce ce qui est arrivé depuis sa dernière visite : une commande, un
 * paiement, un avis à valider.
 *
 * Deux précautions, pour que l'outil reste un outil et non une gêne :
 *
 * - **On n'interroge le serveur que si la fenêtre est ouverte.** Un onglet
 *   laissé ouvert toute la nuit en arrière-plan ne consomme rien.
 * - **On ne prévient qu'une fois.** Le repère « déjà vu » est conservé
 *   dans le navigateur : une notification qui revient à chaque minute
 *   cesse très vite d'être lue.
 */

interface Evenement {
  id: string;
  type: 'commande' | 'paiement' | 'avis';
  titre: string;
  detail: string;
  date: string;
  lien?: string;
}

const CLE_VU = 'voxmory_notif_vu';

function lireVu(): string {
  try {
    return localStorage.getItem(CLE_VU) ?? new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export function marquerToutVu(): void {
  try {
    localStorage.setItem(CLE_VU, new Date().toISOString());
  } catch {
    /* Navigation privée : sans conséquence. */
  }
}

const ICONES = {
  commande: ShoppingBag,
  paiement: CheckCircle2,
  avis: MessageSquare,
} as const;

const COULEURS = {
  commande: 'text-[#A3FF12]',
  paiement: 'text-emerald-400',
  avis: 'text-blue-300',
} as const;

export default function ClocheNotifications({
  onAllerCommandes,
}: {
  onAllerCommandes?: () => void;
}) {
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [nonVus, setNonVus] = useState(0);
  const [ouvert, setOuvert] = useState(false);
  const [charge, setCharge] = useState(false);
  const bloc = useRef<HTMLDivElement>(null);

  const charger = useCallback(async () => {
    try {
      const r = await api.admin.notifications(lireVu());
      setEvenements(r.evenements);
      setNonVus(r.nonVus);
    } catch {
      /* Une panne passagère n'efface pas la cloche. */
    } finally {
      setCharge(true);
    }
  }, []);

  useEffect(() => {
    let minuteur: ReturnType<typeof setInterval> | null = null;

    const demarrer = () => {
      if (minuteur === null) {
        // Deux minutes : assez vite pour ne pas rater une commande, assez
        // lent pour ne pas peser sur la connexion.
        minuteur = setInterval(() => {
          if (document.visibilityState === 'visible') void charger();
        }, 120_000);
      }
    };

    const surVisibilite = () => {
      if (document.visibilityState === 'visible') {
        void charger();
        demarrer();
      } else if (minuteur !== null) {
        clearInterval(minuteur);
        minuteur = null;
      }
    };

    void charger();
    if (document.visibilityState === 'visible') demarrer();
    document.addEventListener('visibilitychange', surVisibilite);
    window.addEventListener('online', () => void charger());

    return () => {
      if (minuteur !== null) clearInterval(minuteur);
      document.removeEventListener('visibilitychange', surVisibilite);
    };
  }, [charger]);

  // Fermer d'un clic ailleurs : sans cela, le panneau reste collé à l'écran.
  useEffect(() => {
    if (!ouvert) return;
    const surClic = (e: MouseEvent) => {
      if (bloc.current && !bloc.current.contains(e.target as Node)) setOuvert(false);
    };
    document.addEventListener('mousedown', surClic);
    return () => document.removeEventListener('mousedown', surClic);
  }, [ouvert]);

  function ouvrir() {
    setOuvert((o) => !o);
    if (!ouvert && nonVus > 0) {
      marquerToutVu();
      setNonVus(0);
    }
  }

  function il_y_a(dateIso: string): string {
    const minutes = Math.round((Date.now() - new Date(dateIso).getTime()) / 60_000);
    if (minutes < 1) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes} min`;
    const heures = Math.round(minutes / 60);
    if (heures < 24) return `il y a ${heures} h`;
    const jours = Math.round(heures / 24);
    return jours === 1 ? 'hier' : `il y a ${jours} jours`;
  }

  return (
    <div ref={bloc} className="relative">
      <button
        onClick={ouvrir}
        aria-label={`Notifications${nonVus > 0 ? ` — ${nonVus} non lues` : ''}`}
        className="relative w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] grid place-items-center transition-colors"
      >
        <Bell className="w-4 h-4 text-[#C2CAD3]" />
        {nonVus > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#A3FF12] text-black text-[10px] font-black grid place-items-center animate-pulse">
            {nonVus > 9 ? '9+' : nonVus}
          </span>
        )}
      </button>

      {ouvert && (
        <div className="absolute right-0 top-11 w-[min(90vw,22rem)] bg-[#0B0D10] border border-white/[0.09] rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between">
            <p className="text-[13px] font-bold text-white">Activité récente</p>
            {!charge && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8A949F]" />}
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {evenements.length === 0 ? (
              <p className="px-4 py-8 text-center text-[12.5px] text-[#7E8894]">
                Rien pour l'instant.
                <span className="block mt-1 text-[11.5px]">
                  Les commandes et les avis apparaîtront ici.
                </span>
              </p>
            ) : (
              evenements.map((e) => {
                const Icone = ICONES[e.type] ?? ShoppingBag;
                return (
                  <button
                    key={e.id}
                    onClick={() => {
                      setOuvert(false);
                      if (e.type !== 'avis') onAllerCommandes?.();
                    }}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left border-b border-white/[0.04] last:border-0"
                  >
                    <Icone className={`w-4 h-4 flex-shrink-0 mt-0.5 ${COULEURS[e.type]}`} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[12.5px] font-bold text-white leading-snug">
                        {e.titre}
                      </span>
                      <span className="block text-[11.5px] text-[#8A949F] truncate">
                        {e.detail}
                      </span>
                    </span>
                    <span className="text-[10.5px] text-[#7E8894] flex-shrink-0">
                      {il_y_a(e.date)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
