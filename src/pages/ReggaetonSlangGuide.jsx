import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight } from 'lucide-react';
import BlogLayout from '@/components/layout/BlogLayout';

const SLANG = [
  { term: 'perreo', contextual: 'The grinding dance style; by extension, the genre itself', literal: 'from "perro" (dog)', english: 'grinding / doggy-style dancing', song: { title: 'Gasolina', artist: 'Daddy Yankee' } },
  { term: 'bellaco / bellaca', contextual: 'horny, up to no good, sexually forward', literal: 'wicked / sly', english: 'horny / frisky', song: { title: 'Me Porto Bonito', artist: 'Bad Bunny' } },
  { term: 'dale', contextual: 'go for it, come on, OK — the universal reggaeton ad-lib', literal: 'give it', english: 'go ahead / come on', song: { title: 'Gasolina', artist: 'Daddy Yankee' } },
  { term: 'jeva', contextual: 'girlfriend, or an attractive woman', literal: '—', english: 'girl / babe', song: { title: 'Tití Me Preguntó', artist: 'Bad Bunny' } },
  { term: 'tití', contextual: 'auntie — Caribbean term of endearment for a woman', literal: 'aunt', english: 'auntie', song: { title: 'Tití Me Preguntó', artist: 'Bad Bunny' } },
  { term: 'flow', contextual: "style, swagger, a rapper's rhythm and delivery", literal: 'English loan', english: 'flow / vibe', song: { title: 'Yo Perreo Sola', artist: 'Bad Bunny' } },
  { term: 'papi', contextual: 'term of address for a man — flirtatious or affectionate', literal: 'daddy', english: 'baby / daddy', song: { title: 'Dákiti', artist: 'Bad Bunny' } },
  { term: 'mami', contextual: 'term of address for a woman — flirtatious or affectionate', literal: 'mommy', english: 'baby / mami', song: { title: 'Tusa', artist: 'Karol G' } },
  { term: 'fronteo', contextual: 'fronting, showing off, acting tough', literal: 'from English "front"', english: 'fronting / faking', song: { title: 'Safaera', artist: 'Bad Bunny' } },
  { term: 'perrea', contextual: 'imperative: grind! dance!', literal: 'from "perro"', english: 'grind on it', song: { title: 'Yo Perreo Sola', artist: 'Bad Bunny' } },
  { term: 'romper', contextual: 'to kill it, to crush a verse, to do amazing', literal: 'to break', english: 'to crush it', song: { title: 'Vuelve', artist: 'Bad Bunny' } },
  { term: 'darle', contextual: 'go for it, give it everything', literal: 'give it', english: 'go hard', song: { title: 'Mi Gente', artist: 'J Balvin' } },
  { term: 'bebecita', contextual: 'baby — diminutive flirtatious term', literal: 'little baby', english: 'baby girl', song: { title: 'PROVENZA', artist: 'Karol G' } },
  { term: 'postureo', contextual: 'showing off, faking a lifestyle', literal: 'from "posture"', english: 'posing / flexing', song: { title: 'Hawái', artist: 'Maluma' } },
  { term: 'tírame', contextual: 'throw at me, give me — used for attention or drinks', literal: 'throw me', english: 'hit me up', song: { title: 'Tírate', artist: 'Bad Bunny' } },
  { term: 'real', contextual: 'authentic, true to yourself — common ad-lib', literal: 'real', english: 'real / legit', song: { title: 'Yo Perreo Sola', artist: 'Bad Bunny' } },
];

const CURSE_WORDS = [
  { term: 'coño', meaning: 'Damn / shit', intensity: 'mild', note: "Universally used as an exclamation of surprise or frustration. In Spain and the Caribbean it's the everyday filler curse." },
  { term: 'joder', meaning: 'To fuck / fuck!', intensity: 'strong', note: "Heard constantly in reggaeton hooks. As an interjection it just means 'damn it'." },
  { term: 'mierda', meaning: 'Shit', intensity: 'mild', note: 'Same range of uses as in English — both literal and exclamatory.' },
  { term: 'puta', meaning: 'Whore / bitch', intensity: 'very strong', note: "Highly offensive when directed at someone. In slang phrases like '¡qué puta madre!' it's an intensifier, not a name." },
  { term: 'cabrón', meaning: 'Bastard / dude', intensity: 'strong', note: "Can be an insult or, between friends, an affectionate 'dude'. Tone and region decide which." },
  { term: 'pendejo', meaning: 'Idiot / dumbass', intensity: 'strong', note: 'Mexican staple. Calling someone pendejo is a real insult, not playful.' },
  { term: 'carajo', meaning: 'Hell / damn', intensity: 'mild', note: "'Vete al carajo' = 'go to hell'. Common in Puerto Rican reggaeton ad-libs." },
  { term: 'chingar', meaning: 'To fuck / mess up', intensity: 'very strong', note: "Mexico's most loaded verb — 'no chingues' ranges from 'no way' to 'don't mess with me'." },
  { term: 'verga', meaning: 'Dick', intensity: 'very strong', note: "Literal meaning is vulgar, but 'a la verga' is a generic 'what the hell' across Mexico and Central America." },
  { term: 'culero', meaning: 'Asshole', intensity: 'strong', note: 'Stronger than pendejo. Common in Mexican and Central American lyrics.' },
  { term: 'hijo de puta', meaning: 'Son of a bitch', intensity: 'very strong', note: 'Universally understood, universally strong. Shortened to HP in lyrics and chats.' },
  { term: 'maldito', meaning: 'Damn / damned', intensity: 'mild', note: "Adjective form of a curse. 'Maldita sea' = 'damn it'." },
];

const INTENSITY_COLOR = { mild: 'secondary', strong: 'default', 'very strong': 'destructive' };

