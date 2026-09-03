import {
  Plus, Trash2, ChevronUp, ChevronDown,
  Type, Square, ArrowRight, Image, Pencil, Circle, Triangle, Star, Minus,
  GitBranch, Cable, Crosshair,
} from 'lucide-react';
import type { AnimationStep, AnimationType, StepAction } from './types';
import type { Editor } from 'tldraw';
import type { DiagramData } from './diagram/diagramTypes';
import { getIconComponent } from './diagram/iconRegistry';

interface AnimationPanelProps {
  steps: AnimationStep[];
  onStepsChange: (steps: AnimationStep[]) => void;
  editor: Editor | null;
  rfSelectedNodeIds?: string[];
  rfSelectedEdgeIds?: string[];
  diagramData?: DiagramData;
  /** Callback to enter "pick destination" mode on the canvas */
  onPickDestination?: (stepId: string) => void;
}

const actionOptions: { value: StepAction; label: string; desc: string }[] = [
  { value: 'enter', label: 'Enter', desc: 'Shapes appear' },
  { value: 'exit', label: 'Exit', desc: 'Shapes disappear' },
  { value: 'blink', label: 'Blink', desc: 'Flash in place' },
  { value: 'move', label: 'Move', desc: 'Slide to position' },
  { value: 'teleport', label: 'Teleport', desc: 'Jump to position' },
  { value: 'swap', label: 'Swap', desc: 'Replace shapes' },
  { value: 'zoom', label: 'Zoom', desc: 'Camera zoom to shapes' },
];

const animationTypes: { value: AnimationType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'appear', label: 'Appear' },
  { value: 'fadeIn', label: 'Fade In' },
  { value: 'flyInLeft', label: 'Fly In Left' },
  { value: 'flyInRight', label: 'Fly In Right' },
  { value: 'flyInTop', label: 'Fly In Top' },
  { value: 'flyInBottom', label: 'Fly In Bottom' },
  { value: 'slideInLeft', label: 'Slide In Left' },
  { value: 'slideInRight', label: 'Slide In Right' },
  { value: 'slideInTop', label: 'Slide In Top' },
  { value: 'slideInBottom', label: 'Slide In Bottom' },
  { value: 'zoomIn', label: 'Zoom In' },
  { value: 'zoomOut', label: 'Zoom Out' },
  { value: 'pop', label: 'Pop' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'idleFloat', label: 'Float (loop)' },
  { value: 'idleShake', label: 'Shake (loop)' },
  { value: 'idlePulse', label: 'Pulse (loop)' },
  { value: 'idleBounce', label: 'Bounce (loop)' },
  { value: 'idleBreathe', label: 'Breathe (loop)' },
  { value: 'idleWiggle', label: 'Wiggle (loop)' },
  { value: 'idleSway', label: 'Sway (loop)' },
  { value: 'revealLeft', label: 'Reveal Left→Right' },
  { value: 'revealRight', label: 'Reveal Right→Left' },
  { value: 'revealTop', label: 'Reveal Top→Down' },
  { value: 'revealBottom', label: 'Reveal Bottom→Up' },
  { value: 'revealCenter', label: 'Reveal Center Out' },
];

