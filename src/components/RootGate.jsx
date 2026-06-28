import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

/**
 * RootGate: if the user is authenticated, show the Dashboard;
 * otherwise show the Landing page. Sits at "/".
 */
export default function RootGate({ landing, dashboard }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then((ok) => {
      setAuthed(ok);
      setChecking(false);
    }).catch(() => {
      setAuthed(false);
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return authed ? dashboard : landing;
}