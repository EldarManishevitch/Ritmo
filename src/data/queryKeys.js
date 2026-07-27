// Centralized query-key factory so every hook builds keys the same way —
// avoids typo'd/inconsistent keys across call sites, which silently breaks
// cache invalidation.
export const queryKeys = {
  songs: {
    all: ['songs'],
    list: (sort, limit) => ['songs', 'list', sort, limit],
    filter: (query) => ['songs', 'filter', query],
    detail: (id) => ['songs', 'detail', id],
  },
  lyricLines: {
    bySong: (songId) => ['lyricLines', 'bySong', songId],
  },
  savedWords: {
    list: (sort, limit) => ['savedWords', 'list', sort, limit],
    filter: (query) => ['savedWords', 'filter', query],
    bySong: (songId) => ['savedWords', 'bySong', songId],
  },
  practiceFlags: {
    list: (sort, limit) => ['practiceFlags', 'list', sort, limit],
    bySong: (songId) => ['practiceFlags', 'bySong', songId],
  },
  roleplaySessions: {
    filter: (query) => ['roleplaySessions', 'filter', query],
  },
  slangDictionary: {
    all: ['slangDictionary', 'all'],
    bySong: (songId) => ['slangDictionary', 'bySong', songId],
  },
  curriculumTracks: {
    list: ['curriculumTracks', 'list'],
  },
  levelProgress: {
    list: ['levelProgress', 'list'],
    byLevel: (cefrLevel) => ['levelProgress', 'byLevel', cefrLevel],
  },
  conversations: {
    list: ['conversations', 'list'],
  },
  certificates: {
    list: (sort, limit) => ['certificates', 'list', sort, limit],
  },
  userProgress: {
    current: ['userProgress', 'current'],
  },
  searchHistory: {
    list: (sort, limit) => ['searchHistory', 'list', sort, limit],
  },
  genreStats: {
    list: (sort, limit) => ['genreStats', 'list', sort, limit],
  },
  songCompletions: {
    list: (sort, limit) => ['songCompletions', 'list', sort, limit],
  },
  weeklyXp: {
    byWeek: (weekStart) => ['weeklyXp', 'byWeek', weekStart],
  },
};
