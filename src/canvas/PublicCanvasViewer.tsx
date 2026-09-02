/**
 * PublicCanvasViewer — renders a public canvas as a read-only vertical-scroll view.
 * Used on production (Vercel). Loads a static JSON file and renders with tldraw.
 * 
 * Custom scroll handling: intercepts wheel events, clamps camera to content bounds,
 * only allows vertical movement. Like a PDF reader.
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
  const contentBoundsRef = useRef<{ minX: number; minY: number; maxX: number; maxY: number; contentW: number; contentH: number } | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Kill all page scrolling
  useEffect(() => {
    document.documentElement.classList.add('public-canvas-active');
    return () => {
      document.documentElement.classList.remove('public-canvas-active');
    };
  }, []);

  // Custom wheel handler — clamps camera Y within content bounds
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const editor = editorRef.current;
      const bounds = contentBoundsRef.current;
      if (!editor || !bounds) return;

      const camera = editor.getCamera();
      const viewportH = container.clientHeight;
      const padding = 40;

      // Calculate Y bounds: 
      // Camera Y is negative (camera moves up = content moves down)
      // At top: camera.y = -(minY - padding) → shows top of content
      // At bottom: camera.y = -(maxY + padding) + viewportH → shows bottom of content
      const topLimit = -(bounds.minY - padding);
      const bottomLimit = -(bounds.maxY + padding) + viewportH;

      // New Y position — scroll delta applied
      const scrollSpeed = 1;
      let newY = camera.y - (e.deltaY * scrollSpeed);

      // Clamp: don't scroll above top or below bottom
      if (topLimit > bottomLimit) {
        // Content is taller than viewport — normal clamping
        newY = Math.min(topLimit, Math.max(bottomLimit, newY));
      } else {
        // Content fits in viewport — lock to top
        newY = topLimit;
      }

      // Only update Y, keep X and zoom fixed
      editor.setCamera({ x: camera.x, y: newY, z: camera.z });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
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

    // Save content bounds for the wheel handler
    contentBoundsRef.current = { minX, minY, maxX, maxY, contentW, contentH };

    // Disable tldraw's own wheel/zoom/pan — we handle it ourselves
    editor.setCameraOptions({
      isLocked: true,
      wheelBehavior: 'none',
      zoomSpeed: 0,
      panSpeed: 0,
      zoomSteps: [1],
    });

    // Center content horizontally, start at top
    const viewportW = canvasContainerRef.current?.clientWidth || window.innerWidth;
    const centerX = -(minX - padding) + (viewportW - contentW - padding * 2) / 2;
    editor.setCamera({ x: centerX, y: -(minY - padding), z: 1 });
  }, [data]);

  return (
    <div className="w-full h-[calc(100vh-78px)] bg-[#f0ede8] flex flex-col overflow-hidden">
      {/* Title bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-2.5 flex-shrink-0">
        <h1 className="text-base font-bold text-gray-800">{title}</h1>
      </div>

      {/* Canvas — fills remaining space */}
      <div ref={canvasContainerRef} className="flex-1 relative overflow-hidden">
        <Tldraw
          onMount={handleMount}
          hideUi={true}
          shapeUtils={customShapeUtils}
        />
      </div>
    </div>
  );
}
