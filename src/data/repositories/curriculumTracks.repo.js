import { base44 } from '@/api/base44Client';

export const curriculumTracksRepo = {
  list: (sort = '-cefr_level', limit = 10) => base44.entities.CurriculumTrack.list(sort, limit),
};
