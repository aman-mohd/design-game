import type { Level } from './types';

// Common pre-placed client node, locked so players keep the entry point.
const CLIENT = (x: number, y: number) => ({
  id: 'preset-client',
  type: 'client',
  label: 'Client',
  x,
  y,
  locked: true,
});

export const LEVELS: Level[] = [
  // ── Level 1 ────────────────────────────────────────────────────────────────
  {
    id: 1,
    slug: 'first-web-app',
    title: 'Your First Web App',
    subtitle: 'A tiny link shortener',
    brief:
      "Welcome, architect! Let's build a URL shortener. Users paste a long link and get a short one back — then everyone clicks those short links. Wire up where the data lives and how requests are served.",
    functionalRequirements: [
      { id: 'f1', kind: 'functional', text: 'Create a short link from a long URL' },
      { id: 'f2', kind: 'functional', text: 'Redirect a short link to its original URL' },
    ],
    nonFunctionalRequirements: [
      { id: 'n1', kind: 'nonfunctional', text: 'Links must survive a server restart (persistent storage)' },
      { id: 'n2', kind: 'nonfunctional', text: 'Reads (redirects) hugely outnumber writes' },
    ],
    prePlacedNodes: [
      CLIENT(80, 220),
      { id: 'preset-app', type: 'app_server', label: 'App Server', x: 360, y: 220, locked: true },
    ],
    prePlacedEdges: [{ id: 'pe1', source: 'preset-client', target: 'preset-app' }],
    availableToolIds: ['app_server', 'sql_db', 'nosql_db', 'cache', 'load_balancer'],
    trafficDefaults: {
      rps: 2000,
      regions: ['N. America'],
      consistency: 'balanced',
      readPercent: 95,
      spike: false,
      payloadKb: 1,
      latencySlaMs: 200,
      failureInjection: false,
    },
    rubric: {
      idealComponents: ['sql_db', 'cache'],
      weights: { correctness: 0.5, requirements: 0.3, efficiency: 0.2 },
      complexityBudget: 6,
    },
    references: [
      {
        label: 'ByteByteGo · Unique ID Generator & KV stores',
        url: 'https://github.com/ByteByteGoHq/system-design-101#unique-id-generator-in-distributed-systems',
      },
      {
        label: 'ByteByteGo · Top 5 Caching Strategies',
        url: 'https://github.com/ByteByteGoHq/system-design-101#top-caching-strategies',
      },
    ],
  },

  // ── Level 2 ────────────────────────────────────────────────────────────────
  {
    id: 2,
    slug: 'going-viral',
    title: 'Going Viral',
    subtitle: 'A social profile under a spike',
    brief:
      "Your app blew up overnight! A celebrity posted their profile and millions are loading it — photos and all — at the same moment. Keep it fast and standing while the crowd rushes in.",
    functionalRequirements: [
      { id: 'f1', kind: 'functional', text: 'Serve a user profile with posts and images' },
      { id: 'f2', kind: 'functional', text: 'Allow users to update their profile' },
    ],
    nonFunctionalRequirements: [
      { id: 'n1', kind: 'nonfunctional', text: 'Survive sudden traffic spikes (flash crowds)' },
      { id: 'n2', kind: 'nonfunctional', text: 'Serve large images quickly' },
      { id: 'n3', kind: 'nonfunctional', text: 'Stay available — no single point of failure' },
    ],
    prePlacedNodes: [
      CLIENT(80, 240),
      { id: 'preset-app', type: 'app_server', label: 'App Server', x: 420, y: 240, locked: true },
    ],
    prePlacedEdges: [{ id: 'pe1', source: 'preset-client', target: 'preset-app' }],
    availableToolIds: [
      'app_server',
      'load_balancer',
      'autoscaler',
      'cdn',
      'cache',
      'sql_db',
      'nosql_db',
      'read_replica',
      'object_storage',
    ],
    trafficDefaults: {
      rps: 50000,
      regions: ['N. America', 'Europe'],
      consistency: 'availability',
      readPercent: 90,
      spike: true,
      payloadKb: 800,
      latencySlaMs: 150,
      failureInjection: false,
    },
    rubric: {
      idealComponents: ['load_balancer', 'cache', 'cdn', 'object_storage', 'read_replica'],
      weights: { correctness: 0.5, requirements: 0.3, efficiency: 0.2 },
      complexityBudget: 10,
    },
    references: [
      {
        label: 'ByteByteGo · Twitter “For You” Timeline',
        url: 'https://github.com/ByteByteGoHq/system-design-101#how-does-twitter-recommend-for-you-timeline-in-15-seconds',
      },
      {
        label: 'ByteByteGo · Why CDNs are so popular',
        url: 'https://github.com/ByteByteGoHq/system-design-101#why-are-content-delivery-networks-cdn-so-popular',
      },
      {
        label: 'ByteByteGo · Scaling websites for millions',
        url: 'https://github.com/ByteByteGoHq/system-design-101#scaling-websites-for-millions-of-users',
      },
    ],
  },

  // ── Level 3 ────────────────────────────────────────────────────────────────
  {
    id: 3,
    slug: 'around-the-world',
    title: 'Around the World',
    subtitle: 'Global scale & a region outage',
    brief:
      "You're going global. Users on every continent expect snappy responses, and tonight one whole region's data center goes dark. Design for distance, for the CAP trade-off, and for survival when a region disappears.",
    functionalRequirements: [
      { id: 'f1', kind: 'functional', text: 'Serve users on every continent with low latency' },
      { id: 'f2', kind: 'functional', text: 'Accept reads and writes from any region' },
    ],
    nonFunctionalRequirements: [
      { id: 'n1', kind: 'nonfunctional', text: 'Meet a strict global latency target' },
      { id: 'n2', kind: 'nonfunctional', text: 'Survive an entire region going offline' },
      { id: 'n3', kind: 'nonfunctional', text: 'Make a deliberate consistency vs availability choice' },
    ],
    prePlacedNodes: [
      CLIENT(80, 260),
      { id: 'preset-dns', type: 'dns', label: 'GeoDNS', x: 320, y: 260, locked: true },
      { id: 'preset-app', type: 'app_server', label: 'App Server', x: 600, y: 260, locked: true },
    ],
    prePlacedEdges: [
      { id: 'pe1', source: 'preset-client', target: 'preset-dns' },
      { id: 'pe2', source: 'preset-dns', target: 'preset-app' },
    ],
    availableToolIds: [
      'app_server',
      'load_balancer',
      'autoscaler',
      'cdn',
      'api_gateway',
      'cache',
      'sql_db',
      'nosql_db',
      'read_replica',
      'object_storage',
      'message_queue',
    ],
    trafficDefaults: {
      rps: 200000,
      regions: ['N. America', 'Europe', 'Asia', 'S. America'],
      consistency: 'balanced',
      readPercent: 80,
      spike: true,
      payloadKb: 400,
      latencySlaMs: 100,
      failureInjection: true,
    },
    rubric: {
      idealComponents: ['cdn', 'load_balancer', 'cache', 'read_replica', 'nosql_db'],
      weights: { correctness: 0.5, requirements: 0.3, efficiency: 0.2 },
      complexityBudget: 14,
    },
    references: [
      {
        label: 'ByteByteGo · CAP Theorem',
        url: 'https://github.com/ByteByteGoHq/system-design-101#cap-theorem',
      },
      {
        label: 'ByteByteGo · How to Design for High Availability',
        url: 'https://github.com/ByteByteGoHq/system-design-101#how-to-design-for-high-availability',
      },
      {
        label: 'ByteByteGo · Read Replica Pattern',
        url: 'https://github.com/ByteByteGoHq/system-design-101#read-replica-pattern',
      },
    ],
  },
];

export const LEVEL_BY_ID: Record<number, Level> = Object.fromEntries(
  LEVELS.map((l) => [l.id, l]),
);

export function getLevel(id: number): Level | undefined {
  return LEVEL_BY_ID[id];
}
