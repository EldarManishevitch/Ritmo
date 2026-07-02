import React, { useEffect, useState } from 'react';
import { Mic, Loader2, Volume2, Eye, EyeOff, RefreshCw, ArrowRight, MapPin, Sparkles, MessageSquare, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { generateRoleplayScene } from '@/lib/aiHelpers';
import { getProgress, awardRoleplayCompletion } from '@/lib/progress';
import { useSubscription } from '@/hooks/useSubscription';
import { speechSupported } from '@/hooks/useSpeechRecognition';
import UnlockCelebration from '@/components/UnlockCelebration';
import VoiceCoach from '@/components/roleplay/VoiceCoach';
import VoiceHistory from '@/components/roleplay/VoiceHistory';

export default function Roleplay() {
  const [session, setSession] = useState(null);
  const [turn, setTurn] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showEnglish, setShowEnglish] = useState(false);
  const [done, setDone] = useState(false);
  const [levelUp, setLevelUp] = useState(null);
  const [level, setLevel] = useState('A1');
  const [mode, setMode] = useState('text');
  const [showProModal, setShowProModal] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const { isPro } = useSubscription();
  const { toast } = useToast();

  const handleSelectVoice = () => {
    if (!speechSupported) { toast({ description: 'Voice mode needs Chrome or Edge.' }); return; }
    if (!isPro) { setShowProModal(true); return; }
    setMode('voice');
  };

  const loadOrCreate = async (forceNew = false) => {
    setLoading(true);
    setDone(false);
    setTurn(0);
    setShowEnglish(false);
    setLevelUp(null);
    try {
      const p = await getProgress();
      const cefr = p.cefr_level || 'A1';
      setLevel(cefr);

      // Resume an incomplete session unless the user explicitly asked for a new scene
      if (!forceNew) {
        const incomplete = await base44.entities.RoleplaySession.filter({ completed: false }, '-created_date', 1);
        if (incomplete && incomplete.length && (incomplete[0].dialogue_steps || []).length) {
          setSession(incomplete[0]);
          setLoading(false);
          return;
        }
      }

      const scene = await generateRoleplayScene({ level: cefr });
      const created = await base44.entities.RoleplaySession.create({
        scenario_title: scene.scenario_title,
        character_name: scene.character_name,
        location: scene.location,
        dialogue_steps: scene.dialogue_steps || [],
        completed: false,
        xp_awarded: false,
      });
      setSession(created);
    } catch { /* noop */ }
    setLoading(false);
  };

  useEffect(() => { loadOrCreate(false); }, []);

  const speak = (text) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-MX';
    u.rate = 0.85;
    speechSynthesis.speak(u);
  };

  const steps = session?.dialogue_steps || [];
  const current = steps[turn];

  const advance = async () => {
    setShowEnglish(false);
    if (turn < steps.length - 1) {
      setTurn((t) => t + 1);
      return;
    }
    // Final turn — complete the session
    setDone(true);
    try {
      if (session && !session.xp_awarded) {
        await base44.entities.RoleplaySession.update(session.id, { completed: true, xp_awarded: true });
        const res = await awardRoleplayCompletion();
        if (res.leveledUp) setLevelUp(res.newLevel);
      }
    } catch { /* noop */ }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Generating your scene…</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Mic className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Roleplay</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Step into a real Latin scene and practice line by line · tuned for {level}.
      </p>

      {/* Text | Voice toggle */}
      <div className="inline-flex rounded-full bg-muted p-1 mb-5">
        <button
          onClick={() => setMode('text')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === 'text' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
        >
          <MessageSquare className="h-4 w-4" /> Text
        </button>
        <button
          onClick={handleSelectVoice}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === 'voice' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
        >
          <Mic className="h-4 w-4" /> Voice {!isPro && <Lock className="h-3 w-3" />}
        </button>
      </div>

      {/* Voice mode */}
      {mode === 'voice' && session && (
        <>
          <VoiceCoach
            key={session.id}
            session={session}
            level={level}
            onNewScene={() => { setMode('voice'); loadOrCreate(true); }}
            onSessionComplete={() => setHistoryKey((k) => k + 1)}
          />
          <VoiceHistory refreshKey={historyKey} />
        </>
      )}

      {mode === 'text' && session && (
        <div className="rounded-2xl bg-card border border-border p-5 mb-4">
          {/* Scenario meta */}
          <h2 className="text-lg font-bold text-foreground">{session.scenario_title}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 mb-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> {session.character_name}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {session.location}</span>
          </div>

          {!done ? (
            <>
              {/* Progress dots */}
              <div className="flex items-center gap-1.5 mb-4">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${i <= turn ? 'bg-primary' : 'bg-muted'}`}
                  />
                ))}
              </div>

              {/* Current turn */}
              {current && (
                <div className="rounded-xl bg-muted/40 border border-border p-4 mb-4">
                  <p className="text-[10px] font-semibold text-muted-foreground/60 tracking-wide mb-1">
                    {session.character_name?.toUpperCase()} SAYS
                  </p>
                  <p className="text-lg font-bold text-foreground leading-snug">{current.spanish_text}</p>
                  {current.pronunciation && (
                    <p className="text-xs italic text-muted-foreground mt-1">/{current.pronunciation}/</p>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => speak(current.spanish_text)}
                      className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors active:scale-95"
                      title="Listen"
                    >
                      <Volume2 className="h-4 w-4 text-primary" />
                    </button>
                    <button
                      onClick={() => setShowEnglish((v) => !v)}
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      {showEnglish ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {showEnglish ? 'Hide' : 'Show'} translation
                    </button>
                  </div>
                  {showEnglish && (
                    <p className="text-sm text-muted-foreground mt-2">{current.english_translation}</p>
                  )}
                </div>
              )}

              {/* Suggested reply */}
              {current?.suggested_reply && (
                <button
                  onClick={advance}
                  className="w-full rounded-xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 p-4 text-left transition-colors group"
                >
                  <p className="text-[10px] font-semibold text-primary tracking-wide mb-1">YOUR REPLY</p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{current.suggested_reply}</p>
                    <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              )}
            </>
          ) : (
            /* Completion card */
            <div className="text-center py-6">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-xl font-bold text-foreground mb-1">¡Bien hecho!</h3>
              <p className="text-sm text-primary font-semibold mb-1">+50 XP</p>
              <p className="text-sm text-muted-foreground mb-5">You completed the whole scene. ¡Qué duro!</p>
              <Button onClick={() => loadOrCreate(true)} className="w-full">
                <RefreshCw className="h-4 w-4 mr-1" /> New scene
              </Button>
            </div>
          )}
        </div>
      )}

      {mode === 'text' && !done && (
        <Button variant="outline" className="w-full" onClick={() => loadOrCreate(true)}>
          <RefreshCw className="h-4 w-4 mr-1" /> New scene
        </Button>
      )}

      {/* Pro upgrade modal */}
      <Dialog open={showProModal} onOpenChange={setShowProModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mic className="h-5 w-5 text-primary" /> Voice Coach is Pro</DialogTitle>
            <DialogDescription>Practice speaking out loud with real-time AI feedback. Upgrade coming soon.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="w-full" onClick={() => { setShowProModal(false); setMode('text'); }}>
              Continue with text
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {levelUp && <UnlockCelebration level={levelUp} onClose={() => setLevelUp(null)} />}
    </div>
  );
}