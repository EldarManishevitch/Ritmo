import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Music } from 'lucide-react';

export default function BlogLayout({ title, badge, children }) {
  React.useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  return (
    <div className="min-h-screen bg-background">
      <header className="safe-area-top sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
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
        {badge && (
          <span className="inline-block text-xs font-semibold uppercase tracking-wide text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
            {badge}
          </span>
        )}
        {children}
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
            <Link to="/compare/spanish-beats-vs-duolingo" className="text-primary font-medium hover:underline">Compare</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}