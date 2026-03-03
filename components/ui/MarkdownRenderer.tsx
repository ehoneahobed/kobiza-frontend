import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  size?: 'sm' | 'base' | 'lg';
  className?: string;
  compact?: boolean;
  lineClamp?: number;
  invert?: boolean;
}

const SIZE_CLASS = {
  sm: 'prose-sm',
  base: 'prose-base',
  lg: 'prose-lg',
} as const;

export default function MarkdownRenderer({
  content,
  size = 'base',
  className = '',
  compact = false,
  lineClamp,
  invert = false,
}: MarkdownRendererProps) {
  if (!content) return null;

  const proseClasses = [
    'prose',
    SIZE_CLASS[size],
    'max-w-none',
    // Kobiza color overrides
    'prose-headings:text-[#1F2937]',
    'prose-a:text-[#0D9488] prose-a:no-underline hover:prose-a:underline',
    'prose-strong:text-[#1F2937]',
    'prose-code:text-[#0D9488] prose-code:bg-[#F3F4F6] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none',
    'prose-pre:bg-[#1F2937] prose-pre:text-gray-100 prose-pre:rounded-xl',
    'prose-blockquote:border-l-[#0D9488] prose-blockquote:text-[#6B7280]',
    invert && 'prose-invert',
    compact && '[&>*]:my-1 [&>h1]:my-1 [&>h2]:my-1 [&>h3]:my-1',
    lineClamp && `line-clamp-${lineClamp}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={proseClasses}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, href, ...props }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
