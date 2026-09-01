/**
 * Custom tldraw shape: Markdown Block
 * Double-click to edit raw markdown, renders formatted content when not editing.
 */

import {
  ShapeUtil,
  HTMLContainer,
  Rectangle2d,
  resizeBox,
  T,
  type TLResizeInfo,
  type TLShape,
  type RecordProps,
  type Geometry2d,
} from 'tldraw';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Shape type registration ─────────────────────────────────────────────────

const MD_BLOCK_TYPE = 'md-block' as const;

declare module 'tldraw' {
  export interface TLGlobalShapePropsMap {
    [MD_BLOCK_TYPE]: {
      w: number;
      h: number;
      content: string;
      darkMode: boolean;
    };
  }
}

type IMdBlockShape = TLShape<typeof MD_BLOCK_TYPE>;

// ─── Markdown Block Component ────────────────────────────────────────────────

function MdBlockView({ shape, isEditing, onEditComplete }: {
  shape: IMdBlockShape;
  isEditing: boolean;
  onEditComplete: (content: string, darkMode: boolean) => void;
}) {
  const { content, darkMode, w, h } = shape.props;
  const [editContent, setEditContent] = useState(content);
  const [editDarkMode, setEditDarkMode] = useState(darkMode);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditContent(content);
      setEditDarkMode(darkMode);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isEditing, content, darkMode]);

  const handleSave = useCallback(() => {
    onEditComplete(editContent, editDarkMode);
  }, [editContent, editDarkMode, onEditComplete]);

  if (isEditing) {
    return (
      <div
        style={{
          width: w,
          height: h,
          background: '#1e293b',
          borderRadius: 10,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '2px solid #8b5cf6',
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.2)',
        }}>
          <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600 }}>Markdown</span>
          <div style={{ flex: 1 }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#94a3b8', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={editDarkMode}
              onChange={(e) => setEditDarkMode(e.target.checked)}
              style={{ width: 12, height: 12 }}
            />
            Dark
          </label>
          <button
            onClick={handleSave}
            style={{
              background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 4,
              padding: '3px 10px', fontSize: 10, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>

        {/* Raw markdown editor */}
        <textarea
          ref={textareaRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          spellCheck={false}
          placeholder="# Write Markdown here&#10;&#10;Supports **bold**, *italic*, tables, lists, code blocks, and more."
          style={{
            flex: 1, background: 'transparent', color: '#e2e8f0',
            border: 'none', outline: 'none', resize: 'none',
            padding: '12px 16px', fontSize: 13, lineHeight: 1.6,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            tabSize: 2,
          }}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const start = e.currentTarget.selectionStart;
              const end = e.currentTarget.selectionEnd;
              setEditContent(editContent.substring(0, start) + '  ' + editContent.substring(end));
              setTimeout(() => {
                e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
              }, 0);
            }
          }}
        />
      </div>
    );
  }

  // ─── Rendered markdown view ────────────────────────────────────────────

  const bg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#e2e8f0' : '#1e293b';
  const borderColor = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const mutedColor = darkMode ? '#94a3b8' : '#64748b';

  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 10,
        overflow: 'auto',
        background: bg,
        color: textColor,
        boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.08)',
        fontFamily: "'Inter', -apple-system, sans-serif",
        padding: '16px 20px',
        fontSize: 14,
        lineHeight: 1.7,
      }}
      className="md-block-rendered"
      onWheelCapture={(e) => e.stopPropagation()}
    >
      <style>{`
        .md-block-rendered h1 { font-size: 1.8em; font-weight: 700; margin: 0 0 0.5em; border-bottom: 2px solid ${borderColor}; padding-bottom: 0.3em; }
        .md-block-rendered h2 { font-size: 1.4em; font-weight: 600; margin: 1.2em 0 0.4em; color: ${darkMode ? '#a78bfa' : '#7c3aed'}; }
        .md-block-rendered h3 { font-size: 1.15em; font-weight: 600; margin: 1em 0 0.3em; }
        .md-block-rendered p { margin: 0.6em 0; }
        .md-block-rendered ul, .md-block-rendered ol { padding-left: 1.5em; margin: 0.5em 0; }
        .md-block-rendered li { margin: 0.25em 0; }
        .md-block-rendered strong { font-weight: 600; color: ${darkMode ? '#f1f5f9' : '#0f172a'}; }
        .md-block-rendered em { font-style: italic; }
        .md-block-rendered code {
          background: ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'};
          padding: 2px 6px; border-radius: 4px; font-size: 0.85em;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }
        .md-block-rendered pre {
          background: ${darkMode ? '#0f172a' : '#f1f5f9'};
          padding: 12px 16px; border-radius: 8px; overflow-x: auto;
          margin: 0.8em 0; font-size: 0.85em; line-height: 1.5;
        }
        .md-block-rendered pre code { background: none; padding: 0; }
        .md-block-rendered blockquote {
          border-left: 3px solid ${darkMode ? '#8b5cf6' : '#7c3aed'};
          padding: 0.5em 1em; margin: 0.8em 0;
          background: ${darkMode ? 'rgba(139,92,246,0.08)' : 'rgba(124,58,237,0.05)'};
          border-radius: 0 6px 6px 0;
        }
        .md-block-rendered blockquote p { margin: 0.2em 0; color: ${mutedColor}; }
        .md-block-rendered table { width: 100%; border-collapse: collapse; margin: 0.8em 0; font-size: 0.9em; }
        .md-block-rendered th, .md-block-rendered td {
          border: 1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'};
          padding: 8px 12px; text-align: left;
        }
        .md-block-rendered th {
          background: ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'};
          font-weight: 600;
        }
        .md-block-rendered a { color: ${darkMode ? '#a78bfa' : '#7c3aed'}; text-decoration: none; }
        .md-block-rendered a:hover { text-decoration: underline; }
        .md-block-rendered hr { border: none; border-top: 1px solid ${borderColor}; margin: 1.5em 0; }
        .md-block-rendered img { max-width: 100%; border-radius: 6px; }
        .md-block-rendered del { color: ${mutedColor}; }
      `}</style>
      {content ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {content}
        </ReactMarkdown>
      ) : (
        <p style={{ color: mutedColor, fontStyle: 'italic' }}>Double-click to add markdown content</p>
      )}
    </div>
  );
}

