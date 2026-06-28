import { base44 } from '@/api/base44Client';

/** Tap-to-define a single word from a lyric line. */
export async function translateWord({ word, context }) {
  return base44.integrations.Core.InvokeLLM({
    prompt: `A Spanish learner tapped the word "${word}" in this lyric line:\n"${context || ''}"\n\nReturn: a literal word-for-word translation, the natural English meaning, a pronunciation guide (English letters, hyphenated by syllable, CAPS on the stressed syllable, e.g. "ba-CI-a"), the part of speech, the equivalent English slang (what English speakers would actually say), an example Spanish sentence using the word, its English translation, and whether it is slang in Spanish.`,
    response_json_schema: {
      type: 'object',
      properties: {
        literal: { type: 'string', description: 'Word-for-word translation' },
        english_meaning: { type: 'string', description: 'Natural English meaning' },
        english_slang: { type: 'string', description: 'What English speakers would actually say' },
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

/** Search YouTube for a song query. Returns an array of up to 5 video results. */
export async function youtubeSearch({ query }) {
  const res = await base44.functions.invoke('youtubeSearch', { query });
  return res.data;
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

/** Get (or create) today's daily vocabulary word. Idempotent per day. */
export async function generateDailyWord() {
  const today = new Date().toISOString().slice(0, 10);
  const existing = await base44.entities.DailyPhrase.filter({ phrase_date: today });
  if (existing.length) return existing[0];

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: 'Generate one useful everyday Spanish vocabulary word for a learner (a single word, not a phrase). Return the word, a concise English meaning, a pronunciation guide (English letters, hyphenated by syllable, CAPS on the stressed syllable, e.g. "ba-CI-a"), and the difficulty. Avoid obvious starter words like "hola", "gracias", "sí". Vary the difficulty day to day.',
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

export const SONG_GENRES = ['reggaeton', 'bachata', 'pop latino', 'trap latino', 'merengue', 'salsa', 'rock latino'];

/** Detect the real Latin music genre of a song from its title and artist. */
export async function detectGenre({ title, artist }) {
  try {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Classify the Latin music genre of the song "${title}" by "${artist || ''}". Consider the artist's known style and the song title. Respond with exactly one genre.`,
      response_json_schema: {
        type: 'object',
        properties: { genre: { type: 'string', enum: SONG_GENRES } },
        required: ['genre'],
      },
    });
    return SONG_GENRES.includes(res?.genre) ? res.genre : 'pop latino';
  } catch {
    return 'pop latino';
  }
}

/** Check whether a song is Spanish-language before saving it. */
export async function isSpanishSong({ title, artist }) {
  try {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Is the song "${title}" by "${artist || ''}" a Spanish-language song? Consider the title, artist, and the artist's known genre/language. Answer with a boolean "is_spanish" and a short reason.`,
      response_json_schema: {
        type: 'object',
        properties: { is_spanish: { type: 'boolean' }, reason: { type: 'string' } },
        required: ['is_spanish'],
      },
    });
    return res?.is_spanish === true;
  } catch {
    return true;
  }
}

/** Generate a full 5-turn roleplay scene in a real Latin setting, tuned to the user's CEFR level. */
export async function generateRoleplayScene({ level }) {
  return base44.integrations.Core.InvokeLLM({
    prompt: `Generate a 5-turn Spanish roleplay scene for a learner. CEFR level: ${level || 'A1'}. Location: pick a real Latin city and venue (e.g. a Havana mojito bar, a Cartagena beach, a Medellín reggaeton club, a colmado in Santo Domingo). The learner steps through the scene turn by turn: each step is one line the character says to them, followed by a suggested reply the learner can give. Keep language natural and at the right level. Return: scenario_title, character_name, location, and dialogue_steps (exactly 5 items) each with spanish_text (the character's line), pronunciation (English-letter phonetics hyphenated by syllable, CAPS on the stressed syllable), english_translation, and suggested_reply (a natural Spanish reply the learner could say).`,
    response_json_schema: {
      type: 'object',
      properties: {
        scenario_title: { type: 'string' },
        character_name: { type: 'string' },
        location: { type: 'string' },
        dialogue_steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              spanish_text: { type: 'string' },
              pronunciation: { type: 'string' },
              english_translation: { type: 'string' },
              suggested_reply: { type: 'string' },
            },
            required: ['spanish_text', 'english_translation', 'suggested_reply'],
          },
        },
      },
      required: ['scenario_title', 'character_name', 'location', 'dialogue_steps'],
    },
  });
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