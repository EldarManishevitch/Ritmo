import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, Flame, Sparkles, Loader2, Crown, Lock, Users, Globe, Medal, BookOpen, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { levelForXp } from '@/lib/progress';
import { ACHIEVEMENTS } from '@/lib/achievements';
import AddFriends from '@/components/friends/AddFriends';
import InviteButton from '@/components/friends/InviteButton';
import CertificatesSection from '@/components/certificate/CertificatesSection';
import SEOHead from '@/components/SEOHead';

const medal = (rank) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null);

export default function Leaderboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('global');
  const [metric, setMetric] = useState('mastered');
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    try {
      const res = await base44.functions.invoke('getLeaderboard', {});
      setData(res.data);
    } catch { /* noop */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const list = useMemo(() => {
    if (!data) return [];
    return tab === 'friends' ? (data.friends || []) : (data.global || []);
  }, [data, tab]);

  const myUnlocked = useMemo(() => {
    const set = new Set(data?.myProgress?.achievements || []);
    return set;
  }, [data]);

  const formatMinutes = (min) => {
    if (min < 60) return `${Math.round(min)} min`;
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return m ? `${h}h ${m}m` : `${h}h`;
  };

  // Rank-by-metric view (mastered words / practice time) for the "Rank" tab.
  const rank = useMemo(() => {
    const byMetric = (arr) =>
      [...(arr || [])].sort((a, b) =>
        metric === 'mastered' ? b.mastered_words - a.mastered_words : b.practice_minutes - a.practice_minutes
      );
    const globalRanked = byMetric(data?.global);
    const friendsRanked = byMetric(data?.friends);
    const me = globalRanked.find((e) => e.isMe);
    const friendIds = new Set((data?.friends || []).map((f) => f.id));
    return {
      globalRanked,
      myGlobalRank: globalRanked.findIndex((e) => e.isMe) + 1,
      myFriendsRank: friendsRanked.findIndex((e) => e.isMe) + 1,
      myValue: me ? (metric === 'mastered' ? me.mastered_words : me.practice_minutes) : 0,
      friendIds,
    };
  }, [data, metric]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const myRank = tab === 'friends' ? data?.myFriendsRank : data?.myGlobalRank;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      <SEOHead
        title="Weekly Spanish learning leaderboard | Spanish Beats"
        description="Compete with friends and learners worldwide. See who earned the most XP this week learning Spanish through reggaeton and bachata. Invite friends and climb the ranks."
      />
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-5">See how you stack up against friends and the whole community.</p>

      {/* My rank summary */}
      {tab !== 'rank' && data?.myProgress && (
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Your rank</p>
            <p className="text-2xl font-bold text-foreground">#{myRank || '—'} <span className="text-sm font-normal text-muted-foreground">in {tab}</span></p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground">{data.myProgress.xp || 0} XP</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end"><Flame className="h-3 w-3 text-primary" /> {data.myProgress.current_streak || 0} day streak</p>
          </div>
        </div>
      )}

      {tab === 'rank' && (
        <>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMetric('mastered')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${metric === 'mastered' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
            >
              <BookOpen className="h-4 w-4" /> Mastered Words
            </button>
            <button
              onClick={() => setMetric('practice')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${metric === 'practice' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
            >
              <Clock className="h-4 w-4" /> Practice Time
            </button>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4 mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Your rank · {metric === 'mastered' ? 'Mastered Words' : 'Practice Time'}</p>
              <p className="text-2xl font-bold text-foreground">
                #{rank.myGlobalRank || '—'} <span className="text-sm font-normal text-muted-foreground">global</span>
                <span className="mx-2 text-muted-foreground/40">·</span>
                #{rank.myFriendsRank || '—'} <span className="text-sm font-normal text-muted-foreground">friends</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                {metric === 'mastered' ? `${rank.myValue} words` : formatMinutes(rank.myValue)}
              </p>
              <p className="text-xs text-muted-foreground">{metric === 'mastered' ? 'mastered' : 'practiced'}</p>
            </div>
          </div>

          {rank.globalRanked.length === 0 ? (
            <div className="text-center py-12">
              <Medal className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No rankings yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rank.globalRanked.map((entry, idx) => {
                const r = idx + 1;
                const isFriend = rank.friendIds.has(entry.id) && !entry.isMe;
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                      entry.isMe ? 'bg-primary/10 border border-primary/30' : 'bg-card border border-border'
                    }`}
                  >
                    <div className="w-8 text-center font-bold text-foreground">
                      {medal(r) || <span className="text-muted-foreground">{r}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate flex items-center gap-1.5">
                        {entry.isMe ? 'You' : entry.name}
                        {r === 1 && <Crown className="inline h-3.5 w-3.5 text-yellow-500" />}
                        {isFriend && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">Friend</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.mastered_words} mastered · {formatMinutes(entry.practice_minutes)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">
                        {metric === 'mastered' ? entry.mastered_words : formatMinutes(entry.practice_minutes)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('global')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === 'global' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
        >
          <Globe className="h-4 w-4" /> Global
        </button>
        <button
          onClick={() => setTab('friends')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === 'friends' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
        >
          <Users className="h-4 w-4" /> Friends
        </button>
        <button
          onClick={() => setTab('rank')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === 'rank' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
        >
          <Medal className="h-4 w-4" /> Rank
        </button>
        <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)} className="ml-auto">
          <Users className="h-4 w-4" /> Add Friends
        </Button>
        <InviteButton />
      </div>

      {showAdd && (
        <div className="rounded-2xl bg-card border border-border p-4 mb-5">
          <AddFriends onRefresh={load} />
        </div>
      )}

      {/* Ranking list (XP) */}
      {tab !== 'rank' && (list.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {tab === 'friends' ? 'No friends yet — add some to compete!' : 'No rankings yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((entry, idx) => {
            const r = idx + 1;
            const level = levelForXp(entry.xp);
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                  entry.isMe ? 'bg-primary/10 border border-primary/30' : 'bg-card border border-border'
                }`}
              >
                <div className="w-8 text-center font-bold text-foreground">
                  {medal(r) || <span className="text-muted-foreground">{r}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {entry.isMe ? 'You' : entry.name}
                    {r === 1 && <Crown className="inline h-3.5 w-3.5 text-yellow-500 ml-1" />}
                  </p>
                  <p className="text-xs text-muted-foreground">{level.cefr} · {level.title} · {entry.songs_completed || 0} songs</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{entry.xp} XP</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-0.5 justify-end"><Flame className="h-3 w-3 text-primary" />{entry.current_streak || 0}</p>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Achievements */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Achievements</h2>
          <span className="text-xs text-muted-foreground">{myUnlocked.size}/{ACHIEVEMENTS.length} unlocked</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = myUnlocked.has(a.id);
            return (
              <div
                key={a.id}
                className={`rounded-xl p-3 border transition-all ${unlocked ? 'bg-primary/5 border-primary/30' : 'bg-muted/40 border-border opacity-60'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xl">{unlocked ? a.icon : '🔒'}</span>
                  {!unlocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <p className="text-sm font-semibold text-foreground">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      <CertificatesSection />
    </div>
  );
}