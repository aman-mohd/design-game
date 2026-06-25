import {
  ReactFlow,
  Background,
  ReactFlowProvider,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ServiceNode, type ServiceNodeData } from './nodes/ServiceNode';
import type { SolutionGraph } from '../../data/types';

const nodeTypes = { service: ServiceNode };

/** A non-interactive React Flow diagram for displaying a reference design. */
export function StaticDiagram({ graph }: { graph: SolutionGraph }) {
  const nodes: Node<ServiceNodeData>[] = graph.nodes.map((n) => ({
    id: n.id,
    type: 'service',
    position: { x: n.x, y: n.y },
    draggable: false,
    selectable: false,
    connectable: false,
    data: { type: n.type, label: n.label, static: true, bottleneck: null },
  }));

  const edges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    animated: true,
    style: { stroke: '#58CC02', strokeWidth: 3 },
  }));

  return (
    <ReactFlowProvider>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll
        panOnDrag
        proOptions={{ hideAttribution: true }}
        className="bg-cloud"
      >
        <Background color="#dcdcdc" gap={22} size={2} />
      </ReactFlow>
    </ReactFlowProvider>
  );
}
