/**
 * Animation engine — simplified.
 * Entrance: instant show/hide via tldraw opacity (0 or 1).
 * Idle: CSS class on DOM element (float, shake, etc.)
 */

import type { IdleAnimation } from './types';

/**
 * Apply idle animation via CSS class on shape DOM element.
 */
export function applyIdleAnimation(shapeId: string, idle: IdleAnimation): void {
  setTimeout(() => {
    const el = document.querySelector(`[data-shape-id="${shapeId}"]`) as HTMLElement | null;
    if (!el) return;
    removeIdleClasses(el);
    if (idle !== 'none') {
      el.classList.add(`idle-${idle}`);
    }
  }, 150);
}

/**
 * Remove all idle animation classes from an element.
 */
function removeIdleClasses(el: HTMLElement): void {
  el.classList.remove(
    'idle-float', 'idle-shake', 'idle-pulse', 'idle-bounce',
    'idle-breathe', 'idle-wiggle', 'idle-sway'
  );
}

/**
 * Remove idle animation from a shape.
 */
export function removeIdleAnimation(shapeId: string): void {
  const el = document.querySelector(`[data-shape-id="${shapeId}"]`) as HTMLElement | null;
  if (!el) return;
  removeIdleClasses(el);
}

/**
 * Preview an idle animation (plays for 2.5 seconds then stops).
 */
export function previewIdleAnimation(shapeId: string, idle: IdleAnimation): void {
  applyIdleAnimation(shapeId, idle);
  if (idle !== 'none') {
    setTimeout(() => {
      removeIdleAnimation(shapeId);
    }, 2500);
  }
}
