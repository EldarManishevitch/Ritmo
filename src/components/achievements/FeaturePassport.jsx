import { useEffect, useState } from 'react';
import { Award, Check, Loader2, Gift, Hand, Bookmark, Lightbulb, Trophy, MessageCircle } from 'lucide-react';
import { getProgress } from '@/lib/progress';
import { savedWordsRepo } from '@/data/repositories/savedWords.repo';
import { roleplaySessionsRepo } from '@/data/repositories/roleplaySessions.repo';
import { useUpdateUserProgress } from '@/data/hooks/useUserProgress';

const LS_GRAMMAR = 'sb_passport_grammar_opened';
const LS_TAPPED = 'sb_passport_tapped_word';
const LS_DISMISSED = 'sb_passport_dismissed';

const ITEMS = [
  { id: 'tap', icon: Hand, label: 'Tap a word', desc: 'Look up any lyric' },
  { id: 'save10', icon: Bookmark, label: 'Save 10 words', desc: 'Build your vocab' },
  { id: 'grammar', icon: Lightbulb, label: 'Read a grammar note', desc: 'Understand the why' },
  { id: 'quiz', icon: Trophy, label: 'Pass a song quiz', desc: 'Test yourself' },
  { id: 'roleplay', icon: MessageCircle, label: 'Complete a Roleplay', desc: 'Use it in conversation' },
];

function trialActive(expiresAt) {
  if (!expiresAt) return false;
  return new Date(expiresAt + 'T23:59:59') > new Date();
}

export default function FeaturePassport() {
  const [progress, setProgress] = useState(null);
  const [savedCount, setSavedCount] = useState(0);
  const [songsCompleted, setSongsCompleted] = useState(0);
  const [roleplayDone, setRoleplayDone] = useState(false);
  const [grammarOpened, setGrammarOpened] = useState(false);
  const [tapped, setTapped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [trialGranted, setTrialGranted] = useState(false);
  const updateUserProgress = useUpdateUserProgress();

  useEffect(() => {
    setDismissed(localStorage.getItem(LS_DISMISSED) === '1');
    let cancelled = false;
    (async () => {
      try {
        const [prog, words, sessions] = await Promise.all([
          getProgress(),
          savedWordsRepo.list('-created_date', 200),
          roleplaySessionsRepo.filter({ completed: true }),
        ]);
        if (cancelled) return;
        setProgress(prog);
        setSavedCount(words?.length || 0);
        setSongsCompleted(prog.songs_completed || 0);
        setRoleplayDone((sessions?.length || 0) > 0);
        setGrammarOpened(localStorage.getItem(LS_GRAMMAR) === '1');
        setTapped(localStorage.getItem(LS_TAPPED) === '1' || (words?.length || 0) >= 1);
        if (trialActive(prog.passport_pro_trial_expires_at)) setTrialGranted(true);
      } catch { /* noop */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const completed = {
    tap: tapped,
    save10: savedCount >= 10,
    grammar: grammarOpened,
    quiz: songsCompleted >= 1,
    roleplay: roleplayDone,
  };
  const doneCount = Object.values(completed).filter(Boolean).length;
  const allDone = doneCount === 5;

  const grantTrial = async () => {
    if (!progress?.id || granting || trialGranted) return;
    setGranting(true);
    try {
      const expires = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      await updateUserProgress.mutateAsync({ id: progress.id, patch: { passport_pro_trial_expires_at: expires } });
      setTrialGranted(true);
    } catch { /* noop */ }
    setGranting(false);
  };

  // Auto-grant the 7-day Pro trial once all 5 items are complete
  useEffect(() => {
    if (allDone && !trialGranted && progress?.id) grantTrial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, trialGranted, progress]);

  const dismiss = () => {
    localStorage.setItem(LS_DISMISSED, '1');
    setDismissed(true);
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-card border border-border p-5 mb-4 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (dismissed && !allDone) {
    return (
      <button
        onClick={() => { localStorage.removeItem(LS_DISMISSED); setDismissed(false); }}
        className="w-full rounded-2xl bg-card border border-border p-3 mb-4 text-sm text-primary hover:bg-muted/40 transition-colors"
      >
        Show Feature Passport
      </button>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-5 mb-4">
      <div className="flex items-center gap-2 mb-1">
        <Award className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-foreground">Feature Passport</h2>
        {trialGranted && (
          <span className="ml-auto text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Gift className="h-3 w-3" /> 7-day Pro
          </span>
        )}
        {!allDone && (
          <button onClick={dismiss} className="ml-auto text-xs text-muted-foreground hover:text-foreground">
            Dismiss
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {allDone ? 'All stamps collected!' : `Complete all 5 to unlock 7 days of Pro. ${doneCount}/5 done.`}
      </p>
      <div className="space-y-2">
        {ITEMS.map((item) => {
          const done = completed[item.id];
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 rounded-xl p-2.5 border transition-colors ${
                done ? 'bg-primary/5 border-primary/20' : 'bg-muted/40 border-border'
              }`}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  done ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
      {allDone && trialGranted && (
        <div className="mt-4 rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
          <p className="text-sm font-semibold text-primary">🎉 Passport complete — 7 days of Pro unlocked!</p>
        </div>
      )}
    </div>
  );
}