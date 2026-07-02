import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Headphones, Repeat, BookOpen, Sparkles, Mic, Music, ArrowRight } from 'lucide-react';
import BlogLayout from '@/components/layout/BlogLayout';

const STEPS = [
  { icon: Headphones, title: '1. Pick a song you actually like', body: "Motivation beats method. Start with a Reggaeton hook or a Bachata chorus that's been stuck in your head — Bad Bunny, Romeo Santos, Karol G, Aventura. If the song bores you, you won't repeat it; repetition is the whole point." },
  { icon: Repeat, title: '2. Loop the chorus, not the whole track', body: "Choruses repeat 4–6 times per song with the simplest grammar in the lyric. Loop just the chorus 5–10 times before you ever look at a translation. Your ear maps the sounds first; meaning lands faster afterward." },
  { icon: BookOpen, title: '3. Read the lyrics in Spanish first', body: 'Open the lyrics in Spanish only. Sound out every word out loud — even if you don\'t know what it means. This builds pronunciation muscle memory before English gets in the way.' },
  { icon: Sparkles, title: '4. Translate line-by-line, not word-by-word', body: 'Reggaeton and Bachata lean on idioms ("perreo", "tírame", "baby tranquila") that don\'t translate one-to-one. Get the sense of each line, mark 2–3 words you want to remember, and move on.' },
  { icon: Mic, title: '5. Sing along, badly, on purpose', body: 'Singing forces the mouth shapes Spanish actually needs — the rolled R, the soft D, the dropped final S in Caribbean accents. Karaoke is the fastest pronunciation drill ever invented.' },
  { icon: Music, title: '6. Stack a new song every 3–4 days', body: 'One song mastered is more useful than ten songs half-learned. Add a new track only when you can sing the previous chorus from memory without the lyrics in front of you.' },
];

const GENRES = [
  { name: 'Reggaeton', why: 'Repetitive hooks, conversational slang, slow-medium tempo. Bad Bunny and Karol G are the gateway.', start: '"Tití Me Preguntó" · "PROVENZA" · "Yonaguni"' },
  { name: 'Bachata', why: 'Romantic storytelling, clear enunciation, slower tempo than reggaeton. Romeo Santos and Aventura over-articulate every word — perfect for learners.', start: '"Propuesta Indecente" · "Obsesión" · "Eres Mía"' },
  { name: 'Latin Pop', why: 'Cleaner studio vocals and more standard Spanish — fewer regional slang traps. Shakira, Camilo, Rosalía.', start: '"Vivir Mi Vida" · "Tutu" · "DESPECHÁ"' },
];

const FAQ = [
  { q: 'How long until I see results?', a: 'Most learners can sing one full chorus correctly within a week and recognize ~50 new words within a month — assuming you loop the same 3–5 songs daily.' },
  { q: 'Is Reggaeton too explicit to learn from?', a: 'Some tracks are. Plenty aren\'t — and even the explicit ones teach real spoken Spanish that textbooks skip. Pick songs that match your comfort level.' },
  { q: 'Do I need to understand every word?', a: 'No. Aim for the gist of each line plus 2–3 vocabulary words you commit to memory. That\'s how native speakers acquired their first language too.' },
  { q: 'Should I start with Spain Spanish or Latin American Spanish?', a: 'Latin American — specifically Caribbean (Puerto Rico, Dominican Republic, Colombia) — because that\'s where most modern Spanish-language music comes from. The accent is musical and the vocabulary is current.' },
];

