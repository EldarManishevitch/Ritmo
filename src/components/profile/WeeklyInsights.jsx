import React, { useMemo } from 'react';
import { BookOpen, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useSavedWordsList } from '@/data/hooks/useSavedWords';
import { useCertificatesList } from '@/data/hooks/useCertificates';

const DAY_MS = 86400000;
const MIN_PER_WORD = 2;
const MIN_PER_CERT = 5;

function formatMinutes(min) {
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function WeeklyInsights() {
  const { data: words, isLoading: wordsLoading } = useSavedWordsList('-created_date', 500);
  const { data: certs, isLoading: certsLoading } = useCertificatesList('-created_date', 500);
  const loading = wordsLoading || certsLoading;

  const masteredCount = useMemo(
    () => (words || []).filter((w) => w.mastered).length,
    [words]
  );

  // Daily practice minutes over the last 30 days, derived from timestamped
  // practice activity: words saved (×2 min) + songs mastered/certificates (×5 min).
  const { chartData, totalMinutes } = useMemo(() => {
    const points = [];
    let total = 0;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    for (let i = 29; i >= 0; i--) {
      const dayStart = startOfDay - i * DAY_MS;
      const dayEnd = dayStart + DAY_MS - 1;
      const inDay = (arr) =>
        arr.filter((x) => {
          const t = new Date(x.created_date).getTime();
          return t >= dayStart && t <= dayEnd;
        }).length;
      const minutes = inDay(words || []) * MIN_PER_WORD + inDay(certs || []) * MIN_PER_CERT;
      total += minutes;
      const d = new Date(dayStart);
      points.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, minutes });
    }
    return { chartData: points, totalMinutes: total };
  }, [words, certs]);

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
          <p className="text-2xl font-bold text-foreground">{formatMinutes(totalMinutes)}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2">Practice time · last 30 days</p>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="practiceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} stroke="hsl(var(--muted-foreground))" width={32} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${v} min`, 'Practice']} />
              <Area type="monotone" dataKey="minutes" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#practiceGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}