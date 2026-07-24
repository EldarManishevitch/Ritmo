import React, { useRef, useState } from 'react';
import { Award, Download, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';

export default function CertificateView({ certificate, userName }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(null);

  const issued = certificate.created_date
    ? new Date(certificate.created_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const capture = async () => html2canvas(ref.current, { backgroundColor: '#ffffff', scale: 2 });

  const handleDownload = async () => {
    setBusy('download');
    try {
      const canvas = await capture();
      const link = document.createElement('a');
      link.download = `Ritmo-Certificate-${(certificate.song_title || 'song').replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch { /* noop */ } finally { setBusy(null); }
  };

  const handleShare = async () => {
    setBusy('share');
    try {
      const canvas = await capture();
      canvas.toBlob(async (blob) => {
        if (!blob) { handleDownload(); return; }
        const file = new File([blob], 'Ritmo-Certificate.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'My Ritmo Certificate!',
              text: `🎉 I mastered "${certificate.song_title}" by ${certificate.artist} on Ritmo with ${certificate.score}%!`,
            });
          } catch { /* user cancelled */ }
        } else {
          handleDownload();
        }
      }, 'image/png');
    } catch { /* noop */ } finally { setBusy(null); }
  };

  return (
    <div className="space-y-4">
      <div
        ref={ref}
        className="relative bg-white p-6 sm:p-8"
        style={{ border: '4px double #6C6BD4', borderRadius: '16px' }}
      >
        <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2" style={{ borderColor: '#6C6BD4' }} />
        <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2" style={{ borderColor: '#6C6BD4' }} />
        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2" style={{ borderColor: '#6C6BD4' }} />
        <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2" style={{ borderColor: '#6C6BD4' }} />

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3" style={{ backgroundColor: '#6C6BD4' }}>
            <Award className="h-7 w-7 text-white" />
          </div>
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#6C6BD4' }}>Ritmo · Certificate of Achievement</p>
          <h2 className="text-2xl font-bold mt-2 mb-1" style={{ color: '#23252F' }}>{userName || 'Learner'}</h2>
          <p className="text-sm" style={{ color: '#6b6b6b' }}>has mastered the Spanish song</p>
          <h3 className="text-xl font-bold mt-2" style={{ color: '#23252F' }}>“{certificate.song_title}”</h3>
          <p className="text-sm mt-0.5" style={{ color: '#6b6b6b' }}>by {certificate.artist}</p>

          <div className="flex items-center justify-center gap-6 mt-5">
            <div>
              <p className="text-2xl font-bold" style={{ color: '#6C6BD4' }}>{certificate.score}%</p>
              <p className="text-xs" style={{ color: '#6b6b6b' }}>Quiz Score</p>
            </div>
            <div className="w-px h-10" style={{ backgroundColor: '#e5e5e5' }} />
            <div>
              <p className="text-2xl font-bold" style={{ color: '#6C6BD4' }}>{certificate.cefr_level || 'A2'}</p>
              <p className="text-xs" style={{ color: '#6b6b6b' }}>CEFR Level</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid #e5e5e5' }}>
            <div className="text-left">
              <p className="text-xs" style={{ color: '#6b6b6b' }}>Issued</p>
              <p className="text-xs font-semibold" style={{ color: '#23252F' }}>{issued}</p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: '#6b6b6b' }}>Certificate №</p>
              <p className="text-xs font-mono font-semibold" style={{ color: '#23252F' }}>{certificate.certificate_number || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleDownload} disabled={!!busy} className="flex-1">
          {busy === 'download' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
          Download
        </Button>
        <Button onClick={handleShare} disabled={!!busy} variant="outline" className="flex-1">
          {busy === 'share' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Share2 className="h-4 w-4 mr-1" />}
          Share with friends
        </Button>
      </div>
    </div>
  );
}