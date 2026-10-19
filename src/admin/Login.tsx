import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { Music, Lock, Mail, AlertCircle } from 'lucide-react';
import { api } from '../lib/api.js';
import { Button, ErrorNote, Field, Input } from './ui.js';
import type { AdminSession } from '../types.js';

/**
 * Connexion au studio.
 *
 * Aucun secret ne figure ici : le mot de passe est transmis au serveur, qui
 * le compare à un hash bcrypt et renvoie une session signée dans un cookie
 * httpOnly. Le navigateur ne conserve aucune donnée d'authentification
 * exploitable — c'est le serveur qui décide, à chaque requête.
 */
export default function Login({ onSuccess }: { onSuccess: (admin: AdminSession) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { admin } = await api.login(email.trim(), password);
      onSuccess(admin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-[#A3FF12] to-[#7ACC00] p-[2px] mb-4">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
              <Music className="w-7 h-7 text-[#A3FF12]" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white">Studio VOXMORY</h1>
          <p className="text-sm text-[#8A949F] mt-1">Espace réservé à l'équipe</p>
        </div>

        <form
          onSubmit={submit}
          className="bg-[#0B0D10] border border-white/10 rounded-2xl p-6 space-y-5"
        >
          <Field label="Adresse e-mail">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6C7581]" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@voxmory.com"
                className="pl-9"
                required
                autoComplete="username"
              />
            </div>
          </Field>

          <Field label="Mot de passe">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6C7581]" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9"
                required
                autoComplete="current-password"
              />
            </div>
          </Field>

          <ErrorNote message={error} />

          <Button type="submit" variant="primary" disabled={loading} className="w-full py-2.5">
            {loading ? 'Vérification…' : 'Accéder au studio'}
          </Button>

          <p className="flex items-start gap-2 text-[11px] text-[#6C7581] leading-relaxed">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Les tentatives sont limitées : au-delà de 8 essais, l'accès est bloqué
            pendant 15 minutes.
          </p>
        </form>
      </motion.div>
    </div>
  );
}
