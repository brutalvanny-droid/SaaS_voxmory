import { useEffect, useState } from 'react';
import { Menu, X, Globe, ChevronDown, ArrowRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext.js';
import { useScrollLock } from '../hooks/useScrollLock.js';
import InstallButton from './InstallButton.js';
import { LogoMark } from './Logo.js';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, params?: unknown) => void;
  /** `null` pendant la vérification : on n'affiche encore rien. */
  clientConnecte?: boolean | null;
}

export default function Navbar({ currentPage, onNavigate, clientConnecte }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  // Le fond devient opaque dès que l'on quitte le haut de page : la barre
  // reste lisible par-dessus n'importe quelle section.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    setShowLangDropdown(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Menu ouvert, page gelée.
   *
   * Sans cela, faire défiler derrière le menu déplace la page entière et,
   * à la fermeture, on atterrit ailleurs que là où l'on était.
   */
  useScrollLock(isOpen);

  const langLabel = language === 'fr' ? 'FR' : language === 'sw' ? 'SW' : 'EN';

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#07080A]/85 backdrop-blur-xl border-b border-white/[0.07]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <button
            onClick={() => handleNav('home')}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <span className="relative grid place-items-center w-9 h-9 shrink-0 rounded-[11px] bg-gradient-to-br from-[#C8FF4D] to-[#7ACC00] opacity-95 transition-opacity duration-300 group-hover:opacity-100">
              <span className="grid place-items-center w-[34px] h-[34px] rounded-[9.5px] bg-[#07080A]">
                <LogoMark size={21} />
              </span>
            </span>
            <div className="text-left">
              <span className="block text-[19px] font-extrabold tracking-[-0.02em] text-white leading-none">
                VOXMORY
              </span>
              <span className="block text-[8px] tracking-[0.3em] text-[#6C7581] font-medium uppercase leading-none mt-1">
                Studio
              </span>
            </div>
          </button>

          {/* Navigation — ordinateur */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className="relative px-3.5 py-2 text-[13.5px] font-medium transition-colors duration-200 cursor-pointer"
                >
                  <span className={active ? 'text-white' : 'text-[#8A949F] hover:text-white'}>
                    {item.label}
                  </span>
                  {active && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute inset-x-2.5 -bottom-0.5 h-[2px] rounded-full bg-[#A3FF12]"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Actions — ordinateur */}
          <div className="hidden lg:flex items-center gap-2.5">
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/[0.09] bg-white/[0.03] hover:bg-white/[0.07] text-[#A2ABB5] hover:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{langLabel}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              <AnimatePresence>
                {showLangDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 mt-2 w-40 rounded-xl bg-[#0E1114] border border-white/[0.09] shadow-2xl py-1.5 z-50 overflow-hidden"
                  >
                    {(
                      [
                        ['fr', '🇫🇷', 'Français'],
                        ['sw', '🇨🇩', 'Kiswahili'],
                        ['en', '🇬🇧', 'English'],
                      ] as const
                    ).map(([code, flag, label]) => (
                      <button
                        key={code}
                        onClick={() => {
                          setLanguage(code);
                          setShowLangDropdown(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center gap-2.5 transition-colors ${
                          language === code
                            ? 'text-[#A3FF12] bg-[#A3FF12]/[0.07]'
                            : 'text-[#A2ABB5] hover:bg-white/[0.05] hover:text-white'
                        }`}
                      >
                        <span>{flag}</span>
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <InstallButton variant="navbar" onNavigate={handleNav} />

            {/* Accès au compte : discret pour ne pas voler la vedette à
                l'appel principal, mais toujours visible. */}
            {clientConnecte !== null && (
              <button
                onClick={() => handleNav(clientConnecte ? 'myaccount' : 'account')}
                aria-label={clientConnecte ? 'Mon espace' : 'Me connecter'}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-full border border-white/[0.09] bg-white/[0.03] text-[#A2ABB5] hover:text-white hover:bg-white/[0.07] text-xs font-bold transition-all cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">
                  {clientConnecte ? 'Mon espace' : 'Connexion'}
                </span>
              </button>
            )}

            <button
              onClick={() => handleNav('order')}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-b from-[#C8FF4D] to-[#96F00A] text-[#06080A] text-xs font-bold uppercase tracking-wide transition-all duration-300 hover:shadow-[0_10px_28px_-10px_rgba(163,255,18,0.6)] cursor-pointer"
            >
              <span>{t('order', 'nav')}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Actions — mobile */}
          <div className="lg:hidden flex items-center gap-2">
            <InstallButton variant="pill" onNavigate={handleNav} />
            <button
              onClick={() => setShowLangDropdown((v) => !v)}
              className="flex items-center gap-1 px-2.5 py-2 rounded-full border border-white/[0.09] bg-white/[0.03] text-[#A2ABB5] text-xs font-semibold cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              {langLabel}
            </button>
            <button
              onClick={() => setIsOpen((v) => !v)}
              className="p-2 rounded-lg text-[#A2ABB5] hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden overflow-hidden bg-[#0A0C0F]/98 backdrop-blur-xl border-t border-white/[0.07]"
          >
            <div className="px-5 py-5 space-y-1">
              {navItems.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.035, duration: 0.25 }}
                  onClick={() => handleNav(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    currentPage === item.id
                      ? 'text-[#A3FF12] bg-[#A3FF12]/[0.08]'
                      : 'text-[#A2ABB5] hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  {item.label}
                </motion.button>
              ))}

              <div className="pt-3 pb-1">
                <p className="px-4 text-[10px] uppercase tracking-[0.18em] text-[#6C7581] mb-2 font-semibold">
                  Langue
                </p>
                <div className="flex gap-2 px-4">
                  {(
                    [
                      ['fr', '🇫🇷 FR'],
                      ['sw', '🇨🇩 SW'],
                      ['en', '🇬🇧 EN'],
                    ] as const
                  ).map(([code, label]) => (
                    <button
                      key={code}
                      onClick={() => setLanguage(code)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                        language === code
                          ? 'border-[#A3FF12]/50 bg-[#A3FF12]/[0.1] text-[#A3FF12]'
                          : 'border-white/[0.08] bg-white/[0.03] text-[#A2ABB5]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={() => handleNav('order')}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-b from-[#C8FF4D] to-[#96F00A] text-[#06080A] text-sm font-bold uppercase tracking-wide"
                >
                  {t('order', 'nav')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
