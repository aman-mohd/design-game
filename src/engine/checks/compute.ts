import type { DesignGraph, Finding, Level, TrafficConfig } from '../../data/types';
import { countType, hasType, nodesOfType } from '../../lib/graph';

const HIGH_RPS = 5000;

/** Compute-tier capacity: load balancing, horizontal scale, autoscaling. */
export function computeChecks(
  graph: DesignGraph,
  traffic: TrafficConfig,
  _level: Level,
): Finding[] {
  const findings: Finding[] = [];
  const appCount = countType(graph, 'app_server');
  const hasLb = hasType(graph, 'load_balancer');

  // High traffic but a single server and no way to add more.
  if (traffic.rps >= HIGH_RPS && appCount <= 1 && !hasLb) {
    findings.push({
      id: 'compute-single-server',
      category: 'compute',
      severity: 'critical',
      nodeIds: nodesOfType(graph, 'app_server').map((n) => n.id),
      title: 'One server, way too much traffic',
      why: `At ~${traffic.rps.toLocaleString()} requests/sec a single application server saturates its CPU and connection pool. Latency spikes and requests start failing.`,
      hints: [
        'One machine has a ceiling — what do you do when one is not enough?',
        'How would traffic be shared if you had several identical servers?',
        'Introduce horizontal scaling fronted by something that distributes load.',
      ],
    });
  }

  // Multiple servers but nothing distributes traffic to them.
  if (appCount > 1 && !hasLb) {
    findings.push({
      id: 'compute-no-lb',
      category: 'network',
      severity: 'warn',
      nodeIds: nodesOfType(graph, 'app_server').map((n) => n.id),
      title: 'Several servers, but who picks one?',
      why: 'You have multiple app servers, but without a load balancer the client has no consistent way to spread requests across them — most will pile onto one.',
      hints: [
        'How does a request decide which of your identical servers to hit?',
        'Add a component whose whole job is to distribute traffic.',
      ],
    });
  }

  // Bursty traffic with no elasticity.
  if (traffic.spike && !hasType(graph, 'autoscaler') && traffic.rps >= HIGH_RPS) {
    findings.push({
      id: 'compute-no-autoscale',
      category: 'compute',
      severity: 'warn',
      nodeIds: nodesOfType(graph, 'app_server').map((n) => n.id),
      title: 'Spikes will catch you flat-footed',
      why: 'Traffic is bursty, but your fleet is a fixed size. Provision for the peak and you waste money at idle; provision for the average and you fall over during a spike.',
      hints: [
        'Demand here is not constant — should your capacity be?',
        'What lets your server count grow and shrink with load automatically?',
      ],
    });
  }

  return findings;
}
