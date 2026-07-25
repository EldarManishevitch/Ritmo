import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole;
    const [progressList, users, friendships, savedWords, certificates] = await Promise.all([
      svc.entities.UserProgress.list('-created_date', 1000),
      svc.entities.User.list('-created_date', 1000),
      svc.entities.Friendship.list('-created_date', 1000),
      svc.entities.SavedWord.list('-created_date', 1000),
      svc.entities.Certificate.list('-created_date', 1000),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Per-user aggregates for mastered words and derived practice time
    // (words saved ×2 min + songs mastered/certificates ×5 min).
    const masteredByUser = new Map();
    const savedByUser = new Map();
    const certsByUser = new Map();
    for (const w of savedWords) {
      const uid = w.created_by_id;
      if (!uid) continue;
      savedByUser.set(uid, (savedByUser.get(uid) || 0) + 1);
      if (w.mastered) masteredByUser.set(uid, (masteredByUser.get(uid) || 0) + 1);
    }
    for (const c of certificates) {
      const uid = c.created_by_id;
      if (!uid) continue;
      certsByUser.set(uid, (certsByUser.get(uid) || 0) + 1);
    }

    const build = (progress) => {
      const u = userMap.get(progress.created_by_id) || {};
      const uid = progress.created_by_id;
      return {
        id: uid,
        name: u.full_name || 'Learner',
        xp: progress.xp || 0,
        current_streak: progress.current_streak || 0,
        best_streak: progress.best_streak || 0,
        songs_completed: progress.songs_completed || 0,
        mastered_words: masteredByUser.get(uid) || 0,
        practice_minutes: (savedByUser.get(uid) || 0) * 2 + (certsByUser.get(uid) || 0) * 5,
        isMe: uid === user.id,
      };
    };

    const global = progressList.map(build).sort((a, b) => b.xp - a.xp);
    const myGlobalRank = global.findIndex((e) => e.isMe) + 1;

    // Friends = accepted friendships involving the current user (either side)
    const friendIds = new Set([user.id]);
    friendships.forEach((f) => {
      if (f.status !== 'accepted') return;
      if (f.created_by_id === user.id && f.friend_user_id) friendIds.add(f.friend_user_id);
      if (f.friend_user_id === user.id && f.created_by_id) friendIds.add(f.created_by_id);
    });
    const friends = global.filter((e) => friendIds.has(e.id));
    const myFriendsRank = friends.findIndex((e) => e.isMe) + 1;

    const myProgress = progressList.find((p) => p.created_by_id === user.id) || null;

    return Response.json({ global, friends, myGlobalRank, myFriendsRank, myProgress });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});