import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Loader2, Mail, Lock, User, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import Reveal from '../components/Reveal.js';
import { api } from '../lib/api.js';

/**
 * Connexion et création de compte.
 *
 * Un compte n'est jamais obligatoire pour commander — on peut payer en
 * invité. Il sert à retrouver ses chansons plus tard sans ressaisir un
 * numéro de suivi. C'est pourquoi le visiteur peut tout à fait repartir
 * d'ici : aucun parcours n'est bloqué.
 */

type Mode = 'login' | 'register' | 'forgot';

export default function Account({
  onAuthenticated,
  onNavigate,
}: {
  onAuthenticated: () => void;
  onNavigate: (page: string, params?: any) => void;
}) {
  const [mode, setMode] = useState<Mode>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const reset = () => {
    setError('');
    setNotice('');
  };

  const changeMode = (m: Mode) => {
    setMode(m);
    reset();
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    reset();

    try {
      if (mode === 'register') {
        await api.account.register({ name, email, password, phone: phone || undefined });
        onAuthenticated();
      } else if (mode === 'login') {
        await api.account.login(email, password);
        onAuthenticated();
      } else {
        await api.account.forgot(email);
        setNotice(
          'Si un compte existe avec cette adresse, un lien de réinitialisation vient de vous être envoyé.',
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  }

  const titres: Record<Mode, { h1: string; sous: string; bouton: string }> = {
    login: {
      h1: 'Content de vous revoir',
      sous: 'Connectez-vous pour retrouver vos chansons et suivre vos commandes.',
      bouton: 'Me connecter',
    },
    register: {
      h1: 'Créer mon compte',
      sous: 'Retrouvez toutes vos chansons au même endroit, à tout moment.',
      bouton: 'Créer mon compte',
    },
    forgot: {
      h1: 'Mot de passe oublié',
      sous: 'Indiquez votre adresse e-mail, nous vous enverrons un lien.',
      bouton: 'Envoyer le lien',
    },
  };

  const t = titres[mode];

  return (
    <div className="relative min-h-screen pt-28 pb-24 px-5 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[620px] h-[420px] bg-[#A3FF12]/[0.06] blur-[130px] rounded-full" />
      </div>

      <div className="max-w-md mx-auto">
        <Reveal>
          <div className="text-center mb-9">
            <motion.h1
              key={mode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-[clamp(1.9rem,4.6vw,2.6rem)] font-extrabold text-white tracking-[-0.04em] leading-tight"
            >
              {t.h1}
            </motion.h1>
            <p className="mt-3 text-[15px] text-[#A2ABB5] leading-relaxed">{t.sous}</p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm">
            {/* Onglets */}
            {mode !== 'forgot' && (
              <div className="flex p-1 mb-7 rounded-xl bg-black/40 border border-white/[0.06]">
                {(['login', 'register'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => changeMode(m)}
                    className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-all ${
                      mode === m
                        ? 'bg-[#A3FF12] text-black'
                        : 'text-[#8A949F] hover:text-white'
                    }`}
                  >
                    {m === 'login' ? 'Connexion' : 'Créer un compte'}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <AnimatePresence mode="popLayout">
                {mode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <Champ
                      icon={User}
                      label="Votre nom"
                      type="text"
                      value={name}
                      onChange={setName}
                      placeholder="Prénom et nom"
                      required
                    />
                    <Champ
                      icon={Phone}
                      label="Téléphone (facultatif)"
                      type="tel"
                      value={phone}
                      onChange={setPhone}
                      placeholder="+243 …"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <Champ
                icon={Mail}
                label="Adresse e-mail"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="vous@exemple.com"
                required
              />

              {mode !== 'forgot' && (
                <Champ
                  icon={Lock}
                  label="Mot de passe"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Au moins 8 caractères"
                  required
                />
              )}

              {mode === 'forgot' && (
                <p className="text-[13px] text-[#8A949F] leading-relaxed">
                  Pour des raisons de sécurité, la même confirmation s'affiche
                  que le compte existe ou non.
                </p>
              )}

              {error && (
                <p className="flex items-start gap-2 text-[13.5px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </p>
              )}

              {notice && (
                <p className="flex items-start gap-2 text-[13.5px] text-[#A3FF12] bg-[#A3FF12]/10 border border-[#A3FF12]/20 rounded-xl px-3.5 py-3">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {notice}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="group w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-full bg-gradient-to-r from-[#A3FF12] to-[#7ACC00] text-black font-bold text-[15px] transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {t.bouton}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {mode === 'login' && (
              <button
                onClick={() => changeMode('forgot')}
                className="mt-5 w-full text-center text-[13px] text-[#8A949F] hover:text-[#A3FF12] transition-colors"
              >
                Mot de passe oublié ?
              </button>
            )}

            {mode === 'forgot' && (
              <button
                onClick={() => changeMode('login')}
                className="mt-5 w-full text-center text-[13px] text-[#8A949F] hover:text-[#A3FF12] transition-colors"
              >
                Revenir à la connexion
              </button>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.14}>
          <p className="mt-7 text-center text-[13px] text-[#6C7581] leading-relaxed">
            Pas besoin de compte pour commander.{' '}
            <button
              onClick={() => onNavigate('order')}
              className="text-[#A3FF12] hover:underline font-semibold"
            >
              Commander directement
            </button>
          </p>
        </Reveal>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Champ({
  icon: Icon,
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
}: {
  icon: typeof Mail;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[12px] font-semibold uppercase tracking-wider text-[#C2CAD3] mb-2">
        {label}
      </span>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6C7581]" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/40 border border-white/[0.09] text-white text-[15px] placeholder:text-[#5A636E] outline-none transition-colors focus:border-[#A3FF12]/50"
        />
      </div>
    </label>
  );
}
