import React from 'react';

/**
 * Premium vertical list of YouTube search results. Each card shows the video
 * thumbnail, title, and channel name. Clicking a card triggers selection.
 */
export default function YouTubeResultsGrid({ results, onSelect, disabled }) {
  if (!results?.length) return null;
  return (
    <div className="space-y-2">
      {results.map((video) => (
        <button
          key={video.youtube_id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(video)}
          className="w-full flex items-center gap-3 rounded-lg p-2 text-left transition-all border border-transparent hover:bg-[#23252F]/5 cursor-pointer hover:border-[#D96B43]/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-24 h-14 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#23252F] line-clamp-2">{video.title}</p>
            <p className="text-xs text-[#23252F]/60 truncate">{video.artist}</p>
          </div>
        </button>
      ))}
    </div>
  );
}