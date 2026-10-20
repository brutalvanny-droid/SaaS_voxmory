import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Loader2,
  Music4,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { Badge, Button, Card, ErrorNote, Stat } from './ui.js';

/**
 * Tableau de bord du studio.
 *
 * Il répond à une seule question : « par quoi est-ce que je commence ? »
 * Les graphiques décoratifs n'aident personne à trois heures du matin
 * quand une chanson doit partir le lendemain. On affiche donc d'abord ce
 * qui attend une action, ensuite ce qui mesure la santé de l'activité.
 */

type Stats = Awaited<ReturnType<typeof api.admin.stats>>;

/** Statuts qui réclament une action humaine aujourd'hui. */
const STATUTS_ACTIFS = [
  'Nouvelle',
  'En écriture',
  'En composition',
  'En enregistrement',
  'En relecture',
];

const COULEUR_STATUT: Record<string, string> = {
  Nouvelle: 'bg-blue-500',
  'En écriture': 'bg-violet-500',
  'En composition': 'bg-purple-500',
  'En enregistrement': 'bg-amber-500',
  'En relecture': 'bg-cyan-500',
  Livrée: 'bg-emerald-500',
  Annulée: 'bg-neutral-600',
  Archivée: 'bg-neutral-700',
};

export default function Dashboard({ onOpenOrders }: { onOpenOrders: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.admin
      .stats()
      .then(setStats)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Statistiques indisponibles.'),
      );
  }, []);

  if (error) return <ErrorNote message={error} />;

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-24 text-[#8A949F] gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Chargement du tableau de bord…
      </div>
    );
  }

  const enCours = (stats.ordersByStatus ?? [])
    .filter((s) => STATUTS_ACTIFS.includes(s.status))
    .reduce((total, s) => total + s.count, 0);

  const aTraiter =
    enCours +
    (stats.ordersByStatus ?? []).filter(
      (s) => s.status === 'Nouvelle' && s.count > 0,
    ).length;

  const jours = stats.dailyStats.slice(-14);
  const maxVisites = Math.max(1, ...jours.map((d) => d.visits));
  const maxCommandes = Math.max(1, ...jours.map((d) => d.orders ?? 0));

  return (
    <div className="space-y-5">
      {/* ── Ce qui réclame une action ─────────────────────────────────── */}
      {aTraiter > 0 && (
        <button
          onClick={onOpenOrders}
          className="w-full text-left group flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#A3FF12]/[0.12] to-[#A3FF12]/[0.02] border border-[#A3FF12]/25 hover:border-[#A3FF12]/45 transition-colors"
        >
          <span className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#A3FF12] text-black grid place-items-center">
            <Sparkles className="w-5 h-5" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-bold text-white">
              {enCours} chanson{enCours > 1 ? 's' : ''} en cours de production
            </span>
            <span className="block text-[13px] text-[#A2ABB5] mt-0.5">
              {stats.pendingPayment > 0
                ? `${stats.pendingPayment} commande${stats.pendingPayment > 1 ? 's' : ''} en attente de paiement · `
                : ''}
              Ouvrir les commandes pour avancer
            </span>
          </span>
          <ArrowRight className="w-4 h-4 text-[#A3FF12] flex-shrink-0 transition-transform group-hover:translate-x-1" />
        </button>
      )}

      {/* ── Indicateurs ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label="Chiffre d'affaires"
          value={`${(stats.totalRevenueCents / 100).toLocaleString('fr-FR')} $`}
          accent="text-[#A3FF12]"
          hint={`dont ${(stats.revenueThisMonthCents / 100).toLocaleString('fr-FR')} $ ce mois-ci`}
        />
        <Stat
          label="Commandes"
          value={stats.totalOrders}
          hint={`${stats.ordersThisMonth} ce mois-ci`}
        />
        <Stat
          label="Panier moyen"
          value={`${(stats.averageOrderCents / 100).toLocaleString('fr-FR')} $`}
          accent="text-white"
          hint={`${stats.delivered} chanson${stats.delivered > 1 ? 's' : ''} livrée${stats.delivered > 1 ? 's' : ''}`}
        />
        <Stat
          label="Satisfaction"
          value={`${stats.averageRating} / 5`}
          accent="text-[#A3FF12]"
          hint={`${stats.clientSatisfaction} % d'avis positifs`}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* ── Audience ──────────────────────────────────────────────── */}
        <Card
          title="Audience — 14 derniers jours"
          subtitle="Visites, écoutes et commandes"
          className="lg:col-span-2"
        >
          {jours.length === 0 ? (
            <p className="text-sm text-[#6C7581] py-8 text-center">
              Les chiffres apparaîtront dès les premières visites.
            </p>
          ) : (
            <>
              <div className="flex items-end gap-1.5 h-36">
                {jours.map((d) => {
                  const commandes = d.orders ?? 0;
                  return (
                    <div
                      key={d.date}
                      className="flex-1 flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-full flex items-end justify-center gap-[2px] h-28">
                        <div
                          className="w-1/2 bg-[#A3FF12]/25 rounded-t transition-colors group-hover:bg-[#A3FF12]/40"
                          style={{ height: `${(d.visits / maxVisites) * 100}%` }}
                          title={`${d.visits} visites`}
                        />
                        <div
                          className="w-1/2 bg-[#A3FF12] rounded-t"
                          style={{ height: `${(d.listens / maxVisites) * 100}%` }}
                          title={`${d.listens} écoutes`}
                        />
                      </div>
                      {commandes > 0 && (
                        <span
                          className="text-[9px] font-bold text-[#A3FF12]"
                          title={`${commandes} commande${commandes > 1 ? 's' : ''}`}
                        >
                          {commandes > maxCommandes ? '' : ''}
                          {'●'.repeat(Math.min(commandes, 3))}
                        </span>
                      )}
                      {commandes === 0 && <span className="text-[9px] text-transparent">·</span>}
                      <span className="text-[9px] text-[#6C7581]">
                        {d.date.slice(8)}/{d.date.slice(5, 7)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-white/[0.06] text-[11px] text-[#8A949F]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#A3FF12]/25" /> Visites
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#A3FF12]" /> Écoutes
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[#A3FF12] font-bold">●</span> Commandes du jour
                </span>
                <span className="ml-auto">
                  {stats.visitsCount.toLocaleString('fr-FR')} visites cumulées
                </span>
              </div>
            </>
          )}
        </Card>

        {/* ── Pipeline ──────────────────────────────────────────────── */}
        <Card title="Où en sont les commandes" subtitle="Par étape de production">
          <div className="space-y-2.5">
            {(stats.ordersByStatus ?? [])
              .filter((s) => s.count > 0)
              .map((s) => {
                const pct = stats.totalOrders
                  ? Math.round((s.count / stats.totalOrders) * 100)
                  : 0;
                return (
                  <div key={s.status}>
                    <div className="flex items-center justify-between text-[11.5px] mb-1">
                      <span
                        className={
                          STATUTS_ACTIFS.includes(s.status)
                            ? 'text-[#C2CAD3] font-semibold'
                            : 'text-[#8A949F]'
                        }
                      >
                        {s.status}
                      </span>
                      <span className="text-[#8A949F] tabular-nums">
                        {s.count} · {pct} %
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${COULEUR_STATUT[s.status] ?? 'bg-neutral-500'}`}
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            {stats.totalOrders === 0 && (
              <p className="text-sm text-[#6C7581] py-4">Aucune commande pour l'instant.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* ── Dernières commandes ───────────────────────────────────── */}
        <Card
          title="Dernières commandes"
          subtitle="Les plus récentes d'abord"
          className="lg:col-span-2"
          actions={
            <Button onClick={onOpenOrders}>
              Tout voir
              <ArrowUpRight className="w-3 h-3 inline ml-1" />
            </Button>
          }
        >
          {(stats.recentOrders ?? []).length === 0 ? (
            <p className="text-sm text-[#6C7581] py-8 text-center">
              Vos premières commandes apparaîtront ici.
            </p>
          ) : (
            <div className="divide-y divide-white/[0.06] -mt-1">
              {stats.recentOrders.map((o) => {
                const enCoursCommande = STATUTS_ACTIFS.includes(o.status);
                return (
                  <button
                    key={o.id}
                    onClick={onOpenOrders}
                    className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-white/[0.02] transition-colors rounded px-1 -mx-1"
                  >
                    <span
                      className={`w-1.5 h-9 rounded-full flex-shrink-0 ${
                        COULEUR_STATUT[o.status] ?? 'bg-neutral-500'
                      }`}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-semibold text-white truncate">
                        {o.customerName}
                      </span>
                      <span className="block text-[11px] text-[#8A949F] truncate">
                        {o.packageName} · {o.reference}
                      </span>
                    </span>
                    <span className="text-right flex-shrink-0">
                      <span className="block text-[12px] font-bold text-white tabular-nums">
                        {(o.amountCents / 100).toLocaleString('fr-FR')} $
                      </span>
                      <span
                        className={`block text-[10.5px] ${
                          o.paymentStatus === 'Paid'
                            ? 'text-emerald-400'
                            : o.paymentStatus === 'Failed'
                              ? 'text-red-400'
                              : 'text-amber-400'
                        }`}
                      >
                        {o.paymentStatus === 'Paid'
                          ? 'Payée'
                          : o.paymentStatus === 'Failed'
                            ? 'Échec'
                            : 'En attente'}
                      </span>
                    </span>
                    <span className="hidden sm:block flex-shrink-0">
                      <Badge tone={enCoursCommande ? 'green' : 'gray'}>{o.status}</Badge>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          {/* ── Formules ──────────────────────────────────────────── */}
          <Card title="Formules les plus demandées" subtitle="Hors commandes annulées">
            {(stats.topPackages ?? []).length === 0 ? (
              <p className="text-sm text-[#6C7581] py-4">Aucune vente enregistrée.</p>
            ) : (
              <div className="space-y-3">
                {stats.topPackages.map((p, i) => {
                  const max = Math.max(...stats.topPackages.map((x) => x.count));
                  return (
                    <div key={p.name}>
                      <div className="flex items-center justify-between text-[11.5px] mb-1">
                        <span className="text-[#C2CAD3] truncate flex items-center gap-1.5">
                          <span className="text-[#6C7581] tabular-nums">{i + 1}.</span>
                          {p.name}
                        </span>
                        <span className="text-[#8A949F] tabular-nums flex-shrink-0 ml-2">
                          {p.count}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#A3FF12]"
                          style={{ width: `${(p.count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* ── Clients ───────────────────────────────────────────── */}
          <Card title="Clients" subtitle="Adresses e-mail distinctes">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#8A949F] font-semibold">
                  Acheteurs
                </p>
                <p className="text-xl font-black text-white mt-0.5 tabular-nums">
                  {stats.totalClients}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#8A949F] font-semibold">
                  Comptes créés
                </p>
                <p className="text-xl font-black text-[#A3FF12] mt-0.5 tabular-nums">
                  {stats.clientsWithAccount}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-[#6C7581] mt-3 pt-3 border-t border-white/[0.06] leading-relaxed">
              {stats.totalClients > 0 && stats.clientsWithAccount === 0
                ? 'Aucun acheteur n’a encore créé de compte. Un compte leur permet de retrouver leurs chansons sans numéro de suivi.'
                : 'Un compte permet au client de retrouver ses chansons sans ressaisir son numéro de suivi.'}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
