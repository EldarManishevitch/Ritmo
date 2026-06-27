import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Volume2, Trash2, Loader2 } from 'lucide-react';
import PullToRefresh from '@/components/PullToRefresh';
import { displayLevel, daysToMastery, LEVEL_META, MASTERY_DATE_COUNT } from '@/lib/wordKnowledge';

export default function Vocab() {
  const [vocab, setVocab] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await base44.entities.SavedWord.list('-created_date', 200);
      setVocab(data || []);
    } catch { /* noop */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const speak = (w) => {
    const u = new SpeechSynthesisUtterance(w);
    u.lang = 'es-ES';
    u.rate = 0.85;
    speechSynthesis.speak(u);
  };

  const remove = async (id) => {
    try {
      await base44.entities.SavedWord.delete(id);
      setVocab((v) => v.filter((x) => x.id !== id));
    } catch { /* noop */ }
  };

  const toggleMastered = async (item) => {
    const nowMastered = displayLevel(item) !== 'mastered';
    try {
      await base44.entities.SavedWord.update(item.id, {
        mastered: nowMastered,
        knowledge_level: nowMastered ? 'mastered' : (item.success_dates?.length ? 'known' : 'new'),
      });
      setVocab((v) => v.map((x) => x.id === item.id
        ? { ...x, mastered: nowMastered, knowledge_level: nowMastered ? 'mastered' : (x.success_dates?.length ? 'known' : 'new') }
        : x));
    } catch { /* noop */ }
  };

  const slang = vocab.filter((v) => v.is_slang);
  const standard = vocab.filter((v) => !v.is_slang);

  const Section = ({ title, items }) => (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Nothing here yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((v) => (
            <div key={v.id} className="rounded-xl bg-card border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-foreground">{v.word}</h3>
                  <p className="text-sm text-muted-foreground">{v.english_meaning}</p>
                  {v.pronunciation_hint && (
                    <p className="text-xs text-primary mt-1">🔊 {v.pronunciation_hint}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_META[displayLevel(v)].badgeClass}`}>
                      {LEVEL_META[displayLevel(v)].label}
                    </span>
                    {displayLevel(v) === 'known' && (
                      <span className="text-xs text-muted-foreground">
                        {MASTERY_DATE_COUNT - daysToMastery(v)}/{MASTERY_DATE_COUNT} days to mastery
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => speak(v.word)} aria-label={`Hear ${v.word}`}>
                    <Volume2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleMastered(v)}>
                    {displayLevel(v) === 'mastered' ? '↩' : '✓'}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(v.id)} aria-label={`Remove ${v.word}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={load}>
    <div>
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">My Vocab</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Words you've collected from songs.</p>

      {vocab.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border">
          <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Open a song and click words to save them.</p>
        </div>
      ) : (
        <>
          <Section title="Standard" items={standard} />
          <Section title="Slang" items={slang} />
        </>
      )}
    </div>
    </PullToRefresh>
  );
}