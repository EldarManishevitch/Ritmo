import React from 'react';
import { Link } from 'react-router-dom';
import { Music4, Sparkles, MessageCircle, ArrowRight, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <Music4 className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-foreground">Spanish Beats</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
          <Link to="/register"><Button size="sm">Get started</Button></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-12 pb-20 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
          <Sparkles className="h-3.5 w-3.5" /> Learn Spanish through music
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
          Master Spanish one <span className="text-primary">song</span> at a time
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Synced lyrics, instant word translations, and pronunciation guides — all while listening to the music you love.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register">
            <Button size="lg" className="w-full sm:w-auto">
              Start learning free <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">I have an account</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20 max-w-4xl mx-auto grid sm:grid-cols-3 gap-4">
        {[
          { icon: Headphones, title: 'Synced lyrics', desc: 'Lines highlight in real time as the song plays.' },
          { icon: Sparkles, title: 'Tap to translate', desc: 'Tap any word for meaning, pronunciation, and examples.' },
          { icon: MessageCircle, title: 'AI roleplay', desc: 'Practice conversations in real-world scenarios.' },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl bg-card border border-border p-5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="px-6 py-8 text-center text-sm text-muted-foreground border-t border-border">
        Spanish Beats Learn — learn the language, feel the rhythm.
      </footer>
    </div>
  );
}