import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, ArrowLeft } from 'lucide-react';

export default function SongPageSkeleton() {
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="safe-area-top flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="p-2 -ml-2">
          <ArrowLeft className="h-5 w-5 text-muted-foreground/40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
      </div>

      {/* Song header */}
      <div className="px-4 py-4 flex items-center gap-4 border-b border-border">
        <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-16 rounded-full" />
          <Skeleton className="h-5 w-3/4 rounded" />
          <Skeleton className="h-4 w-1/2 rounded" />
        </div>
      </div>

      {/* Tab pills */}
      <div className="px-4 py-3 flex gap-2 border-b border-border">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>

      {/* Video area with disabled play button */}
      <div className="relative bg-black aspect-video flex items-center justify-center">
        <button disabled className="flex items-center justify-center h-14 w-14 rounded-full bg-white/10 animate-pulse">
          <Play className="h-6 w-6 text-white/40 ml-0.5" />
        </button>
      </div>

      {/* Shimmer lyric lines */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 no-scrollbar">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-2xl px-4 py-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}