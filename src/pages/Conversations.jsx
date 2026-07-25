import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Loader2, Trash2 } from 'lucide-react';
import { useConversationsList, useCreateConversation, useDeleteConversation } from '@/data/hooks/useConversations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SEOHead from '@/components/SEOHead';

const SCENARIOS = [
  { type: 'restaurant', label: 'Restaurant', desc: 'Order food and chat with a waiter' },
  { type: 'market', label: 'Market', desc: 'Bargain and shop at a street market' },
  { type: 'directions', label: 'Directions', desc: 'Ask for directions around town' },
  { type: 'smalltalk', label: 'Small talk', desc: 'Casual everyday conversation' },
  { type: 'custom', label: 'Custom', desc: 'Define your own scenario' },
];

export default function Conversations() {
  const navigate = useNavigate();
  const { data: conversations = [], isLoading: loading } = useConversationsList();
  const [creating, setCreating] = useState(false);
  const createConversation_ = useCreateConversation();
  const deleteConversation_ = useDeleteConversation();

  const createConversation = async (type, desc) => {
    setCreating(true);
    try {
      const conv = await createConversation_.mutateAsync({
        title: SCENARIOS.find((s) => s.type === type)?.label || 'Conversation',
        scenario: desc,
        roleplay_type: type,
        messages: [],
      });
      navigate(`/roleplay?c=${conv.id}`);
    } catch { /* noop */ }
    setCreating(false);
  };

  const deleteConversation = async (id) => {
    await deleteConversation_.mutateAsync(id);
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <SEOHead
        title="Daily Spanish conversation phrases | Spanish Beats"
        description="5 fresh Spanish phrases every day — real expressions from reggaeton and Latin culture. Hear them, practice them, and build conversational Spanish naturally."
      />
      <h1 className="text-2xl font-bold text-foreground mb-1">Conversations</h1>
      <p className="text-sm text-muted-foreground mb-6">Practice Spanish with AI roleplay</p>

      {/* New conversation scenarios */}
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Start a new chat</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {SCENARIOS.map((s) => (
          <button
            key={s.type}
            onClick={() => createConversation(s.type, s.type === 'custom' ? 'A free-form Spanish conversation' : s.desc)}
            disabled={creating}
            className="rounded-2xl bg-card border border-border p-4 text-left hover:border-primary/40 transition-colors disabled:opacity-50"
          >
            <MessageCircle className="h-5 w-5 text-primary mb-2" />
            <h3 className="font-semibold text-sm text-foreground">{s.label}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
          </button>
        ))}
      </div>

      {/* Existing conversations */}
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent</h2>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : conversations.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 text-center py-8">No conversations yet</p>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
              <button onClick={() => navigate(`/roleplay?c=${c.id}`)} className="flex-1 text-left min-w-0">
                <h3 className="font-semibold text-sm truncate">{c.title}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {c.messages?.length ? `${c.messages.length} messages` : 'New conversation'}
                </p>
              </button>
              <Badge variant="secondary" className="capitalize text-[10px]">{c.roleplay_type}</Badge>
              <button onClick={() => deleteConversation(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}