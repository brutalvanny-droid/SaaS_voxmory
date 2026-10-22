import { useCallback, useEffect, useState } from 'react';
import {
  Save,
  Loader2,
  ShieldCheck,
  Megaphone,
} from 'lucide-react';
import { api } from '../lib/api.js';
import type { Package, PromotionSettings } from '../types.js';
import type { ReactNode } from 'react';
import { Badge, Button, Card, Empty, ErrorNote, Field, Input, Select, TextArea } from './ui.js';

type Tab = 'packages' | 'promotion' | 'whatsapp' | 'audit';

export default function SettingsPanel({ onPromotionChanged }: { onPromotionChanged: () => void }) {
  const [tab, setTab] = useState<Tab>('packages');

  return (
    <div className="space-y-5">
      <div className="flex gap-2 border-b border-white/10">
        {(
          [
            ['packages', 'Tarifs'],
            ['promotion', 'Bandeau promo'],
            ['whatsapp', 'WhatsApp'],
            ['audit', 'Journal'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${
              tab === id
                ? 'border-[#A3FF12] text-[#A3FF12]'
                : 'border-transparent text-[#8A949F] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'packages' && <Packages />}
      {tab === 'promotion' && <Promotion onChanged={onPromotionChanged} />}
      {tab === 'whatsapp' && <Whatsapp />}
      {tab === 'audit' && <Audit />}
    </div>
  );
}

/* ------------------------------ Tarifs ------------------------------ */

function Packages() {
  const [items, setItems] = useState<Package[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Partial<Package>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const rows = await api.admin.packages();
      setItems(rows);
      const d: Record<string, Partial<Package>> = {};
      rows.forEach((p) => {
        d[p.id] = {
          name: p.name,
          promise: p.promise,
          deliveryTime: p.deliveryTime,
          targetAudience: p.targetAudience ?? '',
          clientSends: p.clientSends ?? '',
          clientReceives: p.clientReceives ?? '',
          steps: p.steps ?? [],
          priceCents: p.priceCents,
          isActive: p.isActive,
        };
      });
      setDrafts(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const setField = (pkgId: string, field: string, value: any) => {
    setDrafts((d) => ({ ...d, [pkgId]: { ...d[pkgId], [field]: value } }));
  };

  const save = async (pkg: Package) => {
    setSaving(pkg.id);
    try {
      const d = drafts[pkg.id] ?? {};
      await api.admin.updatePackage(pkg.id, {
        name: d.name,
        promise: d.promise,
        deliveryTime: d.deliveryTime,
        targetAudience: d.targetAudience,
        clientSends: d.clientSends,
        clientReceives: d.clientReceives,
        steps: d.steps,
        priceCents: d.priceCents ?? pkg.priceCents,
        isActive: d.isActive ?? pkg.isActive,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <ErrorNote message={error} />
      <p className="text-xs text-[#8A949F]">
        Chaque formule peut être modifiée : nom, promesse, prix, délai, à qui
        s\'adresse le service, ce que le client nous envoie, ce qu\'il reçoit,
        et les 3 étapes de production.
      </p>
      {items.map((pkg) => {
        const d = drafts[pkg.id] ?? {};
        return (
          <Card key={pkg.id} title={pkg.name} subtitle={pkg.promise}>
            <div className="space-y-3">
              <Field label="Nom du service">
                <Input
                  value={d.name ?? pkg.name}
                  onChange={(e) => setField(pkg.id, 'name', e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#A3FF12] focus:outline-none"
                />
              </Field>
              <Field label="Promesse (sous-titre)">
                <Input
                  value={d.promise ?? pkg.promise}
                  onChange={(e) => setField(pkg.id, 'promise', e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#A3FF12] focus:outline-none"
                />
              </Field>
              <Field label="Prix (dollars)">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={String(d.priceCents ?? pkg.priceCents) ? (Number(d.priceCents ?? pkg.priceCents) / 100).toFixed(2) : ''}
                  onChange={(e) => setField(pkg.id, 'priceCents', Math.max(0, Math.round(Number(e.target.value) * 100)))}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#A3FF12] focus:outline-none"
                />
              </Field>
              <Field label="Délai de livraison">
                <Input
                  value={d.deliveryTime ?? pkg.deliveryTime}
                  onChange={(e) => setField(pkg.id, 'deliveryTime', e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#A3FF12] focus:outline-none"
                />
              </Field>
              <Field label="À qui s\'adresse ce service">
                <textarea
                  value={d.targetAudience ?? pkg.targetAudience}
                  onChange={(e) => setField(pkg.id, 'targetAudience', e.target.value)}
                  rows={2}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#A3FF12] focus:outline-none"
                />
              </Field>
              <Field label="Ce que le client nous envoie">
                <textarea
                  value={d.clientSends ?? pkg.clientSends}
                  onChange={(e) => setField(pkg.id, 'clientSends', e.target.value)}
                  rows={2}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#A3FF12] focus:outline-none"
                />
              </Field>
              <Field label="Ce que le client reçoit">
                <textarea
                  value={d.clientReceives ?? pkg.clientReceives}
                  onChange={(e) => setField(pkg.id, 'clientReceives', e.target.value)}
                  rows={2}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#A3FF12] focus:outline-none"
                />
              </Field>
              <Field label="Étapes de production (3 max, séparées par des virgules)">
                <Input
                  value={(d.steps ?? pkg.steps ?? []).join(', ')}
                  onChange={(e) => setField(pkg.id, 'steps', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                  placeholder="Étape 1, Étape 2, Étape 3"
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#A3FF12] focus:outline-none"
                />
              </Field>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d.isActive ?? pkg.isActive}
                    onChange={(e) => setField(pkg.id, 'isActive', e.target.checked)}
                    className="rounded bg-black border-white/10 text-[#A3FF12] focus:ring-[#A3FF12]"
                  />
                  <span className="text-xs text-[#C3CAD2]">Service actif sur le site</span>
                </label>
              </div>
            </div>
            <ul className="mt-2 space-y-1">
              {pkg.includes.map((inc) => (
                <li key={inc} className="text-[11px] text-[#8A949F] flex gap-2">
                  <span className="text-[#A3FF12]">✓</span>
                  {inc}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Button
                variant="primary"
                disabled={saving === pkg.id}
                onClick={() => void save(pkg)}
                className="flex-1"
              >
                {saving === pkg.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 inline mr-1.5" />
                )}
                Enregistrer
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ---------------------------- Promotion ---------------------------- */

/* ---------------------------- Promotion ---------------------------- */

function Promotion({ onChanged }: { onChanged: () => void }) {
  const [form, setForm] = useState<PromotionSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void api.promotion().then(setForm);
  }, []);

  if (!form) return <Spinner />;

  const save = async () => {
    setSaving(true);
    try {
      await api.admin.updatePromotion(form);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Bandeau promotionnel" subtitle="Affiché en haut du site">
      <div className="space-y-4">
        <ErrorNote message={error} />
        <Field label="Texte">
          <TextArea
            rows={2}
            value={form.text}
            onChange={(e) => setForm((f) => f && { ...f, text: e.target.value })}
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Style">
            <Select
              value={form.bannerStyle}
              onChange={(e) =>
                setForm(
                  (f) =>
                    f && { ...f, bannerStyle: e.target.value as PromotionSettings['bannerStyle'] },
                )
              }
            >
              <option value="marquee">Défilant</option>
              <option value="pulse">Pulsant</option>
              <option value="gold-gradient">Dégradé doré</option>
              <option value="classic">Classique</option>
            </Select>
          </Field>
          <Field label="Texte du lien">
            <Input
              value={form.linkText ?? ''}
              onChange={(e) => setForm((f) => f && { ...f, linkText: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Activer le bandeau">
          <Select
            value={form.isActive ? 'oui' : 'non'}
            onChange={(e) => setForm((f) => f && { ...f, isActive: e.target.value === 'oui' })}
          >
            <option value="non">Masqué</option>
            <option value="oui">Visible</option>
          </Select>
        </Field>
        <Button variant="primary" disabled={saving} onClick={() => void save()}>
          <Megaphone className="w-3.5 h-3.5 inline mr-1.5" />
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </Card>
  );
}

/* ------------------------------ Journal ---------------------------- */

function Audit() {
  const [rows, setRows] = useState<
    { id: string; adminEmail: string; action: string; entity: string; createdAt: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api.admin
      .audit()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <Card
      title="Journal d'audit"
      subtitle="Trace des actions effectuées dans le studio"
      actions={
        <Badge tone="purple">
          <ShieldCheck className="w-3 h-3 inline mr-1" />
          {rows.length} entrées
        </Badge>
      }
    >
      {rows.length === 0 ? (
        <Empty message="Aucune action enregistrée." />
      ) : (
        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 text-xs p-2.5 rounded-lg bg-black/30"
            >
              <div className="min-w-0">
                <span className="text-white font-bold">{r.action}</span>
                <span className="text-[#8A949F] ml-2">{r.entity ?? ''}</span>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[#A2ABB5]">{r.adminEmail ?? '—'}</p>
                <p className="text-[#7E8894] text-[10px]">
                  {new Date(r.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16 text-[#8A949F] gap-2 text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
    </div>
  );
}

/* ---------------------------- WhatsApp ------------------------------ */

/**
 * État de la passerelle WhatsApp.
 *
 * « Ça ne marche pas » est un diagnostic difficile à exploiter. Cet écran
 * répond à la seule question utile : où est le blocage ? Les variables
 * manquantes, la passerelle injoignable et la session déconnectée sont
 * trois pannes différentes, qui ne se réparent pas de la même façon —
 * notamment la troisième, qui réclame simplement de rescanner le QR code.
 */
function Whatsapp() {
  const [etat, setEtat] = useState<Awaited<
    ReturnType<typeof api.admin.whatsappStatus>
  > | null>(null);
  const [erreur, setErreur] = useState('');
  const [numero, setNumero] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState<string>('');

  const charger = useCallback(() => {
    setErreur('');
    api.admin
      .whatsappStatus()
      .then(setEtat)
      .catch((e) => setErreur(e instanceof Error ? e.message : 'Diagnostic indisponible.'));
  }, []);

  useEffect(charger, [charger]);

  async function tester() {
    setEnvoi(true);
    setResultat('');
    try {
      const r = await api.admin.testWhatsapp(numero.trim() || undefined);
      setResultat(r.ok ? 'Message envoyé. Vérifiez votre téléphone.' : r.reason ?? 'Échec.');
    } catch (e) {
      setResultat(e instanceof Error ? e.message : 'Échec de l’envoi.');
    } finally {
      setEnvoi(false);
    }
  }

  if (erreur) return <ErrorNote message={erreur} />;
  if (!etat) return <Spinner />;

  return (
    <div className="space-y-4">
      <Card title="Passerelle WhatsApp" subtitle="OpenWA — messages envoyés depuis le site">
        <div className="space-y-3">
          <Ligne
            label="Configuration"
            valeur={
              etat.configure ? (
                <span className="text-emerald-400 font-bold">Complète</span>
              ) : (
                <span className="text-amber-400 font-bold">Incomplète</span>
              )
            }
          />

          {etat.manquants.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-[12.5px] font-bold text-amber-300 mb-1.5">
                Variables à renseigner sur Vercel
              </p>
              <ul className="space-y-1">
                {etat.manquants.map((v) => (
                  <li key={v} className="text-[12px] text-[#C2CAD3] font-mono">
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {etat.url && <Ligne label="Adresse" valeur={etat.url} mono />}
          {etat.sessionId && <Ligne label="Session" valeur={etat.sessionId} mono />}

          <Ligne
            label="Connexion"
            valeur={
              etat.joignable === null ? (
                <span className="text-[#8A949F]">Non testée</span>
              ) : etat.joignable ? (
                <span className="text-emerald-400 font-bold">Session connectée</span>
              ) : (
                <span className="text-red-400 font-bold">Rupture</span>
              )
            }
          />

          {etat.detail && (
            <p className="text-[12.5px] text-[#8A949F] leading-relaxed">{etat.detail}</p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <Field label="Envoyer un message de test à">
            <Input
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="+243 97 000 00 00"
            />
          </Field>
          <p className="text-[11.5px] text-[#7E8894] mt-1.5">
            Laissez vide pour utiliser le numéro du studio.
          </p>

          <div className="flex items-center gap-3 mt-3">
            <Button onClick={() => void tester()} disabled={envoi}>
              {envoi && <Loader2 className="w-3.5 h-3.5 inline mr-1.5 animate-spin" />}
              Envoyer le test
            </Button>
            {resultat && (
              <span
                className={`text-[12.5px] ${
                  resultat.includes('envoyé') ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {resultat}
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function Ligne({
  label,
  valeur,
  mono = false,
}: {
  label: string;
  valeur: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.05] last:border-0">
      <span className="text-[12.5px] text-[#8A949F]">{label}</span>
      <span
        className={`text-[12.5px] text-right text-[#E8ECEF] ${mono ? 'font-mono text-[11.5px]' : ''}`}
      >
        {valeur}
      </span>
    </div>
  );
}
