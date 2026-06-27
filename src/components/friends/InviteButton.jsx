import React, { useState, useRef, useEffect } from 'react';
import { Share2, Mail, Link2, Check, MessageCircle } from 'lucide-react';

export default function InviteButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  const link = typeof window !== 'undefined' ? window.location.origin : '';
  const shareText = "Join me on Ritmo — learn Spanish through music and let's compete on the leaderboard!";

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Ritmo', text: shareText, url: link }); } catch {}
      return;
    }
    setOpen((o) => !o);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const mailto = `mailto:?subject=${encodeURIComponent('Join me on Ritmo')}&body=${encodeURIComponent(shareText + '\n\n' + link)}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + link)}`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={share}
        className="inline-flex items-center gap-1.5 h-8 rounded-md px-3 text-xs font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
      >
        <Share2 className="h-4 w-4" /> Invite
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-border bg-card shadow-lg p-1 z-20">
          <button onClick={copy} className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-left">
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <a href={mailto} className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors">
            <Mail className="h-4 w-4" /> Email
          </a>
          <a href={whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}