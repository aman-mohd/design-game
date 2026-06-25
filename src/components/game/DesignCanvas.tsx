import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type EdgeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X } from 'lucide-react';
import { useGame } from '../../store/gameStore';
import { ServiceNode, type ServiceNodeData } from './nodes/ServiceNode';
import type { Severity } from '../../data/types';

const nodeTypes = { service: ServiceNode };

function DeletableEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style }: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  const removeEdge = useGame((s) => s.removeEdge);
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  return (
    <>
      <BaseEdge path={edgePath} style={style} />
      {/* Wider transparent stroke to make hover easier to trigger */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: 'pointer' }}
      />
      <EdgeLabelRenderer>
        <button
          className="nodrag nopan absolute flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-400 shadow-sm transition-opacity hover:border-red-300 hover:bg-red-50 hover:text-red-500"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            opacity: hovered ? 1 : 0,
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            removeEdge(id);
          }}
        >
          <X className="h-3 w-3" />
        </button>
      </EdgeLabelRenderer>
    </>
  );
}

const edgeTypes = { deletable: DeletableEdge };

function CanvasInner() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const graph = useGame((s) => s.graph);
  const result = useGame((s) => s.result);
  const addNode = useGame((s) => s.addNode);
  const moveNode = useGame((s) => s.moveNode);
  const removeNode = useGame((s) => s.removeNode);
  const connect = useGame((s) => s.connect);
  const removeEdge = useGame((s) => s.removeEdge);

  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(new Set());

  // Map findings → highest severity per node, for highlighting.
  const bottleneckByNode = useMemo(() => {
    const map = new Map<string, Severity>();
    const rank = { critical: 0, warn: 1, info: 2 };
    for (const f of result?.findings ?? []) {
      for (const id of f.nodeIds) {
        const prev = map.get(id);
        if (!prev || rank[f.severity] < rank[prev]) map.set(id, f.severity);
      }
    }
    return map;
  }, [result]);

  const rfNodes: Node<ServiceNodeData>[] = useMemo(
    () =>
      graph.nodes.map((n) => ({
        id: n.id,
        type: 'service',
        position: { x: n.x, y: n.y },
        deletable: !n.locked,
        data: {
          type: n.type,
          label: n.label,
          locked: n.locked,
          bottleneck: bottleneckByNode.get(n.id) ?? null,
        },
      })),
    [graph.nodes, bottleneckByNode],
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      graph.edges.map((e) => {
        const onPath =
          bottleneckByNode.has(e.source) || bottleneckByNode.has(e.target);
        const isSelected = selectedEdgeIds.has(e.id);
        return {
          id: e.id,
          type: 'deletable',
          source: e.source,
          target: e.target,
          animated: true,
          selected: isSelected,
          style: {
            stroke: onPath ? '#FF4B4B' : isSelected ? '#F5A623' : '#1CB0F6',
            strokeWidth: onPath ? 4 : isSelected ? 4 : 3,
          },
        };
      }),
    [graph.edges, bottleneckByNode, selectedEdgeIds],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const c of changes) {
        if (c.type === 'position' && c.position) {
          moveNode(c.id, c.position.x, c.position.y);
        }
        if (c.type === 'remove') removeNode(c.id);
      }
    },
    [moveNode, removeNode],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const c of changes) {
        if (c.type === 'remove') {
          removeEdge(c.id);
          setSelectedEdgeIds((prev) => {
            const next = new Set(prev);
            next.delete(c.id);
            return next;
          });
        }
        if (c.type === 'select') {
          setSelectedEdgeIds((prev) => {
            const next = new Set(prev);
            if (c.selected) next.add(c.id);
            else next.delete(c.id);
            return next;
          });
        }
      }
    },
    [removeEdge],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (c.source && c.target) connect(c.source, c.target);
    },
    [connect],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/designquest-tool');
      if (!type) return;
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNode(type, pos.x - 60, pos.y - 40);
    },
    [screenToFlowPosition, addNode],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div ref={wrapperRef} className="h-full w-full" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
        className="bg-cloud"
      >
        <Background color="#dcdcdc" gap={22} size={2} />
        <Controls showInteractive={false} className="!rounded-2xl !border-2 !border-line !shadow-card" />
      </ReactFlow>
    </div>
  );
}

export function DesignCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
