import type { DesignGraph, Finding, Level, TrafficConfig } from '../../data/types';
import { hasType, nodesOfType } from '../../lib/graph';

/**
 * Domain-specific checks that only switch on for levels carrying the matching
 * `tag`. This keeps generic levels untouched while letting a level teach a
 * lesson unique to its problem (rate limiting, search, fan-out, transcoding).
 */
export function domainChecks(
  graph: DesignGraph,
  _traffic: TrafficConfig,
  level: Level,
): Finding[] {
  const tags = level.tags ?? [];
  if (tags.length === 0) return [];

  const findings: Finding[] = [];
  const appIds = nodesOfType(graph, 'app_server').map((n) => n.id);
  const hasQueue = hasType(graph, 'message_queue') || hasType(graph, 'pubsub');

  // ── Rate limiting: a public API needs a front door. ──
  if (tags.includes('gateway') && !hasType(graph, 'api_gateway')) {
    findings.push({
      id: 'api-no-gateway',
      category: 'network',
      severity: 'critical',
      nodeIds: appIds,
      title: 'No front door for your API',
      why: 'Clients hit your app servers directly, so nothing authenticates callers or stops one abusive client from flooding you. A single botnet can starve the whole API.',
      hints: [
        'What stops one misbehaving client from sending a million requests a second?',
        'Where would you centralise auth, routing and rate limiting — before traffic reaches your servers?',
        'Put an API gateway in front to authenticate and rate-limit at the edge.',
      ],
    });
  }

  // ── Search: scanning a primary store for text is the wrong tool. ──
  if (tags.includes('search') && !hasType(graph, 'search_index')) {
    findings.push({
      id: 'search-no-index',
      category: 'data',
      severity: 'critical',
      nodeIds: appIds,
      title: 'Searching by scanning the whole database',
      why: 'Prefix and full-text search over a primary database scans huge numbers of rows per query. At autocomplete speeds that melts the database and blows your latency target.',
      hints: [
        'Is a row-by-row database scan the right tool for "find everything matching these letters"?',
        'What data structure is purpose-built for fast text and prefix lookups?',
        'Add a search index (e.g. Elasticsearch) and serve queries from it.',
      ],
    });
  }

  // ── Fan-out: deliver to many recipients asynchronously, with consumers. ──
  if (tags.includes('fanout')) {
    if (!hasQueue) {
      findings.push({
        id: 'fanout-no-queue',
        category: 'messaging',
        severity: 'critical',
        nodeIds: appIds,
        title: 'Fanning out notifications synchronously',
        why: 'Sending to millions of devices inside the request means the caller waits on every downstream push. One slow provider stalls everything, and a burst overwhelms the app tier.',
        hints: [
          'Must the user wait while you contact millions of devices one by one?',
          'How could you accept the request instantly and do the delivery work separately?',
          'Decouple with a queue: enqueue the job, return immediately, deliver asynchronously.',
        ],
      });
    } else if (!hasType(graph, 'worker')) {
      findings.push({
        id: 'fanout-no-workers',
        category: 'compute',
        severity: 'warn',
        nodeIds: [
          ...nodesOfType(graph, 'message_queue').map((n) => n.id),
          ...nodesOfType(graph, 'pubsub').map((n) => n.id),
        ],
        title: 'A queue with nothing draining it',
        why: 'You buffer notifications onto a queue, but no workers consume it. The backlog just grows — messages are accepted but never delivered.',
        hints: [
          'Who actually pulls jobs off this queue and does the sending?',
          'Add worker processes that consume the queue and deliver in the background.',
        ],
      });
    }
  }

  // ── Transcode: slow, CPU-heavy work belongs off the request path. ──
  if (tags.includes('transcode') && !hasType(graph, 'worker')) {
    findings.push({
      id: 'transcode-on-request-path',
      category: 'compute',
      severity: 'warn',
      nodeIds: appIds,
      title: 'Transcoding on the upload request',
      why: 'Re-encoding a video into multiple resolutions takes minutes of CPU. Doing it inside the upload request ties up an app server per upload and times the user out.',
      hints: [
        'Should the user’s upload request stay open for the minutes it takes to transcode?',
        'Where should slow, CPU-heavy work happen instead of on the request path?',
        'Hand transcoding to background workers (usually fed by a queue).',
      ],
    });
  }

  return findings;
}
