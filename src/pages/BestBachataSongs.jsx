import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import BlogLayout from '@/components/layout/BlogLayout';

const PICKS = [
  { rank: 1, title: 'Obsesión', artist: 'Aventura', level: 'Beginner', slang: '"es solo una obsesión" = it\'s just an obsession · "jevita" = girl', why: 'The chorus loops the same four-line confession over and over — by the third repeat you\'re singing the conditional tense ("sería", "daría") without realizing it. The verses are slow enough to hear every dropped \'s\'.' },
  { rank: 2, title: 'Propuesta Indecente', artist: 'Romeo Santos', level: 'Beginner', slang: '"propuesta indecente" = indecent proposal · "vaina" = thing', why: 'Romeo\'s diction is the cleanest in the genre and the hook asks one direct question on repeat. Great for picking up the polite-question construction ("¿te gustaría...?") you\'ll actually use in real conversations.' },
  { rank: 3, title: 'Burbujas de Amor', artist: 'Juan Luis Guerra', level: 'Beginner', slang: '"burbujas" = bubbles · "pecera" = fishbowl', why: 'Juan Luis Guerra sings like a Spanish teacher — every syllable lands. The lyrics are poetic but built from concrete nouns, so beginners can follow the imagery without a translator.' },
  { rank: 4, title: 'Eres Mía', artist: 'Romeo Santos', level: 'Beginner', slang: '"eres mía" = you are mine · "chin" = a little bit', why: 'The chorus is two words repeated for emphasis — the easiest way to internalize the verb "ser" in second person. Bonus: a Dominican slang word ("chin") slipped into every verse.' },
  { rank: 5, title: 'Bachata Rosa', artist: 'Juan Luis Guerra', level: 'Intermediate', slang: '"te regalo" = I gift you · "una rosa" = a rose', why: 'Pure storytelling Bachata. The verses walk through a list of gifts that drills the indirect-object pronoun "te" in context — one of the trickiest patterns for English speakers.' },
  { rank: 6, title: 'Volví', artist: 'Aventura & Bad Bunny', level: 'Intermediate', slang: '"volví" = I came back · "loco" = man/dude', why: 'Two accents back-to-back: Romeo\'s Dominican-Bronx and Bad Bunny\'s Puerto Rican. Same word, two pronunciations — the fastest way to train your ear for regional differences in the same song.' },
  { rank: 7, title: 'Te Extraño', artist: 'Xtreme', level: 'Beginner', slang: '"te extraño" = I miss you · "mi vida" = my love', why: 'The hook is the title repeated — once you learn how Spanish builds "to miss" (literally "you extrange me"), the rest of the song clicks. Slow tempo and a single emotion make it ideal early listening.' },
  { rank: 8, title: 'Darte un Beso', artist: 'Prince Royce', level: 'Beginner', slang: '"darte un beso" = to give you a kiss · "papi chulo" = lover boy', why: 'Prince Royce was raised in New York, so his Spanish is unusually clear for non-native ears. The chorus drills the infinitive construction ("quiero darte", "voy a darte") that\'s everywhere in spoken Spanish.' },
  { rank: 9, title: 'Su Veneno', artist: 'Aventura', level: 'Intermediate', slang: '"su veneno" = her poison · "deja eso" = let it go', why: 'Story-song format with a clear beginning, middle, and end — perfect for jumping from one-chorus listening to following narrative lyrics. Heavy on Dominican expressions you\'ll hear in DR street Spanish.' },
  { rank: 10, title: 'Ojalá Que Llueva Café', artist: 'Juan Luis Guerra', level: 'Intermediate', slang: '"ojalá" = I hope / may it · "llueva" = (it) rains (subjunctive)', why: 'The single best song to internalize the Spanish subjunctive. "Ojalá" forces a subjunctive verb after it, and the whole song is built on the pattern — by the end you\'ve practiced 8 different conjugations.' },
];

export default function BestBachataSongs() {
  return (
    <BlogLayout title="10 Best Bachata Songs to Learn Spanish — Ritmo" badge="Song list">
      <h1 className="text-3xl font-bold text-foreground mb-4">10 Best Bachata Songs to Learn Spanish</h1>
      <p className="text-muted-foreground mb-8">10 Bachata tracks perfect for Spanish learners — clean enunciation, repetitive hooks, and Dominican slang from Romeo Santos, Aventura, and Juan Luis Guerra.</p>

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
      <p className="text-foreground mb-4 leading-relaxed">Every Bachata on this list passes three filters: a hook that repeats at least four times (so the grammar sticks), enunciation clean enough that a beginner can catch the words despite the famous Dominican dropped 's', and slang or grammar that's common enough to use outside the song.</p>

      <p className="text-foreground mb-8">For the deeper Dominican vocabulary (vaina, jevita, qué lo qué, dímelo), see the <Link to="/dominican-slang-guide" className="text-primary font-medium hover:underline">Dominican Slang Guide</Link>. For the underlying method, see <Link to="/how-to-learn-spanish-with-music" className="text-primary font-medium hover:underline">How to Learn Spanish with Music</Link>. Prefer urban beats? <Link to="/best-reggaeton-songs" className="text-primary font-medium hover:underline">Best Reggaeton Songs to Learn Spanish</Link>.</p>

      <Card className="p-6 bg-primary/5 border-primary/20">
        <h2 className="text-xl font-bold text-foreground mb-2">Study these Bachatas the smart way</h2>
        <p className="text-muted-foreground mb-4">Ritmo loads any Bachata track with synced lyrics, tap-to-translate words, and a per-section quiz so you actually remember the Dominican slang.</p>
        <Link to="/login"><Button className="bg-primary text-white">Start a song <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
      </Card>
    </BlogLayout>
  );
}