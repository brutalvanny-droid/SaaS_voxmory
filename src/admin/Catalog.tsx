import { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Check,
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
  Pencil,
  ArrowUp,
  ArrowDown,
  ClipboardPaste,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../lib/api.js';
import type { ClientReview, GallerySong, MemoryPage, SongReview } from '../types.js';
import { Badge, Button, Card, Empty, ErrorNote, Field, Input, Modal, Select, TextArea } from './ui.js';
import EnvoiFichier from './EnvoiFichier.js';
import ExtraitAudio from './ExtraitAudio.js';

type Tab = 'gallery' | 'reviews' | 'songreviews' | 'memory';

const VISIBILITIES = ['Private', 'Public with first name', 'Public anonymous', 'Demo only'] as const;
const VISIBILITY_LABEL: Record<string, string> = {
  Private: 'Masquée',
  'Public with first name': 'Publique',
  'Public anonymous': 'Publique (anonyme)',
  'Demo only': 'Démonstration',
};

export default function Catalog() {
  const [tab, setTab] = useState<Tab>('gallery');

  return (
    <div className="space-y-5">
      <div className="flex gap-2 border-b border-white/10">
        {(
          [
            ['gallery', 'Chansons exemples'],
            ['reviews', 'Avis clients'],
            ['songreviews', 'Avis chansons'],
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
      {tab === 'songreviews' && <SongReviewsAdmin />}
      {tab === 'memory' && <MemoryAdmin />}
    </div>
  );
}

/* ------------------------- Chansons exemples ------------------------- */

type Forme = {
  title: string;
  clientFirstName: string;
  style: string;
  occasion: string;
  language: string;
  description: string;
  audioUrl: string;
  coverUrl: string;
  visibility: string;
  startTime: number;
  endTime: number | null;
};

const FORME_VIDE: Forme = {
  title: '',
  clientFirstName: '',
  style: '',
  occasion: '',
  language: '',
  description: '',
  audioUrl: '',
  coverUrl: '',
  visibility: 'Public with first name',
  startTime: 0,
  endTime: null,
};

function GalleryAdmin() {
  const [songs, setSongs] = useState<GallerySong[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [edite, setEdite] = useState<GallerySong | null>(null);
  const [form, setForm] = useState<Forme>(FORME_VIDE);

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

  const ouvrirAjout = () => {
    setEdite(null);
    setForm(FORME_VIDE);
    setError('');
    setOpen(true);
  };

  const ouvrirEdition = (s: GallerySong) => {
    setEdite(s);
    setForm({
      title: s.title,
      clientFirstName: s.clientFirstName ?? '',
      style: s.style,
      occasion: s.occasion,
      language: s.language,
      description: s.description,
      audioUrl: s.audioUrl,
      coverUrl: s.coverUrl,
      visibility: s.visibility,
      startTime: s.startTime ?? 0,
      endTime: s.endTime ?? null,
    });
    setError('');
    setOpen(true);
  };

  const submit = async () => {
    if (!form.title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }
    if (!form.audioUrl) {
      setError('Ajoutez le fichier audio de la chanson.');
      return;
    }
    setError('');
    try {
      if (edite) {
        await api.admin.updateSong(edite.id, form);
      } else {
        await api.admin.createSong(form);
      }
      setOpen(false);
      await load();
      setNotice(edite ? 'Chanson modifiée.' : 'Chanson ajoutée.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible.');
    }
  };

  const basculerVisibilite = async (s: GallerySong) => {
    const masquer = s.visibility !== 'Private';
    await api.admin.updateSong(s.id, {
      visibility: masquer ? 'Private' : 'Public with first name',
    });
    await load();
  };

  const remove = async (id: string) => {
    if (!window.confirm('Supprimer cette chanson ? Cette action est définitive.')) return;
    await api.admin.deleteSong(id);
    await load();
  };

  /** Déplace un élément puis enregistre l'ordre complet. */
  const deplacer = async (index: number, sens: -1 | 1) => {
    const cible = index + sens;
    if (cible < 0 || cible >= songs.length) return;
    const suivant = [...songs];
    [suivant[index], suivant[cible]] = [suivant[cible], suivant[index]];
    setSongs(suivant);
    try {
      await api.admin.orderSongs(suivant.map((s) => s.id));
    } catch {
      setError("L'ordre n'a pas pu être enregistré.");
      await load();
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <ErrorNote message={error} />
      {notice && (
        <p className="text-xs text-[#A3FF12] bg-[#A3FF12]/10 border border-[#A3FF12]/20 rounded-lg px-3 py-2">
          {notice}
        </p>
      )}
      <Card
        title={`${songs.length} chanson(s)`}
        subtitle="Ces chansons s'affichent sur la page d'accueil, avec un lecteur audio. Masquées, elles restent enregistrées mais invisibles."
        actions={
          <Button variant="primary" onClick={ouvrirAjout}>
            <Plus className="w-3.5 h-3.5 inline mr-1.5" />
            Ajouter une chanson
          </Button>
        }
      >
        {songs.length === 0 ? (
          <Empty message="Aucune chanson. Ajoutez vos premiers exemples." />
        ) : (
          <div className="space-y-2">
            {songs.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/30 border border-white/10"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {s.coverUrl ? (
                    <img
                      src={s.coverUrl}
                      alt=""
                      className="w-12 h-12 object-cover rounded-lg border border-white/10 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-[#A3FF12]/40" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{s.title}</p>
                    <p className="text-[11px] text-[#8A949F] truncate">
                      {[s.clientFirstName, s.style, s.occasion].filter(Boolean).join(' · ') ||
                        'Sans détails'}
                    </p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {s.isFeatured && <Badge tone="yellow">Vedette</Badge>}
                      <Badge tone={s.visibility === 'Private' ? 'gray' : 'green'}>
                        {VISIBILITY_LABEL[s.visibility] ?? s.visibility}
                      </Badge>
                      {!s.audioUrl && <Badge tone="gray">Sans audio</Badge>}
                      {s.audioUrl && (s.startTime > 0 || s.endTime !== null) && (
                        <Badge tone="purple">
                          Extrait {Math.floor(s.startTime / 60)}:{String(s.startTime % 60).padStart(2, '0')} →{' '}
                          {s.endTime !== null
                            ? `${Math.floor(s.endTime / 60)}:${String(s.endTime % 60).padStart(2, '0')}`
                            : 'Fin'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => void deplacer(i, -1)}
                    disabled={i === 0}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-[#A2ABB5] hover:text-white disabled:opacity-25 disabled:hover:bg-transparent"
                    title="Monter"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => void deplacer(i, 1)}
                    disabled={i === songs.length - 1}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-[#A2ABB5] hover:text-white disabled:opacity-25 disabled:hover:bg-transparent"
                    title="Descendre"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => ouvrirEdition(s)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-[#A2ABB5] hover:text-white"
                    title="Modifier"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => void basculerVisibilite(s)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-[#A2ABB5] hover:text-white"
                    title={s.visibility === 'Private' ? 'Afficher' : 'Masquer'}
                  >
                    {s.visibility === 'Private' ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => void remove(s.id)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-[#A2ABB5] hover:text-red-400"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={edite ? 'Modifier la chanson' : 'Nouvelle chanson exemple'}
      >
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Titre *">
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Pour Hadassa"
              />
            </Field>
            <Field label="Client / artiste">
              <Input
                value={form.clientFirstName}
                onChange={(e) => setForm((f) => ({ ...f, clientFirstName: e.target.value }))}
                placeholder="Prénom du client"
              />
            </Field>
            <Field label="Genre">
              <Input
                value={form.style}
                onChange={(e) => setForm((f) => ({ ...f, style: e.target.value }))}
                placeholder="Afrobeat, Rumba, Gospel…"
              />
            </Field>
            <Field label="Occasion">
              <Input
                value={form.occasion}
                onChange={(e) => setForm((f) => ({ ...f, occasion: e.target.value }))}
                placeholder="Anniversaire, mariage…"
              />
            </Field>
          </div>

          <Field label="Fichier audio * (MP3, WAV, M4A, OGG — 25 Mo max)">
            <EnvoiFichier
              genre="audio"
              libelle="Choisir l'audio"
              valeur={form.audioUrl}
              onChange={(url) => setForm((f) => ({ ...f, audioUrl: url }))}
            />
          </Field>

          <Field label="Choisir l'extrait à faire écouter (début / fin)">
            <ExtraitAudio
              url={form.audioUrl}
              debut={form.startTime}
              fin={form.endTime}
              onChange={(d, f) => setForm((x) => ({ ...x, startTime: d, endTime: f }))}
            />
          </Field>

          <Field label="Pochette (optionnelle)">
            <EnvoiFichier
              genre="image"
              libelle="Choisir la pochette"
              valeur={form.coverUrl}
              onChange={(url) => setForm((f) => ({ ...f, coverUrl: url }))}
            />
          </Field>

          <Field label="Visibilité">
            <Select
              value={form.visibility}
              onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))}
            >
              {VISIBILITIES.map((v) => (
                <option key={v} value={v}>
                  {VISIBILITY_LABEL[v]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Description">
            <TextArea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>

          {error && <p className="text-[12.5px] text-red-400">{error}</p>}

          <Button variant="primary" onClick={() => void submit()} className="w-full">
            {edite ? 'Enregistrer les modifications' : 'Ajouter la chanson'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------- Avis ------------------------------- */

const VIDE_AVIS = { clientName: '', comment: '', rating: 5, occasion: '', date: '', screenshotUrl: '' };

/**
 * Découpe un texte collé en plusieurs avis.
 *
 * Format accepté, volontairement souple : un bloc par avis, séparé par une
 * ligne vide. La première ligne porte le nom et, si elle est présente, la
 * note. Le reste forme le témoignage.
 *
 *   Marie — 5
 *   Ma sœur a pleuré en écoutant la chanson.
 *
 *   Jean
 *   Livraison rapide, merci beaucoup.
 */
function decouperAvis(texte: string) {
  const blocs = texte
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const trouves: { clientName: string; comment: string; rating: number }[] = [];
  const ignores: string[] = [];

  for (const bloc of blocs) {
    const lignes = bloc.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lignes.length === 0) continue;

    // La note peut être écrite « 5 », « 5/5 », « 5★ » ou « 5 étoiles ».
    const noteMatch = lignes[0].match(/(\d)\s*(?:\/\s*5|★|étoiles?)?\s*$/);
    let nom = lignes[0];
    let rating = 5;

    if (noteMatch) {
      const chiffre = Number(noteMatch[1]);
      if (chiffre >= 1 && chiffre <= 5) {
        rating = chiffre;
        nom = lignes[0].slice(0, noteMatch.index).replace(/[\s—–|\-:]+$/, '').trim();
      }
    }

    const reste = lignes.slice(1).join(' ').trim();
    const comment = reste || lignes[0];

    if (nom.length < 2 || comment.length < 5) {
      ignores.push(bloc.slice(0, 60));
      continue;
    }
    trouves.push({ clientName: nom, comment, rating });
  }

  return { trouves, ignores };
}

function ReviewsAdmin() {
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [ouvert, setOuvert] = useState<'simple' | 'masse' | null>(null);
  const [form, setForm] = useState(VIDE_AVIS);
  const [masse, setMasse] = useState('');
  const [apercu, setApercu] = useState<{ trouves: ReturnType<typeof decouperAvis>['trouves']; ignores: string[] } | null>(null);

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
    if (!window.confirm('Supprimer cet avis ? Cette action est définitive.')) return;
    await api.admin.deleteReview(id);
    await load();
  };

  const ajouter = async () => {
    if (form.clientName.trim().length < 2) {
      setError('Le nom est obligatoire.');
      return;
    }
    if (form.comment.trim().length < 5) {
      setError('Le témoignage est trop court.');
      return;
    }
    setError('');
    try {
      await api.admin.createReview({
        clientName: form.clientName.trim(),
        comment: form.comment.trim(),
        rating: form.rating,
        occasion: form.occasion.trim(),
        screenshotUrl: form.screenshotUrl || undefined,
        approved: true,
        createdAt: form.date || undefined,
      });
      setOuvert(null);
      setForm(VIDE_AVIS);
      await load();
      setNotice('Avis ajouté et publié sur la page d’accueil.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ajout impossible.');
    }
  };

  const importer = async () => {
    if (!apercu || apercu.trouves.length === 0) return;
    setError('');
    try {
      const r = await api.admin.createReviewsEnMasse(
        apercu.trouves.map((a) => ({ ...a, occasion: '', approved: true })),
      );
      setOuvert(null);
      setMasse('');
      setApercu(null);
      await load();
      setNotice(`${r.imported} avis importés et publiés.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import impossible.');
    }
  };

  if (loading) return <Spinner />;

  const enAttente = reviews.filter((r) => !r.approved).length;

  return (
    <div className="space-y-4">
      <ErrorNote message={error} />
      {notice && (
        <p className="text-xs text-[#A3FF12] bg-[#A3FF12]/10 border border-[#A3FF12]/20 rounded-lg px-3 py-2">
          {notice}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={() => {
            setForm(VIDE_AVIS);
            setError('');
            setOuvert('simple');
          }}
        >
          <Plus className="w-3.5 h-3.5 inline mr-1.5" />
          Ajouter un avis
        </Button>
        <Button
          onClick={() => {
            setApercu(null);
            setError('');
            setOuvert('masse');
          }}
        >
          <ClipboardPaste className="w-3.5 h-3.5 inline mr-1.5" />
          Coller plusieurs avis
        </Button>
      </div>

      {enAttente > 0 && (
        <p className="text-xs text-[#A3FF12] bg-[#A3FF12]/10 border border-[#A3FF12]/20 rounded-lg px-3 py-2">
          {enAttente} témoignage(s) en attente de modération.
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
              <div className="min-w-0 flex-1">
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
                <p className="text-[11px] text-[#6C7581] mt-1">
                  {r.occasion}
                  {r.occasion && ' · '}
                  {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-sm text-[#C3CAD2] mt-2 leading-relaxed">{r.comment}</p>
                {/* La capture n'est jamais montrée en grand : c'est une
                    preuve, pas une affiche. Elle reste consultable. */}
                {r.screenshotUrl && (
                  <a
                    href={r.screenshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2"
                  >
                    <img
                      src={r.screenshotUrl}
                      alt="Capture du témoignage"
                      className="w-16 h-24 object-cover rounded border border-white/10 hover:border-white/30"
                    />
                  </a>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button variant={r.approved ? 'ghost' : 'success'} onClick={() => void toggle(r)}>
                  <Check className="w-3.5 h-3.5 inline mr-1" />
                  {r.approved ? 'Masquer' : 'Publier'}
                </Button>
                <button
                  onClick={() => void remove(r.id)}
                  className="p-2 rounded-lg hover:bg-white/10 text-[#A2ABB5] hover:text-red-400"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Avis un par un */}
      <Modal open={ouvert === 'simple'} onClose={() => setOuvert(null)} title="Ajouter un avis">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nom du client *">
              <Input
                value={form.clientName}
                onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                placeholder="Marie"
              />
            </Field>
            <Field label="Note">
              <Select
                value={String(form.rating)}
                onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} étoile{n > 1 ? 's' : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Occasion">
              <Input
                value={form.occasion}
                onChange={(e) => setForm((f) => ({ ...f, occasion: e.target.value }))}
                placeholder="Anniversaire"
              />
            </Field>
            <Field label="Date (optionnelle)">
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </Field>
          </div>

          <Field label="Témoignage *">
            <TextArea
              rows={4}
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="Collez ici le message reçu. Les numéros de téléphone sont masqués automatiquement."
            />
          </Field>

          <Field label="Capture WhatsApp (optionnelle)">
            <EnvoiFichier
              genre="image"
              libelle="Choisir la capture"
              valeur={form.screenshotUrl}
              onChange={(url) => setForm((f) => ({ ...f, screenshotUrl: url }))}
            />
          </Field>

          <p className="text-[11.5px] text-[#6C7581] leading-relaxed">
            Les numéros de téléphone contenus dans le texte sont automatiquement
            remplacés par « [coordonnées masquées] » : ils ne seront jamais
            affichés sur le site.
          </p>

          {error && <p className="text-[12.5px] text-red-400">{error}</p>}

          <Button variant="primary" onClick={() => void ajouter()} className="w-full">
            Publier l’avis
          </Button>
        </div>
      </Modal>

      {/* Import en masse */}
      <Modal open={ouvert === 'masse'} onClose={() => setOuvert(null)} title="Coller plusieurs avis">
        <div className="space-y-4">
          <p className="text-[12px] text-[#8A949F] leading-relaxed">
            Séparez chaque avis par une ligne vide. Sur la première ligne,
            écrivez le nom, puis la note si vous la connaissez. Le reste forme
            le témoignage.
          </p>

          <pre className="text-[11px] text-[#6C7581] bg-black/40 border border-white/10 rounded-lg p-3 overflow-x-auto">
{`Marie — 5
Ma sœur a pleuré en écoutant la chanson.

Jean
Livraison rapide, merci beaucoup.`}
          </pre>

          <Field label="Vos avis">
            <TextArea
              rows={10}
              value={masse}
              onChange={(e) => {
                setMasse(e.target.value);
                setApercu(null);
              }}
              placeholder="Collez vos avis ici…"
            />
          </Field>

          {!apercu ? (
            <Button
              onClick={() => setApercu(decouperAvis(masse))}
              disabled={masse.trim().length === 0}
              className="w-full"
            >
              Vérifier ma saisie
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-[12.5px] text-white">
                <span className="font-bold text-[#A3FF12]">
                  {apercu.trouves.length}
                </span>{' '}
                avis prêts à être importés.
              </p>

              {apercu.ignores.length > 0 && (
                <p className="text-[12px] text-amber-400">
                  {apercu.ignores.length} bloc(s) ignoré(s) — nom ou texte trop court.
                </p>
              )}

              <div className="max-h-56 overflow-y-auto space-y-1.5">
                {apercu.trouves.map((a, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-black/30 border border-white/10">
                    <p className="text-[12px] font-bold text-white">
                      {a.clientName} <span className="text-[#A3FF12]">{'★'.repeat(a.rating)}</span>
                    </p>
                    <p className="text-[11.5px] text-[#8A949F] line-clamp-2">{a.comment}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="primary" onClick={() => void importer()} className="flex-1">
                  Importer {apercu.trouves.length} avis
                </Button>
                <Button onClick={() => setApercu(null)}>Modifier</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

/* ----------------------- Avis sous les chansons ----------------------- */

function SongReviewsAdmin() {
  const [avis, setAvis] = useState<SongReview[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ songId: string; clientName: string; rating: number; comment: string }>({
    songId: '',
    clientName: '',
    rating: 5,
    comment: '',
  });
  const [songs, setSongs] = useState<GallerySong[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      setAvis(await api.admin.songReviews());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  };
  const loadSongs = async () => {
    try {
      const toutes = await api.admin.gallery();
      setSongs(toutes);
    } catch {
      /* silencieux */
    }
  };
  useEffect(() => {
    void load();
    void loadSongs();
  }, []);

  const toggle = async (a: SongReview) => {
    await api.admin.updateSongReview(a.id, { approved: !a.approved });
    await load();
  };
  const remove = async (id: string) => {
    if (!window.confirm('Supprimer cet avis ?')) return;
    await api.admin.deleteSongReview(id);
    await load();
  };

  const ajouter = async () => {
    if (!form.songId || !form.clientName || !form.comment) return;
    try {
      const res = await fetch('/api/admin/song-reviews', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songId: form.songId,
          clientName: form.clientName,
          rating: form.rating,
          comment: form.comment,
          approved: true,
        }),
      });
      if (!res.ok) throw new Error('Erreur serveur');
      setForm({ songId: '', clientName: '', rating: 5, comment: '' });
      await load();
    } catch {
      setError("Erreur lors de l'ajout.");
    }
  };

  if (loading) return <Spinner />;

  const pending = avis.filter((a) => !a.approved).length;

  return (
    <div className="space-y-4">
      <ErrorNote message={error} />
      {pending > 0 && (
        <p className="text-xs text-[#A3FF12] bg-[#A3FF12]/10 border border-[#A3FF12]/20 rounded-lg px-3 py-2">
          {pending} avis en attente de modération.
        </p>
      )}

      <Card title="Ajouter un avis reçu par WhatsApp" subtitle="Collez un témoignage lié à une chanson. Le numéro de téléphone est masqué automatiquement.">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Chanson concernée">
              <Select
                value={form.songId}
                onChange={(e) => setForm({ ...form, songId: e.target.value })}
              >
                <option value="">Choisir une chanson</option>
                {songs.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </Select>
            </Field>
            <Field label="Nom du client">
              <Input
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                placeholder="Marie K."
              />
            </Field>
            <Field label="Note">
              <Select
                value={String(form.rating)}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} / 5</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Témoignage">
            <TextArea
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              rows={3}
              placeholder="Ce que le client a aimé… (son numéro sera masqué)"
            />
          </Field>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={() => void ajouter()}
              disabled={!form.songId || !form.clientName || !form.comment}
              className="flex-1"
            >
              Enregistrer l'avis
            </Button>
            <Button onClick={() => setForm({ songId: '', clientName: '', rating: 5, comment: '' })}>
              Effacer
            </Button>
          </div>
        </div>
      </Card>

      {avis.length === 0 ? (
        <Empty message="Aucun avis sous les chansons pour le moment." />
      ) : (
        <div className="space-y-2">
          {avis.map((a) => {
            const chanson = songs.find((s) => s.id === a.songId);
            return (
              <div
                key={a.id}
                className="p-4 rounded-xl bg-black/30 border border-white/10 flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-bold text-white">{a.clientName}</p>
                    <span className="text-[#A3FF12] text-xs">{'★'.repeat(a.rating)}</span>
                    {a.isVerified && (
                      <span className="flex items-center gap-1 text-[10px] text-[#A3FF12] bg-[#A3FF12]/10 px-2 py-0.5 rounded">
                        <ShieldCheck className="w-3 h-3 inline mr-1" /> Client vérifié
                      </span>
                    )}
                    {a.approved ? (
                      <Badge tone="green">
                        <Eye className="w-3 h-3 inline mr-1" /> Publié
                      </Badge>
                    ) : (
                      <Badge tone="gray">
                        <EyeOff className="w-3 h-3 inline mr-1" /> Masqué
                      </Badge>
                    )}
                  </div>
                  {chanson && (
                    <p className="text-[11px] text-[#8A949F] mt-1">
                      Chanson : {chanson.title}
                    </p>
                  )}
                  <p className="text-sm text-[#C3CAD2] mt-2 leading-relaxed">{a.comment}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button variant={a.approved ? 'ghost' : 'success'} onClick={() => void toggle(a)}>
                    <Check className="w-3.5 h-3.5 inline mr-1" />
                    {a.approved ? 'Masquer' : 'Approuver'}
                  </Button>
                  <button
                    onClick={() => void remove(a.id)}
                    className="p-2 rounded-lg hover:bg-white/10 text-[#A2ABB5] hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
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
