import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Search,
  Trash2,
  Sparkles,
  Loader2,
  Music,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { ORDER_STATUSES, PAYMENT_STATUSES, type Order, type PaymentInfo } from '../types.js';
import {
  Badge,
  Button,
  Card,
  Empty,
  ErrorNote,
  Field,
  Input,
  Modal,
  Select,
  TextArea,
} from './ui.js';
import EnvoiFichier from './EnvoiFichier.js';

type Tone = 'gray' | 'yellow' | 'green' | 'red' | 'blue' | 'purple';

const statusTone = (status: string): Tone => {
  if (status === 'Livrée') return 'green';
  if (status === 'Annulée') return 'red';
  if (status.includes('paiement')) return 'yellow';
  if (status.includes('production') || status.includes('cours')) return 'purple';
  return 'gray';
};

const paymentTone = (p: string) =>
  p === 'Paid' ? 'green' : p === 'Pending confirmation' ? 'yellow' : p === 'Refunded' ? 'blue' : 'red';

const AI_KINDS = [
  { kind: 'summarize', label: 'Résumé émotionnel' },
  { kind: 'brief', label: 'Brief de production' },
  { kind: 'lyrics', label: 'Projet de paroles' },
  { kind: 'suno', label: 'Prompt Suno' },
  { kind: 'cover', label: 'Prompt pochette' },
  { kind: 'video', label: 'Prompt vidéo' },
  { kind: 'whatsapp', label: 'Message de livraison' },
  { kind: 'testimonial', label: 'Demande d’avis' },
  { kind: 'followup', label: 'Relance événement' },
] as const;

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ order: Order; payment: PaymentInfo | null } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setOrders(await api.admin.orders());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openDetail = async (id: string) => {
    setSelectedId(id);
    try {
      setDetail(await api.admin.orderDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Détail indisponible.');
    }
  };

  const refreshDetail = async () => {
    if (!selectedId) return;
    setDetail(await api.admin.orderDetail(selectedId));
    await load();
  };

  const patch = async (values: Record<string, unknown>) => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await api.admin.updateOrder(selectedId, values);
      await refreshDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mise à jour impossible.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Supprimer définitivement cette commande ?')) return;
    await api.admin.deleteOrder(id);
    setSelectedId(null);
    setDetail(null);
    await load();
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.reference.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        o.recipientName.toLowerCase().includes(q)
      );
    });
  }, [orders, query, statusFilter]);

  const totals = useMemo(() => {
    const paid = orders.filter((o) => o.paymentStatus === 'Paid');
    return {
      count: orders.length,
      paid: paid.length,
      revenue: paid.reduce((s, o) => s + o.amountCents, 0) / 100,
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#8A949F] gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Chargement des commandes…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ErrorNote message={error} />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-[#0B0D10] border border-white/10 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-widest text-[#8A949F]">Commandes</p>
          <p className="text-xl font-black text-white">{totals.count}</p>
        </div>
        <div className="bg-[#0B0D10] border border-white/10 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-widest text-[#8A949F]">Payées</p>
          <p className="text-xl font-black text-emerald-400">{totals.paid}</p>
        </div>
        <div className="bg-[#0B0D10] border border-white/10 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-widest text-[#8A949F]">Encaissé</p>
          <p className="text-xl font-black text-[#A3FF12]">
            {totals.revenue.toLocaleString('fr-FR')} $
          </p>
        </div>
      </div>

      <Card
        title="Commandes"
        subtitle="Cliquez sur une commande pour la traiter"
        actions={
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7E8894]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Référence, client…"
                className="pl-8 w-44"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            >
              <option value="">Tous les statuts</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <Empty message="Aucune commande pour le moment." />
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {filtered.map((o) => (
              <button
                key={o.id}
                onClick={() => void openDetail(o.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  selectedId === o.id
                    ? 'border-[#A3FF12]/50 bg-[#A3FF12]/5'
                    : 'border-white/10 bg-black/30 hover:border-white/25'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white font-mono">{o.reference}</p>
                    <p className="text-[11px] text-[#8A949F] truncate">
                      {o.customerName} · pour {o.recipientName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                    <Badge tone={paymentTone(o.paymentStatus)}>{o.paymentStatus}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-[#7E8894]">
                  <span>{new Date(o.createdAt).toLocaleDateString('fr-FR')}</span>
                  <span>{o.musicStyle}</span>
                  <span className="text-[#A3FF12] font-bold">
                    {(o.amountCents / 100).toLocaleString('fr-FR')} {o.currency}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(detail)}
        onClose={() => {
          setDetail(null);
          setSelectedId(null);
        }}
        title={detail ? `Commande ${detail.order.reference}` : ''}
        wide
      >
        {detail && (
          <OrderDetail
            data={detail}
            saving={saving}
            onPatch={(v) => void patch(v)}
            onDelete={() => void remove(detail.order.id)}
            onChanged={() => void refreshDetail()}
          />
        )}
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function OrderDetail({
  data,
  saving,
  onPatch,
  onDelete,
  onChanged,
}: {
  data: { order: Order; payment: PaymentInfo | null };
  saving: boolean;
  onPatch: (values: Record<string, unknown>) => void;
  onDelete: () => void;
  onChanged: () => void;
}) {
  const { order, payment } = data;
  const [form, setForm] = useState({
    status: order.status as string,
    paymentStatus: order.paymentStatus as string,
    adminNotes: order.adminNotes ?? '',
    songTitle: order.songTitle ?? '',
    finalLyrics: order.finalLyrics ?? '',
    finalAudioUrl: order.finalAudioUrl ?? '',
    coverImageUrl: order.coverImageUrl ?? '',
    clientFirstName: order.clientFirstName ?? '',
  });
  const [aiOpen, setAiOpen] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <InfoBlock title="Client">
          <Row label="Nom" value={order.customerName} />
          <Row label="Téléphone" value={order.customerPhone} />
          <Row label="Ville" value={`${order.customerCity}, ${order.customerCountry}`} />
          <Row label="E-mail" value={order.customerEmail || '—'} />
          <Row label="WhatsApp accepté" value={order.acceptsWhatsapp ? 'Oui' : 'Non'} />
        </InfoBlock>
        <InfoBlock title="Destinataire & histoire">
          <Row label="Pour" value={`${order.recipientName} (${order.recipientRelationship})`} />
          <Row label="Occasion" value={order.occasion || '—'} />
          <Row label="Ambiance" value={order.mood} />
          <Row label="Style" value={order.musicStyle} />
          <Row label="Échéance" value={order.desiredDeliveryDate || '—'} />
        </InfoBlock>
      </div>

      <div className="bg-black/40 border border-white/10 rounded-xl p-4">
        <p className="text-[10px] uppercase tracking-widest text-[#8A949F] font-semibold mb-2">
          Histoire du client
        </p>
        <p className="text-sm text-[#C3CAD2] whitespace-pre-wrap leading-relaxed">
          {order.storyText || 'Aucune histoire écrite.'}
        </p>
        {order.storyAudioUrl && (
          <audio controls src={order.storyAudioUrl} className="w-full mt-3" />
        )}
        {order.importantWords && (
          <p className="text-xs text-[#8A949F] mt-3">
            <span className="text-[#A3FF12]">Mots clés :</span> {order.importantWords}
          </p>
        )}
        {order.avoidWords && (
          <p className="text-xs text-[#8A949F] mt-1">
            <span className="text-red-400">À éviter :</span> {order.avoidWords}
          </p>
        )}
      </div>

      {payment && (
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-xs space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-[#8A949F] font-semibold mb-2">
            Paiement
          </p>
          <Row label="Statut" value={payment.status} />
          <Row label="Méthode" value={payment.method} />
          <Row label="Montant" value={`${(payment.amountCents / 100).toLocaleString('fr-FR')} ${payment.currency}`} />
          {payment.checkoutUrl && (
            <a
              href={payment.checkoutUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#A3FF12] hover:underline mt-1"
            >
              Lien de paiement <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Statut de production">
          <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Statut de paiement">
          <Select value={form.paymentStatus} onChange={(e) => set('paymentStatus', e.target.value)}>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Titre de la chanson">
          <Input value={form.songTitle} onChange={(e) => set('songTitle', e.target.value)} />
        </Field>
        <Field label="Prénom affiché">
          <Input
            value={form.clientFirstName}
            onChange={(e) => set('clientFirstName', e.target.value)}
          />
        </Field>
        <Field label="Fichier audio final (MP3)">
          <EnvoiFichier
            genre="audio"
            libelle="Choisir l'audio final"
            valeur={form.finalAudioUrl}
            onChange={(url) => set('finalAudioUrl', url)}
          />
        </Field>
        <Field label="Pochette de la chanson">
          <EnvoiFichier
            genre="image"
            libelle="Choisir la pochette"
            valeur={form.coverImageUrl}
            onChange={(url) => set('coverImageUrl', url)}
          />
        </Field>
      </div>

      <Field label="Paroles définitives">
        <TextArea
          rows={6}
          value={form.finalLyrics}
          onChange={(e) => set('finalLyrics', e.target.value)}
        />
      </Field>

      <Field label="Notes internes">
        <TextArea
          rows={3}
          value={form.adminNotes}
          onChange={(e) => set('adminNotes', e.target.value)}
        />
      </Field>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button variant="primary" disabled={saving} onClick={() => onPatch(form)}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        <Button onClick={() => setAiOpen((v) => !v)}>
          <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
          Assistant IA
        </Button>
        <Button onClick={() => void generateMemory(order.id, onChanged)}>
          <Music className="w-3.5 h-3.5 inline mr-1.5" />
          Générer la page souvenir
        </Button>
        <Button variant="danger" onClick={onDelete}>
          <Trash2 className="w-3.5 h-3.5 inline mr-1.5" />
          Supprimer
        </Button>
      </div>

      {order.memoryPageId && (
        <p className="text-xs text-emerald-400">
          Page souvenir : <span className="font-mono">{order.memoryPageId}</span>
        </p>
      )}

      {aiOpen && <AiAssist order={order} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */

async function generateMemory(orderId: string, onChanged: () => void) {
  try {
    const res = await api.admin.generateMemoryPage(orderId);
    window.alert(`Page souvenir créée : ${res.id}`);
    onChanged();
  } catch (err) {
    window.alert(err instanceof Error ? err.message : 'Création impossible.');
  }
}

function AiAssist({ order }: { order: Order }) {
  const [kind, setKind] = useState<string>('lyrics');
  const [text, setText] = useState('');
  const [degraded, setDegraded] = useState(false);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setText('');
    try {
      const res = await api.admin.ai({
        kind,
        orderId: order.reference,
        storyText: order.storyText ?? '',
        mood: order.mood,
        musicStyle: order.musicStyle,
        recipientName: order.recipientName,
        customerName: order.customerName,
        importantWords: order.importantWords ?? '',
        avoidWords: order.avoidWords ?? '',
        occasion: order.occasion ?? '',
        memoryPageUrl: order.memoryPageId
          ? `${window.location.origin}/memory/${order.memoryPageId}`
          : '',
      });
      setText(res.text);
      setDegraded(res.degraded);
    } catch (err) {
      setText(err instanceof Error ? err.message : 'Assistant indisponible.');
      setDegraded(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#A3FF12]/5 border border-[#A3FF12]/20 rounded-xl p-4 space-y-3">
      <div className="flex gap-2">
        <Select value={kind} onChange={(e) => setKind(e.target.value)} className="flex-1">
          {AI_KINDS.map((k) => (
            <option key={k.kind} value={k.kind}>
              {k.label}
            </option>
          ))}
        </Select>
        <Button variant="primary" onClick={() => void run()} disabled={loading}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Générer'}
        </Button>
      </div>

      {text && (
        <div className="space-y-2">
          {degraded && (
            <p className="text-[11px] text-[#A3FF12] bg-[#A3FF12]/10 border border-[#A3FF12]/20 rounded-lg px-3 py-2">
              ⚠️ Réponse non générée par l'IA — ne pas livrer telle quelle au client.
            </p>
          )}
          <TextArea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="font-mono text-xs"
          />
          <Button
            onClick={() => {
              void navigator.clipboard.writeText(text);
            }}
          >
            <FileText className="w-3.5 h-3.5 inline mr-1.5" />
            Copier
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function InfoBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-widest text-[#8A949F] font-semibold mb-2">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-[#8A949F]">{label}</span>
      <span className="text-[#E8EDF1] text-right">{value}</span>
    </div>
  );
}
