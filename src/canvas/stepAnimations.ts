/**
 * Step animation executor.
 * CSS-only for visual effects. Clone-based for Move/Teleport.
 * NEVER modifies position/transform on existing tldraw shapes.
 */

import type { AnimationType } from './types';
import { createShapeId } from 'tldraw';

const isIdleAnimation = (anim: string) => anim.startsWith('idle');

function clearStepAnimation(el: HTMLElement) {
  el.classList.forEach(cls => {
    if (cls.startsWith('step-anim-') || cls.startsWith('step-exit-')) el.classList.remove(cls);
  });
  el.style.removeProperty('--step-duration');
}

function findElement(shapeId: string): HTMLElement | null {
  if (shapeId.includes(':')) {
    return document.querySelector(`[data-shape-id="${shapeId}"]`) as HTMLElement | null
      ?? document.getElementById(shapeId) as HTMLElement | null;
  }
  return document.querySelector(`[data-id="${shapeId}"]`) as HTMLElement | null;
}

// ─── Entrance ────────────────────────────────────────────────────────────────

export function applyStepAnimation(shapeIds: string[], animation: AnimationType, duration: number) {
  if (animation === 'none') return;
  const animClass = `step-anim-${animation}`;
  const durationMs = `${duration}ms`;
  const isLooping = isIdleAnimation(animation);
  requestAnimationFrame(() => {
    for (const id of shapeIds) {
      const el = findElement(id);
      if (!el) continue;
      clearStepAnimation(el);
      void el.offsetHeight;
      el.style.setProperty('--step-duration', durationMs);
      el.classList.add(animClass);
      if (!isLooping) {
        const cleanup = () => { clearStepAnimation(el); el.removeEventListener('animationend', cleanup); };
        el.addEventListener('animationend', cleanup);
      }
    }
  });
}

// ─── Exit ────────────────────────────────────────────────────────────────────

export function applyExitAnimation(shapeIds: string[], animation: AnimationType, duration: number, onComplete?: () => void) {
  const exitClass = `step-exit-${animation}`;
  const durationMs = `${duration}ms`;
  let completed = 0;
  const total = shapeIds.length;
  requestAnimationFrame(() => {
    for (const id of shapeIds) {
      const el = findElement(id);
      if (!el) { completed++; continue; }
      clearStepAnimation(el);
      void el.offsetHeight;
      el.style.setProperty('--step-duration', durationMs);
      el.classList.add(exitClass);
      const cleanup = () => {
        clearStepAnimation(el);
        el.removeEventListener('animationend', cleanup);
        completed++;
        if (completed >= total && onComplete) onComplete();
      };
      el.addEventListener('animationend', cleanup);
    }
    if (total === 0 && onComplete) onComplete();
  });
}

// ─── Blink ───────────────────────────────────────────────────────────────────

export function applyBlinkAnimation(shapeIds: string[], duration: number) {
  const durationMs = `${duration}ms`;
  requestAnimationFrame(() => {
    for (const id of shapeIds) {
      const el = findElement(id);
      if (!el) continue;
      clearStepAnimation(el);
      void el.offsetHeight;
      el.style.setProperty('--step-duration', durationMs);
      el.classList.add('step-anim-blink');
      const cleanup = () => { clearStepAnimation(el); el.removeEventListener('animationend', cleanup); };
      el.addEventListener('animationend', cleanup);
    }
  });
}

// ─── Move (clone-based) ──────────────────────────────────────────────────────

export interface MoveRecord {
  originalId: string;
  cloneId: string;
}

/**
 * Move: hide original shape, create a clone at the target position.
 * Returns records of what was done so it can be undone on rewind.
 */
export function applyMoveAnimation(
  shapeIds: string[],
  targetPosition: { x: number; y: number },
  duration: number,
  editor: any,
): MoveRecord[] {
  if (!editor) return [];
  const records: MoveRecord[] = [];

  editor.updateInstanceState({ isReadonly: false });

  for (const id of shapeIds) {
    if (!id.includes(':')) continue; // Only tldraw shapes
    const shape = editor.getShape(id);
    if (!shape) continue;

    // Hide original
    editor.updateShape({ id: shape.id, type: shape.type, opacity: 0 });

    // Create clone at target position
    const cloneId = createShapeId();
    const cloneProps = { ...shape.props };
    editor.createShape({
      id: cloneId,
      type: shape.type,
      x: targetPosition.x,
      y: targetPosition.y,
      rotation: shape.rotation,
      props: cloneProps,
      opacity: 1,
    });

    records.push({ originalId: id, cloneId: cloneId as unknown as string });
  }

  editor.updateInstanceState({ isReadonly: true });

  // Apply entrance animation to clones
  const cloneIds = records.map(r => r.cloneId);
  if (cloneIds.length > 0) {
    applyStepAnimation(cloneIds, 'fadeIn', duration);
  }

  return records;
}

/**
 * Teleport: hide original, pause, create clone at target.
 */
export function applyTeleportAnimation(
  shapeIds: string[],
  targetPosition: { x: number; y: number },
  duration: number,
  editor: any,
): MoveRecord[] {
  if (!editor) return [];
  const records: MoveRecord[] = [];
  const halfDuration = Math.floor(duration / 2);

  editor.updateInstanceState({ isReadonly: false });

  // Hide originals immediately
  for (const id of shapeIds) {
    if (!id.includes(':')) continue;
    const shape = editor.getShape(id);
    if (!shape) continue;
    editor.updateShape({ id: shape.id, type: shape.type, opacity: 0 });
    records.push({ originalId: id, cloneId: '' }); // cloneId set after timeout
  }

  editor.updateInstanceState({ isReadonly: true });

  // After half duration, create clones at new position
  setTimeout(() => {
    editor.updateInstanceState({ isReadonly: false });

    for (let i = 0; i < records.length; i++) {
      const origShape = editor.getShape(records[i].originalId);
      if (!origShape) continue;

      const cloneId = createShapeId();
      editor.createShape({
        id: cloneId,
        type: origShape.type,
        x: targetPosition.x,
        y: targetPosition.y,
        rotation: origShape.rotation,
        props: { ...origShape.props },
        opacity: 1,
      });

      records[i].cloneId = cloneId as unknown as string;
    }

    editor.updateInstanceState({ isReadonly: true });

    // Animate clones appearing
    const cloneIds = records.map(r => r.cloneId).filter(Boolean);
    if (cloneIds.length > 0) {
      applyStepAnimation(cloneIds, 'fadeIn', halfDuration);
    }
  }, halfDuration);

  return records;
}

/**
 * Rewind move/teleport: delete clones, show originals.
 */
export function rewindMoveRecords(records: MoveRecord[], editor: any) {
  if (!editor || records.length === 0) return;

  editor.updateInstanceState({ isReadonly: false });

  const cloneIdsToDelete: string[] = [];
  for (const rec of records) {
    // Show original
    const shape = editor.getShape(rec.originalId);
    if (shape) {
      editor.updateShape({ id: shape.id, type: shape.type, opacity: 1 });
    }
    // Collect clone for deletion
    if (rec.cloneId) {
      cloneIdsToDelete.push(rec.cloneId);
    }
  }

  // Delete clones
  if (cloneIdsToDelete.length > 0) {
    editor.deleteShapes(cloneIdsToDelete);
  }

  editor.updateInstanceState({ isReadonly: true });
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

export function clearStepAnimations(shapeIds: string[]) {
  for (const id of shapeIds) {
    const el = findElement(id);
    if (el) clearStepAnimation(el);
  }
}
