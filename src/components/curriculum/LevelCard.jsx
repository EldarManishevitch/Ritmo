import React from 'react';
import { Lock, Plus, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { levelMeta } from '@/lib/curriculum';
import CurriculumSongCard from '@/components/curriculum/CurriculumSongCard';

const TOTAL_SLOTS = 12;

export default function LevelCard({ track, levelProgress, songs = [], isLocked, userCefrLevel }) {
  const meta = levelMeta(track.cefr_level);
  const songsCompleted = levelProgress?.songs_completed?.length || 0;
  const pct = Math.round((songsCompleted / TOTAL_SLOTS) * 100);
  const hasCert = levelProgress?.certificate_issued;
  const openSlots = Math.max(0, TOTAL_SLOTS - songs.length);

  return (
    <div className={`rounded-2xl border bg-card p-5 ${isLocked ? 'opacity-60' : ''} ${track.cefr_level === userCefrLevel ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${track.cefr_level === userCefrLevel ? 'bg-primary text-white' : 'bg-muted text-foreground'}`}>
            {track.cefr_level}
          </span>
          <div>
            <h3 className="font-bold text-foreground">{meta.name}</h3>
            <p className="text-xs text-muted-foreground">{meta.desc}</p>
          </div>
        </div>
        {hasCert ? (
          <Link to={`/certificate/${track.cefr_level}`} className="flex items-center gap-1 text-xs font-semibold text-amber-600">
            <Award className="h-4 w-4" /> Certificate
          </Link>
        ) : isLocked ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-4 w-4" /> Locked
          </div>
        ) : null}
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">{songsCompleted} / {TOTAL_SLOTS} songs</span>
          <span className="font-semibold text-foreground">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {songs.map((song) => (
          <CurriculumSongCard key={song.id} song={song} />
        ))}
        {Array.from({ length: openSlots }).map((_, i) => (
          <Link
            key={`slot-${i}`}
            to="/dashboard"
            className="flex flex-col items-center justify-center aspect-square border border-dashed border-border rounded-[10px] hover:border-primary hover:bg-primary/5 transition-colors gap-1"
          >
            <Plus className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Add a song</span>
          </Link>
        ))}
      </div>
    </div>
  );
}