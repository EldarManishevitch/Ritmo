import { base44 } from '@/api/base44Client';

/** Tap-to-define a single word from a lyric line. */
export async function translateWord({ word, context }) {
  return base44.integrations.Core.InvokeLLM({
    prompt: `A Spanish learner tapped the word "${word}" in this lyric line:\n"${context || ''}"\n\nReturn the English meaning, a pronunciation guide (English letters, hyphenated by syllable, CAPS on the stressed syllable, e.g. "ba-CI-a"), the part of speech, an example Spanish sentence using the word, its English translation, and whether it is slang.`,
    response_json_schema: {
      type: 'object',
      properties: {
        english_meaning: { type: 'string' },
        pronunciation: { type: 'string' },
        part_of_speech: { type: 'string' },
        example_spanish: { type: 'string' },
        example_english: { type: 'string' },
        is_slang: { type: 'boolean' },
      },
      required: ['english_meaning', 'pronunciation'],
    },
  });
}

/** Find the official YouTube video for a song query. */
export async function youtubeSearch({ query }) {
  return base44.integrations.Core.InvokeLLM({
    prompt: `Find the official YouTube video for the song: "${query}". Return the 11-character YouTube video ID, the full video title, the artist/channel name, the duration in seconds, and the thumbnail URL (https://i.ytimg.com/vi/<ID>/hqdefault.jpg).`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        youtube_id: { type: 'string' },
        title: { type: 'string' },
        artist: { type: 'string' },
        duration_seconds: { type: 'number' },
        thumbnail_url: { type: 'string' },
      },
      required: ['youtube_id', 'title'],
    },
  });
}

/** Get (or create) today's daily phrase. Idempotent per day. */
export async function generateDailyPhrase() {
  const today = new Date().toISOString().slice(0, 10);
  const existing = await base44.entities.DailyPhrase.filter({ phrase_date: today });
  if (existing.length) return existing[0];

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: 'Generate one useful everyday Spanish phrase for a learner. Include the Spanish phrase, a natural English translation, and a pronunciation guide (English letters, hyphenated by syllable, CAPS on the stressed syllable). Vary the difficulty.',
    response_json_schema: {
      type: 'object',
      properties: {
        spanish_phrase: { type: 'string' },
        english_translation: { type: 'string' },
        pronunciation: { type: 'string' },
        difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
      },
      required: ['spanish_phrase', 'english_translation', 'pronunciation', 'difficulty'],
    },
  });

  return base44.entities.DailyPhrase.create({ phrase_date: today, ...result });
}

/** Generate the next assistant turn in a roleplay conversation. */
export async function generateRoleplay({ roleplayType, scenario, history }) {
  return base44.integrations.Core.InvokeLLM({
    prompt: `You are a friendly Spanish conversation partner for a learner. Roleplay scenario: ${roleplayType || 'smalltalk'}.${scenario ? ' Context: ' + scenario : ''} Keep replies short and natural (1-3 sentences in Spanish). Always also provide an English translation. Conversation so far:\n${JSON.stringify(history || [])}`,
    response_json_schema: {
      type: 'object',
      properties: {
        spanish_response: { type: 'string' },
        english_translation: { type: 'string' },
      },
      required: ['spanish_response', 'english_translation'],
    },
  });
}