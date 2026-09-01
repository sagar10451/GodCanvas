/**
 * DraggableWidget — a reusable wrapper that makes any panel/widget freely
 * draggable on the canvas. Drag from the header area (data-drag-handle).
 */

import { useRef, useState, useCallback, type ReactNode } from 'react';

interface DraggableWidgetProps {
  children: ReactNode;
  /** Initial CSS position. Use absolute values or Tailwind-compatible defaults. */
  defaultPosition?: { x: number; y: number };
  /** z-index for stacking */
  zIndex?: number;
  /** Optional class on the outer wrapper */
  className?: string;
}

export default function DraggableWidget({
  children,
  defaultPosition,
  zIndex = 40,
  className = '',
}: DraggableWidgetProps) {
  const [position, setPosition] = useState(defaultPosition || null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    // Only drag from elements marked with data-drag-handle
    const target = e.target as HTMLElement;
    if (!target.closest('[data-drag-handle]')) return;

    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const parentRect = containerRef.current.offsetParent?.getBoundingClientRect() || { left: 0, top: 0 };

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left - parentRect.left,
      origY: rect.top - parentRect.top,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.origX + dx,
        y: dragRef.current.origY + dy,
      });
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute ${className}`}
      style={{
        ...(position ? { left: position.x, top: position.y } : {}),
        zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  );
}
