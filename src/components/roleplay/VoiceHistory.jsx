import React from 'react';
import { Mic, MapPin } from 'lucide-react';
import { useRoleplaySessionsFilter } from '@/data/hooks/useRoleplaySessions';

export default function VoiceHistory({ refreshKey }) {
  const { data: sessions = [] } = useRoleplaySessionsFilter(
    { voice_mode: true, completed: true },
    '-created_date',
    3,
    { queryKey: ['roleplaySessions', 'voiceHistory', refreshKey] }
  );

  if (!sessions.length) return null;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-bold text-foreground mb-2">Recent voice sessions</h3>
      <div className="space-y-2">
        {sessions.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-xl bg-card border border-border px-3 py-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mic className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{s.scenario_title}</p>
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {s.location || s.character_name}
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
              {s.created_date ? new Date(s.created_date).toLocaleDateString() : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}