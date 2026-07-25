import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Sparkles, MapPin, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { roleplaySessionsRepo } from '@/data/repositories/roleplaySessions.repo';
import { voiceAttemptsRepo } from '@/data/repositories/voiceAttempts.repo';
import { useUpdateUserProgress } from '@/data/hooks/useUserProgress';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { speakSpanish } from '@/lib/tts';
import { evaluateVoiceTurn } from '@/lib/aiHelpers';
import { getProgress } from '@/lib/progress';
import { upsertWeeklyXp } from '@/lib/weeklyXp';
import VoiceChatBubble from './VoiceChatBubble';
import VoiceControls from './VoiceControls';
import VoiceFeedbackCard from './VoiceFeedbackCard';
import VoiceCompletion from './VoiceCompletion';

export default function VoiceCoach({ session, level, onNewScene, onSessionComplete }) {
  const steps = session?.dialogue_steps || [];
  const navigate = useNavigate();
  const { toast } = useToast();
  const { listening, start, cancel } = useSpeechRecognition();
  const updateUserProgress = useUpdateUserProgress();

  const [turnIndex, setTurnIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const [phase, setPhase] = useState('speaking'); // speaking | user_turn | listening | evaluating | feedback
  const [feedback, setFeedback] = useState(null);
  const [forced, setForced] = useState(false);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState(null);

  const attemptsRef = useRef(0);
  const resultsRef = useRef([]);
  const scrollRef = useRef(null);
  const startedRef = useRef(-1);

  const speak = useCallback((text, onEnd) => speakSpanish(text, onEnd), []);

  // Announce each AI turn (once per turn index), then hand over to the user.
  useEffect(() => {
    if (done) return;
    const step = steps[turnIndex];
    if (!step || startedRef.current === turnIndex) return;
    startedRef.current = turnIndex;
    attemptsRef.current = 0;
    setFeedback(null);
    setForced(false);
    setMessages((m) => [...m, {
      role: 'ai',
      text: step.spanish_text,
      translation: step.english_translation,
      pronunciation: step.pronunciation,
    }]);
    setPhase('speaking');
    speak(step.spanish_text, () => setPhase('user_turn'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnIndex, done]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, feedback, phase]);

  useEffect(() => () => { cancel(); try { window.speechSynthesis?.cancel(); } catch { /* noop */ } }, [cancel]);

  const finish = useCallback(async () => {
    const results = resultsRef.current;
    const scored = results.filter((r) => !r.skipped);
    const avg = scored.length ? Math.round(scored.reduce((s, r) => s + r.score, 0) / scored.length) : 0;
    const understood = results.filter((r) => r.understood).length;
    const xp = 50 + understood * 10;
    setSummary({ results, avg, xp });
    setDone(true);
    try {
      if (session && !session.xp_awarded) {
        const p = await getProgress();
        await updateUserProgress.mutateAsync({ id: p.id, patch: { xp: (p.xp || 0) + xp } });
        upsertWeeklyXp({ amount: xp, source: 'xp' });
        await roleplaySessionsRepo.update(session.id, {
          completed: true, xp_awarded: true, voice_mode: true,
        });
      }
      onSessionComplete?.();
    } catch { /* noop */ }
  }, [session, onSessionComplete]);

  const nextTurn = useCallback(() => {
    setFeedback(null);
    setForced(false);
    if (turnIndex >= steps.length - 1) finish();
    else setTurnIndex((i) => i + 1);
  }, [turnIndex, steps.length, finish]);

  const recordResult = (r) => {
    if (!resultsRef.current.find((x) => x.turnIndex === r.turnIndex)) resultsRef.current.push(r);
  };

  const handleTranscript = async (transcript) => {
    if (!transcript) { setPhase('user_turn'); toast({ description: "Didn't catch that — try again." }); return; }
    setPhase('evaluating');
    const step = steps[turnIndex];
    const attemptNum = attemptsRef.current + 1;
    attemptsRef.current = attemptNum;

    let evalRes;
    try {
      evalRes = await evaluateVoiceTurn({ level, expected: step.suggested_reply, transcript });
    } catch {
      evalRes = { understood: true, score: 70, feedback_es: '¡Bien hecho!', feedback_en: 'Good effort — keep going.' };
    }
    const score = Math.max(0, Math.min(100, Math.round(evalRes.score || 0)));

    setMessages((m) => [...m, { role: 'user', text: transcript, score }]);
    voiceAttemptsRepo.create({
      session_id: session.id,
      turn_index: turnIndex,
      transcript,
      expected_reply: step.suggested_reply,
      score,
      understood: !!evalRes.understood,
      feedback_en: evalRes.feedback_en,
      feedback_es: evalRes.feedback_es,
      attempts: attemptNum,
      skipped: false,
    }).catch(() => {});

    if (evalRes.understood) {
      if (score >= 85) { getProgress().then((p) => updateUserProgress.mutateAsync({ id: p.id, patch: { xp: (p.xp || 0) + 5 } })).catch(() => {}); }
      recordResult({ turnIndex, score, understood: true, skipped: false });
      setFeedback({ ...evalRes, understood: true });
      setPhase('feedback');
      setTimeout(() => nextTurn(), 2000);
    } else if (attemptNum >= 3) {
      recordResult({ turnIndex, score, understood: false, skipped: true });
      setFeedback({ ...evalRes, understood: false });
      setForced(true);
      setPhase('feedback');
    } else {
      setFeedback({ ...evalRes, understood: false });
      setForced(false);
      setPhase('feedback');
    }
  };

  const handleMic = () => {
    setPhase('listening');
    start({
      onResult: handleTranscript,
      onTimeout: () => { setPhase('user_turn'); toast({ description: "Didn't catch that — tap the mic to try again." }); },
      onError: () => { setPhase('user_turn'); },
    });
  };

  const handleSkip = () => {
    cancel();
    recordResult({ turnIndex, score: 0, understood: false, skipped: true });
    voiceAttemptsRepo.create({
      session_id: session.id, turn_index: turnIndex, expected_reply: steps[turnIndex]?.suggested_reply,
      score: 0, understood: false, attempts: attemptsRef.current, skipped: true,
    }).catch(() => {});
    nextTurn();
  };

  const handleRetry = () => { setFeedback(null); setPhase('user_turn'); };

  if (done && summary) {
    return (
      <VoiceCompletion
        results={summary.results}
        xp={summary.xp}
        avg={summary.avg}
        onNewScene={onNewScene}
        onHome={() => navigate('/dashboard')}
      />
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden flex flex-col" style={{ height: '70vh', minHeight: 480 }}>
      {/* Character card */}
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex-shrink-0">
        <h2 className="text-base font-bold text-foreground">{session.scenario_title}</h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> {session.character_name}</span>
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {session.location}</span>
          <span className="ml-auto">Turn {Math.min(turnIndex + 1, steps.length)}/{steps.length}</span>
        </div>
      </div>

      {/* Chat */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <VoiceChatBubble key={i} message={m} onReplay={(t) => speak(t)} />
        ))}
        {phase === 'feedback' && (
          <VoiceFeedbackCard
            feedback={feedback}
            forced={forced}
            onRetry={handleRetry}
            onSkip={handleSkip}
            onContinue={nextTurn}
          />
        )}
      </div>

      {/* Controls */}
      <div className="border-t border-border flex-shrink-0 px-4">
        {phase !== 'feedback' && (
          <VoiceControls
            phase={phase}
            hintText={steps[turnIndex]?.suggested_reply}
            onMic={handleMic}
            onReplay={() => speak(steps[turnIndex]?.spanish_text)}
            onSkip={handleSkip}
            onCancel={() => { cancel(); setPhase('user_turn'); }}
          />
        )}
      </div>
    </div>
  );
}