function getShapeInfo(
  editor: Editor | null,
  shapeId: string,
  diagramData?: DiagramData,
): { icon: React.ReactNode; label: string } {
  const cls = "w-3.5 h-3.5";

  if (!shapeId.includes(':')) {
    const node = diagramData?.nodes.find((n: any) => n.id === shapeId) as any;
    if (node) {
      const label = node?.data?.label || 'Node';
      const iconId = node?.data?.icon as string | undefined;
      if (iconId) {
        const IconComp = getIconComponent(iconId);
        if (IconComp) return { icon: <IconComp width={14} height={14} />, label };
      }
      return { icon: <GitBranch className={cls} />, label };
    }
    const edge = diagramData?.edges.find((e: any) => e.id === shapeId);
    if (edge) return { icon: <Cable className={cls} />, label: 'Edge' };
    return { icon: <GitBranch className={cls} />, label: 'Element' };
  }

  if (!editor) return { icon: <Square className={cls} />, label: 'Unknown' };
  const shape = editor.getShape(shapeId as any);
  if (!shape) return { icon: <Square className={cls} />, label: 'Unknown' };
  switch (shape.type) {
    case 'text': {
      const props = shape.props as any;
      let text = '';
      try {
        const content = props.richText?.content;
        if (Array.isArray(content)) {
          for (const nd of content) {
            if (nd.content && Array.isArray(nd.content)) {
              for (const inline of nd.content) {
                if (inline.text) text += inline.text + ' ';
              }
            }
          }
        }
      } catch { text = 'Text'; }
      const words = text.trim().split(/\s+/).slice(0, 2).join(' ') || 'Text';
      return { icon: <Type className={cls} />, label: words };
    }
    case 'geo': {
      const props = shape.props as any;
      let labelText = '';
      try {
        const content = props.richText?.content;
        if (Array.isArray(content)) {
          for (const nd of content) {
            if (nd.content && Array.isArray(nd.content)) {
              for (const inline of nd.content) {
                if (inline.text) labelText += inline.text + ' ';
              }
            }
          }
        }
      } catch { /* */ }
      const geo = props.geo || 'rectangle';
      const geoLabel = labelText.trim().split(/\s+/).slice(0, 2).join(' ');
      let icon: React.ReactNode;
      switch (geo) {
        case 'ellipse': icon = <Circle className={cls} />; break;
        case 'triangle': icon = <Triangle className={cls} />; break;
        case 'star': icon = <Star className={cls} />; break;
        default: icon = <Square className={cls} />;
      }
      return { icon, label: geoLabel || geo.charAt(0).toUpperCase() + geo.slice(1) };
    }
    case 'arrow': return { icon: <ArrowRight className={cls} />, label: 'Arrow' };
    case 'line': return { icon: <Minus className={cls} />, label: 'Line' };
    case 'draw': return { icon: <Pencil className={cls} />, label: 'Drawing' };
    case 'image': return { icon: <Image className={cls} />, label: 'Image' };
    default: return { icon: <Square className={cls} />, label: shape.type };
  }
}

