import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSlangSongIdMap } from '@/data/hooks/useSlangDictionary';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Heart, ArrowRight } from 'lucide-react';
import BlogLayout from '@/components/layout/BlogLayout';
import SEOHead from '@/components/SEOHead';
import JsonLd from '@/components/JsonLd';

const DR_TERMS = [
  { term: 'vaina', contextual: 'thing / stuff / situation', literal: 'pod, sheath', english: 'thing / whatever', category: 'slang', song: { title: 'Propuesta Indecente', artist: 'Romeo Santos', line: 'Esta vaina me tiene loco', translation: 'This whole thing has me crazy' } },
  { term: 'tíguere', contextual: 'a sharp street-smart guy, sometimes a player', literal: 'tiger', english: 'dude / slick guy', category: 'slang', song: { title: 'Bachata Rosa', artist: 'Juan Luis Guerra' } },
  { term: 'jevita / jevo', contextual: 'girlfriend / boyfriend, or an attractive girl/guy', literal: '—', english: 'babe / cutie', category: 'romantic', song: { title: 'Obsesión', artist: 'Aventura', line: 'Esa jevita me trae loco', translation: 'That girl drives me crazy' } },
  { term: 'chin', contextual: 'a little bit', literal: '—', english: 'a tiny bit', category: 'slang', song: { title: 'Eres Mía', artist: 'Romeo Santos', line: 'Dame un chin de tu amor', translation: 'Give me a little of your love' } },
  { term: 'qué lo qué', contextual: "Dominican greeting — 'what's up?'", literal: 'what (is) the what', english: "what's up / what's good", category: 'expression', song: { title: 'Volví', artist: 'Aventura' } },
  { term: 'dímelo', contextual: "tell me / what's up — Aventura's signature ad-lib", literal: 'tell it to me', english: 'talk to me', category: 'filler', song: { title: 'Almost every Aventura track', artist: 'Aventura', line: 'Dímelo, dímelo', translation: 'Talk to me, talk to me' } },
  { term: 'manín / manito', contextual: 'bro, friend', literal: 'little brother', english: 'bro / dude', category: 'slang', song: { title: 'Inmortal', artist: 'Aventura' } },
  { term: 'concón', contextual: 'the crispy rice at the bottom of the pot; metaphorically, the best part', literal: 'crispy bottom rice', english: 'the best part / the crunch', category: 'slang' },
  { term: 'fokin', contextual: "Anglicism of 'fucking' — heavy emphasis word", literal: '—', english: 'fucking', category: 'slang', song: { title: 'El Malo', artist: 'Aventura', line: 'Yo soy el fokin malo', translation: "I'm the freaking bad guy" } },
  { term: 'mi amor / mi vida', contextual: 'my love / my life — staple Bachata terms of endearment', literal: 'my love / my life', english: 'babe / sweetheart', category: 'romantic', song: { title: 'Te Extraño', artist: 'Xtreme' } },
  { term: 'guapo', contextual: "In DR specifically: angry, pissed off (NOT 'handsome')", literal: 'handsome (in standard Spanish)', english: 'angry / heated', category: 'slang' },
  { term: 'fula', contextual: 'US dollars, or money in general', literal: '—', english: 'cash / bucks', category: 'slang' },
  { term: 'klk', contextual: "Texted version of 'qué lo qué' — universal DR greeting in chats", literal: '—', english: 'wassup', category: 'expression' },
  { term: 'bregar', contextual: 'to deal with, to handle a situation', literal: 'to struggle / toil', english: 'to deal with it', category: 'slang', song: { title: 'Hermanita', artist: 'Aventura', line: 'Hay que bregar con esto', translation: "We've got to deal with this" } },
  { term: 'moreno / morena', contextual: 'Affectionate term for a dark-skinned love interest, common in Bachata romance', literal: 'dark one', english: 'my dark beauty', category: 'romantic', song: { title: 'La Morena', artist: 'Romeo Santos' } },
  { term: 'jangueo', contextual: 'hanging out, partying', literal: "from English 'hang'", english: 'kicking it / partying', category: 'slang', song: { title: 'Yo No Sé Mañana', artist: 'Luis Enrique' } },
  { term: 'diablo', contextual: "exclamation of shock — 'damn!'", literal: 'devil', english: 'damn / wow', category: 'filler' },
  { term: 'deja eso', contextual: 'drop it, stop it, leave it alone', literal: 'leave that', english: 'let it go', category: 'expression', song: { title: 'Su Veneno', artist: 'Aventura', line: 'Deja eso, mi vida', translation: 'Let it go, my love' } },
  { term: 'papi chulo', contextual: 'good-looking guy, sometimes a smooth talker — used flirtatiously', literal: 'pimp daddy', english: 'hot guy / lover boy', category: 'romantic' },
  { term: 'loco', contextual: "Used like 'man' or 'dude' at end of sentences — also 'crazy'", literal: 'crazy', english: 'man / dude', category: 'filler', song: { title: 'Volví', artist: 'Aventura', line: 'Loco, esto no se acaba', translation: "Man, this isn't over" } },
  { term: 'se fue la luz', contextual: 'the power went out — recurring slice-of-life image in DR music', literal: 'the light went away', english: "the power's out", category: 'expression', song: { title: 'Ojalá Que Llueva Café', artist: 'Juan Luis Guerra' } },
  { term: 'tato', contextual: "all good, OK — shortening of 'está todo'", literal: '—', english: 'all good / cool', category: 'filler' },
];

const CATEGORY_LABEL = { slang: 'Street slang', expression: 'Expression', romantic: 'Romantic / Bachata', filler: 'Filler / Ad-lib' };
const CATEGORY_COLOR = { slang: 'default', expression: 'secondary', romantic: 'default', filler: 'secondary' };

