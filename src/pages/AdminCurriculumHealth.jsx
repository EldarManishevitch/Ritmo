import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Loader2, CheckCircle2, XCircle, AlertTriangle, Wrench } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';
import { generateLyrics } from '@/lib/lyricsPipeline';

const READY_STATES = ['ready', 'ready_synced', 'ready_unsynced', 'static'];

const FAILURE_GROUPS = {
  never_started: { label: 'Never started', color: 'text-blue-600', icon: '⏳' },
  stuck_generating: { label: 'Stuck generating', color: 'text-orange-600', icon: '🔄' },
  failed: { label: 'Failed', color: 'text-red-600', icon: '❌' },
  missing_translations: { label: 'Ready but missing translations', color: 'text-amber-600', icon: '🌐' },
  no_lines: { label: 'Ready but no lyrics', color: 'text-purple-600', icon: '📭' },
};

function isStale(updatedDate, minutes) {
  if (!updatedDate) return false;
  return Date.now() - new Date(updatedDate).getTime() > minutes * 60 * 1000;
}

export default function AdminCurriculumHealth() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState([]);
  const [catalogSongs, setCatalogSongs] = useState([]);
  const [linesBySong, setLinesBySong] = useState({});
  const [songsById, setSongsById] = useState({});
  const [fixing, setFixing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, song: null });
  const [log, setLog] = useState([]);
  const [manualReview, setManualReview] = useState([]);
  const [translationProgress, setTranslationProgress] = useState(null);
  const linesBySongRef = useRef({});

  // Run the full check (Step 1)
  const runCheck = useCallback(async () => {
    setLoading(true);
    try {
      const allTracks = await base44.entities.CurriculumTrack.list('-cefr_level', 50);
      setTracks(allTracks || []);

      const requiredIds = new Set();
      for (const t of (allTracks || [])) {
        for (const id of (t.song_ids || [])) requiredIds.add(id);
      }

      const catalog = await base44.entities.Song.filter({ is_catalog_default: true }, '-created_date', 500);
      setCatalogSongs(catalog || []);
      for (const s of (catalog || [])) requiredIds.add(s.id);

      const idArr = [...requiredIds];
      if (idArr.length === 0) {
        setSongsById({});
        setLinesBySong({});
        return;
      }

      const songs = await base44.entities.Song.filter({ id: { $in: idArr } }, '-created_date', 500);
      const songMap = {};
      for (const s of (songs || [])) songMap[s.id] = s;
      setSongsById(songMap);

      const allLines = await base44.entities.LyricLine.filter({ song_id: { $in: idArr } }, 'line_index', 2000);
      const grouped = {};
      for (const line of (allLines || [])) {
        if (!grouped[line.song_id]) grouped[line.song_id] = [];
        grouped[line.song_id].push(line);
      }
      setLinesBySong(grouped);
    } catch (err) {
      console.error('Check failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { runCheck(); }, [runCheck]);
  useEffect(() => { linesBySongRef.current = linesBySong; }, [linesBySong]);

  // Re-check a single song and update its row live (Step 2)
  const recheckSong = useCallback(async (songId) => {
    try {
      const [song, lines] = await Promise.all([
        base44.entities.Song.get(songId),
        base44.entities.LyricLine.filter({ song_id: songId }, 'line_index', 500),
      ]);
      setSongsById((prev) => ({ ...prev, [songId]: song }));
      setLinesBySong((prev) => ({ ...prev, [songId]: lines || [] }));
      return lines || [];
    } catch {
      return [];
    }
  }, []);

  const requiredSongIds = useMemo(() => {
    const ids = new Set();
    for (const t of tracks) for (const id of (t.song_ids || [])) ids.add(id);
    for (const s of catalogSongs) ids.add(s.id);
    return ids;
  }, [tracks, catalogSongs]);

  const songChecks = useMemo(() => {
    const results = [];
    for (const id of requiredSongIds) {
      const song = songsById[id];
      if (!song) continue;
      const lines = linesBySong[id] || [];
      const lineCount = lines.length;
      const missingTranslations = lines.filter((l) => !l.english_translation || l.english_translation.trim() === '').length;
      const isReady = READY_STATES.includes(song.sync_status);
      const passes = isReady && lineCount > 0 && missingTranslations === 0;

      let failureType = null;
      if (!passes) {
        if (song.sync_status === 'pending') failureType = 'never_started';
        else if (['fetching_lyrics', 'translating'].includes(song.sync_status)) failureType = 'stuck_generating';
        else if (['failed', 'failed_permanent'].includes(song.sync_status)) failureType = 'failed';
        else if (isReady && missingTranslations > 0) failureType = 'missing_translations';
        else if (isReady && lineCount === 0) failureType = 'no_lines';
        else failureType = 'failed';
      }

      results.push({ ...song, lineCount, missingTranslations, passes, failureType });
    }
    return results;
  }, [requiredSongIds, songsById, linesBySong]);

  const curriculumChecks = songChecks.filter((s) => tracks.some((t) => (t.song_ids || []).includes(s.id)));
  const catalogChecks = songChecks.filter((s) => s.is_catalog_default);
  const failingSongs = songChecks.filter((s) => !s.passes);
  const curriculumReady = curriculumChecks.filter((s) => s.passes).length;
  const catalogReady = catalogChecks.filter((s) => s.passes).length;

  const groupedFailures = useMemo(() => {
    const groups = {};
    for (const s of failingSongs) {
      if (!groups[s.failureType]) groups[s.failureType] = [];
      groups[s.failureType].push(s);
    }
    return groups;
  }, [failingSongs]);

  // Poll for song completion (Step 3, sub-step 4)
  const pollForCompletion = useCallback(async (songId, timeoutMs = 45000, intervalMs = 3000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, intervalMs));
      try {
        const song = await base44.entities.Song.get(songId);
        if (READY_STATES.includes(song.sync_status)) return { status: 'ready' };
        if (song.sync_status === 'failed_permanent') return { status: 'failed_permanent' };
        if (song.sync_status === 'failed') return { status: 'failed' };
      } catch { /* keep polling */ }
    }
    return { status: 'timeout' };
  }, []);

  // Repair a single song (Step 3)
  const repairSong = useCallback(async (song) => {
    const isStuckStale = ['fetching_lyrics', 'translating'].includes(song.sync_status) && isStale(song.updated_date, 5);
    const needsPipeline = ['pending', 'failed', 'failed_permanent'].includes(song.sync_status) || isStuckStale;
    const needsTranslationRepair = !needsPipeline && song.lineCount > 0 && song.missingTranslations > 0;

    if (needsPipeline) {
      // Reset once, then up to 3 trigger attempts
      await base44.entities.Song.update(song.id, { sync_status: 'pending', retry_count: 0 });
      for (let attempt = 1; attempt <= 3; attempt++) {
        await generateLyrics({ songId: song.id });
        const result = await pollForCompletion(song.id);
        if (result.status === 'ready') return { status: 'success', message: `Ready (attempt ${attempt})` };
        if (result.status === 'failed_permanent') return { status: 'permanent_failure', message: 'Permanently failed' };
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1500));
      }
      await base44.entities.Song.update(song.id, { sync_status: 'failed_permanent' });
      return { status: 'permanent_failure', message: 'Failed after 3 attempts' };
    }

    if (needsTranslationRepair) {
      const songLines = linesBySongRef.current[song.id] || [];
      const incomplete = songLines.filter((l) => !l.english_translation || l.english_translation.trim() === '');
      const total = incomplete.length;
      const batchSize = 10;

      for (let i = 0; i < incomplete.length; i += batchSize) {
        const batch = incomplete.slice(i, i + batchSize);
        setTranslationProgress({ songId: song.id, done: i, total, title: song.title });
        try {
          await base44.functions.invoke('repairTranslations', {
            songId: song.id,
            lineIds: batch.map((l) => l.id),
          });
        } catch { /* continue to next batch */ }
      }
      setTranslationProgress({ songId: song.id, done: total, total, title: song.title });

      // Fetch fresh lines to verify the result
      const freshLines = await base44.entities.LyricLine.filter({ song_id: song.id }, 'line_index', 500);
      const stillMissing = freshLines.filter((l) => !l.english_translation || l.english_translation.trim() === '').length;

      if (stillMissing > 0) {
        return { status: 'failed', message: `Retry failed — ${stillMissing} lines still missing` };
      }
      return { status: 'success', message: `Translated ${total} lines` };
    }

    return { status: 'skipped', message: 'No repair needed' };
  }, [pollForCompletion]);

  // Fix all sequentially (Step 3)
  const handleFixAll = useCallback(async () => {
    if (fixing) return;
    setFixing(true);
    setLog([]);
    setManualReview([]);
    setTranslationProgress(null);
    const toFix = [...failingSongs];
    setProgress({ current: 0, total: toFix.length, song: null });

    for (let i = 0; i < toFix.length; i++) {
      const song = toFix[i];
      setProgress({ current: i + 1, total: toFix.length, song });
      const result = await repairSong(song);
      setLog((prev) => [...prev, { id: song.id, title: song.title, artist: song.artist, ...result }]);
      if (result.status === 'permanent_failure') {
        setManualReview((prev) => [...prev, song]);
      }
      // Live row update: re-check just this song after each repair
      if (result.status !== 'skipped') {
        await recheckSong(song.id);
      }
    }

    setProgress({ current: 0, total: 0, song: null });
    setTranslationProgress(null);
    setFixing(false);
    await runCheck();
  }, [fixing, failingSongs, repairSong, recheckSong, runCheck]);

  // Per-row translate for a single song (Step 2)
  const handleTranslateOne = useCallback(async (song) => {
    if (fixing) return;
    setFixing(true);
    setLog([]);
    setManualReview([]);
    setTranslationProgress(null);
    setProgress({ current: 1, total: 1, song });
    const result = await repairSong(song);
    setLog([{ id: song.id, title: song.title, artist: song.artist, ...result }]);
    if (result.status === 'permanent_failure') setManualReview([song]);
    if (result.status !== 'skipped') await recheckSong(song.id);
    setProgress({ current: 0, total: 0, song: null });
    setTranslationProgress(null);
    setFixing(false);
  }, [fixing, repairSong, recheckSong]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">Admin access required.</p>
        <Link to="/dashboard" className="text-primary font-medium">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Curriculum Health — Admin | Spanish Beats" description="Admin tool to check and repair curriculum and catalog song lyrics." />
      <div className="safe-area-top flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-background z-10">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold">Curriculum Health</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={runCheck} disabled={loading || fixing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Verify all
          </Button>
          <Button size="sm" onClick={handleFixAll} disabled={fixing || failingSongs.length === 0}>
            <Wrench className="h-4 w-4 mr-1" /> Fix all ({failingSongs.length})
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {fixing && progress.song && (
          <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-sm font-medium">
                {translationProgress
                  ? `Translating ${translationProgress.title} (${translationProgress.done}/${translationProgress.total} lines)...`
                  : `Fixing ${progress.current} of ${progress.total} — ${progress.song.title} by ${progress.song.artist}...`}
              </p>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{
                width: translationProgress
                  ? `${(translationProgress.done / Math.max(translationProgress.total, 1)) * 100}%`
                  : `${(progress.current / Math.max(progress.total, 1)) * 100}%`
              }} />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">Curriculum songs</p>
                <p className="text-2xl font-bold mt-1">
                  {curriculumReady} <span className="text-muted-foreground text-base font-normal">of {curriculumChecks.length} ready</span>
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">Catalog songs</p>
                <p className="text-2xl font-bold mt-1">
                  {catalogReady} <span className="text-muted-foreground text-base font-normal">of {catalogChecks.length} ready</span>
                </p>
              </div>
            </div>

            {log.length > 0 && (
              <div className="mb-6 rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold mb-3">Repair log</h3>
                <div className="space-y-1.5 max-h-64 overflow-y-auto no-scrollbar">
                  {log.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {entry.status === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                      <span className="font-medium truncate">{entry.title}</span>
                      <span className="text-muted-foreground text-xs truncate">{entry.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {manualReview.length > 0 && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                <h3 className="text-sm font-semibold text-red-700 mb-2">Needs manual review ({manualReview.length})</h3>
                <div className="space-y-1">
                  {manualReview.map((s) => (
                    <div key={s.id} className="text-sm text-red-600">{s.title} — {s.artist}</div>
                  ))}
                </div>
              </div>
            )}

            {failingSongs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-600 mb-3" />
                <p className="text-sm font-medium">All curriculum and catalog songs are ready</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(FAILURE_GROUPS).map(([key, group]) => {
                  const songs = groupedFailures[key] || [];
                  if (songs.length === 0) return null;
                  return (
                    <div key={key}>
                      <h3 className={`text-sm font-semibold mb-2 ${group.color}`}>
                        {group.icon} {group.label} ({songs.length})
                      </h3>
                      <div className="rounded-xl border border-border overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Title</th>
                              <th className="text-left px-3 py-2 font-medium whitespace-nowrap hidden sm:table-cell">Artist</th>
                              <th className="text-left px-3 py-2 font-medium">Level</th>
                              <th className="text-left px-3 py-2 font-medium">Status</th>
                              <th className="text-right px-3 py-2 font-medium">Lines</th>
                              <th className="text-right px-3 py-2 font-medium">Missing</th>
                              {key === 'missing_translations' && <th className="px-3 py-2 font-medium">Action</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {songs.map((s) => (
                              <tr key={s.id} className="border-t border-border">
                                <td className="px-3 py-2 font-medium truncate max-w-[200px]">{s.title}</td>
                                <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell truncate max-w-[150px]">{s.artist}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{s.cefr_level}</td>
                                <td className="px-3 py-2"><span className="text-xs font-mono">{s.sync_status}</span></td>
                                <td className="px-3 py-2 text-right">{s.lineCount}</td>
                                <td className="px-3 py-2 text-right">{s.missingTranslations}</td>
                                {key === 'missing_translations' && (
                                  <td className="px-3 py-2">
                                    <Button size="sm" variant="outline" onClick={() => handleTranslateOne(s)} disabled={fixing}>
                                      Translate
                                    </Button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}