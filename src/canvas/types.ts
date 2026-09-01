/**
 * Canvas lesson data types.
 */

export type AnimationType =
  | 'none'
  | 'appear'
  | 'fadeIn'
  | 'fadeOut'
  | 'flyInLeft'
  | 'flyInRight'
  | 'flyInTop'
  | 'flyInBottom'
  | 'zoomIn'
  | 'zoomOut'
  | 'pop'
  | 'pulse'
  | 'bounce'
  | 'typewriter'
  | 'drawLine'
  | 'slideInLeft'
  | 'slideInRight'
  | 'slideInTop'
  | 'slideInBottom'
  | 'idleFloat'
  | 'idleShake'
  | 'idlePulse'
  | 'idleBounce'
  | 'idleBreathe'
  | 'idleWiggle'
  | 'idleSway'
  | 'revealLeft'
  | 'revealRight'
  | 'revealTop'
  | 'revealBottom'
  | 'revealCenter';

export type IdleAnimation =
  | 'none'
  | 'float'
  | 'shake'
  | 'pulse'
  | 'bounce'
  | 'breathe'
  | 'wiggle'
  | 'sway';

/**
 * Per-shape animation config (stored by shape ID).
 */
export interface ShapeAnimationConfig {
  entrance: AnimationType;
  idle: IdleAnimation;
}

export type StepAction = 'enter' | 'exit' | 'blink' | 'move' | 'teleport' | 'swap';

export interface AnimationStep {
  id: string;
  /** IDs of tldraw shapes or React Flow elements involved in this step */
  shapeIds: string[];
  /** Animation type for this step */
  animation: AnimationType;
  /** Duration in milliseconds */
  duration: number;
  /** Label shown in the panel */
  label: string;
  /** Action type — defaults to 'enter' for backward compatibility */
  action?: StepAction;
  /** Target position for move/teleport actions */
  targetPosition?: { x: number; y: number };
  /** Original position to restore when rewinding move/teleport */
  originalPosition?: { x: number; y: number };
  /** Shape IDs to exit (for swap action) */
  exitShapeIds?: string[];
}

/**
 * Persisted React Flow diagram data — saved alongside the tldraw snapshot.
 */
export interface DiagramData {
  nodes: unknown[];
  edges: unknown[];
  edgeType: string;
  pathType: string;
  arrowType: string;
  color: string;
}

/**
 * A sub-topic is just a label + a range of step indices.
 * It does NOT contain steps — it references them by index range.
 */
export interface SubTopicLabel {
  id: string;
  title: string;
  /** Index of first step (inclusive) in the flat animationSteps array */
  startStep: number;
  /** Index of last step (inclusive) in the flat animationSteps array */
  endStep: number;
}

export interface LessonCanvasData {
  /** Version for future migration */
  version: 2;
  /** Metadata */
  meta: {
    topicSlug: string;
    subtopicSlug: string;
    title: string;
    createdAt: string;
    updatedAt: string;
  };
  /** tldraw document snapshot (serialized) */
  snapshot: unknown;
  /** Saved camera position */
  camera?: { x: number; y: number; z: number };
  /** Flat ordered animation steps */
  animationSteps: AnimationStep[];
  /** Sub-topic labels with step ranges (progress tracker) */
  subTopicLabels: SubTopicLabel[];
  /** Per-shape animation config */
  shapeAnimations: Record<string, ShapeAnimationConfig>;
  /** React Flow diagram data (nodes, edges, toolbar settings) */
  diagramData?: DiagramData;
}

/**
 * Public canvas data — a simpler format for the read-only public view.
 * Contains just the tldraw snapshot (no animation steps, sub-topics, etc.)
 */
export interface PublicCanvasData {
  version: 2;
  meta: {
    topicSlug: string;
    subtopicSlug: string;
    title: string;
    exportedAt: string;
  };
  /** tldraw document snapshot */
  snapshot: unknown;
  /** Camera position to restore the same view */
  camera?: { x: number; y: number; z: number };
  /** React Flow diagram data */
  diagramData?: DiagramData;
}
