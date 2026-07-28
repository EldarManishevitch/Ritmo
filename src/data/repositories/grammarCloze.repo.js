import { base44 } from '@/api/base44Client';

export const grammarClozeRepo = {
  byLevel: (cefrLevel) => base44.entities.GrammarCloze.filter({ cefr_level: cefrLevel }, 'sort_order', 20),
};
