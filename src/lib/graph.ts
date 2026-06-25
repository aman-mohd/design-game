import type { DesignGraph, DesignNode } from '../data/types';

/** All nodes of a given tool type. */
export function nodesOfType(graph: DesignGraph, type: string): DesignNode[] {
  return graph.nodes.filter((n) => n.type === type);
}

export function hasType(graph: DesignGraph, type: string): boolean {
  return graph.nodes.some((n) => n.type === type);
}

export function countType(graph: DesignGraph, type: string): number {
  return nodesOfType(graph, type).length;
}

/** Node ids directly reachable from `id` (following edge direction). */
export function neighborsOut(graph: DesignGraph, id: string): string[] {
  return graph.edges.filter((e) => e.source === id).map((e) => e.target);
}

export function neighborsIn(graph: DesignGraph, id: string): string[] {
  return graph.edges.filter((e) => e.target === id).map((e) => e.source);
}

/** Undirected adjacency — useful for connectivity checks. */
export function neighbors(graph: DesignGraph, id: string): string[] {
  return [...neighborsOut(graph, id), ...neighborsIn(graph, id)];
}

/** Is there an edge between a and b in either direction? */
export function isConnected(graph: DesignGraph, a: string, b: string): boolean {
  return graph.edges.some(
    (e) =>
      (e.source === a && e.target === b) || (e.source === b && e.target === a),
  );
}

/** Does any node of type `fromType` connect to any node of type `toType`? */
export function typeConnectsToType(
  graph: DesignGraph,
  fromType: string,
  toType: string,
): boolean {
  const targets = new Set(nodesOfType(graph, toType).map((n) => n.id));
  return nodesOfType(graph, fromType).some((n) =>
    neighbors(graph, n.id).some((nb) => targets.has(nb)),
  );
}

/** Nodes with no edges at all. */
export function orphanNodes(graph: DesignGraph): DesignNode[] {
  return graph.nodes.filter((n) => neighbors(graph, n.id).length === 0);
}

/** Is target type reachable from any client node (directed BFS)? */
export function reachableFromClient(graph: DesignGraph, targetType: string): boolean {
  const clients = nodesOfType(graph, 'client').map((n) => n.id);
  if (clients.length === 0) return false;
  const targets = new Set(nodesOfType(graph, targetType).map((n) => n.id));
  if (targets.size === 0) return false;

  const seen = new Set<string>(clients);
  const queue = [...clients];
  while (queue.length) {
    const cur = queue.shift()!;
    if (targets.has(cur)) return true;
    for (const nb of neighborsOut(graph, cur)) {
      if (!seen.has(nb)) {
        seen.add(nb);
        queue.push(nb);
      }
    }
  }
  return false;
}

/**
 * Directed reachability from any client to a specific node. If
 * `avoidThroughTypes` is given, traversal does not continue *through* nodes of
 * those types (it may still land on the target itself). Useful for asking
 * "can a request reach this node before passing through a data store?".
 */
export function clientCanReachNode(
  graph: DesignGraph,
  targetId: string,
  avoidThroughTypes: string[] = [],
): boolean {
  const clients = nodesOfType(graph, 'client').map((n) => n.id);
  if (clients.length === 0) return false;
  const avoid = new Set(avoidThroughTypes);
  const typeOf = new Map(graph.nodes.map((n) => [n.id, n.type]));

  const seen = new Set<string>(clients);
  const queue = [...clients];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === targetId) return true;
    // Don't expand outward through an avoided node (e.g. a data store).
    if (avoid.has(typeOf.get(cur) ?? '')) continue;
    for (const nb of neighborsOut(graph, cur)) {
      if (!seen.has(nb)) {
        seen.add(nb);
        queue.push(nb);
      }
    }
  }
  return false;
}

/** Any data store present (the place persistent state lives). */
export const DATA_STORE_TYPES = ['sql_db', 'nosql_db', 'object_storage'];

export function hasAnyDataStore(graph: DesignGraph): boolean {
  return DATA_STORE_TYPES.some((t) => hasType(graph, t));
}
