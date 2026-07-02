// Sync statuses that indicate a song is ready for users to view.
export const READY_STATUSES = ['ready', 'ready_synced', 'ready_unsynced', 'static'];

// Statuses that indicate the song is actively processing.
export const IN_PROGRESS_STATUSES = ['pending', 'fetching_lyrics', 'translating'];

// Statuses that indicate the song failed to load.
export const FAILED_STATUSES = ['failed', 'failed_permanent'];

/** True if the song has usable lyrics (ready, synced, unsynced, or static). */
export const isSongReady = (song) => READY_STATUSES.includes(song?.sync_status);

/** Filter a list of songs to only those ready for display. */
export const filterReadySongs = (songs) => (songs || []).filter(isSongReady);