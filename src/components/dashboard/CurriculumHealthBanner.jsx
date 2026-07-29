import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const READY_STATES = ['ready', 'ready_synced', 'ready_unsynced', 'static'];

/**
 * Dismissible admin-only banner shown on the Dashboard when more than 5
 * curriculum/catalog songs are failing (sync_status not in a ready state).
 * Runs a lightweight check using data already loaded by the Dashboard.
 */
export default function CurriculumHealthBanner({ tracks = [], songs = [] }) {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const failingCount = useMemo(() => {
    if (!user || user.role !== 'admin') return 0;
    const requiredIds = new Set();
    for (const t of tracks) for (const id of (t.song_ids || [])) requiredIds.add(id);
    for (const s of songs) if (s.is_catalog_default) requiredIds.add(s.id);
    const required = songs.filter((s) => requiredIds.has(s.id));
    return required.filter((s) => !READY_STATES.includes(s.sync_status)).length;
  }, [user, tracks, songs]);

  if (failingCount <= 5 || dismissed) return null;

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
        <p className="text-sm font-medium text-amber-800 truncate">
          {failingCount} curriculum/catalog songs need attention
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link to="/admin/curriculum-health" className="text-sm font-semibold text-amber-700 hover:underline whitespace-nowrap">
          Fix now →
        </Link>
        <button onClick={() => setDismissed(true)} className="p-1 rounded hover:bg-amber-100 transition-colors">
          <X className="h-4 w-4 text-amber-600" />
        </button>
      </div>
    </div>
  );
}