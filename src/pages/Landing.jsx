import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Music, Play, Sparkles, Languages, Zap, Volume2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PREVIEW = {
  youtubeId: 'Cr8K88UcO0s',
  title: 'Tití Me Preguntó',
  artist: 'Bad Bunny',
  startSeconds: 41,
  durationMs: 10000,
  lines: [
    'Tití me preguntó si tengo muchas novias',
    'Le dije que sí',
  ],
};

const GLOSSARY = {
  'titi': { pron: 'TEE-tee', en: 'auntie (Caribbean term of endearment)' },
  'tití': { pron: 'TEE-tee', en: 'auntie (Caribbean term of endearment)' },
  'me': { pron: 'meh', en: 'me / to me' },
  'preguntó': { pron: 'preh-goon-TOH', en: 'asked' },
  'si': { pron: 'see', en: 'if / whether' },
  'tengo': { pron: 'TEN-go', en: 'I have' },
  'muchas': { pron: 'MOO-chas', en: 'many' },
  'novias': { pron: 'NO-byas', en: 'girlfriends' },
  'le': { pron: 'leh', en: 'to her / to him' },
  'dije': { pron: 'DEE-heh', en: 'I said / I told' },
  'que': { pron: 'keh', en: 'that' },
  'sí': { pron: 'see', en: 'yes' },
};

