import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { User, BookOpen, Music, Trophy, TrendingUp, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import AchievementBadges from '@/components/achievements/AchievementBadges';

export default function Profile() {
  const [wordCount, setWordCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [songCount, setSongCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [words, songs] = await Promise.all([
          base44.entities.SavedWord.list('-created_date', 500),
          base44.entities.Song.list('-created_date', 500),
        ]);
        setWordCount(words.length);
        setMasteredCount(words.filter(w => w.mastered).length);
        setSongCount(songs.length);
      } catch (e) {}
      setLoading(false);
    };
    load();
  }, []);

  const level = masteredCount >= 100 ? 'B2' : masteredCount >= 50 ? 'B1' : masteredCount >= 20 ? 'A2' : 'A1';
  const levelProgress = masteredCount >= 100 ? 100 : masteredCount >= 50 ? ((masteredCount - 50) / 50) * 100 : masteredCount >= 20 ? ((masteredCount - 20) / 30) * 100 : (masteredCount / 20) * 100;
  const nextLevel = level === 'A1' ? 'A2' : level === 'A2' ? 'B1' : level === 'B1' ? 'B2' : 'C1';
  const wordsToNext = level === 'A1' ? 20 - masteredCount : level === 'A2' ? 50 - masteredCount : level === 'B1' ? 100 - masteredCount : 0;

  const stats = [
    { icon: BookOpen, label: 'Words Saved', value: wordCount, color: 'bg-blue-50 text-blue-600' },
    { icon: Trophy, label: 'Mastered', value: masteredCount, color: 'bg-green-50 text-green-600' },
    { icon: Music, label: 'Songs Available', value: songCount, color: 'bg-purple-50 text-purple-600' },
    { icon: Flame, label: 'CEFR Level', value: level, color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="min-h-screen">
      <div className="px-5 pt-14 pb-6">
        <h1 className="text-2xl font-bold mb-1">Your Progress</h1>
        <p className="text-sm text-muted-foreground">Track your Spanish learning journey</p>
      </div>

      <div className="px-5 pb-8 space-y-6">
        {/* Level card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-br from-primary/10 via-primary/5 to-orange-50 rounded-2xl border border-primary/15 p-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">{level}</span>
            </div>
            <div>
              <h2 className="font-bold text-lg">CEFR Level {level}</h2>
              <p className="text-sm text-muted-foreground">
                {wordsToNext > 0
                  ? `${wordsToNext} more mastered words to reach ${nextLevel}`
                  : 'Amazing progress! Keep going!'}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{level}</span>
              <span>{nextLevel}</span>
            </div>
            <div className="h-3 rounded-full bg-white/80 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(levelProgress, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400"
              />
            </div>
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + idx * 0.08 }}
              className="bg-card rounded-2xl border border-border/50 p-4"
            >
              <div className={`h-10 w-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">{loading ? '—' : stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Achievement badges */}
        <AchievementBadges />

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-card rounded-2xl border border-border/50 p-5 space-y-3"
        >
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Tips to level up
          </h3>
          <ul className="space-y-2.5">
            {[
              'Listen to a new song every day and tap unfamiliar words',
              'Mark words as mastered once you can recall the meaning instantly',
              'Practice pronunciation by tapping the speaker icon on saved words',
              'Focus on high-frequency words — they appear in many songs',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}