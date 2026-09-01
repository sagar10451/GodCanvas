/**
 * Custom tldraw shape: Code Block
 * Renders syntax-highlighted code using prism-react-renderer.
 * Double-click to edit code, click away to lock.
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
import { Highlight, themes } from 'prism-react-renderer';
import './prismLanguages'; // registers extra languages (java, ruby, php, etc.)
import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Shape type registration ─────────────────────────────────────────────────

const CODE_BLOCK_TYPE = 'code-block' as const;

declare module 'tldraw' {
  export interface TLGlobalShapePropsMap {
    [CODE_BLOCK_TYPE]: {
      w: number;
      h: number;
      code: string;
      language: string;
      theme: string;
      title: string;
    };
  }
}

type ICodeBlockShape = TLShape<typeof CODE_BLOCK_TYPE>;

// ─── Languages ───────────────────────────────────────────────────────────────

const LANGUAGES = [
  'javascript', 'typescript', 'jsx', 'tsx', 'python', 'java', 'c', 'cpp',
  'csharp', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala',
  'sql', 'html', 'css', 'json', 'yaml', 'markdown', 'bash', 'shell',
  'docker', 'graphql', 'xml', 'dart', 'elixir', 'haskell',
];

const THEME_OPTIONS = [
  { id: 'oneDark', label: 'One Dark' },
  { id: 'dracula', label: 'Dracula' },
  { id: 'nightOwl', label: 'Night Owl' },
  { id: 'vsDark', label: 'VS Dark' },
  { id: 'oceanicNext', label: 'Oceanic Next' },
  { id: 'palenight', label: 'Palenight' },
  { id: 'shadesOfPurple', label: 'Shades of Purple' },
  { id: 'synthwave84', label: 'Synthwave 84' },
  { id: 'github', label: 'GitHub Light' },
  { id: 'oneLight', label: 'One Light' },
];

function getTheme(themeId: string) {
  return (themes as Record<string, typeof themes.oneDark>)[themeId] || themes.oneDark;
}

// ─── Code Block Component ────────────────────────────────────────────────────

function CodeBlockView({ shape, isEditing, onEditComplete }: {
  shape: ICodeBlockShape;
  isEditing: boolean;
  onEditComplete: (code: string, language: string, theme: string, title: string) => void;
}) {
  const { code, language, theme: themeId, title, w, h } = shape.props;
  const [editCode, setEditCode] = useState(code);
  const [editLang, setEditLang] = useState(language);
  const [editTheme, setEditTheme] = useState(themeId);
  const [editTitle, setEditTitle] = useState(title);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentTheme = getTheme(isEditing ? editTheme : themeId);

  useEffect(() => {
    if (isEditing) {
      setEditCode(code);
      setEditLang(language);
      setEditTheme(themeId);
      setEditTitle(title);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isEditing, code, language, themeId, title]);

  const handleSave = useCallback(() => {
    onEditComplete(editCode, editLang, editTheme, editTitle);
  }, [editCode, editLang, editTheme, editTitle, onEditComplete]);

  if (isEditing) {
    return (
      <div
        style={{
          width: w,
          height: h,
          background: currentTheme.plain.backgroundColor,
          borderRadius: 10,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '2px solid #3b82f6',
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          pointerEvents: 'all',
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.2)',
        }}>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Title (optional)"
            style={{
              flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4,
              padding: '3px 8px', fontSize: 11, color: '#e2e8f0', outline: 'none',
            }}
          />
          <select
            value={editLang}
            onChange={(e) => setEditLang(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4,
              padding: '3px 6px', fontSize: 10, color: '#e2e8f0', outline: 'none',
            }}
          >
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select
            value={editTheme}
            onChange={(e) => setEditTheme(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4,
              padding: '3px 6px', fontSize: 10, color: '#e2e8f0', outline: 'none',
            }}
          >
            {THEME_OPTIONS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <button
            onClick={handleSave}
            style={{
              background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4,
              padding: '3px 10px', fontSize: 10, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>

        {/* Code editor */}
        <textarea
          ref={textareaRef}
          value={editCode}
          onChange={(e) => setEditCode(e.target.value)}
          spellCheck={false}
          style={{
            flex: 1, background: 'transparent', color: currentTheme.plain.color,
            border: 'none', outline: 'none', resize: 'none',
            padding: '12px 16px', fontSize: 13, lineHeight: 1.6,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            tabSize: 2,
          }}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const start = e.currentTarget.selectionStart;
              const end = e.currentTarget.selectionEnd;
              setEditCode(editCode.substring(0, start) + '  ' + editCode.substring(end));
              setTimeout(() => {
                e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
              }, 0);
            }
          }}
        />
      </div>
    );
  }

  // ─── Read-only view with syntax highlighting ──────────────────────────

  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: currentTheme.plain.backgroundColor,
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      }}
    >
      {/* Title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Traffic light dots */}
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
          {title && (
            <span style={{ marginLeft: 8, fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
              {title}
            </span>
          )}
        </div>
        <span style={{
          fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: 1,
        }}>
          {language}
        </span>
      </div>

      {/* Highlighted code */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 0' }} onWheelCapture={(e) => e.stopPropagation()}>
        <Highlight theme={currentTheme} code={code} language={language}>
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre style={{
              ...style,
              margin: 0, padding: '0 16px',
              fontSize: 13, lineHeight: 1.6,
              background: 'transparent',
            }}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })} style={{ display: 'flex' }}>
                  <span style={{
                    display: 'inline-block', width: 36, textAlign: 'right',
                    paddingRight: 16, color: 'rgba(255,255,255,0.2)',
                    userSelect: 'none', fontSize: 11,
                  }}>
                    {i + 1}
                  </span>
                  <span>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </span>
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}

// ─── Shape Util ──────────────────────────────────────────────────────────────

export class CodeBlockShapeUtil extends ShapeUtil<ICodeBlockShape> {
  static override type = CODE_BLOCK_TYPE;
  static override props: RecordProps<ICodeBlockShape> = {
    w: T.number,
    h: T.number,
    code: T.string,
    language: T.string,
    theme: T.string,
    title: T.string,
  };

  getDefaultProps(): ICodeBlockShape['props'] {
    return {
      w: 500,
      h: 300,
      code: '// Write your code here\nconsole.log("Hello, World!");',
      language: 'javascript',
      theme: 'oneDark',
      title: '',
    };
  }

  override canEdit() { return true; }
  override canResize() { return true; }
  override isAspectRatioLocked() { return false; }

  getGeometry(shape: ICodeBlockShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override onResize(shape: any, info: TLResizeInfo<any>) {
    return resizeBox(shape, info);
  }

  component(shape: ICodeBlockShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id;

    return (
      <HTMLContainer style={{ pointerEvents: isEditing ? 'all' : 'auto' }}>
        <CodeBlockView
          shape={shape}
          isEditing={isEditing}
          onEditComplete={(code, language, theme, title) => {
            this.editor.updateShape<ICodeBlockShape>({
              id: shape.id,
              type: CODE_BLOCK_TYPE,
              props: { ...shape.props, code, language, theme, title },
            });
            this.editor.setEditingShape(null);
          }}
        />
      </HTMLContainer>
    );
  }

  getIndicatorPath(shape: ICodeBlockShape) {
    const path = new Path2D();
    path.roundRect(0, 0, shape.props.w, shape.props.h, 10);
    return path;
  }
}
