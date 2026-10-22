import { useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Loader2,
  MessageCircle,
  Search,
  Users2,
  Check,
} from 'lucide-react';
import { api } from '../lib/api.js';
import type { Analytics } from '../types.js';
import { whatsappUrl } from '../lib/contact.js';
import { Card, Empty, ErrorNote } from './ui.js';

/**
 * Clients et carnet WhatsApp.
 *
 * Deux listes, deux usages :
 *
 * - **Les comptes** servent au suivi. Savoir qui s'est inscrit, quand, et
 *   combien de commandes chacun a passées permet de reconnaître un client
 *   fidèle sans fouiller dans les commandes.
 * - **Les numéros WhatsApp** sont le bien le plus précieux du studio : ce
 *   sont des personnes qui ont *accepté* d'être recontactées. Ils ne
 *   viennent pas d'une liste achetée, ni d'une saisie manuelle qu'on
 *   oublierait de tenir à jour — ils sortent directement des commandes,
 *   donc ils ne peuvent pas être faux ni périmés.
 */

type Onglet = 'comptes' | 'whatsapp';

export default function Clients() {
  const [onglet, setOnglet] = useState<Onglet>('comptes');
  const [data, setData] = useState<Analytics | null>(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.admin
      .analytics(365)
      .then(setData)
      .catch((e) => setErreur(e instanceof Error ? e.message : 'Chargement impossible.'));
  }, []);

  if (erreur) return <ErrorNote message={erreur} />;
  if (!data) {
    return (
      <div className="flex items-center justify-center py-24 text-[#8A949F] gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Card title="Comptes créés" subtitle="Clients inscrits">
          <p className="text-3xl font-black text-white tabular-nums">
            {data.utilisateurs.total}
          </p>
          <p className="text-[11.5px] text-[#7E8894] mt-1">
            Une inscription n'est jamais obligatoire pour commander — elle
            sert à retrouver ses chansons.
          </p>
        </Card>

        <Card title="Numéros WhatsApp" subtitle="Accord de contact obtenu">
          <p className="text-3xl font-black text-[#A3FF12] tabular-nums">
            {data.whatsapp.total}
          </p>
          <p className="text-[11.5px] text-[#7E8894] mt-1">
            Personnes joignables, déduites des commandes passées.
          </p>
        </Card>
      </div>

      <div className="flex gap-2">
        {(
          [
            ['comptes', 'Comptes', Users2],
            ['whatsapp', 'Carnet WhatsApp', MessageCircle],
          ] as const
        ).map(([id, label, Icone]) => (
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
            {label}
          </button>
        ))}
      </div>

      {onglet === 'comptes' ? (
        <Comptes recents={data.utilisateurs.recents} total={data.utilisateurs.total} />
      ) : (
        <Carnet numeros={data.whatsapp.numeros} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Comptes({
  recents,
  total,
}: {
  recents: Analytics['utilisateurs']['recents'];
  total: number;
}) {
  const [recherche, setRecherche] = useState('');

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return recents;
    return recents.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.city ?? '').toLowerCase().includes(q),
    );
  }, [recents, recherche]);

  if (total === 0) {
    return (
      <Card title="Comptes clients">
        <Empty message="Aucun compte créé pour l'instant." />
      </Card>
    );
  }

  return (
    <Card
      title="Comptes clients"
      subtitle={`${recents.length} plus récent${recents.length > 1 ? 's' : ''} sur ${total}`}
    >
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7E8894]" />
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un nom, une adresse, une ville…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/[0.09] text-white text-[13px] placeholder:text-[#5A636E] outline-none focus:border-[#A3FF12]/50"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-[#7E8894] text-left border-b border-white/[0.06]">
              <th className="pb-2 font-semibold">Nom</th>
              <th className="pb-2 font-semibold">Adresse e-mail</th>
              <th className="pb-2 font-semibold">Ville</th>
              <th className="pb-2 font-semibold">Dernière connexion</th>
              <th className="pb-2 font-semibold">Inscrit</th>
            </tr>
          </thead>
          <tbody>
            {filtres.map((u) => (
              <tr key={u.id} className="border-b border-white/[0.04] last:border-0">
                <td className="py-2.5 text-[#E8ECEF]">{u.name}</td>
                <td className="py-2.5 text-[#8A949F]">{u.email}</td>
                <td className="py-2.5 text-[#8A949F]">{u.city || '—'}</td>
                <td className="py-2.5 text-[#8A949F]">
                  {u.lastLoginAt
                    ? new Date(u.lastLoginAt).toLocaleDateString('fr-FR')
                    : 'jamais'}
                </td>
                <td className="py-2.5 text-[#7E8894]">
                  {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function Carnet({ numeros }: { numeros: Analytics['whatsapp']['numeros'] }) {
  const [recherche, setRecherche] = useState('');
  const [copie, setCopie] = useState<string | null>(null);

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return numeros;
    return numeros.filter(
      (n) =>
        n.nom.toLowerCase().includes(q) ||
        n.telephone.includes(q) ||
        n.ville.toLowerCase().includes(q),
    );
  }, [numeros, recherche]);

  async function copier(texte: string, cle: string) {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(cle);
      setTimeout(() => setCopie(null), 1600);
    } catch {
      // Presse-papiers refusé : on sélectionne à la place, l'utilisateur
      // pourra copier lui-même.
      setCopie(null);
    }
  }

  if (numeros.length === 0) {
    return (
      <Card title="Carnet WhatsApp">
        <Empty message="Aucun client n'a encore accepté d'être contacté sur WhatsApp." />
      </Card>
    );
  }

  return (
    <Card
      title="Carnet WhatsApp"
      subtitle={`${numeros.length} numéro${numeros.length > 1 ? 's' : ''} — accord de contact obtenu`}
    >
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7E8894]" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un nom, un numéro, une ville…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/[0.09] text-white text-[13px] placeholder:text-[#5A636E] outline-none focus:border-[#A3FF12]/50"
          />
        </div>

        <button
          onClick={() => void copier(filtres.map((n) => n.telephone).join('\n'), '__tous')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-[#C2CAD3] text-[12.5px] font-bold hover:bg-white/[0.09] transition-colors"
        >
          {copie === '__tous' ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          Copier {filtres.length} numéro{filtres.length > 1 ? 's' : ''}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-[#7E8894] text-left border-b border-white/[0.06]">
              <th className="pb-2 font-semibold">Nom</th>
              <th className="pb-2 font-semibold">Téléphone</th>
              <th className="pb-2 font-semibold">Ville</th>
              <th className="pb-2 font-semibold text-center">Commandes</th>
              <th className="pb-2 font-semibold">Dernière</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {filtres.map((n) => (
              <tr
                key={n.telephone}
                className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
              >
                <td className="py-2.5 text-[#E8ECEF]">{n.nom}</td>
                <td className="py-2.5 font-mono text-[11.5px] text-[#C2CAD3]">
                  {n.telephone}
                </td>
                <td className="py-2.5 text-[#8A949F]">{n.ville || '—'}</td>
                <td className="py-2.5 text-center tabular-nums text-[#E8ECEF]">
                  {n.commandes}
                </td>
                <td className="py-2.5 text-[#8A949F]">
                  {n.dernier ? new Date(n.dernier).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      onClick={() => void copier(n.telephone, n.telephone)}
                      title="Copier le numéro"
                      className="p-1.5 rounded-lg text-[#8A949F] hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      {copie === n.telephone ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={whatsappUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ouvrir WhatsApp"
                      className="p-1.5 rounded-lg text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
