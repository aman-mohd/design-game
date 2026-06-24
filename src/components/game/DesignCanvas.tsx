import { useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useGame } from '../../store/gameStore';
import { ServiceNode, type ServiceNodeData } from './nodes/ServiceNode';
import type { Severity } from '../../data/types';

const nodeTypes = { service: ServiceNode };

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
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          animated: true,
          style: {
            stroke: onPath ? '#FF4B4B' : '#1CB0F6',
            strokeWidth: onPath ? 4 : 3,
          },
        };
      }),
    [graph.edges, bottleneckByNode],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // React Flow is a view; the store is the source of truth. Commit the
      // position/remove changes we care about (interim positions included so
      // dragging stays smooth).
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
        if (c.type === 'remove') removeEdge(c.id);
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
