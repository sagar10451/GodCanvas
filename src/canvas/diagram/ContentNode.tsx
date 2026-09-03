/**
 * ContentNode — Rich RF node with editable text, image support,
 * configurable background/border/colors, invisible mode, and resize.
 * Connects to all 8 RF edge handles like ShapeNode.
 */

import { memo, useState, useCallback, useRef } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';

const DEFAULT_W = 200;
const DEFAULT_H = 80;
const MIN_W = 80;
const MIN_H = 40;

interface ContentNodeData {
  label: string;
  /** 'text' | 'text-image' */
  mode?: string;
  /** Node text content */
  text?: string;
  /** Base64 image data URL */
  image?: string;
  /** Background color or 'transparent' */
  bgColor?: string;
  /** Border color or 'transparent' */
  borderColor?: string;
  /** Text color */
  textColor?: string;
  /** Font size: 'sm' | 'md' | 'lg' */
  fontSize?: string;
  /** Bold text */
  bold?: boolean;
  /** Text align: 'left' | 'center' | 'right' */
  textAlign?: string;
  /** Show background/border or invisible */
  visible?: boolean;
  /** Show border */
  showBorder?: boolean;
  /** Border radius */
  borderRadius?: number;
  /** Show shadow */
  showShadow?: boolean;
  /** Image position: 'above' | 'below' */
  imagePosition?: string;
  /** Dimensions */
  w?: number;
  h?: number;
  [key: string]: unknown;
}

const FONT_SIZES: Record<string, number> = { sm: 11, md: 14, lg: 18 };
const COLOR_PRESETS = ['#e1e4e8', '#58a6ff', '#7ee787', '#f97583', '#d2a8ff', '#f0b72f', '#ff9900', '#ffffff', '#0f172a'];
const BG_PRESETS = ['transparent', '#0f172a', '#1e293b', '#1a2332', '#2e2a1a', '#1a2e1a', '#2d1a2e', '#2a1a1e', '#ffffff'];

