import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import BlogLayout from '@/components/layout/BlogLayout';
import SEOHead from '@/components/SEOHead';
import ComparisonTable from '@/components/compare/ComparisonTable';

export default function CompareLyricsTraining() {
  return (
    <BlogLayout badge="App Comparison">
      <SEOHead
        title="Spanish Beats vs LyricsTraining: Which is better for learning Spanish? (2026)"
        description="LyricsTraining is a fill-in-the-blank game. Spanish Beats is a full Spanish curriculum. Compare features to see which music-based learning app is right for you."
      />
      <article className="prose prose-sm max-w-none">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Spanish Beats vs LyricsTraining: A Game vs a Curriculum</h1>
        <p className="text-muted-foreground leading-relaxed">
          LyricsTraining is the original music-based language game — fill in the blanks as songs play. It's addictive and genuinely useful for listening practice. Spanish Beats goes further: structured CEFR levels, tap-to-translate, AI voice coach, and certificates.
        </p>

        <ComparisonTable
          rows={[
            { feature: 'Tap-to-translate', sb: true, cp: false },
            { feature: 'CEFR structured path', sb: 'A1–C1 with certificates', cp: false },
            { feature: 'Vocabulary saved and reviewed', sb: 'SavedWords + flashcards + review', cp: false },
            { feature: 'AI voice conversation', sb: 'Pro', cp: false },
            { feature: 'Pronunciation scoring', sb: 'Pro', cp: false },
            { feature: 'Song catalog', sb: '59 real songs + AI-generate any song', cp: 'Huge — any song on YouTube' },
            { feature: 'Price', sb: 'Free / $9', cp: 'Free / ~$5' },
          ]}
        />

        <h2 className="text-xl font-bold text-foreground mt-8 mb-3">LyricsTraining's strength: massive catalog, addictive game</h2>
        <p className="text-foreground leading-relaxed">
          LyricsTraining wins on catalog size and pure gaming fun. If you want to play a game with any song you can think of, it's hard to beat. It's particularly good for listening comprehension — catching words at natural speed.
        </p>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-3">Spanish Beats' strength: actual learning, not just testing</h2>
        <p className="text-foreground leading-relaxed">
          LyricsTraining tests what you already know. Spanish Beats teaches you things you don't know yet — through structured lessons, tap-to-translate, spaced repetition, and AI conversation practice.
        </p>

        <div className="mt-8 text-center">
          <Link to="/register">
            <Button size="lg" className="bg-primary text-white">
              Try Spanish Beats free <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </article>
    </BlogLayout>
  );
}