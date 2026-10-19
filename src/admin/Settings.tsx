import { useEffect, useState } from 'react';
import { Save, Loader2, ShieldCheck, Settings as SettingsIcon, Megaphone } from 'lucide-react';
import { api } from '../lib/api.js';
import type { Package, PromotionSettings } from '../types.js';
import { Badge, Button, Card, Empty, ErrorNote, Field, Input, Select, TextArea } from './ui.js';

type Tab = 'packages' | 'promotion' | 'audit';

export default function SettingsPanel({ onPromotionChanged }: { onPromotionChanged: () => void }) {
  const [tab, setTab] = useState<Tab>('packages');

  return (
    <div className="space-y-5">
      <div className="flex gap-2 border-b border-white/10">
        {(
          [
            ['packages', 'Tarifs'],
            ['promotion', 'Bandeau promo'],
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
      {tab === 'audit' && <Audit />}
    </div>
  );
}

/* ------------------------------ Tarifs ------------------------------ */

function Packages() {
  const [items, setItems] = useState<Package[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const rows = await api.admin.packages();
      setItems(rows);
      setDraft(
        Object.fromEntries(rows.map((p) => [p.id, String(p.priceCents / 100)])),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const save = async (pkg: Package) => {
    setSaving(pkg.id);
    try {
      const price = Number(draft[pkg.id] ?? 0);
      await api.admin.updatePackage(pkg.id, {
        priceCents: Math.max(0, Math.round(price * 100)),
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
        Le prix est enregistré en centimes, jamais interprété depuis une chaîne de
        caractères : le chiffre d'affaires calculé est donc exact.
      </p>
      {items.map((pkg) => (
        <Card key={pkg.id} title={pkg.name} subtitle={pkg.promise}>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Field label="Prix (devise)">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft[pkg.id] ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, [pkg.id]: e.target.value }))}
                />
              </Field>
            </div>
            <span className="pb-2 text-sm text-[#8A949F]">{pkg.currency}</span>
            <Button
              variant="primary"
              disabled={saving === pkg.id}
              onClick={() => void save(pkg)}
              className="mb-0.5"
            >
              {saving === pkg.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 inline mr-1.5" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
          <ul className="mt-3 space-y-1">
            {pkg.includes.map((inc) => (
              <li key={inc} className="text-[11px] text-[#8A949F] flex gap-2">
                <span className="text-[#A3FF12]">✓</span>
                {inc}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-[#6C7581] mt-3">
            Livraison : {pkg.deliveryTime} · ordre {pkg.sortOrder}
          </p>
        </Card>
      ))}
    </div>
  );
}

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
                <p className="text-[#6C7581] text-[10px]">
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
