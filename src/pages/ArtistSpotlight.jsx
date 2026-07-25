import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Music2, Loader2, GraduationCap } from 'lucide-react';
import { useSongsFilter } from '@/data/hooks/useSongs';
import BlogLayout from '@/components/layout/BlogLayout';
import SEOHead from '@/components/SEOHead';
import { songCefrLevel } from '@/lib/cefr';
import { isSongReady } from '@/lib/genres';

const ARTISTS = {
  'bad-bunny': {
    name: 'Bad Bunny',
    fullName: 'Bad Bunny — Benito Antonio Martínez Ocasio',
    title: 'Learn Spanish with Bad Bunny — lyrics, translations & lessons | Spanish Beats',
    description: "Learn real Spanish from Bad Bunny's music. Tap any lyric for an instant translation, sing along with karaoke, and quiz yourself. CEFR A2–B2 level. Free to try.",
    intro: "Bad Bunny — Benito Antonio Martínez Ocasio — is the most-streamed artist in the world and the perfect teacher for real Puerto Rican Spanish. His lyrics blend everyday street Spanish, Caribbean slang, and rapid-fire Spanglish that you'll hear everywhere in Latin music. Learning Spanish through his music means learning the language people actually speak — not textbook phrases.",
    why: [
      { label: 'Puerto Rican Spanish', desc: 'clear vowels, characteristic dropped S sounds, authentic Caribbean rhythm' },
      { label: 'Vocabulary range', desc: 'A2 basics (everyday verbs, emotions) through B2 (metaphor, wordplay, cultural references)' },
      { label: 'Repetitive choruses', desc: 'hooks repeat 4-6 times per song — natural spaced repetition' },
      { label: 'Cultural context', desc: 'references to Latin street culture, reggaeton scenes, real-life situations' },
    ],
    vocab: [
      { title: 'Everyday verbs', items: ['preguntar (to ask)', 'contestar (to answer)', 'portarse (to behave)'] },
      { title: 'Emotions', items: ['cariño (affection)', 'amor (love)', 'extrañar (to miss someone)'] },
      { title: 'Puerto Rican slang', items: ['bicho (dude/thing)', 'cabrón (friend/insult depending on tone)', 'janguear (to hang out, from English "hang")'] },
    ],
    cta: { song: 'Tití Me Preguntó', text: 'Start with Tití Me Preguntó — one of the best A2 songs to learn Puerto Rican Spanish' },
    placeholders: [
      { title: 'Tití Me Preguntó', cefr: 'A2' },
      { title: 'Dákiti', cefr: 'B1' },
      { title: 'MONACO', cefr: 'B2' },
    ],
  },
  'aventura': {
    name: 'Aventura & Romeo Santos',
    fullName: 'Aventura and Romeo Santos',
    title: 'Learn Spanish with Aventura & Romeo Santos — bachata lyrics & lessons | Spanish Beats',
    description: "Learn romantic Spanish through Aventura and Romeo Santos — the kings of bachata. Real lyrics, tap-to-translate, karaoke. Dominican Spanish explained.",
    intro: "Aventura and Romeo Santos are the architects of modern bachata — the genre that's made Dominican Spanish heard worldwide. Their music is rich in romantic vocabulary, past tense narration, and the melodic Dominican accent. If you want to understand what makes Latin love songs so poetic, this is where you start.",
    why: [
      { label: 'Dominican Spanish', desc: 'characteristic merging of syllables, fast speech patterns, authentic Caribbean Spanish' },
      { label: 'Grammar in context', desc: 'past tense (preterite + imperfect) used naturally throughout every song' },
      { label: 'Romantic vocabulary', desc: 'the richest source of emotion verbs and adjective-noun agreement in music' },
      { label: 'Slower tempo than reggaeton', desc: 'easier to follow lyrics, clearer pronunciation' },
    ],
    vocab: [
      { title: 'Romantic verbs', items: ['amar (to love)', 'extrañar (to miss)', 'perdonar (to forgive)', 'olvidar (to forget)'] },
      { title: 'Emotions', items: ['dolor (pain)', 'traición (betrayal)', 'ilusión (hope/illusion)', 'soledad (loneliness)'] },
      { title: 'Dominican expressions', items: ['¿Qué lo que? (what\'s up?)', 'vaina (thing/situation)', 'tiguere (street-smart person)'] },
    ],
    cta: { song: 'Obsesión', text: 'Start with Obsesión — the bachata classic that teaches past tense naturally' },
    placeholders: [
      { title: 'Obsesión', cefr: 'A2' },
      { title: 'Propuesta Indecente', cefr: 'B1' },
      { title: 'Eres Mía', cefr: 'A2' },
    ],
  },
  'karol-g': {
    name: 'Karol G',
    fullName: 'Karol G — Carolina Giraldo Navarro',
    title: 'Learn Spanish with Karol G — reggaeton lyrics & lessons | Spanish Beats',
    description: "Learn Colombian Spanish and reggaeton through Karol G's music. Tap-to-translate lyrics, karaoke, vocab quizzes. A2–B1 level.",
    intro: "Karol G — Carolina Giraldo Navarro — brought Colombian Spanish to the top of global charts. Her music ranges from aggressive reggaeton to tender ballads, making her catalog one of the most varied for Spanish learners. You'll pick up Colombian slang, feminine empowerment vocabulary, and the paisa accent that's widely considered one of the clearest Spanish accents for learners.",
    why: [
      { label: 'Colombian Spanish (Medellín/paisa accent)', desc: 'considered one of the clearest, most standard-sounding accents for learners' },
      { label: 'Gender and adjective agreement', desc: "her lyrics frequently use feminine forms — great practice for grammatical gender" },
      { label: 'Modern slang', desc: 'parce (friend), chimba (awesome, Colombian), bacano (cool)' },
      { label: 'Range of tempo', desc: 'Tusa is slow enough for beginners; her harder tracks challenge intermediate learners' },
    ],
    vocab: [
      { title: 'Colombian slang', items: ['parce (friend)', 'chimba (awesome, Colombian)', 'bacano (cool)'] },
      { title: 'Everyday verbs', items: ['querer (to want)', 'bailar (to dance)', 'sentir (to feel)'] },
      { title: 'Empowerment vocabulary', items: ['fuerte (strong)', 'libre (free)', 'reina (queen)'] },
    ],
    cta: { song: 'Tusa', text: 'Start learning Colombian Spanish with Karol G — free to try' },
    placeholders: [
      { title: 'Tusa', cefr: 'A2' },
      { title: 'PROVENZA', cefr: 'B1' },
      { title: 'TQG', cefr: 'B1' },
    ],
  },
};

