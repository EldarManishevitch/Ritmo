import React, { useState } from 'react';
import { Award, Loader2 } from 'lucide-react';
import { useCertificatesList } from '@/data/hooks/useCertificates';
import CertificateModal from './CertificateModal';

export default function CertificatesSection() {
  const { data: certs = null } = useCertificatesList();
  const [selected, setSelected] = useState(null);

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <Award className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Certificates</h2>
        <span className="text-xs text-muted-foreground">{certs?.length || 0} earned</span>
      </div>

      {!certs ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : certs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Master a song (score 80%+ on a quiz) to earn your first certificate!</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {certs.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="text-left rounded-xl border border-border bg-card p-3 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary">{c.cefr_level || 'A2'}</span>
                <span className="ml-auto text-xs font-bold text-primary">{c.score}%</span>
              </div>
              <p className="text-sm font-bold text-foreground line-clamp-2">{c.song_title}</p>
              <p className="text-xs text-muted-foreground truncate">{c.artist}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">Tap to view & share</p>
            </button>
          ))}
        </div>
      )}

      {selected && <CertificateModal certificate={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}