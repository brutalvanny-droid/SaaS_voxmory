import React from 'react';
import { Megaphone, ArrowRight, Sparkles } from 'lucide-react';
import { PromotionSettings } from '../types.js';

interface PromotionBannerProps {
  promotion: PromotionSettings | null;
  onNavigate: (page: string, params?: any) => void;
}

export default function PromotionBanner({ promotion, onNavigate }: PromotionBannerProps) {
  if (!promotion || !promotion.isActive || !promotion.text) {
    return null;
  }

  const { text, bannerStyle, linkText, linkUrl } = promotion;

  let bgClass = '';
  let textClass = 'text-white';

  switch (bannerStyle) {
    case 'marquee':
      bgClass = 'bg-gradient-to-r from-[#0B0D10] via-[#161A20] to-[#0B0D10] border-b border-[#A3FF12]/20';
      break;
    case 'pulse':
      bgClass = 'bg-gradient-to-r from-red-600 via-[#161A20] to-[#161A20] animate-pulse border-b border-[#A3FF12]/20';
      break;
    case 'gold-gradient':
      bgClass = 'bg-gradient-to-r from-[#A3FF12] via-[#A3FF12] to-[#7ACC00] border-b border-[#A3FF12]/30';
      textClass = 'text-black font-sans font-black';
      break;
    case 'classic':
    default:
      bgClass = 'bg-[#0B0D10] border-b border-[#A3FF12]/20';
      break;
  }

  const handleLinkClick = (e: React.MouseEvent) => {
    if (linkUrl && linkUrl.startsWith('#')) {
      e.preventDefault();
      const page = linkUrl.replace('#', '');
      onNavigate(page);
    }
  };

  return (
    <div className={`relative w-full z-50 py-2.5 px-4 sm:px-6 flex items-center min-h-[44px] ${bgClass}`}>
      {bannerStyle === 'marquee' ? (
        <div className="w-full flex items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex-shrink-0 flex items-center gap-1.5 text-[10px] text-[#A3FF12] font-bold uppercase tracking-wider font-mono bg-black/55 px-2.5 py-1 rounded-md border border-[#A3FF12]/20">
            <Sparkles className="w-3.5 h-3.5 animate-spin-slow text-[#A3FF12]" />
            <span>PROMO</span>
          </div>
          
          <div className="flex-grow overflow-hidden marquee-container">
            <div className="marquee-text text-xs sm:text-sm font-medium text-white tracking-wide">
              {text}
            </div>
          </div>

          {linkText && (
            <a
              href={linkUrl || '#'}
              onClick={handleLinkClick}
              className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold text-[#A3FF12] hover:text-white transition-all bg-black/50 hover:bg-black/75 px-3 py-1.5 rounded-full uppercase tracking-widest font-mono border border-[#A3FF12]/20"
            >
              <span>{linkText}</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          )}
        </div>
      ) : (
        <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <Megaphone className={`w-4 h-4 flex-shrink-0 ${bannerStyle === 'gold-gradient' ? 'text-black' : 'text-[#A3FF12]'}`} />
            <span className={`text-xs sm:text-sm font-bold tracking-wide ${textClass}`}>
              {text}
            </span>
          </div>
          
          {linkText && (
            <a
              href={linkUrl || '#'}
              onClick={handleLinkClick}
              className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-all hover:scale-[1.03] active:scale-95 ${
                bannerStyle === 'gold-gradient'
                  ? 'bg-black text-[#A3FF12] border border-[#A3FF12]/20 hover:bg-[#0B0D10]'
                  : 'bg-[#A3FF12] text-black hover:bg-white'
              }`}
            >
              <span>{linkText}</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
