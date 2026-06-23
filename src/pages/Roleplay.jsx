import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, Volume2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateRoleplay } from '@/lib/aiHelpers';

export default function Roleplay() {
  const [params] = useSearchParams();
  const conversationId = params.get('c');
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!conversationId) { setLoading(false); return; }
    let cancelled = false;
    base44.entities.Conversation.get(conversationId)
      .then((c) => {
        if (cancelled) return;
        setConversation(c);
        setMessages(c.messages || []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [conversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const speak = (text) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    u.rate = 0.85;
    speechSynthesis.speak(u);
  };

  const send = async () => {
    if (!input.trim() || sending || !conversationId) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setSending(true);
    try {
      const result = await generateRoleplay({
        roleplayType: conversation?.roleplay_type,
        scenario: conversation?.scenario,
        history: newMessages,
      });
      const assistantMsg = {
        role: 'assistant',
        content: result.spanish_response,
        translation: result.english_translation,
      };
      const updated = [...newMessages, assistantMsg];
      setMessages(updated);
      await base44.entities.Conversation.update(conversationId, { messages: updated });
    } catch { /* noop */ }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-6 text-center">
        <p className="text-muted-foreground">No conversation selected</p>
        <Button onClick={() => navigate('/conversations')}>Browse conversations</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate('/conversations')} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold text-sm truncate">{conversation?.title || 'Roleplay'}</h1>
          <p className="text-xs text-muted-foreground truncate capitalize">{conversation?.roleplay_type}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-1">Start the conversation</p>
            <p className="text-xs text-muted-foreground/60">{conversation?.scenario}</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
              m.role === 'user' ? 'bg-primary text-white' : 'bg-card border border-border'
            }`}>
              <p className="text-sm font-medium">{m.content}</p>
              {m.translation && (
                <p className={`text-xs mt-1 ${m.role === 'user' ? 'text-white/70' : 'text-muted-foreground'}`}>
                  {m.translation}
                </p>
              )}
              {m.role === 'assistant' && (
                <button onClick={() => speak(m.content)} className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary">
                  <Volume2 className="h-3 w-3" /> Listen
                </button>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border flex items-center gap-2 safe-area-bottom">
        <Input
          placeholder="Escribe en español…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          disabled={sending}
        />
        <Button size="icon" onClick={send} disabled={sending || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}