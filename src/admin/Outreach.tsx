import { useEffect, useState } from 'react';
import { Plus, Trash2, Send, Loader2, Users, TestTube2, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api.js';
import type { BroadcastCampaign, BroadcastList, EventReminder } from '../types.js';
import { Badge, Button, Card, Empty, ErrorNote, Field, Input, Modal, TextArea } from './ui.js';

type Tab = 'lists' | 'campaigns' | 'reminders';

export default function Outreach() {
  const [tab, setTab] = useState<Tab>('lists');
  const [testResult, setTestResult] = useState<string>('');

  const testWhatsapp = async () => {
    setTestResult('Envoi…');
    const res = await api.admin.testWhatsapp();
    setTestResult(res.ok ? 'Message de test envoyé.' : `Échec : ${res.reason ?? 'inconnu'}`);
  };

  return (
    <div className="space-y-5">
      <Card
        title="Passerelle WhatsApp"
        subtitle="OpenWA auto-hébergé — les envois passent par votre propre numéro"
        actions={
          <Button onClick={() => void testWhatsapp()}>
            <TestTube2 className="w-3.5 h-3.5 inline mr-1.5" />
            Envoyer un test
          </Button>
        }
      >
        {testResult && <p className="text-xs text-[#A2ABB5]">{testResult}</p>}
        <p className="flex items-start gap-2 text-[11px] text-[#A3FF12]/80 leading-relaxed">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Un envoi massif depuis un numéro professionnel peut entraîner un
          bannissement. Les campagnes sont plafonnées à 200 destinataires et
          espacées d'une seconde et demie.
        </p>
      </Card>

      <div className="flex gap-2 border-b border-white/10">
        {(
          [
            ['lists', 'Listes'],
            ['campaigns', 'Campagnes'],
            ['reminders', 'Rappels'],
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

      {tab === 'lists' && <Lists />}
      {tab === 'campaigns' && <Campaigns lists={[]} />}
      {tab === 'reminders' && <Reminders />}
    </div>
  );
}

/* ------------------------------ Listes ------------------------------ */

function Lists() {
  const [lists, setLists] = useState<BroadcastList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [contactOpen, setContactOpen] = useState<string | null>(null);
  const [contact, setContact] = useState({ name: '', phone: '', category: 'Client' });

  const load = async () => {
    setLoading(true);
    try {
      setLists(await api.admin.broadcastLists());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <ErrorNote message={error} />
      <Card
        title={`${lists.length} liste(s) de diffusion`}
        actions={
          <Button variant="primary" onClick={() => setOpen(true)}>
            <Plus className="w-3.5 h-3.5 inline mr-1.5" />
            Nouvelle liste
          </Button>
        }
      >
        {lists.length === 0 ? (
          <Empty message="Aucune liste pour le moment." />
        ) : (
          <div className="space-y-3">
            {lists.map((l) => (
              <div key={l.id} className="p-4 rounded-xl bg-black/30 border border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#A3FF12]" />
                      {l.name}
                    </p>
                    <p className="text-[11px] text-[#8A949F] mt-0.5">{l.description}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button onClick={() => setContactOpen(l.id)}>
                      <Plus className="w-3.5 h-3.5 inline mr-1" />
                      Contact
                    </Button>
                    <button
                      onClick={async () => {
                        if (!window.confirm('Supprimer cette liste et ses contacts ?')) return;
                        await api.admin.deleteBroadcastList(l.id);
                        await load();
                      }}
                      className="p-2 rounded-lg hover:bg-white/10 text-[#A2ABB5] hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {l.contacts.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {l.contacts.map((c) => (
                      <span
                        key={c.id}
                        className="text-[10px] bg-white/5 border border-white/10 rounded-full px-2 py-1 text-[#C3CAD2]"
                      >
                        {c.name} · {c.phone}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle liste">
        <div className="space-y-4">
          <Field label="Nom">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Button
            variant="primary"
            className="w-full"
            onClick={async () => {
              await api.admin.createBroadcastList({ name });
              setName('');
              setOpen(false);
              await load();
            }}
          >
            Créer
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(contactOpen)}
        onClose={() => setContactOpen(null)}
        title="Ajouter un contact"
      >
        <div className="space-y-4">
          <Field label="Nom">
            <Input
              value={contact.name}
              onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
            />
          </Field>
          <Field label="Numéro WhatsApp">
            <Input
              value={contact.phone}
              onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
              placeholder="+243810000000"
            />
          </Field>
          <Field label="Catégorie">
            <Input
              value={contact.category}
              onChange={(e) => setContact((c) => ({ ...c, category: e.target.value }))}
            />
          </Field>
          <Button
            variant="primary"
            className="w-full"
            onClick={async () => {
              if (!contactOpen) return;
              await api.admin.addContact(contactOpen, contact);
              setContact({ name: '', phone: '', category: 'Client' });
              setContactOpen(null);
              await load();
            }}
          >
            Ajouter
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/* ---------------------------- Campagnes ---------------------------- */

function Campaigns({ lists }: { lists: BroadcastList[] }) {
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
  const [allLists, setAllLists] = useState<BroadcastList[]>(lists);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', messageTemplate: '', targetListId: '' });
  const [sending, setSending] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [c, l] = await Promise.all([api.admin.campaigns(), api.admin.broadcastLists()]);
      setCampaigns(c);
      setAllLists(l);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const send = async (id: string) => {
    if (!window.confirm('Lancer l’envoi maintenant ? Les messages partiront de votre numéro.')) {
      return;
    }
    setSending(id);
    try {
      await api.admin.sendCampaign(id);
      await load();
    } finally {
      setSending(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <Card
        title={`${campaigns.length} campagne(s)`}
        actions={
          <Button variant="primary" onClick={() => setOpen(true)}>
            <Plus className="w-3.5 h-3.5 inline mr-1.5" />
            Nouvelle campagne
          </Button>
        }
      >
        {campaigns.length === 0 ? (
          <Empty message="Aucune campagne." />
        ) : (
          <div className="space-y-2">
            {campaigns.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-black/30 border border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{c.title}</p>
                    <p className="text-[11px] text-[#8A949F]">
                      {c.targetListName ?? 'Sans liste'} · {c.sentCount}/{c.totalCount} envoyés
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      tone={
                        c.status === 'Envoyé' ? 'green' : c.status === 'En cours' ? 'yellow' : 'gray'
                      }
                    >
                      {c.status}
                    </Badge>
                    {c.status !== 'Envoyé' && (
                      <Button
                        variant="primary"
                        disabled={sending === c.id}
                        onClick={() => void send(c.id)}
                      >
                        {sending === c.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5 inline mr-1" />
                            Envoyer
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle campagne">
        <div className="space-y-4">
          <Field label="Titre">
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </Field>
          <Field label="Liste cible">
            <select
              className="w-full bg-[#14181D] border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#8A949F] cursor-text hover:border-white/30 focus:outline-none focus:border-[#A3FF12] focus:ring-2 focus:ring-[#A3FF12]/25 transition-colors"
              value={form.targetListId}
              onChange={(e) => setForm((f) => ({ ...f, targetListId: e.target.value }))}
            >
              <option value="">— Aucune —</option>
              {allLists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.contacts.length})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Message" hint="Utilisez {name} pour personnaliser.">
            <TextArea
              rows={5}
              value={form.messageTemplate}
              onChange={(e) => setForm((f) => ({ ...f, messageTemplate: e.target.value }))}
            />
          </Field>
          <Button
            variant="primary"
            className="w-full"
            onClick={async () => {
              await api.admin.createCampaign(form);
              setForm({ title: '', messageTemplate: '', targetListId: '' });
              setOpen(false);
              await load();
            }}
          >
            Créer le brouillon
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/* ----------------------------- Rappels ----------------------------- */

function Reminders() {
  const [items, setItems] = useState<EventReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    eventName: '',
    eventDate: '',
    relationship: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      setItems(await api.admin.reminders());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <Card title="Programmer un rappel">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Client">
            <Input
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
            />
          </Field>
          <Field label="Téléphone">
            <Input
              value={form.customerPhone}
              onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
            />
          </Field>
          <Field label="Événement">
            <Input
              value={form.eventName}
              onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))}
            />
          </Field>
          <Field label="Date">
            <Input
              value={form.eventDate}
              onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
              placeholder="Août 2027"
            />
          </Field>
        </div>
        <Button
          variant="primary"
          className="mt-4"
          onClick={async () => {
            await api.admin.createReminder(form);
            setForm({
              customerName: '',
              customerPhone: '',
              eventName: '',
              eventDate: '',
              relationship: '',
            });
            await load();
          }}
        >
          <Plus className="w-3.5 h-3.5 inline mr-1.5" />
          Ajouter
        </Button>
      </Card>

      {items.length === 0 ? (
        <Empty message="Aucun rappel programmé." />
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-black/30 border border-white/10"
            >
              <div>
                <p className="text-sm font-bold text-white">{r.eventName}</p>
                <p className="text-[11px] text-[#8A949F]">
                  {r.customerName} · {r.eventDate}
                </p>
              </div>
              <button
                onClick={async () => {
                  await api.admin.deleteReminder(r.id);
                  await load();
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-[#A2ABB5] hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16 text-[#8A949F] gap-2 text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
    </div>
  );
}