// ─── Shape Util ──────────────────────────────────────────────────────────────

export class MarkdownBlockShapeUtil extends ShapeUtil<IMdBlockShape> {
  static override type = MD_BLOCK_TYPE;
  static override props: RecordProps<IMdBlockShape> = {
    w: T.number,
    h: T.number,
    content: T.string,
    darkMode: T.boolean,
  };

  getDefaultProps(): IMdBlockShape['props'] {
    return {
      w: 500,
      h: 350,
      content: '',
      darkMode: true,
    };
  }

  override canEdit() { return true; }
  override canResize() { return true; }
  override isAspectRatioLocked() { return false; }

  getGeometry(shape: IMdBlockShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override onResize(shape: any, info: TLResizeInfo<any>) {
    return resizeBox(shape, info);
  }

  component(shape: IMdBlockShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id;

    return (
      <HTMLContainer style={{ pointerEvents: isEditing ? 'all' : 'auto' }}>
        <MdBlockView
          shape={shape}
          isEditing={isEditing}
          onEditComplete={(content, darkMode) => {
            this.editor.updateShape<IMdBlockShape>({
              id: shape.id,
              type: MD_BLOCK_TYPE,
              props: { ...shape.props, content, darkMode },
            });
            this.editor.setEditingShape(null);
          }}
        />
      </HTMLContainer>
    );
  }

  getIndicatorPath(shape: IMdBlockShape) {
    const path = new Path2D();
    path.roundRect(0, 0, shape.props.w, shape.props.h, 10);
    return path;
  }
}
