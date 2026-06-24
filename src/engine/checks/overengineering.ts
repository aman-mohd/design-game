import type { DesignGraph, Finding, Level, TrafficConfig } from '../../data/types';
import { hasType, nodesOfType } from '../../lib/graph';

/**
 * Cost-awareness: a great design is also *not* bigger than the problem.
 * This is what stops "throw every box at it" from scoring well.
 */
export function overengineeringChecks(
  graph: DesignGraph,
  traffic: TrafficConfig,
  level: Level,
): Finding[] {
  const findings: Finding[] = [];
  const placedCount = graph.nodes.filter((n) => !n.locked).length;

  // Far more components than the level's budget for the load at hand.
  if (graph.nodes.length > level.rubric.complexityBudget) {
    findings.push({
      id: 'cost-too-many',
      category: 'cost',
      severity: 'warn',
      nodeIds: [],
      title: 'This may be more machine than the job needs',
      why: `You have placed ${placedCount} components. For this workload that is a lot to operate, pay for, and debug. Complexity is a cost, not a score.`,
      hints: [
        'Could you remove a component and still meet every requirement?',
        'Match the architecture to the actual load — what is genuinely earning its keep?',
      ],
    });
  }

  // Heavyweight async/event infra on a tiny, low-traffic, non-bursty workload.
  const heavyAsync = hasType(graph, 'pubsub') || hasType(graph, 'message_queue');
  if (heavyAsync && traffic.rps < 5000 && !traffic.spike) {
    findings.push({
      id: 'cost-premature-async',
      category: 'cost',
      severity: 'info',
      nodeIds: [
        ...nodesOfType(graph, 'pubsub').map((n) => n.id),
        ...nodesOfType(graph, 'message_queue').map((n) => n.id),
      ],
      title: 'Queues before you need them',
      why: 'Message queues and pub/sub shine under spikes and decoupled, high-volume workloads. At this modest, steady traffic they add moving parts and operational burden for little gain.',
      hints: [
        'What problem is this queue solving at today’s traffic?',
        'Reach for async infrastructure when load or bursts actually demand it.',
      ],
    });
  }

  return findings;
}
