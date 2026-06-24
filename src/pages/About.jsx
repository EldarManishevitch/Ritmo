import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Music } from 'lucide-react';

export default function About() {
  useEffect(() => {
    document.title = 'About — Ritmo';
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-foreground">
            <Music className="h-5 w-5 text-primary" />
            Ritmo
          </Link>
          <Link to="/dashboard" className="text-sm text-primary font-medium hover:underline">
            Open app →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <span className="inline-block text-xs font-semibold uppercase tracking-wide text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
          About
        </span>
        <h1 className="text-3xl font-bold text-foreground mb-6">About Ritmo</h1>

        <div className="prose prose-sm max-w-none text-foreground/90 space-y-4">
          <p>
            Ritmo is a language-learning app that teaches Spanish through the music you already love.
            Instead of memorizing flashcards or grinding through textbook exercises, you pick a song —
            a Bad Bunny track, a Shakira anthem, a bachata classic — and sing along with synced lyrics
            that highlight each line in real time as the music plays. Tap any word for an instant
            English translation, a pronunciation guide, and the option to save it to your personal
            vocabulary deck. It is learning by ear, by heart, and by chorus.
          </p>
          <p>
            The app is built for anyone who wants to learn Spanish but struggles with traditional
            methods — travelers, expats, music fans, and self-taught learners who want to sound
            natural instead of textbook-stiff. Whether you are starting from zero with beginner-friendly
            tracks or pushing into advanced reggaeton slang, Ritmo adapts to your level with CEFR-based
            difficulty ratings, recommended songs, and AI-powered roleplay conversations that let you
            practice real-world scenarios like ordering at a restaurant or bargaining at a market.
          </p>
          <p>
            Ritmo is built by a small team of language learners and music lovers who believe the
            fastest path to fluency is through culture, not grammar drills. Our lyrics pipeline
            combines community lyric databases with AI translation and pronunciation to deliver
            accurate, line-by-line guidance for every song. We are constantly expanding the catalog,
            refining translations, and adding new ways to practice — so you can keep learning with
            every track you discover.
          </p>
        </div>
      </main>

      <footer className="border-t border-border mt-12">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-foreground mb-2">
            <Music className="h-4 w-4 text-primary" /> Ritmo
          </Link>
          <p>Learn Spanish through synced music lyrics, instant translations, and AI roleplay.</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link to="/about" className="text-primary font-medium hover:underline">About</Link>
            <Link to="/contact" className="text-primary font-medium hover:underline">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}