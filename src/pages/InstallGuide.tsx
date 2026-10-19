import { useState, useEffect } from 'react';
import { Smartphone, Download, Share, HelpCircle, ChevronRight, Check, ArrowDown, Sparkles, Music } from 'lucide-react';

interface InstallGuideProps {
  onNavigate: (page: string) => void;
}

export default function InstallGuide({ onNavigate }: InstallGuideProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforePrompt);

    // If app is already running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallSuccess(true);
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <div id="pwa-install-guide" className="relative min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black via-[#07070a] to-[#040405] overflow-hidden">
      {/* Decorative premium background light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-gradient-to-tr from-[#0B0D10]/10 to-[#0B0D10]/10 blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[200px] h-[200px] rounded-full bg-[#A3FF12]/5 blur-3xl pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header Block */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full border border-[#A3FF12]/20 bg-[#A3FF12]/5 text-[#A3FF12] font-mono text-[10px] uppercase tracking-widest font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>VOXMORY Studio Mobile</span>
          </div>
          <h1 className="text-[clamp(2.1rem,5.6vw,3.75rem)] font-extrabold tracking-[-0.04em] leading-[1.02] text-white">
            Installez <span className="text-gradient">VOXMORY</span>
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#A2ABB5] leading-relaxed">
            Profitez de l'expérience VOXMORY directement sur votre smartphone. Suivez vos commandes en direct, écoutez vos chansons rumbas personnalisées hors-ligne et recevez des notifications push instantanées.
          </p>
        </div>

        {/* Dynamic Auto-Installer Banner if browser supports standard prompt */}
        {isInstallable && (
          <div className="p-6 sm:p-8 bg-gradient-to-r from-[#0B0D10]/40 via-[#0B0D10]/20 to-black rounded-3xl border border-[#A3FF12]/20 space-y-5 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#A3FF12]/10 rounded-full blur-2xl group-hover:scale-125 transition-all duration-700 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3FF12] font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#A3FF12] animate-ping" />
                  Installation instantanée disponible
                </span>
                <h3 className="font-sans font-black text-xl text-white">Prêt à être installé sur votre appareil</h3>
                <p className="text-xs text-[#C3CAD2] max-w-xl">
                  Votre navigateur prend en charge l'installation directe en un clic. Lancez l'installation pour accéder au studio d'un simple toucher.
                </p>
              </div>
              
              <button
                onClick={handleInstallClick}
                className="w-full md:w-auto px-6 py-3.5 bg-[#A3FF12] hover:bg-[#A3FF12] text-black font-sans font-bold text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:scale-[1.03] cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 stroke-[3px]" />
                <span>Installer maintenant</span>
              </button>
            </div>
          </div>
        )}

        {/* Success state */}
        {installSuccess && (
          <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-3xl text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto text-green-400">
              <Check className="w-6 h-6 stroke-[3px]" />
            </div>
            <h4 className="font-bold text-base text-white">Demande d'installation envoyée !</h4>
            <p className="text-xs text-[#A2ABB5]">
              VOXMORY est en cours d'installation. Vous le retrouverez sur votre écran d'accueil d'ici quelques instants.
            </p>
          </div>
        )}

        {/* Guides for platforms (Android & iOS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* iOS (iPhone / iPad) Guide */}
          <div className="bg-[#0B0D10] border border-white/5 p-6 sm:p-8 rounded-3xl space-y-6 flex flex-col justify-between shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-lg text-white">Guide iPhone / iOS</h3>
                  <p className="text-[11px] text-[#8A949F] font-mono uppercase tracking-wider">Safari recommandé</p>
                </div>
              </div>
              
              <p className="text-xs text-[#A2ABB5] leading-relaxed">
                Apple n'autorise pas l'installation automatique par boutons. Pour installer l'application sur votre iPhone, suivez simplement ces instructions manuelles rapides :
              </p>

              <ol className="space-y-4 text-xs">
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[#A3FF12] text-[11px]">1</div>
                  <p className="text-[#C3CAD2] pt-0.5">
                    Ouvrez ce site internet dans le navigateur <strong className="text-white">Safari</strong> de votre iPhone.
                  </p>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[#A3FF12] text-[11px]">2</div>
                  <div className="space-y-1.5 pt-0.5">
                    <p className="text-[#C3CAD2]">
                      Appuyez sur le bouton <strong className="text-white">Partager</strong> en bas de l'écran.
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] text-[#A2ABB5] font-medium">
                      <Share className="w-3.5 h-3.5 text-blue-400" />
                      <span>Bouton de partage Safari (carré avec flèche vers le haut)</span>
                    </div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[#A3FF12] text-[11px]">3</div>
                  <p className="text-[#C3CAD2] pt-0.5">
                    Faites défiler le menu vers le bas et sélectionnez <strong className="text-white">Sur l'écran d'accueil</strong>.
                  </p>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[#A3FF12] text-[11px]">4</div>
                  <p className="text-[#C3CAD2] pt-0.5">
                    Validez en appuyant sur <strong className="text-white">Ajouter</strong> dans le coin supérieur droit.
                  </p>
                </li>
              </ol>
            </div>

            <div className="pt-4 border-t border-white/5">
              <span className="text-[10px] font-mono text-[#8A949F] block text-center">
                ✨ L'icône de l'application s'ajoutera sur votre écran.
              </span>
            </div>
          </div>

          {/* Android Guide */}
          <div className="bg-[#0B0D10] border border-white/5 p-6 sm:p-8 rounded-3xl space-y-6 flex flex-col justify-between shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/15 border border-green-500/20 flex items-center justify-center text-green-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-lg text-white">Guide Android</h3>
                  <p className="text-[11px] text-[#8A949F] font-mono uppercase tracking-wider">Chrome / Samsung Internet</p>
                </div>
              </div>
              
              <p className="text-xs text-[#A2ABB5] leading-relaxed">
                Sur Android, si le bouton d'installation automatique n'apparaît pas ou ne fonctionne pas, vous pouvez installer l'application via les options de votre navigateur :
              </p>

              <ol className="space-y-4 text-xs">
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[#A3FF12] text-[11px]">1</div>
                  <p className="text-[#C3CAD2] pt-0.5">
                    Ouvrez ce site internet dans <strong className="text-white">Chrome</strong> ou votre navigateur préféré.
                  </p>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[#A3FF12] text-[11px]">2</div>
                  <div className="space-y-1.5 pt-0.5">
                    <p className="text-[#C3CAD2]">
                      Appuyez sur le bouton de <strong className="text-white">Menu</strong> (les trois points verticaux) en haut ou bas à droite de l'écran.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[#A3FF12] text-[11px]">3</div>
                  <p className="text-[#C3CAD2] pt-0.5">
                    Appuyez sur l'option <strong className="text-white">Ajouter à l'écran d'accueil</strong> ou <strong className="text-white">Installer l'application</strong>.
                  </p>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[#A3FF12] text-[11px]">4</div>
                  <p className="text-[#C3CAD2] pt-0.5">
                    Confirmez la boîte de dialogue en appuyant sur <strong className="text-white">Installer</strong>.
                  </p>
                </li>
              </ol>
            </div>

            <div className="pt-4 border-t border-white/5">
              <span className="text-[10px] font-mono text-[#8A949F] block text-center">
                🚀 Fonctionne parfaitement sur Samsung, Xiaomi, Huawei, etc.
              </span>
            </div>
          </div>

        </div>

        {/* Benefits Section */}
        <div className="bg-black/30 p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
          <h3 className="font-bold text-sm text-[#A3FF12] uppercase tracking-widest font-mono text-center">
            Pourquoi installer l'application VOXMORY ?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <div className="text-2xl text-[#A3FF12]">⚡</div>
              <h4 className="font-bold text-xs text-white uppercase tracking-wider">Vitesse accrue</h4>
              <p className="text-[11px] text-[#A2ABB5] leading-relaxed">
                Navigation instantanée et temps de chargement minimes grâce au cache optimisé du studio.
              </p>
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <div className="text-2xl text-[#A3FF12]">🔔</div>
              <h4 className="font-bold text-xs text-white uppercase tracking-wider">Suivi en direct</h4>
              <p className="text-[11px] text-[#A2ABB5] leading-relaxed">
                Préparez la réception de notifications push pour être informé dès que votre rumba est enregistrée ou livrée.
              </p>
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <div className="text-2xl text-[#A3FF12]">📶</div>
              <h4 className="font-bold text-xs text-white uppercase tracking-wider">Mode Hors-ligne</h4>
              <p className="text-[11px] text-[#A2ABB5] leading-relaxed">
                Accédez à vos commandes et lisez les lecteurs audio de vos chansons même en cas de mauvaise connexion.
              </p>
            </div>
          </div>
        </div>

        {/* Push Notification Base Section */}
        <div className="p-6 bg-gradient-to-r from-[#0B0D10]/15 to-[#0B0D10]/10 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#A3FF12]/10 flex items-center justify-center text-[#A3FF12] flex-shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-white">Notifications Push Futures</h4>
              <p className="text-[11px] text-[#A2ABB5] leading-relaxed">
                Nous préparons le support des notifications push. Lorsque le studio mettra à jour l'état de votre rumba (Écriture des paroles, Chanson en production, Prête pour livraison), vous recevrez une alerte directe sur votre smartphone.
              </p>
            </div>
          </div>
        </div>

        {/* Call to action to return */}
        <div className="text-center pt-4">
          <button
            onClick={() => onNavigate('home')}
            className="px-6 py-2.5 rounded-full border border-white/10 hover:border-white/30 text-xs font-sans font-bold uppercase tracking-wider transition-all hover:bg-white/5 cursor-pointer"
          >
            Retourner au site principal
          </button>
        </div>

      </div>
    </div>
  );
}
