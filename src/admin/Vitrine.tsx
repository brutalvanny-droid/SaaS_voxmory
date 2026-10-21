import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Film,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
  Star,
  Upload,
  Zap,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { uploadFile } from '../lib/upload.js';
import type { ClientReview, GallerySong, HomeConfig } from '../types.js';
import BadgePromo, { COULEURS_PROMO } from '../components/BadgePromo.js';
import { useNotifier, useNotifications } from '../components/Notifications.js';
import { Button, Card, ErrorNote, Field, Input } from './ui.js';

/**
 * Vitrine : ce que le visiteur voit en arrivant.
 *
 * Ce studio-là ne s'adresse pas à un informaticien. Chaque réglage est
 * donc montré avant d'être décrit : on voit le badge tel qu'il
 * apparaîtra, la vidéo telle qu'elle tournera, la chanson telle qu'elle
 * sera présentée. Quelqu'un qui ne lit pas couramment peut néanmoins
 * composer sa page d'accueil en reconnaissant les vignettes.
 *
 * Rien n'est enregistré au fil de la saisie : on modifie, on regarde
 * l'aperçu, puis on confirme. Un site vitrine qui change à chaque frappe
 * au clavier expose des états intermédiaires à ses visiteurs.
 */

type Onglet = 'hero' | 'promo' | 'alaffiche';

const ONGLETS: { id: Onglet; libelle: string; icone: typeof Film }[] = [
  { id: 'hero', libelle: 'Héros', icone: Film },
  { id: 'promo', libelle: 'Promo', icone: Zap },
  { id: 'alaffiche', libelle: 'À la une', icone: Star },
];

