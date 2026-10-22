import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react';

/**
 * Notifications.
 *
 * Un site qui agit sans rien dire laisse croire qu'il est cassé : le client
 * clique, rien ne bouge, il reclique. Chaque action mérite donc une
 * réponse visible — brève, mais immédiate.
 *
 * Quatre règles, observées sur les boutiques en ligne et rarement
 * respectées ailleurs :
 *
 * 1. **Le message dit ce qui s'est passé**, pas ce qui a échoué dans le
 *    système. « Commande enregistrée » plutôt que « 200 OK ».
 * 2. **Il propose la suite** quand il y en a une : lire le reçu, suivre la
 *    commande. Un constat sans issue laisse le client désemparé.
 * 3. **Une erreur ne s'efface pas seule.** Un succès disparaît de lui-même
 *    au bout de quelques secondes ; un échec reste affiché, parce que
 *    celui qui l'a manqué ne le retrouvera jamais.
 * 4. **Jamais plus de trois à la fois.** Au-delà, on n'en lit plus aucune
 *    et elles masquent le contenu.
 */

export type Ton = 'succes' | 'erreur' | 'attention' | 'info' | 'chargement';

export interface Notification {
  id: string;
  ton: Ton;
  /** Une phrase courte, comprise sans effort. */
  titre: string;
  /** Précision facultative. */
  detail?: string;
  /** Bouton d'action, si une suite existe. */
  action?: { libelle: string; faire: () => void };
  /** Durée en millisecondes. 0 = reste affiché. */
  duree?: number;
}

interface ContexteNotifications {
  notifier: (n: Omit<Notification, 'id'>) => string;
  fermer: (id: string) => void;
  /** Met à jour une notification déjà affichée (chargement → succès). */
  maj: (id: string, n: Partial<Notification>) => void;
}

const Ctx = createContext<ContexteNotifications | null>(null);

export function useNotifications(): ContexteNotifications {
  const c = useContext(Ctx);
  if (!c) throw new Error('Notifications : fournisseur absent.');
  return c;
}

/** Raccourcis, pour ne pas répéter le ton à chaque appel. */
export function useNotifier() {
  const { notifier } = useNotifications();
  return useMemo(
    () => ({
      succes: (titre: string, detail?: string, action?: Notification['action']) =>
        notifier({ ton: 'succes', titre, detail, action, duree: 4_500 }),
      erreur: (titre: string, detail?: string) =>
        notifier({ ton: 'erreur', titre, detail, duree: 0 }),
      attention: (titre: string, detail?: string) =>
        notifier({ ton: 'attention', titre, detail, duree: 7_000 }),
      info: (titre: string, detail?: string) =>
        notifier({ ton: 'info', titre, detail, duree: 5_000 }),
      /** Affiche un état d'attente, à remplacer ensuite par maj(). */
      attente: (titre: string) => notifier({ ton: 'chargement', titre, duree: 0 }),
    }),
    [notifier],
  );
}

