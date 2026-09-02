/**
 * PublicMarkdownViewer — beautiful full-page markdown rendering for production.
 * 80% content on left, 20% sticky TOC sidebar on right.
 * TOC auto-highlights current section as you scroll.
 */

import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Highlight, themes } from 'prism-react-renderer';
import type { PublicCanvasData } from './types';

interface PublicMarkdownViewerProps {
  data: PublicCanvasData;
  title: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

/** Generate a slug from heading text */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/** Parse markdown text to extract headings for TOC */
function extractHeadings(markdown: string): TocItem[] {
  const headings: TocItem[] = [];
  const lines = markdown.split('\n');
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '').trim();
      headings.push({ id: slugify(text), text, level });
    }
  }
  return headings;
}

/** Syntax-highlighted code block */
function CodeBlock({ children, className }: { children: string; className?: string }) {
  const language = className?.replace('language-', '') || 'text';
  const code = String(children).replace(/\n$/, '');
  return (
    <Highlight theme={themes.oneDark} code={code} language={language}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre style={{ ...style, borderRadius: 10, padding: '16px 20px', fontSize: 13, lineHeight: 1.7, overflow: 'auto', margin: '1.2em 0' }}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              <span style={{ display: 'inline-block', width: 32, textAlign: 'right', paddingRight: 16, color: 'rgba(255,255,255,0.2)', userSelect: 'none', fontSize: 11 }}>
                {i + 1}
              </span>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}

/** Custom heading renderer that adds id attributes for TOC linking */
function HeadingRenderer({ level, children }: { level: number; children: React.ReactNode }) {
  const text = String(children).replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '');
  const id = slugify(text);
  if (level === 1) return <h1 id={id}>{children}</h1>;
  if (level === 2) return <h2 id={id}>{children}</h2>;
  if (level === 3) return <h3 id={id}>{children}</h3>;
  return <h4 id={id}>{children}</h4>;
}

/** TOC Sidebar */
function TocSidebar({ headings, activeId }: { headings: TocItem[]; activeId: string }) {
  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  if (headings.length === 0) return null;

  // Find the minimum heading level to normalize indentation
  const minLevel = Math.min(...headings.map(h => h.level));

  return (
    <nav className="space-y-0.5">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
        On this page
      </div>
      {headings.map((item, i) => {
        const indent = (item.level - minLevel) * 14;
        const isActive = item.id === activeId;
        return (
          <button
            key={`${item.id}-${i}`}
            onClick={() => handleClick(item.id)}
            className={`block w-full text-left transition-all duration-200 rounded-md px-2.5 py-1.5 text-[12px] leading-snug ${
              isActive
                ? 'text-emerald-600 font-semibold bg-emerald-50 border-l-2 border-emerald-500'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 border-l-2 border-transparent'
            }`}
            style={{ paddingLeft: `${indent + 10}px` }}
          >
            {item.text}
          </button>
        );
      })}
    </nav>
  );
}

export default function PublicMarkdownViewer({ data, title }: PublicMarkdownViewerProps) {
  const [activeId, setActiveId] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  const headings = useMemo(() => extractHeadings(data.content || ''), [data.content]);

  // IntersectionObserver to track which heading is in view
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first heading that is intersecting (visible)
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0.1,
      }
    );

    // Observe all heading elements
    const timer = setTimeout(() => {
      for (const heading of headings) {
        const el = document.getElementById(heading.id);
        if (el) observer.observe(el);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [headings]);

  if (!data.content) {
    return (
      <div className="w-full h-[calc(100vh-78px)] flex items-center justify-center">
        <p className="text-gray-400 text-lg">No content yet</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-78px)] bg-white flex">
      {/* Main content — 80% */}
      <div ref={contentRef} className="flex-1 overflow-y-auto" style={{ flex: '0 0 80%' }}>
        <article className="max-w-[900px] mx-auto px-8 sm:px-12 py-10 sm:py-14">
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-8 pb-6 border-b-2 border-gray-100">
            {title}
          </h1>

          {/* Markdown content */}
          <div className="public-md-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code({ className, children, ...props }) {
                  const isBlock = className?.startsWith('language-');
                  if (isBlock) {
                    return <CodeBlock className={className}>{String(children)}</CodeBlock>;
                  }
                  return <code className="inline-code" {...props}>{children}</code>;
                },
                h1: ({ children }) => <HeadingRenderer level={1}>{children}</HeadingRenderer>,
                h2: ({ children }) => <HeadingRenderer level={2}>{children}</HeadingRenderer>,
                h3: ({ children }) => <HeadingRenderer level={3}>{children}</HeadingRenderer>,
                h4: ({ children }) => <HeadingRenderer level={4}>{children}</HeadingRenderer>,
              }}
            >
              {data.content}
            </ReactMarkdown>
          </div>
        </article>
      </div>

      {/* TOC Sidebar — 20% */}
      <aside className="hidden lg:block border-l border-gray-100 bg-gray-50/50" style={{ flex: '0 0 20%' }}>
        <div className="sticky top-0 p-5 pt-10 max-h-screen overflow-y-auto">
          <TocSidebar headings={headings} activeId={activeId} />
        </div>
      </aside>
    </div>
  );
}