export default function ArtistSpotlight({ slug }) {
  const artist = ARTISTS[slug];
  const query = artist
    ? (slug === 'aventura'
        ? { artist: { $regex: 'Aventura|Romeo Santos', $options: 'i' } }
        : { artist: { $regex: artist.name, $options: 'i' } })
    : null;
  const { data: all = [], isLoading: loading } = useSongsFilter(query, '-created_date', 100);
  const songs = useMemo(() => (all || []).filter(isSongReady), [all]);
  const ctaSong = useMemo(
    () => artist ? (all || []).find((s) => s.title?.toLowerCase().includes(artist.cta.song.toLowerCase())) || null : null,
    [all, artist]
  );

  if (!artist) return null;

  return (
    <BlogLayout badge="Artist Spotlight">
      <SEOHead title={artist.title} description={artist.description} />
      <article>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Learn Spanish with {artist.name}</h1>
        <p className="text-muted-foreground leading-relaxed mb-8">{artist.intro}</p>

        {/* Why this artist */}
        <h2 className="text-xl font-bold text-foreground mb-4">Why {artist.name}'s music is great for learning</h2>
        <ul className="space-y-3 mb-8">
          {artist.why.map((w) => (
            <li key={w.label} className="flex gap-3">
              <span className="text-primary flex-shrink-0 mt-1">•</span>
              <div>
                <span className="font-semibold text-foreground">{w.label}:</span>{' '}
                <span className="text-muted-foreground">{w.desc}</span>
              </div>
            </li>
          ))}
        </ul>

        {/* Vocabulary */}
        <h2 className="text-xl font-bold text-foreground mb-4">What you'll learn</h2>
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {artist.vocab.map((cat) => (
            <div key={cat.title} className="rounded-2xl bg-card border border-border p-5">
              <h3 className="font-semibold text-foreground mb-3">{cat.title}</h3>
              <ul className="space-y-1.5">
                {cat.items.map((item) => (
                  <li key={item} className="text-sm text-muted-foreground">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Song grid */}
        <h2 className="text-xl font-bold text-foreground mb-4">Songs by {artist.name}</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : songs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {songs.map((song) => {
              const thumb = song.album_art_url || `https://i.ytimg.com/vi/${song.youtube_id}/mqdefault.jpg`;
              return (
                <Link key={song.id} to={`/song/${song.id}`} className="block rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/40 transition-colors">
                  <div className="aspect-square bg-muted relative">
                    <img src={thumb} alt={song.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-foreground truncate">{song.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{songCefrLevel(song)}</span>
                      {song.genre && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{song.genre}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {artist.placeholders.map((p) => (
              <div key={p.title} className="rounded-2xl bg-card border border-dashed border-border overflow-hidden">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <Music2 className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-foreground truncate">{p.title}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary inline-block mt-2">{p.cefr}</span>
                  <Link to="/dashboard" className="block text-xs text-primary font-medium mt-2 hover:underline">Generate lyrics →</Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 text-center">
          <p className="text-foreground mb-4">{artist.cta.text}</p>
          {ctaSong ? (
            <Link to={`/song/${ctaSong.id}`}>
              <Button className="bg-primary text-white">Open {artist.cta.song} <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </Link>
          ) : (
            <Link to="/register">
              <Button className="bg-primary text-white">Try Spanish Beats free <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </Link>
          )}
        </div>
      </article>
    </BlogLayout>
  );
}