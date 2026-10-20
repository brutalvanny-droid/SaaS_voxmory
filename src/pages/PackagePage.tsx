import { motion } from 'motion/react';
import Reveal from '../components/Reveal.js';
import { Check, Clock, ArrowRight, Star, Music4, MessageCircle, ShieldCheck } from 'lucide-react';
import type { Package, ClientReview } from '../types.js';

/**
 * Page dédiée à une formule.
 *
 * Chaque formule a désormais sa propre adresse, son propre titre et son propre
 * texte. C'est ce qui permet d'apparaître sur une recherche précise —
 * « chanson personnalisée mariage », « clip vidéo souvenir » — là où une page
 * de tarifs générique ne ressort jamais.
 */

/** Questions fréquentes propres à chaque formule. */
const FAQ: Record<string, { q: string; a: string }[]> = {
  pack_simple: [
    {
      q: 'Combien de temps pour recevoir ma chanson ?',
      a: 'Cinq jours ouvrés après validation de votre histoire. Vous recevez un lien de suivi pour voir chaque étape avancer.',
    },
    {
      q: 'Puis-je demander des modifications ?',
      a: "Oui. Une série de retours est incluse : si un prénom est mal prononcé ou si un passage vous touche moins, nous le réenregistrons.",
    },
    {
      q: 'Dans quel style sera la chanson ?',
      a: "Rumba, Afrobeat, soul ou ballade : vous choisissez au moment de la commande, et nous vous conseillons selon votre histoire.",
    },
  ],
  pack_musique_video: [
    {
      q: 'Quelles photos dois-je fournir ?',
      a: "Une dizaine suffisent. Envoyez-les après la commande, nous les montons avec les paroles et la musique.",
    },
    {
      q: 'Le clip est-il utilisable sur les réseaux ?',
      a: "Oui, le fichier est livré en haute définition, au format adapté à WhatsApp, Instagram et TikTok.",
    },
    {
      q: 'La chanson est-elle écrite sur-mesure ?',
      a: "Entièrement. Aucune mélodie n'est réutilisée : texte, mélodie et arrangement sont créés pour votre histoire.",
    },
  ],
  pack_premium_vip: [
    {
      q: 'Qu’est-ce qui justifie la différence de prix ?',
      a: "Un arrangement complet (basse, guitares, cuivres, chœurs), un mixage studio professionnel, une livraison prioritaire sous trois jours et une page souvenir personnalisée.",
    },
    {
      q: 'Puis-je offrir cette formule à quelqu’un ?',
      a: "C'est même l'usage le plus fréquent. Nous pouvons garder la surprise et vous livrer la chanson à la date exacte de l'événement.",
    },
    {
      q: 'Ai-je un interlocuteur dédié ?',
      a: "Oui. Un conseiller suit votre commande de bout en bout, joignable sur WhatsApp jusqu'à la livraison.",
    },
  ],
  pack_presentiel: [
    {
      q: 'Intervenez-vous en dehors de Kinshasa ?',
      a: "Nous nous déplaçons principalement à Kinshasa et ses environs. Pour une autre ville, contactez-nous : nous étudions chaque demande.",
    },
    {
      q: 'Combien de temps dure la prestation ?',
      a: "Environ quarante-cinq minutes : la chanson écrite pour l'occasion, plus quelques titres pour accompagner le moment.",
    },
    {
      q: 'Faut-il du matériel ?',
      a: "Nous apportons la sonorisation complète. Il suffit d'un espace dégagé et d'une arrivée électrique.",
    },
  ],
};

const STEPS = [
  {
    icon: MessageCircle,
    title: 'Vous racontez',
    text: "Par texte, audio ou WhatsApp. Quelques phrases suffisent : prénoms, souvenirs, l'émotion à transmettre.",
  },
  {
    icon: Music4,
    title: 'Nous créons',
    text: "Un parolier écrit votre texte, puis un compositeur l'arrange et l'enregistre en studio.",
  },
  {
    icon: ShieldCheck,
    title: 'Vous recevez',
    text: "Un fichier haute définition et votre page souvenir, livrés directement sur WhatsApp.",
  },
];

