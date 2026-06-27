import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CertificateView from './CertificateView';

export default function CertificateModal({ certificate, onClose }) {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    base44.auth.me()
      .then((u) => setUserName(u?.full_name || (u?.email ? u.email.split('@')[0] : 'Learner')))
      .catch(() => setUserName('Learner'));
  }, []);

  return (
    <Dialog open={!!certificate} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>🎉 Certificate Earned!</DialogTitle>
        </DialogHeader>
        <CertificateView certificate={certificate} userName={userName} />
      </DialogContent>
    </Dialog>
  );
}