/**
 * Custom React Flow edge types — ported from line-canvas.
 * 8 edge styles: solid, marching, flow, pulse, electric, packet, stream, dashdot.
 * CSS animations live in diagramStyles.css.
 */

import React from 'react';
import {
  BaseEdge,
  getBezierPath,
  getStraightPath,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';

// ─── Path helpers ────────────────────────────────────────────────────────────

interface PathParams {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: EdgeProps['sourcePosition'];
  targetPosition: EdgeProps['targetPosition'];
}

function computePath(pathType: string, params: PathParams): string {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = params;
  switch (pathType) {
    case 'straight':
      return getStraightPath({ sourceX, sourceY, targetX, targetY })[0];
    case 'step':
      return getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 0 })[0];
    case 'smoothstep':
      return getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })[0];
    default: // bezier
      return getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })[0];
  }
}

// ─── 1. Solid Edge ───────────────────────────────────────────────────────────

export function SolidEdge(props: EdgeProps) {
  const { data, style, markerEnd, markerStart } = props;
  const path = computePath((data?.pathType as string) || 'bezier', props as unknown as PathParams);
  return (
    <g className="rf-edge-solid">
      <BaseEdge path={path} style={style} markerEnd={markerEnd} markerStart={markerStart} />
    </g>
  );
}

// ─── 2. Marching Ants Edge ───────────────────────────────────────────────────

export function MarchingEdge(props: EdgeProps) {
  const { data, style, markerEnd, markerStart } = props;
  const path = computePath((data?.pathType as string) || 'bezier', props as unknown as PathParams);
  return (
    <g className="rf-edge-marching">
      <BaseEdge path={path} style={style} markerEnd={markerEnd} markerStart={markerStart} />
    </g>
  );
}

// ─── 3. Flow Edge ────────────────────────────────────────────────────────────

export function FlowEdge(props: EdgeProps) {
  const { data, style, markerEnd, markerStart } = props;
  const path = computePath((data?.pathType as string) || 'bezier', props as unknown as PathParams);
  return (
    <g className="rf-edge-flow">
      <BaseEdge path={path} style={style} markerEnd={markerEnd} markerStart={markerStart} />
    </g>
  );
}

// ─── 4. Pulse Glow Edge ─────────────────────────────────────────────────────

export function PulseEdge(props: EdgeProps) {
  const { data, style, markerEnd, markerStart } = props;
  const path = computePath((data?.pathType as string) || 'bezier', props as unknown as PathParams);
  return (
    <g className="rf-edge-pulse">
      <BaseEdge path={path} style={style} markerEnd={markerEnd} markerStart={markerStart} />
    </g>
  );
}

// ─── 5. Electric Edge ────────────────────────────────────────────────────────

export function ElectricEdge(props: EdgeProps) {
  const { data, style, markerEnd, markerStart } = props;
  const path = computePath((data?.pathType as string) || 'bezier', props as unknown as PathParams);
  return (
    <g className="rf-edge-electric">
      <BaseEdge path={path} style={style} markerEnd={markerEnd} markerStart={markerStart} />
    </g>
  );
}

// ─── 6. Packet Edge ──────────────────────────────────────────────────────────

export function PacketEdge(props: EdgeProps) {
  const { data, style, markerEnd, markerStart } = props;
  const color = style?.stroke || '#58a6ff';
  const path = computePath((data?.pathType as string) || 'bezier', props as unknown as PathParams);
  const speed = (data?.speed as number) || 2;

  return (
    <g>
      <BaseEdge
        path={path}
        style={{ ...style, strokeOpacity: 0.3 }}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
      <circle r="4" fill={color as string}>
        <animateMotion dur={`${speed}s`} repeatCount="indefinite" path={path} />
      </circle>
      <circle r="7" fill={color as string} opacity="0.3">
        <animateMotion dur={`${speed}s`} repeatCount="indefinite" path={path} />
      </circle>
    </g>
  );
}

// ─── 7. Multi-Packet / Stream Edge ───────────────────────────────────────────

export function StreamEdge(props: EdgeProps) {
  const { data, style, markerEnd, markerStart } = props;
  const color = style?.stroke || '#58a6ff';
  const path = computePath((data?.pathType as string) || 'bezier', props as unknown as PathParams);
  const speed = (data?.speed as number) || 3;

  return (
    <g>
      <BaseEdge
        path={path}
        style={{ ...style, strokeOpacity: 0.25 }}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
      {[0, 0.33, 0.66].map((offset, i) => (
        <React.Fragment key={i}>
          <circle r="3" fill={color as string}>
            <animateMotion
              dur={`${speed}s`}
              repeatCount="indefinite"
              path={path}
              begin={`${offset * speed}s`}
            />
          </circle>
          <circle r="6" fill={color as string} opacity="0.2">
            <animateMotion
              dur={`${speed}s`}
              repeatCount="indefinite"
              path={path}
              begin={`${offset * speed}s`}
            />
          </circle>
        </React.Fragment>
      ))}
    </g>
  );
}

// ─── 8. Dash Dot Edge ────────────────────────────────────────────────────────

export function DashDotEdge(props: EdgeProps) {
  const { data, style, markerEnd, markerStart } = props;
  const path = computePath((data?.pathType as string) || 'bezier', props as unknown as PathParams);
  return (
    <BaseEdge
      path={path}
      style={{ ...style, strokeDasharray: '10 4 3 4' }}
      markerEnd={markerEnd}
      markerStart={markerStart}
    />
  );
}

// ─── Edge types registry ─────────────────────────────────────────────────────

export const edgeTypes = {
  solid: SolidEdge,
  marching: MarchingEdge,
  flow: FlowEdge,
  pulse: PulseEdge,
  electric: ElectricEdge,
  packet: PacketEdge,
  stream: StreamEdge,
  dashdot: DashDotEdge,
};
