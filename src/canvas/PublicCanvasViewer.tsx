/**
 * PublicCanvasViewer — renders a public canvas as a read-only vertical-scroll view.
 * 
 * Uses a requestAnimationFrame loop to FORCE the camera position every frame.
 * tldraw cannot override this — even if its internal systems try to move the camera,
 * our loop immediately corrects it.
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
  const overlayRef = useRef<HTMLDivElement>(null);

  // The ONLY camera state — our source of truth
  const cameraYRef = useRef(0);
  const fixedXRef = useRef(0);
  const topLimitRef = useRef(0);
  const bottomLimitRef = useRef(0);
  const readyRef = useRef(false);

  // Kill all page scrolling
  useEffect(() => {
    document.documentElement.classList.add('public-canvas-active');
    return () => {
      document.documentElement.classList.remove('public-canvas-active');
    };
  }, []);

  // RAF loop — forces camera position every single frame
  useEffect(() => {
    let animId: number;
    const tick = () => {
      const editor = editorRef.current;
      if (editor && readyRef.current) {
        const cam = editor.getCamera();
        // If tldraw moved the camera away from our position, force it back
        if (cam.x !== fixedXRef.current || cam.y !== cameraYRef.current || cam.z !== 1) {
          editor.setCamera({ x: fixedXRef.current, y: cameraYRef.current, z: 1 });
        }
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Wheel handler — updates our Y ref, clamped to bounds
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!readyRef.current) return;

      let newY = cameraYRef.current - e.deltaY;

      // Clamp
      if (topLimitRef.current > bottomLimitRef.current) {
        newY = Math.min(topLimitRef.current, Math.max(bottomLimitRef.current, newY));
      } else {
        newY = topLimitRef.current;
      }

      cameraYRef.current = newY;
    };

    // Block ALL events on overlay except wheel
    const block = (e: Event) => { e.preventDefault(); e.stopPropagation(); };

    overlay.addEventListener('wheel', handleWheel, { passive: false });
    overlay.addEventListener('touchstart', block, { passive: false });
    overlay.addEventListener('touchmove', block, { passive: false });
    overlay.addEventListener('touchend', block, { passive: false });
    overlay.addEventListener('gesturestart', block, { passive: false });
    overlay.addEventListener('gesturechange', block, { passive: false });
    overlay.addEventListener('gestureend', block, { passive: false });
    overlay.addEventListener('pointerdown', block, { passive: false });
    overlay.addEventListener('pointermove', block, { passive: false });
    overlay.addEventListener('pointerup', block, { passive: false });

    return () => {
      overlay.removeEventListener('wheel', handleWheel);
      overlay.removeEventListener('touchstart', block);
      overlay.removeEventListener('touchmove', block);
      overlay.removeEventListener('touchend', block);
      overlay.removeEventListener('gesturestart', block);
      overlay.removeEventListener('gesturechange', block);
      overlay.removeEventListener('gestureend', block);
      overlay.removeEventListener('pointerdown', block);
      overlay.removeEventListener('pointermove', block);
      overlay.removeEventListener('pointerup', block);
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

    // Read-only, lock everything
    editor.updateInstanceState({ isReadonly: true });
    editor.setCameraOptions({
      isLocked: true,
      wheelBehavior: 'none',
      zoomSpeed: 0,
      panSpeed: 0,
      zoomSteps: [1],
    });

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
    const padding = 40;

    // Calculate fixed X (centered) and Y limits
    const viewportW = overlayRef.current?.clientWidth || window.innerWidth;
    const viewportH = overlayRef.current?.clientHeight || window.innerHeight;
    const centerX = -(minX - padding) + (viewportW - contentW - padding * 2) / 2;

    fixedXRef.current = centerX;
    cameraYRef.current = -(minY - padding);
    topLimitRef.current = -(minY - padding);
    bottomLimitRef.current = -(maxY + padding) + viewportH;

    // Set initial position
    editor.setCamera({ x: centerX, y: cameraYRef.current, z: 1 });
    readyRef.current = true;
  }, [data]);

  return (
    <div className="w-full h-[calc(100vh-78px)] bg-[#f0ede8] flex flex-col overflow-hidden">
      {/* Title bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-2.5 flex-shrink-0">
        <h1 className="text-base font-bold text-gray-800">{title}</h1>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden">
        {/* tldraw — renders shapes, pointer-events disabled */}
        <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
          <Tldraw
            onMount={handleMount}
            hideUi={true}
            shapeUtils={customShapeUtils}
          />
        </div>

        {/* Overlay — captures wheel, blocks everything else */}
        <div
          ref={overlayRef}
          className="absolute inset-0 z-10"
          style={{ pointerEvents: 'auto', cursor: 'default' }}
        />
      </div>
    </div>
  );
}
