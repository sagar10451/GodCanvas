/**
 * PublicCanvasViewer — renders a public canvas as a read-only vertical-scroll view.
 * Used on production (Vercel). Loads a static JSON file and renders with tldraw.
 * 
 * The tldraw canvas has pointer-events: none — it cannot receive any user input.
 * A transparent overlay captures wheel events and programmatically moves the camera.
 * This is bulletproof — no gesture, touch, or scroll can bypass it.
 */

import { useCallback, useRef, useEffect } from 'react';
import { Tldraw, loadSnapshot } from 'tldraw';
import type { Editor } from 'tldraw';
import 'tldraw/tldraw.css';
import { CodeBlockShapeUtil } from './shapes/CodeBlockShape';
import { MarkdownBlockShapeUtil } from './shapes/MarkdownBlockShape';
import type { PublicCanvasData } from './types';

const customShapeUtils = [CodeBlockShapeUtil, MarkdownBlockShapeUtil];

interface PublicCanvasViewerProps {
  data: PublicCanvasData;
  title: string;
}

export default function PublicCanvasViewer({ data, title }: PublicCanvasViewerProps) {
  const editorRef = useRef<Editor | null>(null);
  const boundsRef = useRef<{ minX: number; minY: number; maxX: number; maxY: number; contentW: number; contentH: number } | null>(null);
  const fixedXRef = useRef<number>(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Kill all page scrolling
  useEffect(() => {
    document.documentElement.classList.add('public-canvas-active');
    return () => {
      document.documentElement.classList.remove('public-canvas-active');
    };
  }, []);

  // Custom scroll handler on the overlay div
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const editor = editorRef.current;
      const bounds = boundsRef.current;
      if (!editor || !bounds) return;

      const viewportH = overlay.clientHeight;
      const padding = 40;
      const camera = editor.getCamera();

      const topLimit = -(bounds.minY - padding);
      const bottomLimit = -(bounds.maxY + padding) + viewportH;

      let newY = camera.y - e.deltaY;

      if (topLimit > bottomLimit) {
        newY = Math.min(topLimit, Math.max(bottomLimit, newY));
      } else {
        newY = topLimit;
      }

      editor.setCamera({ x: fixedXRef.current, y: newY, z: 1 });
    };

    overlay.addEventListener('wheel', handleWheel, { passive: false });
    return () => overlay.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor;

    // Load snapshot
    if (data.snapshot) {
      try {
        loadSnapshot(editor.store, data.snapshot as Parameters<typeof loadSnapshot>[1]);
      } catch (e) {
        console.warn('Failed to load public canvas snapshot:', e);
      }
    }

    // Read-only
    editor.updateInstanceState({ isReadonly: true });

    // Get bounding box of all content
    const allShapeIds = [...editor.getCurrentPageShapeIds()];
    if (allShapeIds.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const id of allShapeIds) {
      const bounds = editor.getShapePageBounds(id);
      if (bounds) {
        minX = Math.min(minX, bounds.x);
        minY = Math.min(minY, bounds.y);
        maxX = Math.max(maxX, bounds.x + bounds.w);
        maxY = Math.max(maxY, bounds.y + bounds.h);
      }
    }

    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const padding = 40;

    boundsRef.current = { minX, minY, maxX, maxY, contentW, contentH };

    // Lock tldraw completely — our overlay handles everything
    editor.setCameraOptions({
      isLocked: true,
      wheelBehavior: 'none',
      zoomSpeed: 0,
      panSpeed: 0,
      zoomSteps: [1],
    });

    // Center horizontally, position at top
    const viewportW = overlayRef.current?.clientWidth || window.innerWidth;
    const centerX = -(minX - padding) + (viewportW - contentW - padding * 2) / 2;
    fixedXRef.current = centerX;

    editor.setCamera({ x: centerX, y: -(minY - padding), z: 1 });
  }, [data]);

  return (
    <div className="w-full h-[calc(100vh-78px)] bg-[#f0ede8] flex flex-col overflow-hidden">
      {/* Title bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-2.5 flex-shrink-0">
        <h1 className="text-base font-bold text-gray-800">{title}</h1>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden">
        {/* tldraw — renders shapes but receives NO user input */}
        <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
          <Tldraw
            onMount={handleMount}
            hideUi={true}
            shapeUtils={customShapeUtils}
          />
        </div>

        {/* Transparent overlay — captures scroll, blocks everything else */}
        <div
          ref={overlayRef}
          className="absolute inset-0 z-10"
          style={{ pointerEvents: 'auto', cursor: 'default' }}
        />
      </div>
    </div>
  );
}
