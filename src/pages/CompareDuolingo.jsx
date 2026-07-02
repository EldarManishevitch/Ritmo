import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import BlogLayout from '@/components/layout/BlogLayout';
import SEOHead from '@/components/SEOHead';
import ComparisonTable from '@/components/compare/ComparisonTable';

export default function CompareDuolingo() {
  return (
    <BlogLayout badge="App Comparison">
      <SEOHead
        title="Spanish Beats vs Duolingo: Which is better for Spanish? (2026)"
        description="Duolingo teaches cartoon Spanish. Spanish Beats teaches Bad Bunny Spanish. Honest comparison of features, price, and who each app is best for."
      />
      <article className="prose prose-sm max-w-none">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Spanish Beats vs Duolingo: Real Music vs Gamified Grammar</h1>
        <p className="text-muted-foreground leading-relaxed">
          Duolingo is the world's most downloaded language app — but it's built around abstract grammar exercises and cartoon characters. Spanish Beats is built around real music: Bad Bunny, Aventura, Karol G. Different tools for different goals.
        </p>

        <ComparisonTable
          rows={[
            { feature: 'Real songs from real artists', sb: 'Bad Bunny, Aventura, Karol G', cp: false },
            { feature: 'Tap-to-translate lyrics', sb: true, cp: false },
            { feature: 'Karaoke sync', sb: 'synced to YouTube', cp: false },
            { feature: 'CEFR-structured curriculum', sb: 'A1–C1 with certificates', cp: 'structured units' },
            { feature: 'AI voice conversation coach', sb: 'AI-powered', cp: false },
            { feature: 'Sing-along pronunciation scoring', sb: 'Pro feature', cp: false },
            { feature: 'Street slang / reggaeton vocab', sb: true, cp: 'limited' },
            { feature: 'Free tier available', sb: true, cp: true },
            { feature: 'Price', sb: 'Free / $9 Pro', cp: 'Free / $7 Super' },
          ]}
        />

        <h2 className="text-xl font-bold text-foreground mt-8 mb-3">When to choose Spanish Beats</h2>
        <ul className="space-y-2 text-foreground">
          <li className="flex gap-2"><span className="text-primary">•</span> You want to understand what's being said in Spanish music</li>
          <li className="flex gap-2"><span className="text-primary">•</span> You're learning from reggaeton, bachata, or pop latino</li>
          <li className="flex gap-2"><span className="text-primary">•</span> You want real street Spanish, not textbook phrases</li>
          <li className="flex gap-2"><span className="text-primary">•</span> You learn better by listening and singing than by drills</li>
        </ul>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-3">When Duolingo is still useful</h2>
        <ul className="space-y-2 text-foreground">
          <li className="flex gap-2"><span className="text-primary">•</span> You're building basic grammar foundations from scratch</li>
          <li className="flex gap-2"><span className="text-primary">•</span> You want a structured daily habit with gamification</li>
          <li className="flex gap-2"><span className="text-primary">•</span> You need a wide variety of languages (not just Spanish)</li>
        </ul>

        <div className="mt-8 text-center">
          <Link to="/register">
            <Button size="lg" className="bg-primary text-white">
              Try Spanish Beats free — learn Spanish through the music you actually listen to <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </article>
    </BlogLayout>
  );
}