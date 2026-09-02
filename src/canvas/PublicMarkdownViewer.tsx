/**
 * PublicMarkdownViewer — beautiful full-page markdown rendering for production.
 * Loads content from static JSON, renders with react-markdown.
 * Clean typography, syntax-highlighted code, responsive layout.
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Highlight, themes } from 'prism-react-renderer';
import type { PublicCanvasData } from './types';

interface PublicMarkdownViewerProps {
  data: PublicCanvasData;
  title: string;
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

export default function PublicMarkdownViewer({ data, title }: PublicMarkdownViewerProps) {
  if (!data.content) {
    return (
      <div className="w-full h-[calc(100vh-78px)] flex items-center justify-center">
        <p className="text-gray-400 text-lg">No content yet</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-78px)] bg-white">
      {/* Article */}
      <article className="max-w-[1000px] mx-auto px-6 sm:px-10 lg:px-16 py-10 sm:py-14">
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
            }}
          >
            {data.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
