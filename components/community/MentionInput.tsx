'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { searchMembers, MentionSuggestion } from '@/lib/community';

interface Props {
  communityId: string;
  value: string;
  onChange: (value: string, mentionMap: Map<string, string>) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
}

/**
 * A textarea that supports @mention autocomplete.
 *
 * When the user types "@" followed by any text, a dropdown of community
 * members is shown. Selecting a member inserts "@DisplayName" and stores
 * the mapping { displayName → userId } in the parent via onChange.
 */
export default function MentionInput({
  communityId,
  value,
  onChange,
  placeholder,
  rows = 3,
  className = '',
  disabled,
}: Props) {
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [query, setQuery] = useState('');
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [mentionMap, setMentionMap] = useState<Map<string, string>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  const doSearch = useCallback(
    (q: string) => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (!q) {
        setSuggestions([]);
        return;
      }
      searchTimer.current = setTimeout(async () => {
        try {
          const results = await searchMembers(communityId, q);
          setSuggestions(results);
          setHighlightIdx(0);
        } catch {
          setSuggestions([]);
        }
      }, 300);
    },
    [communityId],
  );

  const closeSuggestions = () => {
    setSuggestions([]);
    setMentionStart(null);
    setQuery('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart ?? text.length;

    // Find the nearest @ before the cursor
    const before = text.slice(0, cursor);
    const atIdx = before.lastIndexOf('@');

    if (atIdx !== -1) {
      // There must be no space between @ and cursor
      const fragment = before.slice(atIdx + 1);
      if (!fragment.includes(' ') && !fragment.includes('\n')) {
        setMentionStart(atIdx);
        setQuery(fragment);
        doSearch(fragment);
      } else {
        closeSuggestions();
      }
    } else {
      closeSuggestions();
    }

    onChange(text, mentionMap);
  };

  const insertMention = (suggestion: MentionSuggestion) => {
    if (mentionStart === null) return;
    const before = value.slice(0, mentionStart);
    const after = value.slice(mentionStart + 1 + query.length);
    const newValue = `${before}@${suggestion.name}${after}`;

    const newMap = new Map(mentionMap);
    newMap.set(suggestion.name, suggestion.id);
    setMentionMap(newMap);

    onChange(newValue, newMap);
    closeSuggestions();

    // Restore focus and move cursor after the mention
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const pos = before.length + 1 + suggestion.name.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos, pos);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (suggestions[highlightIdx]) {
        e.preventDefault();
        insertMention(suggestions[highlightIdx]);
      }
    } else if (e.key === 'Escape') {
      closeSuggestions();
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        closeSuggestions();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={className}
      />
      {suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 left-0 bottom-full mb-1 w-64 bg-white rounded-xl shadow-lg border border-[#F3F4F6] overflow-hidden"
        >
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(s);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                i === highlightIdx ? 'bg-[#F3F4F6]' : 'hover:bg-[#F3F4F6]/60'
              }`}
            >
              {s.avatarUrl ? (
                <img src={s.avatarUrl} alt={s.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#0D9488]/15 flex items-center justify-center text-[#0D9488] text-xs font-bold flex-shrink-0">
                  {s.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm text-[#1F2937] font-medium truncate">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