export function FournisseurNotifications({ children }: { children: ReactNode }) {
  const [liste, setListe] = useState<Notification[]>([]);
  const compteur = useRef(0);
  // Les minuteurs sont gardés pour être annulés si l'on ferme à la main :
  // sans cela, un message déjà refermé reparaîtrait.
  const minuteurs = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const fermer = useCallback((id: string) => {
    const t = minuteurs.current.get(id);
    if (t) {
      clearTimeout(t);
      minuteurs.current.delete(id);
    }
    setListe((l) => l.filter((n) => n.id !== id));
  }, []);

  const programmer = useCallback(
    (id: string, duree: number) => {
      minuteurs.current.set(
        id,
        setTimeout(() => fermer(id), duree),
      );
    },
    [fermer],
  );

  const notifier = useCallback(
    (n: Omit<Notification, 'id'>) => {
      const id = `n${++compteur.current}`;
      const complete: Notification = { id, ...n };

      setListe((l) => {
        // Trois au maximum : au-delà, la plus ancienne s'efface.
        const suivant = [...l, complete];
        const enTrop = suivant.slice(0, Math.max(0, suivant.length - 3));
        for (const v of enTrop) {
          const t = minuteurs.current.get(v.id);
          if (t) {
            clearTimeout(t);
            minuteurs.current.delete(v.id);
          }
        }
        return suivant.slice(-3);
      });

      if (complete.duree && complete.duree > 0) programmer(id, complete.duree);
      return id;
    },
    [programmer],
  );

  const maj = useCallback(
    (id: string, patch: Partial<Notification>) => {
      const t = minuteurs.current.get(id);
      if (t) {
        clearTimeout(t);
        minuteurs.current.delete(id);
      }
      setListe((l) => l.map((n) => (n.id === id ? { ...n, ...patch } : n)));
      const apres = patch.duree;
      if (apres && apres > 0) programmer(id, apres);
    },
    [programmer],
  );

  useEffect(() => {
    const m = minuteurs.current;
    return () => {
      for (const t of m.values()) clearTimeout(t);
      m.clear();
    };
  }, []);

  const valeur = useMemo(() => ({ notifier, fermer, maj }), [notifier, fermer, maj]);

  return (
    <Ctx.Provider value={valeur}>
      {children}
      <ZoneNotifications liste={liste} fermer={fermer} />
    </Ctx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Affichage                                                           */
/* ------------------------------------------------------------------ */

const STYLES: Record<Ton, { fond: string; bord: string; icone: typeof Info; couleur: string }> = {
  succes: {
    fond: 'bg-[#0E1A0C]/95',
    bord: 'border-emerald-500/40',
    icone: CheckCircle2,
    couleur: 'text-emerald-400',
  },
  erreur: {
    fond: 'bg-[#1C0D0D]/95',
    bord: 'border-red-500/40',
    icone: XCircle,
    couleur: 'text-red-400',
  },
  attention: {
    fond: 'bg-[#1C1608]/95',
    bord: 'border-amber-500/40',
    icone: AlertTriangle,
    couleur: 'text-amber-400',
  },
  info: {
    fond: 'bg-[#0D1620]/95',
    bord: 'border-[#A3FF12]/30',
    icone: Info,
    couleur: 'text-[#A3FF12]',
  },
  chargement: {
    fond: 'bg-[#12151A]/95',
    bord: 'border-white/15',
    icone: Loader2,
    couleur: 'text-[#8A949F]',
  },
};

function ZoneNotifications({
  liste,
  fermer,
}: {
  liste: Notification[];
  fermer: (id: string) => void;
}) {
  if (liste.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-[min(92vw,23rem)]"
      // Les notifications informent les lecteurs d'écran sans interrompre
      // la saisie en cours.
      role="region"
      aria-label="Notifications"
    >
      {liste.map((n) => (
        <CarteNotification key={n.id} notification={n} fermer={fermer} />
      ))}
    </div>
  );
}

function CarteNotification({
  notification: n,
  fermer,
}: {
  notification: Notification;
  fermer: (id: string) => void;
}) {
  const s = STYLES[n.ton];
  const Icone = s.icone;

  return (
    <div
      role={n.ton === 'erreur' ? 'alert' : 'status'}
      className={`${s.fond} ${s.bord} backdrop-blur-md border rounded-2xl p-3.5 shadow-2xl flex items-start gap-3 animate-[notif_0.25s_ease-out]`}
      style={{
        animationName: 'notif',
        animationDuration: '0.25s',
      }}
    >
      <Icone
        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${s.couleur} ${
          n.ton === 'chargement' ? 'animate-spin' : ''
        }`}
      />

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-white leading-snug">{n.titre}</p>
        {n.detail && (
          <p className="text-[12.5px] text-[#A2ABB5] mt-0.5 leading-relaxed">
            {n.detail}
          </p>
        )}
        {n.action && (
          <button
            onClick={() => {
              n.action?.faire();
              fermer(n.id);
            }}
            className="mt-2 text-[12.5px] font-bold text-[#A3FF12] hover:underline underline-offset-2"
          >
            {n.action.libelle} →
          </button>
        )}
      </div>

      <button
        onClick={() => fermer(n.id)}
        aria-label="Fermer la notification"
        className="text-[#7E8894] hover:text-white transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
