'use client';

import { useState, useRef, useCallback } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  maxLength?: number;
  className?: string;
  disabled?: boolean;
}

type FormatAction = 'bold' | 'italic' | 'heading' | 'ul' | 'ol' | 'link' | 'quote' | 'code';

const TOOLBAR_ITEMS: { action: FormatAction; label: string; icon: React.ReactNode }[] = [
  {
    action: 'bold',
    label: 'Bold',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
        <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      </svg>
    ),
  },
  {
    action: 'italic',
    label: 'Italic',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="4" x2="10" y2="4" />
        <line x1="14" y1="20" x2="5" y2="20" />
        <line x1="15" y1="4" x2="9" y2="20" />
      </svg>
    ),
  },
  {
    action: 'heading',
    label: 'Heading',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 4v16" />
        <path d="M18 4v16" />
        <path d="M6 12h12" />
      </svg>
    ),
  },
  {
    action: 'ul',
    label: 'Bullet List',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="9" y1="6" x2="20" y2="6" />
        <line x1="9" y1="12" x2="20" y2="12" />
        <line x1="9" y1="18" x2="20" y2="18" />
        <circle cx="4" cy="6" r="1" fill="currentColor" />
        <circle cx="4" cy="12" r="1" fill="currentColor" />
        <circle cx="4" cy="18" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    action: 'ol',
    label: 'Numbered List',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="10" y1="6" x2="20" y2="6" />
        <line x1="10" y1="12" x2="20" y2="12" />
        <line x1="10" y1="18" x2="20" y2="18" />
        <text x="2" y="8" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text>
        <text x="2" y="14" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text>
        <text x="2" y="20" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">3</text>
      </svg>
    ),
  },
  {
    action: 'link',
    label: 'Link',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    action: 'quote',
    label: 'Blockquote',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z" />
      </svg>
    ),
  },
  {
    action: 'code',
    label: 'Code',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
];

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 4,
  label,
  maxLength,
  className = '',
  disabled = false,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = useCallback(
    (action: FormatAction) => {
      const ta = textareaRef.current;
      if (!ta) return;

      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = value.slice(start, end);
      let before = value.slice(0, start);
      let after = value.slice(end);
      let replacement = '';
      let cursorOffset = 0;

      switch (action) {
        case 'bold':
          replacement = `**${selected || 'bold text'}**`;
          cursorOffset = selected ? replacement.length : 2;
          break;
        case 'italic':
          replacement = `*${selected || 'italic text'}*`;
          cursorOffset = selected ? replacement.length : 1;
          break;
        case 'heading':
          // Insert ## at start of current line
          {
            const lineStart = before.lastIndexOf('\n') + 1;
            const prefix = before.slice(lineStart);
            before = before.slice(0, lineStart);
            replacement = `## ${prefix}${selected}`;
            cursorOffset = replacement.length;
          }
          break;
        case 'ul':
          replacement = `- ${selected || 'list item'}`;
          cursorOffset = replacement.length;
          break;
        case 'ol':
          replacement = `1. ${selected || 'list item'}`;
          cursorOffset = replacement.length;
          break;
        case 'link':
          if (selected) {
            replacement = `[${selected}](url)`;
            cursorOffset = replacement.length - 1;
          } else {
            replacement = '[link text](url)';
            cursorOffset = 1;
          }
          break;
        case 'quote':
          replacement = `> ${selected || 'quote'}`;
          cursorOffset = replacement.length;
          break;
        case 'code':
          if (selected.includes('\n')) {
            replacement = `\`\`\`\n${selected}\n\`\`\``;
          } else {
            replacement = `\`${selected || 'code'}\``;
          }
          cursorOffset = replacement.length;
          break;
      }

      const newValue = before + replacement + after;
      onChange(newValue);

      // Restore cursor position
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const pos = before.length + cursorOffset;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(pos, pos);
        }
      });
    },
    [value, onChange],
  );

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-sm font-medium text-[#1F2937]">{label}</label>}

      <div className="rounded-lg border border-[#6B7280] focus-within:ring-2 focus-within:ring-[#0D9488] focus-within:border-transparent overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center border-b border-[#E5E7EB] bg-[#F9FAFB]">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'write'
                ? 'text-[#1F2937] border-b-2 border-[#0D9488] -mb-px bg-white'
                : 'text-[#6B7280] hover:text-[#1F2937]'
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'preview'
                ? 'text-[#1F2937] border-b-2 border-[#0D9488] -mb-px bg-white'
                : 'text-[#6B7280] hover:text-[#1F2937]'
            }`}
          >
            Preview
          </button>

          {/* Toolbar — only on write tab */}
          {tab === 'write' && (
            <div className="flex items-center gap-0.5 ml-auto mr-2">
              {TOOLBAR_ITEMS.map((item) => (
                <button
                  key={item.action}
                  type="button"
                  title={item.label}
                  onClick={() => applyFormat(item.action)}
                  disabled={disabled}
                  className="p-1.5 rounded text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F3F4F6] transition-colors disabled:opacity-40"
                >
                  {item.icon}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content area */}
        {tab === 'write' ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            maxLength={maxLength}
            disabled={disabled}
            className="w-full px-4 py-3 text-[#1F2937] placeholder-[#6B7280] focus:outline-none resize-none text-sm bg-white border-0"
          />
        ) : (
          <div className="px-4 py-3 min-h-[calc(1.5em*var(--rows,4)+1.5rem)]" style={{ '--rows': rows } as React.CSSProperties}>
            {value ? (
              <MarkdownRenderer content={value} size="sm" />
            ) : (
              <p className="text-[#6B7280] text-sm italic">Nothing to preview</p>
            )}
          </div>
        )}
      </div>

      {maxLength && (
        <p className={`text-xs text-right ${value.length > maxLength * 0.9 ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}
