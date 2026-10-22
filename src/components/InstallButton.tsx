/**
 * Bouton d'installation de l'application PWA.
 *
 * Comportement :
 * - Sur Android (Chrome) : quand le navigateur propose l'installation,
 *   le bouton s'affiche et déclenche la fenêtre « Installer l'application ».
 * - Sur iPhone (Safari) : le bouton s'affiche et montre les instructions
 *   « Partager → Sur l'écran d'accueil ».
 * - Sur ordinateur : le bouton reste masqué (installation peu courante).
 */
import { useEffect, useState, useRef } from 'react';
import { Download, Smartphone, Share2, AlertTriangle } from 'lucide-react';

interface InstallButtonProps {
  variant?: 'navbar' | 'footer' | 'default' | 'pill' | 'mobile-menu';
  className?: string;
  onNavigate?: (page: string) => void;
}

export default function InstallButton({ variant, className, onNavigate }: InstallButtonProps) {
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);
  const [prompt, setPrompt] = useState<any>(null);
  const promptRef = useRef<any>(null);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (
      navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1
    );
    setIos(isIOS);

    // Android : écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt((e as any));
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Si déjà installé, on ne montre pas le bouton
    const handleAppInstalled = () => {
      setShow(false);
      setPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (ios) {
      // iOS : pas d'API, on montre juste les instructions
      setShow(false);
      return;
    }

    if (promptRef.current) {
      await promptRef.current.prompt();
      const { outcome } = await promptRef.current.userChoice;
      if (outcome === 'accepted') {
        setShow(false);
        setPrompt(null);
      }
    } else if (prompt) {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        setShow(false);
        setPrompt(null);
      }
    }
  };

  if (!show) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 ${
        variant === 'footer' ? 'static relative mx-auto mb-8' : ''
      } ${className ?? ''}`}
    >
      {ios ? (
        <div className="bg-[#0B0D10] border border-[#A3FF12]/30 rounded-2xl p-4 shadow-xl shadow-[#0B0D10]/40">
          <div className="flex items-start gap-3 mb-2">
            <Share2 className="w-5 h-5 text-[#A3FF12] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-white">Installer VOXMORY</p>
              <p className="text-[10px] text-[#8A949F] leading-tight">
                Appuyez sur <span className="text-[#A3FF12] font-bold">Partager</span>, puis
                <span className="text-[#A3FF12] font-bold">Sur l'écran d'accueil</span>.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('home')}
            className="w-full py-2 bg-[#A3FF12] text-black font-bold rounded-lg text-sm hover:opacity-90 transition-all"
          >
            J'ai compris
          </button>
        </div>
      ) : (
        <button
          onClick={handleInstall}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#A3FF12] text-black font-bold rounded-full text-sm shadow-lg shadow-[#A3FF12]/30 hover:opacity-90 transition-all whitespace-nowrap"
        >
          <Download className="w-4 h-4" /> Installer l'application
        </button>
      )}
    </div>
  );
}
