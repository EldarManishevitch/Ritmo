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

export default function GrammarInsight({ line }) {
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
          'Keep the whole thing under 120 words.\n\n' +
          `Spanish line: "${line.spanish_text}"\n` +
          `English translation: "${line.english_translation || ''}"`,
        response_json_schema: {
          type: 'object',
          properties: {
            explanation: { type: 'string' },
            example: { type: 'string' },
          },
          required: ['explanation', 'example'],
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
    loadInsight();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="text-xs text-[#6C6BD4] hover:underline cursor-pointer flex items-center gap-0.5 flex-shrink-0"
      >
        <Lightbulb className="h-3 w-3" />
        Grammar
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
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}