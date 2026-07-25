import { base44 } from '@/api/base44Client';

export const dailyPhraseRepo = {
  byDate: (phraseDate) => base44.entities.DailyPhrase.filter({ phrase_date: phraseDate }),
  create: (data) => base44.entities.DailyPhrase.create(data),
};
