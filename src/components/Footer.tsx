import { Music, MessageCircle, Mail, Phone, ShieldCheck } from 'lucide-react';
import InstallButton from './InstallButton.js';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const handleNav = (page: string) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="voxmory-footer" className="relative overflow-hidden bg-[#050506] border-t border-yellow-500/10 pt-16 pb-8 text-gray-400">
      
      {/* Decorative subtle background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[radial-gradient(circle,_rgba(147,51,234,0.12)_0%,_transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[radial-gradient(circle,_rgba(219,39,119,0.1)_0%,_transparent_70%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand block */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNav('home')}>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 p-[1px]">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  <Music className="w-5 h-5 text-yellow-400" />
                </div>
              </div>
              <div>
                <span className="font-sans font-bold tracking-widest text-2xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                  VOXMORY
                </span>
                <span className="block text-[8px] tracking-[0.25em] text-pink-400 font-medium uppercase text-right leading-none">
                  Studio
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              « Votre histoire. Votre chanson. »<br />
              VOXMORY transforme vos plus précieux moments de vie en chansons personnalisées de qualité studio professionnelle.
            </p>
            <div className="flex items-center gap-2 text-xs text-yellow-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-yellow-400" />
              <span>Garantie d'émotion &amp; Confidentialité</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-sans font-bold text-white text-sm tracking-widest uppercase mb-4 border-l-2 border-yellow-500 pl-3">
              Studio Navigation
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => handleNav('home')} className="hover:text-yellow-400 transition-all cursor-pointer">
                  Accueil
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('order')} className="hover:text-yellow-400 transition-all cursor-pointer">
                  Créer ma chanson
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('gallery')} className="hover:text-yellow-400 transition-all cursor-pointer">
                  Écouter les exemples
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('reviews')} className="hover:text-yellow-400 transition-all cursor-pointer">
                  Avis clients
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('pricing')} className="hover:text-yellow-400 transition-all cursor-pointer">
                  Nos Tarifs
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('tracking')} className="hover:text-yellow-400 transition-all cursor-pointer">
                  Suivre ma commande
                </button>
              </li>
            </ul>
          </div>

          {/* Contact details */}
          <div>
            <h3 className="font-sans font-bold text-white text-sm tracking-widest uppercase mb-4 border-l-2 border-yellow-500 pl-3">
              Service Client
            </h3>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div>
                  <span className="block text-xs text-gray-500">WhatsApp 24/7 :</span>
                  <a href="https://wa.me/243978508099" target="_blank" rel="noopener noreferrer" className="text-white hover:text-yellow-400 transition-all font-semibold whitespace-nowrap">
                    +243 978 508 099
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-pink-500 flex-shrink-0" />
                <div>
                  <span className="block text-xs text-gray-500">E-mail :</span>
                  <a href="mailto:usvanny10@gmail.com" className="text-white hover:text-yellow-400 transition-all font-medium">
                    usvanny10@gmail.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <div>
                  <span className="block text-xs text-gray-500">Contact direct :</span>
                  <span className="text-white font-medium whitespace-nowrap">+243 978 508 099</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Mobile money accounts */}
          <div className="bg-[#0b0a0f] p-5 rounded-2xl border border-yellow-500/10 space-y-4">
            <h3 className="font-sans font-bold text-yellow-400 text-xs tracking-widest uppercase">
              Paiements Mobiles
            </h3>
            <p className="text-xs leading-relaxed text-gray-400">
              Nous acceptons les paiements sécurisés Airtel Money &amp; Orange Money :
            </p>
            <div className="space-y-2 text-sm text-white font-mono">
              <div className="flex flex-col border-b border-white/5 pb-1.5 border-dashed">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Airtel Money :</span>
                  <span className="font-semibold text-yellow-400 whitespace-nowrap">+243 978 508 099</span>
                </div>
                <span className="text-[9px] text-gray-500 mt-0.5">Bénéficiaire : VANNY irung</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Orange Money :</span>
                  <span className="font-semibold text-yellow-400 whitespace-nowrap">+243 891 170 023</span>
                </div>
                <span className="text-[9px] text-gray-500 mt-0.5">Bénéficiaire : VANNY KAYEMB</span>
              </div>
            </div>
            <span className="block text-[10px] text-pink-400 leading-snug">
              * Envoyez la preuve de paiement sur WhatsApp pour validation immédiate.
            </span>
          </div>

        </div>

        {/* Separator & legal */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>
            &copy; 2026 VOXMORY. Tous droits réservés. Kinshasa, RDC.
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6">
            <InstallButton variant="footer" onNavigate={handleNav} />
            <span className="text-gray-500 hidden sm:inline">“Votre histoire. Votre chanson.”</span>
            <button onClick={() => handleNav('admin')} className="text-gray-500 hover:text-yellow-400 transition-all font-mono font-bold">
              [Espace Studio]
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
