import type { DesignGraph, Finding, Level, TrafficConfig } from '../../data/types';
import {
  hasAnyDataStore,
  nodesOfType,
  neighbors,
  orphanNodes,
  reachableFromClient,
  DATA_STORE_TYPES,
} from '../../lib/graph';

/**
 * Structural sanity of the design, independent of traffic volume:
 * persistence exists, nothing is wired insecurely, nothing dangles.
 */
export function topologyChecks(
  graph: DesignGraph,
  _traffic: TrafficConfig,
  _level: Level,
): Finding[] {
  const findings: Finding[] = [];

  // No persistent storage anywhere.
  if (!hasAnyDataStore(graph)) {
    findings.push({
      id: 'topo-no-datastore',
      category: 'data',
      severity: 'critical',
      nodeIds: nodesOfType(graph, 'app_server').map((n) => n.id),
      title: 'Nowhere to store data',
      why: 'Your servers can process requests, but there is no database or storage. Anything they compute vanishes the moment a process restarts.',
      hints: [
        'Where does state live when a server reboots?',
        'Requests that create data need a durable home — what component persists data?',
        'Add a data store and connect your app server to it.',
      ],
    });
  }

  // Client wired directly into a database — leaks the DB and couples tightly.
  const dbIds = new Set(
    DATA_STORE_TYPES.flatMap((t) => nodesOfType(graph, t).map((n) => n.id)),
  );
  const exposedDbs = nodesOfType(graph, 'client').flatMap((c) =>
    neighbors(graph, c.id).filter((nb) => dbIds.has(nb)),
  );
  if (exposedDbs.length > 0) {
    findings.push({
      id: 'topo-client-to-db',
      category: 'network',
      severity: 'critical',
      nodeIds: exposedDbs,
      title: 'Client talks straight to the database',
      why: 'A client connected directly to the database exposes credentials and your schema, and removes the layer that enforces validation, auth, and business rules.',
      hints: [
        'Should an untrusted client hold your database password?',
        'What sits between the outside world and your data to enforce rules?',
        'Route client traffic through your application tier instead of the database.',
      ],
    });
  }

  // App server present but cannot reach any data store.
  const hasApp = nodesOfType(graph, 'app_server').length > 0;
  const canReachStore = DATA_STORE_TYPES.some((t) => reachableFromClient(graph, t));
  if (hasApp && hasAnyDataStore(graph) && !canReachStore) {
    findings.push({
      id: 'topo-store-unreachable',
      category: 'data',
      severity: 'warn',
      nodeIds: DATA_STORE_TYPES.flatMap((t) => nodesOfType(graph, t).map((n) => n.id)),
      title: 'Data store is not wired in',
      why: 'You placed a data store, but there is no path from the client through your servers to reach it. It will never receive traffic.',
      hints: [
        'Follow the arrows from the client — do they ever arrive at the store?',
        'Connect your application tier to the data store.',
      ],
    });
  }

  // Orphan nodes (excluding the data-store-unreachable case above).
  const orphans = orphanNodes(graph).filter((n) => n.type !== 'client');
  if (orphans.length > 0) {
    findings.push({
      id: 'topo-orphans',
      category: 'cost',
      severity: 'warn',
      nodeIds: orphans.map((n) => n.id),
      title: 'Disconnected components',
      why: 'Some components are on the board but connected to nothing. They cost money and add confusion without serving traffic.',
      hints: [
        'Every box should be on a path that carries requests — which ones are stranded?',
        'Either wire these in or remove them.',
      ],
    });
  }

  return findings;
}