export default function AnimationPanel({
  steps,
  onStepsChange,
  editor,
  rfSelectedNodeIds = [],
  rfSelectedEdgeIds = [],
  diagramData,
  onPickDestination,
}: AnimationPanelProps) {

  const addStep = () => {
    let selectedIds: string[] = [];

    // Get tldraw selection
    if (editor) {
      const tldrawIds = editor.getSelectedShapeIds() as string[];
      selectedIds.push(...tldrawIds);
    }

    // Only add RF selection if NO tldraw shapes are selected
    // This prevents stale RF selections from leaking into tldraw-only steps
    if (selectedIds.length === 0) {
      selectedIds.push(...rfSelectedNodeIds, ...rfSelectedEdgeIds);
    }

    if (selectedIds.length === 0) return;

    const newStep: AnimationStep = {
      id: `step-${Date.now()}`,
      shapeIds: selectedIds,
      animation: 'appear',
      duration: 800,
      label: `Step ${steps.length + 1}`,
      action: 'enter',
    };
    onStepsChange([...steps, newStep]);
  };

  const setExitShapes = (stepId: string) => {
    let selectedIds: string[] = [];
    if (editor) {
      const tldrawIds = editor.getSelectedShapeIds() as string[];
      selectedIds.push(...tldrawIds);
    }
    selectedIds.push(...rfSelectedNodeIds, ...rfSelectedEdgeIds);
    if (selectedIds.length === 0) return;

    onStepsChange(steps.map(s => s.id === stepId ? { ...s, exitShapeIds: selectedIds } : s));
  };

  const removeStep = (id: string) => {
    onStepsChange(steps.filter(s => s.id !== id));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    onStepsChange(newSteps);
  };

  const updateStep = (id: string, updates: Partial<AnimationStep>) => {
    onStepsChange(steps.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50">
        <span className="text-xs text-slate-400">{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
        <button
          onClick={addStep}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
          title="Select shapes or nodes, then click to add step"
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {steps.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-xs text-slate-500">No animation steps yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Select shapes or nodes on canvas, then click "Add".
            </p>
          </div>
        ) : (
          steps.map((step, index) => {
            const info = getShapeInfo(editor, step.shapeIds[0], diagramData);
            const extra = step.shapeIds.length > 1 ? ` (+${step.shapeIds.length - 1})` : '';
            const hasRfItems = step.shapeIds.some(id => !id.includes(':'));
            const action = step.action || 'enter';
            const needsTarget = action === 'move' || action === 'teleport';
            const hasTarget = !!step.targetPosition;

            return (
              <div
                key={step.id}
                className="rounded-lg border border-slate-700/50 p-3 bg-slate-800/30 transition-all"
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 w-5">{(index + 1).toString().padStart(2, '0')}</span>
                    <span className={hasRfItems ? 'text-blue-400' : 'text-slate-400'}>{info.icon}</span>
                    <span className="text-sm font-medium text-slate-200 truncate max-w-[100px]">{info.label}{extra}</span>
                    {hasRfItems && (
                      <span className="text-[9px] font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">RF</span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => moveStep(index, 'up')} disabled={index === 0} className="p-1 rounded hover:bg-slate-700/50 disabled:opacity-30">
                      <ChevronUp className="w-3 h-3 text-slate-400" />
                    </button>
                    <button onClick={() => moveStep(index, 'down')} disabled={index === steps.length - 1} className="p-1 rounded hover:bg-slate-700/50 disabled:opacity-30">
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>
                    <button onClick={() => removeStep(step.id)} className="p-1 rounded hover:bg-red-500/10">
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Controls row */}
                <div className="mt-2 pt-2 border-t border-slate-700/30 space-y-2">
                  {/* Action + Animation + Duration row */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={action}
                      onChange={(e) => updateStep(step.id, { action: e.target.value as StepAction })}
                      className="w-20 text-[10px] border border-slate-600/50 rounded-md px-1.5 py-1.5 bg-slate-800/50 text-slate-200"
                    >
                      {actionOptions.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                    {(action === 'enter' || action === 'exit') && (
                      <select
                        value={step.animation}
                        onChange={(e) => updateStep(step.id, { animation: e.target.value as AnimationType })}
                        className="flex-1 text-[10px] border border-slate-600/50 rounded-md px-1.5 py-1.5 bg-slate-800/50 text-slate-200"
                      >
                        {animationTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    )}
                    <input
                      type="number"
                      value={step.duration}
                      onChange={(e) => updateStep(step.id, { duration: Number(e.target.value) })}
                      className="w-14 text-[10px] border border-slate-600/50 rounded-md px-1.5 py-1.5 bg-slate-800/50 text-slate-200"
                      min={100}
                      step={100}
                      title="Duration (ms)"
                    />
                    <span className="text-[9px] text-slate-500">ms</span>
                  </div>

                  {/* Move/Teleport: target position picker */}
                  {needsTarget && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onPickDestination?.(step.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${hasTarget ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700/50 text-slate-300 border border-slate-600/30 hover:bg-slate-700'}`}
                      >
                        <Crosshair className="w-3 h-3" />
                        {hasTarget ? `Target: ${Math.round(step.targetPosition!.x)}, ${Math.round(step.targetPosition!.y)}` : 'Pick Destination'}
                      </button>
                    </div>
                  )}

                  {/* Swap: exit shapes selector */}
                  {action === 'swap' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Exit shapes:</span>
                        <button
                          onClick={() => setExitShapes(step.id)}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700/50 text-slate-300 border border-slate-600/30 hover:bg-slate-700"
                        >
                          {step.exitShapeIds?.length ? `${step.exitShapeIds.length} set — click to update` : 'Use current selection'}
                        </button>
                      </div>
                      {!step.exitShapeIds?.length && (
                        <p className="text-[9px] text-amber-400/70">Select shapes on canvas first, then click the button</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
