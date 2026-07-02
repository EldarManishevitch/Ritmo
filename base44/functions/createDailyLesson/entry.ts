import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const today = new Date().toISOString().slice(0, 10);

    // Check if today's lesson already exists
    const existing = await base44.entities.DailyLesson.filter({ lesson_date: today }).catch(() => []);
    if (existing && existing.length) {
      const song = await base44.entities.Song.get(existing[0].song_id).catch(() => null);
      return Response.json({ lesson: existing[0], song });
    }

    // Get user progress
    const progressList = await base44.entities.UserProgress.filter({}).catch(() => []);
    const progress = progressList?.[0];
    const cefrLevel = progress?.cefr_level || 'A1';
    const favGenres = Array.isArray(progress?.fav_genres) ? progress.fav_genres : [];

    // Get completions
    const songCompletions = await base44.entities.SongCompletion.filter({}, '-created_date', 200).catch(() => []);
    const completedIds = new Set((songCompletions || []).map((c) => c.song_id).filter(Boolean));

    // Get all ready songs
    const allSongs = await base44.entities.Song.list('-created_date', 200);
    const readyStatuses = ['ready', 'ready_synced', 'ready_unsynced', 'static'];
    const readySongs = (allSongs || []).filter((s) => readyStatuses.includes(s.sync_status));

    // Get curriculum track for user's level
    const tracks = await base44.entities.CurriculumTrack.list('-cefr_level', 10).catch(() => []);
    const track = (tracks || []).find((t) => t.cefr_level === cefrLevel);

    let selectedSong = null;

    // Step 1: next uncompleted in track at CEFR level WHERE genre IN fav_genres
    if (track && track.song_ids?.length && favGenres.length) {
      const trackSongs = track.song_ids
        .map((id) => readySongs.find((s) => s.id === id))
        .filter(Boolean);
      selectedSong = trackSongs.find((s) => !completedIds.has(s.id) && favGenres.includes(s.genre));
    }

    // Step 2: any uncompleted in track at CEFR level (any genre)
    if (!selectedSong && track && track.song_ids?.length) {
      const trackSongs = track.song_ids
        .map((id) => readySongs.find((s) => s.id === id))
        .filter(Boolean);
      selectedSong = trackSongs.find((s) => !completedIds.has(s.id));
    }

    // Step 3: random ready song at CEFR level where genre IN fav_genres
    if (!selectedSong && favGenres.length) {
      const atLevel = readySongs.filter((s) =>
        s.cefr_level === cefrLevel && !completedIds.has(s.id) && favGenres.includes(s.genre)
      );
      if (atLevel.length) selectedSong = atLevel[Math.floor(Math.random() * atLevel.length)];
    }

    // Step 4: any random ready song at CEFR level
    if (!selectedSong) {
      const atLevel = readySongs.filter((s) =>
        s.cefr_level === cefrLevel && !completedIds.has(s.id)
      );
      if (atLevel.length) selectedSong = atLevel[Math.floor(Math.random() * atLevel.length)];
    }

    // Final fallback: any random ready song
    if (!selectedSong && readySongs.length) {
      selectedSong = readySongs[Math.floor(Math.random() * readySongs.length)];
    }

    if (!selectedSong) return Response.json({ error: 'No songs available' }, { status: 404 });

    const lesson = await base44.entities.DailyLesson.create({
      song_id: selectedSong.id,
      song_title: selectedSong.title,
      lesson_date: today,
      completed: false,
    });

    return Response.json({ lesson, song: selectedSong });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});