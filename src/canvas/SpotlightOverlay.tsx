/**
 * SpotlightOverlay — dims the canvas and highlights focused shapes.
 * Uses an SVG mask: everything is dimmed except the shape bounds area.
 * Purely visual, pointer-events: none — doesn't interfere with canvas.
 */

import { useEffect, useState } from 'react';
import type { Editor } from 'tldraw';

interface SpotlightOverlayProps {
  editor: Editor | null;
  /** Shape IDs to spotlight (highlight). If empty, overlay is hidden. */
  shapeIds: string[];
  /** Whether spotlight is active */
  active: boolean;
}

interface ScreenRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function SpotlightOverlay({ editor, shapeIds, active }: SpotlightOverlayProps) {
  const [rect, setRect] = useState<ScreenRect | null>(null);

  useEffect(() => {
    if (!active || !editor || shapeIds.length === 0) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const tldrawIds = shapeIds.filter(id => id.includes(':'));
      if (tldrawIds.length === 0) { setRect(null); return; }

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const id of tldrawIds) {
        const bounds = editor.getShapePageBounds(id as any);
        if (!bounds) continue;
        // Convert page bounds corners to screen coords
        const topLeft = editor.pageToScreen({ x: bounds.x, y: bounds.y });
        const bottomRight = editor.pageToScreen({ x: bounds.x + bounds.w, y: bounds.y + bounds.h });
        minX = Math.min(minX, topLeft.x);
        minY = Math.min(minY, topLeft.y);
        maxX = Math.max(maxX, bottomRight.x);
        maxY = Math.max(maxY, bottomRight.y);
      }

      if (minX === Infinity) { setRect(null); return; }

      // Add padding
      const pad = 30;
      setRect({
        x: minX - pad,
        y: minY - pad,
        w: maxX - minX + pad * 2,
        h: maxY - minY + pad * 2,
      });
    };

    updateRect();

    // Update on camera changes (zoom/pan)
    const interval = setInterval(updateRect, 100);
    return () => clearInterval(interval);
  }, [active, editor, shapeIds]);

  if (!active || !rect) return null;

  return (
    <div
      className="absolute inset-0 z-[45] pointer-events-none transition-opacity duration-300"
      style={{ opacity: 1 }}
    >
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <mask id="spotlight-mask">
            {/* White = visible (dimmed area) */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black = transparent (spotlight cutout) */}
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.w}
              height={rect.h}
              rx={16}
              ry={16}
              fill="black"
            />
          </mask>
        </defs>
        {/* Dim overlay with mask cutout */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.55)"
          mask="url(#spotlight-mask)"
        />
      </svg>
      {/* Glow border around the spotlight area */}
      <div
        className="absolute rounded-2xl transition-all duration-200"
        style={{
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
          boxShadow: '0 0 30px rgba(99,102,241,0.3), 0 0 60px rgba(99,102,241,0.1)',
          border: '1.5px solid rgba(99,102,241,0.25)',
        }}
      />
    </div>
  );
}
