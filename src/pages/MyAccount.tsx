import { useCallback, useEffect, useState } from 'react';
import {
  Loader2,
  LogOut,
  Music4,
  Download,
  Package as PackageIcon,
  User,
  Lock,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import Reveal from '../components/Reveal.js';
import { api } from '../lib/api.js';
import type { ClientOrder, ClientUser } from '../types.js';

/**
 * Espace personnel du client.
 *
 * Trois choses, et rien de plus : qui je suis, où en sont mes commandes,
 * comment récupérer mes chansons. Un espace chargé de réglages décourage
 * plus qu'il ne rassure.
 */

const STATUS_COULEUR: Record<string, string> = {
  Nouvelle: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  'En écriture': 'bg-purple-500/15 text-purple-300 border-purple-500/25',
  'En composition': 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  'En enregistrement': 'bg-orange-500/15 text-orange-300 border-orange-500/25',
  'En relecture': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
  Livrée: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
};

const PAIEMENT_COULEUR: Record<string, string> = {
  Paid: 'text-emerald-400',
  Unpaid: 'text-amber-400',
  Failed: 'text-red-400',
};

const PAIEMENT_LIBELLE: Record<string, string> = {
  Paid: 'Payée',
  Unpaid: 'En attente de paiement',
  Failed: 'Paiement échoué',
};

export default function MyAccount({
  onNavigate,
  onLoggedOut,
}: {
  onNavigate: (page: string, params?: any) => void;
  onLoggedOut: () => void;
}) {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [onglet, setOnglet] = useState<'commandes' | 'profil'>('commandes');

  const charger = useCallback(async () => {
    try {
      const [u, o] = await Promise.all([api.account.me(), api.account.orders()]);
      setUser(u.user);
      setOrders(o);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  async function logout() {
    await api.account.logout().catch(() => {});
    onLoggedOut();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40 text-[#8A949F] gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-[#A3FF12]" />
        <span className="text-sm">Chargement de votre espace…</span>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-md mx-auto py-32 px-5 text-center">
        <p className="flex items-center justify-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4" /> {error || 'Session expirée.'}
        </p>
        <button
          onClick={() => onNavigate('account')}
          className="mt-6 px-6 py-3 rounded-full bg-[#A3FF12] text-black font-bold text-sm"
        >
          Me reconnecter
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-28 pb-24 px-5 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[520px] h-[380px] bg-[#A3FF12]/[0.05] blur-[130px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-9">
            <div>
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#A3FF12] font-bold">
                Mon espace
              </span>
              <h1 className="mt-2 text-[clamp(1.8rem,4.4vw,2.5rem)] font-extrabold text-white tracking-[-0.04em]">
                Bonjour {user.name.split(' ')[0]}
              </h1>
              <p className="mt-2 text-[14.5px] text-[#A2ABB5]">{user.email}</p>
            </div>

            <button
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 self-start px-4 py-2.5 rounded-full border border-white/12 text-[#A2ABB5] hover:text-white hover:bg-white/5 text-[13px] font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Me déconnecter
            </button>
          </div>
        </Reveal>

        {/* Onglets */}
        <div className="flex gap-2 mb-7">
          {(
            [
              { id: 'commandes', label: 'Mes chansons', icon: Music4 },
              { id: 'profil', label: 'Mon profil', icon: User },
            ] as const
          ).map((o) => (
            <button
              key={o.id}
              onClick={() => setOnglet(o.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                onglet === o.id
                  ? 'bg-[#A3FF12] text-black'
                  : 'bg-white/[0.04] text-[#8A949F] hover:text-white'
              }`}
            >
              <o.icon className="w-3.5 h-3.5" />
              {o.label}
            </button>
          ))}
        </div>

        {onglet === 'commandes' ? (
          <Commandes orders={orders} onNavigate={onNavigate} />
        ) : (
          <Profil user={user} onSaved={setUser} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Commandes                                                           */
/* ------------------------------------------------------------------ */

function Commandes({
  orders,
  onNavigate,
}: {
  orders: ClientOrder[];
  onNavigate: (page: string, params?: any) => void;
}) {
  if (orders.length === 0) {
    return (
      <Reveal>
        <div className="text-center py-16 px-6 rounded-3xl bg-white/[0.03] border border-white/[0.07]">
          <PackageIcon className="w-9 h-9 text-[#A3FF12]/50 mx-auto mb-4" />
          <h2 className="text-[17px] font-bold text-white mb-2">
            Aucune commande pour l'instant
          </h2>
          <p className="text-[14.5px] text-[#A2ABB5] mb-7 max-w-sm mx-auto">
            Vos chansons apparaîtront ici dès votre première commande.
          </p>
          <button
            onClick={() => onNavigate('order')}
            className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#A3FF12] to-[#7ACC00] text-black font-bold text-[14px] hover:scale-[1.03] transition-transform"
          >
            Commander ma chanson
          </button>
        </div>
      </Reveal>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o, i) => (
        <Reveal key={o.id} delay={i * 0.05}>
          <article className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-[16px] font-bold text-white">
                    {o.songTitle || `Chanson pour ${o.recipientName || 'vous'}`}
                  </h3>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                      STATUS_COULEUR[o.status] ?? 'bg-white/10 text-white/80 border-white/15'
                    }`}
                  >
                    {o.status}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] text-[#8A949F]">
                  {o.packageName}
                  {o.amountCents
                    ? ` · ${(o.amountCents / 100).toLocaleString('fr-FR')} ${o.currency ?? 'USD'}`
                    : ''}
                  {' · '}
                  Commande {o.reference}
                </p>
              </div>

              <span
                className={`text-[12px] font-bold ${
                  PAIEMENT_COULEUR[o.paymentStatus] ?? 'text-[#8A949F]'
                }`}
              >
                {PAIEMENT_LIBELLE[o.paymentStatus] ?? o.paymentStatus}
              </span>
            </div>

            {/* Livrables */}
            {(o.finalAudioUrl || o.memoryPageId) && (
              <div className="flex flex-wrap gap-2.5 pt-4 border-t border-white/[0.06]">
                {o.finalAudioUrl && (
                  <a
                    href={o.finalAudioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#A3FF12] text-black text-[13px] font-bold hover:scale-[1.02] transition-transform"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Télécharger ma chanson
                  </a>
                )}
                {o.memoryPageId && (
                  <button
                    onClick={() => onNavigate('memory', { slug: o.memoryPageId })}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/12 text-white text-[13px] font-bold hover:bg-white/5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ma page souvenir
                  </button>
                )}
              </div>
            )}
          </article>
        </Reveal>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Profil                                                              */
/* ------------------------------------------------------------------ */

function Profil({
  user,
  onSaved,
}: {
  user: ClientUser;
  onSaved: (u: ClientUser) => void;
}) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [city, setCity] = useState(user.city ?? '');
  const [country, setCountry] = useState(user.country ?? '');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setOk(false);
    setError('');
    try {
      const r = await api.account.update({ name, phone, city, country });
      onSaved(r.user);
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <Reveal>
        <form
          onSubmit={save}
          className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-4"
        >
          <h2 className="text-[16px] font-bold text-white mb-1">Mes informations</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <Champ label="Nom complet" value={name} onChange={setName} required />
            <Champ label="Téléphone" value={phone} onChange={setPhone} />
            <Champ label="Ville" value={city} onChange={setCity} />
            <Champ label="Pays" value={country} onChange={setCountry} />
          </div>

          {error && (
            <p className="flex items-center gap-2 text-[13px] text-red-400">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </p>
          )}
          {ok && (
            <p className="flex items-center gap-2 text-[13px] text-[#A3FF12]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Informations enregistrées.
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#A3FF12] text-black font-bold text-[14px] hover:scale-[1.02] transition-transform disabled:opacity-60"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Enregistrer
          </button>
        </form>
      </Reveal>

      <Reveal delay={0.06}>
        <MotDePasse />
      </Reveal>
    </div>
  );
}

function MotDePasse() {
  const [actuel, setActuel] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setOk(false);
    setError('');
    try {
      await api.account.changePassword(actuel, nouveau);
      setOk(true);
      setActuel('');
      setNouveau('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Modification impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={save}
      className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-4"
    >
      <h2 className="text-[16px] font-bold text-white flex items-center gap-2">
        <Lock className="w-4 h-4 text-[#A3FF12]" />
        Changer mon mot de passe
      </h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <Champ
          label="Mot de passe actuel"
          type="password"
          value={actuel}
          onChange={setActuel}
          required
        />
        <Champ
          label="Nouveau mot de passe"
          type="password"
          value={nouveau}
          onChange={setNouveau}
          required
        />
      </div>

      {error && (
        <p className="flex items-center gap-2 text-[13px] text-red-400">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
      {ok && (
        <p className="flex items-center gap-2 text-[13px] text-[#A3FF12]">
          <CheckCircle2 className="w-3.5 h-3.5" /> Mot de passe mis à jour.
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/12 text-white font-bold text-[14px] hover:bg-white/5 transition-colors disabled:opacity-60"
      >
        {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        Modifier
      </button>
    </form>
  );
}

function Champ({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[12px] font-semibold uppercase tracking-wider text-[#C2CAD3] mb-2">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/[0.09] text-white text-[15px] outline-none transition-colors focus:border-[#A3FF12]/50"
      />
    </label>
  );
}
