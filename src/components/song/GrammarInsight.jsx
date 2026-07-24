import React, { useState } from 'react';
import { Lightbulb, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

export default function GrammarInsight({ line, pulse = false, showBadge = false, onOpen }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState(null);
  const [error, setError] = useState(null);

  const loadInsight = async () => {
    if (insight) return;
    setLoading(true);
    setError(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:
          'You are a fun, casual Spanish teacher explaining grammar to an English speaker. ' +
          'Explain the grammar structure of the following Spanish lyric line IN ENGLISH. ' +
          'Be practical, casual, and fun. Mention the specific tense/mood used (e.g. Subjuntivo, Pretérito) and why. ' +
          'Then give a short real-life usage example in Spanish + English translation (e.g. ordering a beer, chatting with a friend). ' +
          'Finally, point out one specific way an English speaker\'s habits would cause a mistake here — name the English instinct, then what Spanish actually does and why (e.g. "English speakers drop the subjunctive here — Spanish keeps it because…"). Be concrete and short. ' +
          'Keep the whole thing under 150 words.\n\n' +
          `Spanish line: "${line.spanish_text}"\n` +
          `English translation: "${line.english_translation || ''}"`,
        response_json_schema: {
          type: 'object',
          properties: {
            explanation: { type: 'string' },
            example: { type: 'string' },
            l1_interference_tip: { type: 'string' },
          },
          required: ['explanation', 'example', 'l1_interference_tip'],
        },
      });
      setInsight(res);
    } catch (e) {
      setError(e?.message || 'Failed to load insight');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (e) => {
    e.stopPropagation();
    setOpen(true);
    try {
      localStorage.setItem('sb_grammar_note_opened', '1');
      localStorage.setItem('sb_passport_grammar_opened', '1');
    } catch { /* noop */ }
    onOpen?.();
    loadInsight();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`relative text-xs text-[#6C6BD4] hover:underline cursor-pointer flex items-center gap-0.5 flex-shrink-0 ${
          pulse ? 'animate-pulse font-bold ring-2 ring-[#6C6BD4]/40 rounded-full px-1.5 py-0.5 bg-[#6C6BD4]/5' : ''
        }`}
      >
        <Lightbulb className="h-3 w-3" />
        Grammar
        {showBadge && !open && (
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#6C6BD4] ring-1 ring-card" />
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="bg-[#F5F6F9] text-[#23252F] max-h-[80vh] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="text-[#23252F]">💡 Grammar Insight</SheetTitle>
            <SheetDescription className="text-[#23252F]/70">
              {line.spanish_text}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#6C6BD4]" />
              </div>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : insight ? (
              <div className="space-y-3">
                <p className="text-sm text-[#23252F] leading-relaxed whitespace-pre-line">
                  {insight.explanation}
                </p>
                <div className="rounded-xl bg-[#6C6BD4]/10 p-3">
                  <p className="text-xs font-semibold text-[#6C6BD4] mb-1">💡 Real-life example</p>
                  <p className="text-sm text-[#23252F] whitespace-pre-line">{insight.example}</p>
                </div>
                {insight.l1_interference_tip && (
                  <div className="rounded-xl bg-amber-100/70 border border-amber-200 p-3">
                    <p className="text-xs font-semibold text-amber-700 mb-1">⚠️ Watch out (English speakers)</p>
                    <p className="text-sm text-[#23252F] whitespace-pre-line">{insight.l1_interference_tip}</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}