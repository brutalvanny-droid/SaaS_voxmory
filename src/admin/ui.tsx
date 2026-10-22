import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { useEffect } from 'react';
import { useScrollLock } from '../hooks/useScrollLock.js';

/* Petits composants d'interface partagés par le studio d'administration. */

export function Card({
  title,
  subtitle,
  actions,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-[#0B0D10] border border-white/10 rounded-2xl p-5 ${className}`}
    >
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && <h3 className="text-sm font-bold text-white">{title}</h3>}
            {subtitle && <p className="text-xs text-[#8A949F] mt-0.5">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  accent = 'text-white',
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="bg-[#0B0D10] border border-white/10 rounded-2xl p-4">
      <p className="text-[10px] uppercase tracking-widest text-[#8A949F] font-semibold">{label}</p>
      <p className={`text-2xl font-black mt-1 ${accent}`}>{value}</p>
      {hint && <p className="text-[11px] text-[#6C7581] mt-1">{hint}</p>}
    </div>
  );
}

const BUTTON_VARIANTS = {
  primary: 'bg-[#A3FF12] text-black hover:bg-[#A3FF12]',
  ghost: 'bg-white/5 text-white hover:bg-white/10 border border-white/10',
  danger: 'bg-red-600/90 text-white hover:bg-red-500',
  success: 'bg-emerald-600 text-white hover:bg-emerald-500',
} as const;

export function Button({
  children,
  onClick,
  variant = 'ghost',
  type = 'button',
  disabled,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: keyof typeof BUTTON_VARIANTS;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${BUTTON_VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="block">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#A2ABB5] mb-1.5">
        {label}
      </span>
      {children}
      {hint && <span className="block text-[10px] text-[#6C7581] mt-1">{hint}</span>}
    </div>
  );
}

export const inputClass =
  'w-full bg-[#14181D] border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#8A949F] cursor-text hover:border-white/30 focus:outline-none focus:border-[#A3FF12] focus:ring-2 focus:ring-[#A3FF12]/25 focus:bg-[#171C22] transition-colors';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} ${props.className ?? ''}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ''}`} />;
}

const BADGE_TONES = {
  gray: 'bg-white/10 text-[#C3CAD2]',
  yellow: 'bg-[#A3FF12]/15 text-[#A3FF12]',
  green: 'bg-emerald-500/15 text-emerald-300',
  red: 'bg-red-500/15 text-red-300',
  blue: 'bg-blue-500/15 text-blue-300',
  purple: 'bg-[#A3FF12]/15 text-[#A3FF12]',
} as const;

export function Badge({
  children,
  tone = 'gray',
}: {
  children: ReactNode;
  tone?: keyof typeof BADGE_TONES;
}) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  /**
   * Les crochets doivent être appelés avant tout retour anticipé, sinon
   * React perd le fil entre deux rendus.
   */
  useScrollLock(open);

  // Échap ferme la fenêtre : sur ordinateur, c'est le geste attendu et
  // chercher la croix pour sortir est agaçant.
  useEffect(() => {
    if (!open) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative bg-[#0B0D10] border border-white/15 rounded-2xl p-6 w-full ${
          wide ? 'max-w-4xl' : 'max-w-lg'
        } max-h-[88vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-[#8A949F] hover:text-white text-xl leading-none">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ message }: { message: string }) {
  return (
    <p className="text-center text-sm text-[#6C7581] py-10 border border-dashed border-white/10 rounded-xl">
      {message}
    </p>
  );
}

export function ErrorNote({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
      {message}
    </p>
  );
}
