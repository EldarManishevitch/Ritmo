import React from 'react';
import { Link } from 'react-router-dom';
import { MousePointer, Music2, GraduationCap, Music } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import InteractiveLyrics from '@/components/landing/InteractiveLyrics';
import TopNav from '@/components/layout/TopNav';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Learn Spanish by singing Bad Bunny, Aventura & Karol G | Spanish Beats"
        description="Learn Spanish through real music — Bad Bunny, Aventura, Shakira, and more. Tap any word for an instant translation. Karaoke lyrics synced to YouTube. AI voice coach. Start free."
      />

      {/* Top nav */}
      <TopNav />

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-16 pb-12 text-center">
        <h1 className="text-3xl md:text-[40px] font-bold text-foreground mb-4 leading-tight">
          Learn Spanish by singing Bad Bunny, Aventura & Karol G
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Tap any word for an instant translation. Sing along with karaoke lyrics synced to YouTube. Build real street Spanish — not textbook Spanish.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <Link to="/register">
            <button className="bg-primary text-white px-6 py-3 rounded-full text-base font-semibold hover:bg-primary/90 transition-colors">
              Start free →
            </button>
          </Link>
          <a href="#demo">
            <button className="border border-border text-foreground px-6 py-3 rounded-full text-base font-semibold hover:bg-muted transition-colors">
              See how it works ↓
            </button>
          </a>
        </div>
        <p className="text-sm text-muted-foreground">
          Join learners studying through 59 real songs from Bad Bunny, Aventura, Shakira, Karol G and more
        </p>
      </section>

      {/* Interactive demo */}
      <section id="demo" className="max-w-2xl mx-auto px-4 py-12 scroll-mt-20">
        <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Try it — no sign-up needed</h2>
        <p className="text-muted-foreground text-center mb-8">
          Here's a real chorus from 'Tití Me Preguntó' by Bad Bunny. Tap any word.
        </p>
        <InteractiveLyrics />
      </section>

      {/* Feature cards */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-card border border-border p-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <MousePointer className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Tap any word, get instant translation</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Understand every word Bad Bunny raps. Tap to translate, hear the pronunciation, save to your vocab. No pausing, no Googling — learn in the flow of the music.
            </p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Music2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Karaoke lyrics synced to the song</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Lyrics scroll and highlight in real time as the YouTube video plays. Slow down to 0.5× for fast rap verses. Replay any section until it sticks.
            </p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-foreground mb-2">CEFR curriculum A1→C1 with certificates</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A structured learning path from beginner to advanced — using real reggaeton, bachata, and pop latino. Complete 8 songs per level and earn a shareable certificate.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-card border border-border p-6">
            <p className="text-sm text-foreground leading-relaxed mb-4">
              "I finally understand what Bad Bunny is saying. Picked up 50 new words in my first week."
            </p>
            <p className="text-xs text-muted-foreground">— Maria S., New York</p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-6">
            <p className="text-sm text-foreground leading-relaxed mb-4">
              "The karaoke mode is addictive. I replay choruses until I've got the pronunciation right."
            </p>
            <p className="text-xs text-muted-foreground">— Jake T., London</p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-6">
            <p className="text-sm text-foreground leading-relaxed mb-4">
              "Finally an app that teaches the Spanish people actually speak — not 'where is the library?'"
            </p>
            <p className="text-xs text-muted-foreground">— Ana C., Miami</p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-3">Start learning with your first song</h2>
        <p className="text-muted-foreground mb-6">Free to start. No credit card needed.</p>
        <Link to="/register">
          <button className="bg-primary text-white px-8 py-3 rounded-full text-base font-semibold hover:bg-primary/90 transition-colors">
            Try Spanish Beats free →
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-2 font-bold text-foreground mb-2">
            <Music className="h-4 w-4 text-primary" /> Spanish Beats
          </div>
          <p className="text-sm text-muted-foreground">
            Learn Spanish through synced music lyrics, instant translations, and AI roleplay.
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link to="/about" className="text-sm text-primary font-medium hover:underline">
              About
            </Link>
            <Link to="/contact" className="text-sm text-primary font-medium hover:underline">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}