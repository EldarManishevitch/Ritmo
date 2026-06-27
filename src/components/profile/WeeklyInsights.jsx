import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { base44 } from '@/api/base44Client';

const DAY_MS = 86400000;

function formatMinutes(min) {
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function WeeklyInsights() {
  const [words, setWords] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      base44.entities.SavedWord.list('-created_date', 500),
      base44.entities.UserProgress.list('-updated_date', 1),
    ])
      .then(([w, p]) => {
        if (cancelled) return;
        setWords(w);
        setProgress(p[0] || null);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const masteredCount = useMemo(
    () => (words || []).filter((w) => w.mastered).length,
    [words]
  );

  // Practice-time proxy: each completed song/quiz ≈ 4 min of active practice.
  const practiceMinutes = useMemo(
    () => (progress?.songs_completed || 0) * 4,
    [progress]
  );

  // 30-day cumulative words-saved series — vocabulary growth = improvement.
  const chartData = useMemo(() => {
    if (!words) return [];
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const points = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = startOfDay - i * DAY_MS;
      const dayEnd = dayStart + DAY_MS - 1;
      const count = words.filter((w) => new Date(w.created_date).getTime() <= dayEnd).length;
      const d = new Date(dayStart);
      points.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, words: count });
    }
    return points;
  }, [words]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        Weekly Insights
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-primary/5 border border-primary/15 p-3">
          <div className="flex items-center gap-2 text-primary mb-1">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs font-medium">Words Mastered</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{masteredCount}</p>
        </div>
        <div className="rounded-xl bg-primary/5 border border-primary/15 p-3">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Practice Time</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatMinutes(practiceMinutes)}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2">Vocabulary growth · last 30 days</p>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="vocabGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} stroke="hsl(var(--muted-foreground))" width={32} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="words" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#vocabGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}