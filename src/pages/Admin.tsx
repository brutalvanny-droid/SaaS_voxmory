import { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Library,
  Megaphone,
  Settings as SettingsIcon,
  LogOut,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../lib/api.js';
import type { AdminSession } from '../types.js';
import Login from '../admin/Login.js';
import Orders from '../admin/Orders.js';
import Catalog from '../admin/Catalog.js';
import Outreach from '../admin/Outreach.js';
import SettingsPanel from '../admin/Settings.js';
import { Badge, Button, Card, Stat } from '../admin/ui.js';

type Tab = 'dashboard' | 'orders' | 'catalog' | 'outreach' | 'settings';

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'orders', label: 'Commandes', icon: ShoppingBag },
  { id: 'catalog', label: 'Catalogue', icon: Library },
  { id: 'outreach', label: 'Diffusion', icon: Megaphone },
  { id: 'settings', label: 'Réglages', icon: SettingsIcon },
];

interface AdminProps {
  onNavigate: (page: string, params?: unknown) => void;
  onPromotionChanged: () => void;
}

/**
 * Studio d'administration.
 *
 * L'autorisation n'est jamais décidée ici : chaque requête est vérifiée
 * côté serveur via le cookie de session httpOnly. Si la session expire,
 * l'API renvoie 401 et l'écran de connexion réapparaît d'office.
 */
export default function Admin({ onNavigate, onPromotionChanged }: AdminProps) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<Tab>('dashboard');

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((res) => {
        if (!cancelled) setSession(res.admin);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => {});
    setSession(null);
    setTab('dashboard');
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center py-32 text-[#8A949F] gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Vérification de la session…
      </div>
    );
  }

  if (!session) {
    return <Login onSuccess={setSession} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-black text-white">Studio VOXMORY</h1>
          <p className="text-xs text-[#8A949F] mt-0.5">
            Connecté en tant que {session.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => onNavigate('home')}>Voir le site</Button>
          <Button onClick={() => void logout()}>
            <LogOut className="w-3.5 h-3.5 inline mr-1.5" />
            Se déconnecter
          </Button>
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-white/10 mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wide border-b-2 whitespace-nowrap transition-colors ${
              tab === id
                ? 'border-[#A3FF12] text-[#A3FF12]'
                : 'border-transparent text-[#8A949F] hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>

      {tab === 'dashboard' && <Dashboard />}
      {tab === 'orders' && <Orders />}
      {tab === 'catalog' && <Catalog />}
      {tab === 'outreach' && <Outreach />}
      {tab === 'settings' && <SettingsPanel onPromotionChanged={onPromotionChanged} />}
    </div>
  );
}

/* --------------------------- Tableau de bord -------------------------- */

function Dashboard() {
  const [stats, setStats] = useState<
    | (Awaited<ReturnType<typeof api.admin.stats>>)
    | null
  >(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.admin
      .stats()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : 'Indisponible.'));
  }, []);

  if (error) {
    return (
      <p className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
        <AlertCircle className="w-4 h-4" /> {error}
      </p>
    );
  }
  if (!stats) {
    return (
      <div className="flex items-center justify-center py-24 text-[#8A949F] gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
      </div>
    );
  }

  const days = stats.dailyStats.slice(-14);
  const maxVisits = Math.max(1, ...days.map((d) => d.visits));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label="Commandes"
          value={stats.totalOrders}
          hint={`${stats.pendingPayment} en attente de paiement`}
        />
        <Stat
          label="Chansons livrées"
          value={stats.delivered}
          accent="text-emerald-400"
        />
        <Stat
          label="Chiffre d'affaires"
          value={`${(stats.totalRevenueCents / 100).toLocaleString('fr-FR')} $`}
          accent="text-[#A3FF12]"
          hint="Commandes marquées comme payées"
        />
        <Stat
          label="Note moyenne"
          value={`${stats.averageRating} / 5`}
          accent="text-[#A3FF12]"
          hint={`${stats.clientSatisfaction} % de satisfaction`}
        />
      </div>

      <Card title="Audience — 14 derniers jours" subtitle="Visites et écoutes">
        {days.length === 0 ? (
          <p className="text-sm text-[#6C7581]">Pas encore de données.</p>
        ) : (
          <div className="flex items-end gap-1.5 h-40">
            {days.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center gap-0.5 h-32">
                  <div
                    className="w-1/2 bg-[#A3FF12]/70 rounded-t"
                    style={{ height: `${(d.visits / maxVisits) * 100}%` }}
                    title={`${d.visits} visites`}
                  />
                  <div
                    className="w-1/2 bg-[#A3FF12]/70 rounded-t"
                    style={{ height: `${(d.listens / maxVisits) * 100}%` }}
                    title={`${d.listens} écoutes`}
                  />
                </div>
                <span className="text-[9px] text-[#6C7581]">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-4 mt-3 text-[11px] text-[#8A949F]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#A3FF12]/70" /> Visites
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#A3FF12]/70" /> Écoutes
          </span>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-3">
        <Stat label="Visites cumulées" value={stats.visitsCount.toLocaleString('fr-FR')} />
        <Stat label="Écoutes cumulées" value={stats.listensCount.toLocaleString('fr-FR')} />
      </div>
    </div>
  );
}
