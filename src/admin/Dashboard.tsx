import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Globe2,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
  TrendingUp,
  Users2,
  Wallet,
} from 'lucide-react';
import { api } from '../lib/api.js';
import type { Analytics, Repartition } from '../types.js';
import { Card, ErrorNote } from './ui.js';

/**
 * Tableau de bord du studio.
 *
 * Il répond à une seule question : « par quoi est-ce que je commence ? »
 * Les graphiques décoratifs n'aident personne à trois heures du matin
 * quand une chanson doit partir le lendemain. On affiche donc d'abord ce
 * qui attend une action, ensuite ce qui mesure la santé de l'activité.
 *
 * Chaque chiffre provient de la base de données. Aucune valeur n'est
 * simulée : mieux vaut un écran vide qu'un écran faux, parce qu'une
 * décision prise sur un chiffre inventé est une décision de travers.
 */

const PERIODES = [
  { jours: 7, libelle: '7 jours' },
  { jours: 30, libelle: '30 jours' },
  { jours: 90, libelle: '90 jours' },
];

const COULEUR_APPAREIL: Record<string, string> = {
  mobile: 'bg-[#A3FF12]',
  tablet: 'bg-[#7ACC00]',
  desktop: 'bg-[#4C5A66]',
};

const LIBELLE_APPAREIL: Record<string, string> = {
  mobile: 'Téléphone',
  tablet: 'Tablette',
  desktop: 'Ordinateur',
};

const ICONE_APPAREIL: Record<string, typeof Monitor> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

