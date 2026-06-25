import type { DesignGraph, Finding, Level, TrafficConfig } from '../../data/types';
import { hasType, nodesOfType, hasAnyDataStore } from '../../lib/graph';

const HIGH_RPS = 5000;

/** Data-tier scaling: caching reads, replicas, and the CAP trade-off. */
export function dataChecks(
  graph: DesignGraph,
  traffic: TrafficConfig,
  _level: Level,
): Finding[] {
  const findings: Finding[] = [];
  if (!hasAnyDataStore(graph)) return findings; // topology check owns this case.

  const hasCache = hasType(graph, 'cache');
  const hasReplica = hasType(graph, 'read_replica');
  const dbNodes = [...nodesOfType(graph, 'sql_db'), ...nodesOfType(graph, 'nosql_db')];
  const readHeavy = traffic.readPercent >= 70;

  // Read-heavy + high traffic + no cache → every read hits the DB.
  if (readHeavy && traffic.rps >= HIGH_RPS && !hasCache && dbNodes.length > 0) {
    findings.push({
      id: 'data-no-cache',
      category: 'data',
      severity: 'critical',
      nodeIds: dbNodes.map((n) => n.id),
      title: 'The database is doing the same work over and over',
      why: `${traffic.readPercent}% of traffic is reads, yet every one hits the database directly. The same popular records are fetched millions of times, and the DB becomes the bottleneck.`,
      hints: [
        'Most reads ask for the same few hot items — must each one reach disk?',
        'Where could you keep hot results in memory so repeat reads are instant?',
        'Put a cache in front of the database for read-heavy paths.',
      ],
    });
  }

  // Read-heavy but only a single primary DB and no replica (cache may exist but
  // writes/cache-misses still funnel to one box).
  if (readHeavy && traffic.rps >= HIGH_RPS && dbNodes.length === 1 && !hasReplica) {
    findings.push({
      id: 'data-no-replica',
      category: 'data',
      severity: 'warn',
      nodeIds: dbNodes.map((n) => n.id),
      title: 'A single primary handles every query',
      why: 'Even with a cache, every cache-miss and write lands on one primary database. Under heavy read load that single node is a scaling ceiling and a failure risk.',
      hints: [
        'Reads and writes have very different shapes — should one node serve both at this scale?',
        'How can you fan reads out to copies of the data?',
        'Consider read replicas to share the read load off the primary.',
      ],
    });
  }

  // Strong consistency across regions → latency / availability cost.
  if (traffic.consistency === 'consistency' && traffic.regions.length > 1) {
    findings.push({
      id: 'data-cap-tradeoff',
      category: 'data',
      severity: 'info',
      nodeIds: dbNodes.map((n) => n.id),
      title: 'Strong consistency across regions has a price',
      why: 'Demanding strong consistency across multiple regions means writes must coordinate across continents before they commit. That adds latency, and during a network partition you must sacrifice availability (CAP).',
      hints: [
        'When a write must be agreed on across oceans, what happens to its latency?',
        'During a partition you can keep either consistency or availability — which does this app truly need?',
        'Decide deliberately: relax to eventual consistency where the product allows it.',
      ],
    });
  }

  return findings;
}