export default function HowToLearnSpanishWithMusic() {
  return (
    <BlogLayout title="How to Learn Spanish with Music — Ritmo" badge="Guide">
      <h1 className="text-3xl font-bold text-foreground mb-4">How to Learn Spanish with Music — A Practical Guide</h1>
      <p className="text-muted-foreground mb-8">A step-by-step guide to learning Spanish through Reggaeton, Bachata, and Latin pop. Why songs beat textbooks, how to study lyrics, and best genres to start.</p>

      <h2 className="text-xl font-bold text-foreground mb-3">Why music works (when classes don't)</h2>
      <p className="text-foreground mb-4 leading-relaxed">A typical reggaeton chorus repeats the same 15–20 words four to six times in three minutes. That's spaced repetition built into the format — the single most evidence-backed technique in language learning, smuggled in by a beat you'll voluntarily play on loop.</p>
      <p className="text-foreground mb-8 leading-relaxed">Bachata adds clarity: slower tempo, romantic storytelling, and singers who over-articulate every syllable. Between the two genres, you cover the rhythm of Caribbean Spanish — the accent most modern Latin music is sung in.</p>

      <h2 className="text-xl font-bold text-foreground mb-4">The six-step method</h2>
      <div className="space-y-4 mb-8">
        {STEPS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title} className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <h2 className="text-xl font-bold text-foreground mb-4">Where to start: three genres, ranked</h2>
      <div className="space-y-4 mb-8">
        {GENRES.map((g) => (
          <Card key={g.name} className="p-5">
            <h3 className="font-bold text-foreground mb-1">{g.name}</h3>
            <p className="text-sm text-primary font-medium mb-2">{g.start}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{g.why}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 mb-8 bg-primary/5 border-primary/20">
        <h2 className="text-xl font-bold text-foreground mb-2">Doing this inside Ritmo</h2>
        <p className="text-muted-foreground mb-4">Ritmo turns the six-step method into one screen. Pick any Bachata or Reggaeton track, tap any word for instant pronunciation and English meaning, loop the chorus or any verse, and save the words you want to remember to a personal vocabulary deck.</p>
        <Link to="/login">
          <Button className="bg-primary text-white">Try a song free <ArrowRight className="h-4 w-4 ml-1" /></Button>
        </Link>
      </Card>

      <h2 className="text-xl font-bold text-foreground mb-4">FAQ</h2>
      <div className="space-y-4 mb-8">
        {FAQ.map((f) => (
          <div key={f.q}>
            <h3 className="font-semibold text-foreground mb-1">{f.q}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-foreground mb-4">Related guides</h2>
      <div className="grid gap-3">
        <Link to="/learn-spanish-with/bad-bunny" className="block p-4 rounded-xl border border-border hover:border-primary transition-colors">
          <h3 className="font-semibold text-foreground">Learn Spanish with Bad Bunny →</h3>
          <p className="text-sm text-muted-foreground">The most-streamed artist — perfect for Puerto Rican Spanish.</p>
        </Link>
        <Link to="/learn-spanish-with/aventura" className="block p-4 rounded-xl border border-border hover:border-primary transition-colors">
          <h3 className="font-semibold text-foreground">Learn Spanish with Aventura &amp; Romeo Santos →</h3>
          <p className="text-sm text-muted-foreground">Bachata kings — romantic vocabulary and Dominican Spanish.</p>
        </Link>
        <Link to="/learn-spanish-with/karol-g" className="block p-4 rounded-xl border border-border hover:border-primary transition-colors">
          <h3 className="font-semibold text-foreground">Learn Spanish with Karol G →</h3>
          <p className="text-sm text-muted-foreground">Colombian reggaeton — one of the clearest accents for learners.</p>
        </Link>
        <Link to="/reggaeton-slang-guide" className="block p-4 rounded-xl border border-border hover:border-primary transition-colors">
          <h3 className="font-semibold text-foreground">Reggaeton slang guide →</h3>
          <p className="text-sm text-muted-foreground">The vocabulary every reggaeton lyric assumes you know.</p>
        </Link>
        <Link to="/dominican-slang-guide" className="block p-4 rounded-xl border border-border hover:border-primary transition-colors">
          <h3 className="font-semibold text-foreground">Dominican slang guide →</h3>
          <p className="text-sm text-muted-foreground">Bachata is sung in Dominican Spanish. Here's the cheat sheet.</p>
        </Link>
      </div>
    </BlogLayout>
  );
}