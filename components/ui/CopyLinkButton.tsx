'use client';

import { useState } from 'react';

interface CopyLinkButtonProps {
  url: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function CopyLinkButton({ url, className = '', size = 'sm' }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sizeClass = size === 'md'
    ? 'px-4 py-2 text-sm rounded-xl'
    : 'px-3 py-1.5 text-xs rounded-lg';

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : `Copy link: ${url}`}
      className={`flex items-center gap-1.5 font-medium transition-all flex-shrink-0 ${
        copied
          ? 'bg-teal-50 text-[#0D9488] border border-teal-200'
          : 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB] hover:border-[#0D9488] hover:text-[#0D9488]'
      } ${sizeClass} ${className}`}
    >
      {copied ? (
        <>
          <span>✓</span>
          <span>Copied!</span>
        </>
      ) : (
        <>
          <span>🔗</span>
          <span>Copy Link</span>
        </>
      )}
    </button>
  );
}
