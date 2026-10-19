import { useState } from 'react';
import { Menu, X, MessageCircle, Music, Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import InstallButton from './InstallButton.js';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, params?: any) => void;
}

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { id: 'home', label: t('home', 'nav') },
    { id: 'order', label: t('order', 'nav') },
    { id: 'gallery', label: t('gallery', 'nav') },
    { id: 'reviews', label: t('reviews', 'nav') },
    { id: 'pricing', label: t('pricing', 'nav') },
    { id: 'tracking', label: t('tracking', 'nav') },
  ];

  const handleNav = (page: string) => {
    onNavigate(page);
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav id="voxmory-navbar" className="sticky top-0 z-50 bg-[#070708] border-b border-yellow-500/10 shadow-lg shadow-purple-950/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNav('home')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 p-[1px] animate-pulse">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <Music className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-full blur-sm opacity-50 -z-10" />
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

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`font-sans text-sm font-medium tracking-wide transition-all duration-300 py-2 border-b-2 cursor-pointer ${
                  currentPage === item.id
                    ? 'text-yellow-400 border-yellow-400'
                    : 'text-gray-300 border-transparent hover:text-white hover:border-pink-500/40'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Header actions (Language + WhatsApp) */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Language Selector Desktop */}
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/10 hover:border-yellow-400/30 bg-white/5 hover:bg-white/10 text-white font-sans font-semibold text-xs transition-all cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-yellow-400" />
                <span>{language === 'fr' ? 'FR' : language === 'sw' ? 'SW' : 'EN'}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              
              {showLangDropdown && (
                <div className="absolute right-0 mt-2 w-36 rounded-xl bg-black border border-white/10 shadow-xl py-1 z-50">
                  <button
                    onClick={() => { setLanguage('fr'); setShowLangDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-sans font-semibold hover:bg-white/5 flex items-center gap-2 ${language === 'fr' ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <span>🇫🇷</span>
                    <span>Français</span>
                  </button>
                  <button
                    onClick={() => { setLanguage('sw'); setShowLangDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-sans font-semibold hover:bg-white/5 flex items-center gap-2 ${language === 'sw' ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <span>🇨🇩</span>
                    <span>Kiswahili</span>
                  </button>
                  <button
                    onClick={() => { setLanguage('en'); setShowLangDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-sans font-semibold hover:bg-white/5 flex items-center gap-2 ${language === 'en' ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <span>🇬🇧</span>
                    <span>English</span>
                  </button>
                </div>
              )}
            </div>

            {/* PWA Install Button (Discrete, visible only when installable) */}
            <InstallButton variant="navbar" onNavigate={handleNav} />

            {/* WhatsApp Primary CTA */}
            <a
              href="https://wa.me/243978508099"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white px-5 py-2.5 rounded-full font-sans font-semibold text-xs tracking-wider uppercase transition-all duration-300 shadow-md shadow-green-950/40 hover:scale-[1.02] border border-green-400/30"
            >
              <MessageCircle className="w-4 h-4 fill-white animate-pulse" />
              <span className="whitespace-nowrap">{t('whatsapp_cta', 'nav')}</span>
            </a>
          </div>

          {/* Mobile elements (Language + Menu Button) */}
          <div className="lg:hidden flex items-center gap-3">
            {/* Quick Install Mobile Header */}
            <InstallButton variant="pill" onNavigate={handleNav} />

            {/* Quick Lang Selection */}
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-white font-sans font-semibold text-xs cursor-pointer"
              >
                <Globe className="w-3 h-3 text-yellow-400" />
                <span>{language.toUpperCase()}</span>
              </button>
              {showLangDropdown && (
                <div className="absolute right-0 mt-2 w-32 rounded-xl bg-[#09090c] border border-white/10 shadow-2xl py-1 z-50">
                  <button
                    onClick={() => { setLanguage('fr'); setShowLangDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-[11px] font-semibold text-gray-300 hover:text-yellow-400 flex items-center gap-1.5"
                  >
                    <span>🇫🇷</span> FR
                  </button>
                  <button
                    onClick={() => { setLanguage('sw'); setShowLangDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-[11px] font-semibold text-gray-300 hover:text-yellow-400 flex items-center gap-1.5"
                  >
                    <span>🇨🇩</span> SW
                  </button>
                  <button
                    onClick={() => { setLanguage('en'); setShowLangDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-[11px] font-semibold text-gray-300 hover:text-yellow-400 flex items-center gap-1.5"
                  >
                    <span>🇬🇧</span> EN
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white p-2 rounded-md hover:bg-white/5 transition-all focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6 text-yellow-400" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-[#0a0a0c] border-b border-yellow-500/10 px-4 pt-2 pb-6 space-y-2 animate-fade-in">
          {/* Mobile Language Pills */}
          <div className="pt-2 pb-3 border-b border-white/5 flex items-center justify-between px-3">
            <span className="text-[11px] text-gray-400 font-sans font-medium">Langue / Lugha :</span>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage('fr')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-sans font-bold border transition-all ${language === 'fr' ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-white/5 bg-white/5 text-gray-300'}`}
              >
                🇫🇷 FR
              </button>
              <button
                onClick={() => setLanguage('sw')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-sans font-bold border transition-all ${language === 'sw' ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-white/5 bg-white/5 text-gray-300'}`}
              >
                🇨🇩 SW
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-sans font-bold border transition-all ${language === 'en' ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-white/5 bg-white/5 text-gray-300'}`}
              >
                🇬🇧 EN
              </button>
            </div>
          </div>

          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`block w-full text-left px-4 py-3 rounded-xl font-sans font-medium text-base transition-all ${
                currentPage === item.id
                  ? 'bg-purple-950/40 text-yellow-400 border-l-4 border-yellow-400 pl-3'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="px-4 pt-2">
            <InstallButton variant="mobile-menu" onNavigate={handleNav} />
          </div>

          <div className="pt-4 border-t border-white/5 flex flex-col gap-3 px-4">
            <a
              href="https://wa.me/243978508099"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3 rounded-xl font-sans font-semibold text-sm tracking-wide uppercase transition-all shadow-md shadow-green-900/30"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>WhatsApp : <span className="whitespace-nowrap">+243 978 508 099</span></span>
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
