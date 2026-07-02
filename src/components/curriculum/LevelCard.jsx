import React, { useState, useMemo, useEffect } from 'react';
import { Lock, Check, Plus, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { levelMeta } from '@/lib/curriculum';
import { genreColor, genreLabel } from '@/lib/genres';

export default function LevelCard({ track, levelProgress, songs, completedSongIds, isLocked, userCefrLevel, favGenres = [] }) {
  const [genreTab, setGenreTab] = useState('all');
  const meta = levelMeta(track.cefr_level);
  const songsCompleted = levelProgress?.songs_completed?.length || 0;
  const totalSlots = 12;
  const pct = Math.round((songsCompleted / totalSlots) * 100);
  const hasCert = levelProgress?.certificate_issued;
  const curatedSongs = (track.song_ids || []).map((id) => songs.find((s) => s.id === id)).filter(Boolean);

  const availableGenres = useMemo(() => {
    const set = new Set();
    curatedSongs.forEach((s) => { if (s.genre) set.add(s.genre); });
    return Array.from(set);
  }, [curatedSongs]);

  useEffect(() => {
    if (favGenres.length && availableGenres.length) {
      const match = favGenres.find((g) => availableGenres.includes(g));
      if (match) setGenreTab(match);
    }
  }, [favGenres, availableGenres]);

  const displaySongs = genreTab === 'all' ? curatedSongs : curatedSongs.filter((s) => s.genre === genreTab);
  const nextSongId = (track.song_ids || []).find((id) => !completedSongIds.includes(id));

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

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">{songsCompleted} / {totalSlots} songs</span>
          <span className="font-semibold text-foreground">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Genre filter tabs */}
      {availableGenres.length > 1 && (
        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setGenreTab('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              genreTab === 'all' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            All
          </button>
          {availableGenres.map((g) => (
            <button
              key={g}
              onClick={() => setGenreTab(g)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                genreTab === g ? `${genreColor(g).solid} text-white` : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {genreLabel(g)}
            </button>
          ))}
        </div>
      )}

      {/* Song grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {displaySongs.map((song, idx) => {
          const completed = completedSongIds.includes(song.id);
          const isNext = song.id === nextSongId;
          return (
            <div key={song.id} className={`relative aspect-square rounded-lg overflow-hidden border-2 ${isNext ? 'border-primary' : completed ? 'border-green-500' : 'border-transparent'}`}>
              <img src={song.album_art_url || `https://i.ytimg.com/vi/${song.youtube_id}/mqdefault.jpg`} alt={song.title} className={`w-full h-full object-cover ${isNext || completed ? '' : 'opacity-50'}`} />
              {completed && (
                <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                  <Check className="h-5 w-5 text-white" strokeWidth={3} />
                </div>
              )}
            </div>
          );
        })}
        {/* Open slots */}
        {Array.from({ length: Math.max(0, totalSlots - curatedSongs.length) }).map((_, i) => (
          <Link key={`slot-${i}`} to="/dashboard" className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors">
            <Plus className="h-5 w-5 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}