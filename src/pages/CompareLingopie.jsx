import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import BlogLayout from '@/components/layout/BlogLayout';
import SEOHead from '@/components/SEOHead';
import ComparisonTable from '@/components/compare/ComparisonTable';

export default function CompareLingopie() {
  return (
    <BlogLayout badge="App Comparison">
      <SEOHead
        title="Spanish Beats vs Lingopie: Music vs TV Shows for learning Spanish (2026)"
        description="Lingopie uses TV shows. Spanish Beats uses music. Compare features, catalog size, and learning methods to find the right Spanish learning app for you."
      />
      <article className="prose prose-sm max-w-none">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Spanish Beats vs Lingopie: Songs vs TV Shows — Which Teaches Better Spanish?</h1>
        <p className="text-muted-foreground leading-relaxed">
          Lingopie lets you watch Spanish TV shows with interactive subtitles. Spanish Beats lets you sing along to Spanish music with tap-to-translate lyrics. Both use authentic content — the question is which medium works better for you.
        </p>

        <ComparisonTable
          rows={[
            { feature: 'Content type', sb: 'Real music (reggaeton, bachata, pop)', cp: 'TV shows & movies' },
            { feature: 'Tap/click to translate', sb: true, cp: 'click subtitles' },
            { feature: 'Active recall quizzes', sb: 'fill-in-blank, vocab match', cp: 'Basic flashcards' },
            { feature: 'CEFR curriculum', sb: 'A1–C1 with certificates', cp: false },
            { feature: 'Street slang focus', sb: 'reggaeton & bachata slang dictionary', cp: false },
            { feature: 'AI conversation practice', sb: 'AI voice coach', cp: false },
            { feature: 'Price', sb: 'Free / $9', cp: '~$12/month' },
          ]}
        />

        <h2 className="text-xl font-bold text-foreground mt-8 mb-3">The key difference: passive vs active</h2>
        <p className="text-foreground leading-relaxed">
          Music forces active engagement — you're singing, tapping words, answering quizzes. TV is more passive — you watch with subtitles. Both are valid, but research shows active production (singing, speaking) leads to faster retention.
        </p>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-3">Who should choose Spanish Beats</h2>
        <p className="text-foreground leading-relaxed">
          Fans of Latin music who want to understand what they're hearing. Learners who want structured progression with CEFR levels. Anyone who finds TV-watching passive and wants to actively produce Spanish.
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