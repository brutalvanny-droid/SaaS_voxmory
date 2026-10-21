import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  Upload,
  Mic,
  Music4,
  PenLine,
  MessageCircle,
  AlertCircle,
  Copy,
  CreditCard,
  User,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { uploadFile } from '../lib/upload.js';
import type { Order, Package } from '../types.js';

const STEPS = ['Vous', 'L’histoire', 'La musique', 'Récapitulatif'];

/**
 * Chaque étape est annoncée par une image avant d'être nommée.
 *
 * Tout le monde ne lit pas couramment, et personne ne lit un formulaire
 * avec attention. Le pictogramme et la phrase courte disent où l'on est
 * avant même d'avoir déchiffré le titre.
 */
const ETAPES = [
  { icone: User, titre: 'Vous', question: 'À qui appartient cette chanson ?', aide: 'Vos coordonnées, pour vous livrer.' },
  { icone: BookOpen, titre: 'L’histoire', question: 'De qui parle-t-on ?', aide: 'Plus vous en dites, plus la chanson sonne juste.' },
  { icone: Music4, titre: 'La musique', question: 'Quel son doit-elle avoir ?', aide: 'Une ambiance et un style suffisent.' },
  { icone: ClipboardCheck, titre: 'Récapitulatif', question: 'Tout est-il correct ?', aide: 'Relisez, puis envoyez.' },
] as const;

const OCCASIONS = [
  'Anniversaire',
  'Mariage',
  'Naissance',
  'Hommage',
  'Déclaration',
  'Remise de diplôme',
  'Départ à la retraite',
  'Autre',
];

const MOODS = ['Romantique', 'Joyeux', 'Émouvant', 'Nostalgique', 'Solennel', 'Chaleureux'];

const STYLES = [
  'Rumba congolaise',
  'Afrobeat',
  'Zouk',
  'Gospel',
  'R&B',
  'Berceuse',
  'Soukous',
  'Coupé-décalé',
];

interface Props {
  packages: Package[];
  initialParams: unknown;
  onNavigate: (page: string, params?: unknown) => void;
  onSubmitSuccess: (reference: string, trackingToken: string) => void;
}

