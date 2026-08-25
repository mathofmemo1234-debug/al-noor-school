import React from 'react';
import { Star, Award, ExternalLink } from 'lucide-react';

/**
 * SchoolExcellenceButton component
 * Opens the School Excellence SPA in a new external browser window/tab.
 */
export default function SchoolExcellenceButton({ 
  className = '', 
  variant = 'primary', 
  label = 'صفحة التميز المدرسي',
  showExternalIcon = true,
  onClick
}) {
  const handleClick = (e) => {
    if (onClick) onClick(e);
    
    // Construct target URL for HashRouter or standalone HTML
    const href = `${window.location.origin}${window.location.pathname}#/school-excellence`;
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'gold':
        return 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold shadow-lg shadow-amber-500/20 border border-amber-400/50';
      case 'sidebar':
        return 'w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-sm font-semibold transition active:scale-[0.98]';
      case 'secondary':
        return 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-sm font-semibold';
      case 'primary':
      default:
        return 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-sm shadow-md';
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition duration-200 cursor-pointer ${getVariantStyles()} ${className}`}
      title="فتح صفحة لوحة تحكم ملف التميز المدرسي في نافذة جديدة"
    >
      <div className="flex items-center gap-2">
        <Award className="w-5 h-5 text-amber-400 flex-shrink-0 animate-pulse" />
        <span>{label}</span>
      </div>
      {showExternalIcon && (
        <ExternalLink className="w-3.5 h-3.5 opacity-80 flex-shrink-0" />
      )}
    </button>
  );
}
