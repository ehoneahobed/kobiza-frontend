'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { streamRepurposeContent } from '@/lib/ai';
import { createBillingCheckout, getMyPlan } from '@/lib/billing';
import { Button } from '@/components/ui/Button';

type ContentType = 'lesson' | 'transcript' | 'post';

const FORMATS = [
  'Blog Post',
  'Twitter/X Thread',
  'LinkedIn Post',
  'Email Newsletter',
  'Short-Form Video Script',
];

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  lesson: 'Lesson',
  transcript: 'Transcript',
  post: 'Post',
};

/** Parse the streamed markdown into sections keyed by format name */
function parseFormats(raw: string): Record<string, string> {
  const sections: Record<string, string> = {};
  let currentFormat = '';
  const currentLines: string[] = [];

  for (const line of raw.split('\n')) {
    const match = line.match(/^###\s+FORMAT:\s*(.+)/);
    if (match) {
      if (currentFormat) {
        sections[currentFormat] = currentLines.join('\n').trim();
        currentLines.length = 0;
      }
      currentFormat = match[1].trim();
    } else if (currentFormat) {
      currentLines.push(line);
    }
  }
  if (currentFormat) sections[currentFormat] = currentLines.join('\n').trim();
  return sections;
}

export default function ContentEnginePage() {
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<ContentType>('lesson');
  const [streaming, setStreaming] = useState(false);
  const [rawOutput, setRawOutput] = useState('');
  const [activeFormatIdx, setActiveFormatIdx] = useState(0);
  const [error, setError] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    getMyPlan()
      .then((p) => setIsPro(p.plan === 'PRO'))
      .catch(() => setIsPro(false));
  }, []);

  const handleGenerate = () => {
    if (!content.trim() || streaming) return;
    setStreaming(true);
    setRawOutput('');
    setError('');
    setActiveFormatIdx(0);
    setCopied(false);
    abortRef.current = streamRepurposeContent(
      content.trim(),
      contentType,
      (chunk) => setRawOutput((prev) => prev + chunk),
      () => setStreaming(false),
      (msg) => {
        setError(msg);
        setStreaming(false);
      },
    );
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    try {
      const { url } = await createBillingCheckout('PRO');
      window.location.href = url;
    } catch {
      setUpgradeLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isPro === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sections = parseFormats(rawOutput);
  const activeFormatName = FORMATS[activeFormatIdx];
  const activeContent = sections[activeFormatName] ?? '';

  // Figure out which format is currently streaming (first one with no content yet)
  const streamingFormatIdx = streaming
    ? FORMATS.findIndex((f) => !sections[f])
    : -1;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-[#1F2937]">AI Content Engine</h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-[#0D9488] bg-[#0D9488]/10 border border-[#0D9488]/20">
            Pro
          </span>
        </div>
        <p className="text-[#6B7280]">
          Paste any content and repurpose it into 5 platform-ready formats simultaneously.
        </p>
      </div>

      {/* Pro gate */}
      {!isPro ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">🔄</div>
          <h2 className="text-xl font-bold text-[#1F2937] mb-2">Pro Feature</h2>
          <p className="text-[#6B7280] max-w-sm mx-auto mb-6">
            AI Content Engine is available on the Pro plan. Turn one piece of content into 5 platform-optimized formats instantly.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Button onClick={handleUpgrade} loading={upgradeLoading}>
              Upgrade to Pro — $50/month
            </Button>
            <Link href="/dashboard/billing" className="text-sm text-[#6B7280] hover:text-[#0D9488]">
              Compare plans →
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
          {/* ── Input panel ── */}
          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
            {/* Content type selector */}
            <div>
              <label className="text-sm font-medium text-[#1F2937] block mb-2">Content Type</label>
              <div className="flex gap-2 flex-wrap">
                {(['lesson', 'transcript', 'post'] as ContentType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setContentType(t)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      contentType === t
                        ? 'bg-[#0D9488] text-white'
                        : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                    }`}
                  >
                    {CONTENT_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Content textarea */}
            <div className="flex flex-col flex-1">
              <label className="text-sm font-medium text-[#1F2937] block mb-2">
                Your Content
                <span className="ml-2 text-xs text-[#6B7280] font-normal">
                  ({content.length} chars)
                </span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  contentType === 'lesson'
                    ? 'Paste your lesson notes, script, or key points here…'
                    : contentType === 'transcript'
                    ? 'Paste your video or podcast transcript here…'
                    : 'Paste your blog post, newsletter, or social post here…'
                }
                rows={16}
                disabled={streaming}
                className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488] resize-none disabled:opacity-60"
              />
            </div>

            {error && (
              <p className="text-sm text-[#EF4444] bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            {streaming ? (
              <Button onClick={handleStop} variant="secondary" className="w-full">
                Stop Generating
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={!content.trim()}
                className="w-full"
              >
                ✨ Repurpose Content
              </Button>
            )}
          </div>

          {/* ── Output panel ── */}
          <div className="bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[500px]">
            {/* Format tabs */}
            <div className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
              <div className="flex overflow-x-auto px-4 pt-3 gap-1">
                {FORMATS.map((fmt, i) => {
                  const hasContent = !!sections[fmt];
                  const isStreaming = streamingFormatIdx === i;
                  return (
                    <button
                      key={fmt}
                      onClick={() => setActiveFormatIdx(i)}
                      className={`px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors relative flex items-center gap-1.5 border-b-2 -mb-px ${
                        activeFormatIdx === i
                          ? 'border-[#0D9488] text-[#0D9488] bg-white'
                          : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
                      }`}
                    >
                      {hasContent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] flex-shrink-0" />
                      )}
                      {isStreaming && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                      )}
                      {fmt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 p-6 overflow-y-auto">
              {!rawOutput && !streaming ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="text-4xl mb-3">✍️</div>
                  <p className="font-medium text-[#1F2937] mb-1">Ready to repurpose</p>
                  <p className="text-sm text-[#6B7280] max-w-xs">
                    Paste your content on the left and hit generate. All 5 formats appear simultaneously.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-1.5 text-xs text-[#6B7280] text-left">
                    {FORMATS.map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              ) : activeContent ? (
                <div>
                  <pre className="whitespace-pre-wrap font-sans text-sm text-[#1F2937] leading-relaxed">
                    {activeContent}
                    {streaming && streamingFormatIdx === activeFormatIdx && (
                      <span className="inline-block w-2 h-4 bg-[#0D9488] animate-pulse ml-0.5 rounded-sm align-middle" />
                    )}
                  </pre>
                  <div className="mt-6 pt-4 border-t border-[#F3F4F6]">
                    <button
                      onClick={() => handleCopy(activeContent)}
                      className="text-xs font-medium text-[#0D9488] hover:underline"
                    >
                      {copied ? '✓ Copied!' : 'Copy to clipboard'}
                    </button>
                  </div>
                </div>
              ) : streaming ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="w-6 h-6 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm text-[#6B7280]">Generating {activeFormatName}…</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">Switch tabs to see formats as they complete</p>
                </div>
              ) : (
                <p className="text-sm text-[#6B7280] py-4">No content generated for this format.</p>
              )}
            </div>

            {/* Streaming progress bar */}
            {streaming && (
              <div className="border-t border-[#F3F4F6] px-6 py-3 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#0D9488] animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-[#6B7280]">
                    Generating all 5 formats… {Object.keys(sections).length} of {FORMATS.length} complete
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
