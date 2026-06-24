import type { DesignGraph, Finding, Level, TrafficConfig } from '../../data/types';
import { countType, hasType, nodesOfType } from '../../lib/graph';

/**
 * Survival when something fails. Only fully engaged when the player turns on
 * failure injection (chaos) or asks for high availability via the CAP lean.
 */
export function resilienceChecks(
  graph: DesignGraph,
  traffic: TrafficConfig,
  _level: Level,
): Finding[] {
  const findings: Finding[] = [];
  if (!traffic.failureInjection) return findings;

  const appCount = countType(graph, 'app_server');
  const hasRedundantCompute = appCount > 1 || hasType(graph, 'autoscaler');

  // Single app server is a single point of failure under chaos.
  if (appCount >= 1 && !hasRedundantCompute) {
    findings.push({
      id: 'res-compute-spof',
      category: 'resilience',
      severity: 'critical',
      nodeIds: nodesOfType(graph, 'app_server').map((n) => n.id),
      title: 'One server down = everything down',
      why: 'With a single application server, killing it takes the whole system offline. There is no redundancy to absorb the loss.',
      hints: [
        'If this exact box died right now, what would your users see?',
        'How many of each critical component do you need so losing one is survivable?',
        'Run more than one instance behind a load balancer (or autoscaling).',
      ],
    });
  }

  // Single database with no replica → data-tier SPOF.
  const dbCount = countType(graph, 'sql_db') + countType(graph, 'nosql_db');
  const hasReplica = hasType(graph, 'read_replica');
  if (dbCount === 1 && !hasReplica) {
    findings.push({
      id: 'res-data-spof',
      category: 'resilience',
      severity: 'critical',
      nodeIds: [
        ...nodesOfType(graph, 'sql_db').map((n) => n.id),
        ...nodesOfType(graph, 'nosql_db').map((n) => n.id),
      ],
      title: 'Your data has no backup path',
      why: 'A single database with no replica is a single point of failure. If it goes down — or its region does — you lose both reads and writes, and possibly data.',
      hints: [
        'What happens to reads and writes the moment this one database disappears?',
        'How do you keep a current copy of the data ready to take over?',
        'Add replication so another node can serve if the primary fails.',
      ],
    });
  }

  // Multi-region traffic but everything lives in effectively one place.
  if (traffic.regions.length > 1 && !hasType(graph, 'cdn') && !hasType(graph, 'dns')) {
    findings.push({
      id: 'res-single-region',
      category: 'resilience',
      severity: 'warn',
      nodeIds: nodesOfType(graph, 'app_server').map((n) => n.id),
      title: 'A region outage takes you fully offline',
      why: 'Traffic is global, but there is no geographic routing or edge presence. If the region hosting your stack fails, every user everywhere is affected.',
      hints: [
        'All your eggs are in one geographic basket — what if that basket drops?',
        'How would you route users away from a failed region?',
        'Spread presence across regions and route with GeoDNS / edge.',
      ],
    });
  }

  return findings;
}
