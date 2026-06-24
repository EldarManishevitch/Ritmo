import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Music, Mail, Send, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Contact — Ritmo';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError('');
    try {
      await base44.integrations.Core.SendEmail({
        to: 'hello@ritmo.app',
        subject: `New message from ${name || 'a visitor'}`,
        body: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      });
      setSent(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setError(err.message || 'Failed to send message. Please email us directly.');
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-foreground">
            <Music className="h-5 w-5 text-primary" />
            Ritmo
          </Link>
          <Link to="/dashboard" className="text-sm text-primary font-medium hover:underline">
            Open app →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <span className="inline-block text-xs font-semibold uppercase tracking-wide text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
          Contact
        </span>
        <h1 className="text-3xl font-bold text-foreground mb-3">Contact Us</h1>
        <p className="text-muted-foreground mb-6">
          Have a question, a song request, or feedback? We'd love to hear from you. Fill out the form
          below or email us directly at{' '}
          <a href="mailto:hello@ritmo.app" className="text-primary font-medium hover:underline">
            hello@ritmo.app
          </a>.
        </p>

        {sent ? (
          <div className="rounded-2xl bg-card border border-border p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h2 className="font-bold text-foreground mb-1">Message sent!</h2>
            <p className="text-sm text-muted-foreground">Thanks for reaching out — we'll get back to you soon.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setSent(false)}>
              Send another
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl bg-card border border-border p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                rows={5}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={sending} className="w-full">
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" /> Send message
                </>
              )}
            </Button>
          </form>
        )}
      </main>

      <footer className="border-t border-border mt-12">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-foreground mb-2">
            <Music className="h-4 w-4 text-primary" /> Ritmo
          </Link>
          <p>Learn Spanish through synced music lyrics, instant translations, and AI roleplay.</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link to="/about" className="text-primary font-medium hover:underline">About</Link>
            <Link to="/contact" className="text-primary font-medium hover:underline">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}