import { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Library,
  Megaphone,
  Settings as SettingsIcon,
  LogOut,
  Loader2,
  Menu,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { LogoMark } from '../components/Logo.js';
import type { AdminSession } from '../types.js';
import Login from '../admin/Login.js';
import Dashboard from '../admin/Dashboard.js';
import Orders from '../admin/Orders.js';
import Catalog from '../admin/Catalog.js';
import Outreach from '../admin/Outreach.js';
import SettingsPanel from '../admin/Settings.js';

type Tab = 'dashboard' | 'orders' | 'catalog' | 'outreach' | 'settings';

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard; description: string }[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, description: 'Vue d’ensemble de l’activité' },
  { id: 'orders', label: 'Commandes', icon: ShoppingBag, description: 'Produire et livrer les chansons' },
  { id: 'catalog', label: 'Catalogue', icon: Library, description: 'Formules, extraits et avis' },
  { id: 'outreach', label: 'Diffusion', icon: Megaphone, description: 'Contacts et campagnes' },
  { id: 'settings', label: 'Réglages', icon: SettingsIcon, description: 'Prix, paiements, textes' },
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
  const [menuOuvert, setMenuOuvert] = useState(false);
  /** Commandes en cours de production — alimente le pastille du menu. */
  const [aProduire, setAProduire] = useState(0);

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

  /**
   * Le menu doit dire où se trouve le travail. On compte les commandes qui
   * attendent une action humaine plutôt que d'afficher un point
   * d'interrogation permanent.
   */
  useEffect(() => {
    if (!session) return;
    api.admin
      .stats()
      .then((s) => {
        const actifs = ['Nouvelle', 'En écriture', 'En composition', 'En enregistrement', 'En relecture'];
        setAProduire(
          (s.ordersByStatus ?? [])
            .filter((x) => actifs.includes(x.status))
            .reduce((total, x) => total + x.count, 0),
        );
      })
      .catch(() => {});
  }, [session]);

  const logout = useCallback(async () => {
    await api.logout().catch(() => {});
    setSession(null);
    setTab('dashboard');
  }, []);

  const aller = (id: Tab) => {
    setTab(id);
    setMenuOuvert(false);
  };

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

  const ongletActif = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* ── Barre latérale ─────────────────────────────────────── */}
          <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col">
            <div className="sticky top-6 space-y-4">
              {/* Marque */}
              <div className="flex items-center gap-2.5 px-1">
                <span className="w-9 h-9 rounded-xl bg-[#07080A] border border-white/10 grid place-items-center flex-shrink-0">
                  <LogoMark size={22} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-black text-white leading-tight">Studio</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#6C7581] leading-tight">
                    VOXMORY
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-0.5">
                {TABS.map(({ id, label, icon: Icon }) => {
                  const actif = tab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => aller(id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        actif
                          ? 'bg-[#A3FF12]/10 text-[#A3FF12]'
                          : 'text-[#8A949F] hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-[13px] font-bold truncate">{label}</span>
                      {id === 'orders' && aProduire > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#A3FF12] text-black text-[10px] font-black tabular-nums">
                          {aProduire}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Session */}
              <div className="pt-3 border-t border-white/[0.07] space-y-2">
                <button
                  onClick={() => onNavigate('home')}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[#8A949F] hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
                  <span className="text-[13px] font-bold">Voir le site</span>
                </button>

                <div className="px-3 py-2.5">
                  <p className="text-[11.5px] font-semibold text-white truncate">
                    {session.email}
                  </p>
                  <button
                    onClick={() => void logout()}
                    className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-[#8A949F] hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    Se déconnecter
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Contenu ────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            {/* En-tête */}
            <header className="flex items-start justify-between gap-4 mb-5">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {ongletActif.label}
                </h1>
                <p className="text-[12.5px] text-[#8A949F] mt-0.5">
                  {ongletActif.description}
                </p>
              </div>

              {/* Bascule du menu — mobile */}
              <button
                onClick={() => setMenuOuvert((v) => !v)}
                className="lg:hidden p-2 rounded-lg border border-white/10 text-[#A2ABB5] hover:text-white flex-shrink-0"
                aria-label="Menu"
              >
                {menuOuvert ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </header>

            {/* Menu déroulant — mobile */}
            {menuOuvert && (
              <div className="lg:hidden mb-5 p-2 rounded-2xl bg-[#0B0D10] border border-white/10 space-y-0.5">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => aller(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      tab === id
                        ? 'bg-[#A3FF12]/10 text-[#A3FF12]'
                        : 'text-[#8A949F] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-[13px] font-bold">{label}</span>
                    {id === 'orders' && aProduire > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#A3FF12] text-black text-[10px] font-black tabular-nums">
                        {aProduire}
                      </span>
                    )}
                  </button>
                ))}
                <button
                  onClick={() => {
                    onNavigate('home');
                    setMenuOuvert(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[#8A949F] hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
                  <span className="text-[13px] font-bold">Voir le site</span>
                </button>
                <div className="px-3 py-2.5 border-t border-white/[0.07] mt-1">
                  <p className="text-[11.5px] font-semibold text-white truncate">
                    {session.email}
                  </p>
                  <button
                    onClick={() => void logout()}
                    className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-[#8A949F] hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    Se déconnecter
                  </button>
                </div>
              </div>
            )}

            {/* Onglet actif */}
            {tab === 'dashboard' && (
              <Dashboard onOpenOrders={() => setTab('orders')} />
            )}
            {tab === 'orders' && <Orders />}
            {tab === 'catalog' && <Catalog />}
            {tab === 'outreach' && <Outreach />}
            {tab === 'settings' && (
              <SettingsPanel onPromotionChanged={onPromotionChanged} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
