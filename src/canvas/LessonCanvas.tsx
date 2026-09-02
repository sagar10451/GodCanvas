import { useState, useCallback, useEffect, useRef } from 'react';
import { getSnapshot, loadSnapshot } from 'tldraw';
import type { Editor } from 'tldraw';
import { Lock, Unlock, Save, ArrowLeft, ChevronLeft, ChevronRight, Download, Upload, Palette, Boxes, Code2, FileText, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import CanvasEditor from './CanvasEditor';
import { createSampleOOPLesson } from './sampleLesson';
import type { AnimationStep, SubTopicLabel, LessonCanvasData, ShapeAnimationConfig } from './types';
import AnimationPanel from './AnimationPanel';
import SubTopicTracker from './SubTopicTracker';
import { applyIdleAnimation } from './animationEngine';
import { applyStepAnimation, clearStepAnimations, applyExitAnimation, applyBlinkAnimation, applyMoveAnimation, applyTeleportAnimation, rewindMoveRecords } from './stepAnimations';
import type { MoveRecord } from './stepAnimations';
import { usePresentation } from '../data/presentationContext';
import LaserPointer from '../components/LaserPointer';
import DiagramEditor from './diagram/DiagramEditor';
import DiagramToolbar from './diagram/DiagramToolbar';
import DraggableWidget from './DraggableWidget';
import NodeCatalog from './diagram/NodeCatalog';
import { EMPTY_DIAGRAM } from './diagram/diagramTypes';
import type { DiagramData } from './diagram/diagramTypes';
import './diagram/diagramStyles.css';
import PublicMarkdownEditor from './PublicMarkdownEditor';
import type { PublicCanvasData } from './types';

/** Check if an ID belongs to a React Flow element (node or edge) vs a tldraw shape.
 *  Tldraw IDs contain ':' (e.g. 'shape:xxx'). RF IDs don't. */
const isRfId = (id: string) => !id.includes(':');
const isTldrawId = (id: string) => id.includes(':');

/**
 * DropZone — only appears during drag operations from the node catalog.
 * Uses document-level dragenter/dragleave to show/hide itself,
 * so it never interferes with tldraw when not dragging.
 */
function DropZone({ onNodeDrop, editor: dropEditor }: { onNodeDrop: (pending: { item: any; position: { x: number; y: number } }) => void; editor: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const dragCountRef = useRef(0);

  useEffect(() => {
    // Track drag enter/leave on the document to know when a drag is active
    const handleDragEnter = () => {
      dragCountRef.current++;
      setVisible(true);
    };
    const handleDragLeave = () => {
      dragCountRef.current--;
      if (dragCountRef.current <= 0) {
        dragCountRef.current = 0;
        setVisible(false);
      }
    };
    const handleDragEnd = () => {
      dragCountRef.current = 0;
      setVisible(false);
    };
    const handleDrop = () => {
      dragCountRef.current = 0;
      setVisible(false);
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragend', handleDragEnd);
    document.addEventListener('drop', handleDrop);
    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragend', handleDragEnd);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    };

    const handleElDrop = (e: DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer?.getData('application/json');
      if (!raw) return;
      try {
        const item = JSON.parse(raw);
        // Convert screen coords to canvas coords
        if (dropEditor?.screenToPage) {
          const pagePoint = dropEditor.screenToPage({ x: e.clientX, y: e.clientY });
          onNodeDrop({ item, position: { x: pagePoint.x - 60, y: pagePoint.y - 40 } });
        } else {
          const rect = el.getBoundingClientRect();
          onNodeDrop({ item, position: { x: e.clientX - rect.left - 60, y: e.clientY - rect.top - 40 } });
        }
      } catch { /* ignore */ }
    };

    el.addEventListener('dragover', handleDragOver);
    el.addEventListener('drop', handleElDrop);
    return () => {
      el.removeEventListener('dragover', handleDragOver);
      el.removeEventListener('drop', handleElDrop);
    };
  }, [onNodeDrop]);

  return <div ref={ref} className="absolute inset-0 z-[5]" style={{ pointerEvents: visible ? 'auto' : 'none' }} />;
}

interface LessonCanvasProps {
  topicSlug: string;
  subtopicSlug: string;
  topicTitle: string;
  subtopicTitle: string;
  initialData: LessonCanvasData | null;
  siteId: string;
  watermark: string;
  backPath: string;
}

export default function LessonCanvas({
  topicSlug,
  subtopicSlug,
  topicTitle,
  subtopicTitle,
  initialData,
  siteId,
  backPath,
}: LessonCanvasProps) {
  const { isPresenting, presentationTool } = usePresentation();
  const [isLocked, setIsLocked] = useState(true);
  const [showPublicCanvas, setShowPublicCanvas] = useState(false);
  const [publicCanvasData, setPublicCanvasData] = useState<PublicCanvasData | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [snapshot, setSnapshot] = useState<unknown>(initialData?.snapshot || null);
  const [animationSteps, setAnimationSteps] = useState<AnimationStep[]>(initialData?.animationSteps || []);
  const [subTopicLabels, setSubTopicLabels] = useState<SubTopicLabel[]>(initialData?.subTopicLabels || []);
  const [shapeAnimations, setShapeAnimations] = useState<Record<string, ShapeAnimationConfig>>(initialData?.shapeAnimations || {});
  const [currentStep, setCurrentStep] = useState(0);
  const [showAnimPanel, setShowAnimPanel] = useState(false);
  const [showSubTopics, setShowSubTopics] = useState(false);
  const [showAnimBar, setShowAnimBar] = useState(false);
  const [showLineConfig, setShowLineConfig] = useState(false);
  const [showNodes, setShowNodes] = useState(false);
  const [pendingNode, setPendingNode] = useState<{ item: any; position: { x: number; y: number } } | null>(null);
  const [pickingDestinationForStep, setPickingDestinationForStep] = useState<string | null>(null);
  const [pickOriginalPosition, setPickOriginalPosition] = useState<{ x: number; y: number } | null>(null);
  const [isSaved, setIsSaved] = useState(true);
  const [canvasReady, setCanvasReady] = useState(false);
  const [hideLockButton, setHideLockButton] = useState(false);
  const [tldrawCamera, setTldrawCamera] = useState<{ x: number; y: number; z: number } | null>(null);

  // ─── Diagram (React Flow) state ──────────────────────────────────────────
  const [diagramData, setDiagramData] = useState<DiagramData>(
    (initialData?.diagramData as DiagramData) || { ...EMPTY_DIAGRAM }
  );
  const [rfEdgeType, setRfEdgeType] = useState(diagramData.edgeType);
  const [rfPathType, setRfPathType] = useState(diagramData.pathType);
  const [rfArrowType, setRfArrowType] = useState(diagramData.arrowType);
  const [rfColor, setRfColor] = useState(diagramData.color);
  const [rfSelectedNodeIds, setRfSelectedNodeIds] = useState<string[]>([]);
  const [rfSelectedEdgeIds, setRfSelectedEdgeIds] = useState<string[]>([]);
  const diagramWrapperRef = useRef<HTMLDivElement>(null);
  const moveOriginalPositionsRef = useRef<Record<string, MoveRecord[]>>({});

  const handleRfSelectionChange = useCallback((nodeIds: string[], edgeIds: string[]) => {
    setRfSelectedNodeIds(nodeIds);
    setRfSelectedEdgeIds(edgeIds);
  }, []);

  const handleDiagramChange = useCallback((data: DiagramData) => {
    setDiagramData(data);
    setIsSaved(false);
  }, []);

  const handleRfFlip = useCallback(() => {
    const wrapper = diagramWrapperRef.current?.querySelector('.rf-diagram-wrapper') as HTMLElement & { __flipEdges?: () => void } | null;
    if (wrapper?.__flipEdges) wrapper.__flipEdges();
  }, []);

  // ─── Load public canvas data from localStorage ────────────────────────────
  useEffect(() => {
    const key = `public-canvas-${siteId}-${topicSlug}-${subtopicSlug}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try { setPublicCanvasData(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, [siteId, topicSlug, subtopicSlug]);

  // ─── tldraw callbacks ────────────────────────────────────────────────────
  const handleEditorReady = useCallback((ed: Editor) => {
    setEditor(ed);
    setTimeout(() => {
      // Restore saved camera position
      if (initialData?.camera) {
        ed.setCamera(initialData.camera);
      }
      applyAnimationState(ed, animationSteps, 0);
      ed.updateInstanceState({ isReadonly: true });
      setCanvasReady(true);
    }, 50);
  }, [animationSteps, initialData]);

  // Re-apply animation state for RF elements after they mount (initial page load)
  // Track tldraw camera for RF viewport sync
  useEffect(() => {
    if (!editor) return;
    const updateCamera = () => {
      const cam = editor.getCamera();
      setTldrawCamera({ x: cam.x, y: cam.y, z: cam.z });
    };
    updateCamera();
    const unsub = editor.store.listen(updateCamera, { scope: 'session' });
    return () => unsub();
  }, [editor]);

  const applyAnimationState = useCallback((ed: Editor, steps: AnimationStep[], upToStep: number) => {
    if (steps.length === 0) return;

    // Temporarily allow tldraw edits
    ed.updateInstanceState({ isReadonly: false });

    // Hide all tldraw animated shapes
    const allAnimatedIds = new Set(steps.flatMap(s => s.shapeIds).filter(isTldrawId));
    allAnimatedIds.forEach(shapeId => {
      const shape = ed.getShape(shapeId as any);
      if (shape) ed.updateShape({ id: shape.id, type: shape.type, opacity: 0 });
    });

    // Hide all RF animated elements via class
    const allRfIds = new Set(steps.flatMap(s => s.shapeIds).filter(isRfId));
    allRfIds.forEach(rfId => {
      const el = document.querySelector(`[data-id="${rfId}"]`) as HTMLElement | null;
      if (el) { el.classList.add('rf-anim-hidden'); el.classList.remove('rf-anim-visible'); }
    });

    // Also collect exit shape IDs from swap steps
    const allExitIds = new Set(steps.flatMap(s => s.exitShapeIds || []).filter(isTldrawId));
    allExitIds.forEach(shapeId => {
      const shape = ed.getShape(shapeId as any);
      if (shape) ed.updateShape({ id: shape.id, type: shape.type, opacity: 0 });
    });
    const allRfExitIds = new Set(steps.flatMap(s => s.exitShapeIds || []).filter(isRfId));
    allRfExitIds.forEach(rfId => {
      const el = document.querySelector(`[data-id="${rfId}"]`) as HTMLElement | null;
      if (el) { el.classList.add('rf-anim-hidden'); el.classList.remove('rf-anim-visible'); }
    });

    // Show/hide up to the given step based on action type
    for (let i = 0; i <= upToStep && i < steps.length; i++) {
      const stepAction = steps[i].action || 'enter';

      if (stepAction === 'exit') {
        // Exit step: shapes should be HIDDEN at this step
        steps[i].shapeIds.filter(isTldrawId).forEach(shapeId => {
          const shape = ed.getShape(shapeId as any);
          if (shape) ed.updateShape({ id: shape.id, type: shape.type, opacity: 0 });
        });
        steps[i].shapeIds.filter(isRfId).forEach(rfId => {
          const el = document.querySelector(`[data-id="${rfId}"]`) as HTMLElement | null;
          if (el) { el.classList.add('rf-anim-hidden'); el.classList.remove('rf-anim-visible'); }
        });
      } else if (stepAction === 'swap') {
        // Swap: show entering shapes, hide exiting shapes
        steps[i].shapeIds.filter(isTldrawId).forEach(shapeId => {
          const shape = ed.getShape(shapeId as any);
          if (shape) ed.updateShape({ id: shape.id, type: shape.type, opacity: 1 });
        });
        steps[i].shapeIds.filter(isRfId).forEach(rfId => {
          const el = document.querySelector(`[data-id="${rfId}"]`) as HTMLElement | null;
          if (el) { el.classList.remove('rf-anim-hidden'); el.classList.add('rf-anim-visible'); }
        });
        (steps[i].exitShapeIds || []).filter(isTldrawId).forEach(shapeId => {
          const shape = ed.getShape(shapeId as any);
          if (shape) ed.updateShape({ id: shape.id, type: shape.type, opacity: 0 });
        });
        (steps[i].exitShapeIds || []).filter(isRfId).forEach(rfId => {
          const el = document.querySelector(`[data-id="${rfId}"]`) as HTMLElement | null;
          if (el) { el.classList.add('rf-anim-hidden'); el.classList.remove('rf-anim-visible'); }
        });
      } else {
        // Enter, blink, move, teleport: shapes should be VISIBLE
        steps[i].shapeIds.filter(isTldrawId).forEach(shapeId => {
          const shape = ed.getShape(shapeId as any);
          if (shape) ed.updateShape({ id: shape.id, type: shape.type, opacity: 1 });
        });
        steps[i].shapeIds.filter(isRfId).forEach(rfId => {
          const el = document.querySelector(`[data-id="${rfId}"]`) as HTMLElement | null;
          if (el) { el.classList.remove('rf-anim-hidden'); el.classList.add('rf-anim-visible'); }
        });
      }
    }

    // Re-lock tldraw
    ed.updateInstanceState({ isReadonly: true });
  }, []);

  // Called when DiagramEditor's React Flow is initialized — RF nodes are now in DOM
  const handleDiagramReady = useCallback(() => {
    if (!editor || !isLocked || animationSteps.length === 0) return;
    setTimeout(() => {
      applyAnimationState(editor, animationSteps, currentStep);
    }, 50);
  }, [editor, isLocked, animationSteps, currentStep, applyAnimationState]);

  const handleSnapshotChange = useCallback((newSnapshot: unknown) => {
    setSnapshot(newSnapshot);
    setIsSaved(false);
  }, []);

  const handleStepsChange = useCallback((newSteps: AnimationStep[]) => {
    setAnimationSteps(newSteps);
    setIsSaved(false);
  }, []);

  // Watch for deleted shapes and clean up animation steps + sub-topic ranges
  useEffect(() => {
    if (!editor || isLocked) return;

    const cleanup = () => {
      const existingShapeIds = new Set(
        editor.getCurrentPageShapeIds() as Set<string>
      );

      const rfNodeIds = new Set(diagramData.nodes.map((n: any) => n.id as string));
      const rfEdgeIds = new Set(diagramData.edges.map((e: any) => e.id as string));

      const cleanedSteps = animationSteps
        .map(step => ({
          ...step,
          shapeIds: step.shapeIds.filter(id => {
            if (isRfId(id)) return rfNodeIds.has(id) || rfEdgeIds.has(id);
            return existingShapeIds.has(id);
          }),
        }))
        .filter(step => step.shapeIds.length > 0);

      if (cleanedSteps.length !== animationSteps.length) {
        setAnimationSteps(cleanedSteps);

        const maxStepIndex = cleanedSteps.length - 1;
        const adjustedLabels = subTopicLabels.map(label => ({
          ...label,
          startStep: Math.min(label.startStep, Math.max(0, maxStepIndex)),
          endStep: Math.min(label.endStep, Math.max(0, maxStepIndex)),
        }));
        setSubTopicLabels(adjustedLabels);

        const cleanedAnims: Record<string, ShapeAnimationConfig> = {};
        for (const [id, config] of Object.entries(shapeAnimations)) {
          if (existingShapeIds.has(id) || rfNodeIds.has(id) || rfEdgeIds.has(id)) {
            cleanedAnims[id] = config;
          }
        }
        setShapeAnimations(cleanedAnims);
        setIsSaved(false);
      }
    };

    const unsub = editor.store.listen(cleanup, { scope: 'document' });
    return () => unsub();
  }, [editor, isLocked, animationSteps, subTopicLabels, shapeAnimations, diagramData]);

  const handleLabelsChange = useCallback((newLabels: SubTopicLabel[]) => {
    setSubTopicLabels(newLabels);
    setIsSaved(false);
  }, []);

  // ─── Build save data helper ──────────────────────────────────────────────
  const buildSaveData = useCallback((): LessonCanvasData => {
    const doc = editor ? getSnapshot(editor.store).document : (snapshot as any)?.document;
    const cam = editor?.getCamera();
    return {
      version: 2,
      meta: {
        topicSlug, subtopicSlug, title: subtopicTitle,
        createdAt: initialData?.meta.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      snapshot: doc ? { document: doc } : snapshot,
      camera: cam ? { x: cam.x, y: cam.y, z: cam.z } : undefined,
      animationSteps,
      subTopicLabels,
      shapeAnimations,
      diagramData,
    };
  }, [editor, snapshot, topicSlug, subtopicSlug, subtopicTitle, animationSteps, subTopicLabels, shapeAnimations, diagramData, initialData]);

  // Auto-save
  useEffect(() => {
    if (!editor) return;
    const saveTimeout = setTimeout(() => {
      const data = buildSaveData();
      const key = `lesson-canvas-${siteId}-${topicSlug}-${subtopicSlug}`;
      localStorage.setItem(key, JSON.stringify(data));
      setIsSaved(true);
    }, 1500);
    return () => clearTimeout(saveTimeout);
  }, [snapshot, animationSteps, subTopicLabels, shapeAnimations, diagramData, editor, siteId, topicSlug, subtopicSlug, buildSaveData]);

  // Lock / Unlock
  const toggleLock = useCallback(() => {
    if (!editor) return;
    if (isLocked) {
      editor.updateInstanceState({ isReadonly: false });
      editor.getCurrentPageShapes().forEach(shape => {
        if (shape.opacity < 1) editor.updateShape({ id: shape.id, type: shape.type, opacity: 1 });
      });
      // Remove animation visibility classes from all RF elements
      document.querySelectorAll('.rf-anim-hidden, .rf-anim-visible').forEach(el => {
        el.classList.remove('rf-anim-hidden', 'rf-anim-visible');
      });
      // Delete any move/teleport clones and restore originals
      for (const records of Object.values(moveOriginalPositionsRef.current)) {
        rewindMoveRecords(records, editor);
      }
      moveOriginalPositionsRef.current = {};
      setIsLocked(false);
    } else {
      editor.updateInstanceState({ isReadonly: false });
      // Restore all saved move/teleport positions before locking
      for (const records of Object.values(moveOriginalPositionsRef.current)) {
        rewindMoveRecords(records, editor);
      }
      moveOriginalPositionsRef.current = {};
      setCurrentStep(0);
      applyAnimationState(editor, animationSteps, 0);
      // Re-apply after a frame to catch RF elements that might not be in DOM yet
      setTimeout(() => applyAnimationState(editor, animationSteps, 0), 100);
      editor.updateInstanceState({ isReadonly: true });
      setIsLocked(true);
      setShowAnimPanel(false);
      setShowSubTopics(false);
      setShowAnimBar(false);
      setShowNodes(false);
    }
  }, [isLocked, editor, animationSteps, applyAnimationState]);

  // Camera nudge
  const ensureShapesVisible = useCallback((shapeIds: string[]) => {
    if (!editor) return;
    const viewportBounds = editor.getViewportScreenBounds();
    const camera = editor.getCamera();
    const zoom = camera.z;

    // Collect page-space bounding box of all shapes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const shapeId of shapeIds.filter(isTldrawId)) {
      const bounds = editor.getShapePageBounds(shapeId as any);
      if (bounds) {
        minX = Math.min(minX, bounds.x); minY = Math.min(minY, bounds.y);
        maxX = Math.max(maxX, bounds.x + bounds.w); maxY = Math.max(maxY, bounds.y + bounds.h);
      }
    }

    for (const rfId of shapeIds.filter(isRfId)) {
      const el = document.querySelector(`[data-id="${rfId}"]`) as HTMLElement | null;
      if (el) {
        const rect = el.getBoundingClientRect();
        const topLeft = editor.screenToPage({ x: rect.left, y: rect.top });
        const bottomRight = editor.screenToPage({ x: rect.right, y: rect.bottom });
        minX = Math.min(minX, topLeft.x); minY = Math.min(minY, topLeft.y);
        maxX = Math.max(maxX, bottomRight.x); maxY = Math.max(maxY, bottomRight.y);
      }
    }

    if (minX === Infinity) return;

    // Convert page bounds to screen coordinates
    const screenTopLeft = editor.pageToScreen({ x: minX, y: minY });
    const screenBottomRight = editor.pageToScreen({ x: maxX, y: maxY });

    // Compare with actual viewport screen bounds
    const padding = 50;
    const padBottom = 80;
    let dx = 0, dy = 0;

    if (screenTopLeft.x < viewportBounds.x + padding) {
      dx = (viewportBounds.x + padding - screenTopLeft.x) / zoom;
    } else if (screenBottomRight.x > viewportBounds.x + viewportBounds.w - padding) {
      dx = (viewportBounds.x + viewportBounds.w - padding - screenBottomRight.x) / zoom;
    }

    if (screenTopLeft.y < viewportBounds.y + padding) {
      dy = (viewportBounds.y + padding - screenTopLeft.y) / zoom;
    } else if (screenBottomRight.y > viewportBounds.y + viewportBounds.h - padBottom) {
      dy = (viewportBounds.y + viewportBounds.h - padBottom - screenBottomRight.y) / zoom;
    }

    if (dx !== 0 || dy !== 0) {
      editor.setCamera({ x: camera.x + dx, y: camera.y + dy, z: zoom }, { animation: { duration: 300 } });
    }
  }, [editor]);

  const goNext = useCallback(() => {
    if (!editor || !isLocked) return;
    if (currentStep >= animationSteps.length - 1) return;
    const nextStep = currentStep + 1;
    const step = animationSteps[nextStep];
    const action = step.action || 'enter';

    switch (action) {
      case 'enter':
      default: {
        // Show shapes with animation
        applyAnimationState(editor, animationSteps, nextStep);
        applyStepAnimation(step.shapeIds, step.animation, step.duration);
        step.shapeIds.forEach(shapeId => {
          const config = shapeAnimations[shapeId];
          if (config?.idle && config.idle !== 'none') {
            applyIdleAnimation(shapeId, config.idle);
          }
        });
        break;
      }
      case 'exit': {
        // Hide shapes with exit animation, then update state
        applyExitAnimation(step.shapeIds, step.animation, step.duration, () => {
          applyAnimationState(editor, animationSteps, nextStep);
        });
        break;
      }
      case 'blink': {
        // Flash shapes in place
        applyBlinkAnimation(step.shapeIds, step.duration);
        break;
      }
      case 'move': {
        if (step.targetPosition) {
          const records = applyMoveAnimation(step.shapeIds, step.targetPosition, step.duration, editor);
          moveOriginalPositionsRef.current[step.id] = records;
        }
        break;
      }
      case 'teleport': {
        if (step.targetPosition) {
          const records = applyTeleportAnimation(step.shapeIds, step.targetPosition, step.duration, editor);
          moveOriginalPositionsRef.current[step.id] = records;
        }
        break;
      }
      case 'swap': {
        // applyAnimationState handles showing enter shapes and hiding exit shapes
        applyAnimationState(editor, animationSteps, nextStep);
        // Animate the entering shapes
        applyStepAnimation(step.shapeIds, step.animation, step.duration);
        break;
      }
    }

    setCurrentStep(nextStep);
    setTimeout(() => ensureShapesVisible(step.shapeIds), 150);
  }, [editor, isLocked, currentStep, animationSteps, shapeAnimations, ensureShapesVisible, applyAnimationState]);

  const goPrevious = useCallback(() => {
    if (!editor || !isLocked) return;
    if (currentStep < 0) return;

    const step = animationSteps[currentStep];
    const action = step.action || 'enter';

    // Rewind move/teleport clones for this step
    if ((action === 'move' || action === 'teleport') && moveOriginalPositionsRef.current[step.id]) {
      rewindMoveRecords(moveOriginalPositionsRef.current[step.id], editor);
      delete moveOriginalPositionsRef.current[step.id];
    }

    clearStepAnimations(step.shapeIds);

    if (currentStep === 0) {
      applyAnimationState(editor, animationSteps, -1);
      setCurrentStep(-1);
    } else {
      const prevStep = currentStep - 1;
      applyAnimationState(editor, animationSteps, prevStep);
      setCurrentStep(prevStep);
    }
  }, [editor, isLocked, currentStep, animationSteps, applyAnimationState]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); return; }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'l') { e.preventDefault(); setHideLockButton(h => !h); return; }
      if (isLocked) {
        if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrevious(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, goNext, goPrevious]);

  const handleSave = useCallback(() => {
    if (!editor) return;
    const data = buildSaveData();
    const key = `lesson-canvas-${siteId}-${topicSlug}-${subtopicSlug}`;
    localStorage.setItem(key, JSON.stringify(data));
    setIsSaved(true);
  }, [editor, siteId, topicSlug, subtopicSlug, buildSaveData]);

  const handleExport = useCallback(() => {
    if (!editor) return;
    const data = buildSaveData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `lesson-${topicSlug}-${subtopicSlug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [editor, topicSlug, subtopicSlug, buildSaveData]);

  const handleImport = useCallback(() => {
    const input = window.document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string) as LessonCanvasData;
          if (data.snapshot && editor) {
            loadSnapshot(editor.store, data.snapshot as Parameters<typeof loadSnapshot>[1]);
          }
          if (data.animationSteps) setAnimationSteps(data.animationSteps);
          if (data.subTopicLabels) setSubTopicLabels(data.subTopicLabels);
          if (data.shapeAnimations) setShapeAnimations(data.shapeAnimations);
          if (data.diagramData) {
            setDiagramData(data.diagramData as DiagramData);
            setRfEdgeType((data.diagramData as DiagramData).edgeType);
            setRfPathType((data.diagramData as DiagramData).pathType);
            setRfArrowType((data.diagramData as DiagramData).arrowType);
            setRfColor((data.diagramData as DiagramData).color);
          }
          setIsSaved(false);
        } catch (err) {
          console.error('Failed to import lesson:', err);
          alert('Invalid lesson file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [editor]);

  const handleSeedCanvas = useCallback((ed: Editor) => {
    if (topicSlug === 'java' && subtopicSlug === 'oop-concepts') {
      const steps = createSampleOOPLesson(ed);
      if (steps.length > 0) {
        setAnimationSteps(steps);
        setTimeout(() => applyAnimationState(ed, steps, 0), 50);
      }
    }
  }, [topicSlug, subtopicSlug, applyAnimationState]);

  return (
    <div className={`w-full ${isPresenting ? 'h-screen' : 'h-[calc(100vh-78px)]'} flex flex-col overflow-hidden`}>
      {/* ─── Main Toolbar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0f1b3d] border-b border-[#1a2a5e] flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to={backPath} className="flex items-center gap-1.5 text-blue-100 hover:text-blue-100 text-sm transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />Back
          </Link>
          <div className="w-px h-5 bg-blue-900" />
          <span className="text-blue-200 text-sm">{topicTitle}</span>
          <span className="text-blue-400 text-sm">/</span>
          <span className="text-blue-100 text-sm font-medium">{subtopicTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Step counter (locked) */}
          {isLocked && animationSteps.length > 0 && (
            <div className={`flex items-center gap-1.5 ${!hideLockButton ? 'mr-2' : ''}`}>
              <button onClick={goPrevious} disabled={currentStep < 0} className="p-1 rounded bg-blue-900 hover:bg-blue-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronLeft className="w-3.5 h-3.5 text-blue-100" />
              </button>
              <span className="text-blue-100 text-xs font-medium min-w-[40px] text-center">
                {currentStep + 1} / {animationSteps.length}
              </span>
              <button onClick={goNext} disabled={currentStep >= animationSteps.length - 1} className="p-1 rounded bg-blue-900 hover:bg-blue-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronRight className="w-3.5 h-3.5 text-blue-100" />
              </button>
            </div>
          )}

          {/* Lock/Unlock */}
          {!hideLockButton && !isPresenting && (
            <button onClick={toggleLock} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${isLocked ? 'bg-blue-900 text-blue-100 hover:bg-blue-800 border border-blue-800' : 'bg-emerald-600 text-white hover:bg-emerald-600/30 border border-emerald-500/30'}`}>
              {isLocked ? <><Lock className="w-3.5 h-3.5" />Locked</> : <><Unlock className="w-3.5 h-3.5" />Unlocked</>}
            </button>
          )}

          {/* Save */}
          {!isLocked && (
            <button onClick={handleSave} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isSaved ? 'bg-blue-900 text-blue-300' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>
              <Save className="w-3.5 h-3.5" />{isSaved ? 'Saved' : 'Save'}
            </button>
          )}

          {/* Export / Import */}
          {!isLocked && (
            <>
              <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-900 text-blue-100 hover:bg-blue-800 transition-all" title="Export as JSON">
                <Download className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleImport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-900 text-blue-100 hover:bg-blue-800 transition-all" title="Import JSON">
                <Upload className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Panel toggle buttons (unlocked) */}
          {!isLocked && (
            <>
              <button onClick={() => setShowLineConfig(!showLineConfig)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showLineConfig ? 'bg-cyan-500 text-white' : 'bg-blue-900 text-blue-100 hover:bg-blue-800'}`}>
                Lines
              </button>
              <button onClick={() => setShowAnimBar(!showAnimBar)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showAnimBar ? 'bg-purple-500 text-white' : 'bg-blue-900 text-blue-100 hover:bg-blue-800'}`}>
                <Palette className="w-3 h-3" />
                Colors
              </button>
              <button onClick={() => setShowNodes(!showNodes)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showNodes ? 'bg-emerald-500 text-white' : 'bg-blue-900 text-blue-100 hover:bg-blue-800'}`}>
                <Boxes className="w-3 h-3" />
                Nodes
              </button>
              <button
                onClick={() => {
                  if (!editor) return;
                  const { x, y } = editor.getViewportScreenCenter();
                  const point = editor.screenToPage({ x, y });
                  editor.createShape({ type: 'code-block' as any, x: point.x - 250, y: point.y - 150 });
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-900 text-blue-100 hover:bg-blue-800 transition-all"
              >
                <Code2 className="w-3 h-3" />
                Code
              </button>
              <button
                onClick={() => {
                  if (!editor) return;
                  const { x, y } = editor.getViewportScreenCenter();
                  const point = editor.screenToPage({ x, y });
                  editor.createShape({ type: 'md-block' as any, x: point.x - 250, y: point.y - 175 });
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-900 text-blue-100 hover:bg-blue-800 transition-all"
              >
                <FileText className="w-3 h-3" />
                Markdown
              </button>
              <button onClick={() => setShowAnimPanel(!showAnimPanel)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showAnimPanel ? 'bg-blue-500 text-white' : 'bg-blue-900 text-blue-100 hover:bg-blue-800'}`}>
                Steps
              </button>
              <button onClick={() => setShowSubTopics(!showSubTopics)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showSubTopics ? 'bg-indigo-500 text-white' : 'bg-blue-900 text-blue-100 hover:bg-blue-800'}`}>
                Sub Topics
              </button>
            </>
          )}
          {/* Public canvas toggle — always available */}
          <button onClick={() => setShowPublicCanvas(!showPublicCanvas)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showPublicCanvas ? 'bg-emerald-600 text-white' : 'bg-blue-900 text-blue-100 hover:bg-blue-800'}`}>
            <Eye className="w-3 h-3" />
            Public
          </button>
        </div>
      </div>

      {/* ─── Public Canvas OR Main Canvas ─────────────────────────── */}
      {showPublicCanvas ? (
        <PublicMarkdownEditor
          topicSlug={topicSlug}
          subtopicSlug={subtopicSlug}
          subtopicTitle={subtopicTitle}
          siteId={siteId}
          initialData={publicCanvasData}
        />
      ) : (
      <>
      {/* ─── Line Config Bar (below toolbar, when unlocked) ───────────── */}
      {!isLocked && showLineConfig && (
        <DiagramToolbar
          edgeType={rfEdgeType}
          pathType={rfPathType}
          arrowType={rfArrowType}
          color={rfColor}
          onEdgeTypeChange={setRfEdgeType}
          onPathTypeChange={setRfPathType}
          onArrowTypeChange={setRfArrowType}
          onColorChange={setRfColor}
          hasEdgeSelection={rfSelectedEdgeIds.length > 0}
          onFlip={handleRfFlip}
        />
      )}

      {/* ─── Canvas Area (full remaining space) ───────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {/* tldraw canvas — always visible */}
        <div className={`w-full h-full ${isLocked ? 'canvas-locked' : ''} ${!isLocked && !showAnimBar ? 'hide-style-panel' : ''} ${canvasReady ? 'opacity-100' : 'opacity-0'} transition-opacity duration-150`}>
          <CanvasEditor
            snapshot={snapshot}
            onEditorReady={handleEditorReady}
            onSnapshotChange={handleSnapshotChange}
            onSeedCanvas={handleSeedCanvas}
            hideUi={isLocked}
          />
        </div>

        {/* React Flow diagram overlay — always rendered so nodes/edges stay in DOM for animation steps */}
        <div ref={diagramWrapperRef} className={`absolute inset-0 z-10 pointer-events-none ${isLocked && currentStep < 0 ? 'invisible' : ''} ${isLocked ? 'rf-locked' : ''}`}>
          <DiagramEditor
            diagramData={diagramData}
            onDiagramChange={handleDiagramChange}
            onSelectionChange={handleRfSelectionChange}
            pendingNode={pendingNode}
            onPendingNodeConsumed={() => setPendingNode(null)}
            tldrawCamera={tldrawCamera}
            onReady={handleDiagramReady}
            edgeType={rfEdgeType}
            pathType={rfPathType}
            arrowType={rfArrowType}
            color={rfColor}
            onEdgeTypeChange={setRfEdgeType}
            onPathTypeChange={setRfPathType}
            onArrowTypeChange={setRfArrowType}
            onColorChange={setRfColor}
          />
        </div>

        {/* Drop zone overlay — catches node catalog drops above tldraw */}
        {!isLocked && <DropZone onNodeDrop={setPendingNode} editor={editor} />}

        {/* Destination picker — drag shape then confirm */}
        {pickingDestinationForStep && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-slate-900/95 backdrop-blur-md text-blue-100 text-xs font-medium px-4 py-2.5 rounded-lg border border-blue-800/40 shadow-xl">
            <span className="text-blue-300">Drag the shape to its destination</span>
            <button
              onClick={() => {
                if (!editor) return;
                const step = animationSteps.find(s => s.id === pickingDestinationForStep);
                if (!step || step.shapeIds.length === 0) return;
                const shapeId = step.shapeIds[0];
                const shape = editor.getShape(shapeId as any);
                if (!shape) return;

                // Save current (dragged-to) position as target
                const targetPos = { x: (shape as any).x, y: (shape as any).y };

                // Move shape back to original position
                if (pickOriginalPosition) {
                  editor.updateShape({
                    id: shape.id,
                    type: shape.type,
                    x: pickOriginalPosition.x,
                    y: pickOriginalPosition.y,
                  });
                }

                // Save target position in the step
                setAnimationSteps(steps => steps.map(s =>
                  s.id === pickingDestinationForStep ? { ...s, targetPosition: targetPos } : s
                ));

                // Re-lock canvas
                editor.updateInstanceState({ isReadonly: true });
                setPickingDestinationForStep(null);
                setPickOriginalPosition(null);
                setIsSaved(false);
              }}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-blue-100 text-xs font-semibold transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => {
                if (!editor) return;
                // Cancel — move shape back to original
                const step = animationSteps.find(s => s.id === pickingDestinationForStep);
                if (step && step.shapeIds.length > 0 && pickOriginalPosition) {
                  const shapeId = step.shapeIds[0];
                  const shape = editor.getShape(shapeId as any);
                  if (shape) {
                    editor.updateShape({
                      id: shape.id,
                      type: shape.type,
                      x: pickOriginalPosition.x,
                      y: pickOriginalPosition.y,
                    });
                  }
                }
                editor.updateInstanceState({ isReadonly: true });
                setPickingDestinationForStep(null);
                setPickOriginalPosition(null);
              }}
              className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-blue-200 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* ─── Floating Widgets (all draggable, dark glass-morphism) ──── */}

        {/* Nodes Catalog */}
        {!isLocked && showNodes && (
          <DraggableWidget defaultPosition={{ x: 16, y: 16 }} zIndex={50}>
            <div className="bg-[#0f1b3d]/95 backdrop-blur-xl rounded-xl border border-emerald-400/25 shadow-2xl shadow-emerald-500/5 overflow-hidden w-72">
              <div data-drag-handle className="flex items-center justify-between px-3 py-2.5 border-b border-emerald-400/15 bg-emerald-500/8 cursor-grab active:cursor-grabbing">
                <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Boxes className="w-3 h-3" />
                  Node Catalog
                </span>
              </div>
              <NodeCatalog />
            </div>
          </DraggableWidget>
        )}

        {/* Animation Steps Panel */}
        {!isLocked && showAnimPanel && (
          <DraggableWidget defaultPosition={{ x: window.innerWidth - 320, y: 16 }} zIndex={50}>
            <div className="bg-[#0f1b3d]/95 backdrop-blur-xl rounded-xl border border-blue-400/25 shadow-2xl shadow-blue-500/5 overflow-hidden w-72">
              <div data-drag-handle className="flex items-center justify-between px-3 py-2.5 border-b border-blue-400/15 bg-blue-500/8 cursor-grab active:cursor-grabbing">
                <span className="text-xs font-semibold text-blue-300">Animation Steps</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <AnimationPanel
                  steps={animationSteps}
                  onStepsChange={handleStepsChange}
                  editor={editor}
                  rfSelectedNodeIds={rfSelectedNodeIds}
                  rfSelectedEdgeIds={rfSelectedEdgeIds}
                  diagramData={diagramData}
                  onPickDestination={(stepId) => {
                    if (!editor) return;
                    const step = animationSteps.find(s => s.id === stepId);
                    if (!step || step.shapeIds.length === 0) return;
                    const shapeId = step.shapeIds[0];
                    if (!shapeId.includes(':')) return; // Only tldraw shapes
                    const shape = editor.getShape(shapeId as any);
                    if (!shape) return;
                    // Save original position
                    setPickOriginalPosition({ x: (shape as any).x, y: (shape as any).y });
                    setPickingDestinationForStep(stepId);
                    // Unlock canvas so user can drag the shape
                    editor.updateInstanceState({ isReadonly: false });
                    // Select the shape so it's easy to drag
                    editor.select(shapeId as any);
                  }}
                />
              </div>
            </div>
          </DraggableWidget>
        )}

        {/* Sub Topic Tracker */}
        {(isLocked || showSubTopics) && (
          <SubTopicTracker
            labels={subTopicLabels}
            onLabelsChange={handleLabelsChange}
            steps={animationSteps}
            isLocked={isLocked}
            currentStep={currentStep}
          />
        )}

        {/* Laser pointer overlay — only in presentation mode with laser tool */}
        {isPresenting && isLocked && presentationTool === 'laser' && <LaserPointer />}
      </div>
      </>
      )}
    </div>
  );
}
