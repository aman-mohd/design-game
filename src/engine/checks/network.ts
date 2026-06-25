import type { DesignGraph, Finding, Level, TrafficConfig } from '../../data/types';
import { hasType, nodesOfType } from '../../lib/graph';

const LARGE_PAYLOAD_KB = 100;

/** Edge delivery: CDNs for global/large content, a gateway for the front door. */
export function networkChecks(
  graph: DesignGraph,
  traffic: TrafficConfig,
  _level: Level,
): Finding[] {
  const findings: Finding[] = [];
  const hasCdn = hasType(graph, 'cdn');
  const global = traffic.regions.length > 1;
  const appNodes = nodesOfType(graph, 'app_server');

  // Global users with no edge caching → far users pay full round-trip latency.
  if (global && !hasCdn) {
    findings.push({
      id: 'net-no-cdn-global',
      category: 'network',
      severity: traffic.latencySlaMs <= 150 ? 'critical' : 'warn',
      nodeIds: appNodes.map((n) => n.id),
      title: 'Distant users are paying for the distance',
      why: `Traffic comes from ${traffic.regions.length} regions, but every request travels all the way to your origin. Users far from it blow past your ${traffic.latencySlaMs}ms target on the network round-trip alone.`,
      hints: [
        'The speed of light is fixed — what can you do about how far the data must travel?',
        'Where could you serve content from a location near each user?',
        'Add a CDN / edge layer to cut round-trip distance for static and cacheable content.',
      ],
    });
  }

  // Large media payloads with no CDN or object storage → origin chokes on bytes.
  const hasObjectStore = hasType(graph, 'object_storage');
  if (traffic.payloadKb >= LARGE_PAYLOAD_KB && !hasCdn && !hasObjectStore) {
    findings.push({
      id: 'net-large-payload',
      category: 'network',
      severity: 'warn',
      nodeIds: appNodes.map((n) => n.id),
      title: 'Your app servers are shipping heavy files',
      why: `Average payloads are ~${traffic.payloadKb}KB. Pushing large media through your application tier wastes its CPU and bandwidth on byte-shoveling instead of logic.`,
      hints: [
        'Should the same servers that run logic also stream big images and video?',
        'Where do large blobs belong, and who is best at delivering them close to users?',
        'Offload media to object storage fronted by a CDN.',
      ],
    });
  }

  return findings;
}
