import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import BlogLayout from '@/components/layout/BlogLayout';

const PICKS = [
  { rank: 1, title: 'Tití Me Preguntó', artist: 'Bad Bunny', level: 'Intermediate', slang: '"tití" = auntie · "jeva" = girl', why: "A spoken-word verse over a slow Dembow groove. Bad Bunny's diction is unusually clean here, and the chorus is built on one repeated question, so the grammar sticks fast." },
  { rank: 2, title: 'TQG', artist: 'Karol G & Shakira', level: 'Beginner', slang: '"TQG" = te quedó grande (you couldn\'t handle me)', why: 'Two singers, two accents — Colombian and Barranquilla — back to back. Lyrics are conversational present-tense, perfect for picking up everyday verbs.' },
  { rank: 3, title: 'Provenza', artist: 'Karol G', level: 'Beginner', slang: '"bebecita" = baby · "linda" = pretty', why: 'Karol G enunciates every syllable on this one. The chorus loops 6 times and uses simple commands (ven, llama, dime) you\'ll actually use in conversation.' },
  { rank: 4, title: 'Despacito', artist: 'Luis Fonsi & Daddy Yankee', level: 'Beginner', slang: '"despacito" = slowly · "pasito a pasito" = step by step', why: 'The most famous Reggaeton song ever and the easiest to study — diminutives in every line teach you a core Spanish grammar pattern (–ito / –ita) without a textbook.' },
  { rank: 5, title: 'Me Porto Bonito', artist: 'Bad Bunny & Chencho Corleone', level: 'Intermediate', slang: '"me porto bonito" = I\'ll behave · "bellaco" = horny/up to no good', why: 'Puerto Rican slang heavy — perfect once you\'ve mastered textbook Spanish and want the real island accent. Listen for the dropped final S ("loh" instead of "los").' },
  { rank: 6, title: 'Gasolina', artist: 'Daddy Yankee', level: 'Beginner', slang: '"a ella le gusta" = she likes · "dale" = go for it / OK', why: 'The song that launched the genre. The hook is 4 words long and the verses are short imperative phrases — the easiest Reggaeton track to sing along to from day one.' },
  { rank: 7, title: 'Todo de Ti', artist: 'Rauw Alejandro', level: 'Beginner', slang: '"todo de ti" = everything about you', why: 'Synth-pop Reggaeton with a slower-than-average BPM. Rauw\'s pronunciation is one of the clearest in the genre, and the love-song vocabulary is high-yield.' },
  { rank: 8, title: 'Con Calma', artist: 'Daddy Yankee & Snow', level: 'Beginner', slang: '"con calma" = chill / take it easy', why: 'Repetitive on purpose — the chorus is literally two words. Use it to drill the rolled R in "calma" and the soft Caribbean D in "dale".' },
  { rank: 9, title: 'Mi Gente', artist: 'J Balvin & Willy William', level: 'Beginner', slang: '"mi gente" = my people · "prende" = light it up', why: 'Almost the entire song is built from 20 words. Great early track for getting comfortable with possessives (mi, tu, su) and the imperative.' },
  { rank: 10, title: 'Hawái', artist: 'Maluma', level: 'Intermediate', slang: '"fingir" = to fake · "postureo" = showing off', why: 'A breakup ballad with a Reggaeton beat. The verses use the present tense to tell a complete story — ideal for jumping from beginner choruses to following narrative lyrics.' },
];

export default function BestReggaetonSongs() {
  return (
    <BlogLayout title="10 Best Reggaeton Songs to Learn Spanish — Ritmo" badge="Song list">
      <h1 className="text-3xl font-bold text-foreground mb-4">10 Best Reggaeton Songs to Learn Spanish</h1>
      <p className="text-muted-foreground mb-8">10 Reggaeton songs perfect for Spanish learners — slow hooks, clean slang, and unforgettable choruses from Bad Bunny, Karol G, Daddy Yankee, and Rauw Alejandro.</p>

      <div className="space-y-4 mb-8">
        {PICKS.map((p) => (
          <Card key={p.rank} className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                {p.rank}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-foreground">{p.title}</h2>
                  <span className="text-muted-foreground">— {p.artist}</span>
                </div>
                <Badge variant={p.level === 'Beginner' ? 'default' : 'secondary'} className="mb-2">{p.level}</Badge>
                <p className="text-sm text-primary font-medium mb-2">Slang to learn: {p.slang}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.why}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <h2 className="text-xl font-bold text-foreground mb-3">How we picked these</h2>
      <p className="text-foreground mb-4 leading-relaxed">Every song on this list passes three filters: a hook that repeats at least four times (so the grammar sticks), clean enough enunciation that a beginner can actually catch the words, and slang that's common enough to use outside the song. Most lists rank by chart position — this one ranks by how fast each track will move your Spanish forward.</p>

      <p className="text-foreground mb-8">For the deeper slang glossary (perreo, bellaco, dale, jevita), see the <Link to="/reggaeton-slang-guide" className="text-primary font-medium hover:underline">Reggaeton Slang Guide</Link>. For the underlying method, see <Link to="/how-to-learn-spanish-with-music" className="text-primary font-medium hover:underline">How to Learn Spanish with Music</Link>.</p>

      <Card className="p-6 bg-primary/5 border-primary/20">
        <h2 className="text-xl font-bold text-foreground mb-2">Study these songs the smart way</h2>
        <p className="text-muted-foreground mb-4">Ritmo loads any Reggaeton track with synced lyrics, tap-to-translate words, and a per-section quiz so you actually remember the slang.</p>
        <Link to="/login"><Button className="bg-primary text-white">Start a song <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
      </Card>

      <h2 className="text-xl font-bold text-foreground mb-4">Learn with these artists</h2>
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        <Link to="/learn-spanish-with/bad-bunny" className="block p-4 rounded-xl border border-border hover:border-primary transition-colors">
          <h3 className="font-semibold text-foreground">Bad Bunny →</h3>
          <p className="text-sm text-muted-foreground">Puerto Rican reggaeton</p>
        </Link>
        <Link to="/learn-spanish-with/karol-g" className="block p-4 rounded-xl border border-border hover:border-primary transition-colors">
          <h3 className="font-semibold text-foreground">Karol G →</h3>
          <p className="text-sm text-muted-foreground">Colombian reggaeton</p>
        </Link>
      </div>
    </BlogLayout>
  );
}