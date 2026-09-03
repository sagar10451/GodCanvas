/**
 * ContentNode — Markdown-capable RF node.
 * Same rendering as the tldraw Markdown Block shape, plus transparent mode.
 * Double-click to edit raw markdown, renders formatted content when not editing.
 * 8 RF handles for edge connections. Resizable.
 */

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const DEFAULT_W = 350;
const DEFAULT_H = 200;
const MIN_W = 120;
const MIN_H = 80;

interface ContentNodeData {
  label: string;
  content?: string;
  darkMode?: boolean;
  transparent?: boolean;
  w?: number;
  h?: number;
  [key: string]: unknown;
}

function ContentNodeBase({ id, data, selected }: NodeProps) {
  const d = data as unknown as ContentNodeData;
  const content = d.content || '';
  const darkMode = d.darkMode !== false;
  const transparent = d.transparent === true;
  const hideBorder = d.hideBorder === true;
  const width = d.w || DEFAULT_W;
  const height = d.h || DEFAULT_H;

  const { updateNodeData } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [editDarkMode, setEditDarkMode] = useState(darkMode);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync edit state when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditContent(content);
      setEditDarkMode(darkMode);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isEditing, content, darkMode]);

  // ─── Resize ──────────────────────────────────────────────────────────────
  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = width;
    const startH = height;
    const onMouseMove = (ev: MouseEvent) => {
      const newW = Math.max(MIN_W, startW + (ev.clientX - startX));
      const newH = Math.max(MIN_H, startH + (ev.clientY - startY));
      updateNodeData(id, { w: newW, h: newH });
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [id, width, height, updateNodeData]);

  // ─── Save edits ──────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    updateNodeData(id, {
      content: editContent,
      darkMode: editDarkMode,
      label: editContent.split('\n')[0]?.replace(/^#+\s*/, '').slice(0, 30) || 'Markdown',
    });
    setIsEditing(false);
  }, [id, editContent, editDarkMode, updateNodeData]);

  // ─── Double-click to edit ────────────────────────────────────────────────
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  // ─── Toggle transparent ──────────────────────────────────────────────────
  const toggleTransparent = useCallback(() => {
    updateNodeData(id, { transparent: !transparent });
  }, [id, transparent, updateNodeData]);

  const toggleHideBorder = useCallback(() => {
    updateNodeData(id, { hideBorder: !hideBorder });
  }, [id, hideBorder, updateNodeData]);

  // ─── Editing view ────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div
        className={`rf-content-node${selected ? ' rf-selected' : ''}`}
        style={{
          width, height, borderRadius: 10,
          background: '#1e293b',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          border: '2px solid #8b5cf6',
          fontFamily: "'Inter', -apple-system, sans-serif",
          position: 'relative',
        }}
      >
        <Handle id="top-target" type="target" position={Position.Top} />
        <Handle id="top-source" type="source" position={Position.Top} />
        <Handle id="left-target" type="target" position={Position.Left} />
        <Handle id="left-source" type="source" position={Position.Left} />

        {/* Toolbar */}
        <div
          className="nodrag"
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.2)',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
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
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#94a3b8', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={transparent}
              onChange={() => toggleTransparent()}
              style={{ width: 12, height: 12 }}
            />
            Transparent
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#94a3b8', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={hideBorder}
              onChange={() => toggleHideBorder()}
              style={{ width: 12, height: 12 }}
            />
            No Border
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
          className="nodrag nowheel"
          placeholder={"# Write Markdown here\n\nSupports **bold**, *italic*, tables, lists, code blocks, and more."}
          style={{
            flex: 1, background: 'transparent', color: '#e2e8f0',
            border: 'none', outline: 'none', resize: 'none',
            padding: '12px 16px', fontSize: 13, lineHeight: 1.6,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            tabSize: 2,
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
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

        <Handle id="bottom-target" type="target" position={Position.Bottom} />
        <Handle id="bottom-source" type="source" position={Position.Bottom} />
        <Handle id="right-target" type="target" position={Position.Right} />
        <Handle id="right-source" type="source" position={Position.Right} />
        <div className="rf-resize-handle nodrag" onMouseDown={onResizeStart} />
      </div>
    );
  }

  // ─── Rendered markdown view ──────────────────────────────────────────────

  const bg = transparent ? 'transparent' : (darkMode ? '#1e293b' : '#ffffff');
  const textColor = darkMode ? '#e2e8f0' : '#1e293b';
  const borderColor = transparent ? 'transparent' : (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)');
  const mutedColor = darkMode ? '#94a3b8' : '#64748b';
  const uniqueClass = `rf-md-${id.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div
      className={`rf-content-node${selected ? ' rf-selected' : ''}`}
      style={{
        width, height, borderRadius: 10,
        position: 'relative',
        ...(transparent
          ? { background: 'transparent', border: (hideBorder || !selected) ? '2px solid transparent' : '2px dashed rgba(139,92,246,0.4)', boxShadow: 'none' }
          : {
              background: bg,
              border: `2px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.08)',
            }
        ),
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle id="top-target" type="target" position={Position.Top} />
      <Handle id="top-source" type="source" position={Position.Top} />
      <Handle id="left-target" type="target" position={Position.Left} />
      <Handle id="left-source" type="source" position={Position.Left} />

      {/* Markdown rendered content */}
      <div
        className={`${uniqueClass} nowheel`}
        style={{
          width: '100%', height: '100%',
          borderRadius: 10, overflow: 'auto',
          color: textColor,
          fontFamily: "'Inter', -apple-system, sans-serif",
          padding: '16px 20px', fontSize: 14, lineHeight: 1.7,
        }}
        onWheelCapture={(e) => e.stopPropagation()}
      >
        <style>{`
          .${uniqueClass} h1 { font-size: 1.8em; font-weight: 700; margin: 0 0 0.5em; border-bottom: 2px solid ${borderColor}; padding-bottom: 0.3em; }
          .${uniqueClass} h2 { font-size: 1.4em; font-weight: 600; margin: 1.2em 0 0.4em; color: ${darkMode ? '#a78bfa' : '#7c3aed'}; }
          .${uniqueClass} h3 { font-size: 1.15em; font-weight: 600; margin: 1em 0 0.3em; }
          .${uniqueClass} p { margin: 0.6em 0; }
          .${uniqueClass} ul, .${uniqueClass} ol { padding-left: 1.5em; margin: 0.5em 0; }
          .${uniqueClass} li { margin: 0.25em 0; }
          .${uniqueClass} strong { font-weight: 600; color: ${darkMode ? '#f1f5f9' : '#0f172a'}; }
          .${uniqueClass} em { font-style: italic; }
          .${uniqueClass} code {
            background: ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'};
            padding: 2px 6px; border-radius: 4px; font-size: 0.85em;
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
          }
          .${uniqueClass} pre {
            background: ${darkMode ? '#0f172a' : '#f1f5f9'};
            padding: 12px 16px; border-radius: 8px; overflow-x: auto;
            margin: 0.8em 0; font-size: 0.85em; line-height: 1.5;
          }
          .${uniqueClass} pre code { background: none; padding: 0; }
          .${uniqueClass} blockquote {
            border-left: 3px solid ${darkMode ? '#8b5cf6' : '#7c3aed'};
            padding: 0.5em 1em; margin: 0.8em 0;
            background: ${darkMode ? 'rgba(139,92,246,0.08)' : 'rgba(124,58,237,0.05)'};
            border-radius: 0 6px 6px 0;
          }
          .${uniqueClass} blockquote p { margin: 0.2em 0; color: ${mutedColor}; }
          .${uniqueClass} table { width: 100%; border-collapse: collapse; margin: 0.8em 0; font-size: 0.9em; }
          .${uniqueClass} th, .${uniqueClass} td {
            border: 1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'};
            padding: 8px 12px; text-align: left;
          }
          .${uniqueClass} th {
            background: ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'};
            font-weight: 600;
          }
          .${uniqueClass} a { color: ${darkMode ? '#a78bfa' : '#7c3aed'}; text-decoration: none; }
          .${uniqueClass} a:hover { text-decoration: underline; }
          .${uniqueClass} hr { border: none; border-top: 1px solid ${borderColor}; margin: 1.5em 0; }
          .${uniqueClass} img { max-width: 100%; border-radius: 6px; }
          .${uniqueClass} del { color: ${mutedColor}; }
        `}</style>
        {content ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {content}
          </ReactMarkdown>
        ) : (
          <p className="rf-md-placeholder" style={{ color: mutedColor, fontStyle: 'italic' }}>Double-click to add markdown content</p>
        )}
      </div>

      <Handle id="bottom-target" type="target" position={Position.Bottom} />
      <Handle id="bottom-source" type="source" position={Position.Bottom} />
      <Handle id="right-target" type="target" position={Position.Right} />
      <Handle id="right-source" type="source" position={Position.Right} />
      <div className="rf-resize-handle nodrag" onMouseDown={onResizeStart} />
    </div>
  );
}

export const ContentNode = memo(ContentNodeBase);
