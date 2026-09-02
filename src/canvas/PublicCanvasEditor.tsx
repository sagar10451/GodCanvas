/**
 * PublicCanvasEditor — a full tldraw editor for the public canvas.
 * Simpler than LessonCanvas: no animation steps, no sub-topics.
 * Has all drawing tools, code blocks, markdown blocks, RF nodes.
 * Saves separately to localStorage. Can export to static JSON for deployment.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { getSnapshot } from 'tldraw';
import type { Editor } from 'tldraw';
import { Save, Download, Palette, Boxes, Code2, FileText, Upload } from 'lucide-react';
import CanvasEditor from './CanvasEditor';
import type { PublicCanvasData } from './types';
import type { DiagramData } from './diagram/diagramTypes';
import { EMPTY_DIAGRAM } from './diagram/diagramTypes';
import DiagramEditor from './diagram/DiagramEditor';
import DiagramToolbar from './diagram/DiagramToolbar';
import DraggableWidget from './DraggableWidget';
import NodeCatalog from './diagram/NodeCatalog';
import './diagram/diagramStyles.css';

interface PublicCanvasEditorProps {
  topicSlug: string;
  subtopicSlug: string;
  subtopicTitle: string;
  siteId: string;
  initialData: PublicCanvasData | null;
}

// Reuse DropZone from LessonCanvas pattern
function DropZone({ onNodeDrop, editor: dropEditor }: { onNodeDrop: (pending: { item: any; position: { x: number; y: number } }) => void; editor: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const dragCountRef = useRef(0);

  useEffect(() => {
    const handleDragEnter = () => { dragCountRef.current++; setVisible(true); };
    const handleDragLeave = () => { dragCountRef.current--; if (dragCountRef.current <= 0) { dragCountRef.current = 0; setVisible(false); } };
    const handleDragEnd = () => { dragCountRef.current = 0; setVisible(false); };
    const handleDrop = () => { dragCountRef.current = 0; setVisible(false); };
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
    const handleDragOver = (e: DragEvent) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; };
    const handleElDrop = (e: DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer?.getData('application/json');
      if (!raw) return;
      try {
        const item = JSON.parse(raw);
        if (dropEditor?.screenToPage) {
          const pagePoint = dropEditor.screenToPage({ x: e.clientX, y: e.clientY });
          onNodeDrop({ item, position: { x: pagePoint.x - 60, y: pagePoint.y - 40 } });
        }
      } catch { /* ignore */ }
    };
    el.addEventListener('dragover', handleDragOver);
    el.addEventListener('drop', handleElDrop);
    return () => { el.removeEventListener('dragover', handleDragOver); el.removeEventListener('drop', handleElDrop); };
  }, [onNodeDrop, dropEditor]);

  return <div ref={ref} className="absolute inset-0 z-[5]" style={{ pointerEvents: visible ? 'auto' : 'none' }} />;
}