export default function Dashboard({ onOpenOrders }: { onOpenOrders: () => void }) {
  const [jours, setJours] = useState(30);
  const [data, setData] = useState<Analytics | null>(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    setData(null);
    api.admin
      .analytics(jours)
      .then(setData)
      .catch((e) => setErreur(e instanceof Error ? e.message : 'Analyse indisponible.'));
  }, [jours]);

  if (erreur) return <ErrorNote message={erreur} />;

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24 text-[#8A949F] gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Chargement des mesures…
      </div>
    );
  }

  const { audience, audienceAujourdhui, ventes, commandes, utilisateurs } = data;

  return (
    <div className="space-y-5">
      {/* ── Période + ce qui attend une action ─────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex p-0.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          {PERIODES.map((p) => (
            <button
              key={p.jours}
              onClick={() => setJours(p.jours)}
              className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-colors ${
                jours === p.jours
                  ? 'bg-[#A3FF12] text-black'
                  : 'text-[#8A949F] hover:text-white'
              }`}
            >
              {p.libelle}
            </button>
          ))}
        </div>

        {commandes.enCours > 0 && (
          <button
            onClick={onOpenOrders}
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#A3FF12]/10 border border-[#A3FF12]/25 text-[#A3FF12] text-[12.5px] font-bold hover:bg-[#A3FF12]/20 transition-colors"
          >
            {commandes.enCours} chanson{commandes.enCours > 1 ? 's' : ''} à produire
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>

      {/* ── Indicateurs ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Indicateur
          libelle="Visiteurs"
          valeur={audience.visiteurs}
          sous={`${audience.nouveaux} nouveau${audience.nouveaux > 1 ? 'x' : ''} · ${audience.revenus} revenu${audience.revenus > 1 ? 's' : ''}`}
          icone={Users2}
        />
        <Indicateur
          libelle="Pages vues"
          valeur={audience.pagesVues}
          sous={`${audience.pagesParVisite} page${audience.pagesParVisite > 1 ? 's' : ''} par visite`}
          icone={Globe2}
        />
        <Indicateur
          libelle="Chiffre d'affaires"
          valeur={`${(ventes.chiffreAffairesCents / 100).toLocaleString('fr-FR')} $`}
          sous={`${(ventes.chiffreAffairesMoisCents / 100).toLocaleString('fr-FR')} $ ce mois-ci`}
          icone={Wallet}
          accent
        />
        <Indicateur
          libelle="Panier moyen"
          valeur={`${(ventes.panierMoyenCents / 100).toLocaleString('fr-FR')} $`}
          sous={
            ventes.tauxConversion === null
              ? 'Conversion : pas encore de visiteur mesuré'
              : `Conversion : ${ventes.tauxConversion} %`
          }
          icone={TrendingUp}
        />
      </div>

      {/* ── Courbe d'audience ──────────────────────────────────────── */}
      <Card
        title="Fréquentation"
        subtitle={`Visiteurs et pages vues — ${jours} derniers jours`}
      >
        <Courbe
          points={data.serieQuotidienne.map((p) => ({
            date: p.date,
            principal: p.visiteurs,
            secondaire: p.pagesVues,
          }))}
          legendePrimaire="Visiteurs"
          legendeSecondaire="Pages vues"
        />
      </Card>

      {/* ── Ventes ─────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card
          title="Ventes"
          subtitle={`Chiffre d'affaires encaissé — ${jours} jours`}
          className="lg:col-span-2"
        >
          <BarresVentes points={ventes.serieVentes} />
        </Card>

        <Card title="État des commandes" subtitle="Toutes périodes">
          <Repartition verticale donnees={statutsEnListe(commandes.parStatut)} />
        </Card>
      </div>

      {/* ── Pages, sources, appareils, pays ────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Pages les plus vues" subtitle="Ce qui intéresse">
          <Repartition donnees={data.pagesLesPlusVues} />
        </Card>

        <Card title="Provenance" subtitle="D'où arrivent les visiteurs">
          <Repartition donnees={data.sources} />
        </Card>

        <Card title="Appareils" subtitle="Téléphone, tablette, ordinateur">
          {data.appareils.length === 0 ? (
            <p className="text-[12.5px] text-[#6C7581] py-3">Aucune donnée.</p>
          ) : (
            <div className="space-y-3">
              {data.appareils.map((a) => {
                const total = data.appareils.reduce((s, x) => s + x.total, 0) || 1;
                const Icone = ICONE_APPAREIL[a.cle] ?? Monitor;
                return (
                  <div key={a.cle}>
                    <div className="flex items-center justify-between text-[12px] mb-1">
                      <span className="text-[#C2CAD3] flex items-center gap-1.5">
                        <Icone className="w-3.5 h-3.5 text-[#8A949F]" />
                        {LIBELLE_APPAREIL[a.cle] ?? a.cle}
                      </span>
                      <span className="text-[#8A949F] tabular-nums">
                        {Math.round((a.total / total) * 100)} %
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${COULEUR_APPAREIL[a.cle] ?? 'bg-[#4C5A66]'}`}
                        style={{ width: `${(a.total / total) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Pays" subtitle="D'après l'en-tête réseau">
          <Repartition donnees={data.pays} />
        </Card>
      </div>

      {/* ── Derniers mouvements ────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card
          title="Dernières commandes"
          subtitle="Les plus récentes d'abord"
          className="lg:col-span-2"
        >
          {commandes.dernieres.length === 0 ? (
            <p className="text-[12.5px] text-[#6C7581] py-6 text-center">
              Aucune commande pour l'instant.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="text-[#6C7581] text-left border-b border-white/[0.06]">
                    <th className="pb-2 font-semibold">Référence</th>
                    <th className="pb-2 font-semibold">Client</th>
                    <th className="pb-2 font-semibold">Étape</th>
                    <th className="pb-2 font-semibold text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {commandes.dernieres.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="py-2.5 font-mono text-[11px] text-[#8A949F]">
                        {o.reference}
                      </td>
                      <td className="py-2.5 text-[#E8ECEF]">{o.customerName}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                            o.status === 'Livrée'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : o.status === 'Annulée'
                                ? 'bg-red-500/15 text-red-300'
                                : 'bg-white/[0.07] text-[#C2CAD3]'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-[#E8ECEF]">
                        {(o.amountCents / 100).toLocaleString('fr-FR')} $
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card title="Comptes clients" subtitle={`${utilisateurs.total} inscrit${utilisateurs.total > 1 ? 's' : ''}`}>
            {utilisateurs.recents.length === 0 ? (
              <p className="text-[12.5px] text-[#6C7581] py-3">
                Aucun compte pour l'instant. Les commandes restent possibles
                sans inscription.
              </p>
            ) : (
              <div className="space-y-1.5">
                {utilisateurs.recents.slice(0, 6).map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-2 py-1">
                    <div className="min-w-0">
                      <p className="text-[12.5px] text-[#E8ECEF] truncate">{u.name}</p>
                      <p className="text-[11px] text-[#6C7581] truncate">{u.email}</p>
                    </div>
                    <span className="text-[10.5px] text-[#6C7581] flex-shrink-0">
                      {formaterDate(u.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Aujourd'hui" subtitle="Depuis minuit">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#6C7581] font-semibold">
                  Visiteurs
                </p>
                <p className="text-xl font-black text-white tabular-nums">
                  {audienceAujourdhui.visiteurs}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#6C7581] font-semibold">
                  Pages vues
                </p>
                <p className="text-xl font-black text-[#A3FF12] tabular-nums">
                  {audienceAujourdhui.pagesVues}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {data.paiements.length > 0 && (
        <Card title="Derniers paiements" subtitle="Transactions reçues">
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-[#6C7581] text-left border-b border-white/[0.06]">
                  <th className="pb-2 font-semibold">Date</th>
                  <th className="pb-2 font-semibold">Référence</th>
                  <th className="pb-2 font-semibold">Statut</th>
                  <th className="pb-2 font-semibold text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {data.paiements.map((p) => (
                  <tr key={p.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="py-2.5 text-[#8A949F]">{formaterDate(p.createdAt)}</td>
                    <td className="py-2.5 font-mono text-[11px] text-[#8A949F]">
                      {p.orderId ? p.orderId.slice(0, 12) + '…' : '—'}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                          p.status === 'Paid' || p.status === 'Success' || p.status === 'success'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[#E8ECEF]">
                      {(p.amountCents / 100).toLocaleString('fr-FR')} {p.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sous-composants                                                     */
/* ------------------------------------------------------------------ */

function Indicateur({
  libelle,
  valeur,
  sous,
  icone: Icone,
  accent = false,
}: {
  libelle: string;
  valeur: string | number;
  sous: string;
  icone: typeof Users2;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#0B0D10] border border-white/10 rounded-2xl p-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icone className="w-3.5 h-3.5 text-[#6C7581]" />
        <p className="text-[10px] uppercase tracking-widest text-[#8A949F] font-semibold">
          {libelle}
        </p>
      </div>
      <p
        className={`text-2xl font-black mt-0.5 tabular-nums ${accent ? 'text-[#A3FF12]' : 'text-white'}`}
      >
        {valeur}
      </p>
      <p className="text-[11px] text-[#6C7581] mt-1 leading-snug">{sous}</p>
    </div>
  );
}

/**
 * Courbe à deux séries.
 *
 * Dessinée en SVG à taille fixe plutôt qu'en barres : sur trente jours,
 * des barres deviennent trop fines pour être comparées, alors qu'une
 * courbe reste lisible.
 */
function Courbe({
  points,
  legendePrimaire,
  legendeSecondaire,
}: {
  points: { date: string; principal: number; secondaire: number }[];
  legendePrimaire: string;
  legendeSecondaire: string;
}) {
  const { cheminPrincipal, cheminSecondaire, max } = useMemo(() => {
    if (points.length === 0) return { cheminPrincipal: '', cheminSecondaire: '', max: 1 };
    const plafond = Math.max(1, ...points.map((p) => Math.max(p.principal, p.secondaire)));
    const largeur = 700;
    const hauteur = 160;

    const tracer = (cle: 'principal' | 'secondaire') =>
      points
        .map((p, i) => {
          const x = (i / Math.max(1, points.length - 1)) * largeur;
          const y = hauteur - (p[cle] / plafond) * (hauteur - 12);
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');

    return {
      cheminPrincipal: tracer('principal'),
      cheminSecondaire: tracer('secondaire'),
      max: plafond,
    };
  }, [points]);

  if (points.length === 0) {
    return (
      <p className="text-[12.5px] text-[#6C7581] py-8 text-center">
        Les courbes apparaîtront dès les premières visites.
      </p>
    );
  }

  const remplissage = `${cheminPrincipal} L700,160 L0,160 Z`;
  const totalPrincipal = points.reduce((s, p) => s + p.principal, 0);

  return (
    <div>
      <svg
        viewBox="0 0 700 160"
        preserveAspectRatio="none"
        className="w-full h-40"
        role="img"
        aria-label={`${legendePrimaire} et ${legendeSecondaire} sur la période`}
      >
        <defs>
          <linearGradient id="remplissageCourbe" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A3FF12" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#A3FF12" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Lignes de repère */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1="0"
            y1={160 * f}
            x2="700"
            y2={160 * f}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}

        <path d={remplissage} fill="url(#remplissageCourbe)" />
        <path
          d={cheminSecondaire}
          fill="none"
          stroke="rgba(163,255,18,0.30)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <path
          d={cheminPrincipal}
          fill="none"
          stroke="#A3FF12"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>

      <div className="flex flex-wrap items-center gap-4 mt-2 pt-3 border-t border-white/[0.06] text-[11px]">
        <span className="flex items-center gap-1.5 text-[#8A949F]">
          <span className="w-3 h-0.5 rounded-full bg-[#A3FF12]" /> {legendePrimaire}
        </span>
        <span className="flex items-center gap-1.5 text-[#8A949F]">
          <span className="w-3 h-0.5 rounded-full bg-[#A3FF12]/35" /> {legendeSecondaire}
        </span>
        <span className="ml-auto text-[#6C7581]">
          Maximum : {max} · Total : {totalPrincipal.toLocaleString('fr-FR')}
        </span>
      </div>
    </div>
  );
}

/** Barres de chiffre d'affaires. */
function BarresVentes({ points }: { points: { date: string; montantCents: number }[] }) {
  const plafond = Math.max(1, ...points.map((p) => p.montantCents));
  const total = points.reduce((s, p) => s + p.montantCents, 0);

  if (total === 0) {
    return (
      <p className="text-[12.5px] text-[#6C7581] py-10 text-center">
        Aucun encaissement sur la période. Les ventes apparaîtront ici dès
        la première commande payée.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-end gap-[3px] h-36">
        {points.map((p) => (
          <div
            key={p.date}
            className="flex-1 bg-[#A3FF12]/80 rounded-t min-h-[2px] hover:bg-[#A3FF12] transition-colors"
            style={{ height: `${Math.max(1.5, (p.montantCents / plafond) * 100)}%` }}
            title={`${p.date} — ${(p.montantCents / 100).toLocaleString('fr-FR')} $`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/[0.06] text-[11px] text-[#6C7581]">
        <span>{points[0]?.date?.slice(5)}</span>
        <span className="text-[#A3FF12] font-bold">
          {(total / 100).toLocaleString('fr-FR')} $ encaissés
        </span>
        <span>{points[points.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  );
}

/** Répartition en barres horizontales. */
function Repartition({
  donnees,
  verticale = false,
}: {
  donnees: Repartition[];
  verticale?: boolean;
}) {
  if (donnees.length === 0) {
    return <p className="text-[12.5px] text-[#6C7581] py-3">Aucune donnée.</p>;
  }

  const total = donnees.reduce((s, d) => s + d.total, 0) || 1;
  const max = Math.max(...donnees.map((d) => d.total)) || 1;

  return (
    <div className="space-y-2">
      {donnees.map((d) => {
        const part = Math.round((d.total / total) * 100);
        return (
          <div key={d.cle}>
            <div className="flex items-center justify-between text-[12px] mb-1 gap-2">
              <span className="text-[#C2CAD3] truncate">{d.cle}</span>
              <span className="text-[#8A949F] tabular-nums flex-shrink-0">
                {d.total} · {part} %
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full ${verticale ? 'bg-[#A3FF12]' : 'bg-[#A3FF12]/75'}`}
                style={{ width: `${(d.total / max) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function statutsEnListe(parStatut: Record<string, number>): Repartition[] {
  return Object.entries(parStatut)
    .filter(([, n]) => n > 0)
    .map(([cle, total]) => ({ cle, total }))
    .sort((a, b) => b.total - a.total);
}

function formaterDate(v: string | null): string {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(+d) ? '—' : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}