export default function Vitrine() {
  const [onglet, setOnglet] = useState<Onglet>('hero');
  const [config, setConfig] = useState<HomeConfig | null>(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.admin
      .home()
      .then(setConfig)
      .catch((e) => setErreur(e instanceof Error ? e.message : 'Chargement impossible.'));
  }, []);

  const enregistrer = useCallback(async (cfg: HomeConfig) => {
    const sauve = await api.admin.saveHome(cfg);
    setConfig(sauve);
    return sauve;
  }, []);

  if (erreur) return <ErrorNote message={erreur} />;
  if (!config) {
    return (
      <div className="flex items-center justify-center py-24 text-[#8A949F] gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {ONGLETS.map(({ id, libelle, icone: Icone }) => (
          <button
            key={id}
            onClick={() => setOnglet(id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-bold transition-colors ${
              onglet === id
                ? 'bg-[#A3FF12] text-black'
                : 'bg-white/[0.04] text-[#8A949F] hover:text-white'
            }`}
          >
            <Icone className="w-3.5 h-3.5" />
            {libelle}
          </button>
        ))}
      </div>

      {onglet === 'hero' && <Hero config={config} onSave={enregistrer} />}
      {onglet === 'promo' && <Promo config={config} onSave={enregistrer} />}
      {onglet === 'alaffiche' && (
        <ALaUne config={config} onSave={enregistrer} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Héros                                                               */
/* ------------------------------------------------------------------ */

function Hero({
  config,
  onSave,
}: {
  config: HomeConfig;
  onSave: (c: HomeConfig) => Promise<HomeConfig>;
}) {
  const [hero, setHero] = useState(config.hero);
  const [envoi, setEnvoi] = useState<string | null>(null);
  const [etat, setEtat] = useState<'idle' | 'ok' | 'erreur'>('idle');
  const [message, setMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const { attente } = useNotifier();
  const { maj } = useNotifications();

  async function deposer(fichier: File, champ: 'videoUrl' | 'posterUrl' | 'webmUrl') {
    setEnvoi(champ);
    setMessage('');
    try {
      const estVideo = champ !== 'posterUrl';
      const url = await uploadFile(fichier, true, estVideo);
      setHero((h) => ({ ...h, [champ]: url }));
      setEtat('ok');
      setMessage(
        estVideo
          ? 'Vidéo envoyée. Enregistrez pour la mettre en ligne.'
          : 'Image envoyée. Enregistrez pour la mettre en ligne.',
      );
      // Faire défiler jusqu'à l'aperçu : sinon le succès reste invisible
      // en bas de l'écran alors que l'œil est sur le bouton.
      document
        .getElementById('apercu-hero')
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {
      setEtat('erreur');
      setMessage(e instanceof Error ? e.message : 'Envoi impossible.');
    } finally {
      setEnvoi(null);
    }
  }

  async function sauver() {
    setEtat('idle');
    const id = attente('Enregistrement…');
    try {
      await onSave({ ...config, hero });
      setEtat('ok');
      setMessage('Enregistré. La page d’accueil utilise maintenant ces médias.');
      maj(id, {
        ton: 'succes',
        titre: 'Médias enregistrés',
        detail: 'La page d’accueil affiche déjà la nouvelle version.',
        duree: 4000,
      });
    } catch (e) {
      setEtat('erreur');
      setMessage(e instanceof Error ? e.message : 'Enregistrement impossible.');
      maj(id, { ton: 'erreur', titre: 'Enregistrement impossible', duree: 0 });
    }
  }

  const remettre = () => setHero(config.hero);

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card title="Médias du héros" subtitle="Le grand bandeau en haut de la page d'accueil">
        <div className="space-y-4">
          {/* Affiche */}
          <div>
            <p className="text-[12px] font-semibold text-[#C2CAD3] mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-[#8A949F]" />
              Image d'affiche
            </p>
            <p className="text-[11.5px] text-[#6C7581] mb-2 leading-relaxed">
              Elle s'affiche immédiatement et reste seule à l'écran si la
              vidéo ne se lance pas. C'est elle qui garantit qu'il n'y a
              jamais de zone noire.
            </p>
            <div className="flex items-center gap-3">
              {hero.posterUrl && (
                <img
                  src={hero.posterUrl}
                  alt=""
                  className="w-28 h-16 object-cover rounded-lg border border-white/10 flex-shrink-0"
                />
              )}
              <Depot
                onFile={(f) => void deposer(f, 'posterUrl')}
                envoi={envoi === 'posterUrl'}
                accept="image/*"
                libelle="Choisir une image"
              />
            </div>
            <div className="mt-2">
              <Input
                value={hero.posterUrl}
                onChange={(e) => setHero((h) => ({ ...h, posterUrl: e.target.value }))}
                placeholder="/images/hero-poster.jpg"
              />
            </div>
          </div>

          {/* Vidéo */}
          <div className="pt-4 border-t border-white/[0.06]">
            <p className="text-[12px] font-semibold text-[#C2CAD3] mb-2 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-[#8A949F]" />
              Vidéo de fond
            </p>
            <p className="text-[11.5px] text-[#6C7581] mb-2 leading-relaxed">
              Facultative. Muette, en boucle, et jamais lancée en économie
              de données : une image seule suffit amplement.
            </p>
            <div className="flex items-center gap-3">
              <Depot
                onFile={(f) => void deposer(f, 'videoUrl')}
                envoi={envoi === 'videoUrl'}
                accept="video/*"
                libelle="Choisir une vidéo"
              />
            </div>
            <div className="mt-2 space-y-2">
              <Input
                value={hero.videoUrl}
                onChange={(e) => setHero((h) => ({ ...h, videoUrl: e.target.value }))}
                placeholder="MP4 — /images/hero.mp4"
              />
              <Input
                value={hero.webmUrl}
                onChange={(e) => setHero((h) => ({ ...h, webmUrl: e.target.value }))}
                placeholder="WebM — /images/hero.webm (plus léger)"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button onClick={() => void sauver()}>
              <Save className="w-3.5 h-3.5 inline mr-1.5" />
              Enregistrer
            </Button>
            <Button onClick={remettre}>
              <RotateCcw className="w-3.5 h-3.5 inline mr-1.5" />
              Annuler
            </Button>
          </div>

          {etat !== 'idle' && (
            <p
              className={`text-[12.5px] flex items-center gap-1.5 ${
                etat === 'ok' ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {etat === 'ok' && <Check className="w-3.5 h-3.5" />}
              {message}
            </p>
          )}
        </div>
      </Card>

      {/* Aperçu */}
      <div id="apercu-hero">
      <Card title="Aperçu" subtitle="Exactement ce que verra le visiteur">
        <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-[#07080A]">
          {hero.posterUrl ? (
            <img src={hero.posterUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-[#6C7581] text-[12px]">
              Aucune image
            </div>
          )}

          {hero.videoUrl && (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              poster={hero.posterUrl || undefined}
              key={hero.videoUrl}
            >
              {hero.webmUrl && <source src={hero.webmUrl} type="video/webm" />}
              <source src={hero.videoUrl} type="video/mp4" />
            </video>
          )}

          {/* Voile et texte, comme sur le site */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#06080A] via-[#06080A]/80 to-transparent" />
          <div className="absolute inset-0 flex items-center p-5">
            <div>
              <p className="text-white font-black text-lg leading-tight">Votre histoire.</p>
              <p className="text-[#A3FF12] font-black text-lg leading-tight">Votre chanson.</p>
            </div>
          </div>
        </div>

        <p className="text-[11.5px] text-[#6C7581] mt-3 leading-relaxed">
          Le texte, lui, vient des traductions : il reste identique dans les
          trois langues du site.
        </p>
      </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Promo                                                               */
/* ------------------------------------------------------------------ */

const FORMES: { id: HomeConfig['promo']['forme']; libelle: string }[] = [
  { id: 'pastille', libelle: 'Pastille' },
  { id: 'ruban', libelle: 'Ruban' },
  { id: 'eclair', libelle: 'Éclair' },
];

const COULEURS = COULEURS_PROMO;

function Promo({
  config,
  onSave,
}: {
  config: HomeConfig;
  onSave: (c: HomeConfig) => Promise<HomeConfig>;
}) {
  const [promo, setPromo] = useState(config.promo);
  const [etat, setEtat] = useState<'idle' | 'ok' | 'erreur'>('idle');
  const [message, setMessage] = useState('');
  const { attente } = useNotifier();
  const { maj } = useNotifications();

  async function sauver() {
    setEtat('idle');
    const id = attente('Enregistrement…');
    try {
      await onSave({ ...config, promo });
      setEtat('ok');
      setMessage('Enregistré.');
      maj(id, {
        ton: 'succes',
        titre: promo.actif ? 'Promotion en ligne' : 'Promotion retirée',
        detail: promo.actif
          ? 'Le badge est visible sur la page d’accueil.'
          : 'La page d’accueil s’affiche normalement.',
        duree: 4000,
      });
    } catch (e) {
      setEtat('erreur');
      setMessage(e instanceof Error ? e.message : 'Enregistrement impossible.');
      maj(id, { ton: 'erreur', titre: 'Enregistrement impossible', duree: 0 });
    }
  }

  const couleur = COULEURS.find((c) => c.id === promo.couleur) ?? COULEURS[0];

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card title="Badge promotionnel" subtitle="Le gros repère que l'on voit de loin">
        <div className="space-y-5">
          {/* Activation */}
          <button
            onClick={() => setPromo((p) => ({ ...p, actif: !p.actif }))}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors ${
              promo.actif
                ? 'bg-[#A3FF12]/10 border-[#A3FF12]/30'
                : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04]'
            }`}
          >
            <span
              className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${
                promo.actif ? 'bg-[#A3FF12]' : 'bg-[#2C343D]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  promo.actif ? 'translate-x-5' : ''
                }`}
              />
            </span>
            <span className="text-left">
              <span className="block text-[13px] font-bold text-white">
                {promo.actif ? 'Badge visible' : 'Badge masqué'}
              </span>
              <span className="block text-[11.5px] text-[#8A949F]">
                {promo.actif
                  ? 'Il apparaît sur la page d’accueil.'
                  : 'Le site s’affiche normalement.'}
              </span>
            </span>
          </button>

          {/* Texte */}
          <div className="space-y-3">
            <Field label="Le gros mot (24 lettres au plus)">
              <Input
                value={promo.texte}
                onChange={(e) => setPromo((p) => ({ ...p, texte: e.target.value.slice(0, 24) }))}
                placeholder="Spécial mariage"
                maxLength={24}
              />
            </Field>
            <Field label="Petite précision en dessous">
              <Input
                value={promo.sousTexte}
                onChange={(e) =>
                  setPromo((p) => ({ ...p, sousTexte: e.target.value.slice(0, 48) }))
                }
                placeholder="Moins 20 % cette semaine"
                maxLength={48}
              />
            </Field>
            <p className="text-[11.5px] text-[#6C7581]">
              Un badge se lit en une seconde. Deux mots valent mieux qu'une
              phrase entière.
            </p>
          </div>

          {/* Forme — montrée, pas décrite */}
          <div>
            <p className="text-[12px] font-semibold text-[#C2CAD3] mb-2">Forme</p>
            <div className="grid grid-cols-3 gap-2">
              {FORMES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPromo((p) => ({ ...p, forme: f.id }))}
                  className={`p-3 rounded-xl border transition-colors ${
                    promo.forme === f.id
                      ? 'border-[#A3FF12] bg-[#A3FF12]/10'
                      : 'border-white/[0.08] hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="grid place-items-center h-9 mb-1.5">
                    <FormeBadge forme={f.id} classe={couleur.classe} miniature />
                  </span>
                  <span className="block text-[11px] font-bold text-[#C2CAD3]">
                    {f.libelle}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Couleur */}
          <div>
            <p className="text-[12px] font-semibold text-[#C2CAD3] mb-2">Couleur</p>
            <div className="flex gap-2">
              {COULEURS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setPromo((p) => ({ ...p, couleur: c.id }))}
                  title={c.libelle}
                  className={`flex-1 py-2.5 rounded-xl text-[11.5px] font-bold ${c.classe} transition-transform ${
                    promo.couleur === c.id
                      ? 'ring-2 ring-white/70 scale-[1.04]'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {c.libelle}
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div>
            <p className="text-[12px] font-semibold text-[#C2CAD3] mb-2">Côté</p>
            <div className="flex gap-2">
              {(['gauche', 'droite'] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPromo((p) => ({ ...p, position: pos }))}
                  className={`flex-1 py-2.5 rounded-xl text-[11.5px] font-bold border transition-colors ${
                    promo.position === pos
                      ? 'border-[#A3FF12] bg-[#A3FF12]/10 text-[#A3FF12]'
                      : 'border-white/[0.08] text-[#8A949F] hover:text-white'
                  }`}
                >
                  {pos === 'gauche' ? 'À gauche' : 'À droite'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => void sauver()}>
              <Save className="w-3.5 h-3.5 inline mr-1.5" />
              Enregistrer
            </Button>
          </div>

          {etat !== 'idle' && (
            <p
              className={`text-[12.5px] ${etat === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {message}
            </p>
          )}
        </div>
      </Card>

      {/* Aperçu grandeur réelle */}
      <Card title="Aperçu" subtitle="Tel qu'il apparaîtra">
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-[#07080A]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#101317] to-[#07080A]" />

          {promo.actif && promo.texte && (
            <div
              className={`absolute top-6 ${
                promo.position === 'gauche' ? 'left-5' : 'right-5'
              }`}
            >
              <BadgePromo promo={{ ...promo, forme: promo.forme }} />
            </div>
          )}

          <div className="absolute bottom-5 left-5 right-5">
            <p className="text-white font-black text-lg leading-tight">Votre histoire.</p>
            <p className="text-[#A3FF12] font-black text-lg leading-tight">Votre chanson.</p>
          </div>
        </div>

        {promo.actif && !promo.texte && (
          <p className="text-[12px] text-amber-400 mt-3">
            Le badge est activé mais n'a pas encore de texte : il ne
            s'affichera pas.
          </p>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  À la une                                                            */
/* ------------------------------------------------------------------ */

function ALaUne({
  config,
  onSave,
}: {
  config: HomeConfig;
  onSave: (c: HomeConfig) => Promise<HomeConfig>;
}) {
  const [chansons, setChansons] = useState<GallerySong[]>([]);
  const [avis, setAvis] = useState<ClientReview[]>([]);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState<string | null>(null);

  const charger = useCallback(() => {
    setChargement(true);
    Promise.all([api.admin.gallery(), api.admin.allReviews()])
      .then(([g, r]) => {
        setChansons(g);
        setAvis(r);
      })
      .finally(() => setChargement(false));
  }, []);

  useEffect(charger, [charger]);

  async function basculerChanson(id: string, actuel: boolean) {
    setEnCours(id);
    try {
      await api.admin.updateSong(id, { isFeatured: !actuel });
      setChansons((c) =>
        c.map((x) => (x.id === id ? { ...x, isFeatured: !actuel } : x)),
      );
    } finally {
      setEnCours(null);
    }
  }

  async function basculerAvis(id: string, actuel: boolean) {
    setEnCours(id);
    try {
      await api.admin.updateReview(id, { approved: !actuel });
      setAvis((a) => a.map((x) => (x.id === id ? { ...x, approved: !actuel } : x)));
    } finally {
      setEnCours(null);
    }
  }

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-24 text-[#8A949F] gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Quantites config={config} onSave={onSave} />

      <Card
        title="Chansons à la une"
        subtitle="Cliquez sur une vignette pour la mettre en avant sur la page d'accueil"
      >
        {chansons.length === 0 ? (
          <p className="text-[12.5px] text-[#6C7581] py-4">
            Aucune chanson. Ajoutez-en depuis le Catalogue.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {chansons.map((c) => (
              <button
                key={c.id}
                onClick={() => void basculerChanson(c.id, Boolean(c.isFeatured))}
                disabled={enCours === c.id}
                className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                  c.isFeatured
                    ? 'border-[#A3FF12] ring-2 ring-[#A3FF12]/30'
                    : 'border-white/[0.08] hover:border-white/25'
                }`}
                title={c.isFeatured ? 'Retirer de la une' : 'Mettre à la une'}
              >
                <img
                  src={c.coverUrl || '/images/hero-poster.jpg'}
                  alt=""
                  className="aspect-square w-full object-cover"
                />

                {enCours === c.id && (
                  <span className="absolute inset-0 grid place-items-center bg-black/60">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  </span>
                )}

                {c.isFeatured && enCours !== c.id && (
                  <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#A3FF12] grid place-items-center">
                    <Star className="w-3 h-3 text-black fill-black" />
                  </span>
                )}

                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1.5 pt-4">
                  <span className="block text-[10px] font-bold text-white truncate text-left">
                    {c.title}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
        <p className="text-[11.5px] text-[#6C7581] mt-3">
          Les chansons marquées d'une étoile apparaissent en premier sur la
          page d'accueil.
        </p>
      </Card>

      <Card
        title="Avis visibles"
        subtitle="Seuls les avis validés sont montrés aux visiteurs"
      >
        {avis.length === 0 ? (
          <p className="text-[12.5px] text-[#6C7581] py-4">
            Aucun avis pour l'instant.
          </p>
        ) : (
          <div className="space-y-2">
            {avis.map((a) => (
              <button
                key={a.id}
                onClick={() => void basculerAvis(a.id, Boolean(a.approved))}
                disabled={enCours === a.id}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                  a.approved
                    ? 'border-emerald-500/30 bg-emerald-500/[0.06]'
                    : 'border-white/[0.07] hover:bg-white/[0.03]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 grid place-items-center ${
                    a.approved
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-white/20'
                  }`}
                >
                  {a.approved && <Check className="w-3 h-3 text-black" />}
                </span>

                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2 mb-0.5">
                    <span className="text-[12.5px] font-bold text-white">
                      {a.clientName}
                    </span>
                    <span className="flex">
                      {Array.from({ length: a.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-[#A3FF12] fill-[#A3FF12]" />
                      ))}
                    </span>
                  </span>
                  <span className="block text-[12px] text-[#8A949F] line-clamp-2">
                    {a.comment}
                  </span>
                </span>

                {enCours === a.id && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8A949F] flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Éléments partagés                                                   */
/* ------------------------------------------------------------------ */

function Depot({
  onFile,
  envoi,
  accept,
  libelle,
}: {
  onFile: (f: File) => void;
  envoi: boolean;
  accept: string;
  libelle: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
      <Button onClick={() => ref.current?.click()}>
        {envoi ? (
          <Loader2 className="w-3.5 h-3.5 inline mr-1.5 animate-spin" />
        ) : (
          <Upload className="w-3.5 h-3.5 inline mr-1.5" />
        )}
        {envoi ? 'Envoi…' : libelle}
      </Button>
    </>
  );
}

/** Aperçu miniature de la forme, sans texte. */
function FormeBadge({
  forme,
  classe,
  miniature = false,
}: {
  forme: string;
  classe: string;
  miniature?: boolean;
}) {
  const base = miniature ? 'w-9 h-9' : '';
  if (forme === 'ruban') {
    return (
      <span
        className={`${base} ${miniature ? 'w-12 h-5' : ''} ${classe} rounded-sm flex items-center justify-center text-[9px] font-black`}
      >
        {miniature ? '' : 'PROMO'}
      </span>
    );
  }
  if (forme === 'eclair') {
    return (
      <span
        className={`${base} ${classe} flex items-center justify-center`}
        style={{
          clipPath: 'polygon(28% 0, 100% 0, 72% 100%, 0 100%)',
        }}
      >
        {!miniature && <Sparkles className="w-3 h-3" />}
      </span>
    );
  }
  return (
    <span
      className={`${base} ${classe} rounded-full flex items-center justify-center text-[9px] font-black`}
    >
      {miniature ? '' : 'PROMO'}
    </span>
  );
}


/* ------------------------------------------------------------------ */
/*  Quantités affichées                                                */
/* ------------------------------------------------------------------ */

/**
 * Combien d'exemples et d'avis montrer.
 *
 * Trois gros blocs chiffrés valent mieux qu'un champ à remplir : on
 * choisit d'un coup d'œil, et l'on ne peut pas se tromper en tapant
 * « 100 » là où dix suffisent.
 */
function Quantites({
  config,
  onSave,
}: {
  config: HomeConfig;
  onSave: (c: HomeConfig) => Promise<HomeConfig>;
}) {
  const [etat, setEtat] = useState<'idle' | 'ok' | 'erreur'>('idle');

  async function choisir(cle: 'chansons' | 'avis', valeur: number) {
    setEtat('idle');
    try {
      await onSave({
        ...config,
        vitrine: { ...config.vitrine, [cle]: valeur },
      } as HomeConfig);
      setEtat('ok');
    } catch {
      setEtat('erreur');
    }
  }

  return (
    <Card
      title="Combien en montrer ?"
      subtitle="Sur la page d'accueil, pour les chansons et les avis"
    >
      <div className="space-y-5">
        <div>
          <p className="text-[12px] font-semibold text-[#C2CAD3] mb-2">
            Chansons en exemple
          </p>
          <div className="flex gap-2">
            {[3, 6, 10].map((n) => (
              <button
                key={n}
                onClick={() => void choisir('chansons', n)}
                className={`flex-1 py-4 rounded-xl text-[20px] font-black border transition-colors ${
                  config.vitrine.chansons === n
                    ? 'border-[#A3FF12] bg-[#A3FF12]/12 text-[#A3FF12]'
                    : 'border-white/[0.08] text-[#8A949F] hover:text-white hover:border-white/25'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[12px] font-semibold text-[#C2CAD3] mb-2">
            Avis clients
          </p>
          <div className="flex gap-2">
            {[3, 6].map((n) => (
              <button
                key={n}
                onClick={() => void choisir('avis', n)}
                className={`flex-1 py-4 rounded-xl text-[20px] font-black border transition-colors ${
                  config.vitrine.avis === n
                    ? 'border-[#A3FF12] bg-[#A3FF12]/12 text-[#A3FF12]'
                    : 'border-white/[0.08] text-[#8A949F] hover:text-white hover:border-white/25'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <p className="text-[11.5px] text-[#6C7581] leading-relaxed">
          Le changement est immédiat : inutile d'enregistrer quoi que ce
          soit d'autre.
        </p>

        {etat === 'erreur' && (
          <p className="text-[12.5px] text-red-400">Enregistrement impossible.</p>
        )}
      </div>
    </Card>
  );
}
