/**
 * CanvasMinimap — small overview thumbnail showing all shapes on the canvas
 * with a highlighted rectangle for the current viewport.
 * Click to navigate. Read-only — never modifies shapes.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import type { Editor } from 'tldraw';

interface CanvasMinimapProps {
  editor: Editor | null;
  /** Whether minimap is visible */
  visible: boolean;
}

interface MinimapState {
  /** All shapes bounding box (page space) */
  contentBounds: { x: number; y: number; w: number; h: number };
  /** Current viewport (page space) */
  viewportBounds: { x: number; y: number; w: number; h: number };
}

const MINIMAP_W = 180;
const MINIMAP_H = 120;
const PADDING = 20;

export default function CanvasMinimap({ editor, visible }: CanvasMinimapProps) {
  const [state, setState] = useState<MinimapState | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update minimap state
  useEffect(() => {
    if (!visible || !editor) { setState(null); return; }

    const update = () => {
      const allShapes = editor.getCurrentPageShapes();
      if (allShapes.length === 0) { setState(null); return; }

      // Get content bounds (all shapes)
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const shape of allShapes) {
        const bounds = editor.getShapePageBounds(shape.id);
        if (!bounds) continue;
        minX = Math.min(minX, bounds.x);
        minY = Math.min(minY, bounds.y);
        maxX = Math.max(maxX, bounds.x + bounds.w);
        maxY = Math.max(maxY, bounds.y + bounds.h);
      }
      if (minX === Infinity) { setState(null); return; }

      // Add padding
      const pad = 100;
      const contentBounds = {
        x: minX - pad,
        y: minY - pad,
        w: maxX - minX + pad * 2,
        h: maxY - minY + pad * 2,
      };

      // Get viewport
      const vp = editor.getViewportPageBounds();
      const viewportBounds = { x: vp.x, y: vp.y, w: vp.w, h: vp.h };

      setState({ contentBounds, viewportBounds });
    };

    update();
    const interval = setInterval(update, 200);
    return () => clearInterval(interval);
  }, [visible, editor]);

  // Draw minimap
  useEffect(() => {
    if (!state || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const { contentBounds: cb, viewportBounds: vb } = state;
    const scale = Math.min(
      (MINIMAP_W - PADDING * 2) / cb.w,
      (MINIMAP_H - PADDING * 2) / cb.h,
    );

    const offsetX = (MINIMAP_W - cb.w * scale) / 2;
    const offsetY = (MINIMAP_H - cb.h * scale) / 2;

    const toMinimap = (px: number, py: number) => ({
      x: (px - cb.x) * scale + offsetX,
      y: (py - cb.y) * scale + offsetY,
    });

    // Clear
    ctx.clearRect(0, 0, MINIMAP_W, MINIMAP_H);

    // Draw shape dots
    if (editor) {
      const allShapes = editor.getCurrentPageShapes();
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      for (const shape of allShapes) {
        const bounds = editor.getShapePageBounds(shape.id);
        if (!bounds) continue;
        const tl = toMinimap(bounds.x, bounds.y);
        const w = Math.max(bounds.w * scale, 2);
        const h = Math.max(bounds.h * scale, 2);
        ctx.beginPath();
        ctx.roundRect(tl.x, tl.y, w, h, 1);
        ctx.fill();
      }
    }

    // Draw viewport rectangle
    const vpTL = toMinimap(vb.x, vb.y);
    const vpW = vb.w * scale;
    const vpH = vb.h * scale;
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(vpTL.x, vpTL.y, vpW, vpH, 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
    ctx.fill();
  }, [state, editor]);

  // Click to navigate
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!state || !editor || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const { contentBounds: cb } = state;
    const scale = Math.min(
      (MINIMAP_W - PADDING * 2) / cb.w,
      (MINIMAP_H - PADDING * 2) / cb.h,
    );
    const offsetX = (MINIMAP_W - cb.w * scale) / 2;
    const offsetY = (MINIMAP_H - cb.h * scale) / 2;

    // Convert minimap coords to page coords
    const pageX = (mx - offsetX) / scale + cb.x;
    const pageY = (my - offsetY) / scale + cb.y;

    editor.centerOnPoint({ x: pageX, y: pageY }, {
      animation: { duration: 300 },
    });
  }, [state, editor]);

  if (!visible || !state) return null;

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="absolute bottom-4 right-4 z-[40] rounded-xl overflow-hidden cursor-crosshair shadow-xl border border-slate-700/50"
      style={{
        width: MINIMAP_W,
        height: MINIMAP_H,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
      }}
      title="Click to navigate"
    >
      <canvas
        ref={canvasRef}
        width={MINIMAP_W}
        height={MINIMAP_H}
        className="block"
      />
      {/* Label */}
      <div className="absolute top-1.5 left-2 text-[8px] font-bold text-slate-500 uppercase tracking-wider select-none">
        Overview
      </div>
    </div>
  );
}
