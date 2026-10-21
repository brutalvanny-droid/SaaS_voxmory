import { MessageCircle, Mail, Phone, ShieldCheck, ArrowUpRight } from 'lucide-react';
import InstallButton from './InstallButton.js';
import { LogoMark } from './Logo.js';
import Reveal from './Reveal.js';

interface FooterProps {
  onNavigate: (page: string) => void;
}

const NAV_LINKS: { label: string; page: string }[] = [
  { label: 'Accueil', page: 'home' },
  { label: 'Créer ma chanson', page: 'order' },
  { label: 'Écouter les exemples', page: 'gallery' },
  { label: 'Avis clients', page: 'reviews' },
  { label: 'Nos tarifs', page: 'pricing' },
  { label: 'Suivre ma commande', page: 'tracking' },
];

export default function Footer({ onNavigate }: FooterProps) {
  const handleNav = (page: string) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative overflow-hidden bg-[#07080A] text-[#A2ABB5]">
      {/* Liseré lumineux en haut du pied de page */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#A3FF12]/40 to-transparent" />
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[42rem] h-80 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 60% at 50% 100%, rgba(163,255,18,0.09) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_0.85fr_0.9fr_1.15fr]">
          {/* ---------- Marque ---------- */}
          <Reveal>
            <div className="space-y-5 max-w-sm">
              <button
                onClick={() => handleNav('home')}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <span className="relative grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-b from-[#C8FF4D] to-[#96F00A] shrink-0">
                  <LogoMark size={22} className="text-[#06080A]" />
                </span>
                <span className="text-left">
                  <span className="block text-[19px] font-extrabold tracking-[0.16em] text-white leading-none">
                    VOXMORY
                  </span>
                  <span className="block text-[9px] tracking-[0.3em] text-[#A3FF12] font-semibold uppercase leading-none mt-1">
                    Studio
                  </span>
                </span>
              </button>

              <p className="text-[13.5px] leading-relaxed text-[#8A949F]">
                « Votre histoire. Votre chanson. » Nous transformons vos plus précieux moments de vie
                en chansons personnalisées, qualité studio.
              </p>

              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#A3FF12]/20 bg-[#A3FF12]/[0.05] text-[11.5px] font-medium text-[#A3FF12]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Garantie d'émotion &amp; confidentialité
              </span>
            </div>
          </Reveal>

          {/* ---------- Navigation ---------- */}
          <Reveal delay={80}>
            <h3 className="text-[10.5px] font-bold tracking-[0.18em] uppercase text-[#6C7581] mb-5">
              Navigation
            </h3>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.page}>
                  <button
                    onClick={() => handleNav(link.page)}
                    className="group inline-flex items-center gap-1 text-[13.5px] text-[#A2ABB5] hover:text-white transition-colors duration-300 cursor-pointer"
                  >
                    <span className="w-0 overflow-hidden opacity-0 group-hover:w-3 group-hover:opacity-100 transition-all duration-300 text-[#A3FF12]">
                      →
                    </span>
                    <span className="-ml-0 group-hover:ml-0 transition-all">{link.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* ---------- Service client ---------- */}
          <Reveal delay={140}>
            <h3 className="text-[10.5px] font-bold tracking-[0.18em] uppercase text-[#6C7581] mb-5">
              Service client
            </h3>
            <ul className="space-y-5">
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#25D366]/10 border border-[#25D366]/20 shrink-0">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                </span>
                <div className="min-w-0">
                  <span className="block text-[10.5px] uppercase tracking-wider text-[#6C7581]">
                    WhatsApp 24/7
                  </span>
                  <a
                    href="https://wa.me/243978508099"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13.5px] text-white hover:text-[#A3FF12] transition-colors font-semibold whitespace-nowrap inline-flex items-center gap-1"
                  >
                    +243 978 508 099
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 group-hover:opacity-100" />
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#A3FF12]/[0.08] border border-[#A3FF12]/15 shrink-0">
                  <Mail className="w-4 h-4 text-[#A3FF12]" />
                </span>
                <div className="min-w-0">
                  <span className="block text-[10.5px] uppercase tracking-wider text-[#6C7581]">
                    E-mail
                  </span>
                  <a
                    href="mailto:usvanny10@gmail.com"
                    className="text-[13.5px] text-white hover:text-[#A3FF12] transition-colors font-medium break-all"
                  >
                    usvanny10@gmail.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] shrink-0">
                  <Phone className="w-4 h-4 text-[#A2ABB5]" />
                </span>
                <div className="min-w-0">
                  <span className="block text-[10.5px] uppercase tracking-wider text-[#6C7581]">
                    Contact direct
                  </span>
                  <span className="text-[13.5px] text-white font-medium whitespace-nowrap">
                    +243 978 508 099
                  </span>
                </div>
              </li>
            </ul>
          </Reveal>

          {/* ---------- Paiements ---------- */}
          <Reveal delay={200}>
            <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.035] to-transparent p-5">
              <h3 className="text-[10.5px] font-bold tracking-[0.18em] uppercase text-[#A3FF12] mb-3">
                Paiements mobiles
              </h3>
              <p className="text-[12px] leading-relaxed text-[#8A949F]">
                Nous acceptons Airtel Money &amp; Orange Money :
              </p>

              <div className="mt-4 space-y-3">
                {[
                  { label: 'Airtel Money', number: '+243 978 508 099', name: 'VANNY irung' },
                  { label: 'Orange Money', number: '+243 891 170 023', name: 'VANNY KAYEMB' },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.06] border-dashed last:border-0 last:pb-0"
                  >
                    <div>
                      <span className="block text-[10.5px] uppercase tracking-wider text-[#6C7581]">
                        {m.label}
                      </span>
                      <span className="block text-[9.5px] text-[#6C7581]">{m.name}</span>
                    </div>
                    <span className="font-mono text-[12.5px] font-semibold text-[#A3FF12] whitespace-nowrap">
                      {m.number}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-[10.5px] leading-snug text-[#6C7581]">
                * Envoyez la preuve de paiement sur WhatsApp pour validation immédiate.
              </p>
            </div>
          </Reveal>
        </div>

        {/* ---------- Barre légale ---------- */}
        <div className="mt-14 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-[#6C7581]">
            © 2026 VOXMORY. Tous droits réservés. Kinshasa, RDC.
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6">
            <InstallButton variant="footer" onNavigate={handleNav} />
            <span className="text-[11.5px] text-[#6C7581] hidden sm:inline">
              « Votre histoire. Votre chanson. »
            </span>
            <button
              onClick={() => handleNav('admin')}
              className="text-[11.5px] text-[#6C7581] hover:text-[#A3FF12] transition-colors font-mono font-bold"
            >
              [Espace Studio]
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
