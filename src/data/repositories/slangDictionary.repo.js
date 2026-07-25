import { base44 } from '@/api/base44Client';

export const slangDictionaryRepo = {
  all: (limit = 500) => base44.entities.SlangDictionary.filter({}, 'term', limit),
  filter: (query, sort, limit) => base44.entities.SlangDictionary.filter(query, sort, limit),
  bySong: (songId, sort, limit) => base44.entities.SlangDictionary.filter({ song_id: songId }, sort, limit),
};
