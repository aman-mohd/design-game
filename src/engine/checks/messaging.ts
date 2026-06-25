import type { DesignGraph, Finding, Level, TrafficConfig } from '../../data/types';
import { hasType, nodesOfType, hasAnyDataStore } from '../../lib/graph';

const HIGH_RPS = 5000;

/** Absorbing write spikes with asynchronous buffering. */
export function messagingChecks(
  graph: DesignGraph,
  traffic: TrafficConfig,
  _level: Level,
): Finding[] {
  const findings: Finding[] = [];
  if (!hasAnyDataStore(graph)) return findings;

  const writePercent = 100 - traffic.readPercent;
  const writeHeavyEnough = writePercent >= 15;
  const hasQueue = hasType(graph, 'message_queue') || hasType(graph, 'pubsub');

  // Bursty, write-bearing traffic synchronously hitting the database.
  if (traffic.spike && traffic.rps >= HIGH_RPS && writeHeavyEnough && !hasQueue) {
    findings.push({
      id: 'msg-no-queue-spike',
      category: 'messaging',
      severity: 'warn',
      nodeIds: [
        ...nodesOfType(graph, 'sql_db').map((n) => n.id),
        ...nodesOfType(graph, 'nosql_db').map((n) => n.id),
      ],
      title: 'Write spikes hit the database head-on',
      why: 'During a burst, every write tries to commit synchronously and in real time. The database becomes the choke point and slow writes back up onto your servers.',
      hints: [
        'Does every write truly need to finish before you answer the user?',
        'How could you accept work instantly and process it at a steady pace?',
        'Buffer spiky or non-urgent writes through a queue and let workers drain it.',
      ],
    });
  }

  return findings;
}
