import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Check,
  Download,
  Loader2,
  Lock,
  RefreshCw,
  Ticket,
  Trash2,
  Unlock,
} from 'lucide-react';
import { api } from '../lib/api.js';
import type { Package, PromoCode, PromoState } from '../types.js';
import { Badge, Button, Card, Empty, ErrorNote, Field, Input, Select, Stat } from './ui.js';

/* ------------------------------------------------------------------ */
/*  Codes promo — studio                                               */
/* ------------------------------------------------------------------ */

const ETAT_TON: Record<PromoState, 'green' | 'gray' | 'yellow' | 'red'> = {
  Actif: 'green',
  Utilisé: 'gray',
  Expiré: 'yellow',
  Désactivé: 'red',
};

const FILTRES = [
  ['tous', 'Tous'],
  ['Actif', 'Disponibles'],
  ['Utilisé', 'Utilisés'],
  ['Expiré', 'Expirés'],
  ['Désactivé', 'Désactivés'],
] as const;

type Filtre = (typeof FILTRES)[number][0];

export default function Promo() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [filtre, setFiltre] = useState<Filtre>('tous');

  /* --- Formulaire de génération --- */
  const [label, setLabel] = useState('');
  const [packageId, setPackageId] = useState('');
  const [type, setType] = useState<'free' | 'percent'>('percent');
  const [percent, setPercent] = useState(50);
  const [includeVipFee, setIncludeVipFee] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [count, setCount] = useState(1);
  const [note, setNote] = useState('');
  const [generation, setGeneration] = useState(false);
  const [dernierLot, setDernierLot] = useState<string[]>([]);
  const [copie, setCopie] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur('');
    try {
      const [c, p] = await Promise.all([api.admin.promos(), api.admin.packages()]);
      setCodes(c);
      setPackages(p);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Chargement impossible.');
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const nomForfait = (id: string | null) =>
    id ? (packages.find((p) => p.id === id)?.name ?? 'Forfait supprimé') : 'Tous les forfaits';

  const remiseLisible = (c: PromoCode) =>
    c.discountType === 'free' ? 'Gratuit (100 %)' : `−${c.percentOff} %`;

  const filtres = useMemo(
    () => (filtre === 'tous' ? codes : codes.filter((c) => c.state === filtre)),
    [codes, filtre],
  );

  const stats = useMemo(() => {
    const actifs = codes.filter((c) => c.state === 'Actif').length;
    const utilises = codes.filter((c) => c.state === 'Utilisé').length;
    const offerts = codes.filter((c) => c.state === 'Utilisé' && c.discountType === 'free').length;
    return { actifs, utilises, offerts, total: codes.length };
  }, [codes]);

  const copier = async (texte: string, cle: string) => {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(cle);
      window.setTimeout(() => setCopie((v) => (v === cle ? null : v)), 1600);
    } catch {
      /* Le presse-papiers peut être refusé : l'utilisateur copie à la main. */
    }
  };

  const generer = async () => {
    setGeneration(true);
    setErreur('');
    try {
      const lot = await api.admin.generatePromos({
        label,
        packageId: packageId || null,
        discountType: type,
        percentOff: type === 'free' ? 100 : percent,
        includeVipFee,
        expiresAt: expiresAt || null,
        note,
        count,
      });
      setDernierLot(lot.map((c) => c.code));
      setCodes((prev) => [...lot, ...prev]);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Génération impossible.');
    } finally {
      setGeneration(false);
    }
  };

  const basculer = async (c: PromoCode) => {
    try {
      const maj = await api.admin.updatePromo(c.id, { isActive: !c.isActive });
      setCodes((prev) => prev.map((x) => (x.id === maj.id ? { ...x, ...maj } : x)));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Mise à jour impossible.');
    }
  };

  const liberer = async (c: PromoCode) => {
    if (!window.confirm(`Libérer le code ${c.code} ? Il redeviendra utilisable.`)) return;
    try {
      await api.admin.releasePromo(c.id);
      await charger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Libération impossible.');
    }
  };

  const supprimer = async (c: PromoCode) => {
    if (!window.confirm(`Supprimer définitivement le code ${c.code} ?`)) return;
    try {
      await api.admin.deletePromo(c.id);
      setCodes((prev) => prev.filter((x) => x.id !== c.id));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Suppression impossible.');
    }
  };

  /** Export CSV des codes affichés — prêt pour une campagne WhatsApp. */
  const exporter = () => {
    const entetes = ['code', 'etat', 'forfait', 'remise', 'expire_le', 'commande'];
    const lignes = filtres.map((c) => [
      c.code,
      c.state,
      nomForfait(c.packageId),
      c.discountType === 'free' ? '100%' : `${c.percentOff}%`,
      c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      c.orderReference ?? '',
    ]);
    const csv = [entetes, ...lignes]
      .map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voxmory-codes-promo-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Codes générés" value={stats.total} hint="Depuis le début" />
        <Stat label="Disponibles" value={stats.actifs} accent="text-[#A3FF12]" hint="Utilisables maintenant" />
        <Stat label="Consommés" value={stats.utilises} hint="Un code = une chanson" />
        <Stat label="Chansons offertes" value={stats.offerts} hint="Codes à 100 %" />
      </div>

      {erreur && <ErrorNote message={erreur} />}

      <Card
        title="Générer des codes"
        subtitle="Chaque code ne peut servir qu’une seule fois."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nom de l’opération" hint="Interne — jamais montré au client.">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex. Lancement mariage — WhatsApp mars"
              maxLength={120}
            />
          </Field>

          <Field label="Forfait concerné">
            <Select value={packageId} onChange={(e) => setPackageId(e.target.value)}>
              <option value="">Tous les forfaits</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.priceLabel}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Type de remise">
            <Select value={type} onChange={(e) => setType(e.target.value as 'free' | 'percent')}>
              <option value="percent">Remise en pourcentage</option>
              <option value="free">Gratuit (100 %)</option>
            </Select>
          </Field>

          {type === 'percent' ? (
            <Field label="Pourcentage de remise">
              <Input
                type="number"
                min={1}
                max={99}
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value) || 0)}
              />
            </Field>
          ) : (
            <Field label="Pourcentage de remise" hint="Un code « gratuit » vaut toujours 100 %.">
              <Input value="100" disabled readOnly />
            </Field>
          )}

          <Field label="Date d’expiration" hint="Vide = sans limite.">
            <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </Field>

          <Field label="Nombre de codes à générer" hint="1 à 50 d’un coup.">
            <Input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
            />
          </Field>

          <Field label="Note interne" hint="Facultatif.">
            <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
          </Field>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 cursor-pointer self-end">
            <input
              type="checkbox"
              checked={includeVipFee}
              onChange={(e) => setIncludeVipFee(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#A3FF12]"
            />
            <span className="text-[12px] text-[#C3CAD2] leading-relaxed">
              La remise s’applique aussi à la carte VIP (+2 $).
              <span className="block text-[11px] text-[#8A949F]">
                Par défaut, la carte VIP reste due.
              </span>
            </span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-white/10">
          <Button variant="primary" onClick={generer} disabled={generation}>
            {generation ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1.5" />
                Génération…
              </>
            ) : (
              <>
                <Ticket className="w-3.5 h-3.5 inline mr-1.5" />
                Générer {count > 1 ? `${count} codes` : 'un code'}
              </>
            )}
          </Button>
          {dernierLot.length > 0 && (
            <button
              onClick={() => copier(dernierLot.join('\n'), 'lot')}
              className="text-[11px] font-bold text-[#A3FF12] hover:underline"
            >
              {copie === 'lot' ? 'Lot copié ✓' : `Copier les ${dernierLot.length} codes`}
            </button>
          )}
        </div>

        {dernierLot.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-[#A3FF12]/8 border border-[#A3FF12]/25">
            <p className="text-[10px] uppercase tracking-widest text-[#A3FF12] font-bold mb-2">
              Dernier lot généré
            </p>
            <div className="flex flex-wrap gap-2">
              {dernierLot.map((code) => (
                <button
                  key={code}
                  onClick={() => copier(code, code)}
                  className="font-mono text-[12px] font-bold text-white bg-black/40 border border-white/15 rounded px-2 py-1 hover:border-[#A3FF12]"
                  title="Copier"
                >
                  {copie === code ? '✓ copié' : code}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card
        title="Codes existants"
        subtitle={`${filtres.length} code${filtres.length > 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={exporter}>
              <Download className="w-3.5 h-3.5 inline mr-1.5" />
              CSV
            </Button>
            <Button onClick={() => void charger()}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        }
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {FILTRES.map(([id, libelle]) => (
            <button
              key={id}
              onClick={() => setFiltre(id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                filtre === id
                  ? 'bg-[#A3FF12] text-black'
                  : 'bg-white/5 text-[#C3CAD2] border border-white/10 hover:bg-white/10'
              }`}
            >
              {libelle}
            </button>
          ))}
        </div>

        {chargement ? (
          <div className="flex items-center gap-2 text-xs text-[#8A949F] py-6">
            <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
          </div>
        ) : filtres.length === 0 ? (
          <Empty message="Aucun code dans cette vue. Générez-en un ci-dessus." />
        ) : (
          <div className="divide-y divide-white/5">
            {filtres.map((c) => (
              <div key={c.id} className="py-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => copier(c.code, c.id)}
                  className="font-mono text-[13px] font-black tracking-wide text-white bg-black/40 border border-white/15 rounded-lg px-2.5 py-1.5 hover:border-[#A3FF12] min-w-[132px] text-left"
                  title="Copier le code"
                >
                  {copie === c.id ? (
                    <span className="text-[#A3FF12] flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> copié
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      {c.code}
                      <Copy className="w-3 h-3 text-[#7E8894]" />
                    </span>
                  )}
                </button>

                <Badge tone={ETAT_TON[c.state]}>{c.state}</Badge>
                <span className="text-[11px] font-bold text-[#A3FF12] w-24">{remiseLisible(c)}</span>
                <span className="text-[11px] text-[#C3CAD2] flex-1 min-w-[140px]">
                  {nomForfait(c.packageId)}
                  {c.label && <span className="text-[#7E8894]"> · {c.label}</span>}
                </span>

                {c.orderReference && (
                  <span className="text-[10px] font-mono text-[#8A949F]">{c.orderReference}</span>
                )}
                {c.expiresAt && (
                  <span className="text-[10px] text-[#7E8894]">
                    exp. {c.expiresAt.slice(0, 10)}
                  </span>
                )}

                <div className="flex items-center gap-1 ml-auto">
                  {c.state === 'Utilisé' && c.orderPaid === false && (
                    <Button onClick={() => void liberer(c)}>
                      <Unlock className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button onClick={() => void basculer(c)}>
                    <Lock className="w-3.5 h-3.5" />
                    {c.isActive ? 'Désactiver' : 'Réactiver'}
                  </Button>
                  {c.state !== 'Utilisé' && (
                    <Button variant="danger" onClick={() => void supprimer(c)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="text-[11px] text-[#7E8894] leading-relaxed">
        Un code ne sert qu’une fois, et seulement sur le forfait choisi. Le montant et la remise
        sont figés à la commande : désactiver un code plus tard ne change aucune commande passée.
        Un code consommé par une commande impayée peut être libéré.
      </p>
    </div>
  );
}
