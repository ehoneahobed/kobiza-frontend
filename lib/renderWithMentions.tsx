import React from 'react';

/**
 * Splits text on @mention tokens and wraps each mention in a teal span.
 * A mention is defined as `@` followed by one or more non-whitespace characters.
 */
export function renderWithMentions(text: string): React.ReactNode {
  const parts = text.split(/(@\S+)/);
  return (
    <>
      {parts.map((part, i) =>
        /^@\S+$/.test(part) ? (
          <span key={i} className="text-[#0D9488] font-medium">
            {part}
          </span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}
