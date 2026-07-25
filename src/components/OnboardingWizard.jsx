import React, { useState, useEffect } from 'react';
import { Music, Check, ChevronRight, X } from 'lucide-react';
import { useUpdateUserProgress } from '@/data/hooks/useUserProgress';
import { Button } from '@/components/ui/button';
import { getProgress } from '@/lib/progress';

const GENRES = [
  { id: 'bachata', label: 'Bachata', emoji: '💃' },
  { id: 'reggaeton', label: 'Reggaeton', emoji: '🔥' },
  { id: 'salsa', label: 'Salsa', emoji: '🎺' },
  { id: 'pop latino', label: 'Latin Pop', emoji: '🎤' },
];

const GOALS = [
  { id: 'conversation', label: 'Hold real conversations', emoji: '💬' },
  { id: 'music', label: 'Understand songs I love', emoji: '🎵' },
  { id: 'travel', label: 'Travel with confidence', emoji: '✈️' },
];

export default function OnboardingWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [saving, setSaving] = useState(false);
  const updateUserProgress = useUpdateUserProgress();

  useEffect(() => {
    getProgress().then((p) => {
      if (p && p.onboarding_completed === false) {
        setOpen(true);
      }
    }).catch(() => {});
  }, []);

  const toggleGenre = (id) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const p = await getProgress();
      await updateUserProgress.mutateAsync({ id: p.id, patch: {
        onboarding_completed: true,
        fav_genres: selectedGenres,
        learning_goal: selectedGoal,
      } });
      setOpen(false);
    } catch { /* noop */ }
    setSaving(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center">
              <Music className="h-4 w-4" />
            </div>
            <span className="font-bold text-foreground">Welcome to Ritmo</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-5 pt-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step 0: Genres */}
        {step === 0 && (
          <div className="px-5 py-5">
            <h2 className="text-lg font-bold text-foreground mb-1">Pick your favorite genres</h2>
            <p className="text-sm text-muted-foreground mb-4">We'll recommend songs you'll love.</p>
            <div className="grid grid-cols-2 gap-3">
              {GENRES.map((g) => {
                const selected = selectedGenres.includes(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleGenre(g.id)}
                    className={`flex items-center gap-2 rounded-xl border-2 p-3 text-left transition-all ${
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <span className="text-2xl">{g.emoji}</span>
                    <span className="font-medium text-foreground text-sm">{g.label}</span>
                    {selected && <Check className="h-4 w-4 text-primary ml-auto" />}
                  </button>
                );
              })}
            </div>
            <Button
              className="w-full mt-5"
              disabled={selectedGenres.length === 0}
              onClick={() => setStep(1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 1: Goal */}
        {step === 1 && (
          <div className="px-5 py-5">
            <h2 className="text-lg font-bold text-foreground mb-1">What's your goal?</h2>
            <p className="text-sm text-muted-foreground mb-4">We'll tailor your learning path.</p>
            <div className="space-y-2">
              {GOALS.map((g) => {
                const selected = selectedGoal === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGoal(g.id)}
                    className={`flex items-center gap-3 rounded-xl border-2 p-3 w-full text-left transition-all ${
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <span className="text-2xl">{g.emoji}</span>
                    <span className="font-medium text-foreground text-sm">{g.label}</span>
                    {selected && <Check className="h-4 w-4 text-primary ml-auto" />}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-5">
              <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedGoal || saving}
                onClick={handleFinish}
              >
                {saving ? 'Saving…' : "Let's go!"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}