export default function PackagePage({
  pkg,
  reviews,
  onNavigate,
}: {
  pkg: Package;
  reviews: ClientReview[];
  onNavigate: (page: string, params?: any) => void;
}) {
  const faq = FAQ[pkg.id] ?? [];

  // Données structurées « Produit » : Google peut afficher le prix
  // directement dans ses résultats.
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${pkg.name} — VOXMORY`,
    description: pkg.promise,
    brand: { '@type': 'Brand', name: 'VOXMORY' },
    offers: {
      '@type': 'Offer',
      price: (pkg.priceCents / 100).toString(),
      priceCurrency: pkg.currency || 'USD',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(productLd)}</script>

      {/* ── En-tête ─────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 px-5 sm:px-6 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[420px] bg-[#A3FF12]/[0.07] blur-[130px] rounded-full" />
        </div>

        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-block px-3.5 py-1.5 rounded-full border border-[#A3FF12]/25 bg-[#A3FF12]/[0.07] text-[#A3FF12] text-[11px] font-bold uppercase tracking-[0.16em]">
              {pkg.name}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-[clamp(2.1rem,5.6vw,3.75rem)] font-extrabold text-white tracking-[-0.04em] leading-[1.04]"
          >
            {pkg.name === 'Chanson Simple'
              ? 'Votre chanson personnalisée, écrite pour vous'
              : pkg.name === 'Musique + Vidéo'
                ? 'La chanson, et le clip qui la porte'
                : pkg.name === 'Premium VIP'
                  ? 'La production studio, sans compromis'
                  : 'Votre chanson, chantée devant vous'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 text-[16px] sm:text-[17px] text-[#C2CAD3] leading-relaxed max-w-2xl mx-auto"
          >
            {pkg.promise}
          </motion.p>

          {/* Prix et délai */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <div className="px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/10">
              <span className="block text-[10px] uppercase tracking-widest text-[#6C7581] font-bold">
                Prix
              </span>
              <span className="text-2xl font-black text-[#A3FF12]">{pkg.priceLabel}</span>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/10">
              <span className="block text-[10px] uppercase tracking-widest text-[#6C7581] font-bold">
                Livraison
              </span>
              <span className="text-2xl font-black text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#A3FF12]" />
                {pkg.deliveryTime}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9"
          >
            <button
              onClick={() => onNavigate('order', { packageId: pkg.id })}
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-[#A3FF12] to-[#7ACC00] text-black font-bold text-[15px] transition-all hover:scale-[1.03] shadow-lg shadow-[#A3FF12]/15"
            >
              Commander cette formule
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Ce qui est inclus ───────────────────────────────── */}
      <section className="py-16 sm:py-24 px-5 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <h2 className="text-[clamp(1.6rem,3.6vw,2.4rem)] font-extrabold text-white tracking-[-0.035em] text-center">
              Ce que vous recevez
            </h2>
          </Reveal>

          <ul className="mt-10 space-y-3">
            {pkg.includes.map((item, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <li className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
                  <Check className="w-5 h-5 text-[#A3FF12] flex-shrink-0 mt-0.5" />
                  <span className="text-[15.5px] text-[#D5DBE2] leading-relaxed">{item}</span>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Comment ça marche ───────────────────────────────── */}
      <section className="py-16 sm:py-24 px-5 sm:px-6 bg-white/[0.015]">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <h2 className="text-[clamp(1.6rem,3.6vw,2.4rem)] font-extrabold text-white tracking-[-0.035em] text-center">
              Comment ça se passe
            </h2>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map((s, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className="h-full p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
                  <div className="w-11 h-11 rounded-xl bg-[#A3FF12]/10 border border-[#A3FF12]/20 flex items-center justify-center mb-4">
                    <s.icon className="w-5 h-5 text-[#A3FF12]" />
                  </div>
                  <h3 className="text-[16px] font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-[14.5px] text-[#A2ABB5] leading-relaxed">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Témoignages ─────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="py-16 sm:py-24 px-5 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <Reveal>
              <h2 className="text-[clamp(1.6rem,3.6vw,2.4rem)] font-extrabold text-white tracking-[-0.035em] text-center">
                Ils ont offert une chanson
              </h2>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.slice(0, 4).map((r, i) => (
                <Reveal key={r.id} delay={i * 0.06}>
                  <figure className="h-full p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: r.rating }).map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 fill-[#A3FF12] text-[#A3FF12]" />
                      ))}
                    </div>
                    <blockquote className="text-[15px] text-[#D5DBE2] leading-relaxed">
                      « {r.comment} »
                    </blockquote>
                    <figcaption className="mt-4 text-[13px] text-[#8A949F] font-semibold">
                      {r.clientName}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Questions fréquentes ────────────────────────────── */}
      {faq.length > 0 && (
        <section className="py-16 sm:py-24 px-5 sm:px-6 bg-white/[0.015]">
          <div className="max-w-3xl mx-auto">
            <Reveal>
              <h2 className="text-[clamp(1.6rem,3.6vw,2.4rem)] font-extrabold text-white tracking-[-0.035em] text-center mb-10">
                Questions fréquentes
              </h2>
            </Reveal>

            <div className="space-y-3">
              {faq.map((f, i) => (
                <Reveal key={i} delay={i * 0.05}>
                  <details className="group p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] open:border-[#A3FF12]/20 transition-colors">
                    <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-[15.5px] font-bold text-white">
                      {f.q}
                      <span className="text-[#A3FF12] text-xl leading-none transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-3.5 text-[14.5px] text-[#A2ABB5] leading-relaxed">{f.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Appel final ─────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <Reveal>
            <h2 className="text-[clamp(1.7rem,4vw,2.6rem)] font-extrabold text-white tracking-[-0.04em] leading-tight">
              Prêt à offrir une chanson ?
            </h2>
            <p className="mt-4 text-[16px] text-[#A2ABB5]">
              Deux minutes suffisent pour commander. Nous nous occupons du reste.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => onNavigate('order', { packageId: pkg.id })}
                className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-[#A3FF12] to-[#7ACC00] text-black font-bold text-[15px] transition-all hover:scale-[1.03]"
              >
                Commander maintenant
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => onNavigate('pricing')}
                className="px-7 py-4 rounded-full border border-white/15 text-white font-bold text-[15px] hover:bg-white/5 transition-colors"
              >
                Voir toutes les formules
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
