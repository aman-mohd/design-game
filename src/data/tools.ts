import type { Tool } from './types';

// The catalog of placeable technologies. `icon` references a lucide-react name.
export const TOOLS: Tool[] = [
  // ── Client ──
  {
    id: 'client',
    name: 'Client',
    category: 'client',
    icon: 'Smartphone',
    blurb: 'The user’s browser or mobile app that makes requests.',
  },
  // ── Compute ──
  {
    id: 'app_server',
    name: 'App Server',
    category: 'compute',
    icon: 'Server',
    blurb: 'Runs your application logic and handles requests.',
  },
  {
    id: 'worker',
    name: 'Worker',
    category: 'compute',
    icon: 'Cog',
    blurb: 'Processes background jobs asynchronously, off the request path.',
  },
  {
    id: 'autoscaler',
    name: 'Auto-Scaling',
    category: 'compute',
    icon: 'TrendingUp',
    blurb: 'Adds or removes server instances automatically as load changes.',
  },
  // ── Network ──
  {
    id: 'load_balancer',
    name: 'Load Balancer',
    category: 'network',
    icon: 'Network',
    blurb: 'Spreads incoming traffic across many servers.',
  },
  {
    id: 'cdn',
    name: 'CDN',
    category: 'network',
    icon: 'Globe',
    blurb: 'Caches content at edge locations close to users worldwide.',
  },
  {
    id: 'api_gateway',
    name: 'API Gateway',
    category: 'network',
    icon: 'DoorOpen',
    blurb: 'Single entry point: routing, auth, and rate limiting.',
  },
  {
    id: 'dns',
    name: 'DNS / GeoDNS',
    category: 'network',
    icon: 'Compass',
    blurb: 'Resolves names and routes users to the nearest region.',
  },
  // ── Data ──
  {
    id: 'sql_db',
    name: 'SQL Database',
    category: 'data',
    icon: 'Database',
    blurb: 'Relational store with strong consistency and transactions.',
  },
  {
    id: 'nosql_db',
    name: 'NoSQL Database',
    category: 'data',
    icon: 'Boxes',
    blurb: 'Horizontally scalable store for huge, flexible datasets.',
  },
  {
    id: 'cache',
    name: 'Cache',
    category: 'data',
    icon: 'Zap',
    blurb: 'In-memory store (e.g. Redis) for fast, repeated reads.',
  },
  {
    id: 'read_replica',
    name: 'Read Replica',
    category: 'data',
    icon: 'CopyPlus',
    blurb: 'A copy of the database that serves read queries to share load.',
  },
  {
    id: 'object_storage',
    name: 'Object Storage',
    category: 'data',
    icon: 'Image',
    blurb: 'Stores large blobs like images and video (e.g. S3).',
  },
  {
    id: 'search_index',
    name: 'Search Index',
    category: 'data',
    icon: 'Search',
    blurb: 'Full-text search over your data (e.g. Elasticsearch).',
  },
  // ── Messaging ──
  {
    id: 'message_queue',
    name: 'Message Queue',
    category: 'messaging',
    icon: 'ListOrdered',
    blurb: 'Buffers work so spikes don’t overwhelm your system.',
  },
  {
    id: 'pubsub',
    name: 'Pub/Sub',
    category: 'messaging',
    icon: 'Radio',
    blurb: 'Fan-out events to many consumers (e.g. Kafka).',
  },
];

export const TOOL_BY_ID: Record<string, Tool> = Object.fromEntries(
  TOOLS.map((t) => [t.id, t]),
);

export function getTool(id: string): Tool | undefined {
  return TOOL_BY_ID[id];
}
