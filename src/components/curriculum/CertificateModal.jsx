import React, { useRef } from 'react';
import { X, Download, Share2, ArrowRight } from 'lucide-react';
import { levelMeta } from '@/lib/curriculum';

export default function CertificateModal({ visible, cefr, songs, userEmail, onClose, onContinue }) {
  const certRef = useRef(null);
  if (!visible) return null;
  const meta = levelMeta(cefr);
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleDownload = async () => {
    if (!certRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(certRef.current, { backgroundColor: '#fff', scale: 2 });
      const link = document.createElement('a');
      link.download = `spanish-beats-${cefr}-certificate.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch { /* noop */ }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/certificate/${cefr}`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-3 rounded-sm"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-20px',
              backgroundColor: ['#D96B43', '#2A4B62', '#F5C518', '#4CAF50', '#E91E63'][i % 5],
              animation: `confetti-fall ${2 + Math.random() * 2}s ${Math.random()}s linear infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative bg-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto no-scrollbar">
        <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-lg hover:bg-muted z-10">
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-primary mb-1">¡Certificado!</h2>
          <p className="text-sm text-muted-foreground mb-4">You completed the {meta.name} track</p>

          {/* Certificate card */}
          <div ref={certRef} className="rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-white p-6 text-left">
            <div className="text-center mb-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Spanish Beats</p>
              <p className="text-lg font-bold text-foreground mt-1">Certificate of Completion</p>
            </div>
            <p className="text-sm text-muted-foreground text-center">This certifies that</p>
            <p className="text-lg font-bold text-center text-foreground my-1">{userEmail || 'A dedicated learner'}</p>
            <p className="text-sm text-muted-foreground text-center">has completed the {meta.name} track</p>
            <p className="text-sm text-center text-foreground mt-1">CEFR Level {cefr} · {date}</p>
            <div className="mt-4 border-t border-amber-200 pt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Songs completed:</p>
              <ul className="text-xs text-foreground space-y-0.5">
                {songs.slice(0, 8).map((s, i) => (
                  <li key={i}>{i + 1}. {s.title} — {s.artist}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg">★</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mt-5">
            <button onClick={handleDownload} className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors">
              <Download className="h-4 w-4" /> Download
            </button>
            <button onClick={handleShare} className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
              <Share2 className="h-4 w-4" /> Share
            </button>
            {onContinue && (
              <button onClick={onContinue} className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}