export default function PublicCanvasEditor({
  topicSlug,
  subtopicSlug,
  subtopicTitle,
  siteId,
  initialData,
}: PublicCanvasEditorProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [snapshot, setSnapshot] = useState<unknown>(initialData?.snapshot || null);
  const [isSaved, setIsSaved] = useState(true);
  const [showLineConfig, setShowLineConfig] = useState(false);
  const [showAnimBar, setShowAnimBar] = useState(false);
  const [showNodes, setShowNodes] = useState(false);

  // Diagram state
  const [diagramData, setDiagramData] = useState<DiagramData>(
    (initialData?.diagramData as DiagramData) || { ...EMPTY_DIAGRAM }
  );
  const [rfEdgeType, setRfEdgeType] = useState(diagramData.edgeType);
  const [rfPathType, setRfPathType] = useState(diagramData.pathType);
  const [rfArrowType, setRfArrowType] = useState(diagramData.arrowType);
  const [rfColor, setRfColor] = useState(diagramData.color);
  const [rfSelectedEdgeIds, setRfSelectedEdgeIds] = useState<string[]>([]);
  const [pendingNode, setPendingNode] = useState<{ item: any; position: { x: number; y: number } } | null>(null);
  const [tldrawCamera, setTldrawCamera] = useState<{ x: number; y: number; z: number } | null>(null);
  const diagramWrapperRef = useRef<HTMLDivElement>(null);

  const handleRfSelectionChange = useCallback((_nodeIds: string[], edgeIds: string[]) => {
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

  // Editor ready
  const handleEditorReady = useCallback((ed: Editor) => {
    setEditor(ed);
    if (initialData?.camera) {
      setTimeout(() => ed.setCamera(initialData.camera!), 50);
    }
  }, [initialData]);

  // Camera tracking
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

  const handleSnapshotChange = useCallback((newSnapshot: unknown) => {
    setSnapshot(newSnapshot);
    setIsSaved(false);
  }, []);

  // Build save data
  const buildSaveData = useCallback((): PublicCanvasData => {
    const doc = editor ? getSnapshot(editor.store).document : (snapshot as any)?.document;
    const cam = editor?.getCamera();
    return {
      version: 2,
      meta: {
        topicSlug, subtopicSlug, title: subtopicTitle,
        exportedAt: new Date().toISOString(),
      },
      snapshot: doc ? { document: doc } : snapshot,
      camera: cam ? { x: cam.x, y: cam.y, z: cam.z } : undefined,
      diagramData,
    };
  }, [editor, snapshot, topicSlug, subtopicSlug, subtopicTitle, diagramData]);

  // Auto-save to localStorage
  useEffect(() => {
    if (!editor) return;
    const saveTimeout = setTimeout(() => {
      const data = buildSaveData();
      const key = `public-canvas-${siteId}-${topicSlug}-${subtopicSlug}`;
      localStorage.setItem(key, JSON.stringify(data));
      setIsSaved(true);
    }, 1500);
    return () => clearTimeout(saveTimeout);
  }, [snapshot, diagramData, editor, siteId, topicSlug, subtopicSlug, buildSaveData]);

  // Manual save
  const handleSave = useCallback(() => {
    if (!editor) return;
    const data = buildSaveData();
    const key = `public-canvas-${siteId}-${topicSlug}-${subtopicSlug}`;
    localStorage.setItem(key, JSON.stringify(data));
    setIsSaved(true);
  }, [editor, siteId, topicSlug, subtopicSlug, buildSaveData]);

  // Export — saves JSON directly to project folder via Vite dev server API
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<string | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleExportPublic = useCallback(async () => {
    if (!editor) return;
    // Check if canvas has any content
    if (editor.getCurrentPageShapeIds().size === 0) {
      showToast('Canvas is empty — add content before exporting', 'error');
      return;
    }
    const data = buildSaveData();
    setExportStatus('Saving...');
    try {
      const res = await fetch('/__save-public-canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, topicSlug, subtopicSlug, data }),
      });
      const result = await res.json();
      if (result.success) {
        setExportStatus(null);
        showToast('Saved successfully', 'success');
      } else {
        setExportStatus(null);
        showToast('Save failed: ' + result.error, 'error');
      }
    } catch {
      setExportStatus(null);
      showToast('Save failed — is dev server running?', 'error');
    }
  }, [editor, siteId, topicSlug, subtopicSlug, buildSaveData, showToast]);

  // Publish — commits and pushes to GitHub
  const handlePublish = useCallback(async () => {
    setPublishStatus('Publishing...');
    try {
      const res = await fetch('/__publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Update public canvas: ${topicSlug}/${subtopicSlug}` }),
      });
      const result = await res.json();
      if (result.success) {
        setPublishStatus(null);
        if (result.message === 'No changes to publish') {
          showToast('No changes to publish — export first', 'error');
        } else {
          showToast('Pushed to GitHub — Vercel will auto-deploy', 'success');
        }
      } else {
        setPublishStatus(null);
        showToast('Push failed: ' + result.error, 'error');
      }
    } catch {
      setPublishStatus(null);
      showToast('Push failed — check your SSH key and network', 'error');
    }
  }, [topicSlug, subtopicSlug, showToast]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-emerald-900 border-b border-emerald-800/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-emerald-300 text-xs font-semibold px-2 py-1 bg-emerald-800 rounded">PUBLIC</span>
          <span className="text-emerald-100 text-sm font-medium">{subtopicTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleSave} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isSaved ? 'bg-emerald-800 text-emerald-400' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>
            <Save className="w-3.5 h-3.5" />{isSaved ? 'Saved' : 'Save'}
          </button>
          <button onClick={handleExportPublic} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-800 text-emerald-100 hover:bg-emerald-700 transition-all" title="Save to project folder">
            <Download className="w-3.5 h-3.5" />
            {exportStatus || 'Export'}
          </button>
          <button onClick={handlePublish} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-700 text-blue-100 hover:bg-blue-600 transition-all" title="Commit and push to GitHub">
            <Upload className="w-3.5 h-3.5" />
            {publishStatus || 'Publish'}
          </button>
          <button onClick={() => setShowLineConfig(!showLineConfig)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showLineConfig ? 'bg-cyan-500 text-white' : 'bg-emerald-800 text-emerald-100 hover:bg-emerald-700'}`}>
            Lines
          </button>
          <button onClick={() => setShowAnimBar(!showAnimBar)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showAnimBar ? 'bg-purple-500 text-white' : 'bg-emerald-800 text-emerald-100 hover:bg-emerald-700'}`}>
            <Palette className="w-3 h-3" />
            Colors
          </button>
          <button onClick={() => setShowNodes(!showNodes)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showNodes ? 'bg-emerald-500 text-white' : 'bg-emerald-800 text-emerald-100 hover:bg-emerald-700'}`}>
            <Boxes className="w-3 h-3" />
            Nodes
          </button>
          <button
            onClick={() => { if (!editor) return; const { x, y } = editor.getViewportScreenCenter(); const point = editor.screenToPage({ x, y }); editor.createShape({ type: 'code-block' as any, x: point.x - 250, y: point.y - 150 }); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-800 text-emerald-100 hover:bg-emerald-700 transition-all"
          >
            <Code2 className="w-3 h-3" />
            Code
          </button>
          <button
            onClick={() => { if (!editor) return; const { x, y } = editor.getViewportScreenCenter(); const point = editor.screenToPage({ x, y }); editor.createShape({ type: 'md-block' as any, x: point.x - 250, y: point.y - 175 }); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-800 text-emerald-100 hover:bg-emerald-700 transition-all"
          >
            <FileText className="w-3 h-3" />
            Markdown
          </button>
        </div>
      </div>

      {/* Lines toolbar */}
      {showLineConfig && (
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

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden">
        {/* tldraw */}
        <div className={`w-full h-full ${!showAnimBar ? 'hide-style-panel' : ''}`}>
          <CanvasEditor
            snapshot={snapshot}
            onEditorReady={handleEditorReady}
            onSnapshotChange={handleSnapshotChange}
            hideUi={false}
          />
        </div>

        {/* React Flow overlay */}
        <div ref={diagramWrapperRef} className="absolute inset-0 z-10 pointer-events-none">
          <DiagramEditor
            diagramData={diagramData}
            onDiagramChange={handleDiagramChange}
            onSelectionChange={handleRfSelectionChange}
            pendingNode={pendingNode}
            onPendingNodeConsumed={() => setPendingNode(null)}
            tldrawCamera={tldrawCamera}
            onReady={() => {}}
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

        {/* Drop zone */}
        <DropZone onNodeDrop={setPendingNode} editor={editor} />

        {/* Floating widgets */}
        {showNodes && (
          <DraggableWidget defaultPosition={{ x: 16, y: 16 }} zIndex={50}>
            <div className="bg-[#0f1b3d]/95 backdrop-blur-xl rounded-xl border border-emerald-400/25 shadow-2xl overflow-hidden w-72">
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
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[99999] px-5 py-3 rounded-xl shadow-2xl text-sm font-medium backdrop-blur-md transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-600/90 text-white border border-emerald-400/30'
            : 'bg-red-600/90 text-white border border-red-400/30'
        }`}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.message}
        </div>
      )}
    </div>
  );
}
