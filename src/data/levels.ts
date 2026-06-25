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
    // A URL shortener has tiny payloads and is single-region for the intro.
    // Spike (needs autoscaling) and chaos (needs replicas) are taught later.
    trafficConstraints: {
      payloadMaxKb: 16,
      singleRegion: true,
      allowSpike: false,
      allowChaos: false,
    },
    cap: {
      recommended: 'availability',
      summary:
        'A URL shortener is overwhelmingly read-heavy and its data barely changes. Users care that redirects always work — not that a brand-new link appears on every server within milliseconds. So it leans AP: favour availability and accept eventual consistency.',
      consistencyPath:
        'If you needed strong consistency — say, guaranteeing a custom alias is globally unique the instant it is claimed — you would funnel writes through a single primary that validates uniqueness. The cost: higher write latency and a system that must reject writes (become unavailable) during a network partition.',
      availabilityPath:
        'Leaning AP (recommended here): replicate widely and cache reads hard. A new mapping can take a moment to propagate, and that is fine. Redirects stay fast and always-on even if a replica is briefly stale or a node drops.',
    },
    bestSolution: {
      nodes: [
        { id: 'sol-client', type: 'client', label: 'Client', x: 40, y: 180 },
        { id: 'sol-lb', type: 'load_balancer', label: 'Load Balancer', x: 260, y: 180 },
        { id: 'sol-app', type: 'app_server', label: 'App Server', x: 480, y: 180 },
        { id: 'sol-cache', type: 'cache', label: 'Cache', x: 700, y: 90 },
        { id: 'sol-db', type: 'sql_db', label: 'SQL Database', x: 700, y: 280 },
      ],
      edges: [
        { id: 'se1', source: 'sol-client', target: 'sol-lb' },
        { id: 'se2', source: 'sol-lb', target: 'sol-app' },
        { id: 'se3', source: 'sol-app', target: 'sol-cache' },
        { id: 'se4', source: 'sol-app', target: 'sol-db' },
      ],
      rationale:
        'Reads (redirects) dominate, so a cache absorbs the hot links while a durable database stays the source of truth. A load balancer lets you add app servers as traffic grows — simple, and nothing the workload doesn’t need.',
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
    // Toolbox covers CDN, object storage, autoscaling and replicas, so the full
    // payload/region/spike/chaos space is resolvable here.
    trafficConstraints: {
      payloadMaxKb: 2000,
      allowSpike: true,
      allowChaos: true,
    },
    cap: {
      recommended: 'availability',
      summary:
        'A social feed must never go dark during a traffic spike. A like count or a just-posted photo being a few seconds stale is harmless. So it leans AP — stay up, serve fast, and let data catch up.',
      consistencyPath:
        'Reserve strong consistency for the few flows that truly need it (e.g. "did my DM actually send?"). For those, route through a primary and accept slower writes plus reduced availability during partitions — but do not impose that cost on the whole feed.',
      availabilityPath:
        'Leaning AP (recommended): serve from caches, CDN and read replicas, and tolerate brief staleness. Eventual consistency keeps the celebrity profile fast and online for millions even as one node or region wobbles.',
    },
    bestSolution: {
      nodes: [
        { id: 'sol-client', type: 'client', label: 'Client', x: 20, y: 220 },
        { id: 'sol-cdn', type: 'cdn', label: 'CDN', x: 200, y: 80 },
        { id: 'sol-obj', type: 'object_storage', label: 'Object Storage', x: 200, y: 360 },
        { id: 'sol-lb', type: 'load_balancer', label: 'Load Balancer', x: 360, y: 220 },
        { id: 'sol-auto', type: 'autoscaler', label: 'Auto-Scaling', x: 540, y: 70 },
        { id: 'sol-app', type: 'app_server', label: 'App Server', x: 540, y: 220 },
        { id: 'sol-cache', type: 'cache', label: 'Cache', x: 740, y: 120 },
        { id: 'sol-db', type: 'sql_db', label: 'SQL Database', x: 740, y: 320 },
        { id: 'sol-replica', type: 'read_replica', label: 'Read Replica', x: 940, y: 320 },
      ],
      edges: [
        { id: 'se1', source: 'sol-client', target: 'sol-cdn' },
        { id: 'se2', source: 'sol-cdn', target: 'sol-obj' },
        { id: 'se3', source: 'sol-client', target: 'sol-lb' },
        { id: 'se4', source: 'sol-lb', target: 'sol-app' },
        { id: 'se5', source: 'sol-app', target: 'sol-auto' },
        { id: 'se6', source: 'sol-app', target: 'sol-cache' },
        { id: 'se7', source: 'sol-app', target: 'sol-db' },
        { id: 'se8', source: 'sol-app', target: 'sol-obj' },
        { id: 'se9', source: 'sol-db', target: 'sol-replica' },
      ],
      rationale:
        'A CDN backed by object storage serves heavy images close to users, off the app servers. A load balancer with autoscaling rides out the spike, a cache absorbs the read burst on the celebrity profile, and a read replica scales reads off the primary so writes still land cleanly.',
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
    // Global-scale level: full range, multi-region, spike and chaos all in play.
    // The toolbox (CDN, replicas, queue, object storage) covers every remedy.
    trafficConstraints: {
      payloadMaxKb: 2000,
      allowSpike: true,
      allowChaos: true,
    },
    cap: {
      recommended: 'balanced',
      summary:
        'Going global forces the CAP question to the front: when a region is partitioned from the others, you must choose. The catch is that different data wants different answers — the skill here is deciding deliberately per data type rather than picking one global setting.',
      consistencyPath:
        'For data that must be correct everywhere — account balances, inventory, unique handles — pick CP: synchronous cross-region replication or a consensus store. Expect higher write latency, and accept that a partitioned region may have to reject writes to avoid divergence.',
      availabilityPath:
        'For data that tolerates lag — profiles, posts, view counts — pick AP: asynchronous replication with conflict resolution (CRDTs or last-write-wins) and local reads. It stays fast and available worldwide, converging once the partition heals.',
    },
    bestSolution: {
      nodes: [
        { id: 'sol-client', type: 'client', label: 'Client', x: 20, y: 220 },
        { id: 'sol-dns', type: 'dns', label: 'GeoDNS', x: 190, y: 220 },
        { id: 'sol-cdn', type: 'cdn', label: 'CDN', x: 360, y: 90 },
        { id: 'sol-lb', type: 'load_balancer', label: 'Load Balancer', x: 360, y: 320 },
        { id: 'sol-auto', type: 'autoscaler', label: 'Auto-Scaling', x: 560, y: 70 },
        { id: 'sol-app', type: 'app_server', label: 'App Server', x: 560, y: 220 },
        { id: 'sol-cache', type: 'cache', label: 'Cache', x: 760, y: 110 },
        { id: 'sol-queue', type: 'message_queue', label: 'Message Queue', x: 560, y: 390 },
        { id: 'sol-db', type: 'nosql_db', label: 'NoSQL Database', x: 760, y: 320 },
        { id: 'sol-replica', type: 'read_replica', label: 'Read Replica', x: 960, y: 320 },
      ],
      edges: [
        { id: 'se1', source: 'sol-client', target: 'sol-dns' },
        { id: 'se2', source: 'sol-dns', target: 'sol-cdn' },
        { id: 'se3', source: 'sol-dns', target: 'sol-lb' },
        { id: 'se4', source: 'sol-cdn', target: 'sol-app' },
        { id: 'se5', source: 'sol-lb', target: 'sol-app' },
        { id: 'se6', source: 'sol-app', target: 'sol-auto' },
        { id: 'se7', source: 'sol-app', target: 'sol-cache' },
        { id: 'se8', source: 'sol-app', target: 'sol-db' },
        { id: 'se9', source: 'sol-app', target: 'sol-queue' },
        { id: 'se10', source: 'sol-queue', target: 'sol-db' },
        { id: 'se11', source: 'sol-db', target: 'sol-replica' },
      ],
      rationale:
        'GeoDNS routes each user to their nearest region and a CDN serves static content at the edge, beating the latency target. Inside a region a load balancer fronts app servers, a cache absorbs reads, and a horizontally scalable NoSQL store with replicas keeps data available even when a whole region drops — the AP lean this workload wants.',
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
