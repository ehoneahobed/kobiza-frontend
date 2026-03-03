'use client';

import { useState, useEffect } from 'react';

interface VideoPlayerProps {
  embedUrl: string;
  lessonTitle: string;
  lessonNumber: string;
  courseTitle: string;
}

export default function VideoPlayer({
  embedUrl,
  lessonTitle,
  lessonNumber,
}: VideoPlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = () => {
    const container = document.getElementById('kobiza-player');
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return (
    <div id="kobiza-player" className="w-full bg-[#0B1120]">
      {/* ── Branded header bar ── */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-2 bg-[#0B1120]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#0D9488] flex items-center justify-center flex-shrink-0">
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
              <path d="M1.5 1.5V12.5L10.5 7L1.5 1.5Z" fill="white" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-white/35 text-[10px] font-semibold uppercase tracking-wider leading-none">
              {lessonNumber}
            </p>
            <p className="text-white/90 text-sm font-medium truncate leading-snug mt-0.5">
              {lessonTitle}
            </p>
          </div>
        </div>

        <button
          onClick={handleFullscreen}
          className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M5 1V4H1M11 1V4H15M5 15V12H1M11 15V12H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M1 5V1H5M15 5V1H11M1 11V15H5M15 11V15H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      {/*
        ── Video iframe ──
        The iframe is oversized and repositioned inside an overflow:hidden
        container to crop out YouTube/Vimeo's top chrome bar (~48px title +
        channel) and bottom "Watch on YouTube" badge. The visible area
        remains 16:9.
      */}
      <div
        className="relative w-full overflow-hidden bg-black"
        style={{ paddingBottom: '56.25%' }}
      >
        <iframe
          src={embedUrl}
          title={lessonTitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute border-0"
          style={{
            top: '-9.5%',
            left: '-2%',
            width: '104%',
            height: '122%',
          }}
        />
      </div>

      {/* ── Teal accent line ── */}
      <div className="h-[3px] bg-[#0D9488]" />
    </div>
  );
}
