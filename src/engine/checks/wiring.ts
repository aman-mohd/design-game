import type { DesignGraph, Finding, Level, TrafficConfig } from '../../data/types';
import {
  clientCanReachNode,
  hasAnyDataStore,
  hasType,
  nodesOfType,
  typeConnectsToType,
  DATA_STORE_TYPES,
} from '../../lib/graph';

/**
 * Edge-level sanity: catches genuinely broken wiring while accepting any valid
 * topology. It deliberately does NOT prefer one good pattern over another — for
 * caching, both cache-aside (app → cache *and* app → db) and read-through
 * (app → cache → db) are accepted. It only flags wiring that can't work.
 */
export function wiringChecks(
  graph: DesignGraph,
  _traffic: TrafficConfig,
  _level: Level,
): Finding[] {
  const findings: Finding[] = [];
  if (!hasAnyDataStore(graph)) return findings; // nothing to sit "behind".

  // A cache only helps if requests meet it *before* the data store. If a cache
  // is reachable from the client only by first passing through a data store
  // (e.g. app → db → cache), every read still pays full DB cost — the cache is
  // dead weight. Valid series and parallel placements both pass this check.
  const misplacedCaches = nodesOfType(graph, 'cache').filter((c) => {
    const reachable = clientCanReachNode(graph, c.id);
    const reachableInFrontOfStore = clientCanReachNode(graph, c.id, DATA_STORE_TYPES);
    return reachable && !reachableInFrontOfStore;
  });

  if (misplacedCaches.length > 0) {
    findings.push({
      id: 'wiring-cache-behind-store',
      category: 'data',
      severity: 'warn',
      nodeIds: misplacedCaches.map((n) => n.id),
      title: 'Your cache sits behind the database',
      why: 'On the read path, requests reach the data store before they ever reach this cache. Every read still pays the full database cost, so the cache adds expense without speeding anything up.',
      hints: [
        'Trace one read from the client — does it meet the cache before or after the database?',
        'A cache only earns its keep if it intercepts reads in front of the source of truth.',
        'Move the cache onto the read path before the database. Either pattern works: cache-aside (the app talks to the cache and the database) or read-through (app → cache → database).',
      ],
    });
  }

  // A CDN and an object store on the board, but never connected: media still
  // streams from the origin, so the CDN isn't actually serving the heavy files.
  if (
    hasType(graph, 'cdn') &&
    hasType(graph, 'object_storage') &&
    !typeConnectsToType(graph, 'cdn', 'object_storage')
  ) {
    findings.push({
      id: 'wiring-cdn-not-fronting-media',
      category: 'network',
      severity: 'warn',
      nodeIds: [
        ...nodesOfType(graph, 'cdn').map((n) => n.id),
        ...nodesOfType(graph, 'object_storage').map((n) => n.id),
      ],
      title: 'Your CDN isn’t fronting the media',
      why: 'You have a CDN and object storage, but they aren’t connected. Large files still flow through your origin/app tier instead of being served from the edge — distant users wait, and your servers burn bandwidth shovelling bytes.',
      hints: [
        'Trace how one image reaches a user — does it ever touch the CDN?',
        'A CDN delivers media fast only if it pulls from where that media lives.',
        'Connect the CDN to your object storage so the edge serves the heavy files directly.',
      ],
    });
  }

  return findings;
}
