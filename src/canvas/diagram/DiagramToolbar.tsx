/**
 * DiagramToolbar — compact toolbar for React Flow edge/path/arrow/color controls.
 * Styled to match tech-notes slate-800 canvas toolbar.
 * Only visible when canvas is unlocked and diagram mode is active.
 */

import { ArrowLeftRight } from 'lucide-react';
import {
  EDGE_GROUPS,
  PATH_CATALOG,
  ARROW_CATALOG,
  COLORS,
  EDGE_CATALOG,
} from './diagramTypes';

interface DiagramToolbarProps {
  edgeType: string;
  pathType: string;
  arrowType: string;
  color: string;
  onEdgeTypeChange: (v: string) => void;
  onPathTypeChange: (v: string) => void;
  onArrowTypeChange: (v: string) => void;
  onColorChange: (v: string) => void;
  hasEdgeSelection: boolean;
  onFlip: () => void;
}

export default function DiagramToolbar({
  edgeType,
  pathType,
  arrowType,
  color,
  onEdgeTypeChange,
  onPathTypeChange,
  onArrowTypeChange,
  onColorChange,
  hasEdgeSelection,
  onFlip,
}: DiagramToolbarProps) {
  const currentEdge = EDGE_CATALOG.find(e => e.id === edgeType);
  const currentPath = PATH_CATALOG.find(p => p.id === pathType);
  const currentArrow = ARROW_CATALOG.find(a => a.id === arrowType);

  return (
    <div className={`rf-toolbar ${hasEdgeSelection ? 'rf-toolbar-editing' : ''}`}>
      {/* Summary row */}
      <div className="rf-toolbar-summary">
        {hasEdgeSelection ? (
          <span className="rf-summary-mode rf-editing">Editing selected edges</span>
        ) : (
          <>
            <span className="rf-summary-mode rf-default">Next connection</span>
            <span className="rf-summary-chip" style={{ borderColor: color }}>
              <span className="rf-summary-dot" style={{ background: color }} />
              {currentEdge?.label} &middot; {currentPath?.label} &middot; {currentArrow?.label}
            </span>
          </>
        )}
      </div>

      {/* Controls row */}
      <div className="rf-toolbar-sections">
        {/* Edge Type */}
        <div className="rf-toolbar-card">
          <div className="rf-toolbar-card-title">Edge Type</div>
          <div className="rf-toolbar-card-body">
            {EDGE_GROUPS.map(({ group, items }) => (
              <div key={group} className="rf-toolbar-subgroup">
                <span className="rf-toolbar-subgroup-label">{group}</span>
                <div className="rf-toolbar-subgroup-btns">
                  {items.map(e => (
                    <button
                      key={e.id}
                      className={`rf-tool-btn${edgeType === e.id ? ' rf-active' : ''}`}
                      onClick={() => onEdgeTypeChange(e.id)}
                      title={e.desc}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Path Shape */}
        <div className="rf-toolbar-card">
          <div className="rf-toolbar-card-title">Path Shape</div>
          <div className="rf-toolbar-card-body">
            <div className="rf-toolbar-subgroup-btns">
              {PATH_CATALOG.map(p => (
                <button
                  key={p.id}
                  className={`rf-tool-btn${pathType === p.id ? ' rf-active' : ''}`}
                  onClick={() => onPathTypeChange(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="rf-toolbar-card">
          <div className="rf-toolbar-card-title">Arrow</div>
          <div className="rf-toolbar-card-body">
            <div className="rf-toolbar-subgroup-btns">
              {ARROW_CATALOG.map(a => (
                <button
                  key={a.id}
                  className={`rf-tool-btn${arrowType === a.id ? ' rf-active' : ''}`}
                  onClick={() => onArrowTypeChange(a.id)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Color */}
        <div className="rf-toolbar-card">
          <div className="rf-toolbar-card-title">Color</div>
          <div className="rf-toolbar-card-body">
            <div className="rf-toolbar-colors">
              {COLORS.map(c => (
                <div
                  key={c.id}
                  className={`rf-color-dot${color === c.id ? ' rf-active' : ''}`}
                  style={{ background: c.id }}
                  onClick={() => onColorChange(c.id)}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Flip Direction */}
        <div className="rf-toolbar-card">
          <div className="rf-toolbar-card-title">Direction</div>
          <div className="rf-toolbar-card-body">
            <button
              className={`rf-tool-btn rf-flip-btn${!hasEdgeSelection ? ' rf-disabled' : ''}`}
              onClick={onFlip}
              disabled={!hasEdgeSelection}
              title={hasEdgeSelection ? 'Flip direction of selected edges' : 'Select an edge first'}
            >
              <ArrowLeftRight className="w-3 h-3 inline mr-1" />
              Flip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
