/**
 * PublicCanvasViewer — renders a public canvas as a read-only scrollable document.
 * Used on production (Vercel). Loads a static JSON file and renders with tldraw.
 * No editing tools, no animation steps — just the content with live CSS animations.
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

    // Restore camera position
    if (data.camera) {
      setTimeout(() => {
        editor.setCamera(data.camera!);
      }, 50);
    }

    // Lock the canvas — read-only
    editor.updateInstanceState({ isReadonly: true });
  }, [data]);

  // Prevent zoom on scroll — let the page scroll instead
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      // Don't prevent if scrolling inside a code/md block
      const target = e.target as HTMLElement;
      if (target.closest('.md-block-rendered') || target.closest('pre') || target.closest('textarea')) return;
    };
    window.addEventListener('wheel', handler, { passive: true });
    return () => window.removeEventListener('wheel', handler);
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#f0ede8]">
      {/* Title bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-3">
        <h1 className="text-lg font-bold text-gray-800">{title}</h1>
      </div>

      {/* Canvas container — fixed aspect, centered */}
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="w-full bg-[#f0ede8] rounded-xl overflow-hidden shadow-lg border border-gray-200" style={{ height: 'calc(100vh - 120px)' }}>
          <Tldraw
            onMount={handleMount}
            hideUi={true}
            shapeUtils={customShapeUtils}
          />
        </div>
      </div>
    </div>
  );
}