export default function DominicanSlangGuide() {
  const [q, setQ] = useState('');
  const { map: songIdMap } = useSlangSongIdMap();

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return DR_TERMS;
    return DR_TERMS.filter((t) =>
      [t.term, t.contextual, t.literal, t.english, t.song?.title || '', t.song?.artist || '']
        .join(' ').toLowerCase().includes(needle)
    );
  }, [q]);

  return (
    <BlogLayout title="Dominican Slang in Bachata: A Listener's Guide — Ritmo" badge="Bachata lyrics guide">
      <SEOHead
        title="Dominican Spanish Slang Guide | Spanish Beats"
        description="Dominican slang explained — the expressions you'll hear in bachata, from Aventura to Romeo Santos. Real street Spanish from the Dominican Republic."
      />
      <JsonLd
        id="dominican-slang"
        data={{
          '@context': 'https://schema.org',
          '@type': 'DefinedTermSet',
          name: 'Dominican Spanish Slang Guide',
          description: 'Dominican slang heard in bachata lyrics.',
          hasDefinedTerm: DR_TERMS.map((t) => ({
            '@type': 'DefinedTerm',
            name: t.term,
            description: t.contextual,
          })),
        }}
      />
      <h1 className="text-3xl font-bold text-foreground mb-4">Dominican Slang in Bachata Lyrics</h1>
      <p className="text-muted-foreground mb-6 leading-relaxed">Bachata isn't sung in textbook Spanish. It's sung in Dominican Spanish — fast, slangy, full of dropped 's' sounds and street vocabulary that even other Spanish speakers have to translate. If you've ever wondered what <em>"qué lo qué, mi jevita"</em> means, or why Romeo keeps saying <em>"dímelo"</em> between verses, this guide is for you.</p>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a word, phrase, song, or artist..."
          className="w-full pl-10 pr-4 h-12 rounded-lg border border-input bg-transparent text-base"
        />
      </div>

      <h2 className="text-xl font-bold text-foreground mb-4">The Dominican Bachata vocabulary</h2>
      <div className="space-y-3 mb-8">
        {filtered.map((t) => (
          <Card key={t.term} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-foreground">{t.term}</h3>
              <Badge variant={CATEGORY_COLOR[t.category]}>{CATEGORY_LABEL[t.category]}</Badge>
            </div>
            <p className="text-sm text-foreground mb-1"><strong>In context:</strong> {t.contextual}</p>
            {t.literal && t.literal !== '—' && <p className="text-sm text-muted-foreground mb-1"><strong>Literally:</strong> {t.literal}</p>}
            <p className="text-sm text-muted-foreground mb-2"><strong>English:</strong> {t.english}</p>
            {t.song && (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-xs text-primary font-medium">
                  {songIdMap[t.term.toLowerCase()] ? (
                    <Link to={`/song/${songIdMap[t.term.toLowerCase()]}`} className="hover:underline">Heard in {t.song.title} — {t.song.artist}</Link>
                  ) : (
                    <>Heard in {t.song.title} — {t.song.artist}</>
                  )}
                </p>
                {t.song.line && <p className="text-sm text-foreground italic mt-1">"{t.song.line}"</p>}
                {t.song.translation && <p className="text-xs text-muted-foreground mt-0.5">{t.song.translation}</p>}
              </div>
            )}
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-muted-foreground text-center py-8">No matches. Try a different word.</p>}
      </div>

      <h2 className="text-xl font-bold text-foreground mb-3">Why Bachata Spanish is its own dialect</h2>
      <p className="text-foreground mb-4 leading-relaxed">Dominican Spanish is famous for dropping the 's' at the end of syllables — <em>"¿cómo estás?"</em> becomes <em>"¿cómo'tá?"</em>. Bachata lyrics lean into that, plus a heavy dose of street vocabulary (<em>tíguere</em>, <em>jevita</em>, <em>vaina</em>) that you won't find in a Spanish class.</p>
      <p className="text-foreground mb-8 leading-relaxed">Aventura especially blended Bronx English with Dominican Spanish — Anthony "Romeo" Santos famously sings <em>"dímelo"</em> as an ad-lib the way American rappers say <em>"yeah"</em> or <em>"uh"</em>. It's filler that signals the genre.</p>

      <Card className="p-6 mb-8 bg-primary/5 border-primary/20">
        <h2 className="text-xl font-bold text-foreground mb-2">Learn Dominican Spanish from real Bachata</h2>
        <p className="text-muted-foreground mb-4">Ritmo turns Romeo Santos, Aventura, and Juan Luis Guerra tracks into interactive Spanish lessons — slang explained line-by-line as you listen.</p>
        <Link to="/login"><Button className="bg-primary text-white">Start with a Bachata you love <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
      </Card>

      <h2 className="text-xl font-bold text-foreground mb-4">Learn Dominican Spanish with these artists</h2>
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        <Link to="/learn-spanish-with/aventura" className="block p-4 rounded-xl border border-border hover:border-primary transition-colors">
          <h3 className="font-semibold text-foreground">Aventura &amp; Romeo Santos →</h3>
          <p className="text-sm text-muted-foreground">The kings of modern bachata</p>
        </Link>
        <Link to="/learn-spanish-with/bad-bunny" className="block p-4 rounded-xl border border-border hover:border-primary transition-colors">
          <h3 className="font-semibold text-foreground">Bad Bunny →</h3>
          <p className="text-sm text-muted-foreground">Puerto Rican reggaeton — related Caribbean slang</p>
        </Link>
      </div>
    </BlogLayout>
  );
}