function ContentNodeBase({ id, data, selected }: NodeProps) {
  const d = data as unknown as ContentNodeData;
  const text = d.text || d.label || 'Double-click to edit';
  const mode = d.mode || 'text';
  const bgColor = d.bgColor || 'transparent';
  const borderColor = d.borderColor || 'transparent';
  const textColor = d.textColor || '#e1e4e8';
  const fontSize = FONT_SIZES[d.fontSize || 'md'] || 14;
  const bold = d.bold ?? false;
  const textAlign = (d.textAlign || 'center') as 'left' | 'center' | 'right';
  const isVisible = d.visible !== false;
  const showBorder = d.showBorder !== false;
  const borderRadius = d.borderRadius ?? 10;
  const showShadow = d.showShadow !== false;
  const imagePosition = d.imagePosition || 'above';
  const width = d.w || DEFAULT_W;
  const height = d.h || DEFAULT_H;

  const { updateNodeData } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // ─── Text editing ────────────────────────────────────────────────────────
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setTimeout(() => textRef.current?.focus(), 50);
  }, []);

  const handleTextBlur = useCallback(() => {
    setIsEditing(false);
    const val = textRef.current?.value || '';
    updateNodeData(id, { text: val, label: val.split('\n')[0] || 'Text' });
  }, [id, updateNodeData]);

  const handleTextKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      handleTextBlur();
    }
    e.stopPropagation();
  }, [handleTextBlur]);

  // ─── Image paste/upload ──────────────────────────────────────────────────
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          updateNodeData(id, { image: reader.result as string, mode: 'text-image' });
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  }, [id, updateNodeData]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateNodeData(id, { image: reader.result as string, mode: 'text-image' });
    };
    reader.readAsDataURL(file);
  }, [id, updateNodeData]);

  // ─── Settings update helpers ─────────────────────────────────────────────
  const set = useCallback((updates: Partial<ContentNodeData>) => {
    updateNodeData(id, updates);
  }, [id, updateNodeData]);

  // ─── Build styles ────────────────────────────────────────────────────────
  const nodeStyle: React.CSSProperties = {
    width,
    height,
    borderRadius,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    ...(isVisible
      ? {
          background: bgColor === 'transparent' ? 'transparent' : bgColor,
          border: showBorder && borderColor !== 'transparent' ? `2px solid ${borderColor}` : '2px solid transparent',
          boxShadow: showShadow && bgColor !== 'transparent' ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
        }
      : {
          background: 'transparent',
          border: '2px dashed rgba(100,116,139,0.3)',
          boxShadow: 'none',
        }),
  };

  const hasImage = mode === 'text-image' && d.image;

  return (
    <div
      className={`rf-content-node${selected ? ' rf-selected' : ''}`}
      style={nodeStyle}
      onPaste={handlePaste}
    >
      {/* Handles — same 8 as ShapeNode */}
      <Handle id="top-target" type="target" position={Position.Top} />
      <Handle id="top-source" type="source" position={Position.Top} />
      <Handle id="left-target" type="target" position={Position.Left} />
      <Handle id="left-source" type="source" position={Position.Left} />

      {/* Content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: bgColor === 'transparent' && !isVisible ? '4px' : '10px 14px', overflow: 'hidden', justifyContent: 'center' }}>
        {/* Image above text */}
        {hasImage && imagePosition === 'above' && (
          <img src={d.image} alt="" style={{ width: '100%', maxHeight: '60%', objectFit: 'contain', borderRadius: 6, marginBottom: 6 }} />
        )}

        {/* Text area */}
        {isEditing ? (
          <textarea
            ref={textRef}
            defaultValue={text}
            onBlur={handleTextBlur}
            onKeyDown={handleTextKeyDown}
            className="nodrag"
            style={{
              flex: 1,
              resize: 'none',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(88,166,255,0.3)',
              borderRadius: 6,
              padding: '6px 8px',
              color: textColor,
              fontSize,
              fontWeight: bold ? 700 : 400,
              textAlign,
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.4,
            }}
          />
        ) : (
          <div
            onDoubleClick={handleDoubleClick}
            style={{
              flex: hasImage ? 'none' : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
              color: textColor,
              fontSize,
              fontWeight: bold ? 700 : 400,
              textAlign,
              lineHeight: 1.4,
              cursor: 'text',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflow: 'hidden',
              userSelect: 'none',
              minHeight: 20,
            }}
          >
            {text}
          </div>
        )}

        {/* Image below text */}
        {hasImage && imagePosition === 'below' && (
          <img src={d.image} alt="" style={{ width: '100%', maxHeight: '60%', objectFit: 'contain', borderRadius: 6, marginTop: 6 }} />
        )}
      </div>

      {/* Settings gear — click to toggle settings panel */}
      {selected && (
        <button
          onClick={(e) => { e.stopPropagation(); setShowSettings(s => !s); }}
          className="nodrag"
          style={{
            position: 'absolute',
            top: -10,
            right: -10,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#1e293b',
            border: '1.5px solid #475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            cursor: 'pointer',
            zIndex: 20,
          }}
          title="Node settings"
        >
          ⚙️
        </button>
      )}

      {/* Settings panel */}
      {selected && showSettings && (
        <div
          className="nodrag nowheel"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: -6,
            left: width + 8,
            width: 200,
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: 10,
            padding: '10px 12px',
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            fontSize: 10,
            color: '#94a3b8',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b' }}>Node Settings</div>

          {/* Visible toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={isVisible} onChange={() => set({ visible: !isVisible })} style={{ accentColor: '#3b82f6' }} />
            Show background
          </label>

          {/* Border toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={showBorder} onChange={() => set({ showBorder: !showBorder })} style={{ accentColor: '#3b82f6' }} />
            Show border
          </label>

          {/* Shadow toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={showShadow} onChange={() => set({ showShadow: !showShadow })} style={{ accentColor: '#3b82f6' }} />
            Shadow
          </label>

          {/* Background color */}
          <div>
            <div style={{ marginBottom: 4, fontWeight: 600 }}>Background</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {BG_PRESETS.map(c => (
                <div
                  key={c}
                  onClick={() => set({ bgColor: c })}
                  style={{
                    width: 18, height: 18, borderRadius: 4, cursor: 'pointer',
                    background: c === 'transparent' ? 'repeating-conic-gradient(#334155 0% 25%, #1e293b 0% 50%) 50% / 8px 8px' : c,
                    border: bgColor === c ? '2px solid #3b82f6' : '1px solid #475569',
                  }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Border color */}
          {showBorder && (
            <div>
              <div style={{ marginBottom: 4, fontWeight: 600 }}>Border Color</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {COLOR_PRESETS.map(c => (
                  <div
                    key={c}
                    onClick={() => set({ borderColor: c })}
                    style={{
                      width: 18, height: 18, borderRadius: 4, cursor: 'pointer',
                      background: c,
                      border: borderColor === c ? '2px solid #3b82f6' : '1px solid #475569',
                    }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Text color */}
          <div>
            <div style={{ marginBottom: 4, fontWeight: 600 }}>Text Color</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {COLOR_PRESETS.map(c => (
                <div
                  key={c}
                  onClick={() => set({ textColor: c })}
                  style={{
                    width: 18, height: 18, borderRadius: 4, cursor: 'pointer',
                    background: c,
                    border: textColor === c ? '2px solid #3b82f6' : '1px solid #475569',
                  }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Font size */}
          <div>
            <div style={{ marginBottom: 4, fontWeight: 600 }}>Font Size</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['sm', 'md', 'lg'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => set({ fontSize: s })}
                  style={{
                    padding: '2px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 10, fontWeight: 600,
                    background: (d.fontSize || 'md') === s ? 'rgba(59,130,246,0.2)' : '#1e293b',
                    border: (d.fontSize || 'md') === s ? '1px solid #3b82f6' : '1px solid #334155',
                    color: (d.fontSize || 'md') === s ? '#3b82f6' : '#94a3b8',
                  }}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Bold + Align */}
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input type="checkbox" checked={bold} onChange={() => set({ bold: !bold })} style={{ accentColor: '#3b82f6' }} />
              <b>Bold</b>
            </label>
            <div style={{ display: 'flex', gap: 2 }}>
              {(['left', 'center', 'right'] as const).map(a => (
                <button
                  key={a}
                  onClick={() => set({ textAlign: a })}
                  style={{
                    padding: '2px 6px', borderRadius: 3, cursor: 'pointer', fontSize: 10,
                    background: textAlign === a ? 'rgba(59,130,246,0.2)' : 'transparent',
                    border: textAlign === a ? '1px solid #3b82f6' : '1px solid transparent',
                    color: textAlign === a ? '#3b82f6' : '#64748b',
                  }}
                >
                  {a === 'left' ? '⬅' : a === 'center' ? '⬌' : '➡'}
                </button>
              ))}
            </div>
          </div>

          {/* Border radius */}
          <div>
            <div style={{ marginBottom: 4, fontWeight: 600 }}>Corner Radius: {borderRadius}px</div>
            <input
              type="range"
              min={0}
              max={30}
              value={borderRadius}
              onChange={(e) => set({ borderRadius: Number(e.target.value) })}
              style={{ width: '100%', accentColor: '#3b82f6' }}
            />
          </div>

          {/* Image controls */}
          <div>
            <div style={{ marginBottom: 4, fontWeight: 600 }}>Image</div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '3px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
                  background: '#1e293b', border: '1px solid #334155', color: '#94a3b8',
                }}
              >
                Upload
              </button>
              {d.image && (
                <>
                  <button
                    onClick={() => set({ imagePosition: imagePosition === 'above' ? 'below' : 'above' })}
                    style={{
                      padding: '3px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
                      background: '#1e293b', border: '1px solid #334155', color: '#94a3b8',
                    }}
                  >
                    {imagePosition === 'above' ? 'Img ↑' : 'Img ↓'}
                  </button>
                  <button
                    onClick={() => set({ image: undefined, mode: 'text' })}
                    style={{
                      padding: '3px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
                      background: '#1e293b', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171',
                    }}
                  >
                    Remove
                  </button>
                </>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </div>
            <div style={{ fontSize: 9, color: '#64748b', marginTop: 3 }}>Or paste image with Cmd+V on the node</div>
          </div>
        </div>
      )}

      <Handle id="bottom-target" type="target" position={Position.Bottom} />
      <Handle id="bottom-source" type="source" position={Position.Bottom} />
      <Handle id="right-target" type="target" position={Position.Right} />
      <Handle id="right-source" type="source" position={Position.Right} />

      {/* Resize handle */}
      <div className="rf-resize-handle nodrag" onMouseDown={onResizeStart} />
    </div>
  );
}

export const ContentNode = memo(ContentNodeBase);