export default function OrderForm({ packages, onNavigate, onSubmitSuccess }: Props) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Order | null>(null);
  const [uploading, setUploading] = useState<'audio' | 'photo' | null>(null);
  const [consentement, setConsentement] = useState(false);

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerCity: '',
    customerCountry: 'RDC',
    customerEmail: '',
    acceptsWhatsapp: false,

    recipientName: '',
    recipientRelationship: '',
    recipientAge: '',
    eventDate: '',

    storyOption: 'write' as 'write' | 'audio' | 'whatsapp',
    storyText: '',
    storyAudioUrl: '',
    storyPhotoUrl: '',
    importantWords: '',
    avoidWords: '',
    occasion: 'Anniversaire',

    mood: 'Romantique',
    musicStyle: 'Rumba congolaise',
    packageId: packages[0]?.id ?? 'pack_simple',
    vipCardSelected: false,

    desiredDeliveryDate: '',
    urgency: 'normal' as 'normal' | 'express' | 'super_express',
    specialInstructions: '',
  });

  useEffect(() => {
    if (packages.length > 0 && !packages.some((p) => p.id === form.packageId)) {
      setForm((f) => ({ ...f, packageId: packages[0].id }));
    }
  }, [packages, form.packageId]);

  const selected = useMemo(
    () => packages.find((p) => p.id === form.packageId) ?? packages[0],
    [packages, form.packageId],
  );

  const totalCents = (selected?.priceCents ?? 0) + (form.vipCardSelected ? 200 : 0);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => {
      if (!(String(key) in e)) return e;
      const next = { ...e };
      delete next[String(key)];
      return next;
    });
  };

  const validateStep = (): boolean => {
    const errors: Record<string, string> = {};
    if (step === 0) {
      if (form.customerName.trim().length < 2) errors.customerName = 'Indiquez votre nom.';
      if (form.customerPhone.replace(/\D/g, '').length < 7)
        errors.customerPhone = 'Numéro WhatsApp invalide.';
      if (form.customerCity.trim().length < 2) errors.customerCity = 'Indiquez votre ville.';
      /**
       * Sans WhatsApp, il faut un autre moyen de livrer la chanson.
       * L'e-mail devient alors obligatoire — mais on le dit au client
       * au moment où il décoche, pas en refusant sa commande à la fin.
       */
      if (!form.acceptsWhatsapp && !form.customerEmail.trim())
        errors.customerEmail =
          'Sans WhatsApp, indiquez une adresse e-mail pour recevoir votre chanson.';
    }
    if (step === 1) {
      if (form.recipientName.trim().length < 2)
        errors.recipientName = 'Indiquez le nom du destinataire.';
      if (form.recipientRelationship.trim().length < 2)
        errors.recipientRelationship = 'Précisez votre lien (maman, époux…).';
      if (form.storyOption === 'write' && form.storyText.trim().length < 15)
        errors.storyText = 'Racontez au moins quelques lignes (15 caractères minimum).';
      if (form.storyOption === 'audio' && !form.storyAudioUrl)
        errors.storyAudioUrl = 'Déposez votre note vocale.';
    }
    if (step === 2) {
      if (!form.mood) errors.mood = 'Choisissez une ambiance.';
      if (!form.musicStyle) errors.musicStyle = 'Choisissez un style.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    /**
     * On ne raccourcit pas : la dernière étape demande une confirmation
     * explicite. Une commande envoyée par inadvertance coûte plus cher à
     * défaire que le temps de cocher une case.
     */
    if (!consentement) {
      setFieldErrors((e) => ({
        ...e,
        consentement: 'Cochez la case pour confirmer votre commande.',
      }));
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const order = await api.createOrder({
        ...form,
        customerEmail: form.customerEmail.trim() || null,
        recipientAge: form.recipientAge || null,
        eventDate: form.eventDate || null,
        importantWords: form.importantWords || null,
        avoidWords: form.avoidWords || null,
        storyText: form.storyOption === 'write' ? form.storyText : null,
        storyAudioUrl: form.storyOption === 'audio' ? form.storyAudioUrl : null,
        storyPhotoUrl: form.storyPhotoUrl || null,
        specialInstructions: form.specialInstructions || null,
        desiredDeliveryDate: form.desiredDeliveryDate || null,
      });
      setCreated(order);
    } catch (err) {
      const e = err as Error & { details?: { field: string; message: string }[] };
      setError(e.message);
      if (Array.isArray(e.details)) {
        setFieldErrors(Object.fromEntries(e.details.map((d) => [d.field, d.message])));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFile = async (kind: 'audio' | 'photo', file: File | undefined) => {
    if (!file) return;
    setUploading(kind);
    setError('');
    try {
      const url = await uploadFile(file);
      if (kind === 'audio') set('storyAudioUrl', url);
      else set('storyPhotoUrl', url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Téléversement impossible.');
    } finally {
      setUploading(null);
    }
  };

  /* -------------------------- Confirmation -------------------------- */

  if (created) {
    return (
      <Confirmation
        order={created}
        onNavigate={onNavigate}
        onDone={() => onSubmitSuccess(created.reference, created.trackingToken)}
      />
    );
  }

  /* ----------------------------- Formulaire ------------------------- */

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-6 py-16 sm:py-20">
      <header className="text-center mb-10">
        <h1 className="text-[clamp(1.9rem,4.6vw,2.9rem)] font-extrabold text-white tracking-[-0.035em] leading-tight">
          Commander une <span className="text-gradient">chanson</span>
        </h1>
        <p className="text-[14.5px] text-[#A2ABB5] mt-3">
          Quelques minutes suffisent pour nous raconter l'essentiel.
        </p>
      </header>

      <div className="flex items-center justify-between mb-8">
        {ETAPES.map(({ icone: Icone, titre }, i) => (
          <div key={titre} className="flex-1 flex items-center">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                  i < step
                    ? 'bg-emerald-500 text-black'
                    : i === step
                      ? 'bg-[#A3FF12] text-black ring-4 ring-[#A3FF12]/25'
                      : 'bg-white/10 text-[#8A949F]'
                }`}
              >
                {i < step ? <Check className="w-5 h-5" /> : <Icone className="w-5 h-5" />}
              </div>
              <span
                className={`text-[11px] font-bold ${
                  i === step ? 'text-[#A3FF12]' : 'text-[#6C7581]'
                }`}
              >
                {titre}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-4 -mx-1 ${i < step ? 'bg-emerald-500' : 'bg-white/10'}`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="mb-5 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </p>
      )}

      <div className="bg-[#0B0D10] border border-white/10 rounded-2xl p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            {/* Où en est-on ? Dit en image, puis en une phrase. */}
            <div className="flex items-start gap-3 pb-4 mb-1 border-b border-white/[0.07]">
              <span className="w-11 h-11 rounded-xl bg-[#A3FF12]/12 grid place-items-center flex-shrink-0">
                {(() => {
                  const Icone = ETAPES[step]?.icone ?? User;
                  return <Icone className="w-5 h-5 text-[#A3FF12]" />;
                })()}
              </span>
              <span>
                <span className="block text-[16px] font-extrabold text-white leading-tight">
                  {ETAPES[step]?.question}
                </span>
                <span className="block text-[12.5px] text-[#8A949F] mt-0.5 leading-relaxed">
                  {ETAPES[step]?.aide}
                </span>
              </span>
            </div>

            {step === 0 && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Votre nom complet *" error={fieldErrors.customerName}>
                    <input
                      className={inputClass}
                      value={form.customerName}
                      onChange={(e) => set('customerName', e.target.value)}
                      placeholder="Sarah Kabeya"
                    />
                  </Field>
                  <Field label="WhatsApp *" error={fieldErrors.customerPhone}>
                    <input
                      className={inputClass}
                      value={form.customerPhone}
                      onChange={(e) => set('customerPhone', e.target.value)}
                      placeholder="+243 81 000 00 00"
                    />
                  </Field>
                  <Field label="Ville *" error={fieldErrors.customerCity}>
                    <input
                      className={inputClass}
                      value={form.customerCity}
                      onChange={(e) => set('customerCity', e.target.value)}
                      placeholder="Lubumbashi"
                    />
                  </Field>
                  <Field label="Pays *">
                    <input
                      className={inputClass}
                      value={form.customerCountry}
                      onChange={(e) => set('customerCountry', e.target.value)}
                    />
                  </Field>
                </div>
                <Field
                  label={form.acceptsWhatsapp ? 'E-mail (facultatif)' : 'E-mail *'}
                  error={fieldErrors.customerEmail}
                >
                  <input
                    className={inputClass}
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => set('customerEmail', e.target.value)}
                  />
                </Field>
                <label className="flex items-start gap-3 p-4 rounded-xl bg-black/40 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.acceptsWhatsapp}
                    onChange={(e) => set('acceptsWhatsapp', e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#A3FF12]"
                  />
                  <span className="text-xs text-[#C3CAD2] leading-relaxed">
                    J'accepte d'être contacté sur WhatsApp pour finaliser ma commande et
                    recevoir ma chanson.
                    <span className="block text-[#8A949F] mt-1">
                      Recommandé — c'est le moyen le plus rapide de vous joindre. Si vous
                      le laissez décoché, indiquez une adresse e-mail.
                    </span>
                  </span>
                </label>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Pour qui ? *" error={fieldErrors.recipientName}>
                    <input
                      className={inputClass}
                      value={form.recipientName}
                      onChange={(e) => set('recipientName', e.target.value)}
                      placeholder="Georgette"
                    />
                  </Field>
                  <Field label="Votre lien *" error={fieldErrors.recipientRelationship}>
                    <input
                      className={inputClass}
                      value={form.recipientRelationship}
                      onChange={(e) => set('recipientRelationship', e.target.value)}
                      placeholder="Ma maman"
                    />
                  </Field>
                  <Field label="Âge (facultatif)">
                    <input
                      className={inputClass}
                      value={form.recipientAge}
                      onChange={(e) => set('recipientAge', e.target.value)}
                    />
                  </Field>
                  <Field label="Occasion *">
                    <select
                      className={inputClass}
                      value={form.occasion}
                      onChange={(e) => set('occasion', e.target.value)}
                    >
                      {OCCASIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A2ABB5] mb-2">
                    Comment nous raconter son histoire ?
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ['write', 'Écrire', PenLine],
                        ['audio', 'Note vocale', Mic],
                        ['whatsapp', 'Sur WhatsApp', MessageCircle],
                      ] as const
                    ).map(([id, label, Icon]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => set('storyOption', id)}
                        className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                          form.storyOption === id
                            ? 'border-[#A3FF12] bg-[#A3FF12]/10 text-[#A3FF12]'
                            : 'border-white/10 text-[#A2ABB5] hover:border-white/25'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {form.storyOption === 'write' && (
                  <Field
                    label="Son histoire *"
                    error={fieldErrors.storyText}
                    hint="Souvenirs, anecdotes, petits détails du quotidien : tout ce qui rendra la chanson unique."
                  >
                    <textarea
                      rows={7}
                      className={inputClass}
                      value={form.storyText}
                      onChange={(e) => set('storyText', e.target.value)}
                      placeholder="Elle a élevé ses enfants seule à Goma, adore les fleurs et rit toujours en préparant le foufou…"
                    />
                  </Field>
                )}

                {/* Encouragement au fil de la frappe.
                    On ne mesure pas pour contraindre, mais pour rassurer :
                    « vous y êtes presque » se lit mieux qu'un compteur nu. */}
                {form.storyOption === 'write' && form.storyText.trim().length > 0 && (
                  <p
                    className={`text-[12.5px] flex items-center gap-1.5 ${
                      form.storyText.trim().length >= 15
                        ? 'text-emerald-400'
                        : 'text-[#8A949F]'
                    }`}
                  >
                    {form.storyText.trim().length >= 15 ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Parfait, nous avons de quoi travailler.
                      </>
                    ) : (
                      <>
                        Encore {15 - form.storyText.trim().length} caractères —
                        décrivez un souvenir, même bref.
                      </>
                    )}
                  </p>
                )}

                {form.storyOption === 'audio' && (
                  <Field label="Votre note vocale *" error={fieldErrors.storyAudioUrl}>
                    <label className="flex items-center justify-center gap-2 w-full p-6 rounded-xl border border-dashed border-white/20 cursor-pointer hover:border-[#A3FF12]/50 transition-colors">
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => void handleFile('audio', e.target.files?.[0])}
                      />
                      {uploading === 'audio' ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#A3FF12]" />
                      ) : (
                        <Upload className="w-4 h-4 text-[#A3FF12]" />
                      )}
                      <span className="text-xs text-[#C3CAD2]">
                        {form.storyAudioUrl
                          ? 'Fichier déposé — cliquez pour remplacer'
                          : 'Déposer un fichier audio (10 Mo max.)'}
                      </span>
                    </label>
                  </Field>
                )}

                {form.storyOption === 'whatsapp' && (
                  <p className="text-xs text-[#A2ABB5] bg-black/40 border border-white/10 rounded-xl p-4 leading-relaxed">
                    Parfait : nous vous appellerons sur WhatsApp pour recueillir son
                    histoire de vive voix. La commande est enregistrée dès maintenant.
                  </p>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Mots à inclure" hint="Séparés par des virgules">
                    <input
                      className={inputClass}
                      value={form.importantWords}
                      onChange={(e) => set('importantWords', e.target.value)}
                    />
                  </Field>
                  <Field label="Sujets à éviter">
                    <input
                      className={inputClass}
                      value={form.avoidWords}
                      onChange={(e) => set('avoidWords', e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="Photo du destinataire (facultatif)">
                  <label className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border border-dashed border-white/20 cursor-pointer hover:border-[#A3FF12]/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void handleFile('photo', e.target.files?.[0])}
                    />
                    {uploading === 'photo' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#A3FF12]" />
                    ) : (
                      <Upload className="w-4 h-4 text-[#A3FF12]" />
                    )}
                    <span className="text-xs text-[#C3CAD2]">
                      {form.storyPhotoUrl ? 'Photo déposée' : 'Ajouter une photo'}
                    </span>
                  </label>
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="Ambiance *" error={fieldErrors.mood}>
                  <div className="flex flex-wrap gap-2">
                    {MOODS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => set('mood', m)}
                        className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-all ${
                          form.mood === m
                            ? 'border-[#A3FF12] bg-[#A3FF12]/10 text-[#A3FF12]'
                            : 'border-white/10 text-[#A2ABB5] hover:border-white/25'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Style musical *" error={fieldErrors.musicStyle}>
                  <div className="flex flex-wrap gap-2">
                    {STYLES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set('musicStyle', s)}
                        className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-all ${
                          form.musicStyle === s
                            ? 'border-[#A3FF12] bg-[#A3FF12]/10 text-[#A3FF12]'
                            : 'border-white/10 text-[#A2ABB5] hover:border-white/25'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Formule *">
                  <div className="space-y-2">
                    {packages.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => set('packageId', p.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          form.packageId === p.id
                            ? 'border-[#A3FF12] bg-[#A3FF12]/5'
                            : 'border-white/10 hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-white">{p.name}</p>
                            <p className="text-[11px] text-[#8A949F] mt-0.5">{p.promise}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-[#A3FF12]">{p.priceLabel}</p>
                            <p className="text-[10px] text-[#8A949F]">{p.deliveryTime}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </Field>

                <label className="flex items-start gap-3 p-4 rounded-xl bg-black/40 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.vipCardSelected}
                    onChange={(e) => set('vipCardSelected', e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#A3FF12]"
                  />
                  <span className="text-xs text-[#C3CAD2]">
                    Ajouter la carte VIP souvenir (+ 2 $)
                  </span>
                </label>

                <Field label="Date de livraison souhaitée">
                  <input
                    type="date"
                    className={inputClass}
                    value={form.desiredDeliveryDate}
                    onChange={(e) => set('desiredDeliveryDate', e.target.value)}
                  />
                </Field>

                <Field label="Instructions particulières">
                  <textarea
                    rows={3}
                    className={inputClass}
                    value={form.specialInstructions}
                    onChange={(e) => set('specialInstructions', e.target.value)}
                  />
                </Field>
              </>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <Recap label="Client" value={`${form.customerName} · ${form.customerPhone}`} />
                <Recap label="Livraison" value={`${form.customerCity}, ${form.customerCountry}`} />
                <Recap
                  label="Destinataire"
                  value={`${form.recipientName} (${form.recipientRelationship})`}
                />
                <Recap label="Occasion" value={form.occasion} />
                <Recap label="Histoire" value={storySummary(form)} />
                <Recap label="Musique" value={`${form.musicStyle} · ${form.mood}`} />
                <Recap label="Formule" value={`${selected?.name ?? '—'} · ${selected?.deliveryTime}`} />

                <div className="flex items-center justify-between p-4 rounded-xl bg-[#A3FF12]/10 border border-[#A3FF12]/30">
                  <span className="text-sm font-bold text-white">Total</span>
                  <span className="text-xl font-black text-[#A3FF12]">
                    {(totalCents / 100).toLocaleString('fr-FR')} $
                  </span>
                </div>

                <label className="flex items-start gap-3 p-4 rounded-xl bg-black/40 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentement}
                    onChange={(e) => {
                      setConsentement(e.target.checked);
                      setFieldErrors((err) => {
                        if (!('consentement' in err)) return err;
                        const n = { ...err };
                        delete n['consentement'];
                        return n;
                      });
                    }}
                    className="mt-0.5 w-5 h-5 accent-[#A3FF12] flex-shrink-0"
                  />
                  <span className="text-[13px] text-[#C3CAD2] leading-relaxed">
                    J'ai tout relu et je confirme ma commande.
                    <span className="block text-[#8A949F] text-[12px] mt-1">
                      Vous réglerez à l'étape suivante, par mobile money ou
                      carte. Rien n'est débité maintenant.
                    </span>
                  </span>
                </label>

                {fieldErrors.consentement && (
                  <p className="text-[12.5px] text-red-300 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {fieldErrors.consentement}
                  </p>
                )}

                <p className="text-[11px] text-[#8A949F] leading-relaxed">
                  Le prix est calculé sur le serveur à partir de la formule choisie.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between gap-3 mt-7 pt-5 border-t border-white/10">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl text-[14px] font-bold text-[#A2ABB5] hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" /> Retour
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#A3FF12] hover:bg-[#8FE00F] text-black text-[14px] font-black transition-colors"
            >
              Continuer <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void submit()}
              disabled={submitting}
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#A3FF12] hover:bg-[#8FE00F] text-black text-[14px] font-black transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmer et payer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Confirmation --------------------------- */

function Confirmation({
  order,
  onNavigate,
  onDone,
}: {
  order: Order;
  onNavigate: (page: string, params?: unknown) => void;
  onDone: () => void;
}) {
  void onDone;
  return (
    <OrderSuccess
      reference={order.reference}
      trackingToken={order.trackingToken}
      amountCents={order.amountCents}
      currency={order.currency}
      onNavigate={onNavigate}
    />
  );
}

export function OrderSuccess({
  reference,
  trackingToken,
  amountCents,
  currency,
  onNavigate,
}: {
  reference: string;
  trackingToken: string;
  amountCents: number;
  currency: string;
  onNavigate: (page: string, params?: unknown) => void;
}) {
  const [networks, setNetworks] = useState<{ code: string; name: string }[]>([]);
  const [method, setMethod] = useState<'checkout' | 'softpay'>('checkout');
  const [network, setNetwork] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.networks('CD').then((r) => setNetworks(r.networks)).catch(() => {});
  }, []);

  const pay = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api.initPayment({
        reference,
        method,
        country: 'CD',
        network: method === 'softpay' ? network : undefined,
      });
      if (res.checkoutUrl) {
        window.open(res.checkoutUrl, '_blank', 'noopener');
      } else if (method === 'softpay') {
        setError('Invitation envoyée sur votre téléphone : validez-la pour confirmer.');
      }
      void poll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Paiement impossible.');
    } finally {
      setBusy(false);
    }
  };

  const poll = async () => {
    for (let i = 0; i < 24; i += 1) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const s = await api.paymentStatus(reference);
        if (s.status === 'Paid') {
          setPaid(true);
          return;
        }
      } catch {
        /* on réessaie */
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-14 text-center">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/15 mb-5">
          <Check className="w-8 h-8 text-emerald-400" />
        </div>

        <h1 className="text-[clamp(1.7rem,4vw,2.4rem)] font-extrabold text-white tracking-[-0.035em]">Commande enregistrée</h1>
        <p className="text-sm text-[#A2ABB5] mt-2">
          Conservez précieusement votre référence de commande.
        </p>

        <div className="mt-6 p-4 rounded-xl bg-black/50 border border-white/10">
          <p className="font-mono text-xl font-black text-[#A3FF12] tracking-wider">
            {reference}
          </p>
          <button
            onClick={() => {
              void navigator.clipboard.writeText(reference);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="mt-2 text-[11px] text-[#8A949F] hover:text-white inline-flex items-center gap-1"
          >
            <Copy className="w-3 h-3" /> {copied ? 'Copié !' : 'Copier'}
          </button>
        </div>

        {paid ? (
          <p className="mt-6 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            Paiement confirmé. Nos compositeurs commencent à travailler sur votre chanson.
          </p>
        ) : (
          <div className="mt-6 space-y-4 text-left">
            <div className="p-4 rounded-xl bg-[#0B0D10] border border-white/10">
              <p className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#A3FF12]" />
                Régler ma commande — {(amountCents / 100).toLocaleString('fr-FR')} {currency}
              </p>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {(
                  [
                    ['checkout', 'Page sécurisée'],
                    ['softpay', 'Invitation téléphone'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setMethod(id)}
                    className={`p-2.5 rounded-lg text-xs font-bold border transition-all ${
                      method === id
                        ? 'border-[#A3FF12] bg-[#A3FF12]/10 text-[#A3FF12]'
                        : 'border-white/10 text-[#A2ABB5]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {method === 'softpay' && (
                <select
                  className={inputClass}
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                >
                  <option value="">Choisissez votre réseau…</option>
                  {networks.map((n) => (
                    <option key={n.code} value={n.code}>
                      {n.name}
                    </option>
                  ))}
                </select>
              )}

              {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

              <button
                onClick={() => void pay()}
                disabled={busy || (method === 'softpay' && !network)}
                className="w-full mt-4 py-2.5 rounded-lg bg-[#A3FF12] hover:bg-[#A3FF12] text-black text-xs font-black uppercase tracking-wide disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Payer maintenant
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center mt-7">
          <button
            onClick={() => onNavigate('tracking', { id: trackingToken || reference })}
            className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold"
          >
            Suivre ma commande
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="px-5 py-2.5 rounded-lg text-[#8A949F] hover:text-white text-xs font-bold"
          >
            Retour à l'accueil
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ----------------------------- Utilitaires --------------------------- */

function storySummary(form: { storyOption: string; storyText: string }): string {
  if (form.storyOption === 'write') {
    const t = form.storyText.trim();
    return t.length > 90 ? `${t.slice(0, 90)}…` : t || '—';
  }
  if (form.storyOption === 'audio') return 'Note vocale déposée';
  return 'À recueillir sur WhatsApp';
}

const inputClass =
  'w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#1D2229] focus:outline-none focus:border-[#A3FF12]/60 transition-colors';

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#A2ABB5] mb-1.5">
        {label}
      </span>
      {children}
      {hint && !error && <span className="block text-[10px] text-[#6C7581] mt-1">{hint}</span>}
      {error && <span className="block text-[11px] text-red-400 mt-1">{error}</span>}
    </label>
  );
}

function Recap({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm py-2 border-b border-white/5">
      <span className="text-[#8A949F] shrink-0">{label}</span>
      <span className="text-[#E8EDF1] text-right">{value}</span>
    </div>
  );
}
