/**
 * PublicCanvasViewer — renders a public canvas as a read-only vertical-scroll view.
 * Used on production (Vercel). Loads a static JSON file and renders with tldraw.
 * X-axis locked, Y-axis scrollable via wheel — like a PDF reader.
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

  useEffect(() => {
    // Add class to html element to kill all scrollbars
    document.documentElement.classList.add('public-canvas-active');
    return () => {
      document.documentElement.classList.remove('public-canvas-active');
    };
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

    // Set camera constraints:
    // - X axis: fixed (no horizontal movement)
    // - Y axis: free scroll (vertical panning)
    // - Wheel: pan (scroll to move up/down)
    // - Zoom: locked to fit content width
    editor.setCameraOptions({
      isLocked: false,
      wheelBehavior: 'pan',
      panSpeed: 1,
      zoomSpeed: 0,
      zoomSteps: [1],
      constraints: {
        initialZoom: 'fit-x',
        baseZoom: 'fit-x',
        bounds: {
          x: minX - padding,
          y: minY - padding,
          w: contentW + padding * 2,
          h: contentH + padding * 2,
        },
        behavior: { x: 'fixed', y: 'contain' },
        padding: { x: 0, y: 0 },
        origin: { x: 0.5, y: 0 },
      },
    });

    // Apply the constraints by resetting the camera
    editor.setCamera(editor.getCamera(), { reset: true });
  }, [data]);

  return (
    <div className="w-full h-[calc(100vh-78px)] bg-[#f0ede8] flex flex-col overflow-hidden">
      {/* Title bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-2.5 flex-shrink-0">
        <h1 className="text-base font-bold text-gray-800">{title}</h1>
      </div>

      {/* Canvas — fills remaining space, scroll vertically only */}
      <div className="flex-1 relative overflow-hidden">
        <Tldraw
          onMount={handleMount}
          hideUi={true}
          shapeUtils={customShapeUtils}
        />
      </div>
    </div>
  );
}
