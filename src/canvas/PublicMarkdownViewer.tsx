/**
 * PublicMarkdownViewer — beautiful full-page markdown rendering for production.
 * 80% content on left (fills fully), 20% sticky TOC sidebar with tree lines on right.
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function extractHeadings(markdown: string): TocItem[] {
  const headings: TocItem[] = [];
  const lines = markdown.split('\n');
  let inCodeBlock = false;
  for (const line of lines) {
    if (line.trim().startsWith('```')) { inCodeBlock = !inCodeBlock; continue; }
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

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const language = className?.replace('language-', '') || 'text';
  const code = String(children).replace(/\n$/, '');
  return (
    <Highlight theme={themes.oneDark} code={code} language={language}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre style={{ ...style, borderRadius: 10, padding: '16px 20px', fontSize: 13, lineHeight: 1.7, overflow: 'auto', margin: '1.2em 0' }}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              <span style={{ display: 'inline-block', width: 32, textAlign: 'right', paddingRight: 16, color: 'rgba(255,255,255,0.2)', userSelect: 'none', fontSize: 11 }}>{i + 1}</span>
              {line.map((token, key) => <span key={key} {...getTokenProps({ token })} />)}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}

function HeadingRenderer({ level, children }: { level: number; children: React.ReactNode }) {
  const text = String(children).replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '');
  const id = slugify(text);
  if (level === 1) return <h1 id={id}>{children}</h1>;
  if (level === 2) return <h2 id={id}>{children}</h2>;
  if (level === 3) return <h3 id={id}>{children}</h3>;
  return <h4 id={id}>{children}</h4>;
}

/** For each heading, determine which ancestor depth levels still have siblings below */
function getActiveLevels(headings: TocItem[], idx: number, minLevel: number): Set<number> {
  const active = new Set<number>();
  const current = headings[idx];
  // For each depth from 0 to current depth, check if there's a sibling at that level below
  for (let d = 0; d <= current.level - minLevel; d++) {
    const targetLevel = minLevel + d;
    for (let j = idx + 1; j < headings.length; j++) {
      if (headings[j].level < targetLevel) break; // went above this level — no more siblings
      if (headings[j].level === targetLevel) {
        active.add(d);
        break;
      }
    }
  }
  return active;
}

/** TOC Sidebar with tree lines */
function TocSidebar({ headings, activeId }: { headings: TocItem[]; activeId: string }) {
  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  if (headings.length === 0) return null;

  const minLevel = Math.min(...headings.map(h => h.level));

  return (
    <nav>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
        On this page
      </div>
      <div className="relative">
        {headings.map((item, i) => {
          const depth = item.level - minLevel;
          const isActive = item.id === activeId;
          const activeLevels = getActiveLevels(headings, i, minLevel);

          return (
            <div key={`${item.id}-${i}`} className="relative" style={{ paddingLeft: depth * 16 }}>
              {/* Continuous vertical lines for each ancestor level that has more siblings */}
              {Array.from({ length: depth }, (_, d) => (
                activeLevels.has(d) || d === depth - 1 ? (
                  <div
                    key={d}
                    className="absolute border-l border-gray-200"
                    style={{
                      left: d * 16 + 8,
                      top: 0,
                      bottom: d === depth - 1 && !activeLevels.has(depth - 1) ? '50%' : 0,
                      width: 1,
                    }}
                  />
                ) : null
              ))}
              {/* Horizontal branch line */}
              {depth > 0 && (
                <div
                  className="absolute border-t border-gray-200"
                  style={{
                    left: (depth - 1) * 16 + 8,
                    top: '50%',
                    width: 8,
                  }}
                />
              )}
              {/* Dot connector */}
              {depth > 0 && (
                <div
                  className={`absolute rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
                  style={{
                    left: depth * 16 - 2,
                    top: 'calc(50% - 2.5px)',
                    width: 5,
                    height: 5,
                  }}
                />
              )}
              <button
                onClick={() => handleClick(item.id)}
                className={`block w-full text-left transition-all duration-150 rounded-md py-1.5 text-[11.5px] leading-snug ${
                  isActive
                    ? 'text-emerald-700 font-semibold bg-emerald-50'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'
                } ${depth === 0 ? 'font-medium text-[12px] text-gray-700' : ''}`}
                style={{ paddingLeft: depth > 0 ? 12 : 8 }}
              >
                {item.text}
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

export default function PublicMarkdownViewer({ data, title }: PublicMarkdownViewerProps) {
  const [activeId, setActiveId] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const headings = useMemo(() => extractHeadings(data.content || ''), [data.content]);

  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) { setActiveId(entry.target.id); break; }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );
    const timer = setTimeout(() => {
      for (const heading of headings) {
        const el = document.getElementById(heading.id);
        if (el) observer.observe(el);
      }
    }, 300);
    return () => { clearTimeout(timer); observer.disconnect(); };
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
      {/* Main content — fills 80% fully */}
      <div ref={contentRef} className="overflow-y-auto" style={{ flex: '0 0 80%' }}>
        <article className="px-10 sm:px-14 lg:px-20 py-10 sm:py-14">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-8 pb-6 border-b-2 border-gray-100">
            {title}
          </h1>
          <div className="public-md-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code({ className, children, ...props }) {
                  const isBlock = className?.startsWith('language-');
                  if (isBlock) return <CodeBlock className={className}>{String(children)}</CodeBlock>;
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

      {/* TOC Sidebar — 20% with tree lines */}
      <aside className="hidden lg:block border-l border-gray-100 bg-gray-50/30" style={{ flex: '0 0 20%' }}>
        <div className="sticky top-0 p-4 pt-10 max-h-screen overflow-y-auto">
          <TocSidebar headings={headings} activeId={activeId} />
        </div>
      </aside>
    </div>
  );
}
