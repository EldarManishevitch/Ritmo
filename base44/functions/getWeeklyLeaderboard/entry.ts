import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Returns weekly leaderboard data for the Friends and Global tabs.
 * - WeeklyXP records for this week (public read, but we use service role for the join)
 * - User records for display names
 * - UserProgress records for streaks
 * - GenreStats records for top genre
 * - Friendship records for the current user (to filter friends tab)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const sb = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const weekStart = body.week_start;

    if (!weekStart) return Response.json({ error: 'week_start required' }, { status: 400 });

    const [weeklyXp, users, progressList, genreStats, friendships] = await Promise.all([
      sb.entities.WeeklyXP.filter({ week_start: weekStart }, '-xp_earned', 200),
      sb.entities.User.list('-created_date', 1000),
      sb.entities.UserProgress.list('-created_date', 1000),
      sb.entities.GenreStats.list('-created_date', 1000),
      sb.entities.Friendship.list('-created_date', 1000),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const progressMap = new Map(progressList.map((p) => [p.created_by_id, p]));

    // Build per-user top genre from GenreStats (highest total_xp)
    const userGenreMap = new Map();
    for (const gs of genreStats || []) {
      const uid = gs.created_by_id;
      if (!uid) continue;
      const cur = userGenreMap.get(uid);
      if (!cur || (gs.total_xp || 0) > (cur.total_xp || 0)) {
        userGenreMap.set(uid, { genre: gs.genre, total_xp: gs.total_xp || 0 });
      }
    }

    // Display name: full_name only, never fall back to email local-part (privacy).
    const displayName = (uid) => {
      const u = userMap.get(uid);
      const name = u?.full_name;
      if (name) return name.slice(0, 12);
      return 'Learner';
    };

    const build = (w) => {
      const uid = w.created_by_id;
      const prog = progressMap.get(uid);
      const topGenre = userGenreMap.get(uid);
      return {
        id: uid,
        name: displayName(uid),
        xp_earned: w.xp_earned || 0,
        lessons_completed: w.lessons_completed || 0,
        songs_completed: w.songs_completed || 0,
        current_streak: prog?.current_streak || 0,
        top_genre: topGenre?.genre || null,
        isMe: uid === user.id,
      };
    };

    const global = (weeklyXp || []).map(build).sort((a, b) => b.xp_earned - a.xp_earned);

    // Friends = accepted friendships involving the current user
    const friendIds = new Set([user.id]);
    (friendships || []).forEach((f) => {
      if (f.status !== 'accepted') return;
      if (f.created_by_id === user.id && f.friend_user_id) friendIds.add(f.friend_user_id);
      if (f.friend_user_id === user.id && f.created_by_id) friendIds.add(f.created_by_id);
    });
    const friends = global.filter((e) => friendIds.has(e.id));

    const myGlobalRank = global.findIndex((e) => e.isMe) + 1;
    const myFriendsRank = friends.findIndex((e) => e.isMe) + 1;
    const myWeekly = global.find((e) => e.isMe);

    return Response.json({
      global,
      friends,
      myGlobalRank,
      myFriendsRank,
      myWeekly,
      acceptedFriendIds: [...friendIds].filter((id) => id !== user.id),
      pendingInvites: (friendships || []).filter(
        (f) => f.status === 'pending' && f.created_by_id === user.id
      ),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});