const cleanWord = (w) => w.toLowerCase().replace(/[¿¡!?.,;:"'()]/g, '').trim();

const loadYouTubeAPI = () => {
  return new Promise((resolve) => {
    if (window.__ytApiReady && window.YT?.Player) return resolve();
    window.__ytReadyCallbacks = window.__ytReadyCallbacks || [];
    window.__ytReadyCallbacks.push(resolve);
    if (window.__ytApiLoading) return;
    window.__ytApiLoading = true;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      window.__ytApiReady = true;
      window.__ytReadyCallbacks?.forEach((cb) => cb());
      window.__ytReadyCallbacks = [];
    };
  });
};

export default function Landing() {
  const playerRef = useRef(null);
  const stopTimer = useRef(null);
  const containerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [signinOpen, setSigninOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    document.title = 'Ritmo — Learn Spanish through Bad Bunny & Latin music';
    return () => {
      if (stopTimer.current) window.clearTimeout(stopTimer.current);
      try { playerRef.current?.destroy?.(); } catch { /* ignore */ }
      playerRef.current = null;
    };
  }, []);

  const ensurePlayer = () => {
    return new Promise((resolve) => {
      if (playerReady && playerRef.current) return resolve();
      loadYouTubeAPI().then(() => {
        if (!containerRef.current) return resolve();
        if (playerRef.current) return resolve();
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: PREVIEW.youtubeId,
          playerVars: { controls: 0, modestbranding: 1, rel: 0, playsinline: 1, start: PREVIEW.startSeconds },
          events: {
            onReady: () => {
              setPlayerReady(true);
              resolve();
            },
          },
        });
      });
    });
  };

  const play = async () => {
    try {
      await ensurePlayer();
      if (!playerRef.current) return;
      playerRef.current.seekTo(PREVIEW.startSeconds, true);
      playerRef.current.playVideo();
      setPlaying(true);
      if (stopTimer.current) window.clearTimeout(stopTimer.current);
      stopTimer.current = window.setTimeout(() => {
        try { playerRef.current?.pauseVideo(); } catch { /* ignore */ }
        setPlaying(false);
        setSigninOpen(true);
      }, PREVIEW.durationMs);
    } catch (e) {
      console.error('preview play failed', e);
    }
  };

  const handleGoogle = () => {
    setSigningIn(true);
    base44.auth.loginWithProvider('google', '/dashboard');
  };

  const speak = (word) => {
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'es-ES';
    u.rate = 0.8;
    speechSynthesis.speak(u);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Music className="h-5 w-5 text-primary" />
            Ritmo
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-primary text-white">Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-12 pb-8 text-center">
        <span className="inline-block text-xs font-semibold uppercase tracking-wide text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
          Try it free — no signup
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
          Sing the chorus.<br />Speak the language.
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto mb-8">
          Hit play on a real Bad Bunny chorus. Tap any word for instant pronunciation and English meaning — that's the whole product, right here.
        </p>

        {/* Video preview */}
        <div className="relative max-w-md mx-auto rounded-2xl overflow-hidden bg-card border border-border shadow-lg">
          <div className="aspect-video relative">
            <div ref={containerRef} className="absolute inset-0" />
            {!playing && (
              <img
                src={`https://i.ytimg.com/vi/${PREVIEW.youtubeId}/hqdefault.jpg`}
                alt={PREVIEW.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {!playing && (
              <button
                onClick={play}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <Play className="h-8 w-8 text-white ml-1" fill="white" />
                </div>
              </button>
            )}
            {playing && (
              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Live · 10s
              </div>
            )}
          </div>
          <div className="p-3 flex items-center justify-between">
            <div className="text-left">
              <p className="font-semibold text-sm text-foreground">{PREVIEW.title}</p>
              <p className="text-xs text-muted-foreground">{PREVIEW.artist}</p>
            </div>
            <span className="text-xs text-muted-foreground">Auto-stops at 10s</span>
          </div>
        </div>
      </section>

      {/* Interactive lyrics */}
      <section className="max-w-2xl mx-auto px-4 py-8">
        <div className="rounded-2xl bg-card border border-border p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">Tap any word</p>
          <div className="space-y-3 mb-6">
            {PREVIEW.lines.map((line, li) => (
              <p key={li} className="text-xl text-foreground leading-relaxed">
                {line.split(/\s+/).map((w, wi) => {
                  const c = cleanWord(w);
                  const has = Boolean(GLOSSARY[c]);
                  return (
                    <span
                      key={wi}
                      onClick={() => has && setSelectedWord(c)}
                      className={`inline-block mr-1 px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                        has ? 'hover:bg-primary/15 hover:text-primary' : 'opacity-70 cursor-default'
                      } ${selectedWord === c ? 'bg-primary text-white' : ''}`}
                    >
                      {w}
                    </span>
                  );
                })}
              </p>
            ))}
          </div>

          {selectedWord && GLOSSARY[selectedWord] ? (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-foreground">{selectedWord}</h3>
                <button onClick={() => speak(selectedWord)} className="p-2 rounded-lg hover:bg-primary/10 text-primary">
                  <Volume2 className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-foreground"><strong>Sounds like:</strong> {GLOSSARY[selectedWord].pron}</p>
              <p className="text-sm text-muted-foreground mt-1"><strong>English:</strong> {GLOSSARY[selectedWord].en}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Click on a highlighted word above to see how it sounds and what it means.
            </p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-3">Ready for the whole song?</h2>
        <p className="text-muted-foreground mb-6">
          Sign in to unlock the full catalog, save vocabulary, run lyric quizzes, and track your progress as you go.
        </p>
        <Button onClick={() => setSigninOpen(true)} size="lg" className="bg-primary text-white">
          Continue with Google
        </Button>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Sparkles, title: 'Synced Lyrics', desc: 'Real-time highlighted lyrics that scroll with the music. Tap any word for instant translation.' },
            { icon: Languages, title: 'Tap-to-Translate', desc: 'Every word is tappable. Get pronunciation, English meaning, and save it to your vocab deck.' },
            { icon: Zap, title: 'AI Roleplay', desc: 'Practice real conversations in Spanish — restaurant, market, directions — with instant feedback.' },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-2xl bg-card border border-border p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Guides */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-foreground mb-4 text-center">Free guides</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <Link to="/how-to-learn-spanish-with-music" className="block p-4 rounded-xl border border-border hover:border-primary transition-colors">
            <h3 className="font-semibold text-foreground">How to Learn Spanish with Music →</h3>
            <p className="text-sm text-muted-foreground">The six-step method behind Ritmo.</p>
          </Link>
          <Link to="/reggaeton-slang-guide" className="block p-4 rounded-xl border border-border hover:border-primary transition-colors">
            <h3 className="font-semibold text-foreground">Reggaeton Slang Guide →</h3>
            <p className="text-sm text-muted-foreground">What Bad Bunny actually says.</p>
          </Link>
          <Link to="/dominican-slang-guide" className="block p-4 rounded-xl border border-border hover:border-primary transition-colors">
            <h3 className="font-semibold text-foreground">Dominican Slang Guide →</h3>
            <p className="text-sm text-muted-foreground">Bachata vocabulary decoded.</p>
          </Link>
          <Link to="/best-reggaeton-songs" className="block p-4 rounded-xl border border-border hover:border-primary transition-colors">
            <h3 className="font-semibold text-foreground">Best Reggaeton Songs →</h3>
            <p className="text-sm text-muted-foreground">10 tracks ranked for learners.</p>
          </Link>
          <Link to="/best-bachata-songs" className="block p-4 rounded-xl border border-border hover:border-primary transition-colors">
            <h3 className="font-semibold text-foreground">Best Bachata Songs →</h3>
            <p className="text-sm text-muted-foreground">10 Bachatas to learn Spanish.</p>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-2 font-bold text-foreground mb-2">
            <Music className="h-4 w-4 text-primary" /> Ritmo
          </div>
          <p className="text-sm text-muted-foreground">Learn Spanish through synced music lyrics, instant translations, and AI roleplay.</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link to="/about" className="text-sm text-primary font-medium hover:underline">About</Link>
            <Link to="/contact" className="text-sm text-primary font-medium hover:underline">Contact</Link>
          </div>
        </div>
      </footer>

      {/* Sign-in modal */}
      <Dialog open={signinOpen} onOpenChange={setSigninOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Want to unlock the full song?</DialogTitle>
            <DialogDescription>
              Sign in with Google instantly to keep playing, save the words you tapped, and start learning Spanish through the music you actually love.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={handleGoogle} disabled={signingIn} className="w-full bg-primary text-white">
            {signingIn ? 'Opening Google…' : 'Continue with Google'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">No spam. No credit card. Free forever for learners.</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}