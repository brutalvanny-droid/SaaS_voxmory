import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';
import { api } from '../lib/api.js';
import type { ClientReview, GallerySong, MemoryPage } from '../types.js';
import { Badge, Button, Card, Empty, ErrorNote, Field, Input, Modal, Select, TextArea } from './ui.js';
import EnvoiFichier from './EnvoiFichier.js';

type Tab = 'gallery' | 'reviews' | 'memory';

const VISIBILITIES = ['Private', 'Public with first name', 'Public anonymous', 'Demo only'] as const;

export default function Catalog() {
  const [tab, setTab] = useState<Tab>('gallery');

  return (
    <div className="space-y-5">
      <div className="flex gap-2 border-b border-white/10">
        {(
          [
            ['gallery', 'Galerie'],
            ['reviews', 'Avis clients'],
            ['memory', 'Pages souvenir'],
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

      {tab === 'gallery' && <GalleryAdmin />}
      {tab === 'reviews' && <ReviewsAdmin />}
      {tab === 'memory' && <MemoryAdmin />}
    </div>
  );
}

/* ------------------------------ Galerie ------------------------------ */

function GalleryAdmin() {
  const [songs, setSongs] = useState<GallerySong[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({
    title: '',
    occasion: '',
    style: '',
    language: '',
    mood: '',
    description: '',
    audioUrl: '',
    coverUrl: '',
    clientFirstName: '',
    visibility: 'Private',
    startTime: 0,
    endTime: null,
    isFeatured: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      setSongs(await api.admin.gallery());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const submit = async () => {
    try {
      await api.admin.createSong(form);
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création impossible.');
    }
  };

  const toggleFeatured = async (song: GallerySong) => {
    await api.admin.updateSong(song.id, { isFeatured: !song.isFeatured });
    await load();
  };

  const remove = async (id: string) => {
    if (!window.confirm('Supprimer cette chanson de la galerie ?')) return;
    await api.admin.deleteSong(id);
    await load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <ErrorNote message={error} />
      <Card
        title={`${songs.length} création(s)`}
        subtitle="La galerie publique n'affiche jamais les créations marquées « Private »"
        actions={
          <Button variant="primary" onClick={() => setOpen(true)}>
            <Plus className="w-3.5 h-3.5 inline mr-1.5" />
            Ajouter
          </Button>
        }
      >
        {songs.length === 0 ? (
          <Empty message="Aucune création dans la galerie." />
        ) : (
          <div className="space-y-2">
            {songs.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/30 border border-white/10"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{s.title}</p>
                  <p className="text-[11px] text-[#8A949F] truncate">
                    {s.style} · {s.occasion} · {s.visibility}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {s.isFeatured && <Badge tone="yellow">Vedette</Badge>}
                  {s.visibility === 'Private' && <Badge tone="gray">Privée</Badge>}
                  <button
                    onClick={() => void toggleFeatured(s)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-[#A2ABB5] hover:text-[#A3FF12]"
                    title="Mettre en vedette"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => void remove(s.id)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-[#A2ABB5] hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle création">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Titre">
              <Input
                value={String(form.title ?? '')}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </Field>
            <Field label="Client (prénom)">
              <Input
                value={String(form.clientFirstName ?? '')}
                onChange={(e) => setForm((f) => ({ ...f, clientFirstName: e.target.value }))}
              />
            </Field>
            <Field label="Occasion">
              <Input
                value={String(form.occasion ?? '')}
                onChange={(e) => setForm((f) => ({ ...f, occasion: e.target.value }))}
              />
            </Field>
            <Field label="Style">
              <Input
                value={String(form.style ?? '')}
                onChange={(e) => setForm((f) => ({ ...f, style: e.target.value }))}
              />
            </Field>
            <Field label="Langue">
              <Input
                value={String(form.language ?? '')}
                onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
              />
            </Field>
            <Field label="Ambiance">
              <Input
                value={String(form.mood ?? '')}
                onChange={(e) => setForm((f) => ({ ...f, mood: e.target.value }))}
              />
            </Field>
          </div>
          <EnvoiFichier
            genre="audio"
            libelle="Fichier audio (MP3)"
            valeur={String(form.audioUrl ?? '')}
            onChange={(v) => setForm((f) => ({ ...f, audioUrl: v ?? '' }))}
          />
          <EnvoiFichier
            genre="image"
            libelle="Pochette (image)"
            valeur={String(form.coverUrl ?? '')}
            onChange={(v) => setForm((f) => ({ ...f, coverUrl: v ?? '' }))}
          />
          <Field label="Visibilité">
            <Select
              value={String(form.visibility ?? 'Private')}
              onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))}
            >
              {VISIBILITIES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Description">
            <TextArea
              rows={3}
              value={String(form.description ?? '')}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>
          <Button variant="primary" onClick={() => void submit()} className="w-full">
            Publier dans la galerie
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------- Avis ------------------------------- */

function ReviewsAdmin() {
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setReviews(await api.admin.allReviews());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const toggle = async (r: ClientReview) => {
    await api.admin.updateReview(r.id, { approved: !r.approved });
    await load();
  };
  const remove = async (id: string) => {
    if (!window.confirm('Supprimer cet avis ?')) return;
    await api.admin.deleteReview(id);
    await load();
  };

  if (loading) return <Spinner />;

  const pending = reviews.filter((r) => !r.approved).length;

  return (
    <div className="space-y-4">
      <ErrorNote message={error} />
      {pending > 0 && (
        <p className="text-xs text-[#A3FF12] bg-[#A3FF12]/10 border border-[#A3FF12]/20 rounded-lg px-3 py-2">
          {pending} témoignage(s) en attente de modération.
        </p>
      )}
      {reviews.length === 0 ? (
        <Empty message="Aucun avis pour le moment." />
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-xl bg-black/30 border border-white/10 flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-white">{r.clientName}</p>
                  <span className="text-[#A3FF12] text-xs">{'★'.repeat(r.rating)}</span>
                  {r.approved ? (
                    <Badge tone="green">
                      <Eye className="w-3 h-3 inline mr-1" />
                      Publié
                    </Badge>
                  ) : (
                    <Badge tone="gray">
                      <EyeOff className="w-3 h-3 inline mr-1" />
                      Masqué
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-[#8A949F] mt-1">{r.occasion}</p>
                <p className="text-sm text-[#C3CAD2] mt-2 leading-relaxed">{r.comment}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button variant={r.approved ? 'ghost' : 'success'} onClick={() => void toggle(r)}>
                  <Check className="w-3.5 h-3.5 inline mr-1" />
                  {r.approved ? 'Masquer' : 'Approuver'}
                </Button>
                <button
                  onClick={() => void remove(r.id)}
                  className="p-2 rounded-lg hover:bg-white/10 text-[#A2ABB5] hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------- Pages souvenir -------------------------- */

function MemoryAdmin() {
  const [pages, setPages] = useState<MemoryPage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setPages(await api.admin.memoryPages());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const remove = async (id: string) => {
    if (!window.confirm('Supprimer cette page souvenir ?')) return;
    await api.admin.deleteMemoryPage(id);
    await load();
  };

  if (loading) return <Spinner />;

  return pages.length === 0 ? (
    <Empty message="Aucune page souvenir. Générez-en une depuis une commande." />
  ) : (
    <div className="space-y-2">
      {pages.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-black/30 border border-white/10"
        >
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{p.eventTitle}</p>
            <p className="text-[11px] text-[#8A949F] font-mono truncate">{p.id}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={`#memory/${p.id}`}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-white"
            >
              Voir
            </a>
            <button
              onClick={() => void remove(p.id)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-[#A2ABB5] hover:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
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