export default function ReggaetonSlangGuide() {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return SLANG;
    return SLANG.filter((s) =>
      [s.term, s.contextual, s.english, s.literal, s.song?.title || '', s.song?.artist || '']
        .join(' ').toLowerCase().includes(needle)
    );
  }, [q]);

  const filteredCurses = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return CURSE_WORDS;
    return CURSE_WORDS.filter((w) => `${w.term} ${w.meaning} ${w.note}`.toLowerCase().includes(needle));
  }, [q]);

  return (
    <BlogLayout title="Reggaeton Slang & Spanish Curse Words — Ritmo" badge="Lyrics guide">
      <h1 className="text-3xl font-bold text-foreground mb-4">Reggaeton Slang & Spanish Curse Words</h1>
      <p className="text-muted-foreground mb-6 leading-relaxed">If you've ever sung along to Bad Bunny, Karol G, Daddy Yankee, J Balvin, or Anuel AA and wondered what half the words mean, you're in the right place. Standard Spanish textbooks skip the slang. Reggaeton, Latin trap, and dembow are built on it. This is a searchable, song-grounded reference to the urban Spanish slang and curse words you'll hear in real lyrics.</p>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a word, a meaning, or a song…"
          className="w-full pl-10 pr-4 h-12 rounded-lg border border-input bg-transparent text-base"
        />
      </div>

      <h2 className="text-xl font-bold text-foreground mb-3">Why reggaeton Spanish is its own dialect</h2>
      <p className="text-foreground mb-8 leading-relaxed">Most reggaeton was born in Puerto Rico, then absorbed influences from Panama, the Dominican Republic, Colombia, and Mexico. The vocabulary that ended up in the hooks isn't generic "Spanish" — it's a blend of Caribbean street slang, AAVE-style English loans ("flow", "blunt", "real"), and producer-room shorthand. A word like <em>perreo</em> has no clean translation; the closest English gets is "grinding to the beat", but in Puerto Rico it also names the entire dance style and, by extension, the genre.</p>

      <h2 className="text-xl font-bold text-foreground mb-2">Urban Spanish slang dictionary</h2>
      <p className="text-sm text-muted-foreground mb-4">{filtered.length} term{filtered.length === 1 ? '' : 's'} from real reggaeton, trap, and dembow lyrics.</p>
      <div className="space-y-3 mb-8">
        {filtered.map((s) => (
          <Card key={s.term} className="p-5">
            <Link to={`/slang/${encodeURIComponent(s.term)}`}>
              <h3 className="text-lg font-bold text-foreground mb-2 hover:text-primary transition-colors">{s.term}</h3>
            </Link>
            <p className="text-sm text-foreground mb-1"><strong>Means:</strong> {s.contextual}</p>
            {s.english && <p className="text-sm text-muted-foreground mb-1"><strong>English equivalent:</strong> {s.english}</p>}
            {s.literal && <p className="text-sm text-muted-foreground mb-1"><strong>Literal:</strong> {s.literal}</p>}
            {s.song && (
              <p className="text-xs text-primary font-medium mt-2">Heard in "{s.song.title}" — {s.song.artist}</p>
            )}
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-muted-foreground text-center py-8">No slang terms matched "{q}".</p>}
      </div>

      <h2 className="text-xl font-bold text-foreground mb-4">Spanish curse words you'll hear in lyrics</h2>
      <p className="text-muted-foreground mb-4">Strong language is part of the genre. Knowing which words are actual insults vs. ambient swearing keeps you from misreading a verse — or accidentally insulting someone in conversation.</p>
      <div className="space-y-3 mb-8">
        {filteredCurses.map((w) => (
          <Card key={w.term} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-foreground">{w.term}</h3>
              <Badge variant={INTENSITY_COLOR[w.intensity]}>{w.intensity}</Badge>
            </div>
            <p className="text-sm text-foreground mb-1"><strong>Translates to:</strong> {w.meaning}</p>
            <p className="text-sm text-muted-foreground">{w.note}</p>
          </Card>
        ))}
        {filteredCurses.length === 0 && <p className="text-muted-foreground text-center py-8">No curse words matched "{q}".</p>}
      </div>

      <Card className="p-6 mb-8 bg-primary/5 border-primary/20">
        <h2 className="text-xl font-bold text-foreground mb-2">Want to learn these words inside real songs?</h2>
        <p className="text-muted-foreground mb-4">Ritmo turns reggaeton, Latin trap, and dembow tracks into interactive Spanish lessons — line-by-line translations, pronunciation, and quizzes on the exact slang above.</p>
        <Link to="/login"><Button className="bg-primary text-white">Start learning Spanish with songs <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
      </Card>

      <h2 className="text-xl font-bold text-foreground mb-4">Learn Spanish with these artists</h2>
      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        <Link to="/learn-spanish-with/bad-bunny" className="block p-4 rounded-xl border border-border hover:border-primary transition-colors">
          <h3 className="font-semibold text-foreground">Bad Bunny →</h3>
          <p className="text-sm text-muted-foreground">Puerto Rican reggaeton slang</p>
        </Link>
        <Link to="/learn-spanish-with/karol-g" className="block p-4 rounded-xl border border-border hover:border-primary transition-colors">
          <h3 className="font-semibold text-foreground">Karol G →</h3>
          <p className="text-sm text-muted-foreground">Colombian reggaeton & slang</p>
        </Link>
        <Link to="/learn-spanish-with/aventura" className="block p-4 rounded-xl border border-border hover:border-primary transition-colors">
          <h3 className="font-semibold text-foreground">Aventura &amp; Romeo Santos →</h3>
          <p className="text-sm text-muted-foreground">Dominican bachata slang</p>
        </Link>
      </div>
    </BlogLayout>
  );
}