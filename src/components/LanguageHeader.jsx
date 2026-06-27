import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useLanguage, LANGUAGES } from '@/lib/LanguageContext';

export default function LanguageHeader({ className = '' }) {
  const navigate = useNavigate();
  const { lang, flag } = useLanguage();

  const handleSwitch = () => {
    navigate('/');
  };

  return (
    <div className={`flex items-center justify-between px-4 py-2 bg-background border-b border-border ${className}`}>
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <span className="text-base">{flag}</span>
        Learning: <span className="text-foreground font-semibold">{lang}</span>
      </p>
      <button
        onClick={handleSwitch}
        className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <Globe className="h-3.5 w-3.5" />
        Switch language
      </button>
    </div>
  );
}