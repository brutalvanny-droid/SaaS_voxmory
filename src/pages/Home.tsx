import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  MessageCircle,
  Sparkles,
  Headphones,
  ShieldCheck,
  Zap,
  Play,
  Star,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import AudioPlayer from '../components/AudioPlayer.js';
import Reveal from '../components/Reveal.js';
import MeshBackground from '../components/MeshBackground.js';
import HeroVideo from '../components/HeroVideo.js';
import type { ClientReview, GallerySong, Package } from '../types.js';
import { PACK_SLUGS } from '../seo/routes.js';

interface HomeProps {
  packages: Package[];
  featuredSongs: GallerySong[];
  featuredReviews: ClientReview[];
  onNavigate: (page: string, params?: unknown) => void;
}

/* ------------------------------------------------------------------ */
/*  Compteur animé                                                      */
/* ------------------------------------------------------------------ */

function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const duration = 1400;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      // Courbe de sortie : rapide au départ, douce à l'arrivée.
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduce]);

  return (
    <span className="tabular-nums">
      {display.toLocaleString('fr-FR')}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function Home({
  packages,
  featuredSongs,
  featuredReviews,
  onNavigate,
}: HomeProps) {
  const { t } = useLanguage();

  const steps = [
    {
      n: '01',
      title: t('s1_title', 'process'),
      desc: t('s1_desc', 'process'),
      icon: MessageCircle,
    },
    { n: '02', title: t('s2_title', 'process'), desc: t('s2_desc', 'process'), icon: Sparkles },
    { n: '03', title: t('s3_title', 'process'), desc: t('s3_desc', 'process'), icon: Headphones },
  ];

  return (
    <div className="relative">
      {/* ================= HÉROS ================= */}
      <section className="relative overflow-hidden">
        {/* La vidéo prend la place du fond animé : un vrai studio, plutôt
            qu'un dégradé abstrait. Elle se glisse sous le contenu. */}
        <HeroVideo />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-24 sm:pb-32">
          <div className="max-w-4xl">
            {/* Pastille */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] backdrop-blur-sm mb-8"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#A3FF12] pulse-ring" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#A3FF12]" />
              </span>
              <span className="text-[11.5px] font-medium tracking-wide text-[#A2ABB5]">
                {t('tagline', 'hero')}
              </span>
            </motion.div>

            {/* Titre */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="text-[clamp(2.4rem,7.2vw,5.2rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-white"
            >
              {t('title_part1', 'hero')}{' '}
              <span className="text-gradient">{t('title_grad', 'hero')}</span>
              <br className="hidden sm:block" /> {t('title_part2', 'hero')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="mt-7 text-[16.5px] sm:text-lg leading-relaxed text-[#A2ABB5] max-w-2xl"
            >
              {t('desc', 'hero')}
            </motion.p>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <button
                onClick={() => onNavigate('order')}
                className="group relative inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-b from-[#C8FF4D] to-[#96F00A] text-[#06080A] font-bold text-[15px] transition-all duration-300 hover:shadow-[0_18px_44px_-14px_rgba(163,255,18,0.65)] cursor-pointer overflow-hidden"
              >
                <span className="relative z-10">{t('btn_order', 'hero')}</span>
                <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                {/* Reflet qui balaie le bouton au survol */}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>

              <button
                onClick={() => onNavigate('gallery')}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.07] text-white font-semibold text-[15px] transition-all duration-300 cursor-pointer"
              >
                <Play className="w-4 h-4 text-[#A3FF12]" />
                {t('btn_examples', 'hero')}
              </button>
            </motion.div>

            {/* Réassurance */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.36 }}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2.5"
            >
              {[t('badge_speed', 'hero'), t('badge_human', 'hero'), t('badge_momo', 'hero')].map(
                (badge, i) => (
                  <span key={i} className="flex items-center gap-2 text-[12.5px] text-[#8A949F]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#A3FF12]/70 shrink-0" />
                    {badge}
                  </span>
                ),
              )}
            </motion.div>
          </div>

          {/* Compteurs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.44, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 grid grid-cols-3 gap-3 max-w-2xl"
          >
            {[
              { label: 'Formules', value: packages.length, suffix: '' },
              { label: 'Langues chantées', value: 5, suffix: '' },
              { label: 'Livraison express', value: 24, suffix: ' h' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-sm px-4 py-4"
              >
                <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#6C7581] mt-1 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================= PROCESSUS ================= */}
      <section className="relative py-24 sm:py-32 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <Reveal>
            <p className="eyebrow mb-3">{t('sub', 'process')}</p>
            <h2 className="text-[clamp(1.9rem,4.4vw,3rem)] font-extrabold tracking-[-0.035em] text-white">
              {t('title', 'process')}
            </h2>
            <p className="mt-4 text-[#A2ABB5] max-w-2xl leading-relaxed">{t('desc', 'process')}</p>
          </Reveal>

          <div className="mt-14 grid md:grid-cols-3 gap-4">
            {steps.map((step, i) => (
              <Reveal key={step.n} delay={i * 110}>
                <div className="group relative h-full rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.035] to-transparent p-7 hover:border-[#A3FF12]/25 transition-colors duration-500 overflow-hidden">
                  {/* Halo d'angle au survol */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-[#A3FF12]/[0.07] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-11 h-11 rounded-xl bg-[#A3FF12]/[0.1] border border-[#A3FF12]/20 flex items-center justify-center">
                        <step.icon className="w-5 h-5 text-[#A3FF12]" />
                      </div>
                      <span className="text-[11px] font-mono font-semibold text-[#3A424C]">
                        {step.n}
                      </span>
                    </div>
                    <h3 className="text-[15px] font-bold text-white mb-2.5">{step.title}</h3>
                    <p className="text-[13.5px] leading-relaxed text-[#8A949F]">{step.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FORMULES ================= */}
      {packages.length > 0 && (
        <section className="relative py-24 sm:py-32 border-t border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <Reveal>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="eyebrow mb-3">Tarifs transparents</p>
                  <h2 className="text-[clamp(1.9rem,4.4vw,3rem)] font-extrabold tracking-[-0.035em] text-white">
                    Une formule pour chaque histoire
                  </h2>
                </div>
                <button
                  onClick={() => onNavigate('pricing')}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#A3FF12] hover:gap-2.5 transition-all"
                >
                  Voir le détail <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Reveal>

            <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {packages.slice(0, 4).map((pkg, i) => {
                const featured = i === 2;
                return (
                  <Reveal key={pkg.id} delay={i * 90}>
                    <button
                      onClick={() => onNavigate('order')}
                      className={`lift relative w-full h-full text-left rounded-2xl p-6 flex flex-col overflow-hidden cursor-pointer ${
                        featured
                          ? 'border border-[#A3FF12]/35 bg-gradient-to-b from-[#A3FF12]/[0.08] to-transparent'
                          : 'border border-white/[0.07] bg-gradient-to-b from-white/[0.03] to-transparent'
                      }`}
                    >
                      {featured && (
                        <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-[#A3FF12] text-[#06080A] text-[9px] font-black uppercase tracking-wider">
                          Populaire
                        </span>
                      )}
                      <h3 className="text-[15px] font-bold text-white">
                        <button
                          onClick={() => onNavigate('pack', { slug: PACK_SLUGS[pkg.id] })}
                          className="hover:text-[#A3FF12] transition-colors cursor-pointer text-left"
                          aria-label={`Découvrir la formule ${pkg.name}`}
                        >
                          {pkg.name}
                        </button>
                      </h3>
                      <p className="mt-1 text-[12px] text-[#6C7581] leading-snug min-h-[32px]">
                        {pkg.promise}
                      </p>
                      <div className="mt-5 mb-5">
                        <span className="text-[28px] font-extrabold text-white tracking-tight">
                          {pkg.priceLabel}
                        </span>
                      </div>
                      <ul className="space-y-2 mb-6 flex-1">
                        {pkg.includes.slice(0, 4).map((inc) => (
                          <li key={inc} className="flex gap-2 text-[12px] text-[#8A949F]">
                            <span className="text-[#A3FF12] shrink-0">✓</span>
                            {inc}
                          </li>
                        ))}
                      </ul>
                      <span
                        className={`inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12.5px] font-bold transition-all ${
                          featured
                            ? 'bg-[#A3FF12] text-[#06080A]'
                            : 'bg-white/[0.06] text-white group-hover:bg-white/[0.1]'
                        }`}
                      >
                        Choisir
                      </span>
                    </button>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ================= ÉCOUTER ================= */}
      {featuredSongs.length > 0 && (
        <section className="relative py-24 sm:py-32 border-t border-white/[0.06] overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.55]"
            style={{
              background:
                'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(11,61,30,0.4) 0%, transparent 70%)',
            }}
          />
          <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <Reveal>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="eyebrow mb-3">Galerie</p>
                  <h2 className="text-[clamp(1.9rem,4.4vw,3rem)] font-extrabold tracking-[-0.035em] text-white">
                    Écoutez ce que nous avons créé
                  </h2>
                </div>
                <button
                  onClick={() => onNavigate('gallery')}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#A3FF12] hover:gap-2.5 transition-all"
                >
                  Toute la galerie <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Reveal>

            <div className="mt-14 grid lg:grid-cols-3 gap-4">
              {featuredSongs.slice(0, 3).map((song, i) => (
                <Reveal key={song.id} delay={i * 100}>
                  <div className="lift rounded-2xl border border-white/[0.07] bg-[#0E1114] overflow-hidden">
                    <div className="h-32 relative overflow-hidden">
                      {song.coverUrl ? (
                        <img
                          src={song.coverUrl}
                          alt={song.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#0B3D1E] via-[#0E1114] to-[#07080A] flex items-center justify-center">
                          <Headphones className="w-8 h-8 text-[#A3FF12]/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0E1114] via-transparent to-transparent" />
                    </div>
                    <div className="p-5">
                      <h3 className="text-[14.5px] font-bold text-white truncate">{song.title}</h3>
                      <p className="text-[11.5px] text-[#6C7581] mt-0.5">
                        {song.style} · {song.occasion}
                      </p>
                      <div className="mt-4">
                        <AudioPlayer
                          audioUrl={song.audioUrl}
                          title={song.title}
                          subtitle={`${song.style} · ${song.occasion}`}
                          coverUrl={song.coverUrl}
                          startTime={song.startTime}
                          endTime={song.endTime ?? undefined}
                        />
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= AVIS ================= */}
      {featuredReviews.length > 0 && (
        <section className="relative py-24 sm:py-32 border-t border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <Reveal>
              <div className="text-center max-w-2xl mx-auto">
                <p className="eyebrow mb-3">Témoignages</p>
                <h2 className="text-[clamp(1.9rem,4.4vw,3rem)] font-extrabold tracking-[-0.035em] text-white">
                  {t('title', 'testimonials')}
                </h2>
              </div>
            </Reveal>

            <div className="mt-14 grid md:grid-cols-3 gap-4">
              {featuredReviews.slice(0, 3).map((review, i) => (
                <Reveal key={review.id} delay={i * 100}>
                  <figure className="lift h-full rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.035] to-transparent p-6 flex flex-col">
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: review.rating }).map((_, s) => (
                        <Star key={s} className="w-3.5 h-3.5 text-[#A3FF12] fill-[#A3FF12]" />
                      ))}
                    </div>
                    <blockquote className="text-[14px] leading-relaxed text-[#C3CAD2] flex-1">
                      « {review.comment} »
                    </blockquote>
                    <figcaption className="mt-6 pt-4 border-t border-white/[0.07]">
                      <p className="text-[13px] font-bold text-white">{review.clientName}</p>
                      <p className="text-[11.5px] text-[#6C7581]">{review.occasion}</p>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= TRANQUILLITÉ ================= */}
      <section className="relative py-24 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 text-center">
          <Reveal>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#A3FF12]/[0.1] border border-[#A3FF12]/20 mb-6">
              <ShieldCheck className="w-5 h-5 text-[#A3FF12]" />
            </div>
            <h2 className="text-[clamp(1.6rem,3.6vw,2.4rem)] font-extrabold tracking-[-0.035em] text-white">
              {t('title', 'tranquility')}
            </h2>
            <p className="mt-4 text-[#A2ABB5] leading-relaxed">{t('desc', 'tranquility')}</p>
            <p className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#A3FF12]/25 bg-[#A3FF12]/[0.06] text-[12.5px] font-semibold text-[#A3FF12]">
              <Zap className="w-3.5 h-3.5" />
              {t('guarantee', 'tranquility')}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ================= APPEL À L'ACTION ================= */}
      <section className="relative py-28 sm:py-36 overflow-hidden">
        <MeshBackground intensity={0.7} />
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-6 text-center">
          <Reveal>
            <h2 className="text-[clamp(2rem,5.4vw,3.6rem)] font-extrabold tracking-[-0.04em] text-white leading-[1.02]">
              Son histoire mérite
              <br />
              <span className="text-gradient">une chanson</span>
            </h2>
            <p className="mt-6 text-[15.5px] text-[#A2ABB5] leading-relaxed max-w-xl mx-auto">
              {t('microcopy', 'hero')}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => onNavigate('order')}
                className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-b from-[#C8FF4D] to-[#96F00A] text-[#06080A] font-bold text-[15px] transition-all duration-300 hover:shadow-[0_18px_44px_-14px_rgba(163,255,18,0.65)] cursor-pointer"
              >
                {t('btn_order', 'hero')}
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <a
                href="https://wa.me/243978508099"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.07] text-white font-semibold text-[15px] transition-all duration-300"
              >
                <MessageCircle className="w-4 h-4 text-[#A3FF12]" />
                {t('whatsapp_cta', 'nav')}
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
